#!/usr/bin/env python3
"""Fetches UK & Ireland cycling route `ref` geometries from Overpass and writes `data/cycle_refs.bin`."""

import json
import os
import struct
import subprocess
import sys
import time

OVERPASS_ENDPOINTS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
]

# Boxes covering Great Britain and Ireland
BBOXES = [
    ("London & South East", (50.5, -1.5, 52.2, 1.8)),
    ("South West & South Wales", (49.9, -5.8, 52.2, -1.5)),
    ("Midlands, Mid/North Wales & East", (52.2, -5.5, 53.8, 1.8)),
    ("Northern England", (53.8, -3.8, 55.8, -0.5)),
    ("Southern & Central Scotland", (54.6, -7.8, 57.2, -1.5)),
    ("Northern Scotland & Islands", (57.2, -8.0, 60.9, -0.7)),
    ("Ireland & Northern Ireland", (51.3, -10.7, 55.5, -5.3)),
]

NET_PRIORITY = {"icn": 0, "ncn": 1, "rcn": 2, "lcn": 3, "mtb": 4}


def fetch_bbox(name: str, bbox: tuple[float, float, float, float]) -> dict:
    s, w, n, e = bbox
    bstr = f"{s},{w},{n},{e}"
    query = (
        f"[out:json][timeout:60];"
        f"("
        f'relation["route"~"^(bicycle|mtb)$"]["ref"]({bstr});'
        f'relation["route"~"^(bicycle|mtb)$"]["ncn_ref"]({bstr});'
        f'relation["route"~"^(bicycle|mtb)$"]["rcn_ref"]({bstr});'
        f'relation["route"~"^(bicycle|mtb)$"]["lcn_ref"]({bstr});'
        f'way["ncn_ref"]({bstr});'
        f'way["rcn_ref"]({bstr});'
        f'way["lcn_ref"]({bstr});'
        f");"
        f"out geom({bstr});"
    )
    for attempt in range(4):
        url = OVERPASS_ENDPOINTS[attempt % len(OVERPASS_ENDPOINTS)]
        try:
            res = subprocess.run(
                [
                    "curl",
                    "-sS",
                    "--max-time",
                    "75",
                    "-A",
                    "rsrouter-cycle-tiles/1.0",
                    url,
                    "--data-urlencode",
                    f"data={query}",
                ],
                capture_output=True,
                check=True,
            )
            return json.loads(res.stdout.decode("utf-8"))
        except Exception as exc:
            print(f"  [{name}] attempt {attempt + 1} failed ({exc}), retrying...", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch bbox {name}")


def to_ilon_ilat(lon: float, lat: float) -> tuple[int, int]:
    return int(round((lon + 180.0) * 1_000_000)), int(round((lat + 90.0) * 1_000_000))


def seg_midpoint_key(ilon1: int, ilat1: int, ilon2: int, ilat2: int) -> int:
    # Quantize midpoint to 4 microdegrees (~0.4m) to be invariant to rounding
    mx = ((ilon1 + ilon2) // 8) & 0xFFFFFFFF
    my = ((ilat1 + ilat2) // 8) & 0xFFFFFFFF
    return (mx << 32) | my


def main() -> None:
    # Map segment midpoint key -> list of (priority, ref_str)
    seg_refs: dict[int, list[tuple[int, str]]] = {}

    for name, bbox in BBOXES:
        t0 = time.time()
        print(f"Fetching {name} {bbox}...", file=sys.stderr)
        payload = fetch_bbox(name, bbox)
        elements = payload.get("elements", [])
        print(
            f"  Got {len(elements)} elements in {time.time() - t0:.1f}s",
            file=sys.stderr,
        )

        for el in elements:
            tags = el.get("tags", {})
            ref = (
                tags.get("ref")
                or tags.get("ncn_ref")
                or tags.get("rcn_ref")
                or tags.get("lcn_ref")
                or ""
            ).strip()
            if not ref or len(ref) > 16:
                continue

            net = tags.get("network", "").lower()
            if not net:
                if "ncn_ref" in tags:
                    net = "ncn"
                elif "rcn_ref" in tags:
                    net = "rcn"
                elif "lcn_ref" in tags:
                    net = "lcn"
                elif tags.get("route") == "mtb":
                    net = "mtb"
                else:
                    net = "lcn"
            prio = NET_PRIORITY.get(net, 3)

            geoms = []
            if el.get("type") == "way" and "geometry" in el:
                geoms.append(el["geometry"])
            elif el.get("type") == "relation":
                for m in el.get("members", []):
                    if m.get("type") == "way" and "geometry" in m:
                        geoms.append(m["geometry"])

            for geom in geoms:
                if not geom or len(geom) < 2:
                    continue
                prev = None
                for pt in geom:
                    if not pt or "lon" not in pt or "lat" not in pt:
                        prev = None
                        continue
                    cur = to_ilon_ilat(pt["lon"], pt["lat"])
                    if prev is not None and prev != cur:
                        k = seg_midpoint_key(prev[0], prev[1], cur[0], cur[1])
                        lst = seg_refs.get(k)
                        if lst is None:
                            seg_refs[k] = [(prio, ref)]
                        else:
                            if not any(r == ref for _, r in lst):
                                lst.append((prio, ref))
                    prev = cur

    # Build deduplicated string table and segment mapping
    str_to_idx: dict[str, int] = {}
    strings: list[str] = []
    entries: list[tuple[int, int]] = []

    for k, lst in seg_refs.items():
        lst.sort(key=lambda x: (x[0], x[1]))
        seen = []
        for _, r in lst:
            if r not in seen:
                seen.append(r)
            if len(seen) >= 3:
                break
        label = " ".join(seen)
        idx = str_to_idx.get(label)
        if idx is None:
            idx = len(strings)
            strings.append(label)
            str_to_idx[label] = idx
        entries.append((k, idx))

    os.makedirs("data", exist_ok=True)
    out_path = "data/cycle_refs.bin"
    with open(out_path, "wb") as f:
        f.write(b"CREF")
        f.write(struct.pack("<II", len(strings), len(entries)))
        for s in strings:
            b = s.encode("utf-8")
            f.write(struct.pack("<H", len(b)))
            f.write(b)
        for k, idx in entries:
            f.write(struct.pack("<QI", k, idx))

    print(
        f"Wrote {out_path}: {len(strings)} unique labels, {len(entries)} segments ({os.path.getsize(out_path) / (1024*1024):.2f} MiB)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()

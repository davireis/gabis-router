import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './style.css';

// Ignore benign fetch abort cancellations from rapid style changes or aborted requests
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const isAbort =
    (reason instanceof DOMException && (reason.name === 'AbortError' || /signal is aborted/i.test(reason.message))) ||
    (reason instanceof Error && (reason.name === 'AbortError' || /signal is aborted/i.test(reason.message))) ||
    (typeof reason === 'string' && /signal is aborted/i.test(reason));
  if (isAbort) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const msg = event.message || (event.error && event.error.message) || '';
  if (/signal is aborted/i.test(msg) || (event.error instanceof DOMException && event.error.name === 'AbortError')) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}

// Service worker registration (production web PWA only; native Capacitor packages assets locally)
if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) r.unregister();
    });
  }
}


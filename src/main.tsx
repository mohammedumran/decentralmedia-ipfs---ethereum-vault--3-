import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Aggressively clean up any stale service workers and browser caches
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister().catch(() => {});
    }
  }).catch(() => {});

  if (typeof caches !== 'undefined') {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).catch(() => {});
      }
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

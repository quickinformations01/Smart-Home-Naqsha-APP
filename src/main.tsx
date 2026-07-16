import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('PWA ServiceWorker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register or log registration
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Dev ServiceWorker registered:', reg.scope))
      .catch((err) => console.log('Dev ServiceWorker failed:', err));
  });
}

import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

// Handle and suppress benign Vite development environment HMR websocket rejections/failures.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes('WebSocket') ||
       event.reason.message?.includes('HMR') ||
       event.reason.message?.includes('failed to connect to websocket'))
    ) {
      event.preventDefault();
      console.warn('[Benign Sandbox Error Ignored]: HMR WebSocket has been suppressed as HMR is disabled by the platform.');
    }
  });

  // Handle standard connection issues gracefully
  window.addEventListener('error', (event) => {
    if (event.message?.includes('WebSocket') || event.message?.includes('hmr')) {
      event.preventDefault();
    }
  }, true);
}

// Register PWA Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any legacy dev service workers to clear stale caches of source files
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Stale dev Service Worker unregistered successfully.');
          }
        });
      }
    });
    // Dynamically delete active Service Worker Cache Storage on development to clear stale Vite cache
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).then(() => {
            console.log(`Cache "${key}" deleted dynamically to prevent stale Vue asset compilation.`);
          });
        });
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

createApp(App).mount('#root');


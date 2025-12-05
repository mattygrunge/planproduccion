import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Registro del Service Worker para PWA
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado correctamente:', registration.scope);
          
          // Verificar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nuevo contenido disponible
                  console.log('[PWA] Nueva versión disponible');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error);
        });
    });
  }
};

// Solo registrar SW en producción o si se fuerza
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true') {
  registerServiceWorker();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

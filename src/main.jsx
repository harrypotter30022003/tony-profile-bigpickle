import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
    <Analytics />
  </ErrorBoundary>
)

// Register Service Worker for PWA Offline Caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[PWA] Service Worker Registered Successfully!', reg.scope))
      .catch((err) => console.error('[PWA] Service Worker Registration Failed:', err));
  });
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Make sure index.html has <div id="root">');
}

// Prevent the browser from restoring a stale scroll position on a fresh page load.
// This is especially important after a Vercel deploy or hard refresh, where the
// browser may otherwise reopen the page halfway down the dashboard.
try {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
} catch {
  // Some embedded/restricted environments do not expose scroll APIs.
}

const appRoot = createRoot(root);

appRoot.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Remove the zero-JavaScript boot screen after React has mounted. It also acts
// as a graceful visual fallback if a network request delays the JS bundle.
requestAnimationFrame(() => {
  document.getElementById('boot-screen')?.remove();
});

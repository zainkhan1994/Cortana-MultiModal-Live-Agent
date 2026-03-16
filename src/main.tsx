import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'color:#d8f4ff;padding:32px;font-family:sans-serif;background:#040713;height:100vh;display:flex;align-items:center;justify-content:center';
  const msg = document.createElement('p');
  msg.textContent = 'Fatal: #root element not found. The page HTML may be corrupted.';
  wrapper.appendChild(msg);
  document.body.appendChild(wrapper);
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

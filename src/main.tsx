import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const showBootError = (msg: string, hint?: string) => {
  const existing = document.getElementById('boot-error-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.id = 'boot-error-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#040713;color:#ff6b7a;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'font-family:monospace;padding:32px;text-align:center;gap:16px;';
  const title = document.createElement('h2');
  title.style.cssText = 'margin:0;font-size:20px;letter-spacing:.05em;';
  title.textContent = '⚠ Initialization Error';
  const body = document.createElement('p');
  body.style.cssText = 'margin:0;opacity:.8;max-width:520px;line-height:1.5;font-size:14px;';
  body.textContent = msg;
  overlay.appendChild(title);
  overlay.appendChild(body);
  if (hint) {
    const hintEl = document.createElement('p');
    hintEl.style.cssText = 'margin:0;opacity:.5;font-size:12px;';
    hintEl.textContent = hint;
    overlay.appendChild(hintEl);
  }
  document.body.appendChild(overlay);
};

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  showBootError(msg);
});

window.addEventListener('error', (e) => {
  showBootError(e.message || String(e));
});

const container = document.getElementById('root');

if (!container) {
  showBootError('Root #root element not found in index.html.');
} else {
  try {
    createRoot(container).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (err) {
    showBootError(String(err));
  }
}

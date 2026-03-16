import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('App render error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#040713',
            color: '#ffd3d8',
            fontFamily: 'system-ui, sans-serif',
            gap: '12px',
          }}
        >
          <strong style={{ fontSize: '16px' }}>Cortana failed to start</strong>
          <span style={{ fontSize: '13px', color: '#95a7c8' }}>
            {this.state.message || 'Check the browser console for details.'}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

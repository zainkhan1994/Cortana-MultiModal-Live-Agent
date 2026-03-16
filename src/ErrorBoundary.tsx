import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Cortana] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
            background: 'linear-gradient(180deg, #08152a, #040713)',
            color: '#d8f4ff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              border: '1px solid rgba(255, 77, 95, 0.45)',
              borderRadius: '16px',
              padding: '28px 32px',
              background: 'rgba(48, 12, 20, 0.7)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h1
              style={{
                margin: '0 0 8px',
                fontSize: '22px',
                fontWeight: 600,
                color: '#ff6b78',
                letterSpacing: '0.04em',
              }}
            >
              CORTANA — Startup Error
            </h1>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '14px',
                color: '#ffc8cc',
                lineHeight: 1.6,
              }}
            >
              The app encountered an unexpected error during initialization and
              could not start.
            </p>
            {this.state.error && (
              <pre
                style={{
                  margin: '0 0 20px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  fontSize: '12px',
                  color: '#f9a8b0',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#a8c7ef',
                lineHeight: 1.55,
              }}
            >
              If you are the site owner, ensure{' '}
              <code
                style={{
                  background: 'rgba(53, 210, 255, 0.12)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  color: '#7de8ff',
                }}
              >
                VITE_GEMINI_API_KEY
              </code>{' '}
              is set as a GitHub Actions secret and re-deploy. See the README
              for setup instructions.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

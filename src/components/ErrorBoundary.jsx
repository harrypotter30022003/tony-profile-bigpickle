// ErrorBoundary — Catches React rendering errors and shows a graceful fallback
// instead of a blank white page. Includes reload + home links.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging; could be sent to analytics
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
    this.setState({ errorInfo });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: String(error?.message || error).slice(0, 150),
        fatal: true,
      });
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleHome = () => {
    if (typeof window !== 'undefined') window.location.hash = '';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{ fontSize: '4rem', marginBottom: '1rem' }}
        >
          ⚠️
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p
          style={{
            color: 'var(--text-muted, #888)',
            maxWidth: '480px',
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred while rendering this page. The team has been
          notified. You can try reloading or head back to the homepage.
        </p>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details
            style={{
              background: 'rgba(255, 0, 110, 0.08)',
              border: '1px solid rgba(255, 0, 110, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              maxWidth: '640px',
              width: '100%',
              marginBottom: '1.5rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: '#ff006e',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              Error details (dev mode only)
            </summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: '0.5rem 0 0',
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleReload}
            className="btn btn-primary"
            style={{ padding: '0.7rem 1.4rem' }}
          >
            Reload Page
          </button>
          <button
            onClick={this.handleHome}
            className="btn btn-secondary"
            style={{ padding: '0.7rem 1.4rem' }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }
}

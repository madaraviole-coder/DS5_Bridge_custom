import React, {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  useState
} from 'react';
import {
  IconAlertTriangle,
  IconRefresh as IconRefreshCcw
} from '@tabler/icons-react';

export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  tabName?: string;
  onNavigateHome?: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ComponentType<FallbackProps>;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<unknown>;
  tabName?: string;
  onNavigateHome?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught unhandled component exception:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasChanged = resetKeys.some((key, idx) => !Object.is(key, prevProps.resetKeys?.[idx]));
      if (hasChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  public resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.state = {
      hasError: false,
      error: null
    };
    this.setState({
      hasError: false,
      error: null
    });
  };

  public override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallbackComponent: FallbackComponent, fallback, tabName, onNavigateHome } = this.props;

    if (hasError && error) {
      const fallbackProps: FallbackProps = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
        tabName,
        onNavigateHome
      };

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      if (typeof fallback === 'function') {
        return fallback(fallbackProps);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary-fallback" role="alert">
          <h2>An unexpected error occurred.</h2>
          <pre>{error.message}</pre>
          <button type="button" onClick={this.resetErrorBoundary}>
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}

export function RootErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [copied, setCopied] = useState(false);

  const copyDiagnostics = () => {
    const diagnosticReport = [
      `DS5 Bridge Fatal Render Error Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `Name: ${error.name}`,
      `Message: ${error.message}`,
      `User Agent: ${navigator.userAgent}`,
      `Stack:\n${error.stack || 'No stack trace available'}`
    ].join('\n');

    navigator.clipboard?.writeText(diagnosticReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div
      className="root-error-fallback"
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#050913',
        color: '#ffffff',
        padding: '24px',
        fontFamily: 'Inter Variable, Inter, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#0c1626',
          border: '1px solid rgba(255, 71, 87, 0.4)',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <IconAlertTriangle size={28} color="#ff4757" />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>DS5 Bridge Companion Error</h1>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
          The application encountered a fatal error during rendering.
        </p>
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ff6b81',
            marginBottom: '20px',
            overflowX: 'auto',
            wordBreak: 'break-word'
          }}
        >
          {error.message || 'Unknown error occurred'}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            type="button"
            className="primary-action"
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#046fff',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={resetErrorBoundary}
          >
            <IconRefreshCcw size={14} /> Try Again
          </button>
          <button
            type="button"
            className="secondary-action"
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
          <button
            type="button"
            className="secondary-action"
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={copyDiagnostics}
          >
            {copied ? 'Copied Details' : 'Copy Diagnostic Details'}
          </button>
        </div>
        {error.stack && (
          <details style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Stack Trace</summary>
            <pre
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '10px',
                borderRadius: '6px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function TabErrorFallback({
  error,
  resetErrorBoundary,
  tabName,
  onNavigateHome
}: FallbackProps) {
  return (
    <div className="control-page active tab-error-fallback" role="alert">
      <div className="feature-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconAlertTriangle size={24} color="#ff4757" />
          <div>
            <h2>Unable to display {tabName ? `${tabName} ` : 'this '}view</h2>
            <p>An unexpected error occurred in this view. Your controller connection remains active.</p>
          </div>
        </div>
      </div>

      <div className="feature-card-grid">
        <section className="feature-card">
          <div className="feature-card-header">
            <h3>Error Summary</h3>
          </div>
          <div style={{ padding: '8px 0 16px 0' }}>
            <code
              style={{
                display: 'block',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 71, 87, 0.1)',
                color: '#ff6b81',
                fontSize: '12px',
                wordBreak: 'break-word'
              }}
            >
              {error.message || 'Unknown view error'}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="primary-action"
              onClick={resetErrorBoundary}
            >
              <IconRefreshCcw size={14} /> Try Again
            </button>
            {onNavigateHome && (
              <button
                type="button"
                className="secondary-action"
                onClick={onNavigateHome}
              >
                Switch to Overview
              </button>
            )}
          </div>
        </section>

        <section className="feature-card">
          <div className="feature-card-header">
            <h3>Hardware &amp; Bridge Status</h3>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
            Device telemetry and bridge communication are unaffected by this view error.
          </p>
          {error.stack && (
            <details style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '6px' }}>Diagnostic Details</summary>
              <pre
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '8px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}

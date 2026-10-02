import React, { Component } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ErrorBoundary,
  RootErrorFallback,
  TabErrorFallback,
  type FallbackProps
} from './ErrorBoundary';

function GoodComponent() {
  return <div className="good-content">Operational</div>;
}

function CrashingComponent(): React.JSX.Element {
  throw new Error('Test exploded');
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    const markup = renderToStaticMarkup(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );

    expect(markup).toContain('Operational');
    expect(markup).not.toContain('An unexpected error occurred');
  });

  it('renders default fallback when child throws and no custom fallback is provided', () => {
    // Suppress console.error during expected throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    class Thrower extends Component {
      override render(): React.ReactNode {
        throw new Error('Explosion in child component');
      }
    }

    const boundary = new ErrorBoundary({ children: <Thrower /> });
    const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('Explosion in child component'));
    boundary.state = derivedState;

    const rendered = boundary.render();
    const markup = renderToStaticMarkup(rendered as React.ReactElement);

    expect(markup).toContain('An unexpected error occurred.');
    expect(markup).toContain('Explosion in child component');
    consoleSpy.mockRestore();
  });

  it('renders custom fallbackComponent when provided', () => {
    function CustomFallback({ error, resetErrorBoundary }: FallbackProps) {
      return (
        <div className="custom-fallback">
          <span>Failed: {error.message}</span>
          <button type="button" onClick={resetErrorBoundary}>
            Retry Custom
          </button>
        </div>
      );
    }

    const boundary = new ErrorBoundary({
      fallbackComponent: CustomFallback,
      children: null
    });
    boundary.state = {
      hasError: true,
      error: new Error('Simulated failure')
    };

    const rendered = boundary.render();
    const markup = renderToStaticMarkup(rendered as React.ReactElement);

    expect(markup).toContain('Failed: Simulated failure');
    expect(markup).toContain('Retry Custom');
  });

  it('renders RootErrorFallback with resilient layout, diagnostics, and reload action', () => {
    const error = new Error('Fatal bridge initialization error');
    error.stack = 'Error: Fatal bridge initialization error\n    at init (main.js:10:5)';

    const markup = renderToStaticMarkup(
      <RootErrorFallback error={error} resetErrorBoundary={() => {}} />
    );

    expect(markup).toContain('DS5 Bridge Companion Error');
    expect(markup).toContain('The application encountered a fatal error during rendering.');
    expect(markup).toContain('Fatal bridge initialization error');
    expect(markup).toContain('Try Again');
    expect(markup).toContain('Reload Application');
    expect(markup).toContain('Copy Diagnostic Details');
    expect(markup).toContain('Stack Trace');
  });

  it('renders TabErrorFallback with paired card geometry and hardware isolation message', () => {
    const error = new Error('Curve calculation error');
    const markup = renderToStaticMarkup(
      <TabErrorFallback
        error={error}
        resetErrorBoundary={() => {}}
        tabName="Triggers"
        onNavigateHome={() => {}}
      />
    );

    expect(markup).toContain('Unable to display Triggers view');
    expect(markup).toContain('Your controller connection remains active.');
    expect(markup).toContain('Error Summary');
    expect(markup).toContain('Curve calculation error');
    expect(markup).toContain('Try Again');
    expect(markup).toContain('Switch to Overview');
    expect(markup).toContain('Hardware &amp; Bridge Status');
    expect(markup).toContain('Device telemetry and bridge communication are unaffected by this view error.');
  });

  it('resets error state when resetKeys change', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();
    const boundary = new ErrorBoundary({
      children: null,
      resetKeys: ['overview'],
      onReset
    });

    boundary.state = {
      hasError: true,
      error: new Error('Tab error')
    };

    boundary.componentDidUpdate({
      children: null,
      resetKeys: ['triggers']
    });

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    consoleSpy.mockRestore();
  });
});

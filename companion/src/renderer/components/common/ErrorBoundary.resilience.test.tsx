import React, { Component, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ErrorBoundary,
  RootErrorFallback,
  TabErrorFallback,
  type FallbackProps
} from './ErrorBoundary';

describe('ErrorBoundary Empirical Resilience & Stress Suite', () => {
  describe('Child Error Handling & Fallback Rendering', () => {
    it('catches standard Error and renders default fallback with message and retry button', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const boundary = new ErrorBoundary({
        children: <div>Safe Content</div>
      });

      const err = new Error('Hardware connection timed out (VID: 0x054C)');
      boundary.state = ErrorBoundary.getDerivedStateFromError(err);

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('role="alert"');
      expect(html).toContain('An unexpected error occurred.');
      expect(html).toContain('Hardware connection timed out (VID: 0x054C)');
      expect(html).toContain('<button type="button">Try again</button>');
      consoleSpy.mockRestore();
    });

    it('catches custom Error subclasses with custom properties', () => {
      class BridgeIpcError extends Error {
        constructor(message: string, public readonly code: number) {
          super(message);
          this.name = 'BridgeIpcError';
        }
      }

      const err = new BridgeIpcError('IPC Pipe Broken', 0x501);
      const derived = ErrorBoundary.getDerivedStateFromError(err);
      expect(derived.hasError).toBe(true);
      expect(derived.error).toBe(err);
      expect((derived.error as BridgeIpcError).code).toBe(0x501);
    });

    it('catches error with empty message without crashing fallback', () => {
      const boundary = new ErrorBoundary({ children: null });
      const err = new Error('');
      boundary.state = ErrorBoundary.getDerivedStateFromError(err);

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('An unexpected error occurred.');
      expect(html).toContain('<pre></pre>');
    });

    it('handles massive stack trace without clipping or throwing', () => {
      const hugeStack = Array.from({ length: 500 }, (_, i) => `    at Frame${i} (file.js:${i}:1)`).join('\n');
      const err = new Error('Deep recursion error');
      err.stack = hugeStack;

      const boundary = new ErrorBoundary({
        fallbackComponent: RootErrorFallback,
        children: null
      });
      boundary.state = ErrorBoundary.getDerivedStateFromError(err);

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('Deep recursion error');
      expect(html).toContain('Frame499');
    });

    it('evaluates behavior when child throws a raw string instead of Error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const rawStringError = 'Uncaught string exception in renderer';
      // In JS/React, getDerivedStateFromError can be invoked with any thrown value
      const derived = ErrorBoundary.getDerivedStateFromError(rawStringError as any);
      expect(derived.hasError).toBe(true);
      expect(derived.error).toBe(rawStringError);

      const boundary = new ErrorBoundary({ children: null });
      boundary.state = derived;

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('An unexpected error occurred.');
      consoleSpy.mockRestore();
    });

    it('reveals flaw: when child throws null, render() falls through to children instead of fallback', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // When a child component throws null:
      const derivedNull = ErrorBoundary.getDerivedStateFromError(null as any);
      expect(derivedNull.hasError).toBe(true);
      expect(derivedNull.error).toBeNull();

      const boundary = new ErrorBoundary({
        children: <div className="child-content">Child Was Re-rendered Unsafely</div>
      });
      boundary.state = derivedNull;

      // Because line 81 checks `if (hasError && error)`:
      // When error is null, it fails the guard and returns children!
      const rendered = boundary.render();
      const html = renderToStaticMarkup(rendered as React.ReactElement);
      expect(html).toContain('Child Was Re-rendered Unsafely');
      expect(html).not.toContain('An unexpected error occurred');
      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Components: RootErrorFallback & TabErrorFallback', () => {
    it('RootErrorFallback renders diagnostic report, retry, reload, and copy actions', () => {
      const err = new Error('Fatal Native Bridge Crash');
      err.stack = 'Error: Fatal Native Bridge Crash\n    at init (bridge.ts:42:10)';

      const resetSpy = vi.fn();
      const html = renderToStaticMarkup(
        <RootErrorFallback error={err} resetErrorBoundary={resetSpy} />
      );

      expect(html).toContain('DS5 Bridge Companion Error');
      expect(html).toContain('The application encountered a fatal error during rendering.');
      expect(html).toContain('Fatal Native Bridge Crash');
      expect(html).toContain('Try Again');
      expect(html).toContain('Reload Application');
      expect(html).toContain('Copy Diagnostic Details');
      expect(html).toContain('Stack Trace');
    });

    it('RootErrorFallback copyDiagnostics handles missing clipboard gracefully', () => {
      const err = new Error('Test clipboard fallback');
      const resetSpy = vi.fn();

      const originalClipboard = navigator.clipboard;
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          configurable: true,
          writable: true
        });

        const element = <RootErrorFallback error={err} resetErrorBoundary={resetSpy} />;
        expect(() => renderToStaticMarkup(element)).not.toThrow();
      } finally {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true,
          writable: true
        });
      }
    });

    it('TabErrorFallback renders formatted tab name and hardware isolation message', () => {
      const err = new Error('Triggers SVG curve render error');
      const resetSpy = vi.fn();
      const homeSpy = vi.fn();

      const html = renderToStaticMarkup(
        <TabErrorFallback
          error={err}
          resetErrorBoundary={resetSpy}
          tabName="Adaptive Triggers"
          onNavigateHome={homeSpy}
        />
      );

      expect(html).toContain('Unable to display Adaptive Triggers view');
      expect(html).toContain('Your controller connection remains active.');
      expect(html).toContain('Triggers SVG curve render error');
      expect(html).toContain('Try Again');
      expect(html).toContain('Switch to Overview');
      expect(html).toContain('Hardware &amp; Bridge Status');
    });

    it('TabErrorFallback renders without tabName and without onNavigateHome', () => {
      const err = new Error('Anonymous subview crashed');
      const resetSpy = vi.fn();

      const html = renderToStaticMarkup(
        <TabErrorFallback
          error={err}
          resetErrorBoundary={resetSpy}
        />
      );

      expect(html).toContain('Unable to display this view');
      expect(html).not.toContain('Switch to Overview');
    });
  });

  describe('Recovery, Retry & resetKeys Lifecycle', () => {
    it('resetErrorBoundary resets state and invokes onReset callback', () => {
      const onReset = vi.fn();
      const boundary = new ErrorBoundary({
        children: <div className="safe">Safe</div>,
        onReset
      });

      boundary.state = {
        hasError: true,
        error: new Error('Initial crash')
      };

      // Suppress unmounted setState warning in unit test
      const consoleWarnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      boundary.resetErrorBoundary();
      consoleWarnSpy.mockRestore();

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('Safe');
    });

    it('resets error state when resetKeys change', () => {
      const onReset = vi.fn();
      const boundary = new ErrorBoundary({
        children: <div>View</div>,
        resetKeys: ['tab-audio'],
        onReset
      });

      boundary.state = {
        hasError: true,
        error: new Error('Audio rendering failure')
      };

      const consoleWarnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      boundary.componentDidUpdate({
        children: <div>View</div>,
        resetKeys: ['tab-haptics']
      });
      consoleWarnSpy.mockRestore();

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();
    });

    it('does NOT reset error state when resetKeys are identical', () => {
      const onReset = vi.fn();
      const boundary = new ErrorBoundary({
        children: <div>View</div>,
        resetKeys: ['tab-audio', 1],
        onReset
      });

      boundary.state = {
        hasError: true,
        error: new Error('Audio failure')
      };

      boundary.componentDidUpdate({
        children: <div>View</div>,
        resetKeys: ['tab-audio', 1]
      });

      expect(onReset).not.toHaveBeenCalled();
      expect(boundary.state.hasError).toBe(true);
    });

    it('resets when resetKeys array expands in length', () => {
      const onReset = vi.fn();
      const boundary = new ErrorBoundary({
        children: <div>View</div>,
        resetKeys: ['tab-overview', 'sub-1'],
        onReset
      });

      boundary.state = {
        hasError: true,
        error: new Error('Overview failure')
      };

      const consoleWarnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      boundary.componentDidUpdate({
        children: <div>View</div>,
        resetKeys: ['tab-overview']
      });
      consoleWarnSpy.mockRestore();

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(boundary.state.hasError).toBe(false);
    });

    it('componentDidCatch invokes onError prop with error and errorInfo', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onError = vi.fn();
      const boundary = new ErrorBoundary({
        children: null,
        onError
      });

      const err = new Error('Caught exception');
      const info = { componentStack: '\n    at BrokenChild\n    at ErrorBoundary' };

      boundary.componentDidCatch(err, info);

      expect(consoleSpy).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(err, info);
      consoleSpy.mockRestore();
    });

    it('componentDidCatch operates safely when onError is undefined', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const boundary = new ErrorBoundary({ children: null });

      expect(() => {
        boundary.componentDidCatch(new Error('Silent error'), { componentStack: '' });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('supports functional fallback prop with FallbackProps', () => {
      const fallbackRender = vi.fn(({ error, resetErrorBoundary, tabName }: FallbackProps) => (
        <div className="custom-fn-fallback">
          <span>{tabName}: {error.message}</span>
          <button type="button" onClick={resetErrorBoundary}>Try Again FN</button>
        </div>
      ));

      const boundary = new ErrorBoundary({
        children: null,
        tabName: 'Deadzones',
        fallback: fallbackRender
      });

      boundary.state = {
        hasError: true,
        error: new Error('Radial calculation failed')
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(fallbackRender).toHaveBeenCalledTimes(1);
      expect(html).toContain('Deadzones: Radial calculation failed');
      expect(html).toContain('Try Again FN');
    });

    it('supports static ReactNode fallback prop', () => {
      const boundary = new ErrorBoundary({
        children: null,
        fallback: <div className="static-fallback">Static Fallback Message</div>
      });

      boundary.state = {
        hasError: true,
        error: new Error('Any error')
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('Static Fallback Message');
    });
  });
});

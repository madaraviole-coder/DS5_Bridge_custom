import React, { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MockBridgeApi } from './mock-bridge';

export class MockLocalStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

export interface MockEnvironment {
  bridge: MockBridgeApi;
  storage: MockLocalStorage;
  cleanup: () => void;
}

let originalWindowBridge: any;
let originalWindowStorage: any;
let originalMatchMedia: any;

export function installMockEnvironment(initialSnapshot?: any): MockEnvironment {
  const bridge = new MockBridgeApi(initialSnapshot);
  const storage = new MockLocalStorage();

  if (typeof window !== 'undefined') {
    originalWindowBridge = (window as any).bridge;
    originalWindowStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    (window as any).bridge = bridge;
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true
    });

    if (!window.matchMedia) {
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      });
    }
  } else {
    // Node environment fallback
    (global as any).window = {
      bridge,
      localStorage: storage,
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({ matches: false })
    };
  }

  return {
    bridge,
    storage,
    cleanup: () => {
      if (typeof window !== 'undefined') {
        (window as any).bridge = originalWindowBridge;
        if (originalWindowStorage) {
          Object.defineProperty(window, 'localStorage', {
            value: originalWindowStorage,
            configurable: true,
            writable: true
          });
        }
        if (originalMatchMedia) {
          window.matchMedia = originalMatchMedia;
        }
      }
    }
  };
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
  fallbackComponent?: ComponentType<ErrorBoundaryFallbackProps>;
  onReset?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reference contract implementation of ErrorBoundary matching PROJECT.md § Interface Contracts.
 * Used for contract verification and fallback testing across all milestones.
 */
export class ContractErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    const normalized = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
    return { hasError: true, error: normalized };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log error details without crashing
  }

  reset = (): void => {
    this.props.onReset?.();
    this.state = { hasError: false, error: null };
    const updater = (this as any).updater;
    if (updater?.isMounted?.(this)) {
      this.setState({ hasError: false, error: null });
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallbackComponent) {
        const Fallback = this.props.fallbackComponent;
        return <Fallback error={this.state.error} resetErrorBoundary={this.reset} />;
      }
      return (
        <div role="alert" className="error-boundary-fallback" style={{ padding: '16px', border: '1px solid red' }}>
          <h3>Something went wrong</h3>
          <p className="error-message">{this.state.error.message}</p>
          <button type="button" onClick={this.reset} aria-label="Retry">
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  id?: string;
  className?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Reference contract implementation of CustomSelect matching PROJECT.md § Interface Contracts.
 */
export function ContractCustomSelect(props: CustomSelectProps): React.ReactElement {
  const selected = props.options.find((o) => o.value === props.value);
  return (
    <div className={`custom-select-container ${props.className ?? ''}`} id={props.id}>
      <button
        type="button"
        className="custom-select-button"
        role="combobox"
        aria-expanded="false"
        aria-label={props.ariaLabel ?? 'Select option'}
        disabled={props.disabled}
      >
        <span>{selected?.label ?? props.value}</span>
      </button>
      <div role="listbox" className="custom-select-dropdown" style={{ display: 'none' }}>
        {props.options.map((opt) => (
          <div
            key={opt.value}
            role="option"
            aria-selected={opt.value === props.value}
            className={`custom-select-option ${opt.value === props.value ? 'selected' : ''}`}
            onClick={() => !opt.disabled && props.onChange(opt.value)}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderComponent(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

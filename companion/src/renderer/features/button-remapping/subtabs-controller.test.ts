// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useButtonRemappingSubTabs } from './use-button-remapping-subtabs';
import { DEFAULT_TOUCHPAD_SETTINGS } from '../../../shared/touchpad-gestures';
import { DEFAULT_TURBO_SETTINGS } from '../../../shared/types';

let root: Root | null = null;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  root = null;
});

function renderHook<T>(hookFn: () => T) {
  const result = { current: undefined as unknown as T };
  function Probe() {
    result.current = hookFn();
    return null;
  }
  const host = document.createElement('div');
  root = createRoot(host);
  act(() => {
    root!.render(createElement(Probe));
  });
  return { result };
}

describe('useButtonRemappingSubTabs', () => {
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {
      snapshot: {
        settings: {
          touchpadSettings: { ...DEFAULT_TOUCHPAD_SETTINGS },
          turboSettings: { ...DEFAULT_TURBO_SETTINGS }
        }
      },
      runAction: vi.fn()
    };
  });

  it('initializes with buttons subtab and switches tabs', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    expect(result.current.remappingSubTab).toBe('buttons');

    act(() => {
      result.current.setRemappingSubTab('turbo');
    });
    expect(result.current.remappingSubTab).toBe('turbo');

    act(() => {
      result.current.setRemappingSubTab('touchpad');
    });
    expect(result.current.remappingSubTab).toBe('touchpad');
  });

  it('provides default settings for touchpad and turbo', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    expect(result.current.touchpadProps.touchpadSettings.mode).toBe(DEFAULT_TOUCHPAD_SETTINGS.mode);
    expect(result.current.turboProps.turboSettings.speedCps).toBe(DEFAULT_TURBO_SETTINGS.speedCps);
    expect(result.current.turboProps.turboSettings.enabled).toBe(false);
  });

  it('updates turbo settings and triggers bridge action', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    act(() => {
      result.current.turboProps.handleSetTurboInterval(100);
    });
    expect(mockRuntime.runAction).toHaveBeenCalledWith('turbo-config', expect.any(Function));
  });

  it('updates touchpad settings and triggers bridge action', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    act(() => {
      result.current.touchpadProps.handleSetTouchpadZoneMapping(1, 'cross');
    });
    expect(mockRuntime.runAction).toHaveBeenCalledWith('touchpad-config', expect.any(Function));
  });
});

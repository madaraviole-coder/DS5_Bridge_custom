// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ShortcutSettings } from './ControllerBridgeSettings';
import type { SettingsPageActions, SettingsPageModel } from './types';

let root: Root | null = null;
let host: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  host?.remove();
});

function createModel(overrides: Partial<SettingsPageModel> = {}): SettingsPageModel {
  return {
    settings: {
      uiScalePercent: 100,
      uiTextScalePercent: 100,
      uiThemePreset: 'dark',
      launchAtStartupEnabled: false,
      showBatteryPercentTrayIcon: true,
      closeButtonQuits: false,
      ledEnabled: true,
      playerLedEnabled: true,
      idleDisconnectEnabled: true,
      idleDisconnectTimeoutMinutes: 15,
      usbSuspendDisconnectEnabled: true,
      wakeOnConnectEnabled: true,
      controllerPowerSavingEnabled: false,
      edgeProfileSwitchingBlocked: false,
      sleepKeybindEnabled: false,
      speakerVolumeShortcutEnabled: false,
      lightbarRestoreEnabled: true,
      notifyControllerConnection: true,
      notifyLowBattery: false,
      notifyPersonaChange: true,
      notifyMicMute: false,
      kitsuneBarSettings: {
        enabled: true,
        toggleShortcut: 'ps-button',
        debounceMs: 350,
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }
    },
    connected: true,
    busy: false,
    pendingAction: null,
    support: { usbSuspendDisconnect: true, wakeOnConnect: true, sleepController: true },
    focusTarget: null,
    picoFirmware: { message: null, error: null },
    wakeOnLan: { connectionKey: 'connected', controllerConnected: false, firmwareUpdateRequired: false },
    appVersion: '2.0.1',
    bridgeHealth: { firmwareVersion: '2.0.0', resetEvidence: null },
    ...overrides
  };
}

function createActions(): SettingsPageActions {
  return {
    setTheme: vi.fn(),
    setUiScale: vi.fn(),
    setTextScale: vi.fn(),
    setLocale: vi.fn(),
    toggleLaunchAtStartup: vi.fn(),
    toggleBatteryTrayIcon: vi.fn(),
    toggleCloseButtonQuits: vi.fn(),
    toggleControllerNotifications: vi.fn(),
    toggleLowBatteryNotifications: vi.fn(),
    togglePersonaNotifications: vi.fn(),
    toggleMicMuteNotifications: vi.fn(),
    setIdleDisconnectTimeout: vi.fn(),
    toggleIdleDisconnect: vi.fn(),
    toggleUsbSuspendDisconnect: vi.fn(),
    toggleControllerPowerSaving: vi.fn(),
    toggleLed: vi.fn(),
    togglePlayerLed: vi.fn(),
    toggleLightbarRestore: vi.fn(),
    toggleEdgeProfileSwitching: vi.fn(),
    toggleSleepShortcut: vi.fn(),
    toggleVolumeShortcut: vi.fn(),
    toggleWakeOnConnect: vi.fn(),
    mountPicoBootloader: vi.fn(),
    flashPicoFirmware: vi.fn(),
    nukePicoFlash: vi.fn(),
    openExternal: vi.fn(),
    wakeOnLan: {} as never,
    toggleKitsuneBarEnabled: vi.fn(),
    setKitsuneBarDebounceMs: vi.fn()
  };
}

function render(model: SettingsPageModel, actions: SettingsPageActions) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(
    <ShortcutSettings model={model} actions={actions} active={true} matchingSettingIds={null} />
  ));
}

describe('ShortcutSettings Kitsune-Bar and Debounce', () => {
  it('renders Kitsune Bar Overlay toggle and handles click', () => {
    const model = createModel();
    const actions = createActions();
    render(model, actions);

    const kitsuneToggle = host.querySelector('button[aria-labelledby="settings-kitsune-bar-overlay-label"]')
      || Array.from(host.querySelectorAll('.settings-menu-row')).find((el) => el.textContent?.includes('Kitsune Bar Overlay'))?.querySelector('button[role="switch"]');

    expect(kitsuneToggle).not.toBeNull();
    expect(kitsuneToggle?.getAttribute('aria-checked')).toBe('true');

    act(() => {
      (kitsuneToggle as HTMLButtonElement).click();
    });
    expect(actions.toggleKitsuneBarEnabled).toHaveBeenCalledOnce();
  });

  it('renders PS Button Debounce controls and triggers setKitsuneBarDebounceMs', () => {
    const model = createModel();
    const actions = createActions();
    render(model, actions);

    const debounceRow = Array.from(host.querySelectorAll('.settings-menu-row')).find((el) =>
      el.textContent?.includes('PS Button Debounce')
    );
    expect(debounceRow).toBeDefined();

    // Find preset chip buttons or slider
    const presetBtn = debounceRow?.querySelector('.kitsune-preset-chip') as HTMLButtonElement | null;
    if (presetBtn) {
      act(() => {
        presetBtn.click();
      });
      expect(actions.setKitsuneBarDebounceMs).toHaveBeenCalled();
    }

    const slider = debounceRow?.querySelector('input[type="range"]') as HTMLInputElement | null;
    expect(slider).not.toBeNull();
    act(() => {
      slider!.value = '450';
      slider!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(actions.setKitsuneBarDebounceMs).toHaveBeenCalled();
  });
});

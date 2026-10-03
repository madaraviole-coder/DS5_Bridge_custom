import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KitsuneBarPage } from './pages/KitsuneBarPage';
import { KitsuneBarOverlay } from './components/layout/KitsuneBarOverlay';
import type { BridgeSnapshot } from '../shared/types';

function createMockSnapshot(overrides: Partial<BridgeSnapshot> = {}): BridgeSnapshot {
  return {
    state: 'connected',
    message: 'All systems normal',
    status: {
      controllerConnected: true,
      controllerType: 'dualsense-edge',
      batteryPercent: 85,
      rawPowerState: 0,
      audioRecent: false,
      hapticsReady: true,
      hapticsGainPercent: 100,
      speakerVolumePercent: 100
    },
    settings: {
      selectedPresetId: 'balanced',
      uiScalePercent: 100,
      uiThemePreset: 'dark',
      launchAtStartupEnabled: false,
      showBatteryPercentTrayIcon: false,
      kitsuneInputPromotionDismissed: false,
      firmwareLogDirectory: null,
      leftStickRadialDeadzonePercent: 0,
      rightStickRadialDeadzonePercent: 0,
      hapticsEnabled: true,
      hapticsGainPercent: 100,
      feedbackBoostEnabled: false,
      hapticsBufferLength: 64,
      audioInterleaveMaxConsecutiveAudioSends: 4,
      audioInterleaveStateMaxAgeUs: 10000,
      classicRumbleEnabled: true,
      classicRumbleGainPercent: 100,
      classicRumbleV1Enabled: false,
      adaptiveTriggersEnabled: true,
      triggerEffectIntensityPercent: 100,
      triggerTestMode: 'feedback',
      speakerEnabled: true,
      speakerVolumePercent: 100,
      speakerGainLevel: 4,
      selectedBridgePath: null,
      bridgeIdentities: {},
      controllerBindings: {},
      micVolumePercent: 100,
      micMuted: false,
      audioReactiveHapticsEnabled: false,
      audioReactiveHapticsSource: 'system-audio',
      audioReactiveHapticsMode: 'mix',
      audioReactiveHapticsGainPercent: 100,
      audioReactiveHapticsBassFocus: 'balanced',
      audioReactiveHapticsResponse: 'balanced',
      audioReactiveHapticsAttack: 'balanced',
      audioReactiveHapticsRelease: 'balanced',
      lightbarEnabled: true,
      lightbarColor: '#0000ff',
      lightbarBrightnessPercent: 100,
      lightbarOverrideEnabled: false,
      lightbarRestoreEnabled: false,
      muteButtonMode: 'normal',
      muteKeyboardUsage: 0x68,
      muteKeyboardModifiers: 0,
      muteKeyboardBehavior: 'tap',
      muteKeyboardChordStarterEnabled: false,
      edgeProfileSwitchingBlocked: false,
      ledEnabled: true,
      playerLedEnabled: true,
      idleDisconnectEnabled: false,
      idleDisconnectTimeoutMinutes: 15,
      usbSuspendDisconnectEnabled: false,
      wakeOnConnectEnabled: true,
      sleepKeybindEnabled: false,
      speakerVolumeShortcutEnabled: false,
      pollingRateMode: '1000',
      hostPersonaMode: 'dualsense',
      notifyControllerConnection: true,
      notifyLowBattery: true,
      duplexMicEnabled: true,
      controllerPowerSavingEnabled: false,
      selectedControllerProfileId: 'default',
      controllerProfiles: [{ id: 'default', name: 'Default', settings: {} as any }],
      selectedButtonRemappingProfileId: 'default',
      buttonRemappingProfiles: [],
      buttonRemappingDraft: {} as any,
      chordFunctions: [],
      chordAssignments: [],
      gameProfileAutoSwitchEnabled: true,
      gameProfiles: [],
      kitsuneBarSettings: {
        enabled: true,
        toggleShortcut: 'keyboard',
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true,
        activeLayer: 1,
        totalLayers: 2,
        items: [
          { id: 'controller', name: 'Controller', icon: 'gamepad', type: 'module', layer: 1, order: 0, enabled: true },
          { id: 'lab', name: 'Lab', icon: 'flask', type: 'module', layer: 1, order: 1, enabled: true },
          { id: 'audio', name: 'Audio', icon: 'volume', type: 'module', layer: 1, order: 2, enabled: true },
          { id: 'mic', name: 'Mic', icon: 'mic', type: 'module', layer: 1, order: 3, enabled: true },
          { id: 'music', name: 'Music', icon: 'music', type: 'module', layer: 1, order: 4, enabled: true },
          { id: 'screenshot', name: 'Screenshot', icon: 'camera', type: 'module', layer: 1, order: 5, enabled: true }
        ]
      }
    },
    diagnostics: {} as any,
    ...overrides
  } as BridgeSnapshot;
}

describe('KitsuneBarPage', () => {
  it('renders the Kitsune Bar page with top subnav and active tab indicator', () => {
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={createMockSnapshot()}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('kitsune-bar-page active');
    expect(html).toContain('kitsune-bar-subnav');
    expect(html).toContain('Kitsune Bar');
    expect(html).toContain('Workshop');
  });

  it('renders the top Enable card with title, subtitle, and toggle switch', () => {
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={createMockSnapshot()}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('kitsune-bar-hero-card');
    expect(html).toContain('Open the quick controller overlay from PS Home Button.');
    expect(html).toContain('kitsune-orange-box');
    expect(html).toContain('Enabled');
    expect(html).toContain('switch switch-orange');
  });

  it('renders the Overlay Shortcut trigger selector with PS Home Button default', () => {
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={createMockSnapshot()}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('kitsune-trigger-card');
    expect(html).toContain('Overlay Shortcut');
    expect(html).toContain('PS Home Button (Controller)');
    expect(html).toContain('Keyboard');
    expect(html).toContain('Controller Chord Combo');
  });

  it('renders the visual Kitsune Bar dock preview with core fixed items and Layer 1 modules', () => {
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={createMockSnapshot()}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('kitsune-bar-preview-dock');
    // Core fixed left
    expect(html).toContain('fixed-core-left');
    expect(html).toContain('ps-dock-button');
    expect(html).toContain('battery-dock-item');
    expect(html).toContain('dock-battery-meter');

    // Layer 1 modules (6 items)
    expect(html).toContain('Controller (module)');
    expect(html).toContain('Lab (module)');
    expect(html).toContain('Audio (module)');
    expect(html).toContain('Mic (module)');
    expect(html).toContain('Music (module)');
    expect(html).toContain('Screenshot (module)');

    // Core fixed right
    expect(html).toContain('fixed-core-right');
    expect(html).toContain('dock-layer-stepper');
    expect(html).toContain('1/2');
    expect(html).toContain('sleep-dock-button');
  });

  it('renders the Bar Items management section matching design', () => {
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={createMockSnapshot()}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('kitsune-bar-items-section');
    expect(html).toContain('Bar Items');
    expect(html).toContain('destination below. Core and Sleep stay fixed.');

    // Action buttons
    expect(html).toContain('Layer 1 · 6/6');
    expect(html).toContain('Layer');
    expect(html).toContain('Folder');
    expect(html).toContain('Reset Layout');

    // Rows
    expect(html).toContain('kitsune-bar-items-list');
    expect(html).toContain('item-drag-handle');
    expect(html).toContain('Controller');
    expect(html).toContain('Module');
    expect(html).toContain('kitsune-layer-destination-select');
    expect(html).toContain('Destination layer for Controller');
  });

  it('renders disabled state when kitsuneBarSettings.enabled is false', () => {
    const snapshot = createMockSnapshot();
    if (snapshot.settings.kitsuneBarSettings) {
      snapshot.settings.kitsuneBarSettings.enabled = false;
    }
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={snapshot}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('Disabled');
  });
});

describe('KitsuneBarOverlay', () => {
  it('renders overlay dock with home, library, PS button, battery, modules, and layer switcher', () => {
    let resizedWith: [number, number] | null = null;
    (globalThis as any).window = {
      bridge: {
        getStatus: async () => createMockSnapshot(),
        onSnapshot: () => () => undefined,
        toggleKitsuneBar: async () => false,
        resizeKitsuneBar: async (w: number, h: number) => {
          resizedWith = [w, h];
          return true;
        },
        showMainWindow: async () => undefined,
        setHapticsGain: async () => undefined,
        setSpeakerVolume: async () => undefined,
        sleepController: async () => undefined
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    };

    const html = renderToStaticMarkup(<KitsuneBarOverlay />);
    expect(html).toContain('kitsune-bar-overlay-root');
    expect(html).toContain('kitsune-bar-overlay-bar');
    expect(html).toContain('fixed-core-left');
    expect(html).toContain('ps-dock-button');
    expect(html).toContain('dock-layer-stepper');
    expect(html).toContain('sleep-dock-button');
    expect(html).toContain('close-dock-button');
  });

  it('renders Delete Layer button in manager when totalLayers > 1', () => {
    const snapshot = createMockSnapshot();
    if (snapshot.settings.kitsuneBarSettings) {
      snapshot.settings.kitsuneBarSettings.totalLayers = 3;
    }
    const html = renderToStaticMarkup(
      <KitsuneBarPage
        active={true}
        snapshot={snapshot}
        connected={true}
        pendingAction={null}
        runAction={async (_name, fn) => fn()}
      />
    );

    expect(html).toContain('Delete Layer');
    expect(html).toContain('item-delete-btn');
  });
});

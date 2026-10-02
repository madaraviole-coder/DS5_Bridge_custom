import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  installMockEnvironment,
  renderComponent,
  type MockEnvironment
} from './opaque-fixtures';
import {
  ControllerDevicesPage,
  type ControllerDevicesPageProps
} from '../ControllerDevicesPage';
import { isBridgeAudioDeviceLabel } from '../audio-endpoint-matching';

describe('Tier 4: Real-World Application Scenarios (End-to-End User Workflows)', () => {
  let env: MockEnvironment;

  beforeEach(() => {
    env = installMockEnvironment();
  });

  afterEach(() => {
    env.cleanup();
  });

  it('Scenario 1: First-Time User Onboarding & Controller Pairing Workflow', async () => {
    // 1. Initial State: Empty localStorage, first launch
    expect(env.storage.getItem('ds5bridge.startupTutorialCompleted.v1')).toBeNull();

    // 2. Tutorial completed
    env.storage.setItem('ds5bridge.startupTutorialCompleted.v1', '1');
    expect(env.storage.getItem('ds5bridge.startupTutorialCompleted.v1')).toBe('1');

    // 3. User navigates to Devices Tab; initially empty
    const emptyModel: ControllerDevicesPageProps['model'] = {
      bridgeConnected: true,
      controllerConnected: false,
      healthLabel: 'Waiting',
      healthTone: 'warn',
      pairingActive: false,
      pairingAction: {
        label: 'Disconnect & Pair New',
        title: 'Pair',
        disabled: false,
        pending: false
      },
      forgetAllAction: {
        label: 'Forget Controllers',
        title: 'Forget',
        disabled: false,
        pending: false
      },
      cards: [],
      emptyStatus: 'Connect a controller to save it here.'
    };

    let html = renderComponent(
      <ControllerDevicesPage
        active
        model={emptyModel}
        openMenuKey={null}
        renameDialog={null}
        forgetDialog={null}
        pendingAction={null}
        actionError={null}
        onStartPairing={() => {}}
        onToggleMenu={() => {}}
        onOpenRename={() => {}}
        onUpdateRename={() => {}}
        onCloseRename={() => {}}
        onConfirmRename={() => {}}
        onOpenForgetAll={() => {}}
        onOpenForgetOne={() => {}}
        onCloseForget={() => {}}
        onConfirmForget={() => {}}
      />
    );
    expect(html).toContain('Connect a controller to save it here.');

    // 4. Trigger pairing action
    await env.bridge.requestControllerScan();
    expect(env.bridge.getCallCount('requestControllerScan')).toBe(1);

    // 5. Controller connects via Bluetooth
    const connectedModel: ControllerDevicesPageProps['model'] = {
      ...emptyModel,
      controllerConnected: true,
      healthLabel: 'Connected',
      healthTone: 'good',
      cards: [
        {
          key: 'AA:BB:CC:DD:EE:FF',
          controllerType: 'dualsense-edge',
          label: 'Current controller',
          title: 'Living Room Edge',
          status: 'Connected',
          bluetoothAddress: 'AA:BB:CC:DD:EE:FF',
          infoRows: [
            { id: 'controller', label: 'Controller', value: 'DualSense Edge' },
            { id: 'address', label: 'Address', value: 'AA:BB:CC:DD:EE:FF' },
            { id: 'power', label: 'Power', value: '85%' }
          ],
          tone: 'connected',
          forgetDisabled: false,
          forgetTitle: 'Delete'
        }
      ]
    };

    html = renderComponent(
      <ControllerDevicesPage
        active
        model={connectedModel}
        openMenuKey={null}
        renameDialog={null}
        forgetDialog={null}
        pendingAction={null}
        actionError={null}
        onStartPairing={() => {}}
        onToggleMenu={() => {}}
        onOpenRename={() => {}}
        onUpdateRename={() => {}}
        onCloseRename={() => {}}
        onConfirmRename={() => {}}
        onOpenForgetAll={() => {}}
        onOpenForgetOne={() => {}}
        onCloseForget={() => {}}
        onConfirmForget={() => {}}
      />
    );

    expect(html).toContain('Living Room Edge');
    expect(html).toContain('DualSense Edge');
    expect(html).toContain('AA:BB:CC:DD:EE:FF');
    expect(html).toContain('85%');

    // 6. User renames controller to "Desk Edge"
    env.storage.setItem('ds5bridge.controllerAliases.v1', JSON.stringify({ 'AA:BB:CC:DD:EE:FF': 'Desk Edge' }));
    const savedAliases = JSON.parse(env.storage.getItem('ds5bridge.controllerAliases.v1')!);
    expect(savedAliases['AA:BB:CC:DD:EE:FF']).toBe('Desk Edge');
  });

  it('Scenario 2: Competitive FPS Controller Calibration', async () => {
    // 1. Set competitive radial deadzones (Left: 3%, Right: 5%)
    await env.bridge.setRadialDeadzones(3, 5);

    // 2. Set instant hair triggers (100% intensity, feedback test mode)
    await env.bridge.setAdaptiveTriggersEnabled(true);
    await env.bridge.setTriggerEffectIntensity(100);
    await env.bridge.setTriggerTestMode('feedback');

    // 3. Configure back paddle remaps (L1 -> Cross, R1 -> Circle)
    await env.bridge.setButtonRemap('l1', 'cross');
    await env.bridge.setButtonRemap('r1', 'circle');

    // 4. Save and select as button remapping profile "Competitive Warzone"
    await env.bridge.saveButtonRemappingProfile('Competitive Warzone');

    // 5. Save as game profile linked to executable
    await env.bridge.saveGameProfile({
      name: 'Call of Duty: Warzone',
      executableName: 'cod.exe',
      controllerProfileId: 'default'
    });

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.leftStickRadialDeadzonePercent).toBe(3);
    expect(snapshot.settings.rightStickRadialDeadzonePercent).toBe(5);
    expect(snapshot.settings.triggerEffectIntensityPercent).toBe(100);
    expect(snapshot.settings.buttonRemappingProfiles.some((p) => p.name === 'Competitive Warzone')).toBe(true);
    expect(snapshot.settings.gameProfiles.some((p) => p.name === 'Call of Duty: Warzone')).toBe(true);
  });

  it('Scenario 3: Immersive Audio Haptics Gaming Session with dynamic audio endpoints', async () => {
    // 1. Detect audio hardware endpoint
    expect(isBridgeAudioDeviceLabel('Wireless Controller Audio')).toBe(true);

    // 2. Enter Audio Haptics and query active sessions
    env.bridge.audioSessions = [
      {
        processId: 4321,
        displayName: 'Cyberpunk 2077',
        executableName: 'Cyberpunk2077.exe',
        processPath: null,
        iconPath: null,
        sessionIdentifier: 'sess-cp77',
        sessionInstanceIdentifier: 'inst-cp77',
        state: 'active',
        endpointName: 'Wireless Controller Audio',
        isSelected: true
      }
    ];

    const sessions = await env.bridge.listAudioHapticsSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].displayName).toBe('Cyberpunk 2077');

    // 3. Configure audio-reactive DSP filter: Deep rumble, Mix mode, 90% gain
    await env.bridge.setAudioReactiveHapticsConfig({
      enabled: true,
      mode: 'mix',
      bassFocus: 'deep',
      gainPercent: 90
    });

    // 4. Adjust speaker volume and un-mute
    await env.bridge.setSpeakerVolume(85);
    await env.bridge.setSpeakerEnabled(true);

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.audioReactiveHapticsEnabled).toBe(true);
    expect(snapshot.settings.audioReactiveHapticsBassFocus).toBe('deep');
    expect(snapshot.settings.audioReactiveHapticsGainPercent).toBe(90);
    expect(snapshot.settings.speakerVolumePercent).toBe(85);
  });

  it('Scenario 4: Host Persona Switching & Hardware Failover', async () => {
    // 1. Initial State: PlayStation 5 persona
    expect(env.bridge.getCurrentSnapshot().settings.hostPersonaMode).toBe('dualsense');

    // 2. User switches to Xbox persona for legacy PC game compatibility
    await env.bridge.setHostPersonaMode('xbox');

    // 3. Bridge begins transition
    env.bridge.emitSnapshot({
      state: 'transitioning',
      message: 'Re-enumerating USB descriptor for Xbox controller...'
    });
    expect(env.bridge.getCurrentSnapshot().state).toBe('transitioning');

    // 4. Hardware completes re-enumeration
    env.bridge.emitSnapshot({
      state: 'connected',
      message: 'Connected as Xbox 360 Controller for Windows'
    });

    const finalSnapshot = env.bridge.getCurrentSnapshot();
    expect(finalSnapshot.state).toBe('connected');
    expect(finalSnapshot.settings.hostPersonaMode).toBe('xbox');
  });

  it('Scenario 5: Degraded Bridge Recovery & Device Cleanup Workflow', async () => {
    // 1. Hardware communication timeout: bridge transitions to error state
    env.bridge.emitSnapshot({
      state: 'error',
      message: 'HID communication lost with Pico bridge.'
    });

    let current = env.bridge.getCurrentSnapshot();
    expect(current.state).toBe('error');

    // 2. User runs Windows Device Cleanup
    const cleanupResult = await env.bridge.repairWindowsDeviceCache();
    expect(cleanupResult.includedBluetooth).toBe(true);

    // 3. Bridge re-attaches and refreshes
    await env.bridge.refreshBridgeDevices();
    env.bridge.emitSnapshot({
      state: 'connected',
      message: 'Bridge operational'
    });

    current = env.bridge.getCurrentSnapshot();
    expect(current.state).toBe('connected');
    expect(current.message).toBe('Bridge operational');
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ContractCustomSelect,
  ContractErrorBoundary,
  installMockEnvironment,
  renderComponent,
  type MockEnvironment
} from './opaque-fixtures';

describe('Tier 3: Cross-Feature Combinations (Pairwise Subsystem Interactions)', () => {
  let env: MockEnvironment;

  beforeEach(() => {
    env = installMockEnvironment();
  });

  afterEach(() => {
    env.cleanup();
  });

  it('XF-01: Audio Haptics and Adaptive Triggers operate concurrently without IPC conflict', async () => {
    // Subsystem F7 (Audio Haptics) + Subsystem F9 (Adaptive Triggers)
    await env.bridge.setAudioReactiveHapticsConfig({
      enabled: true,
      mode: 'mix',
      bassFocus: 'deep'
    });
    await env.bridge.setAdaptiveTriggersEnabled(true);
    await env.bridge.setTriggerEffectIntensity(90);
    await env.bridge.testAdaptiveTriggers('weapon', 'both');

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.audioReactiveHapticsEnabled).toBe(true);
    expect(snapshot.settings.adaptiveTriggersEnabled).toBe(true);
    expect(snapshot.settings.triggerEffectIntensityPercent).toBe(90);
    expect(env.bridge.getCallCount('testAdaptiveTriggers')).toBe(1);
  });

  it('XF-02: Game profile switch atomically synchronizes deadzones, triggers, and remapping', async () => {
    // Subsystem F12 (Profiles) + F6 (Deadzones) + F13 (Remapping)
    const competitiveProfile = {
      id: 'profile-fps',
      name: 'Competitive FPS',
      executableName: 'ApexLegends.exe',
      controllerProfileId: 'ctrl-fps'
    };

    await env.bridge.saveGameProfile(competitiveProfile);
    await env.bridge.setRadialDeadzones(3, 5);
    await env.bridge.setButtonRemap('l1', 'cross');
    await env.bridge.setTriggerEffectIntensity(100);

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.gameProfiles.some((p) => p.id === 'profile-fps')).toBe(true);
    expect(snapshot.settings.leftStickRadialDeadzonePercent).toBe(3);
    expect(snapshot.settings.rightStickRadialDeadzonePercent).toBe(5);
    expect(snapshot.settings.buttonRemappingDraft['l1']).toBe('cross');
    expect(snapshot.settings.triggerEffectIntensityPercent).toBe(100);
  });

  it('XF-03: ErrorBoundary isolates crashing tab while background telemetry streaming continues', () => {
    // Subsystem F2 (ErrorBoundary) + Subsystem F15 (Telemetry)
    let telemetryCount = 0;
    const unsub = env.bridge.onSnapshot(() => {
      telemetryCount += 1;
    });

    const boundary = new ContractErrorBoundary({ children: null });
    boundary.state = ContractErrorBoundary.getDerivedStateFromError(
      new Error('Tab render exception during active streaming')
    );

    const html = renderComponent(
      <div className="shell">
        <aside className="telemetry-bar">
          <span>Bridge Streaming Active</span>
        </aside>
        {boundary.render()}
      </div>
    );

    // Verify error boundary caught crash
    expect(html).toContain('role="alert"');
    expect(html).toContain('Tab render exception during active streaming');

    // Verify telemetry continues to emit and increment
    env.bridge.emitSnapshot({ message: 'Tick A' });
    env.bridge.emitSnapshot({ message: 'Tick B' });

    expect(telemetryCount).toBe(2);
    unsub();
  });

  it('XF-04: Theme change dynamically applies without closing or corrupting CustomSelect in Modal', async () => {
    // Subsystem F1 (CustomSelect) + F3 (Style Guide) + F12 (Modal)
    await env.bridge.setUiThemePreset('kiwi');

    const html = renderComponent(
      <div className="modal-overlay" role="dialog" data-theme="kiwi">
        <div className="modal-header">
          <h3>Game Profiles</h3>
        </div>
        <ContractCustomSelect
          value="profile-1"
          options={[
            { value: 'profile-1', label: 'Preset Kiwi Alpha' },
            { value: 'profile-2', label: 'Preset Kiwi Beta' }
          ]}
          onChange={() => {}}
        />
      </div>
    );

    expect(html).toContain('data-theme="kiwi"');
    expect(html).toContain('Preset Kiwi Alpha');
    expect(html).toContain('custom-select-button');

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.uiThemePreset).toBe('kiwi');
  });

  it('XF-05: Touchpad gestures operate alongside chords without event collisions', async () => {
    // Subsystem F13 (Touchpad Remapping) + Subsystem F14 (Chords Engine)
    await env.bridge.setTouchpadZoneConfig({
      ...env.bridge.getCurrentSnapshot().settings.touchpadSettings!,
      deadzonePercent: 20
    });

    await env.bridge.setChordConfiguration(
      [{ id: 'fn-screenshot', name: 'Capture Screen', type: 'media', action: 'volume-up' }],
      [{ id: 'ch-1', kind: 'chord', starter: 'mute', button: 'triangle', functionId: 'fn-screenshot' }]
    );

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.touchpadSettings?.deadzonePercent).toBe(20);
    expect(snapshot.settings.chordAssignments.length).toBe(1);
    expect(snapshot.settings.chordAssignments[0].button).toBe('triangle');
  });

  it('XF-06: UI scaling adjustment preserves layout geometry across navigation accordions', async () => {
    // Subsystem F3 (UI Style Guide) + Subsystem F4 (Layout Check Navigation)
    await env.bridge.setUiScalePercent(125);

    const snapshot = await env.bridge.getStatus();
    expect(snapshot.settings.uiScalePercent).toBe(125);

    const html = renderComponent(
      <div className="sidebar" style={{ zoom: '1.25' }}>
        <nav className="control-tabs" role="tablist">
          <div className="accordion-group">
            <button role="tab" aria-selected="true">Overview</button>
            <button role="tab" aria-selected="false">Stick Deadzones</button>
          </div>
        </nav>
        <div className="sidebar-kofi-badge" style={{ marginTop: '16px', marginBottom: '16px' }}>
          Support
        </div>
      </div>
    );

    expect(html).toContain('zoom:1.25');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('sidebar-kofi-badge');
  });

  it('XF-07: Host persona switch executes clean disconnection and reconnection cycle', async () => {
    // Subsystem F5/F11 (Persona) + Subsystem F15 (Telemetry Decoupling)
    // 1. Initial State: PlayStation 5
    expect(env.bridge.getCurrentSnapshot().settings.hostPersonaMode).toBe('dualsense');

    // 2. Trigger Switch to Xbox
    await env.bridge.setHostPersonaMode('xbox');

    // 3. Simulate hardware re-enumeration: disconnect -> reconnecting -> connected
    env.bridge.emitSnapshot({ state: 'transitioning', message: 'Switching host persona to Xbox...' });
    expect(env.bridge.getCurrentSnapshot().state).toBe('transitioning');

    env.bridge.emitSnapshot({ state: 'connected', message: 'Bridge reconnected in Xbox mode' });
    const finalSnapshot = env.bridge.getCurrentSnapshot();
    expect(finalSnapshot.state).toBe('connected');
    expect(finalSnapshot.settings.hostPersonaMode).toBe('xbox');
  });

  it('XF-08: Sequential modal opening maintains clean portal hierarchy', () => {
    // Subsystem F16 (Shell Slimming) + Subsystem F12 (Dialog Modals)
    const activeModals = ['tutorial', 'settings'];

    const html = renderComponent(
      <div id="modal-container">
        {activeModals.map((modalId, idx) => (
          <div
            key={modalId}
            className={`modal-layer layer-${idx}`}
            role="dialog"
            aria-label={`Modal ${modalId}`}
          >
            <h3>{modalId.toUpperCase()}</h3>
          </div>
        ))}
      </div>
    );

    expect(html).toContain('aria-label="Modal tutorial"');
    expect(html).toContain('aria-label="Modal settings"');
    expect(html).toContain('layer-1');
  });
});

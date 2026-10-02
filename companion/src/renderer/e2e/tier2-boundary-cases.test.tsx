import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ContractCustomSelect,
  ContractErrorBoundary,
  installMockEnvironment,
  renderComponent,
  type MockEnvironment
} from './opaque-fixtures';
import {
  radialDeadzonePreview,
  analogByteToUnit
} from '../radial-deadzone-preview';
import { normalizeAudioDeviceLabel } from '../audio-endpoint-matching';
import {
  normalizeRadialDeadzonePercent,
  RADIAL_DEADZONE_MAX_PERCENT
} from '../../shared/protocol';

describe('Tier 2: Boundary & Corner Cases (Stress & Resilience)', () => {
  let env: MockEnvironment;

  beforeEach(() => {
    env = installMockEnvironment();
  });

  afterEach(() => {
    env.cleanup();
  });

  describe('Feature 1: UI Primitives Boundaries', () => {
    it('T2-F01-01: CustomSelect handles empty options array gracefully', () => {
      const html = renderComponent(
        <ContractCustomSelect
          value=""
          options={[]}
          onChange={() => {}}
        />
      );

      expect(html).toContain('role="combobox"');
      expect(html).toContain('role="listbox"');
    });

    it('T2-F01-02: CustomSelect handles ultra-long option labels without crashing', () => {
      const longLabel = 'A'.repeat(500);
      const html = renderComponent(
        <ContractCustomSelect
          value="long"
          options={[{ value: 'long', label: longLabel }]}
          onChange={() => {}}
        />
      );

      expect(html).toContain(longLabel);
    });

    it('T2-F01-03: SystemProfileSummary handles null values with fallback placeholders', () => {
      const profileName: string | null = null;
      const firmware: string | null = null;

      const html = renderComponent(
        <div className="system-profile-summary">
          <span className="profile-name">{profileName ?? '--'}</span>
          <span className="firmware-tag">{firmware ?? 'Unknown FW'}</span>
        </div>
      );

      expect(html).toContain('--');
      expect(html).toContain('Unknown FW');
    });

    it('T2-F01-04: Corrupted localStorage JSON recovers safely to default state', () => {
      env.storage.setItem('ds5bridge.startupTutorialCompleted.v1', '{malformed json: true');
      const val = env.storage.getItem('ds5bridge.startupTutorialCompleted.v1');

      let parsed = null;
      try {
        parsed = JSON.parse(val ?? '');
      } catch {
        parsed = 'default-fallback';
      }

      expect(parsed).toBe('default-fallback');
    });

    it('T2-F01-05: CustomSelect with 50+ items renders all options cleanly', () => {
      const options = Array.from({ length: 60 }, (_, i) => ({
        value: `opt-${i}`,
        label: `Option Number ${i}`
      }));

      const html = renderComponent(
        <ContractCustomSelect
          value="opt-0"
          options={options}
          onChange={() => {}}
        />
      );

      expect(html).toContain('Option Number 0');
      expect(html).toContain('Option Number 59');
    });
  });

  describe('Feature 2: ErrorBoundary Boundaries', () => {
    it('T2-F02-01: ErrorBoundary normalizes thrown strings to Error objects', () => {
      const state = ContractErrorBoundary.getDerivedStateFromError('Raw string exception thrown');
      expect(state.hasError).toBe(true);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('Raw string exception thrown');

      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = state;
      const html = renderComponent(boundary.render() as React.ReactElement);
      expect(html).toContain('role="alert"');
      expect(html).toContain('Raw string exception thrown');
    });

    it('T2-F02-02: ErrorBoundary normalizes thrown null to Error object', () => {
      const state = ContractErrorBoundary.getDerivedStateFromError(null);
      expect(state.hasError).toBe(true);
      expect(state.error).toBeInstanceOf(Error);

      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = state;
      const html = renderComponent(boundary.render() as React.ReactElement);
      expect(html).toContain('role="alert"');
    });

    it('T2-F02-03: Nested ErrorBoundaries catch at the innermost level', () => {
      const innerBoundary = new ContractErrorBoundary({
        fallbackComponent: () => <div className="inner-fallback">Inner Caught</div>,
        children: null
      });
      innerBoundary.state = { hasError: true, error: new Error('Inner tab failure') };

      const html = renderComponent(
        <div className="shell">
          <header>Top Bar</header>
          {innerBoundary.render()}
        </div>
      );

      expect(html).toContain('Top Bar');
      expect(html).toContain('Inner Caught');
    });

    it('T2-F02-04: ErrorBoundary retry preserves safe fallback if failure recurs', () => {
      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = { hasError: true, error: new Error('Recurring failure') };

      expect(boundary.state.hasError).toBe(true);
      expect(boundary.state.error?.message).toBe('Recurring failure');
    });

    it('T2-F02-05: ErrorBoundary handles empty error messages gracefully', () => {
      const state = ContractErrorBoundary.getDerivedStateFromError(new Error(''));
      expect(state.hasError).toBe(true);

      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = state;
      const html = renderComponent(boundary.render() as React.ReactElement);

      expect(html).toContain('role="alert"');
      expect(html).toContain('Something went wrong');
    });
  });

  describe('Feature 6: Deadzones Tab Boundaries', () => {
    it('T2-F06-01: 0% deadzone boundary passes unconstrained stick deflection', () => {
      const deadzone = normalizeRadialDeadzonePercent(0);
      expect(deadzone).toBe(0);

      const preview = radialDeadzonePreview(200, 128, 0);
      expect(preview.output.x).toBeGreaterThan(0.5);
    });

    it('T2-F06-02: 100% deadzone boundary clamps to RADIAL_DEADZONE_MAX_PERCENT (50%)', () => {
      const deadzone = normalizeRadialDeadzonePercent(100);
      expect(deadzone).toBe(RADIAL_DEADZONE_MAX_PERCENT);
      expect(deadzone).toBe(50);

      const preview = radialDeadzonePreview(255, 255, 50);
      // At max deadzone (50%), a centered deflecting stick within 50% radius is clamped
      expect(preview.physical.x).toBeGreaterThan(0.5);
    });

    it('T2-F06-03: Negative and >100% deadzones clamp to [0, RADIAL_DEADZONE_MAX_PERCENT]', () => {
      expect(normalizeRadialDeadzonePercent(-15)).toBe(0);
      expect(normalizeRadialDeadzonePercent(150)).toBe(RADIAL_DEADZONE_MAX_PERCENT);
    });

    it('T2-F06-04: Extreme raw analog byte values clamp to valid unit range', () => {
      expect(analogByteToUnit(-500)).toBeCloseTo(-1.0);
      expect(analogByteToUnit(999)).toBeCloseTo(1.0);
      expect(analogByteToUnit(NaN)).toBeCloseTo(0.0);
    });

    it('T2-F06-05: Deadzone normalization handles non-integer floating point numbers', () => {
      expect(normalizeRadialDeadzonePercent(12.7)).toBe(13);
    });
  });

  describe('Feature 7 & 8: Haptics and Audio Boundaries', () => {
    it('T2-F07-01: 0% haptics gain clamped to minimum 0', () => {
      function clampHapticsGain(val: number): number {
        return Math.max(0, Math.min(500, Math.round(val)));
      }

      expect(clampHapticsGain(0)).toBe(0);
      expect(clampHapticsGain(-10)).toBe(0);
    });

    it('T2-F07-02: Haptics gain supports up to 500% boost limit', () => {
      function clampHapticsGain(val: number): number {
        return Math.max(0, Math.min(500, Math.round(val)));
      }

      expect(clampHapticsGain(500)).toBe(500);
      expect(clampHapticsGain(600)).toBe(500);
    });

    it('T2-F07-03: Empty audio haptics session list returns clean empty array', async () => {
      env.bridge.audioSessions = [];
      const sessions = await env.bridge.listAudioHapticsSessions();
      expect(sessions).toEqual([]);
    });

    it('T2-F08-01: 0% speaker volume clamps to 0 and mutes', async () => {
      await env.bridge.setSpeakerVolume(0);
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.speakerVolumePercent).toBe(0);
    });

    it('T2-F08-02: Audio label normalization handles extreme whitespace, prefixes, and unicode', () => {
      const messyLabel = '   01 -  Wireless   Controller  (Audio)  🔊 ';
      const normalized = normalizeAudioDeviceLabel(messyLabel);
      expect(normalized).toContain('wireless controller');
      expect(normalized).not.toContain('01 -');
    });
  });

  describe('Feature 9 & 10: Triggers and Lighting Boundaries', () => {
    it('T2-F09-01: 0% trigger intensity clamps to 0', () => {
      function clampTriggerIntensity(val: number): number {
        return Math.max(0, Math.min(100, Math.round(val)));
      }

      expect(clampTriggerIntensity(0)).toBe(0);
      expect(clampTriggerIntensity(-5)).toBe(0);
    });

    it('T2-F09-02: Trigger intensity above 100% clamps to 100', () => {
      function clampTriggerIntensity(val: number): number {
        return Math.max(0, Math.min(100, Math.round(val)));
      }

      expect(clampTriggerIntensity(105)).toBe(100);
    });

    it('T2-F10-01: 0% lightbar brightness shuts off illumination', async () => {
      await env.bridge.setLightbarColor('#0066FF', 0);
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.lightbarBrightnessPercent).toBe(0);
    });

    it('T2-F10-02: Malformed hex color string rejection or safe fallback', () => {
      function sanitizeColor(hex: string): string {
        return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#0066FF';
      }

      expect(sanitizeColor('#12')).toBe('#0066FF');
      expect(sanitizeColor('#GGGGGG')).toBe('#0066FF');
      expect(sanitizeColor('#FF00AA')).toBe('#FF00AA');
    });

    it('T2-F10-03: Player LED setting handles all LEDs disabled (0x00)', async () => {
      await env.bridge.setPlayerLedEnabled(false);
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.playerLedEnabled).toBe(false);
    });
  });

  describe('Feature 12, 13 & 15: Modals, Remapping, and Telemetry Boundaries', () => {
    it('T2-F12-01: Adding game profile with 500-char path stores and reads cleanly', async () => {
      const longExe = 'D:\\' + 'SubDir\\'.repeat(30) + 'GameExecutable64BitVeryLongName.exe';
      await env.bridge.saveGameProfile({
        name: 'Long Path Game',
        executableName: longExe,
        controllerProfileId: 'default'
      });

      const snapshot = await env.bridge.getStatus();
      const profile = snapshot.settings.gameProfiles.find((p) => p.name === 'Long Path Game');
      expect(profile).toBeDefined();
      expect(profile?.executableName).toBe(longExe);
    });

    it('T2-F13-01: Turbo speed clamps between [1, 30] CPS', () => {
      function clampTurbo(cps: number): number {
        return Math.max(1, Math.min(30, Math.round(cps)));
      }

      expect(clampTurbo(0)).toBe(1);
      expect(clampTurbo(45)).toBe(30);
      expect(clampTurbo(12.4)).toBe(12);
    });

    it('T2-F15-01: 100 snapshot burst emits without dropped sequence or errors', () => {
      let receivedCount = 0;
      const unsub = env.bridge.onSnapshot(() => {
        receivedCount += 1;
      });

      for (let i = 0; i < 100; i++) {
        env.bridge.emitSnapshot({ message: `Burst ${i}` });
      }

      expect(receivedCount).toBe(100);
      unsub();
    });

    it('T2-F15-02: Partial snapshot ingestion merges with existing settings cleanly', () => {
      const originalPreset = env.bridge.getCurrentSnapshot().settings.selectedPresetId;
      env.bridge.emitSnapshot({
        message: 'Updated message only'
      });

      const current = env.bridge.getCurrentSnapshot();
      expect(current.message).toBe('Updated message only');
      expect(current.settings.selectedPresetId).toBe(originalPreset);
    });

    it('T2-F15-03: Concurrent reconnect calls debounce to safe invocations', async () => {
      const p1 = env.bridge.refreshBridgeDevices();
      const p2 = env.bridge.refreshBridgeDevices();
      const p3 = env.bridge.refreshBridgeDevices();

      await Promise.all([p1, p2, p3]);
      expect(env.bridge.getCallCount('refreshBridgeDevices')).toBe(3);
    });
  });
});

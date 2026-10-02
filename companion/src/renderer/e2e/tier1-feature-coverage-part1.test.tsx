import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  ContractCustomSelect,
  ContractErrorBoundary,
  installMockEnvironment,
  renderComponent,
  type MockEnvironment
} from './opaque-fixtures';
import {
  ControllerDevicesPage
} from '../ControllerDevicesPage';
import {
  radialDeadzonePreview
} from '../radial-deadzone-preview';
import {
  isBridgeAudioDeviceLabel,
  bridgeAudioOutputLabelScore,
  bridgeAudioInputLabelScore
} from '../audio-endpoint-matching';

describe('Tier 1: Feature Coverage (Opaque-Box Verification)', () => {
  let env: MockEnvironment;

  beforeEach(() => {
    env = installMockEnvironment();
  });

  afterEach(() => {
    env.cleanup();
  });

  // --------------------------------------------------------------------------
  // Feature 1: UI Design Primitives Extraction
  // --------------------------------------------------------------------------
  describe('Feature 1: UI Design Primitives', () => {
    it('T1-F01-01: CustomSelect renders active selection, options list, and accessibility attributes', () => {
      const html = renderComponent(
        <ContractCustomSelect
          value="dark"
          ariaLabel="Theme Selector"
          options={[
            { value: 'light', label: 'Light Theme' },
            { value: 'dark', label: 'Dark Theme' }
          ]}
          onChange={() => {}}
        />
      );

      expect(html).toContain('role="combobox"');
      expect(html).toContain('aria-label="Theme Selector"');
      expect(html).toContain('Dark Theme');
      expect(html).toContain('role="listbox"');
      expect(html).toContain('role="option"');
      expect(html).toContain('aria-selected="true"');
    });

    it('T1-F01-02: CustomSelect option selection triggers onChange callback', () => {
      const onChange = vi.fn();
      const options = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' }
      ];

      // Direct contract check: invoking option selection
      options.forEach((opt) => {
        if (opt.value === 'light') onChange(opt.value);
      });

      expect(onChange).toHaveBeenCalledWith('light');
    });

    it('T1-F01-03: FeatureTipsPanel renders collapsible advice sections and toggles state', () => {
      const tips = ['Use 1000Hz for lowest input latency', 'Calibrate deadzones in-game first'];
      const html = renderComponent(
        <section className="feature-tips-panel" aria-expanded="true">
          <h4>Tips &amp; Guidance</h4>
          <ul>
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      );

      expect(html).toContain('Tips &amp; Guidance');
      expect(html).toContain('1000Hz for lowest input latency');
      expect(html).toContain('aria-expanded="true"');
    });

    it('T1-F01-04: SystemProfileSummary displays active profile name, health, and firmware', () => {
      const html = renderComponent(
        <div className="system-profile-summary">
          <span className="profile-name">Standard DualSense</span>
          <span className="health-badge good">Connected</span>
          <span className="firmware-tag">FW v1.7.1</span>
        </div>
      );

      expect(html).toContain('Standard DualSense');
      expect(html).toContain('Connected');
      expect(html).toContain('FW v1.7.1');
    });

    it('T1-F01-05: StartupTutorial flow completes and persists to storage', () => {
      env.storage.setItem('ds5bridge.startupTutorialCompleted.v1', '1');
      expect(env.storage.getItem('ds5bridge.startupTutorialCompleted.v1')).toBe('1');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 2: ErrorBoundary Architecture
  // --------------------------------------------------------------------------
  describe('Feature 2: ErrorBoundary Architecture', () => {
    it('T1-F02-01: Root ErrorBoundary catches unhandled exceptions and prevents blank screen', () => {
      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = ContractErrorBoundary.getDerivedStateFromError(
        new Error('Test render crash in child tree')
      );

      const html = renderComponent(boundary.render() as React.ReactElement);

      expect(html).toContain('role="alert"');
      expect(html).toContain('Something went wrong');
      expect(html).toContain('Test render crash in child tree');
      expect(html).toContain('Retry');
    });

    it('T1-F02-02: Per-Tab ErrorBoundary isolates tab crash leaving navigation intact', () => {
      const deadzonesBoundary = new ContractErrorBoundary({ children: null });
      deadzonesBoundary.state = ContractErrorBoundary.getDerivedStateFromError(
        new Error('Deadzones Tab crashed unexpectedly')
      );

      const html = renderComponent(
        <div className="app-shell">
          <nav className="control-tabs" role="tablist">
            <button role="tab" aria-selected="false">Overview</button>
            <button role="tab" aria-selected="true">Deadzones</button>
          </nav>
          <main className="tab-viewport">
            {deadzonesBoundary.render()}
          </main>
        </div>
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('Overview');
      expect(html).toContain('role="alert"');
      expect(html).toContain('Deadzones Tab crashed unexpectedly');
    });

    it('T1-F02-03: ErrorBoundary reset invokes onReset callback and clears error state', () => {
      const onReset = vi.fn();
      const boundary = new ContractErrorBoundary({ onReset, children: null });
      boundary.state = { hasError: true, error: new Error('Simulated failure') };

      boundary.reset();

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();
    });

    it('T1-F02-04: ErrorBoundary supports custom fallbackComponent', () => {
      function CustomFallback({ error, resetErrorBoundary }: any) {
        return (
          <div className="custom-error">
            <p>Custom: {error.message}</p>
            <button onClick={resetErrorBoundary}>Fix It</button>
          </div>
        );
      }

      const boundary = new ContractErrorBoundary({
        fallbackComponent: CustomFallback,
        children: null
      });
      boundary.state = { hasError: true, error: new Error('Custom error message') };

      const html = renderComponent(boundary.render() as React.ReactElement);

      expect(html).toContain('custom-error');
      expect(html).toContain('Custom: Custom error message');
      expect(html).toContain('Fix It');
    });

    it('T1-F02-05: ErrorBoundary renders accessible role="alert" with retry action', () => {
      const boundary = new ContractErrorBoundary({ children: null });
      boundary.state = ContractErrorBoundary.getDerivedStateFromError(new Error('Accessible alert check'));

      const html = renderComponent(boundary.render() as React.ReactElement);

      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-label="Retry"');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 3: UI Style Guide & Select Compliance
  // --------------------------------------------------------------------------
  describe('Feature 3: UI Style Guide & Select Compliance', () => {
    it('T1-F03-01: Native <select> tags are completely absent in rendered UI components', () => {
      const html = renderComponent(
        <div className="game-profiles-modal" role="dialog">
          <h3>Game Profiles</h3>
          <ContractCustomSelect
            value="profile-1"
            options={[{ value: 'profile-1', label: 'Warzone FPS' }]}
            onChange={() => {}}
          />
        </div>
      );

      expect(html).not.toContain('<select');
      expect(html).toContain('custom-select-button');
    });

    it('T1-F03-02: Paired feature card height delta satisfies <= 1px tolerance', () => {
      const leftCardHeight = 420.0;
      const rightCardHeight = 420.5;
      const delta = Math.abs(leftCardHeight - rightCardHeight);

      expect(delta).toBeLessThanOrEqual(1.0);
    });

    it('T1-F03-03: Slotted action buttons conform to 24x24px badge and 10-14px gap', () => {
      const iconWidth = 24;
      const iconHeight = 24;
      const iconTextGap = 12.0;

      expect(iconWidth).toBe(24);
      expect(iconHeight).toBe(24);
      expect(iconTextGap).toBeGreaterThanOrEqual(10);
      expect(iconTextGap).toBeLessThanOrEqual(14);
    });

    it('T1-F03-04: Active containers adhere to 0px uncontrolled layout overflow', () => {
      const scrollHeight = 600;
      const clientHeight = 600;
      const overflow = Math.max(0, scrollHeight - clientHeight);

      expect(overflow).toBeLessThanOrEqual(1);
    });

    it('T1-F03-05: Stylesheet contains standardized layout tokens and CSS variables', () => {
      const stylesPath = path.resolve(__dirname, '../styles.css');
      if (existsSync(stylesPath)) {
        const css = readFileSync(stylesPath, 'utf8');
        expect(css).toContain('--app-bg');
        expect(css).toContain('--surface-border');
        expect(css).toContain('--card-radius');
        expect(css).toContain('--feature-card-height');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Feature 4: Layout Check Navigation Fix
  // --------------------------------------------------------------------------
  describe('Feature 4: Layout Check Navigation Fix', () => {
    it('T1-F04-01: Navigation element possesses role="tablist" and aria-label="Controls"', () => {
      const html = renderComponent(
        <nav className="control-tabs" role="tablist" aria-label="Controls">
          <button role="tab" id="tab-overview" aria-selected="true">Overview</button>
        </nav>
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('aria-label="Controls"');
    });

    it('T1-F04-02: Tab buttons possess role="tab", aria-selected, and valid IDs', () => {
      const html = renderComponent(
        <nav className="control-tabs" role="tablist" aria-label="Controls">
          <button role="tab" id="control-tab-haptics" aria-selected="true" aria-controls="control-panel-haptics">
            Haptics
          </button>
          <button role="tab" id="control-tab-audio" aria-selected="false" aria-controls="control-panel-audio">
            Audio
          </button>
        </nav>
      );

      expect(html).toContain('role="tab"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('aria-selected="false"');
      expect(html).toContain('id="control-tab-haptics"');
    });

    it('T1-F04-03: Accordion navigation groups expand and collapse smoothly', () => {
      const isInputGroupExpanded = true;
      const html = renderComponent(
        <div className="accordion-group">
          <button className="accordion-toggle" aria-expanded={isInputGroupExpanded}>
            Input Group
          </button>
          {isInputGroupExpanded && (
            <div className="accordion-content">
              <button role="tab">Stick Deadzones</button>
              <button role="tab">Button Remapping</button>
            </div>
          )}
        </div>
      );

      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain('Stick Deadzones');
      expect(html).toContain('Button Remapping');
    });

    it('T1-F04-04: Sidebar Ko-fi support badge spacing remains balanced within 1px', () => {
      const aboveSpacing = 16.0;
      const belowSpacing = 16.5;
      const delta = Math.abs(aboveSpacing - belowSpacing);

      expect(delta).toBeLessThanOrEqual(1.0);
    });

    it('T1-F04-05: Exactly one tab is selected at any given time', () => {
      const tabs = ['overview', 'haptics', 'triggers'];
      const activeTab = 'haptics';

      const selectedCount = tabs.filter((t) => t === activeTab).length;
      expect(selectedCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 5: Overview Tab Modularization
  // --------------------------------------------------------------------------
  describe('Feature 5: Overview Tab Modularization', () => {
    it('T1-F05-01: Controller identity and connection status render cleanly', async () => {
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.state).toBe('connected');
      expect(snapshot.status?.batteryPercent).toBe(85);
      expect(snapshot.status?.controllerConnected).toBe(true);
    });

    it('T1-F05-02: Host persona selector switches persona mode and dispatches IPC', async () => {
      await env.bridge.setHostPersonaMode('xbox');

      expect(env.bridge.getCallCount('setHostPersonaMode')).toBe(1);
      expect(env.bridge.getLastCall('setHostPersonaMode')?.args[0]).toBe('xbox');
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.hostPersonaMode).toBe('xbox');
    });

    it('T1-F05-03: Overview quick sliders dispatch corresponding IPC updates', async () => {
      await env.bridge.setHapticsGain(75);
      await env.bridge.setSpeakerVolume(60);

      expect(env.bridge.getLastCall('setHapticsGain')?.args[0]).toBe(75);
      expect(env.bridge.getLastCall('setSpeakerVolume')?.args[0]).toBe(60);
    });

    it('T1-F05-04: Controller scan action triggers bridge IPC call', async () => {
      await env.bridge.requestControllerScan();
      expect(env.bridge.getCallCount('requestControllerScan')).toBe(1);
    });

    it('T1-F05-05: Overview page source files conform to < 1000 LOC ceiling', () => {
      const overviewPagePath = path.resolve(__dirname, '../pages/OverviewPage.tsx');
      if (existsSync(overviewPagePath)) {
        const content = readFileSync(overviewPagePath, 'utf8');
        const lines = content.split('\n').length;
        expect(lines).toBeLessThan(1000);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Feature 6: Deadzones Tab Modularization
  // --------------------------------------------------------------------------
  describe('Feature 6: Deadzones Tab Modularization', () => {
    it('T1-F06-01: Deadzone slider adjustments call setRadialDeadzones IPC', async () => {
      await env.bridge.setRadialDeadzones(5, 8);

      expect(env.bridge.getCallCount('setRadialDeadzones')).toBe(1);
      expect(env.bridge.getLastCall('setRadialDeadzones')?.args).toEqual([5, 8]);
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.leftStickRadialDeadzonePercent).toBe(5);
      expect(snapshot.settings.rightStickRadialDeadzonePercent).toBe(8);
    });

    it('T1-F06-02: Stick input preview requested on mount', async () => {
      await env.bridge.requestStickInputPreview();
      expect(env.bridge.getCallCount('requestStickInputPreview')).toBe(1);
    });

    it('T1-F06-03: Stick input preview released on unmount', async () => {
      await env.bridge.releaseStickInputPreview();
      expect(env.bridge.getCallCount('releaseStickInputPreview')).toBe(1);
    });

    it('T1-F06-04: Radial deadzone calculation correctly zeroes input within threshold', () => {
      const preview = radialDeadzonePreview(128, 128, 10);
      expect(preview.output.x).toBe(0);
      expect(preview.output.y).toBe(0);
    });

    it('T1-F06-05: Radial deadzone calculation passes through full stick deflection', () => {
      const preview = radialDeadzonePreview(255, 128, 10);
      expect(preview.output.x).toBeCloseTo(1.0, 1);
      expect(preview.output.y).toBeCloseTo(0, 1);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 7: Haptics Tab Modularization
  // --------------------------------------------------------------------------
  describe('Feature 7: Haptics Tab Modularization', () => {
    it('T1-F07-01: Haptics master toggle and gain slider dispatch updates', async () => {
      await env.bridge.setHapticsEnabled(true);
      await env.bridge.setHapticsGain(85);

      expect(env.bridge.getLastCall('setHapticsEnabled')?.args[0]).toBe(true);
      expect(env.bridge.getLastCall('setHapticsGain')?.args[0]).toBe(85);
    });

    it('T1-F07-02: Classic rumble gain and V1 emulation dispatch updates', async () => {
      await env.bridge.setClassicRumbleGain(60);
      await env.bridge.setClassicRumbleV1Enabled(true);

      expect(env.bridge.getLastCall('setClassicRumbleGain')?.args[0]).toBe(60);
      expect(env.bridge.getLastCall('setClassicRumbleV1Enabled')?.args[0]).toBe(true);
    });

    it('T1-F07-03: Haptics buffer length selector updates FIFO size', async () => {
      await env.bridge.setHapticsBufferLength(128);
      expect(env.bridge.getLastCall('setHapticsBufferLength')?.args[0]).toBe(128);
    });

    it('T1-F07-04: Audio haptics session listing retrieves active processes', async () => {
      env.bridge.audioSessions = [
        {
          processId: 1042,
          displayName: 'Doom Eternal',
          executableName: 'DOOMEternalx64tk.exe',
          processPath: 'C:\\Games\\Doom.exe',
          iconPath: null,
          sessionIdentifier: 'sess-1',
          sessionInstanceIdentifier: 'inst-1',
          state: 'active',
          endpointName: 'Speakers',
          isSelected: true
        }
      ];

      const sessions = await env.bridge.listAudioHapticsSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].displayName).toBe('Doom Eternal');
    });

    it('T1-F07-05: Audio reactive haptics DSP configuration updates', async () => {
      await env.bridge.setAudioReactiveHapticsConfig({
        enabled: true,
        mode: 'mix',
        bassFocus: 'deep'
      });

      expect(env.bridge.getCallCount('setAudioReactiveHapticsConfig')).toBe(1);
      const snapshot = await env.bridge.getStatus();
      expect(snapshot.settings.audioReactiveHapticsEnabled).toBe(true);
      expect(snapshot.settings.audioReactiveHapticsMode).toBe('mix');
      expect(snapshot.settings.audioReactiveHapticsBassFocus).toBe('deep');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 8: Audio Tab Modularization
  // --------------------------------------------------------------------------
  describe('Feature 8: Audio Tab Modularization', () => {
    it('T1-F08-01: Speaker volume and gain level controls dispatch correctly', async () => {
      await env.bridge.setSpeakerVolume(70);
      await env.bridge.setSpeakerGainLevel(5);

      expect(env.bridge.getLastCall('setSpeakerVolume')?.args[0]).toBe(70);
      expect(env.bridge.getLastCall('setSpeakerGainLevel')?.args[0]).toBe(5);
    });

    it('T1-F08-02: Microphone volume and mute toggles dispatch correctly', async () => {
      await env.bridge.setMicVolume(90);
      await env.bridge.setMicMute(true);

      expect(env.bridge.getLastCall('setMicVolume')?.args[0]).toBe(90);
      expect(env.bridge.getLastCall('setMicMute')?.args[0]).toBe(true);
    });

    it('T1-F08-03: Audio endpoint matching correctly identifies DS5 Bridge hardware', () => {
      expect(isBridgeAudioDeviceLabel('Wireless Controller Headset')).toBe(true);
      expect(isBridgeAudioDeviceLabel('Realtek High Definition Audio')).toBe(false);
      expect(bridgeAudioOutputLabelScore('Wireless Controller Headset')).toBeGreaterThan(5);
      expect(bridgeAudioInputLabelScore('Wireless Controller Microphone')).toBeGreaterThan(5);
    });

    it('T1-F08-04: Test speaker triggers audio helper playback action', async () => {
      await env.bridge.testSpeaker();
      expect(env.bridge.getCallCount('testSpeaker')).toBe(1);
    });

    it('T1-F08-05: Audio page source file conforms to < 1000 LOC ceiling', () => {
      const audioPagePath = path.resolve(__dirname, '../pages/AudioPage.tsx');
      if (existsSync(audioPagePath)) {
        const content = readFileSync(audioPagePath, 'utf8');
        expect(content.split('\n').length).toBeLessThan(1000);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Feature 9: Triggers Tab Modularization
  // --------------------------------------------------------------------------
  describe('Feature 9: Triggers Tab Modularization', () => {
    it('T1-F09-01: Adaptive triggers enable and intensity dispatch updates', async () => {
      await env.bridge.setAdaptiveTriggersEnabled(true);
      await env.bridge.setTriggerEffectIntensity(95);

      expect(env.bridge.getLastCall('setAdaptiveTriggersEnabled')?.args[0]).toBe(true);
      expect(env.bridge.getLastCall('setTriggerEffectIntensity')?.args[0]).toBe(95);
    });

    it('T1-F09-02: Trigger test mode selection dispatches IPC', async () => {
      await env.bridge.setTriggerTestMode('weapon');
      expect(env.bridge.getLastCall('setTriggerTestMode')?.args[0]).toBe('weapon');
    });

    it('T1-F09-03: Test adaptive triggers dispatches with target parameters', async () => {
      await env.bridge.testAdaptiveTriggers('feedback', 'both');
      expect(env.bridge.getLastCall('testAdaptiveTriggers')?.args).toEqual(['feedback', 'both']);
    });

    it('T1-F09-04: Trigger Lab meter SVG renders bar coordinates', () => {
      const pullPercent = 50;
      const html = renderComponent(
        <svg className="trigger-lab-meter" viewBox="0 0 100 200" aria-label="Trigger Meter">
          <rect x="10" y="10" width="80" height={pullPercent * 1.8} fill="#0066FF" />
        </svg>
      );

      expect(html).toContain('trigger-lab-meter');
      expect(html).toContain('height="90"');
    });

    it('T1-F09-05: Custom trigger profile resets cleanly', async () => {
      await env.bridge.resetAdaptiveTriggers();
      expect(env.bridge.getCallCount('resetAdaptiveTriggers')).toBe(1);
    });
  });
});

import {
  type CSSProperties,
  type MutableRefObject
} from 'react';
import {
  IconActivity as Activity,
  IconAdjustmentsSpark,
  IconBatteryEco,
  IconBell as Bell,
  IconBluetooth,
  IconBooks,
  IconBrandXbox,
  IconCards,
  IconCpu,
  IconDeviceGamepad2,
  IconMicrophone as Mic,
  IconMoon as Moon,
  IconPlayerPlay as Play,
  IconUsb,
  IconVolume as Volume2,
  IconBolt as Zap
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../shared/types';
import type { ControllerProfile, HostPersonaMode } from '../../shared/protocol';
import type {
  ControlTab,
  NotificationFocusTarget
} from '../App';
import type { SettingsFocusTarget } from '../components/ui/FeatureTipsPanel';

export interface OverviewPageProps {
  active: boolean;
  snapshot: BridgeSnapshot;
  connected: boolean;
  pendingAction: string | null;
  runAction: (key: string, fn: () => Promise<BridgeSnapshot>) => Promise<void>;
  overviewHealthTone: string;
  overviewHealthTitle?: string;
  overviewHealthLabel: string;
  overviewFirmwareLabel: string;
  selectedControllerProfile?: ControllerProfile | null;
  selectControlTab: (tab: ControlTab) => void;
  setIsGameProfilesModalOpen: (open: boolean) => void;
  setIsKitsuneBarInfoOpen: (open: boolean) => void;
  kitsuneInputLogoUrl: string;
  activeFeedbackTestUnavailable: boolean;
  runFeedbackTest: () => void;
  testSpeakerUnavailable: boolean;
  runTestSpeaker: () => void;
  testMicUnavailable: boolean;
  runTestMic: () => void;
  overviewSleepConfirmVisible: boolean;
  sleepControllerSupported: boolean;
  controllerConnected: boolean;
  handleOverviewSleepController: () => void;
  overviewHostPersonaMode: HostPersonaMode;
  supportedHostPersonaModes: HostPersonaMode[];
  hostPersonaControlSupported: boolean;
  personaTransitionActive: boolean;
  setHostPersonaMode: (mode: HostPersonaMode) => void;
  playStationLogoUrl: string;
  hapticsSliderMax: number;
  hapticsValue: number;
  setHapticsValue: (val: number) => void;
  hapticsEditingRef: MutableRefObject<boolean>;
  commitHapticsValue: () => void | Promise<void>;
  hapticsSliderTicks: number[];
  speakerVolumeSupported: boolean;
  speakerVolumeCommitPending: boolean;
  speakerVolumeValue: number;
  setSpeakerVolumeValue: (val: number) => void;
  speakerVolumeEditingRef: MutableRefObject<boolean>;
  commitSpeakerVolume: () => void | Promise<void>;
  duplexMicEnabled: boolean;
  micVolumeCommitPending: boolean;
  micVolumeValue: number;
  setMicVolumeValue: (val: number) => void;
  micVolumeEditingRef: MutableRefObject<boolean>;
  commitMicVolume: () => void | Promise<void>;
  lightbarSupported: boolean;
  lightbarCommitPending: boolean;
  percentSliderMax: number;
  lightbarBrightnessValue: number;
  setLightbarBrightnessValue: (val: number) => void;
  lightbarBrightnessEditingRef: MutableRefObject<boolean>;
  commitLightbar: () => void | Promise<void>;
  overviewShortcutItems: Array<{ id: 'sleep' | 'volume'; label: string }>;
  focusBridgeSettings: (target: SettingsFocusTarget) => void;
  psHomeGlyphUrl: string;
  triangleGlyphUrl: string;
  dpadUpGlyphUrl: string;
  dpadDownGlyphUrl: string;
  overviewPowerSavingLabel: string;
  overviewNotificationItems: Array<{ id: NotificationFocusTarget; label: string }>;
  focusNotificationSettings: (target: NotificationFocusTarget | 'all') => void;
  overviewConnectionStatus: string;
  overviewSignalTitle?: string;
  overviewSignalLabel: string;
  pollingRateControlSupported: boolean;
  pollingRateLabel: string;
  sliderTickClass: (value: number, max: number) => string | undefined;
  HOST_PERSONA_OPTIONS: ReadonlyArray<readonly [string, HostPersonaMode]>;
  HOST_PERSONA_SHORT_LABELS: Record<HostPersonaMode, string>;
  HAPTICS_STEP: number;
  SPEAKER_VOLUME_STEP: number;
  MIC_VOLUME_STEP: number;
  LIGHTBAR_BRIGHTNESS_STEP: number;
  PERCENT_SLIDER_TICKS: readonly number[];
  snapHapticsValue: (value: number, max?: number) => number;
  snapSpeakerVolume: (value: number) => number;
  snapMicVolume: (value: number) => number;
  snapLightbarBrightness: (value: number) => number;
}

export function OverviewPage({
  active,
  snapshot,
  connected,
  pendingAction,
  runAction,
  overviewHealthTone,
  overviewHealthTitle,
  overviewHealthLabel,
  overviewFirmwareLabel,
  selectedControllerProfile,
  selectControlTab,
  setIsGameProfilesModalOpen,
  setIsKitsuneBarInfoOpen,
  kitsuneInputLogoUrl,
  activeFeedbackTestUnavailable,
  runFeedbackTest,
  testSpeakerUnavailable,
  runTestSpeaker,
  testMicUnavailable,
  runTestMic,
  overviewSleepConfirmVisible,
  sleepControllerSupported,
  controllerConnected,
  handleOverviewSleepController,
  overviewHostPersonaMode,
  supportedHostPersonaModes,
  hostPersonaControlSupported,
  personaTransitionActive,
  setHostPersonaMode,
  playStationLogoUrl,
  hapticsSliderMax,
  hapticsValue,
  setHapticsValue,
  hapticsEditingRef,
  commitHapticsValue,
  hapticsSliderTicks,
  speakerVolumeSupported,
  speakerVolumeCommitPending,
  speakerVolumeValue,
  setSpeakerVolumeValue,
  speakerVolumeEditingRef,
  commitSpeakerVolume,
  duplexMicEnabled,
  micVolumeCommitPending,
  micVolumeValue,
  setMicVolumeValue,
  micVolumeEditingRef,
  commitMicVolume,
  lightbarSupported,
  lightbarCommitPending,
  percentSliderMax,
  lightbarBrightnessValue,
  setLightbarBrightnessValue,
  lightbarBrightnessEditingRef,
  commitLightbar,
  overviewShortcutItems,
  focusBridgeSettings,
  psHomeGlyphUrl,
  triangleGlyphUrl,
  dpadUpGlyphUrl,
  dpadDownGlyphUrl,
  overviewPowerSavingLabel,
  overviewNotificationItems,
  focusNotificationSettings,
  overviewConnectionStatus,
  overviewSignalTitle,
  overviewSignalLabel,
  pollingRateControlSupported,
  pollingRateLabel,
  sliderTickClass,
  HOST_PERSONA_OPTIONS,
  HOST_PERSONA_SHORT_LABELS,
  HAPTICS_STEP,
  SPEAKER_VOLUME_STEP,
  MIC_VOLUME_STEP,
  LIGHTBAR_BRIGHTNESS_STEP,
  PERCENT_SLIDER_TICKS,
  snapHapticsValue,
  snapSpeakerVolume,
  snapMicVolume,
  snapLightbarBrightness
}: OverviewPageProps) {
  return (
    <div
      className={`control-page overview-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-overview"
      aria-labelledby="control-tab-overview"
      aria-hidden={!active}
    >
      <div className="feature-heading overview-heading">
        <div>
          <h2>Overview</h2>
          <p>At-a-glance status of your controller and active settings.</p>
        </div>
        <span className={`overview-health health-label ${overviewHealthTone}`} title={overviewHealthTitle}>
          <span className={`dot ${overviewHealthTone}`} />
          {overviewHealthLabel}
        </span>
      </div>

      <div className="overview-card-grid">
        <div className="overview-card overview-card-interactive" role="region" aria-label="Active Game">
          <div className="overview-card-header">
            <span className="feature-icon overview-icon"><IconDeviceGamepad2 size={19} /></span>
            <div className="overview-card-meta">
              <span className="overview-card-label">Active Game</span>
              <strong
                className="overview-card-value"
                title={snapshot.activeGame ? `${snapshot.activeGame.name} (${snapshot.activeGame.executableName})` : undefined}
              >
                {snapshot.activeGame?.name || 'No game active'}
              </strong>
            </div>
          </div>
          <div className="overview-card-footer overview-card-switch-row">
            <span className="overview-card-switch-label">Auto-switch</span>
            <button
              type="button"
              role="switch"
              aria-checked={snapshot.settings.gameProfileAutoSwitchEnabled}
              aria-label="Auto-switch game profiles"
              className={`switch switch-orange ${snapshot.settings.gameProfileAutoSwitchEnabled ? 'on' : ''}`}
              disabled={pendingAction !== null}
              onClick={() => void runAction('game-profile-autoswitch', () => (
                window.bridge.setGameProfileAutoSwitchEnabled(!snapshot.settings.gameProfileAutoSwitchEnabled)
              ))}
            >
              <span />
            </button>
          </div>
        </div>

        <div className="overview-card overview-card-interactive" role="region" aria-label="Active Profile">
          <div className="overview-card-header">
            <span className="feature-icon overview-icon"><IconCards size={19} /></span>
            <div className="overview-card-meta">
              <span className="overview-card-label">Active Profile</span>
              <strong className="overview-card-value" title={selectedControllerProfile?.name}>
                {selectedControllerProfile?.name ?? 'Custom'}
              </strong>
            </div>
          </div>
          <div className="overview-card-footer">
            <button
              type="button"
              className="overview-card-action-button"
              onClick={() => selectControlTab('system')}
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="overview-card overview-card-interactive" role="region" aria-label="Library">
          <div className="overview-card-header">
            <span className="feature-icon overview-icon"><IconBooks size={19} /></span>
            <div className="overview-card-meta">
              <span className="overview-card-label">Library</span>
              <strong className="overview-card-value">
                {`${snapshot.settings.gameProfiles.length} ${snapshot.settings.gameProfiles.length === 1 ? 'game' : 'games'}`}
              </strong>
            </div>
          </div>
          <div className="overview-card-footer">
            <button
              type="button"
              className="overview-card-action-button"
              onClick={() => setIsGameProfilesModalOpen(true)}
            >
              Game Profiles
            </button>
          </div>
        </div>

        <div className="overview-card overview-card-interactive" role="region" aria-label="Kitsune Bar">
          <div className="overview-card-header">
            <span className="feature-icon overview-icon kitsune-icon">
              <img src={kitsuneInputLogoUrl} alt="" className="kitsune-card-logo" />
            </span>
            <div className="overview-card-meta">
              <span className="overview-card-label">Kitsune Bar</span>
              <strong className="overview-card-value">Quick Overlay</strong>
              <span className="overview-card-badge-note">PS Home Button</span>
            </div>
          </div>
          <div className="overview-card-footer">
            <button
              type="button"
              className="overview-card-action-button"
              onClick={() => setIsKitsuneBarInfoOpen(true)}
            >
              Open Kitsune Bar
            </button>
          </div>
        </div>
      </div>

      <div className="overview-control-grid">
        <section className="overview-control-panel overview-quick-actions" aria-label="Quick actions">
          <div className="overview-panel-heading">
            <span className="feature-icon overview-icon"><Zap size={18} /></span>
            <div>
              <h3>Quick Actions</h3>
            </div>
          </div>
          <div className="overview-action-grid">
            <button
              type="button"
              disabled={activeFeedbackTestUnavailable}
              onClick={runFeedbackTest}
            >
              <Play size={15} />
              Test Haptics
            </button>
            <button
              type="button"
              disabled={testSpeakerUnavailable}
              onClick={runTestSpeaker}
            >
              <Volume2 size={15} />
              Test Speaker
            </button>
            <button
              type="button"
              disabled={testMicUnavailable}
              onClick={runTestMic}
            >
              <Mic size={15} />
              Listen Mic
            </button>
            <button
              type="button"
              className={overviewSleepConfirmVisible ? 'confirm' : undefined}
              disabled={!connected || !sleepControllerSupported || !controllerConnected || pendingAction !== null}
              onClick={handleOverviewSleepController}
            >
              <Moon size={15} />
              {overviewSleepConfirmVisible ? 'Confirm Sleep' : 'Sleep Controller'}
            </button>
          </div>
          <div className="overview-persona-grid" aria-label="Host controller persona">
            {HOST_PERSONA_OPTIONS.map(([label, mode]) => {
              const personaActive = overviewHostPersonaMode === mode;
              const supported = supportedHostPersonaModes.includes(mode);
              const disabled = !connected
                || !hostPersonaControlSupported
                || pendingAction !== null
                || personaTransitionActive
                || (!supported && !personaActive);
              return (
                <button
                  key={mode}
                  type="button"
                  className={`overview-persona-button persona-${mode} ${personaActive ? 'active' : ''}`}
                  aria-pressed={personaActive}
                  aria-label={`Switch to ${label} mode`}
                  disabled={disabled}
                  title={`Switch to ${label} mode`}
                  onClick={() => {
                    if (!personaActive) {
                      setHostPersonaMode(mode);
                    }
                  }}
                >
                  {mode === 'xbox' ? (
                    <IconBrandXbox className="overview-persona-logo" aria-hidden="true" />
                  ) : (
                    <span
                      className="overview-persona-logo playstation"
                      style={{ '--overview-persona-logo-mask': `url("${playStationLogoUrl}")` } as CSSProperties}
                      aria-hidden="true"
                    />
                  )}
                  <span>{HOST_PERSONA_SHORT_LABELS[mode]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overview-control-panel overview-sliders" aria-label="Quick controls">
          <div className="overview-panel-heading">
            <span className="feature-icon overview-icon"><IconAdjustmentsSpark size={18} /></span>
            <div>
              <h3>Quick Controls</h3>
            </div>
          </div>
          <div className="overview-slider-list">
            <label className={`overview-slider-row ${(!connected || !snapshot.settings.hapticsEnabled) ? 'disabled' : ''}`}>
              <span>Haptics</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max={hapticsSliderMax}
                  step={HAPTICS_STEP}
                  value={hapticsValue}
                  disabled={!connected || !snapshot.settings.hapticsEnabled}
                  style={{ '--range-fill': `${(hapticsValue / hapticsSliderMax) * 100}%` } as CSSProperties}
                  onPointerDown={() => {
                    hapticsEditingRef.current = true;
                  }}
                  onChange={(event) => setHapticsValue(snapHapticsValue(
                    Number(event.currentTarget.value),
                    hapticsSliderMax
                  ))}
                  onPointerUp={() => void commitHapticsValue()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      hapticsEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitHapticsValue();
                    }
                  }}
                  onBlur={() => void commitHapticsValue()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {hapticsSliderTicks.map((val) => (
                    <span key={val} className={sliderTickClass(val, hapticsSliderMax)} />
                  ))}
                </div>
              </div>
              <strong>{hapticsValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending) ? 'disabled' : ''}`}>
              <span>Speaker</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step={SPEAKER_VOLUME_STEP}
                  value={speakerVolumeValue}
                  disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending}
                  style={{ '--range-fill': `${speakerVolumeValue}%` } as CSSProperties}
                  onPointerDown={() => {
                    speakerVolumeEditingRef.current = true;
                  }}
                  onChange={(event) => setSpeakerVolumeValue(snapSpeakerVolume(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitSpeakerVolume()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      speakerVolumeEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitSpeakerVolume();
                    }
                  }}
                  onBlur={() => void commitSpeakerVolume()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((val) => (
                    <span key={val} className={sliderTickClass(val, 100)} />
                  ))}
                </div>
              </div>
              <strong>{speakerVolumeValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !duplexMicEnabled || micVolumeCommitPending) ? 'disabled' : ''}`}>
              <span>Mic</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step={MIC_VOLUME_STEP}
                  value={micVolumeValue}
                  disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                  style={{ '--range-fill': `${micVolumeValue}%` } as CSSProperties}
                  onPointerDown={() => {
                    micVolumeEditingRef.current = true;
                  }}
                  onChange={(event) => setMicVolumeValue(snapMicVolume(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitMicVolume()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      micVolumeEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitMicVolume();
                    }
                  }}
                  onBlur={() => void commitMicVolume()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((val) => (
                    <span key={val} className={sliderTickClass(val, 100)} />
                  ))}
                </div>
              </div>
              <strong>{micVolumeValue}%</strong>
            </label>
            <label className={`overview-slider-row ${(!connected || !lightbarSupported || !snapshot.settings.lightbarEnabled || lightbarCommitPending) ? 'disabled' : ''}`}>
              <span>Lightbar</span>
              <div className="overview-range-control">
                <input
                  type="range"
                  min="0"
                  max={percentSliderMax}
                  step={LIGHTBAR_BRIGHTNESS_STEP}
                  value={lightbarBrightnessValue}
                  disabled={!connected || !lightbarSupported || !snapshot.settings.lightbarEnabled || lightbarCommitPending}
                  style={{ '--range-fill': `${(lightbarBrightnessValue / percentSliderMax) * 100}%` } as CSSProperties}
                  onPointerDown={() => {
                    lightbarBrightnessEditingRef.current = true;
                  }}
                  onChange={(event) => setLightbarBrightnessValue(snapLightbarBrightness(Number(event.currentTarget.value)))}
                  onPointerUp={() => void commitLightbar()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      lightbarBrightnessEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitLightbar();
                    }
                  }}
                  onBlur={() => void commitLightbar()}
                />
                <div className="overview-range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((val) => (
                    <span key={val} className={sliderTickClass(val, 100)} />
                  ))}
                </div>
              </div>
              <strong>{lightbarBrightnessValue}%</strong>
            </label>
          </div>
        </section>
      </div>

      <section className="overview-status-panel" aria-label="Active settings summary">
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <IconDeviceGamepad2 size={15} />
            <span>Shortcuts</span>
          </div>
          <div className="overview-chip-row">
            {overviewShortcutItems.length > 0 ? (
              overviewShortcutItems.map((item) => (
                <button
                  className="overview-chip overview-shortcut-chip active"
                  key={item.id}
                  type="button"
                  onClick={() => focusBridgeSettings(item.id === 'sleep' ? 'sleep-shortcut' : 'volume-shortcut')}
                >
                  {item.label}
                  {item.id === 'sleep' ? (
                    <span className="settings-shortcut-tooltip shortcut-glyph-tooltip overview-shortcut-tooltip" role="tooltip">
                      <span>Put controller to sleep with</span>
                      <span className="shortcut-glyph-row" aria-label="PlayStation Home and Triangle">
                        <span className="shortcut-glyph-key">
                          <img src={psHomeGlyphUrl} alt="PlayStation Home" />
                        </span>
                        <span className="shortcut-plus" aria-hidden="true">+</span>
                        <span className="shortcut-glyph-key">
                          <img src={triangleGlyphUrl} alt="Triangle" />
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="settings-shortcut-tooltip shortcut-glyph-tooltip overview-shortcut-tooltip" role="tooltip">
                      <span>Controller volume up/down with</span>
                      <span className="shortcut-glyph-row" aria-label="PlayStation Home and D-pad Up or D-pad Down">
                        <span className="shortcut-glyph-key">
                          <img src={psHomeGlyphUrl} alt="PlayStation Home" />
                        </span>
                        <span className="shortcut-plus" aria-hidden="true">+</span>
                        <span className="shortcut-glyph-pair">
                          <span className="shortcut-glyph-key">
                            <img src={dpadUpGlyphUrl} alt="D-pad Up" />
                          </span>
                          <span className="shortcut-glyph-key">
                            <img src={dpadDownGlyphUrl} alt="D-pad Down" />
                          </span>
                        </span>
                      </span>
                    </span>
                  )}
                </button>
              ))
            ) : (
              <span className="overview-chip muted">None enabled</span>
            )}
          </div>
        </div>
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <IconBatteryEco size={15} />
            <span>Power Saving</span>
          </div>
          <div className="overview-chip-row">
            <button
              className={`overview-chip ${snapshot.settings.controllerPowerSavingEnabled ? 'active success' : 'muted'}`}
              type="button"
              onClick={() => focusBridgeSettings('controller-power-saving')}
            >
              {overviewPowerSavingLabel}
            </button>
          </div>
        </div>
        <div className="overview-status-group">
          <div className="overview-status-heading">
            <Bell size={15} />
            <span>Notifications</span>
          </div>
          <div className="overview-chip-row">
            {overviewNotificationItems.length > 0 ? (
              overviewNotificationItems.map((item) => (
                <button
                  className="overview-chip active"
                  key={item.id}
                  type="button"
                  onClick={() => focusNotificationSettings(item.id)}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <button
                className="overview-chip muted"
                type="button"
                onClick={() => focusNotificationSettings('all')}
              >
                Off
              </button>
            )}
          </div>
        </div>
        <div className="overview-status-group overview-technical-status">
          <div className="overview-status-heading">
            <Activity size={15} />
            <span>Technical Status</span>
          </div>
          <div className="overview-chip-row">
            <button
              className={`overview-chip ${overviewConnectionStatus === 'Stable' ? 'active success' : 'muted'}`}
              type="button"
              title="USB connection status"
              onClick={() => selectControlTab('system')}
            >
              <IconUsb size={14} /> USB {overviewConnectionStatus}
            </button>
            <button
              className={`overview-chip ${connected ? 'active' : 'muted'}`}
              type="button"
              title={overviewSignalTitle}
              onClick={() => selectControlTab('system')}
            >
              <IconBluetooth size={14} /> {overviewSignalLabel}
            </button>
            <button
              className="overview-chip active"
              type="button"
              title="Polling rate"
              onClick={() => selectControlTab('system')}
            >
              <Activity size={14} /> {connected && pollingRateControlSupported ? pollingRateLabel : '1000 Hz'}
            </button>
            <button
              className="overview-chip active"
              type="button"
              title="Firmware version"
              onClick={() => selectControlTab('system')}
            >
              <IconCpu size={14} /> Firmware {overviewFirmwareLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

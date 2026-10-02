import {
  useEffect,
  useState,
  type CSSProperties
} from 'react';
import {
  IconBrandXbox,
  IconDeviceFloppy as Save,
  IconEdit as Pencil,
  IconKeyboard as Keyboard,
  IconMicrophoneOff as MicOff,
  IconRefresh as RefreshCcw,
  IconSettings as Settings2,
  IconStethoscope,
  IconTool,
  IconTrash as Trash2,
  IconVolumeOff as VolumeX
} from '@tabler/icons-react';
import playStationLogoUrl from '../../../../assets/brand/playstation-logo.svg';
import type { BridgeSnapshot } from '../../shared/types';
import type {
  HostPersonaMode,
  MuteButtonMode,
  MuteKeyboardBehavior,
  PollingRateMode
} from '../../shared/protocol';
import { CustomSelect } from '../components/ui/CustomSelect';
import { ProfileSaveStatus } from '../components/ui/ProfileSaveStatus';
import {
  SystemProfileSummary,
  controllerProfileSettingsFromSnapshot
} from '../components/ui/SystemProfileSummary';

export function HostPersonaOption({ label, value }: { label: string; value: HostPersonaMode }) {
  const sonyPersona = value === 'dualsense' || value === 'dualsense-edge' || value === 'ds4';
  return (
    <span className="host-persona-option">
      {sonyPersona ? (
        <span
          className="host-persona-brand-icon"
          style={{ '--host-persona-brand-mask': `url("${playStationLogoUrl}")` } as CSSProperties}
          aria-hidden="true"
        />
      ) : (
        <IconBrandXbox size={18} aria-hidden="true" />
      )}
      <span className="host-persona-label">{label}</span>
    </span>
  );
}

export function UptimeValue({
  active,
  lastPollAt,
  uptimeSeconds
}: {
  active: boolean;
  lastPollAt: number | null;
  uptimeSeconds: number | null;
}) {
  const [displayUptime, setDisplayUptime] = useState<number | null>(uptimeSeconds);

  useEffect(() => {
    if (!active || !lastPollAt || uptimeSeconds === null) {
      setDisplayUptime(uptimeSeconds);
      return;
    }

    const updateUptime = () => {
      const elapsedSeconds = Math.floor((Date.now() - lastPollAt) / 1000);
      setDisplayUptime(uptimeSeconds + Math.max(0, elapsedSeconds));
    };

    updateUptime();
    const handle = window.setInterval(updateUptime, 1000);
    return () => window.clearInterval(handle);
  }, [active, lastPollAt, uptimeSeconds]);

  return <span className="uptime-value">{displayUptime ?? '--'}s</span>;
}

export interface SystemPageProps {
  active: boolean;
  connected: boolean;
  pendingAction: string | null;
  openDeviceCleanupConfirm: () => void;
  selectedControllerProfileId: string;
  controllerProfileOptions: ReadonlyArray<readonly [string, string]>;
  selectControllerProfile: (profileId: string) => void;
  hapticsCommitPending: boolean;
  speakerVolumeCommitPending: boolean;
  lightbarCommitPending: boolean;
  runAction: (label: string, action: () => Promise<BridgeSnapshot>) => Promise<void>;
  snapshot: BridgeSnapshot;
  muteButtonActionsSupported: boolean;
  MUTE_BUTTON_MODE_OPTIONS: ReadonlyArray<readonly [string, MuteButtonMode]>;
  setMuteButtonAction: (
    mode: MuteButtonMode,
    usage?: number,
    modifiers?: number,
    behavior?: MuteKeyboardBehavior,
    chordStarter?: boolean
  ) => void;
  MUTE_KEY_OPTIONS: ReadonlyArray<readonly [string, number]>;
  MUTE_KEYBOARD_BEHAVIOR_OPTIONS: ReadonlyArray<readonly [string, MuteKeyboardBehavior]>;
  MUTE_MODIFIER_OPTIONS: ReadonlyArray<readonly [string, number]>;
  setMuteModifier: (bit: number, enabled: boolean) => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
  diagnosticsVisible: boolean;
  ackText: string;
  firmwareLogStatus: string;
  chooseFirmwareLogDirectory: () => void;
  clearFirmwareLogDirectory: () => void;
  audioDebugText: string;
  audioEventLogText: string;
  triggerTraceText: string;
  feedbackTraceText: string;
  controllerConnected: boolean;
  controllerName: (type: string | undefined) => string;
  pollingRateControlSupported: boolean;
  POLLING_RATE_OPTIONS: ReadonlyArray<readonly [string, PollingRateMode]>;
  setPollingRateMode: (mode: PollingRateMode) => void;
  hostPersonaControlSupported: boolean;
  personaTransitionActive: boolean;
  hostPersonaOptions: ReadonlyArray<readonly [string, HostPersonaMode]>;
  HOST_PERSONA_OPTIONS: ReadonlyArray<readonly [string, HostPersonaMode]>;
  setHostPersonaMode: (mode: HostPersonaMode) => void;
  systemHealthTone: string;
  healthTitle: (snapshot: BridgeSnapshot | null | undefined) => string | undefined;
  statusTone: string;
  healthLabel: (snapshot: BridgeSnapshot | null | undefined) => string;
  selectedControllerProfileIsDefault: boolean;
  renameControllerProfile: () => void;
  saveControllerProfile: () => void;
  canDeleteControllerProfile: boolean;
  deleteControllerProfile: () => void;
  controllerPowerSavingActive: boolean;
}

export function SystemPage({
  active,
  connected,
  pendingAction,
  openDeviceCleanupConfirm,
  selectedControllerProfileId,
  controllerProfileOptions,
  selectControllerProfile,
  hapticsCommitPending,
  speakerVolumeCommitPending,
  lightbarCommitPending,
  runAction,
  snapshot,
  muteButtonActionsSupported,
  MUTE_BUTTON_MODE_OPTIONS,
  setMuteButtonAction,
  MUTE_KEY_OPTIONS,
  MUTE_KEYBOARD_BEHAVIOR_OPTIONS,
  MUTE_MODIFIER_OPTIONS,
  setMuteModifier,
  showDiagnostics,
  setShowDiagnostics,
  diagnosticsVisible,
  ackText,
  firmwareLogStatus,
  chooseFirmwareLogDirectory,
  clearFirmwareLogDirectory,
  audioDebugText,
  audioEventLogText,
  triggerTraceText,
  feedbackTraceText,
  controllerConnected,
  controllerName,
  pollingRateControlSupported,
  POLLING_RATE_OPTIONS,
  setPollingRateMode,
  hostPersonaControlSupported,
  personaTransitionActive,
  hostPersonaOptions,
  HOST_PERSONA_OPTIONS,
  setHostPersonaMode,
  systemHealthTone,
  healthTitle,
  statusTone,
  healthLabel,
  selectedControllerProfileIsDefault,
  renameControllerProfile,
  saveControllerProfile,
  canDeleteControllerProfile,
  deleteControllerProfile,
  controllerPowerSavingActive
}: SystemPageProps) {
  return (
    <div
      className={`control-page system-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-system"
      aria-labelledby="control-tab-system"
      aria-hidden={!active}
    >
      <div className="feature-heading system-heading">
        <div>
          <h2>System</h2>
          <p>Configure bridge behavior and defaults.</p>
        </div>
        <div className="profile-controls">
          <button
            className="heading-icon-action emergency-repair-button"
            type="button"
            title="Emergency device repair"
            aria-label="Emergency device repair"
            disabled={pendingAction !== null}
            onClick={openDeviceCleanupConfirm}
          >
            <IconTool size={20} />
          </button>
          <CustomSelect
            value={selectedControllerProfileId}
            disabled={!connected || pendingAction !== null}
            options={controllerProfileOptions}
            ariaLabel="System profile"
            onChange={selectControllerProfile}
          />
          <button
            className="heading-action"
            type="button"
            disabled={!connected || pendingAction !== null || hapticsCommitPending || speakerVolumeCommitPending || lightbarCommitPending}
            onClick={() => void runAction('restore', () => window.bridge.restoreDefaults())}
          >
            <RefreshCcw size={18} />
            Restore Defaults
          </button>
        </div>
      </div>

      <div className="feature-card-grid">
        <section className="system-card mute-card">
          <div className="feature-card-title system-card-heading">
            <span className="feature-icon system-icon icon-wide"><MicOff size={20} /></span>
            <div className="title-copy">
              <h3>Mute Button</h3>
              <p>Set controller mute behavior.</p>
            </div>
          </div>
          <div className="system-fields">
            <div className="select-row">
              <span>Behavior</span>
              <CustomSelect
                value={snapshot.settings.muteButtonMode}
                disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                options={MUTE_BUTTON_MODE_OPTIONS}
                ariaLabel="Mute button behavior"
                onChange={(mode) => setMuteButtonAction(mode)}
              />
            </div>
            {snapshot.settings.muteButtonMode === 'keyboard' && (
              <>
                <div className="select-row">
                  <span>Key</span>
                  <CustomSelect
                    value={snapshot.settings.muteKeyboardUsage}
                    disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                    options={MUTE_KEY_OPTIONS}
                    ariaLabel="Mute keyboard key"
                    onChange={(usage) => setMuteButtonAction('keyboard', usage)}
                  />
                </div>
                <div className="select-row">
                  <span>Press Mode</span>
                  <CustomSelect
                    value={snapshot.settings.muteKeyboardBehavior}
                    disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                    options={MUTE_KEYBOARD_BEHAVIOR_OPTIONS}
                    ariaLabel="Mute keyboard press mode"
                    onChange={(behavior) => setMuteButtonAction('keyboard', undefined, undefined, behavior)}
                  />
                </div>
                <div className="modifier-block">
                  <div className="modifier-grid" aria-label="Keyboard modifiers">
                    {MUTE_MODIFIER_OPTIONS.map(([label, bit]) => {
                      const enabled = (snapshot.settings.muteKeyboardModifiers & bit) !== 0;
                      return (
                        <button
                          key={bit}
                          type="button"
                          className={enabled ? 'active' : ''}
                          disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                          onClick={() => setMuteModifier(bit, !enabled)}
                        >
                          <Keyboard size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="select-row">
                  <span
                    className="settings-menu-copy-tooltip chord-starter-label"
                    tabIndex={0}
                    aria-describedby="mute-chord-starter-tooltip"
                  >
                    Chord Starter
                    <span
                      id="mute-chord-starter-tooltip"
                      className="settings-shortcut-tooltip chord-starter-tooltip"
                      role="tooltip"
                    >
                      Lets Mute start a chord. When enabled, the keyboard key waits 250ms so a chord can be detected first.
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapshot.settings.muteKeyboardChordStarterEnabled}
                    className={`switch ${snapshot.settings.muteKeyboardChordStarterEnabled ? 'on' : ''}`}
                    disabled={!connected || !muteButtonActionsSupported || pendingAction !== null}
                    onClick={() => setMuteButtonAction(
                      'keyboard',
                      undefined,
                      undefined,
                      undefined,
                      !snapshot.settings.muteKeyboardChordStarterEnabled
                    )}
                  >
                    <span />
                  </button>
                </div>
              </>
            )}
            {snapshot.settings.muteButtonMode === 'quiet' && (
              <div className={`quiet-state ${snapshot.status?.quietModeEnabled ? 'active' : ''}`}>
                <VolumeX size={18} />
                <span>{snapshot.status?.quietModeEnabled ? 'Controller Quiet On' : 'Controller Quiet Off'}</span>
              </div>
            )}
          </div>
        </section>

        <section className={`system-card device-card ${showDiagnostics ? 'expanded' : ''}`}>
          <div className="feature-card-title system-card-heading">
            <span className="feature-icon system-icon icon-wide">
              {showDiagnostics ? <IconStethoscope size={20} /> : <Settings2 size={20} />}
            </span>
            <div className="title-copy">
              <h3>{showDiagnostics ? 'Diagnostics' : 'Device'}</h3>
              <p>
                {showDiagnostics
                  ? 'Debug Data'
                  : 'Firmware'}
              </p>
            </div>
            <div className="dual-selector system-mode-selector" role="tablist" aria-label="System control mode">
              <button
                type="button"
                role="tab"
                aria-selected={!showDiagnostics}
                className={!showDiagnostics ? 'active' : ''}
                onClick={() => setShowDiagnostics(false)}
              >
                Device
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showDiagnostics}
                className={showDiagnostics ? 'active' : ''}
                onClick={() => setShowDiagnostics(true)}
              >
                Diagnostics
              </button>
            </div>
          </div>
          {showDiagnostics ? (
            <div className="device-diagnostics">
              <dl>
                <div><dt>Protocol</dt><dd>{snapshot.diagnostics.protocolVersion ?? '--'}</dd></div>
                <div>
                  <dt>Uptime</dt>
                  <dd>
                    <UptimeValue
                      active={diagnosticsVisible}
                      lastPollAt={snapshot.diagnostics.lastPollAt}
                      uptimeSeconds={snapshot.diagnostics.uptimeSeconds}
                    />
                  </dd>
                </div>
                <div>
                  <dt>Revision</dt>
                  <dd><span className="diagnostic-number">{snapshot.diagnostics.settingsRevision ?? '--'}</span></dd>
                </div>
                <div><dt>Last ACK</dt><dd>{ackText}</dd></div>
                <div><dt>HID Path</dt><dd>{snapshot.diagnostics.hidPath ?? '--'}</dd></div>
                <div className="debug-entry firmware-log-entry">
                  <dt>Firmware UART Log</dt>
                  <dd>
                    <div className="firmware-log-details">
                      <span>{firmwareLogStatus}</span>
                      <span title={snapshot.diagnostics.firmwareLogDirectory ?? undefined}>
                        Folder: {snapshot.diagnostics.firmwareLogDirectory ?? '--'}
                      </span>
                      <span title={snapshot.diagnostics.firmwareLogPath ?? undefined}>
                        File: {snapshot.diagnostics.firmwareLogPath ?? '--'}
                      </span>
                      <span>
                        SRAM overwrite loss: <span className="diagnostic-number">{snapshot.diagnostics.firmwareLogDroppedBytes}</span> bytes
                      </span>
                    </div>
                    <div className="firmware-log-actions">
                      <button
                        type="button"
                        className="secondary-action"
                        disabled={pendingAction !== null}
                        onClick={chooseFirmwareLogDirectory}
                      >
                        Choose Folder
                      </button>
                      {snapshot.diagnostics.firmwareLogDirectory ? (
                        <button
                          type="button"
                          className="secondary-action"
                          disabled={pendingAction !== null}
                          onClick={clearFirmwareLogDirectory}
                        >
                          Stop Capture
                        </button>
                      ) : null}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt>Audio Log</dt>
                  <dd title={snapshot.diagnostics.audioDebugLogPath ?? undefined}>
                    {snapshot.diagnostics.audioDebugLogPath ?? '--'}
                  </dd>
                </div>
                <div>
                  <dt>Dropped</dt>
                  <dd><span className="diagnostic-number">{snapshot.diagnostics.audioDebugDroppedCount}</span></dd>
                </div>
                <div>
                  <dt>Trigger Drop</dt>
                  <dd><span className="diagnostic-number">{snapshot.diagnostics.triggerTraceDroppedCount}</span></dd>
                </div>
                <div>
                  <dt>Feedback Drop</dt>
                  <dd><span className="diagnostic-number">{snapshot.diagnostics.feedbackTraceDroppedCount}</span></dd>
                </div>
                <div className="debug-entry">
                  <dt>Audio Debug</dt>
                  <dd>
                    <textarea readOnly value={audioDebugText} aria-label="Audio debug copy text" />
                  </dd>
                </div>
                <div className="debug-entry">
                  <dt>Audio Events</dt>
                  <dd>
                    <textarea readOnly value={audioEventLogText} aria-label="Audio event log text" />
                  </dd>
                </div>
                <div className="debug-entry">
                  <dt>Trigger Trace</dt>
                  <dd>
                    <textarea readOnly value={triggerTraceText} aria-label="Trigger trace text" />
                  </dd>
                </div>
                <div className="debug-entry">
                  <dt>Feedback Trace</dt>
                  <dd>
                    <textarea readOnly value={feedbackTraceText} aria-label="Feedback trace text" />
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="device-list">
              <div className="device-row">
                <span>Firmware</span>
                <strong>{snapshot.status?.firmwareVersion ?? '--'}</strong>
              </div>
              <div className="device-row">
                <span>Controller</span>
                <strong>{controllerConnected ? controllerName(snapshot.status?.controllerType) : '--'}</strong>
              </div>
              <div className="device-row device-control-row">
                <span>Polling Rate</span>
                <CustomSelect
                  value={snapshot.settings.pollingRateMode}
                  disabled={!connected || !pollingRateControlSupported || pendingAction !== null}
                  options={POLLING_RATE_OPTIONS}
                  ariaLabel="Polling rate"
                  onChange={setPollingRateMode}
                />
              </div>
              <div className="device-row device-control-row">
                <span>Host Controller</span>
                <CustomSelect
                  value={snapshot.settings.hostPersonaMode}
                  disabled={!connected || !hostPersonaControlSupported || pendingAction !== null || personaTransitionActive}
                  options={hostPersonaOptions.length > 0 ? hostPersonaOptions : HOST_PERSONA_OPTIONS.slice(0, 1)}
                  className="host-persona-selector"
                  ariaLabel="Host controller persona"
                  getOptionClassName={(_, mode) => (mode === 'xbox' ? 'host-persona-platform-break' : undefined)}
                  renderValue={(label, mode) => <HostPersonaOption label={label} value={mode} />}
                  renderOption={(label, mode) => <HostPersonaOption label={label} value={mode} />}
                  onChange={setHostPersonaMode}
                />
              </div>
              <div className="device-row device-status-row">
                <span>Status</span>
                <strong className={`health-label ${systemHealthTone}`} title={healthTitle(snapshot)}>
                  <span className={`dot ${systemHealthTone === 'good' ? statusTone : systemHealthTone}`} />
                  {healthLabel(snapshot)}
                </strong>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="feature-help-panel system-profile-panel" aria-label="System profiles and tips">
        <div className="system-profile-strip">
          <ProfileSaveStatus />
          <div className="remapping-profile-actions">
            <button
              type="button"
              disabled={selectedControllerProfileIsDefault || pendingAction !== null}
              onClick={renameControllerProfile}
            >
              <Pencil size={15} />
              Rename Profile
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={saveControllerProfile}
            >
              <Save size={15} />
              Save New Profile
            </button>
            <button
              type="button"
              disabled={!canDeleteControllerProfile || pendingAction !== null}
              onClick={deleteControllerProfile}
            >
              <Trash2 size={15} />
              Delete Profile
            </button>
          </div>
        </div>
        <SystemProfileSummary
          settings={controllerProfileSettingsFromSnapshot(snapshot)}
          powerSavingActive={controllerPowerSavingActive}
        />
      </section>
    </div>
  );
}

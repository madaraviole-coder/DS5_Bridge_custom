import {
  ACK_RESULT,
  COMMAND_ID,
  COMPANION_USAGE,
  COMPANION_USAGE_PAGE,
  DEFAULT_BUTTON_REMAP_PROFILE,
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  DEFAULT_CONTROLLER_PROFILE_ID,
  REPORT_ID,
  REPORT_LENGTH,
  ackUserMessage,
  bluetoothAddressPayload,
  buildButtonRemapPayload,
  buildCommandReport,
  buildRadialDeadzonePayload,
  buildChordBindingsPayload,
  buildTouchpadZonePayload,
  buildTurboConfigPayload,
  hostPersonaModeValue,
  parseAckReport,
  parseDeviceIdentityReport,
  parseStatusReport,
  pollingRateModeValue,
  type AdaptiveTriggerPreviewEffect,
  type AudioReactiveHapticsConfig,
  type BridgeAckPayload,
  type BridgePresetId,
  type ChordAssignment,
  type ChordFunction,
  type HostPersonaMode,
  type MuteButtonMode,
  type MuteKeyboardBehavior,
  type PollingRateMode,
  type RemapButtonId,
  type TriggerTestMode,
  type TriggerTestTarget
} from '../shared/protocol';
import type { TouchpadSettings } from '../shared/touchpad-gestures';
import { DEFAULT_TOUCHPAD_SETTINGS } from '../shared/touchpad-gestures';
import type {
  AudioHapticsSession,
  BridgeDiagnostics,
  BridgeSnapshot,
  CompanionSettings,
  PicoFirmwareActionResult,
  TurboSettings,
  UiThemePreset,
  WindowsDeviceCleanupResult
} from '../shared/types';

export const DEFAULT_TURBO_SETTINGS: TurboSettings = {
  enabled: false,
  speedCps: 8,
  humanize: true,
  buttonsMask: 0
};

const WEB_SETTINGS_STORAGE_KEY = 'ds5_bridge_web_settings_v1';

const DEFAULT_WEB_SETTINGS: CompanionSettings = {
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
  lightbarRestoreEnabled: true,
  muteButtonMode: 'normal',
  muteKeyboardUsage: 0x68,
  muteKeyboardModifiers: 0,
  muteKeyboardBehavior: 'tap',
  muteKeyboardChordStarterEnabled: false,
  edgeProfileSwitchingBlocked: false,
  ledEnabled: true,
  playerLedEnabled: true,
  idleDisconnectEnabled: true,
  idleDisconnectTimeoutMinutes: 15,
  usbSuspendDisconnectEnabled: true,
  wakeOnConnectEnabled: true,
  sleepKeybindEnabled: false,
  speakerVolumeShortcutEnabled: false,
  pollingRateMode: '1000',
  hostPersonaMode: 'dualsense',
  notifyControllerConnection: false,
  notifyLowBattery: false,
  duplexMicEnabled: true,
  controllerPowerSavingEnabled: false,
  selectedControllerProfileId: DEFAULT_CONTROLLER_PROFILE_ID,
  controllerProfiles: [{
    id: DEFAULT_CONTROLLER_PROFILE_ID,
    name: 'Default',
    settings: {
      leftStickRadialDeadzonePercent: 0,
      rightStickRadialDeadzonePercent: 0,
      hapticsEnabled: true,
      hapticsGainPercent: 100,
      feedbackBoostEnabled: false,
      classicRumbleEnabled: true,
      classicRumbleGainPercent: 100,
      classicRumbleV1Enabled: false,
      adaptiveTriggersEnabled: true,
      triggerEffectIntensityPercent: 100,
      triggerTestMode: 'feedback',
      speakerEnabled: true,
      speakerVolumePercent: 100,
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
      muteButtonMode: 'normal',
      muteKeyboardUsage: 0x68,
      muteKeyboardModifiers: 0,
      muteKeyboardBehavior: 'tap',
      muteKeyboardChordStarterEnabled: false,
      edgeProfileSwitchingBlocked: false,
      sleepKeybindEnabled: false,
      speakerVolumeShortcutEnabled: false,
      pollingRateMode: '1000',
      hostPersonaMode: 'dualsense',
      duplexMicEnabled: true,
      controllerPowerSavingEnabled: false
    }
  }],
  selectedButtonRemappingProfileId: DEFAULT_BUTTON_REMAP_PROFILE_ID,
  buttonRemappingProfiles: [DEFAULT_BUTTON_REMAP_PROFILE],
  buttonRemappingDraft: { ...DEFAULT_BUTTON_REMAP_PROFILE.mappings },
  chordFunctions: [],
  chordAssignments: [],
  touchpadSettings: { ...DEFAULT_TOUCHPAD_SETTINGS },
  turboSettings: { ...DEFAULT_TURBO_SETTINGS }
};

function loadWebSettings(): CompanionSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_WEB_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(WEB_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WEB_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<CompanionSettings>;
    return {
      ...DEFAULT_WEB_SETTINGS,
      ...parsed,
      touchpadSettings: { ...DEFAULT_TOUCHPAD_SETTINGS, ...(parsed.touchpadSettings || {}) },
      turboSettings: { ...DEFAULT_TURBO_SETTINGS, ...(parsed.turboSettings || {}) }
    };
  } catch {
    return { ...DEFAULT_WEB_SETTINGS };
  }
}

function saveWebSettings(settings: CompanionSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(WEB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

function createEmptyDiagnostics(): BridgeDiagnostics {
  return {
    hidPath: 'WebHID',
    protocolVersion: '1.23',
    uptimeSeconds: 0,
    settingsRevision: 1,
    lastAck: null,
    lastError: null,
    firmwareUpdateAvailable: null,
    lastPollAt: null,
    rawDevices: [],
    deviceIdentity: null,
    firmwareLogDirectory: null,
    firmwareLogPath: null,
    firmwareLogEnabled: false,
    firmwareLogDroppedBytes: 0,
    firmwareLogLastError: null,
    audioDebugLogPath: null,
    audioDebugLogLines: [],
    audioDebugDroppedCount: 0,
    audioDebugStats: null,
    triggerTraceLines: [],
    triggerTraceDroppedCount: 0,
    feedbackTraceLines: [],
    feedbackTraceDroppedCount: 0,
    audioStatus: null
  };
}

export interface WebHidDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

export interface WebHidCollectionInfo {
  usagePage: number;
  usage: number;
}

export interface WebHidDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName?: string;
  collections: WebHidCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

export type WebNavigatorWithHid = Navigator & {
  hid: {
    getDevices(): Promise<WebHidDevice[]>;
    requestDevice(options: { filters: WebHidDeviceFilter[] }): Promise<WebHidDevice[]>;
    addEventListener(type: string, listener: (event: any) => void): void;
  };
};

export const WEBHID_DEVICE_FILTERS: WebHidDeviceFilter[] = [
  { usagePage: COMPANION_USAGE_PAGE, usage: COMPANION_USAGE },
  { vendorId: 0x054c, productId: 0x0ce6 },
  { vendorId: 0x054c, productId: 0x0df2 },
  { vendorId: 0x2e8a }
];

export class WebBridgeAdapter {
  readonly isWebHid = true;
  private device: WebHidDevice | null = null;
  private pollIntervalHandle: number | null = null;
  private sequenceCounter = 1;
  private listeners = new Set<(snapshot: BridgeSnapshot) => void>();
  private settings: CompanionSettings;
  private snapshot: BridgeSnapshot;

  constructor() {
    this.settings = loadWebSettings();
    this.snapshot = {
      state: 'no-bridge',
      message: 'Connect DS5 Bridge via WebHID',
      status: null,
      settings: this.settings,
      diagnostics: createEmptyDiagnostics(),
      personaTransition: null,
      bridgeDevices: null
    };

    if (typeof navigator !== 'undefined' && 'hid' in navigator) {
      const hid = (navigator as unknown as WebNavigatorWithHid).hid;
      hid.addEventListener('disconnect', (event: any) => {
        if (event.device === this.device) {
          this.handleDisconnect();
        }
      });
      void this.autoConnect();
    }
  }

  private async autoConnect(): Promise<void> {
    try {
      const hid = (navigator as unknown as WebNavigatorWithHid).hid;
      const devices = await hid.getDevices();
      const matched = devices.find((d) => this.matchesFilter(d));
      if (matched) {
        await this.attachDevice(matched);
      }
    } catch {
      // Ignored
    }
  }

  private matchesFilter(device: WebHidDevice): boolean {
    if (device.vendorId === 0x2e8a || device.vendorId === 0x054c) return true;
    for (const collection of device.collections) {
      if (collection.usagePage === COMPANION_USAGE_PAGE && collection.usage === COMPANION_USAGE) {
        return true;
      }
    }
    return false;
  }

  async connectWebHid(): Promise<BridgeSnapshot> {
    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      this.snapshot.message = 'WebHID API is not supported in this browser. Please use Chrome, Edge, or Brave.';
      this.snapshot.state = 'error';
      this.emitSnapshot();
      return this.snapshot;
    }

    try {
      const hid = (navigator as unknown as WebNavigatorWithHid).hid;
      const devices = await hid.requestDevice({ filters: WEBHID_DEVICE_FILTERS });
      if (devices && devices.length > 0) {
        await this.attachDevice(devices[0]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.snapshot.diagnostics.lastError = message;
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  private async attachDevice(device: WebHidDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }
    this.device = device;
    this.snapshot.state = 'connected';
    this.snapshot.message = `Connected to ${device.productName || 'DS5 Bridge'}`;
    this.snapshot.diagnostics.hidPath = `WebHID:${device.vendorId.toString(16)}:${device.productId.toString(16)}`;
    this.startPolling();
    await this.poll();
  }

  private handleDisconnect(): void {
    this.device = null;
    this.stopPolling();
    this.snapshot.state = 'no-bridge';
    this.snapshot.message = 'Bridge disconnected';
    this.snapshot.status = null;
    this.emitSnapshot();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollIntervalHandle = window.setInterval(() => {
      void this.poll();
    }, 500);
  }

  private stopPolling(): void {
    if (this.pollIntervalHandle !== null) {
      window.clearInterval(this.pollIntervalHandle);
      this.pollIntervalHandle = null;
    }
  }

  private nextSequence(): number {
    const seq = this.sequenceCounter;
    this.sequenceCounter = (this.sequenceCounter + 1) & 0xff || 1;
    return seq;
  }

  private async sendCommand(
    commandId: number,
    value: number,
    extraPayload?: ArrayLike<number>
  ): Promise<BridgeAckPayload> {
    if (!this.device || !this.device.opened) {
      throw new Error('No DS5 Bridge is connected via WebHID.');
    }

    const sequence = this.nextSequence();
    const commandReport = buildCommandReport(commandId, sequence, value, extraPayload);
    const reportId = commandReport[0];
    const data = new Uint8Array(commandReport.slice(1));

    await this.device.sendFeatureReport(reportId, data);

    const ackDataView = await this.device.receiveFeatureReport(REPORT_ID.ACK);
    const rawAckReport = new Uint8Array(REPORT_LENGTH);
    rawAckReport[0] = REPORT_ID.ACK;
    rawAckReport.set(new Uint8Array(ackDataView.buffer, ackDataView.byteOffset, ackDataView.byteLength), 1);

    const ack = parseAckReport(rawAckReport);
    this.snapshot.diagnostics.lastAck = ack;
    if (ack.resultCode !== ACK_RESULT.OK) {
      const msg = ackUserMessage(ack.resultCode);
      this.snapshot.diagnostics.lastError = msg;
      throw new Error(msg);
    }
    this.snapshot.diagnostics.settingsRevision = ack.settingsRevision;
    this.snapshot.diagnostics.lastError = null;
    return ack;
  }

  private async poll(): Promise<void> {
    if (!this.device || !this.device.opened) return;
    try {
      const statusDataView = await this.device.receiveFeatureReport(REPORT_ID.STATUS);
      const rawStatusReport = new Uint8Array(REPORT_LENGTH);
      rawStatusReport[0] = REPORT_ID.STATUS;
      rawStatusReport.set(
        new Uint8Array(statusDataView.buffer, statusDataView.byteOffset, statusDataView.byteLength),
        1
      );

      const status = parseStatusReport(rawStatusReport);
      this.snapshot.status = status;
      this.snapshot.state = 'connected';
      this.snapshot.diagnostics.lastPollAt = Date.now();
      this.snapshot.diagnostics.uptimeSeconds = status.uptimeSeconds;
      this.snapshot.diagnostics.protocolVersion = status.protocolVersion;

      if (!this.snapshot.diagnostics.deviceIdentity) {
        try {
          const identDataView = await this.device.receiveFeatureReport(REPORT_ID.DEVICE_IDENTITY);
          const rawIdentReport = new Uint8Array(REPORT_LENGTH);
          rawIdentReport[0] = REPORT_ID.DEVICE_IDENTITY;
          rawIdentReport.set(
            new Uint8Array(identDataView.buffer, identDataView.byteOffset, identDataView.byteLength),
            1
          );
          this.snapshot.diagnostics.deviceIdentity = parseDeviceIdentityReport(rawIdentReport);
        } catch {
          // Ignore if optional report fails
        }
      }

      this.emitSnapshot();
    } catch {
      // Device might have disconnected or busy
    }
  }

  private emitSnapshot(): void {
    this.snapshot = {
      ...this.snapshot,
      settings: { ...this.settings }
    };
    for (const listener of this.listeners) {
      try {
        listener(this.snapshot);
      } catch {
        // Ignore listener error
      }
    }
  }

  onSnapshot(callback: (snapshot: BridgeSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.snapshot);
    return () => this.listeners.delete(callback);
  }

  async getStatus(): Promise<BridgeSnapshot> {
    if (this.device && this.device.opened) {
      await this.poll();
    }
    return this.snapshot;
  }

  async listDevices(): Promise<any> {
    if (typeof navigator !== 'undefined' && 'hid' in navigator) {
      const devices = await navigator.hid.getDevices();
      return devices.map((d) => ({
        vendorId: d.vendorId,
        productId: d.productId,
        productName: d.productName
      }));
    }
    return [];
  }

  async listAudioHapticsSessions(): Promise<AudioHapticsSession[]> {
    return [];
  }

  async applyPreset(presetId: BridgePresetId): Promise<BridgeSnapshot> {
    this.settings.selectedPresetId = presetId;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async selectControllerProfile(profileId: string): Promise<BridgeSnapshot> {
    this.settings.selectedControllerProfileId = profileId;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async saveControllerProfile(name?: string): Promise<BridgeSnapshot> {
    const id = `profile-${Date.now()}`;
    this.settings.controllerProfiles.push({
      id,
      name: name || `Profile ${this.settings.controllerProfiles.length + 1}`,
      settings: {
        leftStickRadialDeadzonePercent: this.settings.leftStickRadialDeadzonePercent,
        rightStickRadialDeadzonePercent: this.settings.rightStickRadialDeadzonePercent,
        hapticsEnabled: this.settings.hapticsEnabled,
        hapticsGainPercent: this.settings.hapticsGainPercent,
        feedbackBoostEnabled: this.settings.feedbackBoostEnabled,
        classicRumbleEnabled: this.settings.classicRumbleEnabled,
        classicRumbleGainPercent: this.settings.classicRumbleGainPercent,
        classicRumbleV1Enabled: this.settings.classicRumbleV1Enabled,
        adaptiveTriggersEnabled: this.settings.adaptiveTriggersEnabled,
        triggerEffectIntensityPercent: this.settings.triggerEffectIntensityPercent,
        triggerTestMode: this.settings.triggerTestMode,
        speakerEnabled: this.settings.speakerEnabled,
        speakerVolumePercent: this.settings.speakerVolumePercent,
        micVolumePercent: this.settings.micVolumePercent,
        micMuted: this.settings.micMuted,
        audioReactiveHapticsEnabled: this.settings.audioReactiveHapticsEnabled,
        audioReactiveHapticsSource: this.settings.audioReactiveHapticsSource,
        audioReactiveHapticsMode: this.settings.audioReactiveHapticsMode,
        audioReactiveHapticsGainPercent: this.settings.audioReactiveHapticsGainPercent,
        audioReactiveHapticsBassFocus: this.settings.audioReactiveHapticsBassFocus,
        audioReactiveHapticsResponse: this.settings.audioReactiveHapticsResponse,
        audioReactiveHapticsAttack: this.settings.audioReactiveHapticsAttack,
        audioReactiveHapticsRelease: this.settings.audioReactiveHapticsRelease,
        lightbarEnabled: this.settings.lightbarEnabled,
        lightbarColor: this.settings.lightbarColor,
        lightbarBrightnessPercent: this.settings.lightbarBrightnessPercent,
        lightbarOverrideEnabled: this.settings.lightbarOverrideEnabled,
        muteButtonMode: this.settings.muteButtonMode,
        muteKeyboardUsage: this.settings.muteKeyboardUsage,
        muteKeyboardModifiers: this.settings.muteKeyboardModifiers,
        muteKeyboardBehavior: this.settings.muteKeyboardBehavior,
        muteKeyboardChordStarterEnabled: this.settings.muteKeyboardChordStarterEnabled,
        edgeProfileSwitchingBlocked: this.settings.edgeProfileSwitchingBlocked,
        sleepKeybindEnabled: this.settings.sleepKeybindEnabled,
        speakerVolumeShortcutEnabled: this.settings.speakerVolumeShortcutEnabled,
        pollingRateMode: this.settings.pollingRateMode,
        hostPersonaMode: this.settings.hostPersonaMode,
        duplexMicEnabled: this.settings.duplexMicEnabled,
        controllerPowerSavingEnabled: this.settings.controllerPowerSavingEnabled
      }
    });
    this.settings.selectedControllerProfileId = id;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async updateControllerProfile(_profileId: string): Promise<BridgeSnapshot> {
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async renameControllerProfile(profileId: string, name: string): Promise<BridgeSnapshot> {
    const profile = this.settings.controllerProfiles.find((p) => p.id === profileId);
    if (profile) {
      profile.name = name;
      saveWebSettings(this.settings);
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  async deleteControllerProfile(profileId: string): Promise<BridgeSnapshot> {
    this.settings.controllerProfiles = this.settings.controllerProfiles.filter((p) => p.id !== profileId);
    if (this.settings.selectedControllerProfileId === profileId) {
      this.settings.selectedControllerProfileId = DEFAULT_CONTROLLER_PROFILE_ID;
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setHapticsGain(value: number): Promise<BridgeSnapshot> {
    this.settings.hapticsGainPercent = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_HAPTICS_GAIN, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setRadialDeadzones(leftPercent: number, rightPercent: number): Promise<BridgeSnapshot> {
    this.settings.leftStickRadialDeadzonePercent = leftPercent;
    this.settings.rightStickRadialDeadzonePercent = rightPercent;
    if (this.device?.opened) {
      const payload = buildRadialDeadzonePayload(leftPercent, rightPercent);
      await this.sendCommand(COMMAND_ID.SET_RADIAL_DEADZONES, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async requestStickInputPreview(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async releaseStickInputPreview(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async setHapticsEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.hapticsEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_HAPTICS_GAIN, value ? this.settings.hapticsGainPercent : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setFeedbackBoostEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.feedbackBoostEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setHapticsBufferLength(value: number): Promise<BridgeSnapshot> {
    this.settings.hapticsBufferLength = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_HAPTICS_BUFFER_LENGTH, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setAudioInterleave(maxConsecutiveAudioSends: number, stateMaxAgeUs: number): Promise<BridgeSnapshot> {
    this.settings.audioInterleaveMaxConsecutiveAudioSends = maxConsecutiveAudioSends;
    this.settings.audioInterleaveStateMaxAgeUs = stateMaxAgeUs;
    if (this.device?.opened) {
      const stateMaxAgeMs = Math.round(stateMaxAgeUs / 1000);
      await this.sendCommand(COMMAND_ID.SET_AUDIO_INTERLEAVE, maxConsecutiveAudioSends, [stateMaxAgeMs]);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setClassicRumbleGain(value: number): Promise<BridgeSnapshot> {
    this.settings.classicRumbleGainPercent = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_CLASSIC_RUMBLE_GAIN, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setClassicRumbleEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.classicRumbleEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_CLASSIC_RUMBLE_GAIN, value ? this.settings.classicRumbleGainPercent : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setClassicRumbleV1Enabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.classicRumbleV1Enabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_CLASSIC_RUMBLE_V1, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setTriggerEffectIntensity(value: number): Promise<BridgeSnapshot> {
    this.settings.triggerEffectIntensityPercent = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_TRIGGER_EFFECT_INTENSITY, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setTriggerTestMode(value: TriggerTestMode): Promise<BridgeSnapshot> {
    this.settings.triggerTestMode = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setAdaptiveTriggersEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.adaptiveTriggersEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_TRIGGER_EFFECT_INTENSITY, value ? this.settings.triggerEffectIntensityPercent : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setSpeakerVolume(value: number): Promise<BridgeSnapshot> {
    this.settings.speakerVolumePercent = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_SPEAKER_VOLUME, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setSpeakerGainLevel(value: number): Promise<BridgeSnapshot> {
    this.settings.speakerGainLevel = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_SPEAKER_GAIN, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async selectBridge(_devicePath: string | null): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async refreshBridgeDevices(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async setBridgeLabel(_uniqueId: string, _label: string | null): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async setSpeakerEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.speakerEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_SPEAKER_VOLUME, value ? this.settings.speakerVolumePercent : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setMicVolume(value: number): Promise<BridgeSnapshot> {
    this.settings.micVolumePercent = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_MIC_VOLUME, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setMicMute(value: boolean): Promise<BridgeSnapshot> {
    this.settings.micMuted = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_MIC_MUTE, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setAudioReactiveHapticsConfig(value: Partial<AudioReactiveHapticsConfig>): Promise<BridgeSnapshot> {
    Object.assign(this.settings, value);
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setDuplexMicEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.duplexMicEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_DUPLEX_ENABLED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLightbarColor(color: string, brightness: number): Promise<BridgeSnapshot> {
    this.settings.lightbarColor = color;
    this.settings.lightbarBrightnessPercent = brightness;
    if (this.device?.opened) {
      const red = parseInt(color.slice(1, 3), 16) || 0;
      const green = parseInt(color.slice(3, 5), 16) || 0;
      const blue = parseInt(color.slice(5, 7), 16) || 0;
      await this.sendCommand(COMMAND_ID.SET_LIGHTBAR_COLOR, brightness, [red, green, blue]);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLightbarEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.lightbarEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLightbarOverrideEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.lightbarOverrideEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_LIGHTBAR_OVERRIDE, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setMuteButtonAction(
    mode: MuteButtonMode,
    usage: number,
    modifiers: number,
    behavior: MuteKeyboardBehavior,
    chordStarterEnabled?: boolean
  ): Promise<BridgeSnapshot> {
    this.settings.muteButtonMode = mode;
    this.settings.muteKeyboardUsage = usage;
    this.settings.muteKeyboardModifiers = modifiers;
    this.settings.muteKeyboardBehavior = behavior;
    this.settings.muteKeyboardChordStarterEnabled = Boolean(chordStarterEnabled);
    if (this.device?.opened) {
      const modeVal = mode === 'keyboard' ? 1 : mode === 'quiet' ? 2 : mode === 'chord' ? 3 : 0;
      await this.sendCommand(COMMAND_ID.SET_MUTE_BUTTON_ACTION, modeVal, [
        usage,
        modifiers | (behavior === 'hold' ? 0x80 : 0) | (chordStarterEnabled ? 0x40 : 0)
      ]);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLedEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.ledEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_LED_ENABLED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setPlayerLedEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.playerLedEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_PLAYER_LED_ENABLED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLightbarRestoreEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.lightbarRestoreEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setIdleDisconnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.idleDisconnectEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_IDLE_DISCONNECT_ENABLED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setIdleDisconnectTimeoutMinutes(value: number): Promise<BridgeSnapshot> {
    this.settings.idleDisconnectTimeoutMinutes = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_IDLE_DISCONNECT_TIMEOUT, value);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setUsbSuspendDisconnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.usbSuspendDisconnectEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_USB_SUSPEND_DISCONNECT, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setWakeOnConnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.wakeOnConnectEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_WAKE_ON_CONNECT, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setSleepKeybindEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.sleepKeybindEnabled = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_SLEEP_KEYBIND_ENABLED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setSpeakerVolumeShortcutEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.speakerVolumeShortcutEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setControllerPowerSavingEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.controllerPowerSavingEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setLaunchAtStartupEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.settings.launchAtStartupEnabled = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setShowBatteryPercentTrayIcon(value: boolean): Promise<BridgeSnapshot> {
    this.settings.showBatteryPercentTrayIcon = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setKitsuneInputPromotionDismissed(value: boolean): Promise<BridgeSnapshot> {
    this.settings.kitsuneInputPromotionDismissed = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setUiScalePercent(value: number): Promise<BridgeSnapshot> {
    this.settings.uiScalePercent = value as any;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setUiThemePreset(value: UiThemePreset): Promise<BridgeSnapshot> {
    this.settings.uiThemePreset = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setPollingRateMode(value: PollingRateMode): Promise<BridgeSnapshot> {
    this.settings.pollingRateMode = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_POLLING_RATE_MODE, pollingRateModeValue(value));
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setHostPersonaMode(value: HostPersonaMode): Promise<BridgeSnapshot> {
    this.settings.hostPersonaMode = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_HOST_PERSONA, hostPersonaModeValue(value));
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async sleepController(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SLEEP_CONTROLLER, 0);
    }
    return this.snapshot;
  }

  async requestControllerScan(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.REQUEST_CONTROLLER_SCAN, 0);
    }
    return this.snapshot;
  }

  async forgetControllerPairings(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.FORGET_CONTROLLER_PAIRINGS, 0);
    }
    return this.snapshot;
  }

  async forgetControllerPairing(bluetoothAddress: string): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      const payload = bluetoothAddressPayload(bluetoothAddress);
      await this.sendCommand(COMMAND_ID.FORGET_CONTROLLER_PAIRING, 0, payload);
    }
    return this.snapshot;
  }

  async mountPicoBootloader(): Promise<PicoFirmwareActionResult> {
    return {
      ok: false,
      action: 'mount',
      message: 'Bootloader drive mounting requires desktop companion.'
    };
  }

  async flashPicoFirmware(): Promise<PicoFirmwareActionResult> {
    return {
      ok: false,
      action: 'flash',
      message: 'Flashing firmware directly requires desktop companion.'
    };
  }

  async nukePicoFlash(): Promise<PicoFirmwareActionResult> {
    return {
      ok: false,
      action: 'nuke',
      message: 'Flash nuke requires desktop companion.'
    };
  }

  async setNotifyControllerConnection(value: boolean): Promise<BridgeSnapshot> {
    this.settings.notifyControllerConnection = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setNotifyLowBattery(value: boolean): Promise<BridgeSnapshot> {
    this.settings.notifyLowBattery = value;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async testNotification(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async testHaptics(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.TEST_HAPTICS, 0);
    }
    return this.snapshot;
  }

  async testSpeaker(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async testClassicRumble(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.TEST_CLASSIC_RUMBLE, 0);
    }
    return this.snapshot;
  }

  async testAdaptiveTriggers(mode?: TriggerTestMode, _target?: TriggerTestTarget): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      const value = mode === 'resistance' ? 2 : 1;
      await this.sendCommand(COMMAND_ID.TEST_ADAPTIVE_TRIGGERS, value);
    }
    return this.snapshot;
  }

  async previewAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.PREVIEW_ADAPTIVE_TRIGGER_EFFECT, effect.effectType);
    }
    return this.snapshot;
  }

  async applyAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.APPLY_ADAPTIVE_TRIGGER_EFFECT, effect.effectType);
    }
    return this.snapshot;
  }

  async resetAdaptiveTriggers(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.RESET_ADAPTIVE_TRIGGERS, 0);
    }
    return this.snapshot;
  }

  async restoreDefaults(): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.RESTORE_DEFAULTS, 0);
    }
    this.settings = { ...DEFAULT_WEB_SETTINGS };
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setButtonRemap(buttonId: RemapButtonId, targetId: RemapButtonId): Promise<BridgeSnapshot> {
    this.settings.buttonRemappingDraft[buttonId] = targetId;
    if (this.device?.opened) {
      const payload = buildButtonRemapPayload(this.settings.buttonRemappingDraft);
      await this.sendCommand(COMMAND_ID.SET_BUTTON_REMAP, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setTouchpadZoneConfig(settings: TouchpadSettings): Promise<BridgeSnapshot> {
    this.settings.touchpadSettings = { ...settings };
    if (this.device?.opened) {
      const payload = buildTouchpadZonePayload(settings);
      await this.sendCommand(COMMAND_ID.SET_TOUCHPAD_ZONE_CONFIG, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setTurboConfig(settings: TurboSettings): Promise<BridgeSnapshot> {
    this.settings.turboSettings = { ...settings };
    if (this.device?.opened) {
      const payload = buildTurboConfigPayload(settings);
      await this.sendCommand(COMMAND_ID.SET_TURBO_CONFIG, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async selectButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    this.settings.selectedButtonRemappingProfileId = profileId;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async saveButtonRemappingProfile(name?: string): Promise<BridgeSnapshot> {
    const id = `remap-${Date.now()}`;
    this.settings.buttonRemappingProfiles.push({
      id,
      name: name || `Remap Profile ${this.settings.buttonRemappingProfiles.length + 1}`,
      mappings: { ...this.settings.buttonRemappingDraft }
    });
    this.settings.selectedButtonRemappingProfileId = id;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async updateButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    const profile = this.settings.buttonRemappingProfiles.find((p) => p.id === profileId);
    if (profile) {
      profile.mappings = { ...this.settings.buttonRemappingDraft };
      saveWebSettings(this.settings);
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  async renameButtonRemappingProfile(profileId: string, name: string): Promise<BridgeSnapshot> {
    const profile = this.settings.buttonRemappingProfiles.find((p) => p.id === profileId);
    if (profile) {
      profile.name = name;
      saveWebSettings(this.settings);
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  async deleteButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    this.settings.buttonRemappingProfiles = this.settings.buttonRemappingProfiles.filter((p) => p.id !== profileId);
    if (this.settings.selectedButtonRemappingProfileId === profileId) {
      this.settings.selectedButtonRemappingProfileId = DEFAULT_BUTTON_REMAP_PROFILE_ID;
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async restoreButtonRemappingDefaults(): Promise<BridgeSnapshot> {
    this.settings.buttonRemappingDraft = { ...DEFAULT_BUTTON_REMAP_PROFILE.mappings };
    if (this.device?.opened) {
      const payload = buildButtonRemapPayload(this.settings.buttonRemappingDraft);
      await this.sendCommand(COMMAND_ID.SET_BUTTON_REMAP, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setChordConfiguration(functions: ChordFunction[], assignments: ChordAssignment[]): Promise<BridgeSnapshot> {
    this.settings.chordFunctions = functions;
    this.settings.chordAssignments = assignments;
    if (this.device?.opened) {
      const payload = buildChordBindingsPayload(assignments, functions);
      await this.sendCommand(COMMAND_ID.SET_CHORD_BINDINGS, assignments.length, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setEdgeProfileSwitchingBlocked(value: boolean): Promise<BridgeSnapshot> {
    this.settings.edgeProfileSwitchingBlocked = value;
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.SET_EDGE_PROFILE_SWITCHING_BLOCKED, value ? 1 : 0);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setChordFunctions(functions: ChordFunction[]): Promise<BridgeSnapshot> {
    this.settings.chordFunctions = functions;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async setChordAssignments(assignments: ChordAssignment[]): Promise<BridgeSnapshot> {
    this.settings.chordAssignments = assignments;
    if (this.device?.opened) {
      const payload = buildChordBindingsPayload(assignments, this.settings.chordFunctions);
      await this.sendCommand(COMMAND_ID.SET_CHORD_BINDINGS, assignments.length, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async repairWindowsDeviceCache(): Promise<WindowsDeviceCleanupResult> {
    return {
      scriptPath: '',
      logPath: '',
      includedBluetooth: false,
      message: 'Windows device cache cleanup is only available in the desktop app.'
    };
  }

  async selectFirmwareLogDirectory(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async clearFirmwareLogDirectory(): Promise<BridgeSnapshot> {
    return this.snapshot;
  }

  async getDiagnostics(): Promise<BridgeDiagnostics> {
    return this.snapshot.diagnostics;
  }

  async minimizeWindow(): Promise<void> {}
  async toggleMaximizeWindow(): Promise<void> {}
  async isWindowMaximized(): Promise<boolean> {
    return false;
  }
  async hideWindow(): Promise<void> {}
  async openExternal(url: string): Promise<void> {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
  onWindowMaximizedChange(_callback: (maximized: boolean) => void): () => void {
    return () => {};
  }
}

export function createWebBridgeAdapter(): WebBridgeAdapter {
  return new WebBridgeAdapter();
}

export function initWebBridgeIfNeeded(): void {
  if (typeof window !== 'undefined' && !(window as any).bridge) {
    (window as any).bridge = createWebBridgeAdapter();
  }
}

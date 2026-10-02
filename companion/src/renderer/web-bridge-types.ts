import {
  DEFAULT_BUTTON_REMAP_PROFILE,
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  DEFAULT_CONTROLLER_PROFILE_ID
} from '../shared/protocol';
import { DEFAULT_TOUCHPAD_SETTINGS } from '../shared/touchpad-gestures';
import type {
  BridgeDiagnostics,
  CompanionSettings,
  TurboSettings
} from '../shared/types';

export const DEFAULT_TURBO_SETTINGS: TurboSettings = {
  enabled: false,
  speedCps: 8,
  humanize: true,
  buttonsMask: 0
};

export const WEB_SETTINGS_STORAGE_KEY = 'ds5_bridge_web_settings_v1';

export const DEFAULT_WEB_SETTINGS: CompanionSettings = {
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
  turboSettings: { ...DEFAULT_TURBO_SETTINGS },
  gameProfileAutoSwitchEnabled: true,
  gameProfiles: []
};

export function loadWebSettings(): CompanionSettings {
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
      turboSettings: { ...DEFAULT_TURBO_SETTINGS, ...(parsed.turboSettings || {}) },
      gameProfileAutoSwitchEnabled: typeof parsed.gameProfileAutoSwitchEnabled === 'boolean'
        ? parsed.gameProfileAutoSwitchEnabled
        : true,
      gameProfiles: Array.isArray(parsed.gameProfiles) ? parsed.gameProfiles : []
    };
  } catch {
    return { ...DEFAULT_WEB_SETTINGS };
  }
}

export function saveWebSettings(settings: CompanionSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(WEB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function createEmptyDiagnostics(): BridgeDiagnostics {
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
  addEventListener?(type: string, listener: (event: any) => void): void;
  removeEventListener?(type: string, listener: (event: any) => void): void;
}

export type WebNavigatorWithHid = Navigator & {
  hid: {
    getDevices(): Promise<WebHidDevice[]>;
    requestDevice(options: { filters: WebHidDeviceFilter[] }): Promise<WebHidDevice[]>;
    addEventListener(type: string, listener: (event: any) => void): void;
  };
};

export interface WebUsbDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

export interface WebUsbEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
}

export interface WebUsbAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubClass: number;
  interfaceProtocol: number;
  endpoints: WebUsbEndpoint[];
}

export interface WebUsbInterface {
  interfaceNumber: number;
  alternates: WebUsbAlternateInterface[];
}

export interface WebUsbConfiguration {
  configurationValue: number;
  interfaces: WebUsbInterface[];
}

export interface WebUsbDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName?: string;
  configuration: WebUsbConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  controlTransferIn(
    setup: {
      requestType: 'standard' | 'class' | 'vendor';
      recipient: 'device' | 'interface' | 'endpoint' | 'other';
      request: number;
      value: number;
      index: number;
    },
    length: number
  ): Promise<{ data?: DataView; status: 'ok' | 'stall' | 'babble' }>;
  controlTransferOut(
    setup: {
      requestType: 'standard' | 'class' | 'vendor';
      recipient: 'device' | 'interface' | 'endpoint' | 'other';
      request: number;
      value: number;
      index: number;
    },
    data?: BufferSource
  ): Promise<{ bytesWritten: number; status: 'ok' | 'stall' | 'babble' }>;
  transferOut(
    endpointNumber: number,
    data: BufferSource
  ): Promise<{ bytesWritten: number; status: 'ok' | 'stall' | 'babble' }>;
}

export type WebNavigatorWithUsb = Navigator & {
  usb: {
    getDevices(): Promise<WebUsbDevice[]>;
    requestDevice(options: { filters: WebUsbDeviceFilter[] }): Promise<WebUsbDevice>;
    addEventListener(type: string, listener: (event: any) => void): void;
  };
};

export const WEBUSB_DEVICE_FILTERS: WebUsbDeviceFilter[] = [
  { vendorId: 0x054c, productId: 0x0ce6 },
  { vendorId: 0x054c, productId: 0x0df2 },
  { vendorId: 0x054c, productId: 0x09cc },
  { vendorId: 0x1209, productId: 0xdb05 },
  { vendorId: 0x1209, productId: 0xdb08 },
  { vendorId: 0x2e8a }
];

export const WEBHID_DEVICE_FILTERS: WebHidDeviceFilter[] = [
  { vendorId: 0x054c, productId: 0x0ce6, usagePage: 1, usage: 5 },
  { vendorId: 0x054c, productId: 0x0df2, usagePage: 1, usage: 5 },
  { vendorId: 0x054c, productId: 0x09cc, usagePage: 1, usage: 5 },
  { vendorId: 0x054c, usagePage: 1, usage: 5 },
  { vendorId: 0x2e8a, usagePage: 1, usage: 5 }
];

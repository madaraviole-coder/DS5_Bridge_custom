import type {
  BridgeAckPayload,
  AudioDebugStatsPayload,
  BridgeStatusPayload,
  ChordAssignment,
  ChordFunction,
  ButtonRemapMap,
  ButtonRemapProfile,
  ControllerProfile,
  CompanionDeviceIdentityPayload,
  AudioStatusPayload,
  BridgePresetId,
  HostPersonaMode,
  AudioReactiveHapticsSource,
  AudioReactiveHapticsBassFocus,
  AudioReactiveHapticsMode,
  AudioReactiveHapticsResponse,
  AudioReactiveHapticsAttack,
  AudioReactiveHapticsRelease,
  MuteButtonMode,
  MuteKeyboardBehavior,
  PollingRateMode,
  StickInputPreviewPayload,
  TriggerTestMode
} from './protocol';
import type { TouchpadSettings } from './touchpad-gestures';

export type UiScalePercent = 75 | 100 | 125 | 150;
export type UiThemePreset = 'light' | 'dark' | 'bubble-gum' | 'pomegranate' | 'kiwi';

export interface CompanionSettings {
  selectedPresetId: BridgePresetId;
  uiScalePercent: UiScalePercent;
  uiThemePreset: UiThemePreset;
  launchAtStartupEnabled: boolean;
  showBatteryPercentTrayIcon: boolean;
  kitsuneInputPromotionDismissed: boolean;
  firmwareLogDirectory: string | null;
  leftStickRadialDeadzonePercent: number;
  rightStickRadialDeadzonePercent: number;
  hapticsEnabled: boolean;
  hapticsGainPercent: number;
  feedbackBoostEnabled: boolean;
  hapticsBufferLength: number;
  audioInterleaveMaxConsecutiveAudioSends: number;
  audioInterleaveStateMaxAgeUs: number;
  classicRumbleEnabled: boolean;
  classicRumbleGainPercent: number;
  classicRumbleV1Enabled: boolean;
  adaptiveTriggersEnabled: boolean;
  triggerEffectIntensityPercent: number;
  triggerTestMode: TriggerTestMode;
  speakerEnabled: boolean;
  speakerVolumePercent: number;
  speakerGainLevel: number;
  selectedBridgePath: string | null;
  bridgeIdentities: Record<string, BridgeIdentityRecord>;
  controllerBindings: Record<string, string>;
  micVolumePercent: number;
  micMuted: boolean;
  audioReactiveHapticsEnabled: boolean;
  audioReactiveHapticsSource: AudioReactiveHapticsSource;
  audioReactiveHapticsMode: AudioReactiveHapticsMode;
  audioReactiveHapticsGainPercent: number;
  audioReactiveHapticsBassFocus: AudioReactiveHapticsBassFocus;
  audioReactiveHapticsResponse: AudioReactiveHapticsResponse;
  audioReactiveHapticsAttack: AudioReactiveHapticsAttack;
  audioReactiveHapticsRelease: AudioReactiveHapticsRelease;
  lightbarEnabled: boolean;
  lightbarColor: string;
  lightbarBrightnessPercent: number;
  lightbarOverrideEnabled: boolean;
  lightbarRestoreEnabled: boolean;
  muteButtonMode: MuteButtonMode;
  muteKeyboardUsage: number;
  muteKeyboardModifiers: number;
  muteKeyboardBehavior: MuteKeyboardBehavior;
  muteKeyboardChordStarterEnabled: boolean;
  edgeProfileSwitchingBlocked: boolean;
  ledEnabled: boolean;
  playerLedEnabled: boolean;
  idleDisconnectEnabled: boolean;
  idleDisconnectTimeoutMinutes: number;
  usbSuspendDisconnectEnabled: boolean;
  wakeOnConnectEnabled: boolean;
  sleepKeybindEnabled: boolean;
  speakerVolumeShortcutEnabled: boolean;
  pollingRateMode: PollingRateMode;
  hostPersonaMode: HostPersonaMode;
  notifyControllerConnection: boolean;
  notifyLowBattery: boolean;
  duplexMicEnabled: boolean;
  controllerPowerSavingEnabled: boolean;
  selectedControllerProfileId: string;
  controllerProfiles: ControllerProfile[];
  selectedButtonRemappingProfileId: string;
  buttonRemappingProfiles: ButtonRemapProfile[];
  buttonRemappingDraft: ButtonRemapMap;
  chordFunctions: ChordFunction[];
  chordAssignments: ChordAssignment[];
  touchpadSettings?: TouchpadSettings;
  turboSettings?: TurboSettings;
  gyroSettings?: GyroSettings;
  stickCurveSettings?: StickCurveSettings;
  multiActionsSettings?: MultiActionsSettings;
  virtualCursorSettings?: VirtualCursorSettings;
  pcWakeSettings?: PcWakeSettings;
  modsServerSettings?: ModsServerSettings;
  kitsuneBarSettings?: KitsuneBarSettings;
  gameProfileAutoSwitchEnabled: boolean;
  gameProfiles: GameProfile[];
}

export type GyroActivationMode = 'always-on' | 'button-hold' | 'button-toggle' | 'touchpad-touch' | 'trigger-press';
export type FlickStickTurnMode = 'smooth' | 'instant';

export interface GyroSettings {
  enabled: boolean;
  sensitivityYaw: number;
  sensitivityPitch: number;
  deadzone: number;
  smoothFilter: number;
  activationMode: GyroActivationMode;
  activationButton?: string;
  triggerThresholdPercent?: number;
  flickStickEnabled: boolean;
  flickStickThresholdPercent: number;
  flickStickSnapDegrees: number;
  flickStickTurnMode: FlickStickTurnMode;
  flickStickSmoothDurationMs: number;
  invertPitch: boolean;
  invertYaw: boolean;
}

export type StickCurveType = 'linear' | 'exponential' | 'instant' | 'wide' | 'dynamic';

export interface StickCurveConfig {
  curveType: StickCurveType;
  innerDeadzonePercent: number;
  outerDeadzonePercent: number;
  antiDeadzonePercent: number;
  exponent: number;
  maxRangePercent: number;
}

export interface StickCurveSettings {
  left: StickCurveConfig;
  right: StickCurveConfig;
}

export interface MultiActionStep {
  id: string;
  type: 'key-press' | 'button-press' | 'delay' | 'mouse-click';
  key?: string;
  button?: string;
  delayMs?: number;
}

export interface MultiActionSequence {
  id: string;
  name: string;
  triggerButton: string;
  holdThresholdMs: number;
  repeatMode: 'none' | 'while-holding' | 'fixed-count';
  repeatCount?: number;
  repeatIntervalMs?: number;
  steps: MultiActionStep[];
}

export interface MultiActionsSettings {
  enabled: boolean;
  sequences: MultiActionSequence[];
}

export interface VirtualCursorSettings {
  enabled: boolean;
  controlStick: 'left' | 'right';
  pointerSpeed: number;
  scrollSpeed: number;
  deadzonePercent: number;
  leftClickButton: string;
  rightClickButton: string;
  middleClickButton: string;
  scrollUpButton: string;
  scrollDownButton: string;
  virtualKeyboardShortcut: string;
}

export interface PcWakeSettings {
  enabled: boolean;
  targetMacAddress: string;
  broadcastIpAddress: string;
  udpPort: number;
  wakeOnControllerConnect: boolean;
}

export interface ModsServerSettings {
  enabled: boolean;
  port: number;
  authToken: string;
  allowMCP: boolean;
  corsAllowedOrigins: string[];
}

export interface KitsuneBarItemConfig {
  id: string;
  name: string;
  icon: string;
  type: 'module' | 'folder' | 'core';
  layer: number;
  order: number;
  enabled: boolean;
}

export interface KitsuneBarSettings {
  enabled: boolean;
  toggleShortcut: 'ps-button' | 'chord' | 'keyboard';
  customHotkey?: string;
  transparencyPercent: number;
  alwaysOnTop: boolean;
  showQuickSettings: boolean;
  showBattery: boolean;
  showPresetPicker: boolean;
  activeLayer?: number;
  totalLayers?: number;
  items?: KitsuneBarItemConfig[];
}

export interface SettingsBackupPackage {
  app: 'DS5 Companion / Kitsune';
  version: string;
  exportedAt: string;
  settings: CompanionSettings;
}

export interface GameProfile {
  id: string;
  name: string;
  executableName: string;
  controllerProfileId: string;
  buttonRemappingProfileId?: string | null;
}

export interface ActiveGameInfo {
  id: string | null;
  name: string;
  executableName: string;
  matchedProfileId: string | null;
}

export interface RunningProcessInfo {
  processId: number;
  name: string;
  executableName: string;
  windowTitle?: string | null;
}

export interface TurboSettings {
  enabled: boolean;
  speedCps: number;
  humanize: boolean;
  buttonsMask: number;
}

export interface HidDeviceSummary {
  path?: string;
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
  product?: string;
  manufacturer?: string;
  interface?: number;
}

export interface AudioHapticsSession {
  processId: number;
  displayName: string;
  executableName: string | null;
  processPath: string | null;
  iconPath: string | null;
  iconDataUrl?: string | null;
  sessionIdentifier: string | null;
  sessionInstanceIdentifier: string | null;
  state: 'active' | 'inactive' | 'expired' | string;
  endpointName: string;
  isSelected: boolean;
}

export type BridgeStateKind =
  | 'no-bridge'
  | 'normal-firmware'
  | 'transitioning'
  | 'connected'
  | 'incompatible'
  | 'error';

export interface BridgeDiagnostics {
  hidPath: string | null;
  protocolVersion: string | null;
  uptimeSeconds: number | null;
  settingsRevision: number | null;
  lastAck: BridgeAckPayload | null;
  lastError: string | null;
  firmwareUpdateAvailable: {
    currentVersion: string;
    availableVersion: string;
  } | null;
  lastPollAt: number | null;
  rawDevices: HidDeviceSummary[];
  deviceIdentity: CompanionDeviceIdentityPayload | null;
  firmwareLogDirectory: string | null;
  firmwareLogPath: string | null;
  firmwareLogEnabled: boolean | null;
  firmwareLogDroppedBytes: number;
  firmwareLogLastError: string | null;
  audioDebugLogPath: string | null;
  audioDebugLogLines: string[];
  audioDebugDroppedCount: number;
  audioDebugStats: AudioDebugStatsPayload | null;
  triggerTraceLines: string[];
  triggerTraceDroppedCount: number;
  feedbackTraceLines: string[];
  feedbackTraceDroppedCount: number;
  audioStatus: AudioStatusPayload | null;
}

export interface BridgeSnapshot {
  state: BridgeStateKind;
  message: string;
  status: BridgeStatusPayload | null;
  settings: CompanionSettings;
  diagnostics: BridgeDiagnostics;
  personaTransition?: HostPersonaTransition | null;
  bridgeDevices?: BridgeDeviceCensus | null;
  stickInputPreview?: StickInputPreviewPayload | null;
  activeGame?: ActiveGameInfo | null;
}

export interface BridgeDeviceInfo {
  path: string;
  containerId: string | null;
  selected: boolean;
  connected: boolean;
  uniqueId: string | null;
  name: string | null;
}

export interface DirectControllerInfo {
  path: string;
  product: string | null;
  productId: number;
}

export interface BridgeIdentityRecord {
  label: string | null;
  containerId: string | null;
}

export interface BridgeDeviceCensus {
  bridges: BridgeDeviceInfo[];
  directControllers: DirectControllerInfo[];
  selectedBridgePath: string | null;
}

export interface HostPersonaTransition {
  from: HostPersonaMode;
  to: HostPersonaMode;
  startedAt: number;
  deadlineAt: number;
}

export interface WindowsDeviceCleanupResult {
  scriptPath: string;
  logPath: string;
  includedBluetooth: boolean;
  message: string;
}

export type PicoFirmwareAction = 'mount' | 'flash' | 'nuke';

export interface PicoFirmwareActionResult {
  ok: boolean;
  action: PicoFirmwareAction;
  cancelled?: boolean;
  driveRoot?: string;
  sourcePath?: string;
  targetPath?: string;
  message: string;
}

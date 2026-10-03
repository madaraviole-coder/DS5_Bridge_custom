import type { BridgeApi } from '../../preload';
import {
  ACK_RESULT,
  DEFAULT_BUTTON_REMAP_PROFILE,
  REMAP_BUTTON_IDS,
  type AdaptiveTriggerPreviewEffect,
  type AudioReactiveHapticsConfig,
  type BridgePresetId,
  type ButtonRemapMap,
  type ButtonRemapProfile,
  type ChordAssignment,
  type ChordFunction,
  type ControllerProfile,
  type ControllerProfileSettings,
  type HostPersonaMode,
  type MuteButtonMode,
  type MuteKeyboardBehavior,
  type PollingRateMode,
  type RemapButtonId,
  type TriggerTestMode,
  type TriggerTestTarget
} from '../../shared/protocol';
import type { TouchpadGesture, TouchpadSettings } from '../../shared/touchpad-gestures';
import { DEFAULT_TOUCHPAD_SETTINGS } from '../../shared/touchpad-gestures';
import type {
  AudioHapticsSession,
  BridgeDiagnostics,
  BridgeSnapshot,
  BridgeStateKind,
  CompanionSettings,
  GameProfile,
  PicoFirmwareActionResult,
  RunningProcessInfo,
  TurboSettings,
  UiScalePercent,
  UiThemePreset,
  WindowsDeviceCleanupResult,
  GyroSettings,
  StickCurveSettings,
  MultiActionsSettings,
  VirtualCursorSettings,
  PcWakeSettings,
  ModsServerSettings,
  KitsuneBarSettings
} from '../../shared/types';

import {
  DEFAULT_MOCK_CONTROLLER_SETTINGS,
  DEFAULT_MOCK_SETTINGS,
  DEFAULT_MOCK_DIAGNOSTICS,
  createDefaultSnapshot
} from './mock-defaults';

export {
  DEFAULT_MOCK_CONTROLLER_SETTINGS,
  DEFAULT_MOCK_SETTINGS,
  DEFAULT_MOCK_DIAGNOSTICS,
  createDefaultSnapshot
};

export interface IpcCallRecord {
  method: string;
  args: any[];
  timestamp: number;
}

export class MockBridgeApi implements BridgeApi {
  private snapshot: BridgeSnapshot;
  private listeners: Set<(snapshot: BridgeSnapshot) => void> = new Set();
  private maxListeners: Set<(maximized: boolean) => void> = new Set();
  public calls: IpcCallRecord[] = [];
  public audioSessions: AudioHapticsSession[] = [];
  public runningProcesses: RunningProcessInfo[] = [];

  constructor(initialSnapshot?: Partial<BridgeSnapshot>) {
    this.snapshot = createDefaultSnapshot(initialSnapshot);
  }

  private recordCall(method: string, ...args: any[]): void {
    this.calls.push({ method, args, timestamp: Date.now() });
  }

  public getCallCount(method: string): number {
    return this.calls.filter((c) => c.method === method).length;
  }

  public getLastCall(method: string): IpcCallRecord | undefined {
    const matching = this.calls.filter((c) => c.method === method);
    return matching[matching.length - 1];
  }

  public emitSnapshot(partial: Partial<BridgeSnapshot>): void {
    this.snapshot = {
      ...this.snapshot,
      ...partial,
      settings: {
        ...this.snapshot.settings,
        ...(partial.settings ?? {})
      },
      diagnostics: {
        ...this.snapshot.diagnostics,
        ...(partial.diagnostics ?? {})
      }
    };
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }

  public getCurrentSnapshot(): BridgeSnapshot {
    return JSON.parse(JSON.stringify(this.snapshot));
  }

  // --- BridgeApi Implementation ---
  async getStatus(): Promise<BridgeSnapshot> {
    this.recordCall('getStatus');
    return this.getCurrentSnapshot();
  }

  async listDevices(): Promise<any> {
    this.recordCall('listDevices');
    return this.snapshot.bridgeDevices?.bridges ?? [];
  }

  async listAudioHapticsSessions(): Promise<AudioHapticsSession[]> {
    this.recordCall('listAudioHapticsSessions');
    return [...this.audioSessions];
  }

  async applyPreset(value: BridgePresetId): Promise<BridgeSnapshot> {
    this.recordCall('applyPreset', value);
    this.snapshot.settings.selectedPresetId = value;
    return this.getCurrentSnapshot();
  }

  async selectControllerProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('selectControllerProfile', profileId);
    this.snapshot.settings.selectedControllerProfileId = profileId;
    return this.getCurrentSnapshot();
  }

  async saveControllerProfile(name?: string): Promise<BridgeSnapshot> {
    this.recordCall('saveControllerProfile', name);
    const newProfile: ControllerProfile = {
      id: `profile-${Date.now()}`,
      name: name ?? `Profile ${this.snapshot.settings.controllerProfiles.length + 1}`,
      settings: { ...this.snapshot.settings }
    };
    this.snapshot.settings.controllerProfiles.push(newProfile);
    this.snapshot.settings.selectedControllerProfileId = newProfile.id;
    return this.getCurrentSnapshot();
  }

  async updateControllerProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('updateControllerProfile', profileId);
    return this.getCurrentSnapshot();
  }

  async renameControllerProfile(profileId: string, name: string): Promise<BridgeSnapshot> {
    this.recordCall('renameControllerProfile', profileId, name);
    const p = this.snapshot.settings.controllerProfiles.find((item) => item.id === profileId);
    if (p) p.name = name;
    return this.getCurrentSnapshot();
  }

  async deleteControllerProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('deleteControllerProfile', profileId);
    this.snapshot.settings.controllerProfiles = this.snapshot.settings.controllerProfiles.filter(
      (p) => p.id !== profileId
    );
    return this.getCurrentSnapshot();
  }

  async setHapticsGain(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setHapticsGain', value);
    this.snapshot.settings.hapticsGainPercent = value;
    return this.getCurrentSnapshot();
  }

  async setRadialDeadzones(leftPercent: number, rightPercent: number): Promise<BridgeSnapshot> {
    this.recordCall('setRadialDeadzones', leftPercent, rightPercent);
    this.snapshot.settings.leftStickRadialDeadzonePercent = leftPercent;
    this.snapshot.settings.rightStickRadialDeadzonePercent = rightPercent;
    return this.getCurrentSnapshot();
  }

  async requestStickInputPreview(): Promise<BridgeSnapshot> {
    this.recordCall('requestStickInputPreview');
    return this.getCurrentSnapshot();
  }

  async releaseStickInputPreview(): Promise<BridgeSnapshot> {
    this.recordCall('releaseStickInputPreview');
    return this.getCurrentSnapshot();
  }

  async setHapticsEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setHapticsEnabled', value);
    this.snapshot.settings.hapticsEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setFeedbackBoostEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setFeedbackBoostEnabled', value);
    this.snapshot.settings.feedbackBoostEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setHapticsBufferLength(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setHapticsBufferLength', value);
    this.snapshot.settings.hapticsBufferLength = value;
    return this.getCurrentSnapshot();
  }

  async setAudioInterleave(maxConsecutiveAudioSends: number, stateMaxAgeUs: number): Promise<BridgeSnapshot> {
    this.recordCall('setAudioInterleave', maxConsecutiveAudioSends, stateMaxAgeUs);
    this.snapshot.settings.audioInterleaveMaxConsecutiveAudioSends = maxConsecutiveAudioSends;
    this.snapshot.settings.audioInterleaveStateMaxAgeUs = stateMaxAgeUs;
    return this.getCurrentSnapshot();
  }

  async setClassicRumbleGain(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setClassicRumbleGain', value);
    this.snapshot.settings.classicRumbleGainPercent = value;
    return this.getCurrentSnapshot();
  }

  async setClassicRumbleEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setClassicRumbleEnabled', value);
    this.snapshot.settings.classicRumbleEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setClassicRumbleV1Enabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setClassicRumbleV1Enabled', value);
    this.snapshot.settings.classicRumbleV1Enabled = value;
    return this.getCurrentSnapshot();
  }

  async setTriggerEffectIntensity(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setTriggerEffectIntensity', value);
    this.snapshot.settings.triggerEffectIntensityPercent = value;
    return this.getCurrentSnapshot();
  }

  async setTriggerTestMode(value: TriggerTestMode): Promise<BridgeSnapshot> {
    this.recordCall('setTriggerTestMode', value);
    this.snapshot.settings.triggerTestMode = value;
    return this.getCurrentSnapshot();
  }

  async setAdaptiveTriggersEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setAdaptiveTriggersEnabled', value);
    this.snapshot.settings.adaptiveTriggersEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setSpeakerVolume(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setSpeakerVolume', value);
    this.snapshot.settings.speakerVolumePercent = value;
    return this.getCurrentSnapshot();
  }

  async setSpeakerGainLevel(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setSpeakerGainLevel', value);
    this.snapshot.settings.speakerGainLevel = value;
    return this.getCurrentSnapshot();
  }

  async selectBridge(devicePath: string | null): Promise<BridgeSnapshot> {
    this.recordCall('selectBridge', devicePath);
    this.snapshot.settings.selectedBridgePath = devicePath;
    return this.getCurrentSnapshot();
  }

  async refreshBridgeDevices(): Promise<BridgeSnapshot> {
    this.recordCall('refreshBridgeDevices');
    return this.getCurrentSnapshot();
  }

  async setBridgeLabel(uniqueId: string, label: string | null): Promise<BridgeSnapshot> {
    this.recordCall('setBridgeLabel', uniqueId, label);
    return this.getCurrentSnapshot();
  }

  async setSpeakerEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setSpeakerEnabled', value);
    this.snapshot.settings.speakerEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setMicVolume(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setMicVolume', value);
    this.snapshot.settings.micVolumePercent = value;
    return this.getCurrentSnapshot();
  }

  async setMicMute(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setMicMute', value);
    this.snapshot.settings.micMuted = value;
    return this.getCurrentSnapshot();
  }

  async setAudioReactiveHapticsConfig(value: Partial<AudioReactiveHapticsConfig>): Promise<BridgeSnapshot> {
    this.recordCall('setAudioReactiveHapticsConfig', value);
    if (value.enabled !== undefined) this.snapshot.settings.audioReactiveHapticsEnabled = value.enabled;
    if (value.source !== undefined) this.snapshot.settings.audioReactiveHapticsSource = value.source;
    if (value.mode !== undefined) this.snapshot.settings.audioReactiveHapticsMode = value.mode;
    if (value.gainPercent !== undefined) this.snapshot.settings.audioReactiveHapticsGainPercent = value.gainPercent;
    if (value.bassFocus !== undefined) this.snapshot.settings.audioReactiveHapticsBassFocus = value.bassFocus;
    return this.getCurrentSnapshot();
  }

  async setDuplexMicEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setDuplexMicEnabled', value);
    this.snapshot.settings.duplexMicEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setLightbarColor(color: string, brightness: number): Promise<BridgeSnapshot> {
    this.recordCall('setLightbarColor', color, brightness);
    this.snapshot.settings.lightbarColor = color;
    this.snapshot.settings.lightbarBrightnessPercent = brightness;
    return this.getCurrentSnapshot();
  }

  async setLightbarEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setLightbarEnabled', value);
    this.snapshot.settings.lightbarEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setLightbarOverrideEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setLightbarOverrideEnabled', value);
    this.snapshot.settings.lightbarOverrideEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setMuteButtonAction(
    mode: MuteButtonMode,
    usage: number,
    modifiers: number,
    behavior: MuteKeyboardBehavior,
    chordStarterEnabled?: boolean
  ): Promise<BridgeSnapshot> {
    this.recordCall('setMuteButtonAction', mode, usage, modifiers, behavior, chordStarterEnabled);
    this.snapshot.settings.muteButtonMode = mode;
    this.snapshot.settings.muteKeyboardUsage = usage;
    this.snapshot.settings.muteKeyboardModifiers = modifiers;
    this.snapshot.settings.muteKeyboardBehavior = behavior;
    if (chordStarterEnabled !== undefined) {
      this.snapshot.settings.muteKeyboardChordStarterEnabled = chordStarterEnabled;
    }
    return this.getCurrentSnapshot();
  }

  async setLedEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setLedEnabled', value);
    this.snapshot.settings.ledEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setPlayerLedEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setPlayerLedEnabled', value);
    this.snapshot.settings.playerLedEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setLightbarRestoreEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setLightbarRestoreEnabled', value);
    this.snapshot.settings.lightbarRestoreEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setIdleDisconnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setIdleDisconnectEnabled', value);
    this.snapshot.settings.idleDisconnectEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setIdleDisconnectTimeoutMinutes(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setIdleDisconnectTimeoutMinutes', value);
    this.snapshot.settings.idleDisconnectTimeoutMinutes = value;
    return this.getCurrentSnapshot();
  }

  async setUsbSuspendDisconnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setUsbSuspendDisconnectEnabled', value);
    this.snapshot.settings.usbSuspendDisconnectEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setWakeOnConnectEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setWakeOnConnectEnabled', value);
    this.snapshot.settings.wakeOnConnectEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setSleepKeybindEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setSleepKeybindEnabled', value);
    this.snapshot.settings.sleepKeybindEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setSpeakerVolumeShortcutEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setSpeakerVolumeShortcutEnabled', value);
    this.snapshot.settings.speakerVolumeShortcutEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setControllerPowerSavingEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setControllerPowerSavingEnabled', value);
    this.snapshot.settings.controllerPowerSavingEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setLaunchAtStartupEnabled(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setLaunchAtStartupEnabled', value);
    this.snapshot.settings.launchAtStartupEnabled = value;
    return this.getCurrentSnapshot();
  }

  async setShowBatteryPercentTrayIcon(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setShowBatteryPercentTrayIcon', value);
    this.snapshot.settings.showBatteryPercentTrayIcon = value;
    return this.getCurrentSnapshot();
  }

  async setKitsuneInputPromotionDismissed(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setKitsuneInputPromotionDismissed', value);
    this.snapshot.settings.kitsuneInputPromotionDismissed = value;
    return this.getCurrentSnapshot();
  }

  async setUiScalePercent(value: number): Promise<BridgeSnapshot> {
    this.recordCall('setUiScalePercent', value);
    this.snapshot.settings.uiScalePercent = value as UiScalePercent;
    return this.getCurrentSnapshot();
  }

  async setUiThemePreset(value: UiThemePreset): Promise<BridgeSnapshot> {
    this.recordCall('setUiThemePreset', value);
    this.snapshot.settings.uiThemePreset = value;
    return this.getCurrentSnapshot();
  }

  async setPollingRateMode(value: PollingRateMode): Promise<BridgeSnapshot> {
    this.recordCall('setPollingRateMode', value);
    this.snapshot.settings.pollingRateMode = value;
    return this.getCurrentSnapshot();
  }

  async setHostPersonaMode(value: HostPersonaMode): Promise<BridgeSnapshot> {
    this.recordCall('setHostPersonaMode', value);
    this.snapshot.settings.hostPersonaMode = value;
    return this.getCurrentSnapshot();
  }

  async sleepController(): Promise<BridgeSnapshot> {
    this.recordCall('sleepController');
    return this.getCurrentSnapshot();
  }

  async requestControllerScan(): Promise<BridgeSnapshot> {
    this.recordCall('requestControllerScan');
    return this.getCurrentSnapshot();
  }

  async forgetControllerPairings(): Promise<BridgeSnapshot> {
    this.recordCall('forgetControllerPairings');
    return this.getCurrentSnapshot();
  }

  async forgetControllerPairing(bluetoothAddress: string): Promise<BridgeSnapshot> {
    this.recordCall('forgetControllerPairing', bluetoothAddress);
    return this.getCurrentSnapshot();
  }

  async mountPicoBootloader(): Promise<PicoFirmwareActionResult> {
    this.recordCall('mountPicoBootloader');
    return { ok: true, action: 'mount', driveRoot: 'D:\\', message: 'Bootloader mounted' };
  }

  async flashPicoFirmware(): Promise<PicoFirmwareActionResult> {
    this.recordCall('flashPicoFirmware');
    return { ok: true, action: 'flash', message: 'Firmware flashed' };
  }

  async nukePicoFlash(): Promise<PicoFirmwareActionResult> {
    this.recordCall('nukePicoFlash');
    return { ok: true, action: 'nuke', message: 'Flash wiped' };
  }

  async setNotifyControllerConnection(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setNotifyControllerConnection', value);
    this.snapshot.settings.notifyControllerConnection = value;
    return this.getCurrentSnapshot();
  }

  async setNotifyLowBattery(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setNotifyLowBattery', value);
    this.snapshot.settings.notifyLowBattery = value;
    return this.getCurrentSnapshot();
  }

  async testNotification(): Promise<BridgeSnapshot> {
    this.recordCall('testNotification');
    return this.getCurrentSnapshot();
  }

  async testHaptics(): Promise<BridgeSnapshot> {
    this.recordCall('testHaptics');
    return this.getCurrentSnapshot();
  }

  async testSpeaker(): Promise<BridgeSnapshot> {
    this.recordCall('testSpeaker');
    return this.getCurrentSnapshot();
  }

  async testClassicRumble(): Promise<BridgeSnapshot> {
    this.recordCall('testClassicRumble');
    return this.getCurrentSnapshot();
  }

  async testAdaptiveTriggers(mode?: TriggerTestMode, target?: TriggerTestTarget): Promise<BridgeSnapshot> {
    this.recordCall('testAdaptiveTriggers', mode, target);
    return this.getCurrentSnapshot();
  }

  async previewAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    this.recordCall('previewAdaptiveTriggerEffect', effect);
    return this.getCurrentSnapshot();
  }

  async applyAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    this.recordCall('applyAdaptiveTriggerEffect', effect);
    return this.getCurrentSnapshot();
  }

  async resetAdaptiveTriggers(): Promise<BridgeSnapshot> {
    this.recordCall('resetAdaptiveTriggers');
    return this.getCurrentSnapshot();
  }

  async restoreDefaults(): Promise<BridgeSnapshot> {
    this.recordCall('restoreDefaults');
    this.snapshot.settings = { ...DEFAULT_MOCK_SETTINGS };
    return this.getCurrentSnapshot();
  }

  async setButtonRemap(buttonId: RemapButtonId, targetId: RemapButtonId): Promise<BridgeSnapshot> {
    this.recordCall('setButtonRemap', buttonId, targetId);
    this.snapshot.settings.buttonRemappingDraft[buttonId] = targetId;
    return this.getCurrentSnapshot();
  }

  async setTouchpadZoneConfig(settings: TouchpadSettings): Promise<BridgeSnapshot> {
    this.recordCall('setTouchpadZoneConfig', settings);
    this.snapshot.settings.touchpadSettings = settings;
    return this.getCurrentSnapshot();
  }

  async executeTouchpadGesture(gesture: TouchpadGesture): Promise<void> {
    this.recordCall('executeTouchpadGesture', gesture);
  }

  async setTurboConfig(settings: TurboSettings): Promise<BridgeSnapshot> {
    this.recordCall('setTurboConfig', settings);
    this.snapshot.settings.turboSettings = settings;
    return this.getCurrentSnapshot();
  }

  async selectButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('selectButtonRemappingProfile', profileId);
    this.snapshot.settings.selectedButtonRemappingProfileId = profileId;
    return this.getCurrentSnapshot();
  }

  async saveButtonRemappingProfile(name?: string): Promise<BridgeSnapshot> {
    this.recordCall('saveButtonRemappingProfile', name);
    const newProfile: ButtonRemapProfile = {
      id: `remap-${Date.now()}`,
      name: name ?? `Profile ${this.snapshot.settings.buttonRemappingProfiles.length + 1}`,
      mappings: { ...this.snapshot.settings.buttonRemappingDraft }
    };
    this.snapshot.settings.buttonRemappingProfiles.push(newProfile);
    this.snapshot.settings.selectedButtonRemappingProfileId = newProfile.id;
    return this.getCurrentSnapshot();
  }

  async updateButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('updateButtonRemappingProfile', profileId);
    return this.getCurrentSnapshot();
  }

  async renameButtonRemappingProfile(profileId: string, name: string): Promise<BridgeSnapshot> {
    this.recordCall('renameButtonRemappingProfile', profileId, name);
    const p = this.snapshot.settings.buttonRemappingProfiles.find((item) => item.id === profileId);
    if (p) p.name = name;
    return this.getCurrentSnapshot();
  }

  async deleteButtonRemappingProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('deleteButtonRemappingProfile', profileId);
    this.snapshot.settings.buttonRemappingProfiles = this.snapshot.settings.buttonRemappingProfiles.filter(
      (p) => p.id !== profileId
    );
    return this.getCurrentSnapshot();
  }

  async restoreButtonRemappingDefaults(): Promise<BridgeSnapshot> {
    this.recordCall('restoreButtonRemappingDefaults');
    this.snapshot.settings.buttonRemappingDraft = { ...DEFAULT_BUTTON_REMAP_PROFILE.mappings };
    return this.getCurrentSnapshot();
  }

  async setGameProfileAutoSwitchEnabled(enabled: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setGameProfileAutoSwitchEnabled', enabled);
    this.snapshot.settings.gameProfileAutoSwitchEnabled = enabled;
    return this.getCurrentSnapshot();
  }

  async saveGameProfile(profile: Omit<GameProfile, 'id'> & { id?: string }): Promise<BridgeSnapshot> {
    this.recordCall('saveGameProfile', profile);
    const id = profile.id ?? `game-${Date.now()}`;
    const fullProfile: GameProfile = { ...profile, id };
    const existingIndex = this.snapshot.settings.gameProfiles.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      this.snapshot.settings.gameProfiles[existingIndex] = fullProfile;
    } else {
      this.snapshot.settings.gameProfiles.push(fullProfile);
    }
    return this.getCurrentSnapshot();
  }

  async updateGameProfile(profile: GameProfile): Promise<BridgeSnapshot> {
    this.recordCall('updateGameProfile', profile);
    const idx = this.snapshot.settings.gameProfiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) this.snapshot.settings.gameProfiles[idx] = profile;
    return this.getCurrentSnapshot();
  }

  async deleteGameProfile(profileId: string): Promise<BridgeSnapshot> {
    this.recordCall('deleteGameProfile', profileId);
    this.snapshot.settings.gameProfiles = this.snapshot.settings.gameProfiles.filter((p) => p.id !== profileId);
    return this.getCurrentSnapshot();
  }

  async getRunningProcesses(): Promise<RunningProcessInfo[]> {
    this.recordCall('getRunningProcesses');
    return [...this.runningProcesses];
  }

  async setChordConfiguration(functions: ChordFunction[], assignments: ChordAssignment[]): Promise<BridgeSnapshot> {
    this.recordCall('setChordConfiguration', functions, assignments);
    this.snapshot.settings.chordFunctions = functions;
    this.snapshot.settings.chordAssignments = assignments;
    return this.getCurrentSnapshot();
  }

  async setEdgeProfileSwitchingBlocked(value: boolean): Promise<BridgeSnapshot> {
    this.recordCall('setEdgeProfileSwitchingBlocked', value);
    this.snapshot.settings.edgeProfileSwitchingBlocked = value;
    return this.getCurrentSnapshot();
  }

  async setChordFunctions(functions: ChordFunction[]): Promise<BridgeSnapshot> {
    this.recordCall('setChordFunctions', functions);
    this.snapshot.settings.chordFunctions = functions;
    return this.getCurrentSnapshot();
  }

  async setChordAssignments(assignments: ChordAssignment[]): Promise<BridgeSnapshot> {
    this.recordCall('setChordAssignments', assignments);
    this.snapshot.settings.chordAssignments = assignments;
    return this.getCurrentSnapshot();
  }

  async setGyroSettings(gyroSettings: GyroSettings): Promise<BridgeSnapshot> {
    this.recordCall('setGyroSettings', gyroSettings);
    this.snapshot.settings.gyroSettings = gyroSettings;
    return this.getCurrentSnapshot();
  }

  async setStickCurveSettings(stickCurveSettings: StickCurveSettings): Promise<BridgeSnapshot> {
    this.recordCall('setStickCurveSettings', stickCurveSettings);
    this.snapshot.settings.stickCurveSettings = stickCurveSettings;
    return this.getCurrentSnapshot();
  }

  async setMultiActionsSettings(multiActionsSettings: MultiActionsSettings): Promise<BridgeSnapshot> {
    this.recordCall('setMultiActionsSettings', multiActionsSettings);
    this.snapshot.settings.multiActionsSettings = multiActionsSettings;
    return this.getCurrentSnapshot();
  }

  async setVirtualCursorSettings(virtualCursorSettings: VirtualCursorSettings): Promise<BridgeSnapshot> {
    this.recordCall('setVirtualCursorSettings', virtualCursorSettings);
    this.snapshot.settings.virtualCursorSettings = virtualCursorSettings;
    return this.getCurrentSnapshot();
  }

  async setPcWakeSettings(pcWakeSettings: PcWakeSettings): Promise<BridgeSnapshot> {
    this.recordCall('setPcWakeSettings', pcWakeSettings);
    this.snapshot.settings.pcWakeSettings = pcWakeSettings;
    return this.getCurrentSnapshot();
  }

  async sendWakeOnLanPacket(macAddress?: string, broadcastAddress?: string, port?: number): Promise<{ ok: boolean; message: string }> {
    this.recordCall('sendWakeOnLanPacket', macAddress, broadcastAddress, port);
    return { ok: true, message: 'Magic packet sent successfully (mock).' };
  }

  async setModsServerSettings(modsServerSettings: ModsServerSettings): Promise<BridgeSnapshot> {
    this.recordCall('setModsServerSettings', modsServerSettings);
    this.snapshot.settings.modsServerSettings = modsServerSettings;
    return this.getCurrentSnapshot();
  }

  async setKitsuneBarSettings(kitsuneBarSettings: KitsuneBarSettings): Promise<BridgeSnapshot> {
    this.recordCall('setKitsuneBarSettings', kitsuneBarSettings);
    this.snapshot.settings.kitsuneBarSettings = kitsuneBarSettings;
    return this.getCurrentSnapshot();
  }

  async toggleKitsuneBar(): Promise<boolean> {
    this.recordCall('toggleKitsuneBar');
    return true;
  }

  async exportSettingsBackup(): Promise<{ ok: boolean; message: string }> {
    this.recordCall('exportSettingsBackup');
    return { ok: true, message: 'Settings exported successfully (mock).' };
  }

  async importSettingsBackup(): Promise<{ ok: boolean; message: string }> {
    this.recordCall('importSettingsBackup');
    return { ok: true, message: 'Settings imported successfully (mock).' };
  }

  async repairWindowsDeviceCache(): Promise<WindowsDeviceCleanupResult> {
    this.recordCall('repairWindowsDeviceCache');
    return {
      scriptPath: 'C:\\scripts\\clean.ps1',
      logPath: 'C:\\logs\\clean.log',
      includedBluetooth: true,
      message: 'Windows device cache cleanup completed successfully.'
    };
  }

  async selectFirmwareLogDirectory(): Promise<BridgeSnapshot> {
    this.recordCall('selectFirmwareLogDirectory');
    this.snapshot.settings.firmwareLogDirectory = 'C:\\Logs\\Firmware';
    return this.getCurrentSnapshot();
  }

  async clearFirmwareLogDirectory(): Promise<BridgeSnapshot> {
    this.recordCall('clearFirmwareLogDirectory');
    this.snapshot.settings.firmwareLogDirectory = null;
    return this.getCurrentSnapshot();
  }

  async getDiagnostics(): Promise<BridgeDiagnostics> {
    this.recordCall('getDiagnostics');
    return { ...this.snapshot.diagnostics };
  }

  async minimizeWindow(): Promise<void> {
    this.recordCall('minimizeWindow');
  }

  async toggleMaximizeWindow(): Promise<void> {
    this.recordCall('toggleMaximizeWindow');
  }

  async isWindowMaximized(): Promise<boolean> {
    this.recordCall('isWindowMaximized');
    return false;
  }

  async hideWindow(): Promise<void> {
    this.recordCall('hideWindow');
  }

  async openExternal(url: string): Promise<void> {
    this.recordCall('openExternal', url);
  }

  onWindowMaximizedChange(callback: (maximized: boolean) => void): any {
    this.maxListeners.add(callback);
    return (() => {
      this.maxListeners.delete(callback);
      return {} as any;
    }) as any;
  }

  onSnapshot(callback: (snapshot: BridgeSnapshot) => void): any {
    this.listeners.add(callback);
    return (() => {
      this.listeners.delete(callback);
      return {} as any;
    }) as any;
  }
}

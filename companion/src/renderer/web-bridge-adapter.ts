import type { BridgeApi } from '../preload';
import {
  COMMAND_ID,
  DEFAULT_BUTTON_REMAP_PROFILE,
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  DEFAULT_CONTROLLER_PROFILE_ID,
  bluetoothAddressPayload,
  buildButtonRemapPayload,
  buildChordBindingsPayload,
  buildRadialDeadzonePayload,
  buildTouchpadZonePayload,
  buildTurboConfigPayload,
  hostPersonaModeValue,
  pollingRateModeValue,
  type AdaptiveTriggerPreviewEffect,
  type AudioReactiveHapticsConfig,
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
import type { TouchpadGesture, TouchpadSettings } from '../shared/touchpad-gestures';
import type {
  AudioHapticsSession,
  BridgeDiagnostics,
  BridgeSnapshot,
  GameProfile,
  PicoFirmwareActionResult,
  RunningProcessInfo,
  TurboSettings,
  UiThemePreset,
  WindowsDeviceCleanupResult
} from '../shared/types';
import {
  DEFAULT_TURBO_SETTINGS,
  DEFAULT_WEB_SETTINGS,
  WEB_SETTINGS_STORAGE_KEY,
  WEBHID_DEVICE_FILTERS,
  WEBUSB_DEVICE_FILTERS,
  createEmptyDiagnostics,
  loadWebSettings,
  saveWebSettings,
  type WebHidCollectionInfo,
  type WebHidDevice,
  type WebHidDeviceFilter,
  type WebNavigatorWithHid,
  type WebNavigatorWithUsb,
  type WebUsbAlternateInterface,
  type WebUsbConfiguration,
  type WebUsbDevice,
  type WebUsbDeviceFilter,
  type WebUsbEndpoint,
  type WebUsbInterface
} from './web-bridge-types';
import { WebBridgeTransport } from './web-bridge-transport';

export {
  DEFAULT_TURBO_SETTINGS,
  DEFAULT_WEB_SETTINGS,
  WEB_SETTINGS_STORAGE_KEY,
  WEBHID_DEVICE_FILTERS,
  WEBUSB_DEVICE_FILTERS,
  createEmptyDiagnostics,
  loadWebSettings,
  saveWebSettings,
  type WebHidCollectionInfo,
  type WebHidDevice,
  type WebHidDeviceFilter,
  type WebNavigatorWithHid,
  type WebNavigatorWithUsb,
  type WebUsbAlternateInterface,
  type WebUsbConfiguration,
  type WebUsbDevice,
  type WebUsbDeviceFilter,
  type WebUsbEndpoint,
  type WebUsbInterface
};

export class WebBridgeAdapter extends WebBridgeTransport implements BridgeApi {
  readonly isWebHid = true;

  async listDevices(): Promise<any> {
    if (typeof navigator !== 'undefined' && 'hid' in navigator) {
      const hid = (navigator as any).hid;
      const devices = await hid.getDevices();
      return devices.map((d: any) => ({
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
      await this.sendCommand(COMMAND_ID.SET_USB_SUSPEND_DISCONNECT_ENABLED, value ? 1 : 0);
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
      const value = (mode as any) === 'resistance' ? 2 : 1;
      await this.sendCommand(COMMAND_ID.TEST_ADAPTIVE_TRIGGERS, value);
    }
    return this.snapshot;
  }

  async previewAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.PREVIEW_ADAPTIVE_TRIGGER_EFFECT, (effect as any).effectType ?? 0);
    }
    return this.snapshot;
  }

  async applyAdaptiveTriggerEffect(effect: AdaptiveTriggerPreviewEffect): Promise<BridgeSnapshot> {
    if (this.device?.opened) {
      await this.sendCommand(COMMAND_ID.APPLY_ADAPTIVE_TRIGGER_EFFECT, (effect as any).effectType ?? 0);
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
      const payload = buildTouchpadZonePayload(settings as any);
      await this.sendCommand(COMMAND_ID.SET_TOUCHPAD_ZONE_CONFIG, 0, payload);
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async executeTouchpadGesture(gesture: TouchpadGesture): Promise<void> {
    // Mock execution for web adapter
    void gesture;
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

  async setGameProfileAutoSwitchEnabled(enabled: boolean): Promise<BridgeSnapshot> {
    this.settings.gameProfileAutoSwitchEnabled = enabled;
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async saveGameProfile(profile: Omit<GameProfile, 'id'> & { id?: string }): Promise<BridgeSnapshot> {
    const id = profile.id || `game-${Date.now()}`;
    const name = profile.name || 'Custom Game';
    const executableName = profile.executableName || 'game.exe';
    const controllerProfileId = profile.controllerProfileId || DEFAULT_CONTROLLER_PROFILE_ID;
    const buttonRemappingProfileId = profile.buttonRemappingProfileId || null;

    const existingIndex = this.settings.gameProfiles.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      this.settings.gameProfiles[existingIndex] = { id, name, executableName, controllerProfileId, buttonRemappingProfileId };
    } else {
      this.settings.gameProfiles.push({ id, name, executableName, controllerProfileId, buttonRemappingProfileId });
    }
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async updateGameProfile(profile: GameProfile): Promise<BridgeSnapshot> {
    return this.saveGameProfile(profile);
  }

  async deleteGameProfile(profileId: string): Promise<BridgeSnapshot> {
    this.settings.gameProfiles = this.settings.gameProfiles.filter((p) => p.id !== profileId);
    saveWebSettings(this.settings);
    this.emitSnapshot();
    return this.snapshot;
  }

  async getRunningProcesses(): Promise<RunningProcessInfo[]> {
    return [
      { processId: 101, name: 'Cyberpunk 2077', executableName: 'Cyberpunk2077.exe', windowTitle: 'Cyberpunk 2077' },
      { processId: 102, name: 'Elden Ring', executableName: 'eldenring.exe', windowTitle: 'ELDEN RING' },
      { processId: 103, name: 'Forza Horizon 5', executableName: 'ForzaHorizon5.exe', windowTitle: 'Forza Horizon 5' }
    ];
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
  onWindowMaximizedChange(_callback: (maximized: boolean) => void): any {
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

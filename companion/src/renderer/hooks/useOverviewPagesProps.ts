import {
  useMemo,
  useRef,
  useState
} from 'react';
import type {
  ControllerProfile,
  HostPersonaMode,
  MuteButtonMode,
  MuteKeyboardBehavior,
  PollingRateMode
} from '../../shared/protocol';
import {
  DEFAULT_CONTROLLER_PROFILE_ID,
  RADIAL_DEADZONE_MAX_PERCENT,
  ackResultName,
  normalizeRadialDeadzonePercent
} from '../../shared/protocol';
import type { BridgeSnapshot } from '../../shared/types';
import playStationLogoUrl from '../../../../assets/brand/playstation-logo.svg';
import psHomeGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import triangleGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Triangle.svg';
import dpadUpGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Up.svg';
import dpadDownGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Down.svg';
import kitsuneInputLogoUrl from '../assets/kitsune-input-logo.svg';
import {
  HAPTICS_PRESETS,
  HAPTICS_STEP,
  HOST_PERSONA_OPTIONS,
  HOST_PERSONA_SHORT_LABELS,
  LIGHTBAR_BRIGHTNESS_STEP,
  LIGHTBAR_PRESETS,
  MIC_VOLUME_STEP,
  MUTE_BUTTON_MODE_OPTIONS,
  MUTE_KEYBOARD_BEHAVIOR_OPTIONS,
  MUTE_KEY_OPTIONS,
  MUTE_MODIFIER_OPTIONS,
  PERCENT_SLIDER_TICKS,
  POLLING_RATE_OPTIONS,
  RADIAL_DEADZONE_PRESETS,
  RADIAL_DEADZONE_TICKS,
  SPEAKER_VOLUME_STEP
} from '../constants/app-constants';
import {
  LIGHTBAR_CUSTOM_PALETTE,
  LIGHTBAR_DEFAULT_CUSTOM_COLOR,
  LIGHTBAR_SWATCHES,
  normalizeHexColor,
  snapLightbarBrightness
} from '../utils/lightbar';
import type {
  ControlTab,
  NotificationFocusTarget,
  SettingsFocusTarget
} from '../types/app-types';
import {
  controllerName,
  healthLabel,
  healthTitle
} from '../utils/controller-status';
import {
  sliderTickClass,
  snapHapticsValue
} from '../utils/tab-helpers';
import { snapMicVolume, snapSpeakerVolume } from '../utils/audio-testing';
import type { OverviewPageProps } from '../pages/OverviewPage';
import type { ControllerDevicesPageProps } from '../ControllerDevicesPage';
import type { DeadzonesPageProps } from '../pages/DeadzonesPage';
import type { LightingPageProps } from '../pages/LightingPage';
import type { SystemPageProps } from '../pages/SystemPage';
import type { useCompanionControls } from './useCompanionControls';
import type { useDeviceManagement } from './useDeviceManagement';
import type { useGameProfilesState } from './useGameProfilesState';
import type { useAudioTestingState } from './useAudioTestingState';

export interface UseOverviewPagesPropsParams {
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  controllerConnected: boolean;
  controllerControlsAvailable: boolean;
  activeControlTab: ControlTab;
  pendingAction: string | null;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  runQuietAction: (fn: () => Promise<any>) => Promise<any>;
  controls: ReturnType<typeof useCompanionControls>;
  deviceMgmt: ReturnType<typeof useDeviceManagement>;
  gameProfiles: ReturnType<typeof useGameProfilesState>;
  audioTesting: ReturnType<typeof useAudioTestingState>;
  selectControlTab: (tab: ControlTab) => void;
  focusSettingsTarget: (target: SettingsFocusTarget) => void;
  focusNotificationSettings: (target: NotificationFocusTarget | 'all') => void;
  setIsKitsuneBarInfoOpen: (open: boolean) => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
  saveControllerProfile: () => void;
  renameControllerProfile: () => void;
  deleteControllerProfile: () => void;
  selectControllerProfile: (id: string) => void;
}

export function useOverviewPagesProps(p: UseOverviewPagesPropsParams) {
  const { snapshot, connected, controllerConnected, pendingAction, runAction, controls } = p;
  const personaTransition = snapshot?.personaTransition ?? null;
  const personaTransitionActive = Boolean(personaTransition);

  const [overviewSleepConfirmVisible, setOverviewSleepConfirmVisible] = useState(false);
  const overviewSleepConfirmArmedRef = useRef(false);
  const overviewSleepConfirmTimerRef = useRef<number | null>(null);

  function toggleSleepControllerConfirm() {
    if (overviewSleepConfirmVisible) {
      if (overviewSleepConfirmTimerRef.current !== null) {
        window.clearTimeout(overviewSleepConfirmTimerRef.current);
        overviewSleepConfirmTimerRef.current = null;
      }
      setOverviewSleepConfirmVisible(false);
      overviewSleepConfirmArmedRef.current = false;
      return;
    }
    setOverviewSleepConfirmVisible(true);
    overviewSleepConfirmArmedRef.current = true;
    overviewSleepConfirmTimerRef.current = window.setTimeout(() => {
      setOverviewSleepConfirmVisible(false);
      overviewSleepConfirmArmedRef.current = false;
      overviewSleepConfirmTimerRef.current = null;
    }, 4000);
  }

  function handleOverviewSleepController() {
    if (!overviewSleepConfirmVisible) {
      toggleSleepControllerConfirm();
      return;
    }
    if (overviewSleepConfirmTimerRef.current !== null) {
      window.clearTimeout(overviewSleepConfirmTimerRef.current);
      overviewSleepConfirmTimerRef.current = null;
    }
    setOverviewSleepConfirmVisible(false);
    overviewSleepConfirmArmedRef.current = false;
    sleepController();
  }

  function sleepController() {
    void runAction('sleep', () => window.bridge.sleepController());
  }

  function setHostPersonaMode(mode: HostPersonaMode) {
    void runAction('persona-set', () => window.bridge.setHostPersonaMode(mode));
  }

  function setPollingRateMode(mode: PollingRateMode) {
    void runAction('polling-rate', () => window.bridge.setPollingRateMode(mode));
  }

  function toggleLightbarEnabled() {
    const next = !snapshot?.settings.lightbarEnabled;
    void runAction('lightbar-toggle', () => window.bridge.setLightbarEnabled(next));
  }

  function setMuteButtonAction(
    mode: MuteButtonMode,
    usage?: number,
    modifiers?: number,
    behavior?: MuteKeyboardBehavior,
    chordStarterEnabled?: boolean
  ) {
    if (!snapshot) return;
    const keyUsage = usage ?? snapshot.settings.muteKeyboardUsage;
    const keyModifiers = modifiers ?? snapshot.settings.muteKeyboardModifiers;
    const keyBehavior = behavior ?? snapshot.settings.muteKeyboardBehavior;
    const keyChordStarterEnabled = chordStarterEnabled ?? snapshot.settings.muteKeyboardChordStarterEnabled;
    void runAction('mute-button', () =>
      window.bridge.setMuteButtonAction(mode, keyUsage, keyModifiers, keyBehavior, keyChordStarterEnabled)
    );
  }

  function setMuteModifier(bit: number, enabled: boolean) {
    if (!snapshot) return;
    const current = snapshot.settings.muteKeyboardModifiers;
    const next = enabled ? current | bit : current & ~bit;
    setMuteButtonAction(
      snapshot.settings.muteButtonMode,
      snapshot.settings.muteKeyboardUsage,
      next,
      snapshot.settings.muteKeyboardBehavior,
      snapshot.settings.muteKeyboardChordStarterEnabled
    );
  }

  function chooseFirmwareLogDirectory() {
    void runAction('firmware-log-dir', () => window.bridge.selectFirmwareLogDirectory());
  }

  function clearFirmwareLogDirectory() {
    void runAction('firmware-log-clear', () => window.bridge.clearFirmwareLogDirectory());
  }

  const firmwareFlags = snapshot?.status?.firmwareFlags;
  const hapticsSliderMax = firmwareFlags?.companion ? 150 : 100;
  const percentSliderMax = 100;
  const controllerPowerSavingActive = Boolean(
    snapshot?.settings.controllerPowerSavingEnabled && snapshot?.diagnostics.audioStatus?.headsetPlugged
  );
  const lightbarSupported = Boolean(firmwareFlags?.lightbarControl);
  const lightbarEnabled = Boolean(snapshot?.settings.lightbarEnabled);
  const speakerVolumeSupported = Boolean(firmwareFlags?.speakerVolumeControl);
  const sleepControllerSupported = Boolean(firmwareFlags?.sleepControllerControl);
  const duplexMicEnabled = Boolean(snapshot?.settings.duplexMicEnabled);

  const overviewHealthTitle = healthTitle(snapshot);
  const overviewHealthTone = personaTransitionActive
    ? 'warn'
    : snapshot?.diagnostics.lastError
    ? 'bad'
    : connected && controllerConnected
    ? 'good'
    : connected
    ? 'info'
    : 'idle';
  const overviewHealthLabel = healthLabel(snapshot);
  const overviewFirmwareLabel = snapshot?.status?.firmwareVersion ?? '--';

  const selectedControllerProfile = snapshot?.settings.controllerProfiles.find(
    (prof) => prof.id === snapshot.settings.selectedControllerProfileId
  );
  const selectedControllerProfileId = selectedControllerProfile?.id ?? DEFAULT_CONTROLLER_PROFILE_ID;
  const controllerProfileOptions = useMemo<Array<[string, string]>>(
    () =>
      snapshot?.settings.controllerProfiles.map((prof) => [prof.name, prof.id] as [string, string]) ?? [
        ['Default', DEFAULT_CONTROLLER_PROFILE_ID]
      ],
    [snapshot?.settings.controllerProfiles]
  );
  const selectedControllerProfileIsDefault = selectedControllerProfileId === DEFAULT_CONTROLLER_PROFILE_ID;
  const canDeleteControllerProfile = !selectedControllerProfileIsDefault;

  const activeFeedbackTestUnavailable = !connected || pendingAction !== null || p.audioTesting.testLocked;
  const testSpeakerUnavailable = !connected || pendingAction !== null || p.audioTesting.speakerTestLocked;
  const testMicUnavailable = !connected || pendingAction !== null || p.audioTesting.micTestLocked;

  const overviewHostPersonaMode = snapshot?.settings.hostPersonaMode ?? 'dualsense';
  const supportedHostPersonaModes = useMemo<HostPersonaMode[]>(
    () => ['dualsense', 'dualsense-edge', 'ds4', 'xbox'],
    []
  );
  const hostPersonaControlSupported = Boolean(snapshot?.status?.firmwareFlags.hostPersonaControl);
  const hostPersonaOptions = useMemo<Array<[string, HostPersonaMode]>>(
    () => [
      ['DualSense', 'dualsense'],
      ['DualSense Edge', 'dualsense-edge'],
      ['DualShock 4', 'ds4'],
      ['Xbox 360', 'xbox']
    ],
    []
  );

  const controllerToastEnabled = Boolean(snapshot?.settings.notifyControllerConnection);
  const lowBatteryToastEnabled = Boolean(snapshot?.settings.notifyLowBattery);
  const overviewShortcutItems = [
    snapshot?.settings.sleepKeybindEnabled ? { id: 'sleep' as const, label: 'Sleep Shortcut' } : null,
    snapshot?.settings.speakerVolumeShortcutEnabled ? { id: 'volume' as const, label: 'Volume Shortcut' } : null
  ].filter((item): item is { id: 'sleep' | 'volume'; label: string } => Boolean(item));

  const overviewPowerSavingLabel = snapshot?.settings.controllerPowerSavingEnabled
    ? controllerPowerSavingActive ? 'Active' : 'Enabled'
    : 'Off';
  const overviewNotificationItems = [
    controllerToastEnabled ? { id: 'controller-status' as const, label: 'Controller Status' } : null,
    lowBatteryToastEnabled ? { id: 'low-battery' as const, label: 'Low Battery' } : null
  ].filter((item): item is { id: 'controller-status' | 'low-battery'; label: string } => Boolean(item));

  const overviewConnectionStatus = personaTransitionActive
    ? 'Switching'
    : connected && controllerConnected
    ? 'Stable'
    : connected
    ? 'Waiting'
    : 'Offline';
  const overviewSignalValue = connected ? snapshot?.status?.signalStrengthDbm : null;
  const overviewSignalTitle =
    overviewSignalValue !== null && overviewSignalValue !== undefined ? `${overviewSignalValue} dBm` : undefined;
  const overviewSignalLabel =
    overviewSignalValue === null || overviewSignalValue === undefined
      ? '--'
      : overviewSignalValue >= -15
      ? 'Excellent'
      : overviewSignalValue >= -22
      ? 'Good'
      : overviewSignalValue >= -27
      ? 'Audio Risk'
      : 'Poor';
  const pollingRateControlSupported = Boolean(snapshot?.status?.firmwareFlags.pollingRateControl);
  const pollingRateLabel = snapshot?.settings.pollingRateMode ?? '1000Hz';

  const normalizedLightbarColor = normalizeHexColor(controls.lightbarColor);
  const customSwatchColor = controls.customLightbarColor ?? LIGHTBAR_DEFAULT_CUSTOM_COLOR;
  const customSwatchSelected = Boolean(
    controls.customLightbarColor && normalizedLightbarColor === controls.customLightbarColor
  );
  const customColorPickerDisabled = !connected || !lightbarSupported || !lightbarEnabled;
  const lightbarStateActive = connected && lightbarSupported && lightbarEnabled;
  const lightbarStateLabel = lightbarStateActive ? 'Active' : connected && lightbarSupported ? 'Off' : 'Unavailable';

  const muteButtonActionsSupported = Boolean(snapshot?.status?.firmwareFlags.muteButtonActions);
  const diagnosticsVisible = p.activeControlTab === 'system' && p.showDiagnostics;
  const lastAck = snapshot?.diagnostics.lastAck;
  const ackText = !diagnosticsVisible
    ? ''
    : !lastAck
    ? 'No commands yet'
    : `${ackResultName(lastAck.resultCode)} - seq ${lastAck.commandSequence}`;
  const firmwareLogStatus = snapshot?.diagnostics.firmwareLogLastError
    ? `Write failed: ${snapshot.diagnostics.firmwareLogLastError}`
    : !snapshot?.diagnostics.firmwareLogDirectory
    ? 'Choose a folder to start capture.'
    : snapshot?.diagnostics.firmwareLogEnabled === false
    ? 'Unavailable: firmware was not compiled with UART logging.'
    : snapshot?.diagnostics.firmwareLogEnabled === null
    ? 'Waiting for UART-enabled firmware.'
    : snapshot?.diagnostics.firmwareLogPath
    ? 'Capturing retained firmware logs.'
    : 'Starting capture.';
  const audioDebugText = !diagnosticsVisible ? '' : (snapshot?.diagnostics.audioDebugLogLines ?? []).join('\n');
  const audioEventLogText = !diagnosticsVisible
    ? ''
    : (snapshot?.diagnostics.audioDebugLogLines ?? []).length > 0
    ? (snapshot?.diagnostics.audioDebugLogLines ?? []).join('\n')
    : 'No audio debug events captured yet.';
  const triggerTraceText = !diagnosticsVisible
    ? ''
    : (snapshot?.diagnostics.triggerTraceLines ?? []).length > 0
    ? (snapshot?.diagnostics.triggerTraceLines ?? []).join('\n')
    : 'No trigger trace events captured yet.';
  const feedbackTraceText = !diagnosticsVisible
    ? ''
    : (snapshot?.diagnostics.feedbackTraceLines ?? []).length > 0
    ? (snapshot?.diagnostics.feedbackTraceLines ?? []).join('\n')
    : 'No feedback trace events captured yet.';
  const statusTone = personaTransitionActive
    ? 'warn'
    : snapshot?.diagnostics.lastError
    ? 'bad'
    : connected
    ? 'good'
    : 'idle';
  const systemHealthTone = statusTone;

  const overviewProps: OverviewPageProps = {
    active: p.activeControlTab === 'overview',
    snapshot: snapshot!,
    connected,
    pendingAction,
    runAction,
    overviewHealthTone,
    overviewHealthTitle,
    overviewHealthLabel,
    overviewFirmwareLabel,
    selectedControllerProfile,
    selectControlTab: p.selectControlTab,
    setIsGameProfilesModalOpen: p.gameProfiles.setIsGameProfilesModalOpen,
    setIsKitsuneBarInfoOpen: p.setIsKitsuneBarInfoOpen,
    kitsuneInputLogoUrl,
    activeFeedbackTestUnavailable,
    runFeedbackTest: p.audioTesting.runFeedbackTest,
    testSpeakerUnavailable,
    runTestSpeaker: p.audioTesting.runTestSpeaker,
    testMicUnavailable,
    runTestMic: p.audioTesting.runTestMic,
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
    hapticsValue: controls.hapticsValue,
    setHapticsValue: controls.setHapticsValue,
    hapticsEditingRef: controls.hapticsEditingRef,
    commitHapticsValue: controls.commitHapticsValue,
    hapticsSliderTicks: HAPTICS_PRESETS.map(([, v]) => Number(v)),
    speakerVolumeSupported,
    speakerVolumeCommitPending: controls.speakerVolumeCommitPending,
    speakerVolumeValue: controls.speakerVolumeValue,
    setSpeakerVolumeValue: controls.setSpeakerVolumeValue,
    speakerVolumeEditingRef: controls.speakerVolumeEditingRef,
    commitSpeakerVolume: controls.commitSpeakerVolume,
    duplexMicEnabled,
    micVolumeCommitPending: controls.micVolumeCommitPending,
    micVolumeValue: controls.micVolumeValue,
    setMicVolumeValue: controls.setMicVolumeValue,
    micVolumeEditingRef: controls.micVolumeEditingRef,
    commitMicVolume: controls.commitMicVolume,
    lightbarSupported,
    lightbarCommitPending: controls.lightbarCommitPending,
    percentSliderMax,
    lightbarBrightnessValue: controls.lightbarBrightnessValue,
    setLightbarBrightnessValue: controls.setLightbarBrightnessValue,
    lightbarBrightnessEditingRef: controls.lightbarBrightnessEditingRef,
    commitLightbar: controls.commitLightbar,
    overviewShortcutItems,
    focusBridgeSettings: p.focusSettingsTarget,
    psHomeGlyphUrl,
    triangleGlyphUrl,
    dpadUpGlyphUrl,
    dpadDownGlyphUrl,
    overviewPowerSavingLabel,
    overviewNotificationItems,
    focusNotificationSettings: p.focusNotificationSettings,
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
  };

  const devicesProps: ControllerDevicesPageProps = {
    active: p.activeControlTab === 'devices',
    model: p.deviceMgmt.controllerDevicesModel,
    openMenuKey: p.deviceMgmt.openControllerDeviceMenuKey,
    renameDialog: p.deviceMgmt.controllerDeviceRenameDialog,
    forgetDialog: p.deviceMgmt.controllerDeviceForgetDialog,
    pendingAction,
    actionError: p.deviceMgmt.controllerDeviceActionError,
    onStartPairing: p.deviceMgmt.startControllerPairing,
    onToggleMenu: p.deviceMgmt.toggleControllerDeviceMenu,
    onOpenRename: p.deviceMgmt.openControllerDeviceRename,
    onUpdateRename: (value: string) => {
      if (p.deviceMgmt.controllerDeviceRenameDialog) {
        p.deviceMgmt.setControllerDeviceRenameDialog({ ...p.deviceMgmt.controllerDeviceRenameDialog, value });
      }
    },
    onCloseRename: () => p.deviceMgmt.setControllerDeviceRenameDialog(null),
    onConfirmRename: p.deviceMgmt.confirmControllerDeviceRename,
    onOpenForgetAll: p.deviceMgmt.openControllerDeviceForgetAll,
    onOpenForgetOne: p.deviceMgmt.openControllerDeviceForgetOne,
    onCloseForget: p.deviceMgmt.closeControllerDeviceForget,
    onConfirmForget: p.deviceMgmt.confirmControllerDeviceForget
  };

  const deadzonesProps: DeadzonesPageProps = {
    active: p.activeControlTab === 'deadzones',
    snapshot,
    leftStickRadialDeadzoneValue: controls.leftStickRadialDeadzoneValue,
    rightStickRadialDeadzoneValue: controls.rightStickRadialDeadzoneValue,
    setLeftStickRadialDeadzoneValue: controls.setLeftStickRadialDeadzoneValue,
    setRightStickRadialDeadzoneValue: controls.setRightStickRadialDeadzoneValue,
    controllerControlsAvailable: p.controllerControlsAvailable,
    pendingAction,
    radialDeadzoneCommitPending: controls.radialDeadzoneCommitPending,
    radialDeadzoneEditingRef: controls.radialDeadzoneEditingRef,
    commitRadialDeadzone: controls.commitRadialDeadzone,
    sliderTickClass,
    RADIAL_DEADZONE_MAX_PERCENT,
    RADIAL_DEADZONE_TICKS,
    RADIAL_DEADZONE_PRESETS,
    normalizeRadialDeadzonePercent
  };

  const lightingProps: LightingPageProps = {
    active: p.activeControlTab === 'lighting',
    connected,
    snapshot: snapshot!,
    controllerControlsAvailable: p.controllerControlsAvailable,
    lightbarSupported,
    pendingAction,
    toggleLightbarEnabled,
    controllerPowerSavingActive,
    percentSliderMax,
    LIGHTBAR_BRIGHTNESS_STEP,
    lightbarBrightnessValue: controls.lightbarBrightnessValue,
    snapLightbarBrightness,
    setLightbarBrightnessValue: controls.setLightbarBrightnessValue,
    lightbarBrightnessEditingRef: controls.lightbarBrightnessEditingRef,
    commitLightbar: controls.commitLightbar,
    PERCENT_SLIDER_TICKS,
    sliderTickClass,
    LIGHTBAR_PRESETS,
    setLightbarPreset: controls.setLightbarPreset,
    lightbarOverrideSupported: Boolean(firmwareFlags?.lightbarOverrideControl),
    runAction: (name: string, fn: () => Promise<BridgeSnapshot>) => runAction(name, fn),
    LIGHTBAR_SWATCHES,
    lightbarColorName: controls.lightbarColorName,
    normalizedLightbarColor,
    selectLightbarColor: controls.selectLightbarColor,
    customColorPickerRef: controls.customColorPickerRef,
    customSwatchSelected,
    showCustomColorPicker: controls.showCustomColorPicker,
    customSwatchPrimed: controls.customSwatchPrimed,
    customLightbarColor: controls.customLightbarColor,
    customSwatchColor,
    customColorPickerDisabled,
    selectCustomLightbarColor: controls.selectCustomLightbarColor,
    openCustomLightbarPicker: controls.openCustomLightbarPicker,
    customColorDraft: controls.customColorDraft,
    LIGHTBAR_CUSTOM_PALETTE,
    normalizeHexColor,
    previewCustomLightbarColor: controls.previewCustomLightbarColor,
    saveCustomLightbarColor: controls.saveCustomLightbarColor,
    lightbarColor: controls.lightbarColor,
    lightbarStateActive,
    lightbarStateLabel,
    focusBridgeSettings: p.focusSettingsTarget
  };

  const systemProps: SystemPageProps = {
    active: p.activeControlTab === 'system',
    connected,
    pendingAction,
    openDeviceCleanupConfirm: p.deviceMgmt.openDeviceCleanupConfirm,
    selectedControllerProfileId,
    controllerProfileOptions,
    selectControllerProfile: p.selectControllerProfile,
    hapticsCommitPending: controls.hapticsCommitPending,
    speakerVolumeCommitPending: controls.speakerVolumeCommitPending,
    lightbarCommitPending: controls.lightbarCommitPending,
    runAction,
    snapshot: snapshot!,
    muteButtonActionsSupported,
    MUTE_BUTTON_MODE_OPTIONS,
    setMuteButtonAction,
    MUTE_KEY_OPTIONS,
    MUTE_KEYBOARD_BEHAVIOR_OPTIONS,
    MUTE_MODIFIER_OPTIONS,
    setMuteModifier,
    showDiagnostics: p.showDiagnostics,
    setShowDiagnostics: p.setShowDiagnostics,
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
    renameControllerProfile: p.renameControllerProfile,
    saveControllerProfile: p.saveControllerProfile,
    canDeleteControllerProfile,
    deleteControllerProfile: p.deleteControllerProfile,
    controllerPowerSavingActive
  };

  return {
    overviewProps,
    devicesProps,
    deadzonesProps,
    lightingProps,
    systemProps,
    toggleLightbarEnabled
  };
}

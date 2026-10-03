import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-700.css';
import './styles.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconBrandDiscord,
  IconBulb,
  IconDeviceGamepad2,
  IconSparkles as Sparkles,
  IconTool,
  IconDeviceMobileVibration as Vibrate
} from '@tabler/icons-react';
import type { BridgeSnapshot, UiThemePreset } from '../shared/types';
import controllerImage from '../../../assets/controllers/dualsense-edge-front.svg';
import kitsuneInputLogoUrl from './assets/kitsune-input-logo.svg';
import {
  DEFAULT_UI_THEME_PRESET,
  UI_THEME_KOFI_BADGES
} from './ui-themes';
import {
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  DEFAULT_CONTROLLER_PROFILE_ID
} from '../shared/protocol';
import {
  STARTUP_READY_HOLD_MS
} from './constants/app-constants';
import type {
  ChordAssignmentDragSession,
  ControlTab,
  ControlTabGroupId,
  NotificationFocusTarget,
  SettingsFocusTarget
} from './types/app-types';
import {
  batteryLabel,
  controllerName,
  isChargingPowerState,
  isExternalPowerState
} from './utils/controller-status';
import {
  isLightbarPresetColor,
  lightbarColorFromSnapshot
} from './utils/lightbar';
import {
  displayClassicRumbleValue,
  displayHapticsValue,
  displayLightbarBrightnessValue,
  displayTriggerEffectIntensityValue,
  saveStartupTutorialCompleted,
  saveUiThemePreset,
  storedStartupTutorialStep,
  storedUiThemePreset
} from './utils/tab-helpers';
import { audioHapticsSourceKey, snapMicVolume, snapSpeakerVolume } from './utils/audio-testing';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ControlPages } from './components/layout/ControlPages';
import { AppModals } from './components/dialogs/AppModals';
import { StartupScreen } from './components/ui/StartupScreen';
import { useCompanionControls } from './hooks/useCompanionControls';
import { useAudioTestingState } from './hooks/useAudioTestingState';
import { useTriggerLabState } from './hooks/useTriggerLabState';
import { useRemappingState } from './hooks/useRemappingState';
import { useChordsState } from './hooks/useChordsState';
import { useDeviceManagement } from './hooks/useDeviceManagement';
import { useGameProfilesState } from './hooks/useGameProfilesState';
import { useOverviewPagesProps } from './hooks/useOverviewPagesProps';
import { useInputMediaPagesProps } from './hooks/useInputMediaPagesProps';
import type { StartupTutorialStep } from './components/ui/StartupTutorial';

export type {
  ControlTab,
  NotificationFocusTarget,
  SettingsFocusTarget,
  StartupTutorialStep
};

export {
  RemapGlyphOption,
  RemapSourceGlyph,
  TouchpadZoneTargetOption,
  IconTouchpadHand,
  ChordStarterGlyph,
  ChordStarterGlyphOption,
  ChordButtonGlyphOption,
  ThemeOption,
  UptimeCounter
} from './components/ui/GlyphOptions';

export {
  IDLE_DISCONNECT_TIMEOUT_OPTIONS,
  UI_SCALE_OPTIONS,
  REMAP_BUTTONS,
  TOUCHPAD_MODE_OPTIONS,
  TOUCHPAD_TARGET_OPTIONS,
  TURBO_BUTTONS,
  REMAP_EDGE_CONTROL_POINTS,
  REMAP_LEFT_BUTTON_IDS,
  REMAP_RIGHT_BUTTON_IDS,
  REMAP_STANDARD_BUTTON_IDS,
  REMAP_EDGE_BUTTON_IDS,
  REMAP_EDGE_LINE_POINTS,
  REMAP_STANDARD_LAYOUT_ASSET,
  REMAP_EDGE_LAYOUT_ASSET
} from './constants/app-constants';

export function App() {
  const [snapshot, setSnapshot] = useState<BridgeSnapshot | null>(null);
  const [startupVisible, setStartupVisible] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [bridgeRenameDraft, setBridgeRenameDraft] = useState<{ uniqueId: string; value: string } | null>(null);
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>('overview');
  const [openControlGroupId, setOpenControlGroupId] = useState<ControlTabGroupId | null>(null);
  const [showBridgeSettings, setShowBridgeSettings] = useState(false);
  const [settingsFocusTarget, setSettingsFocusTarget] = useState<SettingsFocusTarget | null>(null);
  const [notificationFocusTarget, setNotificationFocusTarget] = useState<NotificationFocusTarget | null>(null);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showKitsuneInputPromotion, setShowKitsuneInputPromotion] = useState(false);
  const [showClassicRumbleControl, setShowClassicRumbleControl] = useState(false);
  const [showMicrophoneControl, setShowMicrophoneControl] = useState(false);
  const [isKitsuneBarInfoOpen, setIsKitsuneBarInfoOpen] = useState(false);
  const [windowDragging, setWindowDragging] = useState(false);
  const [startupTheme, setStartupTheme] = useState<UiThemePreset>(storedUiThemePreset);
  const [startupTutorialStep, setStartupTutorialStep] = useState<StartupTutorialStep>(storedStartupTutorialStep);
  const [startupTutorialFeatureActive, setStartupTutorialFeatureActive] = useState(false);
  const [startupTutorialSupportCountdown, setStartupTutorialSupportCountdown] = useState(5);
  const [controllerProfileDialogMode, setControllerProfileDialogMode] = useState<'save' | 'rename' | 'delete' | null>(null);
  const [controllerProfileNameDraft, setControllerProfileNameDraft] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const bridgeRenameCancelledRef = useRef(false);
  const remappingLayoutRef = useRef<HTMLDivElement>(null);
  const remappingLeftSideRef = useRef<HTMLDivElement>(null);
  const remappingRightSideRef = useRef<HTMLDivElement>(null);
  const remappingArtRef = useRef<HTMLImageElement>(null);
  const settingsFocusTimerRef = useRef<number | null>(null);
  const notificationFocusTimerRef = useRef<number | null>(null);
  const chordAssignmentDragRef = useRef<ChordAssignmentDragSession | null>(null);
  const chordAssignmentListRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const windowDraggingRef = useRef(false);
  const windowDragReleaseTimerRef = useRef<number | null>(null);
  const startupReadyTimerRef = useRef<number | null>(null);
  const startupReadyArmedRef = useRef(false);
  const deferredSnapshotRef = useRef<BridgeSnapshot | null>(null);

  const personaTransition = snapshot?.personaTransition ?? null;
  const personaTransitionActive = Boolean(personaTransition);
  const connected = snapshot?.state === 'connected';
  const controllerConnected = Boolean(snapshot?.status?.controllerConnected);
  const controllerControlsAvailable = connected && controllerConnected;
  const audioHapticsOpen = activeControlTab === 'audio-haptics';

  async function runAction(name: string, fn: () => Promise<any>): Promise<any> {
    setPendingAction(name);
    try {
      const next = await fn();
      if (next && typeof next === 'object' && 'state' in next) {
        applySnapshot(next);
      }
      return next;
    } catch (error) {
      console.error(`Failed action ${name}`, error);
      throw error;
    } finally {
      setPendingAction(null);
    }
  }

  async function runQuietAction(fn: () => Promise<any>): Promise<any> {
    try {
      const next = await fn();
      if (next && typeof next === 'object' && 'state' in next) {
        applySnapshot(next);
      }
      return next;
    } catch (error) {
      console.error('Quiet action error', error);
      throw error;
    }
  }

  const firmwareFlags = snapshot?.status?.firmwareFlags;
  const hapticsSliderMax = firmwareFlags?.companion ? 150 : 100;
  const controllerPowerSavingActive = Boolean(
    snapshot?.settings.controllerPowerSavingEnabled && snapshot?.diagnostics.audioStatus?.headsetPlugged
  );
  const lightbarSupported = Boolean(firmwareFlags?.lightbarControl);
  const speakerVolumeSupported = Boolean(firmwareFlags?.speakerVolumeControl);
  const adaptiveTriggersSupported = Boolean(firmwareFlags?.adaptiveTriggersControl);
  const audioBufferLengthControlSupported = Boolean(firmwareFlags?.hapticsBufferLengthControl);
  const audioReactiveHapticsSupported = Boolean(firmwareFlags?.audioReactiveHapticsControl);
  const usbSuspendDisconnectSupported = Boolean(firmwareFlags?.usbSuspendDisconnectControl);
  const wakeOnConnectSupported = Boolean(firmwareFlags && firmwareFlags.wakeOnConnectControl);
  const sleepControllerSupported = Boolean(firmwareFlags?.sleepControllerControl);
  const audioReactiveHapticsSource = snapshot?.settings.audioReactiveHapticsSource ?? 'system-audio';
  const audioReactiveHapticsSourceKeyVal = audioHapticsSourceKey(audioReactiveHapticsSource);
  const selectedControllerProfile = snapshot?.settings.controllerProfiles.find(
    (prof) => prof.id === (snapshot?.settings.selectedControllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID)
  );

  const deviceMgmt = useDeviceManagement({
    snapshot,
    connected,
    controllerConnected,
    pendingAction,
    setPendingAction,
    applySnapshot
  });

  const controls = useCompanionControls({
    snapshot,
    setSnapshot: (next) => applySnapshot(next),
    applySnapshot,
    runQuietAction,
    controllerPowerSavingActive,
    hapticsSliderMax,
    lightbarSupported,
    speakerVolumeSupported,
    adaptiveTriggersSupported,
    audioBufferLengthControlSupported,
    audioReactiveHapticsSupported,
    audioReactiveHapticsSourceKey: audioReactiveHapticsSourceKeyVal,
    audioHapticsSessionByKey: new Map(),
    pendingAction
  });

  const audioTesting = useAudioTestingState({
    snapshot,
    setSnapshot: (next) => applySnapshot(next),
    pendingAction,
    setPendingAction,
    runAction,
    hapticsValue: controls.hapticsValue,
    classicRumbleValue: controls.classicRumbleValue,
    showClassicRumbleControl,
    speakerVolumeValue: controls.speakerVolumeValue,
    setSpeakerVolumeValue: controls.setSpeakerVolumeValue,
    speakerVolumeSupported,
    speakerVolumeEditingRef: controls.speakerVolumeEditingRef,
    micVolumeValue: controls.micVolumeValue,
    setMicVolumeValue: controls.setMicVolumeValue,
    micVolumeEditingRef: controls.micVolumeEditingRef,
    isPreservingPowerSavingCap: controls.isPreservingPowerSavingCap
  });

  const triggerLab = useTriggerLabState({
    snapshot,
    runAction,
    setTriggerTestLocked: () => {}
  });

  const remapping = useRemappingState({
    snapshot,
    activeControlTab,
    runAction,
    remappingLayoutRef,
    remappingLeftSideRef,
    remappingRightSideRef,
    remappingArtRef
  });

  const chords = useChordsState({
    snapshot,
    activeControlTab,
    pendingAction,
    runQuietAction,
    chordAssignmentListRef,
    chordAssignmentDragRef,
    showDualSenseEdgeRemapButtons: remapping.showDualSenseEdgeRemapButtons
  });

  const gameProfiles = useGameProfilesState({
    selectedControllerProfileId: snapshot?.settings.selectedControllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID,
    selectedRemapProfileId: snapshot?.settings.selectedButtonRemappingProfileId ?? DEFAULT_BUTTON_REMAP_PROFILE_ID,
    runAction
  });

  function applySnapshot(next: BridgeSnapshot) {
    setSnapshot(next);
    remapping.setRemapDraft(next.settings.buttonRemappingDraft);
    if (next.settings.touchpadSettings) {
      remapping.setTouchpadSettings(next.settings.touchpadSettings);
    }
    if (next.settings.turboSettings) {
      remapping.setTurboSettings(next.settings.turboSettings);
    }
    if (!controls.hapticsEditingRef.current) {
      controls.setHapticsValue(displayHapticsValue(next));
    }
    if (!controls.radialDeadzoneEditingRef.current.left) {
      controls.setLeftStickRadialDeadzoneValue(next.settings.leftStickRadialDeadzonePercent);
    }
    if (!controls.radialDeadzoneEditingRef.current.right) {
      controls.setRightStickRadialDeadzoneValue(next.settings.rightStickRadialDeadzonePercent);
    }
    if (!controls.classicRumbleEditingRef.current) {
      controls.setClassicRumbleValue(displayClassicRumbleValue(next));
    }
    if (!controls.speakerVolumeEditingRef.current) {
      controls.setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
    }
    if (!controls.micVolumeEditingRef.current) {
      controls.setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    }
    if (!controls.audioBufferLengthEditingRef.current) {
      controls.setAudioBufferLengthValue(next.settings.hapticsBufferLength);
    }
    const nextLightbarColor = lightbarColorFromSnapshot(next);
    controls.setLightbarColor(nextLightbarColor);
    if (!isLightbarPresetColor(nextLightbarColor)) {
      controls.setCustomLightbarColor(nextLightbarColor);
      controls.setCustomColorDraft(nextLightbarColor);
      window.localStorage.setItem('ds5bridge.customLightbarColor', nextLightbarColor);
    }
    if (!controls.lightbarBrightnessEditingRef.current) {
      controls.setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    }
    if (!controls.triggerEffectEditingRef.current) {
      controls.setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    }
  }

  function beginWindowDrag() {
    windowDraggingRef.current = true;
    setWindowDragging(true);
    if (windowDragReleaseTimerRef.current !== null) {
      window.clearTimeout(windowDragReleaseTimerRef.current);
    }
    windowDragReleaseTimerRef.current = window.setTimeout(finishWindowDrag, 1600);
    window.addEventListener('mouseup', finishWindowDrag, { once: true });
    window.addEventListener('blur', finishWindowDrag, { once: true });
  }

  function finishWindowDrag() {
    windowDraggingRef.current = false;
    setWindowDragging(false);
    if (windowDragReleaseTimerRef.current !== null) {
      window.clearTimeout(windowDragReleaseTimerRef.current);
      windowDragReleaseTimerRef.current = null;
    }
    const deferredSnapshot = deferredSnapshotRef.current;
    deferredSnapshotRef.current = null;
    if (deferredSnapshot) {
      applySnapshot(deferredSnapshot);
    }
  }

  function selectControlTab(tab: ControlTab) {
    setActiveControlTab(tab);
    if (tab === 'haptics' || tab === 'audio-haptics') {
      setOpenControlGroupId('controller');
    } else if (tab === 'remapping' || tab === 'deadzones' || tab === 'chords') {
      setOpenControlGroupId('input');
    } else if (tab === 'trigger-lab') {
      setOpenControlGroupId('labs');
    }
  }

  function focusSettingsTarget(target: SettingsFocusTarget) {
    setShowBridgeSettings(true);
    setSettingsFocusTarget(target);
    if (settingsFocusTimerRef.current !== null) {
      window.clearTimeout(settingsFocusTimerRef.current);
    }
    settingsFocusTimerRef.current = window.setTimeout(() => setSettingsFocusTarget(null), 2500);
  }

  function focusNotificationSettings(target: NotificationFocusTarget | 'all') {
    setShowNotificationsMenu(true);
    setNotificationFocusTarget(target === 'all' ? null : target);
    if (notificationFocusTimerRef.current !== null) {
      window.clearTimeout(notificationFocusTimerRef.current);
    }
    notificationFocusTimerRef.current = window.setTimeout(() => setNotificationFocusTarget(null), 2500);
  }

  function toggleControllerNotifications() {
    const next = !snapshot?.settings.notifyControllerConnection;
    void runAction('notify-controller', () => window.bridge.setNotifyControllerConnection(next));
  }

  function toggleLowBatteryNotifications() {
    const next = !snapshot?.settings.notifyLowBattery;
    void runAction('notify-battery', () => window.bridge.setNotifyLowBattery(next));
  }

  function testNotifications() {
    void runAction('notify-test', () => window.bridge.testNotification());
  }

  function saveControllerProfile() {
    setControllerProfileNameDraft('');
    setControllerProfileDialogMode('save');
  }

  function renameControllerProfile() {
    const selected = snapshot?.settings.controllerProfiles.find(
      (p) => p.id === snapshot.settings.selectedControllerProfileId
    );
    setControllerProfileNameDraft(selected?.name ?? '');
    setControllerProfileDialogMode('rename');
  }

  function deleteControllerProfile() {
    setControllerProfileDialogMode('delete');
  }

  function closeControllerProfileDialog() {
    setControllerProfileDialogMode(null);
    setControllerProfileNameDraft('');
  }

  function submitControllerProfileDialog() {
    const selectedId = snapshot?.settings.selectedControllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID;
    if (controllerProfileDialogMode === 'save') {
      const name = controllerProfileNameDraft.trim();
      closeControllerProfileDialog();
      void runAction('controller-save-profile', () =>
        window.bridge.saveControllerProfile(name || undefined)
      );
      return;
    }
    if (controllerProfileDialogMode === 'rename') {
      const name = controllerProfileNameDraft.trim();
      closeControllerProfileDialog();
      void runAction('controller-rename-profile', () =>
        window.bridge.renameControllerProfile(selectedId, name)
      );
      return;
    }
    if (controllerProfileDialogMode === 'delete') {
      closeControllerProfileDialog();
      void runAction('controller-delete-profile', () =>
        window.bridge.deleteControllerProfile(selectedId)
      );
    }
  }

  function selectControllerProfile(profileId: string) {
    void runAction('controller-select-profile', () =>
      window.bridge.selectControllerProfile(profileId)
    );
  }

  function mountPicoBootloader() {
    void deviceMgmt.runPicoFirmwareAction('pico-firmware-mount', () => window.bridge.mountPicoBootloader());
  }

  function flashPicoFirmware() {
    void deviceMgmt.runPicoFirmwareAction('pico-firmware-flash', () => window.bridge.flashPicoFirmware());
  }

  function nukePicoFlash() {
    void deviceMgmt.runPicoFirmwareAction('pico-firmware-nuke', () => window.bridge.nukePicoFlash());
  }

  function openBridgeRenameDialog(uniqueId: string, currentName: string) {
    bridgeRenameCancelledRef.current = false;
    setBridgeRenameDraft({ uniqueId, value: currentName });
  }

  function closeBridgeRenameDialog() {
    bridgeRenameCancelledRef.current = true;
    setBridgeRenameDraft(null);
  }

  function submitBridgeRenameDialog() {
    if (!bridgeRenameDraft) return;
    const { uniqueId, value } = bridgeRenameDraft;
    closeBridgeRenameDialog();
    void runAction('bridge-rename', () =>
      window.bridge.setBridgeLabel(uniqueId, value.trim() || null)
    );
  }

  useEffect(() => {
    let cancelled = false;
    let receivedLiveSnapshot = false;
    window.bridge.getStatus().then((next) => {
      if (!cancelled && !receivedLiveSnapshot) {
        applySnapshot(next);
      }
    });
    const unsubscribe = window.bridge.onSnapshot((next) => {
      receivedLiveSnapshot = true;
      if (windowDraggingRef.current) {
        deferredSnapshotRef.current = next;
        return;
      }
      applySnapshot(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      if (settingsFocusTimerRef.current !== null) {
        window.clearTimeout(settingsFocusTimerRef.current);
      }
      if (notificationFocusTimerRef.current !== null) {
        window.clearTimeout(notificationFocusTimerRef.current);
      }
      if (windowDragReleaseTimerRef.current !== null) {
        window.clearTimeout(windowDragReleaseTimerRef.current);
      }
      if (startupReadyTimerRef.current !== null) {
        window.clearTimeout(startupReadyTimerRef.current);
      }
      window.removeEventListener('mouseup', finishWindowDrag);
      window.removeEventListener('blur', finishWindowDrag);
    };
  }, []);

  useEffect(() => {
    if (!showKitsuneInputPromotion) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowKitsuneInputPromotion(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showKitsuneInputPromotion]);

  useEffect(() => {
    const liveTheme = snapshot?.settings.uiThemePreset;
    if (!liveTheme) return;
    setStartupTheme(liveTheme);
    saveUiThemePreset(liveTheme);
  }, [snapshot?.settings.uiThemePreset]);

  useEffect(() => {
    const hasSnapshot = Boolean(snapshot);
    if (!hasSnapshot || !startupVisible || startupReadyArmedRef.current) return undefined;
    startupReadyArmedRef.current = true;
    startupReadyTimerRef.current = window.setTimeout(() => {
      setStartupVisible(false);
      startupReadyTimerRef.current = null;
    }, STARTUP_READY_HOLD_MS);
    return () => {
      if (startupReadyTimerRef.current !== null) {
        window.clearTimeout(startupReadyTimerRef.current);
        startupReadyTimerRef.current = null;
      }
    };
  }, [Boolean(snapshot), startupVisible]);

  useEffect(() => {
    if (startupTutorialStep !== 'support') {
      return undefined;
    }

    setStartupTutorialSupportCountdown(5);
    const interval = window.setInterval(() => {
      setStartupTutorialSupportCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [startupTutorialStep]);

  useEffect(() => {
    if (activeControlTab !== 'deadzones') return undefined;
    void window.bridge.requestStickInputPreview();
    const heartbeat = window.setInterval(() => {
      void window.bridge.requestStickInputPreview();
    }, 1000);
    return () => {
      window.clearInterval(heartbeat);
      void window.bridge.releaseStickInputPreview();
    };
  }, [activeControlTab]);

  useEffect(() => {
    const controllerAudioReady = connected && controllerConnected;
    if (!audioHapticsOpen || !controllerAudioReady) {
      audioTesting.setAudioHapticsSessions([]);
      audioTesting.setAudioHapticsSessionsLoading(false);
      return undefined;
    }

    let cancelled = false;
    let refreshInFlight = false;
    async function refreshSessions() {
      if (refreshInFlight) return;
      refreshInFlight = true;
      audioTesting.setAudioHapticsSessionsLoading(true);
      try {
        const sessions = await window.bridge.listAudioHapticsSessions();
        if (!cancelled) audioTesting.setAudioHapticsSessions(sessions);
      } catch {
        if (!cancelled) audioTesting.setAudioHapticsSessions([]);
      } finally {
        if (!cancelled) audioTesting.setAudioHapticsSessionsLoading(false);
        refreshInFlight = false;
      }
    }

    void refreshSessions();
    const handle = window.setInterval(refreshSessions, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [audioHapticsOpen, connected, controllerConnected]);

  const activeTheme = snapshot?.settings.uiThemePreset ?? startupTheme;
  const statusTone = personaTransitionActive
    ? 'warn'
    : snapshot?.diagnostics.lastError
    ? 'bad'
    : connected
    ? 'good'
    : 'idle';
  const sidebarDeviceTone = !connected
    ? 'idle'
    : controllerConnected
    ? 'good'
    : snapshot?.settings.wakeOnConnectEnabled
    ? 'info'
    : 'warn';
  const sidebarDeviceTitle = controllerName(snapshot?.status?.controllerType);
  const sidebarDeviceStatus = !connected
    ? 'Bridge offline'
    : controllerConnected
    ? 'Connected'
    : 'Searching...';
  const sidebarBatteryLabel = batteryLabel(snapshot);
  const batteryCharging = isChargingPowerState(snapshot?.status?.rawPowerState);
  const batteryExternalPower = isExternalPowerState(snapshot?.status?.rawPowerState);
  const batteryPowerLabel = batteryExternalPower
    ? batteryCharging ? 'Charging' : 'Connected to power'
    : null;

  const bridgeDevices = snapshot?.bridgeDevices ?? null;
  const bridgeSelectOptions = useMemo(() => {
    if (!bridgeDevices || !bridgeDevices.bridges || bridgeDevices.bridges.length === 0) {
      return [['No bridge detected', ''] as [string, string]];
    }
    return bridgeDevices.bridges.map((d, index) => [
      `${d.name ?? `Bridge ${index + 1}`}${d.connected ? ' (active)' : ''}`,
      d.path
    ] as [string, string]);
  }, [bridgeDevices]);
  const selectedBridgeInfo = bridgeDevices?.bridges.find((d) => d.selected)
    ?? bridgeDevices?.bridges.find((d) => d.connected)
    ?? bridgeDevices?.bridges[0]
    ?? null;
  const activeBridgeSelectValue = selectedBridgeInfo?.path ?? '';
  const directControllers = useMemo(() => {
    return (bridgeDevices?.directControllers ?? []).map((p) => ({ path: p.path, product: p.product ?? 'DualSense' }));
  }, [bridgeDevices?.directControllers]);

  const controllerToastEnabled = Boolean(snapshot?.settings.notifyControllerConnection);
  const lowBatteryToastEnabled = Boolean(snapshot?.settings.notifyLowBattery);
  const notificationsEnabled = controllerToastEnabled || lowBatteryToastEnabled;

  const kofiBadgeUrl = UI_THEME_KOFI_BADGES[activeTheme] ?? UI_THEME_KOFI_BADGES[DEFAULT_UI_THEME_PRESET];

  const overviewPages = useOverviewPagesProps({
    snapshot,
    connected,
    controllerConnected,
    controllerControlsAvailable,
    activeControlTab,
    pendingAction,
    runAction,
    runQuietAction,
    controls,
    deviceMgmt,
    gameProfiles,
    audioTesting,
    selectControlTab,
    focusSettingsTarget,
    focusNotificationSettings,
    setIsKitsuneBarInfoOpen,
    showDiagnostics,
    setShowDiagnostics,
    saveControllerProfile,
    renameControllerProfile,
    deleteControllerProfile,
    selectControllerProfile
  });

  const inputMediaPages = useInputMediaPagesProps({
    snapshot,
    connected,
    controllerConnected,
    controllerControlsAvailable,
    activeControlTab,
    pendingAction,
    runAction,
    runQuietAction,
    controls,
    audioTesting,
    triggerLab,
    remapping,
    chords,
    chordAssignmentListRef,
    remappingLayoutRef,
    remappingLeftSideRef,
    remappingArtRef,
    remappingRightSideRef,
    showClassicRumbleControl,
    setShowClassicRumbleControl,
    showMicrophoneControl,
    setShowMicrophoneControl,
    selectControlTab,
    setActiveControlTab,
    focusSettingsTarget
  });

  if (!snapshot || startupVisible) {
    return (
      <div className="shell loading" data-theme={activeTheme}>
        <StartupScreen ready={Boolean(snapshot)} />
      </div>
    );
  }

  return (
    <div
      className={[
        'shell',
        windowDragging ? 'window-dragging' : '',
        controllerControlsAvailable ? '' : 'controller-unavailable'
      ].filter(Boolean).join(' ')}
      data-theme={activeTheme}
    >
      <Header
        snapshot={snapshot}
          connected={connected}
          showKitsuneInputPromotion={showKitsuneInputPromotion}
          setShowKitsuneInputPromotion={setShowKitsuneInputPromotion}
          setShowBridgeSettings={setShowBridgeSettings}
          showNotificationsMenu={showNotificationsMenu}
          setShowNotificationsMenu={setShowNotificationsMenu}
          notificationsRef={notificationsRef}
          notificationsEnabled={notificationsEnabled}
          notificationFocusTarget={notificationFocusTarget}
          controllerToastEnabled={controllerToastEnabled}
          lowBatteryToastEnabled={lowBatteryToastEnabled}
          pendingAction={pendingAction}
          toggleControllerNotifications={toggleControllerNotifications}
          toggleLowBatteryNotifications={toggleLowBatteryNotifications}
          testNotifications={testNotifications}
          beginWindowDrag={beginWindowDrag}
          kitsuneInputLogoUrl={kitsuneInputLogoUrl}
        />
      <main className="app-content">
        <Sidebar
          snapshot={snapshot!}
          statusTone={statusTone}
          sidebarDeviceTone={sidebarDeviceTone}
          sidebarDeviceTitle={sidebarDeviceTitle}
          sidebarDeviceStatus={sidebarDeviceStatus}
          sidebarBatteryLabel={sidebarBatteryLabel}
          batteryPowerLabel={batteryPowerLabel}
          activeBridgeSelectValue={activeBridgeSelectValue}
          bridgeSelectOptions={bridgeSelectOptions}
          selectedBridgeInfo={selectedBridgeInfo}
          bridgeRenameDraft={bridgeRenameDraft}
          setBridgeRenameDraft={setBridgeRenameDraft}
          bridgeRenameCancelledRef={bridgeRenameCancelledRef}
          pendingAction={pendingAction}
          runAction={runAction}
          directControllers={directControllers}
          activeControlTab={activeControlTab}
          selectControlTab={selectControlTab}
          openControlGroupId={openControlGroupId}
          setOpenControlGroupId={setOpenControlGroupId}
          kofiBadgeUrl={kofiBadgeUrl}
          showBridgeSettings={showBridgeSettings}
          setShowBridgeSettings={setShowBridgeSettings}
          controllerImage={controllerImage}
          onOpenLibrary={() => gameProfiles.setIsGameProfilesModalOpen(true)}
        />
        <ControlPages
          activeControlTab={activeControlTab}
          overviewProps={overviewPages.overviewProps}
          devicesProps={overviewPages.devicesProps}
          deadzonesProps={overviewPages.deadzonesProps}
          gyroProps={{
            active: activeControlTab === 'gyro',
            snapshot,
            connected,
            pendingAction,
            runAction
          }}
          multiActionsProps={{
            active: activeControlTab === 'multi-actions',
            snapshot,
            connected,
            pendingAction,
            runAction
          }}
          lightingProps={overviewPages.lightingProps}
          systemProps={overviewPages.systemProps}
          hapticsProps={inputMediaPages.hapticsProps}
          audioProps={inputMediaPages.audioProps}
          triggersProps={inputMediaPages.triggersProps}
          remappingProps={inputMediaPages.remappingProps}
          chordsProps={inputMediaPages.chordsProps}
          kitsuneBarProps={{
            active: activeControlTab === 'kitsune-bar',
            snapshot,
            connected,
            pendingAction,
            runAction,
            onOpenLibrary: () => gameProfiles.setIsGameProfilesModalOpen(true)
          }}
        />
      </main>
      <AppModals
        snapshot={snapshot}
        connected={connected}
        pendingAction={pendingAction}
        runAction={runAction}
        showKitsuneInputPromotion={showKitsuneInputPromotion}
        setShowKitsuneInputPromotion={setShowKitsuneInputPromotion}
        startupTutorialStep={startupTutorialStep}
        setStartupTutorialStep={setStartupTutorialStep}
        startupTutorialFeatureActive={startupTutorialFeatureActive}
        setStartupTutorialFeatureActive={setStartupTutorialFeatureActive}
        startupTutorialSupportCountdown={startupTutorialSupportCountdown}
        kofiBadgeUrl={kofiBadgeUrl}
        saveStartupTutorialCompleted={saveStartupTutorialCompleted}
        deviceCleanupConfirmVisible={deviceMgmt.deviceCleanupConfirmVisible}
        controllerConnected={controllerConnected}
        deviceCleanupError={deviceMgmt.deviceCleanupError}
        deviceCleanupMessage={deviceMgmt.deviceCleanupMessage}
        closeDeviceCleanupConfirm={deviceMgmt.closeDeviceCleanupConfirm}
        runWindowsDeviceCleanup={deviceMgmt.runWindowsDeviceCleanup}
        chordFunctionDialog={chords.chordFunctionDialog}
        chordFunctionDialogFunction={chords.chordFunctionDialogFunction}
        chordFunctionNameDraft={chords.chordFunctionNameDraft}
        setChordFunctionNameDraft={chords.setChordFunctionNameDraft}
        closeChordFunctionDialog={chords.closeChordFunctionDialog}
        submitChordFunctionDialog={chords.submitChordFunctionDialog}
        triggerLabProfileDialog={triggerLab.triggerLabProfileDialog}
        triggerLabProfileNameDraft={triggerLab.triggerLabProfileNameDraft}
        setTriggerLabProfileNameDraft={triggerLab.setTriggerLabProfileNameDraft}
        closeTriggerLabProfileDialog={triggerLab.closeTriggerLabProfileDialog}
        submitTriggerLabProfileDialog={triggerLab.submitTriggerLabProfileDialog}
        triggerLabDrafts={triggerLab.triggerLabDrafts}
        triggerLabProfileName={triggerLab.triggerLabProfileName}
        remapProfileDialogMode={remapping.remapProfileDialogMode}
        remapProfileNameDraft={remapping.remapProfileNameDraft}
        setRemapProfileNameDraft={remapping.setRemapProfileNameDraft}
        closeRemapProfileDialog={remapping.closeRemapProfileDialog}
        submitRemapProfileDialog={remapping.submitRemapProfileDialog}
        selectedRemapProfile={remapping.selectedRemapProfile}
        controllerProfileDialogMode={controllerProfileDialogMode}
        controllerProfileNameDraft={controllerProfileNameDraft}
        setControllerProfileNameDraft={setControllerProfileNameDraft}
        closeControllerProfileDialog={closeControllerProfileDialog}
        submitControllerProfileDialog={submitControllerProfileDialog}
        selectedControllerProfile={selectedControllerProfile}
        isGameProfilesModalOpen={gameProfiles.isGameProfilesModalOpen}
        setIsGameProfilesModalOpen={gameProfiles.setIsGameProfilesModalOpen}
        editingGameProfile={gameProfiles.editingGameProfile}
        setEditingGameProfile={gameProfiles.setEditingGameProfile}
        gameProfileDeleteConfirmId={gameProfiles.gameProfileDeleteConfirmId}
        setGameProfileDeleteConfirmId={gameProfiles.setGameProfileDeleteConfirmId}
        runningProcesses={gameProfiles.runningProcesses}
        runningProcessesLoading={gameProfiles.runningProcessesLoading}
        refreshRunningProcesses={gameProfiles.refreshRunningProcesses}
        openAddGameProfile={gameProfiles.openAddGameProfile}
        openEditGameProfile={gameProfiles.openEditGameProfile}
        closeGameProfileForm={gameProfiles.closeGameProfileForm}
        saveCurrentGameProfile={gameProfiles.saveCurrentGameProfile}
        confirmDeleteGameProfile={gameProfiles.confirmDeleteGameProfile}
        isKitsuneBarInfoOpen={isKitsuneBarInfoOpen}
        setIsKitsuneBarInfoOpen={setIsKitsuneBarInfoOpen}
        showBridgeSettings={showBridgeSettings}
        setShowBridgeSettings={setShowBridgeSettings}
        usbSuspendDisconnectSupported={usbSuspendDisconnectSupported}
        wakeOnConnectSupported={wakeOnConnectSupported}
        sleepControllerSupported={sleepControllerSupported}
        settingsFocusTarget={settingsFocusTarget}
        picoFirmwareMessage={deviceMgmt.picoFirmwareMessage}
        picoFirmwareError={deviceMgmt.picoFirmwareError}
        nukePicoFlash={nukePicoFlash}
        mountPicoBootloader={mountPicoBootloader}
        flashPicoFirmware={flashPicoFirmware}
      />
    </div>
  );
}

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';
import {
  IconHeadphones as Headphones,
  IconVolume as Volume2
} from '@tabler/icons-react';
import type {
  AdaptiveTriggerPreviewEffect,
  ChordAssignableButtonId,
  ChordAssignment,
  ChordControllerSettingAction,
  ChordFunction,
  ChordFunctionType,
  ChordMediaAction,
  ChordStarterId,
  RemapButtonId,
  TriggerTestMode,
  TriggerTestTarget
} from '../../shared/protocol';
import {
  DEFAULT_BUTTON_REMAP_PROFILE_ID,
  MAX_KEYBOARD_FUNCTION_KEYS,
  REMAP_BUTTON_IDS
} from '../../shared/protocol';
import type {
  AudioHapticsSession,
  BridgeSnapshot
} from '../../shared/types';
import type {
  TouchpadGesture,
  TouchpadMode,
  TouchpadSettings,
  TouchpadZoneId,
  TouchpadZoneTarget
} from '../../shared/touchpad-gestures';
import l2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/L2.svg';
import r2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/R2.svg';
import {
  AUDIO_BUFFER_LENGTH_MAX,
  AUDIO_BUFFER_LENGTH_MIN,
  AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS,
  AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS,
  AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS,
  CHORD_CONTROLLER_SETTING_ACTION_OPTIONS,
  CHORD_FUNCTION_TYPE_OPTIONS,
  CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH,
  CHORD_KEYBOARD_KEY_OPTIONS,
  CHORD_KEYBOARD_MODIFIER_OPTIONS,
  CHORD_MEDIA_ACTION_OPTIONS,
  HAPTICS_PRESETS,
  HAPTICS_STEP,
  MIC_VOLUME_PRESETS,
  MIC_VOLUME_STEP,
  PERCENT_SLIDER_TICKS,
  SPEAKER_GAIN_OPTIONS,
  SPEAKER_VOLUME_PRESETS,
  SPEAKER_VOLUME_STEP,
  TEST_TRIGGER_LOCK_MS,
  TRIGGER_EFFECT_PRESETS,
  TRIGGER_EFFECT_STEP,
  TRIGGER_TARGET_OPTIONS,
  TRIGGER_TEST_MODE_OPTIONS
} from '../constants/app-constants';
import type {
  ChordAssignmentDraftRow,
  ChordAssignmentDropHint,
  ChordButtonSelectValue,
  ChordControllerSettingSelectValue,
  ChordFunctionDraft,
  ChordKeyboardModifier,
  ControlTab,
  RemapCalloutLayout,
  RemapProfileDialogMode,
  SettingsFocusTarget,
  TriggerLabDraft,
  TriggerLabProfileDialogMode,
  TriggerLabProfileDialogState,
  TriggerLabProfileId,
  TriggerLabSide
} from '../types/app-types';
import {
  audioBufferDelayLabel,
  audioBufferZoneLabel,
  audioBufferZoneTone,
  audioBufferZoneTooltip,
  audioHapticsSessionKey,
  audioHapticsSourceKey,
  snapMicVolume,
  snapSpeakerVolume,
  stopMicLiveListen
} from '../utils/audio-testing';
import {
  chordAssignmentKey,
  chordAssignmentLabel,
  chordControllerSettingActionFromSelectValue,
  chordControllerSettingSelectValue,
  chordFunctionSummary,
  chordFunctionToDraft
} from '../utils/chords';
import { sliderTickClass, snapHapticsValue } from '../utils/tab-helpers';
import { snapTriggerEffectIntensity } from '../utils/trigger-lab';
import { TriggerLabCard } from '../components/triggers/TriggerLabCard';
import type { HapticsPageProps } from '../pages/HapticsPage';
import type { AudioPageProps } from '../pages/AudioPage';
import type { TriggersPageProps } from '../pages/TriggersPage';
import type { RemappingPageProps } from '../pages/RemappingPage';
import type { ChordsPageProps } from '../pages/ChordsPage';
import type { useCompanionControls } from './useCompanionControls';
import type { useAudioTestingState } from './useAudioTestingState';
import type { useTriggerLabState } from './useTriggerLabState';
import type { useRemappingState } from './useRemappingState';
import type { useChordsState } from './useChordsState';

export interface UseInputMediaPagesPropsParams {
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  controllerConnected: boolean;
  controllerControlsAvailable: boolean;
  activeControlTab: ControlTab;
  pendingAction: string | null;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  runQuietAction: (fn: () => Promise<any>) => Promise<any>;
  controls: ReturnType<typeof useCompanionControls>;
  audioTesting: ReturnType<typeof useAudioTestingState>;
  triggerLab: ReturnType<typeof useTriggerLabState>;
  remapping: ReturnType<typeof useRemappingState>;
  chords: ReturnType<typeof useChordsState>;
  chordAssignmentListRef: RefObject<HTMLDivElement | null>;
  remappingLayoutRef: RefObject<HTMLDivElement | null>;
  remappingLeftSideRef: RefObject<HTMLDivElement | null>;
  remappingArtRef: RefObject<HTMLImageElement | null>;
  remappingRightSideRef: RefObject<HTMLDivElement | null>;
  showClassicRumbleControl: boolean;
  setShowClassicRumbleControl: (show: boolean) => void;
  showMicrophoneControl: boolean;
  setShowMicrophoneControl: (show: boolean) => void;
  selectControlTab: (tab: ControlTab) => void;
  setActiveControlTab: (tab: ControlTab) => void;
  focusSettingsTarget: (target: SettingsFocusTarget) => void;
}

export function useInputMediaPagesProps(p: UseInputMediaPagesPropsParams) {
  const {
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
    chords
  } = p;

  const [triggerTestLocked, setTriggerTestLocked] = useState(false);
  const triggerLabRestoreAppliedRef = useRef(false);

  const triggerLabOpen = activeControlTab === 'trigger-lab';
  const audioHapticsOpen = activeControlTab === 'audio-haptics';

  const firmwareFlags = snapshot?.status?.firmwareFlags;
  const hapticsSliderMax = firmwareFlags?.companion ? 150 : 100;
  const speakerVolumeSupported = Boolean(firmwareFlags?.speakerVolumeControl);
  const adaptiveTriggersSupported = Boolean(firmwareFlags?.adaptiveTriggersControl);
  const audioBufferLengthControlSupported = Boolean(snapshot?.status?.firmwareFlags.hapticsBufferLengthControl);
  const duplexMicEnabled = Boolean(snapshot?.settings.duplexMicEnabled);
  const controllerPowerSavingActive = Boolean(
    snapshot?.settings.controllerPowerSavingEnabled && snapshot?.diagnostics.audioStatus?.headsetPlugged
  );

  function toggleAdaptiveTriggersEnabled() {
    const next = !snapshot?.settings.adaptiveTriggersEnabled;
    void runAction('adaptive-triggers-toggle', () => window.bridge.setAdaptiveTriggersEnabled(next));
  }

  function toggleTriggerLabEnabled() {
    triggerLab.setTriggerLabEnabled(!triggerLab.triggerLabEnabled);
    void runAction('trigger-lab-enabled', () => window.bridge.resetAdaptiveTriggers());
  }

  function toggleHapticsEnabled() {
    const next = !snapshot?.settings.hapticsEnabled;
    void runAction('haptics-toggle', () => window.bridge.setHapticsEnabled(next));
  }

  function toggleClassicRumbleEnabled() {
    const next = !snapshot?.settings.classicRumbleEnabled;
    void runAction('rumble-toggle', () => window.bridge.setClassicRumbleEnabled(next));
  }

  function toggleClassicRumbleV1Enabled() {
    const next = !snapshot?.settings.classicRumbleV1Enabled;
    void runAction('rumble-v1-toggle', () => window.bridge.setClassicRumbleV1Enabled(next));
  }

  function toggleFeedbackBoostEnabled() {
    const next = !snapshot?.settings.feedbackBoostEnabled;
    void runAction('feedback-boost', () => window.bridge.setFeedbackBoostEnabled(next));
  }

  function toggleAudioEnabled() {
    if (!snapshot) return;
    const enabled = !(snapshot.settings.speakerEnabled || snapshot.settings.duplexMicEnabled);
    void runAction('audio-enabled', async () => {
      let next = snapshot;
      if (next.settings.speakerEnabled !== enabled) {
        next = await window.bridge.setSpeakerEnabled(enabled);
      }
      if (!enabled && next.settings.duplexMicEnabled) {
        next = await window.bridge.setDuplexMicEnabled(false);
      }
      return next;
    });
  }

  function toggleDuplexMicEnabled() {
    if (!snapshot) return;
    void runAction('duplex-mic-enabled', () => window.bridge.setDuplexMicEnabled(!snapshot.settings.duplexMicEnabled));
  }

  function toggleSpeakerEnabled() {
    const next = !snapshot?.settings.speakerEnabled;
    void runAction('speaker-toggle', () => window.bridge.setSpeakerEnabled(next));
  }

  function toggleMicMute() {
    if (!snapshot) return;
    void runAction('mic-mute', () => window.bridge.setMicMute(!snapshot.settings.micMuted));
  }

  function resetAdaptiveTriggers() {
    void runAction('trigger-reset', () => window.bridge.resetAdaptiveTriggers());
  }

  function runTestAdaptiveTriggers() {
    setTriggerTestLocked(true);
    void runAction('trigger-test', () =>
      window.bridge.previewAdaptiveTriggerEffect({
        mode: snapshot?.settings.triggerTestMode ?? 'feedback',
        target: controls.triggerTarget,
        startPercent: 0,
        wallPercent: 20,
        forcePercent: controls.triggerEffectIntensityValue
      })
    ).finally(() => {
      window.setTimeout(() => setTriggerTestLocked(false), TEST_TRIGGER_LOCK_MS);
    });
  }

  function setTriggerTestMode(mode: TriggerTestMode) {
    void runQuietAction(() => window.bridge.setTriggerTestMode(mode));
  }

  const audioReactiveHapticsModeBadgeLabel = controls.audioReactiveHapticsCommitPending
    ? 'Updating...'
    : snapshot?.settings.audioReactiveHapticsMode === 'replace'
    ? 'Override'
    : 'Mixed';
  const audioReactiveHapticsOverrideMode = snapshot?.settings.audioReactiveHapticsMode === 'replace';
  const audioReactiveHapticsModeTooltip = audioReactiveHapticsOverrideMode
    ? 'Audio haptics are replacing native haptic output.'
    : 'Audio haptics are mixed with native haptic output.';
  const audioReactiveHapticsEnabled = Boolean(snapshot?.settings.audioReactiveHapticsEnabled);
  const activeHapticsFeatureEnabled = Boolean(snapshot?.settings.hapticsEnabled);
  const audioReactiveHapticsControlDisabled = !connected || pendingAction !== null;
  const audioReactiveHapticsConfigDisabled = audioReactiveHapticsControlDisabled || !audioReactiveHapticsEnabled;
  const audioReactiveHapticsStatusLabel = audioReactiveHapticsEnabled ? 'Active' : 'Off';
  const audioReactiveHapticsStatusTone = audioReactiveHapticsEnabled ? 'good' : 'idle';
  const selectedAudioHapticsSourceDisplayName = 'System Audio';
  const audioHapticsSourceOptions = useMemo<Array<[string, string]>>(() => [['System Audio', 'system-audio']], []);

  const feedbackBoostEnabled = Boolean(snapshot?.settings.feedbackBoostEnabled);
  const classicRumbleV1Enabled = Boolean(snapshot?.settings.classicRumbleV1Enabled);
  const activeFeedbackStatusTone = audioTesting.testLocked ? 'good' : 'idle';
  const activeFeedbackStatusLabel = audioTesting.testLocked ? 'Testing...' : 'Ready';
  const activeFeedbackTestUnavailable = !connected || pendingAction !== null || audioTesting.testLocked;

  const headsetOutputDetected = Boolean(snapshot?.diagnostics.audioStatus?.headsetPlugged);
  const OutputIcon = headsetOutputDetected ? Headphones : Volume2;
  const outputControlLabel = headsetOutputDetected ? 'Headphones' : 'Speaker';
  const outputControlLower = headsetOutputDetected ? 'headphones' : 'speaker';
  const speakerGainLevel = snapshot?.settings.speakerGainLevel ?? 4;
  const audioEnabled = Boolean(snapshot?.settings.speakerEnabled || snapshot?.settings.duplexMicEnabled);
  const duplexMicLabel = duplexMicEnabled ? 'Duplex Enabled' : 'Off';
  const audioBufferLengthControlDisabled = !connected || pendingAction !== null || !audioBufferLengthControlSupported;
  const audioBufferPercent = (value: number) => Math.round(((value - 2) / (16 - 2)) * 100);
  const activeAudioTestUnavailable =
    !connected || pendingAction !== null || audioTesting.speakerTestLocked || audioTesting.micTestLocked;
  const gameStreamActive = false;
  const speakerOutputMissing = Boolean(audioTesting.speakerOutputAvailable === false);
  const activeAudioTestLocked = audioTesting.speakerTestLocked || audioTesting.micTestLocked;
  const activeAudioTestStatusTone = activeAudioTestLocked ? 'good' : 'idle';
  const activeAudioTestStatusLabel = activeAudioTestLocked ? 'Testing...' : 'Ready';
  const audioPathTone = connected ? 'good' : 'idle';
  const audioPathTooltip = 'Audio transport route';
  const audioPathLabel = connected ? 'Pico Local' : '--';

  const adaptiveTriggersEnabled = Boolean(snapshot?.settings.adaptiveTriggersEnabled);
  const triggerLabEnabled = triggerLab.triggerLabEnabled;
  const triggerPageEnabled = triggerLabOpen ? triggerLabEnabled : adaptiveTriggersEnabled;
  const adaptiveTriggerOutputActive = Boolean(snapshot?.status?.adaptiveTriggerOutputRecent);
  const testTriggersUnavailable =
    !connected || !adaptiveTriggersSupported || !adaptiveTriggersEnabled || pendingAction !== null || triggerTestLocked;
  const triggerStatusReady =
    connected && adaptiveTriggersSupported && adaptiveTriggersEnabled && !triggerTestLocked;
  const triggerStatusLabel = triggerTestLocked ? 'Testing' : triggerStatusReady ? 'Ready' : 'Unavailable';
  const triggerStatusTone = triggerTestLocked || triggerStatusReady ? 'good' : 'idle';

  useEffect(() => {
    triggerLabRestoreAppliedRef.current = false;
  }, [adaptiveTriggersEnabled, connected, triggerLabEnabled]);

  useEffect(() => {
    if (
      triggerLabRestoreAppliedRef.current ||
      !connected ||
      !adaptiveTriggersSupported ||
      !triggerLabEnabled ||
      pendingAction !== null
    ) {
      return;
    }

    triggerLabRestoreAppliedRef.current = true;
    if (!triggerLab.triggerLabAnyActive) {
      return;
    }

    if (triggerLab.triggerLabLinked) {
      const active =
        triggerLab.triggerLabActive.l2 &&
        triggerLab.triggerLabActive.r2 &&
        triggerLab.triggerLabDrafts.l2.forcePercent > 0;
      triggerLab.persistTriggerLab('l2', triggerLab.triggerLabDrafts.l2, active, 'trigger-lab-restore', 'both');
      return;
    }

    triggerLab.persistTriggerLabSplitState(
      {
        drafts: triggerLab.triggerLabDrafts,
        active: triggerLab.triggerLabActive
      },
      'trigger-lab-restore'
    );
  }, [
    adaptiveTriggersSupported,
    connected,
    pendingAction,
    triggerLab.persistTriggerLab,
    triggerLab.persistTriggerLabSplitState,
    triggerLab.triggerLabActive,
    triggerLab.triggerLabAnyActive,
    triggerLab.triggerLabDrafts,
    triggerLabEnabled,
    triggerLab.triggerLabLinked
  ]);

  function renderTriggerLabCard(side: TriggerLabSide): ReactNode {
    return (
      <TriggerLabCard
        key={side}
        side={side}
        draft={triggerLab.triggerLabDrafts[side]}
        active={triggerLab.triggerLabActive[side]}
        connected={connected}
        adaptiveTriggersSupported={adaptiveTriggersSupported}
        triggerLabEnabled={triggerLab.triggerLabEnabled}
        pendingAction={pendingAction}
        triggerTestLocked={triggerTestLocked}
        adaptiveTriggerOutputActive={adaptiveTriggerOutputActive}
        testAdaptiveTriggersBusy={Boolean(snapshot?.status?.testAdaptiveTriggersBusy)}
        triggerLabLinked={triggerLab.triggerLabLinked}
        triggerLabProfileOptions={triggerLab.triggerLabProfileOptions}
        triggerLabProfileDialog={triggerLab.triggerLabProfileDialog}
        toggleTriggerLabActive={triggerLab.toggleTriggerLabActive}
        setTriggerLabProfile={triggerLab.setTriggerLabProfile}
        openTriggerLabProfileDialog={triggerLab.openTriggerLabProfileDialog}
        toggleTriggerLabLinked={triggerLab.toggleTriggerLabLinked}
        setTriggerLabMode={triggerLab.setTriggerLabMode}
        setTriggerLabPercent={triggerLab.setTriggerLabPercent}
        commitTriggerLabPercent={triggerLab.commitTriggerLabPercent}
        previewTriggerLab={triggerLab.previewTriggerLab}
        resetTriggerLab={resetAdaptiveTriggers}
        triggerLabProfileIsCustom={triggerLab.triggerLabProfileIsCustom}
        l2GlyphUrl={l2GlyphUrl}
        r2GlyphUrl={r2GlyphUrl}
      />
    );
  }

  const selectedRemapProfile = snapshot?.settings.buttonRemappingProfiles?.find(
    (prof) => prof.id === snapshot.settings.selectedButtonRemappingProfileId
  );
  const selectedRemapProfileId = selectedRemapProfile?.id ?? DEFAULT_BUTTON_REMAP_PROFILE_ID;
  const remapProfileOptions = useMemo<Array<[string, string]>>(
    () =>
      snapshot?.settings.buttonRemappingProfiles?.map((prof) => [prof.name, prof.id] as [string, string]) ?? [
        ['Default', DEFAULT_BUTTON_REMAP_PROFILE_ID]
      ],
    [snapshot?.settings.buttonRemappingProfiles]
  );
  const selectedRemapProfileIsDefault = selectedRemapProfileId === DEFAULT_BUTTON_REMAP_PROFILE_ID;
  const remapTargetOptionsFor = (source: RemapButtonId) =>
    REMAP_BUTTON_IDS.map((id: RemapButtonId) => [id, id] as [string, RemapButtonId]);

  const zoneCoords: Record<TouchpadZoneId, { x: number; y: number }> = {
    1: { x: 100, y: 55 },
    2: { x: 300, y: 55 },
    3: { x: 100, y: 165 },
    4: { x: 300, y: 165 }
  };

  const muteChordStarterIsInactive = (starter: ChordStarterId) =>
    starter === 'mute' && snapshot?.settings.muteButtonMode !== 'chord';
  const chordButtonOptionsFor = (
    starter: ChordStarterId,
    includeUnassigned?: boolean,
    currentButton?: ChordAssignableButtonId
  ) => chords.allowedChordButtonsForStarter(starter, currentButton, includeUnassigned);

  const rawHapticsSource = snapshot?.settings.audioReactiveHapticsSource ?? 'system-audio';
  const audioReactiveHapticsSourceKeyVal = audioHapticsSourceKey(rawHapticsSource);
  const audioHapticsSessionByKeyMap = useMemo(() => {
    const map = new Map<string, AudioHapticsSession>();
    for (const session of audioTesting.audioHapticsSessions) {
      map.set(audioHapticsSessionKey(session), session);
    }
    return map;
  }, [audioTesting.audioHapticsSessions]);

  const hapticsProps: HapticsPageProps = {
    active: activeControlTab === 'haptics' || activeControlTab === 'audio-haptics',
    audioHapticsOpen,
    audioReactiveHapticsModeBadgeLabel,
    audioReactiveHapticsOverrideMode,
    audioReactiveHapticsModeTooltip,
    audioReactiveHapticsEnabled,
    activeHapticsFeatureEnabled,
    audioReactiveHapticsControlDisabled,
    controllerControlsAvailable,
    pendingAction,
    toggleAudioReactiveHapticsEnabled: controls.toggleAudioReactiveHapticsEnabled,
    showClassicRumbleControl: p.showClassicRumbleControl,
    setShowClassicRumbleControl: p.setShowClassicRumbleControl,
    toggleClassicRumbleEnabled,
    toggleHapticsEnabled,
    audioReactiveHapticsStatusLabel,
    hapticsSliderMax,
    hapticsValue: controls.hapticsValue,
    setHapticsValue: controls.setHapticsValue,
    connected,
    snapshot: snapshot!,
    hapticsCommitPending: controls.hapticsCommitPending,
    hapticsEditingRef: controls.hapticsEditingRef,
    commitHapticsValue: controls.commitHapticsValue,
    hapticsSliderTicks: HAPTICS_PRESETS.map(([, v]) => Number(v)),
    sliderTickClass,
    HAPTICS_PRESETS,
    snapHapticsValue,
    setHapticsPreset: controls.setHapticsPreset,
    audioReactiveHapticsSourceKey: audioReactiveHapticsSourceKeyVal,
    audioHapticsSourceOptions,
    audioReactiveHapticsConfigDisabled,
    audioHapticsSessionByKey: audioHapticsSessionByKeyMap,
    audioHapticsSessionsLoading: audioTesting.audioHapticsSessionsLoading,
    setAudioReactiveHapticsSourceValue: controls.setAudioReactiveHapticsSourceValue,
    AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS,
    setAudioReactiveHapticsMode: controls.setAudioReactiveHapticsMode,
    AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS,
    AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS,
    setAudioReactiveHapticsBassFocus: controls.setAudioReactiveHapticsBassFocus,
    AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS,
    setAudioReactiveHapticsResponse: controls.setAudioReactiveHapticsResponse,
    AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS,
    setAudioReactiveHapticsAttack: controls.setAudioReactiveHapticsAttack,
    AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS,
    setAudioReactiveHapticsRelease: controls.setAudioReactiveHapticsRelease,
    audioReactiveHapticsStatusTone,
    selectedAudioHapticsSourceDisplayName,
    controllerPowerSavingActive,
    classicRumbleValue: controls.classicRumbleValue,
    setClassicRumbleValue: controls.setClassicRumbleValue,
    classicRumbleCommitPending: controls.classicRumbleCommitPending,
    classicRumbleEditingRef: controls.classicRumbleEditingRef,
    commitClassicRumbleValue: controls.commitClassicRumbleValue,
    setClassicRumblePreset: controls.setClassicRumblePreset,
    feedbackBoostEnabled,
    feedbackBoostCommitPending: controls.feedbackBoostCommitPending,
    toggleFeedbackBoostEnabled,
    classicRumbleV1Enabled,
    classicRumbleV1CommitPending: controls.classicRumbleV1CommitPending,
    toggleClassicRumbleV1Enabled,
    activeFeedbackTestUnavailable,
    runFeedbackTest: audioTesting.runFeedbackTest,
    testLocked: audioTesting.testLocked,
    setTestLocked: audioTesting.setTestLocked,
    activeFeedbackStatusTone,
    activeFeedbackStatusLabel,
    focusBridgeSettings: p.focusSettingsTarget,
    HAPTICS_STEP
  };

  const audioProps: AudioPageProps = {
    active: activeControlTab === 'audio',
    connected,
    snapshot: snapshot!,
    pendingAction,
    outputControlLower,
    outputControlLabel,
    OutputIcon,
    controllerControlsAvailable,
    speakerVolumeSupported,
    speakerGainLevel,
    setSpeakerGainLevel: controls.setSpeakerGainLevel,
    SPEAKER_GAIN_OPTIONS,
    showMicrophoneControl: p.showMicrophoneControl,
    setShowMicrophoneControl: p.setShowMicrophoneControl,
    audioEnabled,
    toggleAudioEnabled,
    toggleSpeakerEnabled,
    toggleDuplexMicEnabled,
    duplexMicEnabled,
    duplexMicLabel,
    speakerVolumeCommitPending: controls.speakerVolumeCommitPending,
    speakerVolumeValue: controls.speakerVolumeValue,
    setSpeakerVolumeValue: controls.setSpeakerVolumeValue,
    speakerVolumeEditingRef: controls.speakerVolumeEditingRef,
    commitSpeakerVolume: controls.commitSpeakerVolume,
    sliderTickClass,
    SPEAKER_VOLUME_PRESETS,
    snapSpeakerVolume,
    setSpeakerPreset: controls.setSpeakerPreset,
    micVolumeCommitPending: controls.micVolumeCommitPending,
    micVolumeValue: controls.micVolumeValue,
    setMicVolumeValue: controls.setMicVolumeValue,
    micVolumeEditingRef: controls.micVolumeEditingRef,
    commitMicVolume: controls.commitMicVolume,
    MIC_VOLUME_PRESETS,
    snapMicVolume,
    setMicPreset: controls.setMicPreset,
    toggleMicMute,
    audioBufferLengthControlDisabled,
    audioBufferPercent,
    audioBufferLengthValue: controls.audioBufferLengthValue,
    setAudioBufferLengthValue: controls.setAudioBufferLengthValue,
    audioBufferDelayLabel,
    audioBufferZoneTone,
    audioBufferZoneLabel,
    audioBufferZoneTooltip,
    clampAudioBufferLength: (value: number) => Math.min(128, Math.max(16, Math.round(value))),
    audioBufferLengthEditingRef: controls.audioBufferLengthEditingRef,
    commitAudioBufferLength: controls.commitAudioBufferLength,
    activeAudioTestUnavailable,
    runTestMic: audioTesting.runTestMic,
    runTestSpeaker: audioTesting.runTestSpeaker,
    micTestLocked: audioTesting.micTestLocked,
    micTestError: audioTesting.micTestError,
    speakerTestLocked: audioTesting.speakerTestLocked,
    setSpeakerTestLocked: audioTesting.setSpeakerTestLocked,
    gameStreamActive,
    speakerOutputMissing,
    activeAudioTestLocked,
    stopMicLiveListen,
    activeAudioTestStatusTone,
    activeAudioTestStatusLabel,
    audioPathTone,
    audioPathTooltip,
    audioPathLabel,
    MIC_VOLUME_STEP,
    SPEAKER_VOLUME_STEP,
    PERCENT_SLIDER_TICKS,
    AUDIO_BUFFER_LENGTH_MIN,
    AUDIO_BUFFER_LENGTH_MAX
  };

  const triggersProps: TriggersPageProps = {
    active: activeControlTab === 'triggers' || activeControlTab === 'trigger-lab',
    connected,
    triggerLabOpen,
    triggerLabEnabled,
    triggerLabAnyActive: triggerLab.triggerLabAnyActive,
    triggerPageEnabled,
    controllerControlsAvailable,
    adaptiveTriggersSupported,
    pendingAction,
    toggleTriggerLabEnabled,
    toggleAdaptiveTriggersEnabled,
    renderTriggerLabCard,
    snapshot: snapshot!,
    controllerPowerSavingActive,
    percentSliderMax: 100,
    triggerEffectIntensityValue: controls.triggerEffectIntensityValue,
    setTriggerEffectIntensityValue: controls.setTriggerEffectIntensityValue,
    triggerEffectEditingRef: controls.triggerEffectEditingRef,
    commitTriggerEffectIntensity: controls.commitTriggerEffectIntensity,
    sliderTickClass,
    TRIGGER_EFFECT_PRESETS,
    setTriggerIntensityPreset: controls.setTriggerIntensityPreset,
    adaptiveTriggerOutputActive,
    TRIGGER_TEST_MODE_OPTIONS,
    setTriggerTestMode,
    TRIGGER_TARGET_OPTIONS,
    triggerTarget: controls.triggerTarget,
    setTriggerTarget: controls.setTriggerTarget,
    testTriggersUnavailable,
    runTestAdaptiveTriggers,
    triggerTestLocked,
    resetAdaptiveTriggers,
    triggerStatusTone,
    triggerStatusLabel,
    focusBridgeSettings: p.focusSettingsTarget,
    TRIGGER_EFFECT_STEP,
    PERCENT_SLIDER_TICKS,
    snapTriggerEffectIntensity
  };

  const remappingProps: RemappingPageProps = {
    active: activeControlTab === 'remapping',
    selectedRemapProfileId,
    pendingAction,
    remapProfileOptions,
    selectButtonRemappingProfile: remapping.selectButtonRemappingProfile,
    restoreButtonRemappingDefaults: remapping.restoreButtonRemappingDefaults,
    remappingSubTab: remapping.remappingSubTab,
    setRemappingSubTab: remapping.setRemappingSubTab,
    setActiveControlTab: p.setActiveControlTab,
    buttonsProps: {
      selectedRemapProfileIsDefault,
      renameButtonRemappingProfile: remapping.renameButtonRemappingProfile,
      saveButtonRemappingProfile: remapping.saveButtonRemappingProfile,
      deleteButtonRemappingProfile: remapping.deleteButtonRemappingProfile,
      remappingLayoutRef: p.remappingLayoutRef,
      remapCalloutLayout: remapping.remapCalloutLayout,
      remapDraft: remapping.remapDraft,
      hoveredRemapButton: remapping.hoveredRemapButton,
      setHoveredRemapButton: remapping.setHoveredRemapButton,
      showDualSenseEdgeRemapButtons: remapping.showDualSenseEdgeRemapButtons,
      edgeRemapControlLayout: remapping.edgeRemapControlLayout,
      remapTargetOptionsFor,
      remappingLayoutAsset: remapping.remappingLayoutAsset,
      remappingLeftSideRef: p.remappingLeftSideRef,
      remappingArtRef: p.remappingArtRef,
      remappingRightSideRef: p.remappingRightSideRef,
      setButtonRemap: remapping.setButtonRemap,
      pendingAction
    },
    touchpadProps: {
      touchpadSettings: remapping.touchpadSettings,
      updateTouchpadSettings: remapping.updateTouchpadSettings,
      selectedTouchpadZone: remapping.selectedTouchpadZone,
      setSelectedTouchpadZone: remapping.setSelectedTouchpadZone,
      handleTouchpadZoneClick: remapping.handleTouchpadZoneClick,
      swipePathD: remapping.swipePathD,
      gesturePreviewActive: remapping.gesturePreviewActive,
      gestureSequence: remapping.gestureSequence,
      zoneCoords,
      handlePlayGesturePreview: remapping.handlePlayGesturePreview,
      handleClearGestureSequence: remapping.handleClearGestureSequence,
      handleSelectGestureSequencePreset: remapping.handleSelectGestureSequencePreset,
      touchpadGestureTestFeedback: remapping.touchpadGestureTestFeedback,
      handleTestTouchpadGesture: remapping.handleTestTouchpadGesture,
      handleUpdateGestureActionType: remapping.handleUpdateGestureActionType,
      handleUpdateGestureActionValue: remapping.handleUpdateGestureActionValue,
      handleApplyTouchpadPreset: remapping.handleApplyTouchpadPreset,
      handleSetTouchpadZoneMapping: remapping.handleSetTouchpadZoneMapping
    },
    turboProps: {
      setActiveControlTab: p.setActiveControlTab,
      selectedTurboActionProfile: remapping.selectedTurboActionProfile,
      setSelectedTurboActionProfile: remapping.setSelectedTurboActionProfile,
      turboRepeatMode: remapping.turboRepeatMode,
      setTurboRepeatMode: remapping.setTurboRepeatMode,
      turboIntervalMs: remapping.turboIntervalMs,
      handleSetTurboInterval: remapping.handleSetTurboInterval,
      turboSettings: remapping.turboSettings,
      handleToggleTurboHumanize: remapping.handleToggleTurboHumanize,
      turboNewTriggerPickerOpen: remapping.turboNewTriggerPickerOpen,
      setTurboNewTriggerPickerOpen: remapping.setTurboNewTriggerPickerOpen,
      handleAddTurboTrigger: remapping.handleAddTurboTrigger,
      handleRemoveTurboTrigger: remapping.handleRemoveTurboTrigger,
      turboStartsWhenMode: remapping.turboStartsWhenMode,
      setTurboStartsWhenMode: remapping.setTurboStartsWhenMode,
      handleToggleTurboMaster: remapping.handleToggleTurboMaster,
      turboTesterActive: remapping.turboTesterActive,
      turboTesterFlash: remapping.turboTesterFlash,
      turboTesterCount: remapping.turboTesterCount,
      startTurboTester: remapping.startTurboTester,
      stopTurboTester: remapping.stopTurboTester
    }
  };

  const chordsProps: ChordsPageProps = {
    active: activeControlTab === 'chords',
    pendingAction,
    selectedChordFunction: chords.selectedChordFunction,
    chordFunctionOptions: chords.chordFunctionOptions,
    chordFunctions: chords.chordFunctions,
    chordFunctionDialogOpen: chords.chordFunctionDialog !== null,
    setSelectedChordFunctionId: chords.setSelectedChordFunctionId,
    setChordFunctionDraft: chords.setChordFunctionDraft,
    openChordFunctionDialog: chords.openChordFunctionDialog,
    createChordFunction: chords.createChordFunction,
    chordFunctionDraft: chords.chordFunctionDraft,
    commitChordFunctionDraft: chords.commitChordFunctionDraft,
    setChordFunctionKeyboardKey: chords.setChordFunctionKeyboardKey,
    toggleChordFunctionKeyboardModifier: chords.toggleChordFunctionKeyboardModifier,
    renderChordFunctionSummary: chords.renderChordFunctionSummary,
    chordAssignmentsSubtitle: chords.chordAssignmentsSubtitle,
    chordAssignmentConflictState: chords.chordAssignmentConflictState,
    canAddChordDraft: chords.canAddChordDraft,
    addChordAssignmentDraft: chords.addChordAssignmentDraft,
    chordAssignmentListRef: p.chordAssignmentListRef,
    updateChordAssignmentScrollbar: chords.updateChordAssignmentScrollbar,
    chordAssignments: chords.chordAssignments,
    chordAssignmentDraftRows: chords.chordAssignmentDraftRows,
    chordStarterOptionsFor: chords.chordStarterOptionsFor,
    muteChordStarterIsInactive,
    chordButtonOptionsFor,
    updateChordAssignmentDraftStarter: chords.updateChordAssignmentDraftStarter,
    updateChordAssignmentDraftButton: chords.updateChordAssignmentDraftButton,
    updateChordAssignmentDraftFunction: chords.updateChordAssignmentDraftFunction,
    deleteChordAssignmentDraft: chords.deleteChordAssignmentDraft,
    chordAssignmentDropHint: chords.chordAssignmentDropHint,
    draggedChordAssignmentId: chords.draggedChordAssignmentId,
    startChordAssignmentPointerDrag: chords.startChordAssignmentPointerDrag,
    updateChordAssignmentStarter: chords.updateChordAssignmentStarter,
    updateChordAssignmentButton: chords.updateChordAssignmentButton,
    setChordAssignmentFunction: chords.setChordAssignmentFunction,
    deleteChordAssignment: chords.deleteChordAssignment,
    chordAssignmentScrollbar: chords.chordAssignmentScrollbar,
    startChordAssignmentScrollbarDrag: chords.startChordAssignmentScrollbarDrag,
    setActiveControlTab: p.setActiveControlTab,
    setRemappingSubTab: remapping.setRemappingSubTab,
    CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH,
    CHORD_KEYBOARD_KEY_OPTIONS,
    CHORD_KEYBOARD_MODIFIER_OPTIONS,
    MAX_KEYBOARD_FUNCTION_KEYS,
    CHORD_MEDIA_ACTION_OPTIONS,
    CHORD_CONTROLLER_SETTING_ACTION_OPTIONS,
    CHORD_FUNCTION_TYPE_OPTIONS,
    chordFunctionToDraft,
    chordControllerSettingSelectValue,
    chordControllerSettingActionFromSelectValue,
    chordFunctionSummary,
    chordAssignmentLabel,
    chordAssignmentKey
  };

  return {
    hapticsProps,
    audioProps,
    triggersProps,
    remappingProps,
    chordsProps
  };
}

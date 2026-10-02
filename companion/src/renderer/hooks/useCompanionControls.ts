import { useRef, useState } from 'react';
import type {
  AudioReactiveHapticsAttack,
  AudioReactiveHapticsBassFocus,
  AudioReactiveHapticsConfig,
  AudioReactiveHapticsMode,
  AudioReactiveHapticsRelease,
  AudioReactiveHapticsResponse,
  TriggerTestTarget
} from '../../shared/protocol';
import { normalizeRadialDeadzonePercent } from '../../shared/protocol';
import type { AudioHapticsSession, BridgeSnapshot } from '../../shared/types';
import {
  CONTROLLER_POWER_SAVING_CAP_PERCENT,
  TEST_SPEAKER_VOLUME_SETTLE_MS
} from '../constants/app-constants';
import {
  clampAudioBufferLength,
  snapMicVolume,
  snapSpeakerVolume,
  audioHapticsSourceFromSession
} from '../utils/audio-testing';
import {
  LIGHTBAR_DEFAULT_CUSTOM_COLOR,
  makeLightbarColorNames,
  normalizeHexColor,
  normalizeLightbarPresetColor,
  snapLightbarBrightness,
  LIGHTBAR_SWATCHES
} from '../utils/lightbar';
import {
  capControllerPowerSavingValue,
  displayClassicRumbleValue,
  displayHapticsValue,
  displayLightbarBrightnessValue,
  displayTriggerEffectIntensityValue,
  snapHapticsValue
} from '../utils/tab-helpers';
import { snapTriggerEffectIntensity } from '../utils/trigger-lab';

export interface UseCompanionControlsParams {
  snapshot: BridgeSnapshot | null;
  setSnapshot: (snapshot: BridgeSnapshot) => void;
  applySnapshot: (snapshot: BridgeSnapshot) => void;
  runQuietAction: (fn: () => Promise<any>) => Promise<any>;
  controllerPowerSavingActive: boolean;
  hapticsSliderMax: number;
  lightbarSupported: boolean;
  speakerVolumeSupported: boolean;
  adaptiveTriggersSupported: boolean;
  audioBufferLengthControlSupported: boolean;
  audioReactiveHapticsSupported: boolean;
  audioReactiveHapticsSourceKey: string;
  audioHapticsSessionByKey: Map<string, AudioHapticsSession>;
  pendingAction: string | null;
}

export function useCompanionControls({
  snapshot,
  setSnapshot,
  applySnapshot,
  runQuietAction,
  controllerPowerSavingActive,
  hapticsSliderMax,
  lightbarSupported,
  speakerVolumeSupported,
  adaptiveTriggersSupported,
  audioBufferLengthControlSupported,
  audioReactiveHapticsSupported,
  audioReactiveHapticsSourceKey,
  audioHapticsSessionByKey,
  pendingAction
}: UseCompanionControlsParams) {
  const [hapticsValue, setHapticsValue] = useState(100);
  const [leftStickRadialDeadzoneValue, setLeftStickRadialDeadzoneValue] = useState(0);
  const [rightStickRadialDeadzoneValue, setRightStickRadialDeadzoneValue] = useState(0);
  const [classicRumbleValue, setClassicRumbleValue] = useState(100);
  const [speakerVolumeValue, setSpeakerVolumeValue] = useState(100);
  const [micVolumeValue, setMicVolumeValue] = useState(100);
  const [audioBufferLengthValue, setAudioBufferLengthValue] = useState(64);
  const [lightbarColor, setLightbarColor] = useState('#ffff00');
  const [customLightbarColor, setCustomLightbarColor] = useState<string | null>(() => {
    const saved = window.localStorage.getItem('ds5bridge.customLightbarColor');
    if (!saved || !/^#[0-9a-fA-F]{6}$/.test(saved)) return null;
    const color = normalizeLightbarPresetColor(saved);
    return LIGHTBAR_SWATCHES.includes(color) ? null : color;
  });
  const [customColorDraft, setCustomColorDraft] = useState(LIGHTBAR_DEFAULT_CUSTOM_COLOR);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customSwatchPrimed, setCustomSwatchPrimed] = useState(false);
  const [lightbarBrightnessValue, setLightbarBrightnessValue] = useState(100);
  const [triggerEffectIntensityValue, setTriggerEffectIntensityValue] = useState(100);
  const [triggerTarget, setTriggerTarget] = useState<TriggerTestTarget>('both');

  const [hapticsCommitPending, setHapticsCommitPending] = useState(false);
  const [radialDeadzoneCommitPending, setRadialDeadzoneCommitPending] = useState(false);
  const [classicRumbleCommitPending, setClassicRumbleCommitPending] = useState(false);
  const [classicRumbleV1CommitPending, setClassicRumbleV1CommitPending] = useState(false);
  const [feedbackBoostCommitPending, setFeedbackBoostCommitPending] = useState(false);
  const [speakerVolumeCommitPending, setSpeakerVolumeCommitPending] = useState(false);
  const [micVolumeCommitPending, setMicVolumeCommitPending] = useState(false);
  const [audioBufferLengthCommitPending, setAudioBufferLengthCommitPending] = useState(false);
  const [audioReactiveHapticsCommitPending, setAudioReactiveHapticsCommitPending] = useState(false);
  const [lightbarCommitPending, setLightbarCommitPending] = useState(false);

  const hapticsEditingRef = useRef(false);
  const radialDeadzoneEditingRef = useRef({ left: false, right: false });
  const classicRumbleEditingRef = useRef(false);
  const speakerVolumeEditingRef = useRef(false);
  const micVolumeEditingRef = useRef(false);
  const audioBufferLengthEditingRef = useRef(false);
  const lightbarBrightnessEditingRef = useRef(false);
  const triggerEffectEditingRef = useRef(false);
  const customColorPickerRef = useRef<HTMLDivElement>(null);
  const customSwatchPrimeTimerRef = useRef<number | null>(null);

  const LIGHTBAR_COLOR_NAMES = makeLightbarColorNames();

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function isPreservingPowerSavingCap(savedValue: number, visibleValue: number): boolean {
    return (
      controllerPowerSavingActive &&
      savedValue > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
      visibleValue === CONTROLLER_POWER_SAVING_CAP_PERCENT
    );
  }

  async function commitRadialDeadzone(side: 'left' | 'right', value: number) {
    const percent = normalizeRadialDeadzonePercent(value);
    const leftPercent = side === 'left' ? percent : leftStickRadialDeadzoneValue;
    const rightPercent = side === 'right' ? percent : rightStickRadialDeadzoneValue;
    radialDeadzoneEditingRef.current[side] = true;
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      radialDeadzoneCommitPending ||
      (leftPercent === snapshot.settings.leftStickRadialDeadzonePercent &&
        rightPercent === snapshot.settings.rightStickRadialDeadzonePercent)
    ) {
      radialDeadzoneEditingRef.current[side] = false;
      return;
    }

    setRadialDeadzoneCommitPending(true);
    try {
      const next = await window.bridge.setRadialDeadzones(leftPercent, rightPercent);
      setSnapshot(next);
      setLeftStickRadialDeadzoneValue(next.settings.leftStickRadialDeadzonePercent);
      setRightStickRadialDeadzoneValue(next.settings.rightStickRadialDeadzonePercent);
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setLeftStickRadialDeadzoneValue(next.settings.leftStickRadialDeadzonePercent);
      setRightStickRadialDeadzoneValue(next.settings.rightStickRadialDeadzonePercent);
    } finally {
      setRadialDeadzoneCommitPending(false);
      radialDeadzoneEditingRef.current.left = false;
      radialDeadzoneEditingRef.current.right = false;
    }
  }

  async function commitHapticsValue(value = hapticsValue) {
    const snappedValue = snapHapticsValue(value, hapticsSliderMax);
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !snapshot.settings.hapticsEnabled ||
      (controllerPowerSavingActive &&
        snapshot.settings.hapticsGainPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT) ||
      snappedValue === snapshot.settings.hapticsGainPercent ||
      hapticsCommitPending
    ) {
      hapticsEditingRef.current = false;
      return;
    }

    setHapticsCommitPending(true);
    hapticsEditingRef.current = true;
    try {
      const next = await window.bridge.setHapticsGain(snappedValue);
      setSnapshot(next);
      setHapticsValue(displayHapticsValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setHapticsValue(displayHapticsValue(next));
    } finally {
      setHapticsCommitPending(false);
      hapticsEditingRef.current = false;
    }
  }

  async function commitClassicRumbleValue(value = classicRumbleValue) {
    const snappedValue = snapHapticsValue(value, hapticsSliderMax);
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !snapshot.settings.classicRumbleEnabled ||
      (controllerPowerSavingActive &&
        snapshot.settings.classicRumbleGainPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT) ||
      snappedValue === snapshot.settings.classicRumbleGainPercent ||
      classicRumbleCommitPending
    ) {
      classicRumbleEditingRef.current = false;
      return;
    }

    setClassicRumbleCommitPending(true);
    classicRumbleEditingRef.current = true;
    try {
      const next = await window.bridge.setClassicRumbleGain(snappedValue);
      setSnapshot(next);
      setClassicRumbleValue(displayClassicRumbleValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setClassicRumbleValue(displayClassicRumbleValue(next));
    } finally {
      setClassicRumbleCommitPending(false);
      classicRumbleEditingRef.current = false;
    }
  }

  async function commitSpeakerVolume(value = speakerVolumeValue) {
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !speakerVolumeSupported ||
      !snapshot.settings.speakerEnabled ||
      value === snapshot.settings.speakerVolumePercent ||
      speakerVolumeCommitPending
    ) {
      speakerVolumeEditingRef.current = false;
      return;
    }

    setSpeakerVolumeCommitPending(true);
    speakerVolumeEditingRef.current = true;
    try {
      const next = await window.bridge.setSpeakerVolume(value);
      setSnapshot(next);
      setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
      await delay(TEST_SPEAKER_VOLUME_SETTLE_MS);
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
    } finally {
      setSpeakerVolumeCommitPending(false);
      speakerVolumeEditingRef.current = false;
    }
  }

  async function commitLightbar(nextColor = lightbarColor, brightness = lightbarBrightnessValue) {
    const color = normalizeHexColor(nextColor);
    const snappedBrightness = snapLightbarBrightness(brightness);
    const shouldPreserveSavedBrightness = Boolean(
      snapshot &&
        controllerPowerSavingActive &&
        snapshot.settings.lightbarBrightnessPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        snappedBrightness === CONTROLLER_POWER_SAVING_CAP_PERCENT
    );
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !lightbarSupported ||
      !snapshot.settings.lightbarEnabled ||
      lightbarCommitPending ||
      (controllerPowerSavingActive &&
        snapshot.settings.lightbarBrightnessPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        snappedBrightness === CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        color === normalizeHexColor(snapshot.settings.lightbarColor)) ||
      (color === normalizeHexColor(snapshot.settings.lightbarColor) &&
        snappedBrightness === snapshot.settings.lightbarBrightnessPercent)
    ) {
      lightbarBrightnessEditingRef.current = false;
      return;
    }

    setLightbarCommitPending(true);
    try {
      const persistedBrightness = shouldPreserveSavedBrightness
        ? snapshot.settings.lightbarBrightnessPercent
        : snappedBrightness;
      const next = await window.bridge.setLightbarColor(color, persistedBrightness);
      setSnapshot(next);
      setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setLightbarBrightnessValue(displayLightbarBrightnessValue(next));
    } finally {
      setLightbarCommitPending(false);
      lightbarBrightnessEditingRef.current = false;
    }
  }

  async function commitTriggerEffectIntensity(value = triggerEffectIntensityValue) {
    const snappedValue = snapTriggerEffectIntensity(value);
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !adaptiveTriggersSupported ||
      !snapshot.settings.adaptiveTriggersEnabled ||
      (controllerPowerSavingActive &&
        snapshot.settings.triggerEffectIntensityPercent > CONTROLLER_POWER_SAVING_CAP_PERCENT &&
        snappedValue === CONTROLLER_POWER_SAVING_CAP_PERCENT) ||
      snappedValue === snapshot.settings.triggerEffectIntensityPercent
    ) {
      triggerEffectEditingRef.current = false;
      return;
    }

    try {
      const next = await window.bridge.setTriggerEffectIntensity(snappedValue);
      setSnapshot(next);
      setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setTriggerEffectIntensityValue(displayTriggerEffectIntensityValue(next));
    } finally {
      triggerEffectEditingRef.current = false;
    }
  }

  function selectLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setLightbarColor(color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function saveCustomLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setCustomLightbarColor(color);
    setCustomColorDraft(color);
    setLightbarColor(color);
    setShowCustomColorPicker(false);
    setCustomSwatchPrimed(false);
    window.localStorage.setItem('ds5bridge.customLightbarColor', color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function previewCustomLightbarColor(nextColor: string) {
    const color = normalizeHexColor(nextColor);
    setCustomColorDraft(color);
    setLightbarColor(color);
    void commitLightbar(color, lightbarBrightnessValue);
  }

  function selectCustomLightbarColor() {
    if (!customLightbarColor) {
      setCustomSwatchPrimed(true);
      if (customSwatchPrimeTimerRef.current !== null) {
        window.clearTimeout(customSwatchPrimeTimerRef.current);
      }
      customSwatchPrimeTimerRef.current = window.setTimeout(() => {
        setCustomSwatchPrimed(false);
        customSwatchPrimeTimerRef.current = null;
      }, 1600);
      return;
    }
    selectLightbarColor(customLightbarColor);
  }

  function openCustomLightbarPicker() {
    const color = customLightbarColor ?? LIGHTBAR_DEFAULT_CUSTOM_COLOR;
    setCustomColorDraft(color);
    setCustomSwatchPrimed(false);
    setShowCustomColorPicker(true);
  }

  function setLightbarPreset(value: number) {
    const brightness = snapLightbarBrightness(capControllerPowerSavingValue(value, snapshot));
    setLightbarBrightnessValue(brightness);
    void commitLightbar(lightbarColor, brightness);
  }

  function setHapticsPreset(value: number) {
    const snappedValue = snapHapticsValue(capControllerPowerSavingValue(value, snapshot), hapticsSliderMax);
    hapticsEditingRef.current = true;
    setHapticsValue(snappedValue);
    void commitHapticsValue(snappedValue);
  }

  function setClassicRumblePreset(value: number) {
    const snappedValue = snapHapticsValue(capControllerPowerSavingValue(value, snapshot), hapticsSliderMax);
    classicRumbleEditingRef.current = true;
    setClassicRumbleValue(snappedValue);
    void commitClassicRumbleValue(snappedValue);
  }

  function setSpeakerPreset(value: number) {
    const snappedValue = snapSpeakerVolume(value);
    speakerVolumeEditingRef.current = true;
    setSpeakerVolumeValue(snappedValue);
    void commitSpeakerVolume(snappedValue);
  }

  function setSpeakerGainLevel(level: number) {
    if (!snapshot) {
      return;
    }
    const value = Math.max(1, Math.min(7, Math.round(level)));
    if (value === snapshot.settings.speakerGainLevel) {
      return;
    }
    void runQuietAction(() => window.bridge.setSpeakerGainLevel(value));
  }

  async function commitMicVolume(value = micVolumeValue) {
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      value === snapshot.settings.micVolumePercent ||
      micVolumeCommitPending
    ) {
      micVolumeEditingRef.current = false;
      return;
    }

    setMicVolumeCommitPending(true);
    micVolumeEditingRef.current = true;
    try {
      const next = await window.bridge.setMicVolume(value);
      setSnapshot(next);
      setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
    } finally {
      setMicVolumeCommitPending(false);
      micVolumeEditingRef.current = false;
    }
  }

  function setMicPreset(value: number) {
    const snappedValue = snapMicVolume(value);
    micVolumeEditingRef.current = true;
    setMicVolumeValue(snappedValue);
    void commitMicVolume(snappedValue);
  }

  async function commitAudioBufferLength(value = audioBufferLengthValue) {
    const snappedValue = clampAudioBufferLength(value);
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !audioBufferLengthControlSupported ||
      snappedValue === snapshot.settings.hapticsBufferLength ||
      audioBufferLengthCommitPending
    ) {
      audioBufferLengthEditingRef.current = false;
      setAudioBufferLengthValue(snappedValue);
      return;
    }

    setAudioBufferLengthCommitPending(true);
    audioBufferLengthEditingRef.current = true;
    try {
      const next = await window.bridge.setHapticsBufferLength(snappedValue);
      setSnapshot(next);
      setAudioBufferLengthValue(clampAudioBufferLength(next.settings.hapticsBufferLength));
    } catch {
      const next = await window.bridge.getStatus();
      setSnapshot(next);
      setAudioBufferLengthValue(clampAudioBufferLength(next.settings.hapticsBufferLength));
    } finally {
      setAudioBufferLengthCommitPending(false);
      audioBufferLengthEditingRef.current = false;
    }
  }

  async function commitAudioReactiveHapticsConfig(
    config: Partial<AudioReactiveHapticsConfig>
  ): Promise<BridgeSnapshot | null> {
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !audioReactiveHapticsSupported ||
      !snapshot.settings.hapticsEnabled ||
      audioReactiveHapticsCommitPending
    ) {
      return null;
    }

    setAudioReactiveHapticsCommitPending(true);
    try {
      const next = await window.bridge.setAudioReactiveHapticsConfig(config);
      applySnapshot(next);
      return next;
    } catch {
      const next = await window.bridge.getStatus();
      applySnapshot(next);
      return next;
    } finally {
      setAudioReactiveHapticsCommitPending(false);
    }
  }

  async function toggleAudioReactiveHapticsEnabled() {
    if (
      !snapshot ||
      snapshot.state !== 'connected' ||
      !audioReactiveHapticsSupported ||
      pendingAction !== null ||
      audioReactiveHapticsCommitPending
    ) {
      return;
    }

    const enabled = !snapshot.settings.audioReactiveHapticsEnabled;
    setAudioReactiveHapticsCommitPending(true);
    try {
      if (enabled && !snapshot.settings.hapticsEnabled) {
        await window.bridge.setHapticsEnabled(true);
      }
      const next = await window.bridge.setAudioReactiveHapticsConfig({ enabled });
      applySnapshot(next);
    } catch {
      const next = await window.bridge.getStatus();
      applySnapshot(next);
    } finally {
      setAudioReactiveHapticsCommitPending(false);
    }
  }

  function setAudioReactiveHapticsMode(mode: AudioReactiveHapticsMode) {
    if (!snapshot || mode === snapshot.settings.audioReactiveHapticsMode) return;
    void commitAudioReactiveHapticsConfig({ mode });
  }

  function setAudioReactiveHapticsSourceValue(value: string) {
    if (!snapshot || value === audioReactiveHapticsSourceKey) return;
    if (value === 'system-audio') {
      void commitAudioReactiveHapticsConfig({ source: 'system-audio' });
      return;
    }
    const session = audioHapticsSessionByKey.get(value);
    if (!session) {
      return;
    }
    void commitAudioReactiveHapticsConfig({ source: audioHapticsSourceFromSession(session) });
  }

  function setAudioReactiveHapticsBassFocus(bassFocus: AudioReactiveHapticsBassFocus) {
    if (!snapshot || bassFocus === snapshot.settings.audioReactiveHapticsBassFocus) return;
    void commitAudioReactiveHapticsConfig({ bassFocus });
  }

  function setAudioReactiveHapticsResponse(response: AudioReactiveHapticsResponse) {
    if (!snapshot || response === snapshot.settings.audioReactiveHapticsResponse) return;
    void commitAudioReactiveHapticsConfig({ response });
  }

  function setAudioReactiveHapticsAttack(attack: AudioReactiveHapticsAttack) {
    if (!snapshot || attack === snapshot.settings.audioReactiveHapticsAttack) return;
    void commitAudioReactiveHapticsConfig({ attack });
  }

  function setAudioReactiveHapticsRelease(release: AudioReactiveHapticsRelease) {
    if (!snapshot || release === snapshot.settings.audioReactiveHapticsRelease) return;
    void commitAudioReactiveHapticsConfig({ release });
  }

  function setTriggerIntensityPreset(value: number) {
    const snappedValue = snapTriggerEffectIntensity(capControllerPowerSavingValue(value, snapshot));
    setTriggerEffectIntensityValue(snappedValue);
    void commitTriggerEffectIntensity(snappedValue);
  }

  function lightbarColorName(color: string) {
    const normalized = normalizeHexColor(color);
    return LIGHTBAR_COLOR_NAMES[normalized] ?? 'Custom';
  }

  return {
    hapticsValue,
    setHapticsValue,
    leftStickRadialDeadzoneValue,
    setLeftStickRadialDeadzoneValue,
    rightStickRadialDeadzoneValue,
    setRightStickRadialDeadzoneValue,
    classicRumbleValue,
    setClassicRumbleValue,
    speakerVolumeValue,
    setSpeakerVolumeValue,
    micVolumeValue,
    setMicVolumeValue,
    audioBufferLengthValue,
    setAudioBufferLengthValue,
    lightbarColor,
    setLightbarColor,
    customLightbarColor,
    setCustomLightbarColor,
    customColorDraft,
    setCustomColorDraft,
    showCustomColorPicker,
    setShowCustomColorPicker,
    customSwatchPrimed,
    setCustomSwatchPrimed,
    lightbarBrightnessValue,
    setLightbarBrightnessValue,
    triggerEffectIntensityValue,
    setTriggerEffectIntensityValue,
    triggerTarget,
    setTriggerTarget,
    hapticsCommitPending,
    setHapticsCommitPending,
    radialDeadzoneCommitPending,
    classicRumbleCommitPending,
    setClassicRumbleCommitPending,
    classicRumbleV1CommitPending,
    setClassicRumbleV1CommitPending,
    feedbackBoostCommitPending,
    setFeedbackBoostCommitPending,
    speakerVolumeCommitPending,
    micVolumeCommitPending,
    audioBufferLengthCommitPending,
    audioReactiveHapticsCommitPending,
    lightbarCommitPending,
    hapticsEditingRef,
    radialDeadzoneEditingRef,
    classicRumbleEditingRef,
    speakerVolumeEditingRef,
    micVolumeEditingRef,
    audioBufferLengthEditingRef,
    lightbarBrightnessEditingRef,
    triggerEffectEditingRef,
    customColorPickerRef,
    customSwatchPrimeTimerRef,
    isPreservingPowerSavingCap,
    commitRadialDeadzone,
    commitHapticsValue,
    commitClassicRumbleValue,
    commitSpeakerVolume,
    commitLightbar,
    commitTriggerEffectIntensity,
    selectLightbarColor,
    saveCustomLightbarColor,
    previewCustomLightbarColor,
    selectCustomLightbarColor,
    openCustomLightbarPicker,
    setLightbarPreset,
    setHapticsPreset,
    setClassicRumblePreset,
    setSpeakerPreset,
    setSpeakerGainLevel,
    commitMicVolume,
    setMicPreset,
    commitAudioBufferLength,
    commitAudioReactiveHapticsConfig,
    toggleAudioReactiveHapticsEnabled,
    setAudioReactiveHapticsMode,
    setAudioReactiveHapticsSourceValue,
    setAudioReactiveHapticsBassFocus,
    setAudioReactiveHapticsResponse,
    setAudioReactiveHapticsAttack,
    setAudioReactiveHapticsRelease,
    setTriggerIntensityPreset,
    lightbarColorName
  };
}

import type { BridgeSnapshot, UiThemePreset } from '../../shared/types';
import type { StartupTutorialStep } from '../components/ui/StartupTutorial';
import { DEFAULT_UI_THEME_PRESET, UI_THEME_OPTIONS } from '../ui-themes';
import {
  BOOSTED_FEEDBACK_GAIN_PERCENT,
  CONTROLLER_POWER_SAVING_CAP_PERCENT,
  CONTROL_TAB_GROUPS,
  HAPTICS_STEP,
  STANDARD_FEEDBACK_GAIN_PERCENT
} from '../constants/app-constants';
import type {
  ControlTab,
  ControlTabGroupDefinition,
  KnownControllerType,
  SidebarControlTab
} from '../types/app-types';

export const LAST_REMAP_CONTROLLER_TYPE_STORAGE_KEY = 'ds5bridge.lastRemapControllerType';
export const UI_THEME_PRESET_STORAGE_KEY = 'ds5bridge.uiThemePreset';
export const STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY = 'ds5bridge.startupTutorialCompleted.v1';
export const STARTUP_READY_HOLD_MS = 1000;

export function controlTabGroupFor(tab: ControlTab): ControlTabGroupDefinition | null {
  return CONTROL_TAB_GROUPS.find(({ tabs }) => tabs.some(({ id }) => id === tab)) ?? null;
}

export function controlPanelIdFor(tab: SidebarControlTab): string {
  if (tab === 'audio-haptics') return 'control-panel-haptics';
  if (tab === 'trigger-lab') return 'control-panel-triggers';
  return `control-panel-${tab}`;
}

export function storedRemapControllerType(): KnownControllerType {
  const saved = window.localStorage.getItem(LAST_REMAP_CONTROLLER_TYPE_STORAGE_KEY);
  return saved === 'dualsense-edge' ? 'dualsense-edge' : 'dualsense';
}

export function isUiThemePreset(value: string | null): value is UiThemePreset {
  return UI_THEME_OPTIONS.some(([, preset]) => preset === value);
}

export function storedUiThemePreset(): UiThemePreset {
  const saved = window.localStorage.getItem(UI_THEME_PRESET_STORAGE_KEY);
  return isUiThemePreset(saved) ? saved : DEFAULT_UI_THEME_PRESET;
}

export function saveUiThemePreset(preset: UiThemePreset): void {
  window.localStorage.setItem(UI_THEME_PRESET_STORAGE_KEY, preset);
}

export function storedStartupTutorialStep(): StartupTutorialStep {
  return window.localStorage.getItem(STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY) === '1'
    ? 'done'
    : 'feature-toggle';
}

export function saveStartupTutorialCompleted(): void {
  window.localStorage.setItem(STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY, '1');
}

export function snapHapticsValue(value: number, max = STANDARD_FEEDBACK_GAIN_PERCENT): number {
  return Math.max(0, Math.min(max, Math.round(value / HAPTICS_STEP) * HAPTICS_STEP));
}

export function controllerPowerSavingActiveFromSnapshot(
  snapshot: BridgeSnapshot | null | undefined
): boolean {
  return Boolean(
    snapshot?.settings.controllerPowerSavingEnabled && snapshot.diagnostics.audioStatus?.headsetPlugged
  );
}

export function capControllerPowerSavingValue(
  value: number,
  snapshot: BridgeSnapshot | null | undefined
): number {
  return controllerPowerSavingActiveFromSnapshot(snapshot)
    ? Math.min(value, CONTROLLER_POWER_SAVING_CAP_PERCENT)
    : value;
}

export function feedbackSliderMaxFromSnapshot(snapshot: BridgeSnapshot | null | undefined): number {
  if (controllerPowerSavingActiveFromSnapshot(snapshot)) {
    return CONTROLLER_POWER_SAVING_CAP_PERCENT;
  }
  return snapshot?.settings.feedbackBoostEnabled
    ? BOOSTED_FEEDBACK_GAIN_PERCENT
    : STANDARD_FEEDBACK_GAIN_PERCENT;
}

export function feedbackSliderTicks(max: number): number[] {
  const count = Math.floor(max / HAPTICS_STEP) + 1;
  return Array.from({ length: count }, (_, index) => index * HAPTICS_STEP);
}

export function displayHapticsValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.hapticsGainPercent, snapshot);
}

export function displayClassicRumbleValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.classicRumbleGainPercent, snapshot);
}

export function displayLightbarBrightnessValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.lightbarBrightnessPercent, snapshot);
}

export function displayTriggerEffectIntensityValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.triggerEffectIntensityPercent, snapshot);
}

export function sliderTickClass(value: number, max: number): string | undefined {
  if (value === 0 || value === max) {
    return 'milestone endpoint';
  }
  if (value === max / 2) {
    return 'milestone';
  }
  return undefined;
}

import {
  IconAdjustmentsHorizontal as Settings2,
  IconBulb,
  IconSparkles as Sparkles,
  IconVolume as Volume2
} from '@tabler/icons-react';
import type { ControllerProfileSettings, PollingRateMode } from '../../../shared/protocol';
import type { BridgeSnapshot } from '../../../shared/types';

export const CONTROLLER_POWER_SAVING_CAP_PERCENT = 60;

const POLLING_RATE_OPTIONS: Array<[string, PollingRateMode]> = [
  ['1000 Hz / Real-time', '1000'],
  ['500 Hz', '500'],
  ['250 Hz', '250']
];

const MUTE_KEY_OPTIONS: Array<[string, number]> = [
  ['F1', 0x3A], ['F2', 0x3B], ['F3', 0x3C], ['F4', 0x3D], ['F5', 0x3E], ['F6', 0x3F],
  ['F7', 0x40], ['F8', 0x41], ['F9', 0x42], ['F10', 0x43], ['F11', 0x44], ['F12', 0x45],
  ['F13', 0x68], ['F14', 0x69], ['F15', 0x6A], ['F16', 0x6B], ['F17', 0x6C], ['F18', 0x6D],
  ['F19', 0x6E], ['F20', 0x6F], ['F21', 0x70], ['F22', 0x71], ['F23', 0x72], ['F24', 0x73],
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, index) => [letter, 0x04 + index] as [string, number]),
  ['1', 0x1E], ['2', 0x1F], ['3', 0x20], ['4', 0x21], ['5', 0x22],
  ['6', 0x23], ['7', 0x24], ['8', 0x25], ['9', 0x26], ['0', 0x27],
  ['Enter', 0x28], ['Escape', 0x29], ['Backspace', 0x2A], ['Tab', 0x2B], ['Space', 0x2C],
  ['-', 0x2D], ['=', 0x2E], ['[', 0x2F], [']', 0x30], ['\\', 0x31],
  [';', 0x33], ["'", 0x34], ['`', 0x35], [',', 0x36], ['.', 0x37], ['/', 0x38],
  ['Insert', 0x49], ['Home', 0x4A], ['Page Up', 0x4B], ['Delete', 0x4C], ['End', 0x4D], ['Page Down', 0x4E],
  ['Right Arrow', 0x4F], ['Left Arrow', 0x50], ['Down Arrow', 0x51], ['Up Arrow', 0x52]
];

const MUTE_MODIFIER_OPTIONS: Array<[string, number]> = [
  ['Ctrl', 0x01],
  ['Shift', 0x02],
  ['Alt', 0x04],
  ['Win', 0x08]
];

const LIGHTBAR_SWATCH_NAMES: Record<string, string> = {
  '#ffff00': 'Yellow',
  '#0000ff': 'Blue',
  '#00ff00': 'Green',
  '#ff0000': 'Red',
  '#8000ff': 'Violet',
  '#ffffff': 'White'
};

export function controllerProfileSettingsFromSnapshot(snapshot: BridgeSnapshot): ControllerProfileSettings {
  return {
    leftStickRadialDeadzonePercent: snapshot.settings.leftStickRadialDeadzonePercent,
    rightStickRadialDeadzonePercent: snapshot.settings.rightStickRadialDeadzonePercent,
    hapticsEnabled: snapshot.settings.hapticsEnabled,
    hapticsGainPercent: snapshot.settings.hapticsGainPercent,
    feedbackBoostEnabled: snapshot.settings.feedbackBoostEnabled,
    classicRumbleEnabled: snapshot.settings.classicRumbleEnabled,
    classicRumbleGainPercent: snapshot.settings.classicRumbleGainPercent,
    classicRumbleV1Enabled: snapshot.settings.classicRumbleV1Enabled,
    adaptiveTriggersEnabled: snapshot.settings.adaptiveTriggersEnabled,
    triggerEffectIntensityPercent: snapshot.settings.triggerEffectIntensityPercent,
    triggerTestMode: snapshot.settings.triggerTestMode,
    speakerEnabled: snapshot.settings.speakerEnabled,
    speakerVolumePercent: snapshot.settings.speakerVolumePercent,
    micVolumePercent: snapshot.settings.micVolumePercent,
    micMuted: snapshot.settings.micMuted,
    lightbarEnabled: snapshot.settings.lightbarEnabled,
    lightbarColor: snapshot.settings.lightbarColor,
    lightbarBrightnessPercent: snapshot.settings.lightbarBrightnessPercent,
    lightbarOverrideEnabled: snapshot.settings.lightbarOverrideEnabled,
    muteButtonMode: snapshot.settings.muteButtonMode,
    muteKeyboardUsage: snapshot.settings.muteKeyboardUsage,
    muteKeyboardModifiers: snapshot.settings.muteKeyboardModifiers,
    muteKeyboardBehavior: snapshot.settings.muteKeyboardBehavior,
    muteKeyboardChordStarterEnabled: snapshot.settings.muteKeyboardChordStarterEnabled,
    edgeProfileSwitchingBlocked: snapshot.settings.edgeProfileSwitchingBlocked,
    sleepKeybindEnabled: snapshot.settings.sleepKeybindEnabled,
    speakerVolumeShortcutEnabled: snapshot.settings.speakerVolumeShortcutEnabled,
    pollingRateMode: snapshot.settings.pollingRateMode,
    hostPersonaMode: snapshot.settings.hostPersonaMode,
    duplexMicEnabled: snapshot.settings.duplexMicEnabled,
    audioReactiveHapticsEnabled: snapshot.settings.audioReactiveHapticsEnabled,
    audioReactiveHapticsSource: snapshot.settings.audioReactiveHapticsSource,
    audioReactiveHapticsMode: snapshot.settings.audioReactiveHapticsMode,
    audioReactiveHapticsGainPercent: snapshot.settings.audioReactiveHapticsGainPercent,
    audioReactiveHapticsBassFocus: snapshot.settings.audioReactiveHapticsBassFocus,
    audioReactiveHapticsResponse: snapshot.settings.audioReactiveHapticsResponse,
    audioReactiveHapticsAttack: snapshot.settings.audioReactiveHapticsAttack,
    audioReactiveHapticsRelease: snapshot.settings.audioReactiveHapticsRelease,
    controllerPowerSavingEnabled: snapshot.settings.controllerPowerSavingEnabled
  };
}

export function optionLabel<T extends string | number>(options: Array<[string, T]>, value: T): string {
  return options.find(([, optionValue]) => optionValue === value)?.[0] ?? String(value);
}

export function enabledLabel(enabled: boolean): string {
  return enabled ? 'On' : 'Off';
}

export function percentLabel(value: number): string {
  return `${value}%`;
}

export function lightbarColorLabel(color: string): string {
  return LIGHTBAR_SWATCH_NAMES[color.toLowerCase()] ?? color.toUpperCase();
}

export function muteButtonSummary(settings: ControllerProfileSettings): string {
  if (settings.muteButtonMode === 'normal') {
    return 'Normal';
  }
  if (settings.muteButtonMode === 'quiet') {
    return 'Quiet Toggle';
  }
  const key = optionLabel(MUTE_KEY_OPTIONS, settings.muteKeyboardUsage);
  const modifiers = MUTE_MODIFIER_OPTIONS
    .filter(([, bit]) => (settings.muteKeyboardModifiers & bit) !== 0)
    .map(([label]) => label);
  const chordStarter = settings.muteButtonMode === 'keyboard' && settings.muteKeyboardChordStarterEnabled
    ? ['Chord Starter']
    : [];
  return [...modifiers, key, ...chordStarter].join(' + ');
}

export type SystemProfileSummaryProps = {
  settings: ControllerProfileSettings;
  powerSavingActive: boolean;
};

export function SystemProfileSummary({
  settings,
  powerSavingActive
}: SystemProfileSummaryProps) {
  const ecoValueClass = (active: boolean) => (active ? ' eco-limited' : '');
  const effectiveEcoPercent = (value: number) => percentLabel(Math.min(value, CONTROLLER_POWER_SAVING_CAP_PERCENT));
  const hapticsEcoLimited = powerSavingActive
    && settings.hapticsEnabled
    && settings.hapticsGainPercent > 0;
  const rumbleEcoLimited = powerSavingActive
    && settings.classicRumbleEnabled
    && settings.classicRumbleGainPercent > 0;
  const triggersEcoLimited = powerSavingActive
    && settings.adaptiveTriggersEnabled
    && settings.triggerEffectIntensityPercent > 0;
  const lightbarEcoLimited = powerSavingActive
    && settings.lightbarEnabled
    && settings.lightbarBrightnessPercent > 0;

  return (
    <div className="system-profile-summary" aria-label="Current profile settings">
      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Volume2 size={15} />
          <h3>Audio</h3>
        </div>
        <dl>
          <div><dt>Speaker</dt><dd>{settings.speakerEnabled ? percentLabel(settings.speakerVolumePercent) : 'Off'}</dd></div>
          <div><dt>Mic</dt><dd>{settings.micMuted ? 'Muted' : percentLabel(settings.micVolumePercent)}</dd></div>
          <div><dt>Pass-through</dt><dd>{enabledLabel(settings.duplexMicEnabled)}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Sparkles size={15} />
          <h3>Feel</h3>
        </div>
        <dl>
          <div><dt>Haptics</dt><dd className={ecoValueClass(hapticsEcoLimited)}>{settings.hapticsEnabled ? (hapticsEcoLimited ? effectiveEcoPercent(settings.hapticsGainPercent) : percentLabel(settings.hapticsGainPercent)) : 'Off'}</dd></div>
          <div><dt>Rumble</dt><dd className={ecoValueClass(rumbleEcoLimited)}>{settings.classicRumbleEnabled ? (rumbleEcoLimited ? effectiveEcoPercent(settings.classicRumbleGainPercent) : percentLabel(settings.classicRumbleGainPercent)) : 'Off'}</dd></div>
          <div><dt>Triggers</dt><dd className={ecoValueClass(triggersEcoLimited)}>{settings.adaptiveTriggersEnabled ? (triggersEcoLimited ? effectiveEcoPercent(settings.triggerEffectIntensityPercent) : percentLabel(settings.triggerEffectIntensityPercent)) : 'Off'}</dd></div>
          <div><dt>Stick DZ</dt><dd>{`${settings.leftStickRadialDeadzonePercent}% / ${settings.rightStickRadialDeadzonePercent}%`}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <IconBulb size={15} />
          <h3>Lighting</h3>
        </div>
        <dl>
          <div><dt>Lightbar</dt><dd className={ecoValueClass(lightbarEcoLimited)}>{settings.lightbarEnabled ? (lightbarEcoLimited ? effectiveEcoPercent(settings.lightbarBrightnessPercent) : percentLabel(settings.lightbarBrightnessPercent)) : 'Off'}</dd></div>
          <div><dt>Color</dt><dd>{lightbarColorLabel(settings.lightbarColor)}</dd></div>
          <div><dt>Override</dt><dd>{enabledLabel(settings.lightbarOverrideEnabled)}</dd></div>
        </dl>
      </div>

      <div className="system-profile-summary-group">
        <div className="system-profile-summary-heading">
          <Settings2 size={15} />
          <h3>System</h3>
        </div>
        <dl>
          <div><dt>Mute</dt><dd>{muteButtonSummary(settings)}</dd></div>
          <div><dt>Polling</dt><dd>{optionLabel(POLLING_RATE_OPTIONS, settings.pollingRateMode)}</dd></div>
          <div><dt>Edge Profiles</dt><dd>{settings.edgeProfileSwitchingBlocked ? 'Blocked' : 'Available'}</dd></div>
          <div><dt>Power Save</dt><dd>{enabledLabel(settings.controllerPowerSavingEnabled)}</dd></div>
        </dl>
      </div>
    </div>
  );
}

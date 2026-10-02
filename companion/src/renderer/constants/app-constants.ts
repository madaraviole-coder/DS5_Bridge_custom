import {
  IconBulb,
  IconCpu,
  IconDeviceAudioTape,
  IconDeviceGamepad2,
  IconDeviceGamepad3,
  IconFlask2,
  IconLayoutDashboard,
  IconMicrophoneOff as MicOff,
  IconReplace,
  IconSparkles as Sparkles,
  IconBluetooth,
  IconViewfinder,
  IconVolume
} from '@tabler/icons-react';
import remappingEdgeLayoutImage from '../../../../assets/controllers/dualsense-edge-remapping-layout.svg';
import remappingLayoutImage from '../../../../assets/controllers/dualsense-remapping-layout.svg';
import circleGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Circle.svg';
import createGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Create.svg';
import crossGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Cross.svg';
import dpadDownGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Down.svg';
import dpadLeftGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Left.svg';
import dpadRightGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Right.svg';
import dpadUpGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Up.svg';
import l1GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/L1.svg';
import l2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/L2.svg';
import leftStickClickGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Left Stick Click.svg';
import optionsGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Options.svg';
import psHomeGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import r1GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/R1.svg';
import r2GlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/R2.svg';
import rightStickClickGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Right Stick Click.svg';
import squareGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Square.svg';
import touchpadPressGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Touch Pad Press.svg';
import triangleGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Triangle.svg';
import {
  CHORD_CONTROLLER_SETTING_STEP_DEFAULT,
  CHORD_MUTE_STARTER_ID,
  REMAP_BUTTON_IDS,
  type AudioReactiveHapticsAttack,
  type AudioReactiveHapticsBassFocus,
  type AudioReactiveHapticsMode,
  type AudioReactiveHapticsRelease,
  type AudioReactiveHapticsResponse,
  type ChordAssignableButtonId,
  type ChordFunctionType,
  type ChordMediaAction,
  type ChordStarterId,
  type HostPersonaMode,
  type MuteButtonMode,
  type MuteKeyboardBehavior,
  type PollingRateMode,
  type RemapButtonId,
  type TriggerTestMode,
  type TriggerTestTarget
} from '../../shared/protocol';
import type { UiScalePercent } from '../../shared/types';
import type { TouchpadMode, TouchpadZoneTarget } from '../../shared/touchpad-gestures';
import type {
  ChordControllerSettingSelectValue,
  ChordFunctionDraft,
  ChordKeyboardModifier,
  ChordNotchAction,
  ChordNotchTargetId,
  ChordStarterDefinition,
  ControlTabDefinition,
  ControlTabGroupDefinition,
  DualSenseEdgeRemapButtonId,
  RemapButtonDefinition,
  SidebarControlTab,
  StandardRemapButtonId,
  TriggerLabBuiltinProfileId,
  TriggerLabCustomProfileId,
  TriggerLabDraft
} from '../types/app-types';

export const KITSUNE_INPUT_URL = 'https://kitsuneinput.com/';
export const KITSUNE_INPUT_PURCHASE_URL = 'https://ko-fi.com/s/d1f0a3b26f';
export const HAPTICS_STEP = 20;
export const STANDARD_FEEDBACK_GAIN_PERCENT = 200;
export const BOOSTED_FEEDBACK_GAIN_PERCENT = 500;
export const SPEAKER_VOLUME_STEP = 10;
export const MIC_VOLUME_STEP = 10;
export const AUDIO_BUFFER_LENGTH_MIN = 16;
export const AUDIO_BUFFER_LENGTH_MAX = 128;
export const AUDIO_BUFFER_LENGTH_HIGH_STUTTER_MAX = 44;
export const AUDIO_BUFFER_LENGTH_RISKY_MAX = 63;
export const LIGHTBAR_BRIGHTNESS_STEP = 10;
export const TRIGGER_EFFECT_STEP = 10;
export const CONTROLLER_POWER_SAVING_CAP_PERCENT = 60;
export const RADIAL_DEADZONE_PRESETS = [0, 5, 10, 20] as const;
export const RADIAL_DEADZONE_TICKS = Array.from({ length: 11 }, (_, index) => index * 5);
export const TEST_HAPTICS_LOCK_MS = 1100;
export const TEST_SPEAKER_LOCK_MS = 900;
export const TEST_MIC_LISTEN_MS = 5000;
export const TEST_SPEAKER_VOLUME_SETTLE_MS = 90;
export const TEST_SPEAKER_ENDPOINT_ATTEMPTS = 12;
export const TEST_SPEAKER_ENDPOINT_RETRY_MS = 150;
export const TEST_SPEAKER_ENDPOINT_REFRESH_MS = 1500;
export const TEST_SPEAKER_ENDPOINT_VERIFY_MS = 100;
export const TEST_SPEAKER_PREROLL_MS = 220;
export const TEST_TRIGGER_LOCK_MS = 2800;
export const SLEEP_CONFIRM_MS = 2400;
export const STARTUP_READY_HOLD_MS = 1000;

export const LIGHTBAR_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 50],
  ['High', 100]
];
export const HAPTICS_PRESETS: Array<[string, number]> = [
  ['Low', 50],
  ['Medium', 100],
  ['High', 150]
];
export const SPEAKER_VOLUME_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
export const MIC_VOLUME_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
export const TRIGGER_EFFECT_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
export const PERCENT_SLIDER_TICKS = Array.from({ length: 11 }, (_, index) => index * 10);
export const TRIGGER_LAB_SLIDER_STEP = 5;
export const TRIGGER_LAB_SLIDER_TICKS = Array.from(
  { length: 21 },
  (_, index) => index * TRIGGER_LAB_SLIDER_STEP
);
export const STANDARD_HAPTICS_SLIDER_TICKS = Array.from({ length: 11 }, (_, index) => index * 20);
export const BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE = 'Controller audio endpoint unavailable';
export const BRIDGE_MIC_ENDPOINT_UNAVAILABLE = 'Controller microphone unavailable';

export const MUTE_KEY_OPTIONS: Array<[string, number]> = [
  ['F1', 0x3a],
  ['F2', 0x3b],
  ['F3', 0x3c],
  ['F4', 0x3d],
  ['F5', 0x3e],
  ['F6', 0x3f],
  ['F7', 0x40],
  ['F8', 0x41],
  ['F9', 0x42],
  ['F10', 0x43],
  ['F11', 0x44],
  ['F12', 0x45],
  ['F13', 0x68],
  ['F14', 0x69],
  ['F15', 0x6a],
  ['F16', 0x6b],
  ['F17', 0x6c],
  ['F18', 0x6d],
  ['F19', 0x6e],
  ['F20', 0x6f],
  ['F21', 0x70],
  ['F22', 0x71],
  ['F23', 0x72],
  ['F24', 0x73],
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, index) => [letter, 0x04 + index] as [string, number]),
  ['1', 0x1e],
  ['2', 0x1f],
  ['3', 0x20],
  ['4', 0x21],
  ['5', 0x22],
  ['6', 0x23],
  ['7', 0x24],
  ['8', 0x25],
  ['9', 0x26],
  ['0', 0x27],
  ['Enter', 0x28],
  ['Escape', 0x29],
  ['Backspace', 0x2a],
  ['Tab', 0x2b],
  ['Space', 0x2c],
  ['-', 0x2d],
  ['=', 0x2e],
  ['[', 0x2f],
  [']', 0x30],
  ['\\', 0x31],
  [';', 0x33],
  ["'", 0x34],
  ['`', 0x35],
  [',', 0x36],
  ['.', 0x37],
  ['/', 0x38],
  ['Insert', 0x49],
  ['Home', 0x4a],
  ['Page Up', 0x4b],
  ['Delete', 0x4c],
  ['End', 0x4d],
  ['Page Down', 0x4e],
  ['Right Arrow', 0x4f],
  ['Left Arrow', 0x50],
  ['Down Arrow', 0x51],
  ['Up Arrow', 0x52]
];

export const MUTE_MODIFIER_OPTIONS: Array<[string, number]> = [
  ['Ctrl', 0x01],
  ['Shift', 0x02],
  ['Alt', 0x04],
  ['Win', 0x08]
];

export const TRIGGER_TEST_MODE_OPTIONS: Array<[string, TriggerTestMode]> = [
  ['Feedback', 'feedback'],
  ['Weapon', 'weapon'],
  ['Vibration', 'vibration']
];

export const TRIGGER_LAB_BUILTIN_PROFILE_OPTIONS: Array<[string, TriggerLabBuiltinProfileId]> = [
  ['Default', 'default']
];

export const TRIGGER_LAB_PROFILE_PRESETS: Record<TriggerLabBuiltinProfileId, TriggerLabDraft> = {
  default: {
    profileId: 'default',
    mode: 'weapon',
    startPercent: 20,
    wallPercent: 60,
    forcePercent: 85
  }
};

export const TRIGGER_LAB_DEFAULT_DRAFT = TRIGGER_LAB_PROFILE_PRESETS.default;
export const TRIGGER_LAB_AUTO_CUSTOM_PROFILE_ID: TriggerLabCustomProfileId = 'custom';
export const TRIGGER_LAB_AUTO_CUSTOM_PROFILE_NAME = 'Custom';

export const MUTE_BUTTON_MODE_OPTIONS: Array<[string, MuteButtonMode]> = [
  ['Normal', 'normal'],
  ['Keyboard Key', 'keyboard'],
  ['Quiet Toggle', 'quiet'],
  ['Chord', 'chord']
];

export const MUTE_KEYBOARD_BEHAVIOR_OPTIONS: Array<[string, MuteKeyboardBehavior]> = [
  ['Tap Once', 'tap'],
  ['Hold While Pressed', 'hold']
];

export const POLLING_RATE_OPTIONS: Array<[string, PollingRateMode]> = [
  ['1000 Hz / Real-time', '1000'],
  ['500 Hz', '500'],
  ['250 Hz', '250']
];

export const HOST_PERSONA_OPTIONS: Array<[string, HostPersonaMode]> = [
  ['DualSense', 'dualsense'],
  ['DualSense Edge', 'dualsense-edge'],
  ['DualShock 4', 'ds4'],
  ['Xbox', 'xbox']
];

export const HOST_PERSONA_SHORT_LABELS: Record<HostPersonaMode, string> = {
  dualsense: 'DS',
  'dualsense-edge': 'DSE',
  ds4: 'DS4',
  xbox: 'XBOX'
};

export const SPEAKER_GAIN_OPTIONS: Array<[string, number]> = [
  ['1', 1],
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5', 5],
  ['6', 6],
  ['7', 7]
];

export const AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS: Array<[string, AudioReactiveHapticsMode]> = [
  ['Mix', 'mix'],
  ['Replace', 'replace']
];

export const AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS: Array<[string, AudioReactiveHapticsBassFocus]> = [
  ['80 Hz', 'deep'],
  ['160 Hz', 'balanced'],
  ['240 Hz', 'punchy'],
  ['400 Hz', 'wide']
];

export const AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS: Array<[string, AudioReactiveHapticsResponse]> = [
  ['Subtle', 'subtle'],
  ['Dynamic', 'balanced'],
  ['Aggressive', 'strong']
];

export const AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS: Array<[string, AudioReactiveHapticsAttack]> = [
  ['Slow Ramp', 'soft'],
  ['Medium Ramp', 'balanced'],
  ['Fast Ramp', 'fast'],
  ['Instant Ramp', 'sharp']
];

export const AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS: Array<[string, AudioReactiveHapticsRelease]> = [
  ['Fast Fade', 'tight'],
  ['Medium Fade', 'balanced'],
  ['Slow Fade', 'smooth'],
  ['Long Fade', 'long']
];

export const AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS = {
  bassFocus: 'Applies a low-pass filter that chooses which part of the low-end audio becomes vibration.',
  response: 'Controls how strongly haptics react to audio, especially louder peaks.',
  attack: 'Controls how quickly the haptics ramp when a sound rises or spikes.',
  release: 'Controls how quickly the haptics fade when a sound drops.'
} as const;

export const TRIGGER_TARGET_OPTIONS: Array<[string, TriggerTestTarget]> = [
  ['L2', 'l2'],
  ['R2', 'r2'],
  ['Both Triggers', 'both']
];

export const IDLE_DISCONNECT_TIMEOUT_OPTIONS: Array<[string, number]> = [
  ['5 min', 5],
  ['15 min', 15],
  ['30 min', 30]
];

export const UI_SCALE_OPTIONS: Array<[string, UiScalePercent]> = [
  ['75%', 75],
  ['100%', 100],
  ['125%', 125],
  ['150%', 150]
];

export const REMAP_BUTTONS: Record<RemapButtonId, RemapButtonDefinition> = {
  l2: { id: 'l2', label: 'L2', glyphUrl: l2GlyphUrl },
  l1: { id: 'l1', label: 'L1', glyphUrl: l1GlyphUrl },
  create: { id: 'create', label: 'Create', glyphUrl: createGlyphUrl },
  'dpad-up': { id: 'dpad-up', label: 'D-pad Up', glyphUrl: dpadUpGlyphUrl },
  'dpad-left': { id: 'dpad-left', label: 'D-pad Left', glyphUrl: dpadLeftGlyphUrl },
  'dpad-down': { id: 'dpad-down', label: 'D-pad Down', glyphUrl: dpadDownGlyphUrl },
  'dpad-right': { id: 'dpad-right', label: 'D-pad Right', glyphUrl: dpadRightGlyphUrl },
  l3: { id: 'l3', label: 'L3', glyphUrl: leftStickClickGlyphUrl },
  r2: { id: 'r2', label: 'R2', glyphUrl: r2GlyphUrl },
  r1: { id: 'r1', label: 'R1', glyphUrl: r1GlyphUrl },
  options: { id: 'options', label: 'Options', glyphUrl: optionsGlyphUrl },
  triangle: { id: 'triangle', label: 'Triangle', glyphUrl: triangleGlyphUrl },
  circle: { id: 'circle', label: 'Circle', glyphUrl: circleGlyphUrl },
  cross: { id: 'cross', label: 'Cross', glyphUrl: crossGlyphUrl },
  square: { id: 'square', label: 'Square', glyphUrl: squareGlyphUrl },
  r3: { id: 'r3', label: 'R3', glyphUrl: rightStickClickGlyphUrl },
  lb: { id: 'lb', label: 'Left Back Button', textGlyph: 'LB' },
  rb: { id: 'rb', label: 'Right Back Button', textGlyph: 'RB' },
  lfn: { id: 'lfn', label: 'Left Function Button', textGlyph: 'LFN' },
  rfn: { id: 'rfn', label: 'Right Function Button', textGlyph: 'RFN' },
  ps: { id: 'ps', label: 'PS Button', glyphUrl: psHomeGlyphUrl },
  touchpad: { id: 'touchpad', label: 'Touchpad', glyphUrl: touchpadPressGlyphUrl, textGlyph: 'TOUCH' }
};

export const REMAP_LEFT_BUTTON_IDS: StandardRemapButtonId[] = [
  'l2',
  'l1',
  'create',
  'dpad-up',
  'dpad-right',
  'dpad-down',
  'dpad-left',
  'l3'
];
export const REMAP_RIGHT_BUTTON_IDS: StandardRemapButtonId[] = [
  'r2',
  'r1',
  'options',
  'triangle',
  'circle',
  'cross',
  'r3',
  'square'
];
export const REMAP_STANDARD_BUTTON_IDS: StandardRemapButtonId[] = [
  ...REMAP_LEFT_BUTTON_IDS,
  ...REMAP_RIGHT_BUTTON_IDS
];

const REMAP_EDGE_TOP_BUTTON_IDS: DualSenseEdgeRemapButtonId[] = ['lb', 'rb'];
const REMAP_EDGE_BOTTOM_BUTTON_IDS: DualSenseEdgeRemapButtonId[] = ['lfn', 'rfn'];
export const REMAP_EDGE_BUTTON_IDS: DualSenseEdgeRemapButtonId[] = [
  ...REMAP_EDGE_TOP_BUTTON_IDS,
  ...REMAP_EDGE_BOTTOM_BUTTON_IDS
];

export const REMAP_STANDARD_TARGET_BUTTON_IDS: StandardRemapButtonId[] = [
  'triangle',
  'circle',
  'cross',
  'square',
  'dpad-up',
  'dpad-right',
  'dpad-down',
  'dpad-left',
  'l1',
  'r1',
  'l2',
  'r2',
  'l3',
  'r3',
  'create',
  'options'
];

export const REMAP_TARGET_BUTTON_IDS: RemapButtonId[] = [
  ...REMAP_STANDARD_TARGET_BUTTON_IDS,
  'ps',
  'touchpad'
];

export const CHORD_BUTTON_MENU_IDS: ChordAssignableButtonId[] = [
  ...REMAP_STANDARD_TARGET_BUTTON_IDS,
  'lb',
  'rb'
];

export const REMAP_ALL_BUTTON_IDS = [...REMAP_BUTTON_IDS] as RemapButtonId[];

export const REMAP_TARGET_OPTIONS: Array<[string, RemapButtonId]> = [
  ...REMAP_TARGET_BUTTON_IDS
].map((id) => [REMAP_BUTTONS[id].label, id]);

export const TOUCHPAD_TARGET_OPTIONS: Array<[string, TouchpadZoneTarget]> = [
  ...REMAP_TARGET_BUTTON_IDS.filter((id) => id !== 'touchpad').map(
    (id) => [REMAP_BUTTONS[id].label, id as TouchpadZoneTarget] as [string, TouchpadZoneTarget]
  ),
  ['Touchpad Click', 'touchpad'],
  ['Disabled (None)', 'none']
];

export const TOUCHPAD_MODE_OPTIONS: Array<[string, TouchpadMode]> = [
  ['Swipe Sequence', 'swipe'],
  ['4-Zone Button Mapping', 'zones']
];

export const TURBO_BUTTONS: Array<{ id: string; label: string; glyph: string; mask: number }> = [
  { id: 'cross', label: 'Cross', glyph: '✕', mask: 0x01 },
  { id: 'circle', label: 'Circle', glyph: '○', mask: 0x02 },
  { id: 'square', label: 'Square', glyph: '□', mask: 0x04 },
  { id: 'triangle', label: 'Triangle', glyph: '△', mask: 0x08 },
  { id: 'l1', label: 'L1', glyph: 'L1', mask: 0x10 },
  { id: 'r1', label: 'R1', glyph: 'R1', mask: 0x20 },
  { id: 'l2', label: 'L2', glyph: 'L2', mask: 0x40 },
  { id: 'r2', label: 'R2', glyph: 'R2', mask: 0x80 }
];

export const TURBO_SPEED_PRESETS: Array<{ label: string; cps: number; desc: string }> = [
  { label: 'Casual', cps: 5, desc: '200ms cycle' },
  { label: 'Natural', cps: 8, desc: '125ms (human rate)' },
  { label: 'Fast', cps: 12, desc: '83ms (jitter tap)' },
  { label: 'Pro Rapid', cps: 20, desc: '50ms (rapid fire)' }
];

export const CHORD_STARTERS: Record<ChordStarterId, ChordStarterDefinition> = {
  ps: { id: 'ps', label: 'PS Button', glyphUrl: psHomeGlyphUrl },
  lfn: { id: 'lfn', label: 'LFN', textGlyph: 'LFN' },
  rfn: { id: 'rfn', label: 'RFN', textGlyph: 'RFN' },
  mute: { id: CHORD_MUTE_STARTER_ID, label: 'Mute Button', Icon: MicOff }
};

export const CHORD_STARTER_OPTIONS: Array<[string, ChordStarterId]> = [
  [CHORD_STARTERS.ps.label, 'ps'],
  [CHORD_STARTERS.lfn.label, 'lfn'],
  [CHORD_STARTERS.rfn.label, 'rfn'],
  [CHORD_STARTERS.mute.label, CHORD_MUTE_STARTER_ID]
];

export const CHORD_FUNCTION_TYPE_OPTIONS: Array<[string, ChordFunctionType]> = [
  ['Keyboard Shortcut', 'keyboard'],
  ['Media Action', 'media'],
  ['Controller Setting', 'controller-setting']
];

export const CHORD_MEDIA_ACTION_OPTIONS: Array<[string, ChordMediaAction]> = [
  ['Play / Pause', 'play-pause'],
  ['Next Track', 'next-track'],
  ['Previous Track', 'previous-track'],
  ['Mute Output', 'mute'],
  ['Volume Up', 'volume-up'],
  ['Volume Down', 'volume-down']
];

export const CHORD_NOTCH_TARGETS: Array<{
  id: ChordNotchTargetId;
  label: string;
  downAction: ChordNotchAction;
  upAction: ChordNotchAction;
}> = [
  { id: 'speaker', label: 'Speaker', downAction: 'speaker-down', upAction: 'speaker-up' },
  { id: 'mic', label: 'Mic', downAction: 'mic-down', upAction: 'mic-up' },
  { id: 'haptics', label: 'Haptics', downAction: 'haptics-down', upAction: 'haptics-up' },
  { id: 'rumble', label: 'Rumble', downAction: 'rumble-down', upAction: 'rumble-up' },
  { id: 'triggers', label: 'Triggers', downAction: 'triggers-down', upAction: 'triggers-up' },
  { id: 'lighting', label: 'Lighting', downAction: 'lighting-down', upAction: 'lighting-up' }
];

export const CHORD_CONTROLLER_SETTING_ACTION_OPTIONS: Array<[string, ChordControllerSettingSelectValue]> = [
  ['Audio Haptics', 'toggle-audio-haptics'],
  ['Lightbar Override', 'toggle-lightbar-override'],
  ['Mic Mute', 'toggle-mic-mute'],
  ['Sleep Controller', 'sleep-controller'],
  ['DualSense', 'persona-dualsense'],
  ['DualSense Edge', 'persona-dualsense-edge'],
  ['DualShock 4', 'persona-ds4'],
  ['Xbox', 'persona-xbox'],
  ...CHORD_NOTCH_TARGETS.map((target): [string, ChordNotchTargetId] => [target.label, target.id])
];

export const CHORD_KEYBOARD_KEY_OPTIONS: Array<[string, string]> = [
  ['Esc', 'Esc'],
  ['Enter', 'Enter'],
  ['Space', 'Space'],
  ['Tab', 'Tab'],
  ['Backspace', 'Backspace'],
  ['Delete', 'Delete'],
  ['Insert', 'Insert'],
  ['Home', 'Home'],
  ['End', 'End'],
  ['Page Up', 'Page Up'],
  ['Page Down', 'Page Down'],
  ['Up Arrow', 'Up'],
  ['Down Arrow', 'Down'],
  ['Left Arrow', 'Left'],
  ['Right Arrow', 'Right'],
  ['Print Screen', 'Print Screen'],
  ['Pause', 'Pause'],
  ['Caps Lock', 'Caps Lock'],
  ['Num Lock', 'Num Lock'],
  ['Scroll Lock', 'Scroll Lock'],
  ['Menu', 'Menu'],
  ...Array.from({ length: 24 }, (_, index): [string, string] => [`F${index + 1}`, `F${index + 1}`]),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter): [string, string] => [letter, letter]),
  ...'1234567890'.split('').map((digit): [string, string] => [digit, digit]),
  ...'0123456789'.split('').map((digit): [string, string] => [`Numpad ${digit}`, `Numpad${digit}`])
];

export const CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH = Math.max(
  ...CHORD_KEYBOARD_KEY_OPTIONS.map(([label]) => label.length)
);

export const CHORD_KEYBOARD_MODIFIER_OPTIONS: Array<[ChordKeyboardModifier, ChordKeyboardModifier]> = [
  ['Ctrl', 'Ctrl'],
  ['Shift', 'Shift'],
  ['Alt', 'Alt'],
  ['Win', 'Win']
];

export const DEFAULT_CHORD_KEYBOARD_KEYS = ['Ctrl', 'Shift', 'Esc'];

export const EMPTY_CHORD_FUNCTION_DRAFT: ChordFunctionDraft = {
  id: '',
  name: 'Task Manager',
  type: 'keyboard',
  keyboardKey: 'Esc',
  keyboardModifiers: ['Ctrl', 'Shift'],
  mediaAction: 'play-pause',
  controllerAction: 'sleep-controller',
  controllerStepPercent: CHORD_CONTROLLER_SETTING_STEP_DEFAULT
};

export const DEFAULT_REMAP_DRAFT = Object.fromEntries(
  REMAP_ALL_BUTTON_IDS.map((id) => [id, id])
) as Record<RemapButtonId, RemapButtonId>;

export const REMAP_CALLOUT_POINTS: Record<StandardRemapButtonId, Array<[number, number]>> = {
  l2: [[2.4, 3.17], [118.22, 3.17], [171.1, 93.49]],
  l1: [[2.4, 63.71], [121.9, 63.71], [153.13, 118.36]],
  create: [[2.4, 124.24], [110.86, 124.24], [134, 163], [186.65, 162.89]],
  'dpad-up': [[2.4, 184.78], [146.83, 184.78]],
  'dpad-right': [[2.4, 245.32], [126.31, 245.32], [138.09, 221.25]],
  'dpad-down': [[2.4, 305.86], [124.63, 305.86], [162.42, 241.39]],
  'dpad-left': [[2.4, 366.39], [106.55, 366.39], [189.13, 221.85]],
  l3: [[2.4, 426.93], [143.77, 426.93], [230.4, 275.47]],
  r2: [[595.34, 3.17], [481.09, 3.17], [427.95, 93.94]],
  r1: [[595.34, 63.71], [476.83, 63.71], [445.92, 117.79]],
  options: [[595.34, 124.24], [487.5, 124.24], [464.28, 162.89], [411.62, 162.89]],
  triangle: [[595.34, 184.78], [453.97, 184.78]],
  circle: [[595.34, 245.32], [486.88, 245.32], [473.71, 222.09]],
  cross: [[595.34, 305.86], [472.22, 305.86], [438.56, 248.84]],
  square: [[595.34, 366.39], [485.42, 366.39], [405.35, 223.46]],
  r3: [[595.34, 426.93], [453.97, 426.93], [369.45, 275.47]]
};

export const REMAP_EDGE_CALLOUT_POINTS: Record<StandardRemapButtonId, Array<[number, number]>> = {
  l2: [[0.5, 0.5], [119.4, 0.5], [162.08, 90.82]],
  l1: [[0.5, 61.04], [118.08, 61.04], [154.08, 112.52]],
  create: [[0.5, 121.57], [108.96, 121.57], [132.1, 160.28], [183.55, 160.28]],
  'dpad-up': [[0.5, 182.11], [141.23, 182.11]],
  'dpad-right': [[0.5, 363.72], [104.65, 363.72], [188.5, 216.96]],
  'dpad-down': [[0.5, 303.19], [122.73, 303.19], [159.9, 239.79]],
  'dpad-left': [[0.5, 242.65], [124.41, 242.65], [137.98, 216.32]],
  l3: [[0.5, 424.26], [141.87, 424.26], [226.76, 271.06]],
  r2: [[593.44, 0.5], [482.26, 0.5], [439.58, 90.82]],
  r1: [[593.44, 61.04], [483.58, 61.04], [447.58, 112.52]],
  options: [[593.44, 121.57], [485.6, 121.57], [462.38, 160.22], [414.99, 160.22]],
  triangle: [[593.44, 182.11], [455.88, 182.11]],
  circle: [[593.44, 242.65], [484.98, 242.65], [470.67, 217.4]],
  cross: [[593.44, 303.19], [470.32, 303.19], [436.66, 246.17]],
  square: [[593.44, 363.72], [498.9, 363.72], [406.86, 218.55]],
  r3: [[593.44, 424.26], [452.07, 424.26], [370.93, 271.66]]
};

export const REMAP_CALLOUT_Y: Record<StandardRemapButtonId, number> = {
  l2: 3.17,
  l1: 63.71,
  create: 124.24,
  'dpad-up': 184.78,
  'dpad-right': 245.32,
  'dpad-down': 305.86,
  'dpad-left': 366.39,
  l3: 426.93,
  r2: 3.17,
  r1: 63.71,
  options: 124.24,
  triangle: 184.78,
  circle: 245.32,
  cross: 305.86,
  square: 366.39,
  r3: 426.93
};

export const REMAP_EDGE_CALLOUT_Y: Record<StandardRemapButtonId, number> = {
  l2: 0.5,
  l1: 61.04,
  create: 121.57,
  'dpad-up': 182.11,
  'dpad-right': 363.72,
  'dpad-down': 303.19,
  'dpad-left': 242.65,
  l3: 424.26,
  r2: 0.5,
  r1: 61.04,
  options: 121.57,
  triangle: 182.11,
  circle: 242.65,
  cross: 303.19,
  square: 363.72,
  r3: 424.26
};

export const REMAP_STANDARD_LAYOUT_ASSET = {
  src: remappingLayoutImage,
  viewBoxWidth: 597.47,
  viewBoxHeight: 429.39,
  calloutPoints: REMAP_CALLOUT_POINTS,
  calloutY: REMAP_CALLOUT_Y
};

export const REMAP_EDGE_LAYOUT_ASSET = {
  src: remappingEdgeLayoutImage,
  viewBoxWidth: 593.94,
  viewBoxHeight: 424.76,
  calloutPoints: REMAP_EDGE_CALLOUT_POINTS,
  calloutY: REMAP_EDGE_CALLOUT_Y
};

export const REMAP_EDGE_CONTROL_POINTS: Record<
  DualSenseEdgeRemapButtonId,
  { x: number; y: number; anchor: 'top' | 'bottom' }
> = {
  lb: { x: 227.59, y: 33.19, anchor: 'bottom' },
  rb: { x: 371.02, y: 33.19, anchor: 'bottom' },
  lfn: { x: 227.5, y: 368.88, anchor: 'top' },
  rfn: { x: 370.46, y: 368.88, anchor: 'top' }
};

export const REMAP_EDGE_LINE_POINTS: Record<
  DualSenseEdgeRemapButtonId,
  [[number, number], [number, number]]
> = {
  lb: [[227.59, 33.19], [227.42, 105.09]],
  rb: [[371.02, 33.19], [370.84, 105.09]],
  lfn: [[227.5, 368.88], [227.68, 296.98]],
  rfn: [[370.46, 368.88], [370.64, 296.98]]
};

export const CONTROL_TAB_DEFINITIONS: Record<SidebarControlTab, ControlTabDefinition> = {
  overview: { id: 'overview', label: 'Overview', Icon: IconLayoutDashboard },
  devices: { id: 'devices', label: 'Devices', Icon: IconBluetooth },
  audio: { id: 'audio', label: 'Audio', Icon: IconVolume },
  haptics: { id: 'haptics', label: 'Haptics', Icon: Sparkles },
  'audio-haptics': { id: 'audio-haptics', label: 'Audio Haptics', Icon: IconDeviceAudioTape },
  triggers: { id: 'triggers', label: 'Adaptive Triggers', Icon: IconDeviceGamepad2 },
  'trigger-lab': { id: 'trigger-lab', label: 'Trigger Lab', Icon: IconFlask2 },
  lighting: { id: 'lighting', label: 'Lighting', Icon: IconBulb },
  deadzones: { id: 'deadzones', label: 'Stick Deadzones', Icon: IconViewfinder },
  remapping: { id: 'remapping', label: 'Button Remapping', Icon: IconDeviceGamepad3 },
  chords: { id: 'chords', label: 'Chords', Icon: IconReplace },
  system: { id: 'system', label: 'System', Icon: IconCpu }
};

export const CONTROL_TAB_GROUPS: readonly ControlTabGroupDefinition[] = [
  {
    id: 'controller',
    label: 'Controller',
    Icon: IconDeviceGamepad3,
    tabs: [
      CONTROL_TAB_DEFINITIONS.devices,
      CONTROL_TAB_DEFINITIONS.audio,
      CONTROL_TAB_DEFINITIONS.haptics,
      CONTROL_TAB_DEFINITIONS.triggers,
      CONTROL_TAB_DEFINITIONS.lighting
    ]
  },
  {
    id: 'input',
    label: 'Input',
    Icon: IconReplace,
    tabs: [
      CONTROL_TAB_DEFINITIONS.deadzones,
      CONTROL_TAB_DEFINITIONS.remapping,
      CONTROL_TAB_DEFINITIONS.chords
    ]
  },
  {
    id: 'labs',
    label: 'Labs',
    Icon: IconFlask2,
    tabs: [
      CONTROL_TAB_DEFINITIONS['audio-haptics'],
      CONTROL_TAB_DEFINITIONS['trigger-lab']
    ]
  }
];

export { CHORD_MUTE_STARTER_ID };

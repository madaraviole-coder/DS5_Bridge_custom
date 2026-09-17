import type { RemapButtonId } from './protocol';

export type TouchpadZoneId = 1 | 2 | 3 | 4;
export type TouchpadZone = TouchpadZoneId | null;

export type TouchpadMode = 'zones' | 'swipe';

export type GestureType = 'Swipe' | 'Tap' | 'Hold';

export interface TouchpadGesture {
  id: string;
  name: string;
  type: GestureType;
  sequence: number[]; // Contoh: [1, 2] untuk Swipe dari Zona 1 ke Zona 2
  actionType: 'windows-shortcut' | 'media' | 'custom-keys' | 'button';
  actionValue: string; // Contoh: 'toggle-hdr' (Win+Alt+B), 'screenshot' (Win+Shift+S)
}

export type TouchpadZoneTarget = RemapButtonId | 'touchpad' | 'none';

export interface TouchpadZoneMapping {
  1: TouchpadZoneTarget;
  2: TouchpadZoneTarget;
  3: TouchpadZoneTarget;
  4: TouchpadZoneTarget;
}

export interface TouchpadSettings {
  enabled: boolean;
  mode: TouchpadMode;
  deadzonePercent: number; // Misal 50%
  zoneMappings: TouchpadZoneMapping;
  gestures: TouchpadGesture[];
}

export const DEFAULT_TOUCHPAD_ZONE_MAPPINGS: TouchpadZoneMapping = {
  1: 'triangle',
  2: 'circle',
  3: 'square',
  4: 'cross',
};

export interface GestureWindowsShortcut {
  value: string;
  label: string;
  description: string;
  keys: string[];
}

export const GESTURE_WINDOWS_SHORTCUTS: GestureWindowsShortcut[] = [
  { value: 'toggle-hdr', label: 'Toggle HDR', description: 'Windows + Alt + B', keys: ['WIN', 'ALT', 'B'] },
  { value: 'screenshot', label: 'Snipping Tool', description: 'Windows + Shift + S', keys: ['WIN', 'SHIFT', 'S'] },
  { value: 'game-bar', label: 'Xbox Game Bar', description: 'Windows + G', keys: ['WIN', 'G'] },
  { value: 'task-manager', label: 'Task Manager', description: 'Ctrl + Shift + Esc', keys: ['CTRL', 'SHIFT', 'ESCAPE'] },
  { value: 'desktop', label: 'Show Desktop', description: 'Windows + D', keys: ['WIN', 'D'] },
  { value: 'task-view', label: 'Task View', description: 'Windows + Tab', keys: ['WIN', 'TAB'] },
  { value: 'lock', label: 'Lock PC', description: 'Windows + L', keys: ['WIN', 'L'] },
];

export interface GestureMediaAction {
  value: string;
  label: string;
  description: string;
}

export const GESTURE_MEDIA_ACTIONS: GestureMediaAction[] = [
  { value: 'play-pause', label: 'Play / Pause', description: 'Toggle playback' },
  { value: 'next-track', label: 'Next Track', description: 'Skip forward' },
  { value: 'previous-track', label: 'Previous Track', description: 'Skip backward' },
  { value: 'mute', label: 'Mute Audio', description: 'Toggle mute master volume' },
  { value: 'volume-up', label: 'Volume Up', description: 'Increase volume' },
  { value: 'volume-down', label: 'Volume Down', description: 'Decrease volume' },
];

export interface GestureButtonAction {
  value: TouchpadZoneTarget;
  label: string;
  glyph: string;
}

export const GESTURE_BUTTON_ACTIONS: GestureButtonAction[] = [
  { value: 'triangle', label: 'Triangle (△)', glyph: '△' },
  { value: 'circle', label: 'Circle (○)', glyph: '○' },
  { value: 'cross', label: 'Cross (✕)', glyph: '✕' },
  { value: 'square', label: 'Square (□)', glyph: '□' },
  { value: 'l1', label: 'L1 Bumper', glyph: 'L1' },
  { value: 'r1', label: 'R1 Bumper', glyph: 'R1' },
  { value: 'l2', label: 'L2 Trigger', glyph: 'L2' },
  { value: 'r2', label: 'R2 Trigger', glyph: 'R2' },
  { value: 'l3', label: 'L3 Stick Click', glyph: 'L3' },
  { value: 'r3', label: 'R3 Stick Click', glyph: 'R3' },
  { value: 'dpad-up', label: 'D-Pad Up', glyph: '↑' },
  { value: 'dpad-right', label: 'D-Pad Right', glyph: '→' },
  { value: 'dpad-down', label: 'D-Pad Down', glyph: '↓' },
  { value: 'dpad-left', label: 'D-Pad Left', glyph: '←' },
  { value: 'create', label: 'Create', glyph: '⧉' },
  { value: 'options', label: 'Options', glyph: '☰' },
  { value: 'ps', label: 'PS Home', glyph: 'PS' },
  { value: 'touchpad', label: 'Touchpad Click', glyph: 'TP' },
];

export interface GestureSequencePreset {
  label: string;
  sequence: number[];
  description: string;
}

export const GESTURE_SEQUENCE_PRESETS: GestureSequencePreset[] = [
  { label: 'Swipe Right (1➔2)', sequence: [1, 2], description: 'Zone 1 ➔ Zone 2' },
  { label: 'Swipe Left (2➔1)', sequence: [2, 1], description: 'Zone 2 ➔ Zone 1' },
  { label: 'Swipe Down (Left)', sequence: [1, 3], description: 'Zone 1 ➔ Zone 3' },
  { label: 'Swipe Up (Left)', sequence: [3, 1], description: 'Zone 3 ➔ Zone 1' },
  { label: 'Swipe Down (Right)', sequence: [2, 4], description: 'Zone 2 ➔ Zone 4' },
  { label: 'Swipe Up (Right)', sequence: [4, 2], description: 'Zone 4 ➔ Zone 2' },
  { label: 'Diagonal ↘', sequence: [1, 4], description: 'Zone 1 ➔ Zone 4' },
  { label: 'Diagonal ↗', sequence: [3, 2], description: 'Zone 3 ➔ Zone 2' },
];

export function getGestureActionLabel(
  actionTypeOrGesture: TouchpadGesture | TouchpadGesture['actionType'],
  actionValue?: string
): string {
  let actionType: TouchpadGesture['actionType'];
  let val: string;
  if (typeof actionTypeOrGesture === 'object' && actionTypeOrGesture !== null) {
    actionType = actionTypeOrGesture.actionType;
    val = actionTypeOrGesture.actionValue;
  } else {
    actionType = actionTypeOrGesture;
    val = actionValue ?? '';
  }

  switch (actionType) {
    case 'windows-shortcut': {
      const match = GESTURE_WINDOWS_SHORTCUTS.find((s) => s.value === val);
      return match ? match.label : `Shortcut: ${val}`;
    }
    case 'media': {
      const match = GESTURE_MEDIA_ACTIONS.find((m) => m.value === val);
      return match ? match.label : `Media: ${val}`;
    }
    case 'button': {
      const match = GESTURE_BUTTON_ACTIONS.find((b) => b.value === val);
      return match ? match.label : `Button: ${val}`;
    }
    case 'custom-keys':
      return val ? `Keys: ${val}` : 'Custom Keys';
    default:
      return val || 'Unassigned';
  }
}

export function getGestureActionDescription(
  actionTypeOrGesture: TouchpadGesture | TouchpadGesture['actionType'],
  actionValue?: string
): string {
  let actionType: TouchpadGesture['actionType'];
  let val: string;
  if (typeof actionTypeOrGesture === 'object' && actionTypeOrGesture !== null) {
    actionType = actionTypeOrGesture.actionType;
    val = actionTypeOrGesture.actionValue;
  } else {
    actionType = actionTypeOrGesture;
    val = actionValue ?? '';
  }

  switch (actionType) {
    case 'windows-shortcut': {
      const match = GESTURE_WINDOWS_SHORTCUTS.find((s) => s.value === val);
      return match ? match.description : val;
    }
    case 'media': {
      const match = GESTURE_MEDIA_ACTIONS.find((m) => m.value === val);
      return match ? match.description : 'Media action';
    }
    case 'button': {
      const match = GESTURE_BUTTON_ACTIONS.find((b) => b.value === val);
      return match ? `Remap to ${match.label}` : `Controller button ${val}`;
    }
    case 'custom-keys':
      return val ? `Custom key sequence: ${val}` : 'User-defined keyboard keys';
    default:
      return '';
  }
}

export function formatGestureSequence(sequence: number[]): string {
  if (!sequence || sequence.length === 0) return 'None';
  return sequence.map((z) => `Zone ${z}`).join(' ➔ ');
}

export function parseCustomKeysString(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[+,\s]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export const DEFAULT_TOUCHPAD_SETTINGS: TouchpadSettings = {
  enabled: true,
  mode: 'swipe',
  deadzonePercent: 50,
  zoneMappings: { ...DEFAULT_TOUCHPAD_ZONE_MAPPINGS },
  gestures: [
    {
      id: 'hdr-toggle',
      name: 'Toggle HDR',
      type: 'Swipe',
      sequence: [1, 2],
      actionType: 'windows-shortcut',
      actionValue: 'toggle-hdr',
    },
  ],
};

export const TOUCHPAD_SETTINGS_STORAGE_KEY = 'ds5bridge.touchpadSettings';

export function loadTouchpadSettings(storage?: Storage): TouchpadSettings {
  try {
    if (!storage) return { ...DEFAULT_TOUCHPAD_SETTINGS };
    const raw = storage.getItem(TOUCHPAD_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TOUCHPAD_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<TouchpadSettings>;
    const gestures = Array.isArray(parsed.gestures) && parsed.gestures.length > 0
      ? parsed.gestures.map((g, index) => ({
          id: typeof g.id === 'string' && g.id.trim() ? g.id.trim() : `gesture-${index + 1}`,
          name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : `Gesture ${index + 1}`,
          type: (g.type === 'Swipe' || g.type === 'Tap' || g.type === 'Hold' ? g.type : 'Swipe') as GestureType,
          sequence: Array.isArray(g.sequence) && g.sequence.length > 0 ? g.sequence.map((n) => Number(n)) : [1, 2],
          actionType: (g.actionType === 'windows-shortcut' || g.actionType === 'media' || g.actionType === 'custom-keys' || g.actionType === 'button'
            ? g.actionType
            : 'windows-shortcut') as TouchpadGesture['actionType'],
          actionValue: typeof g.actionValue === 'string' && g.actionValue.trim() ? g.actionValue.trim() : 'toggle-hdr',
        }))
      : DEFAULT_TOUCHPAD_SETTINGS.gestures;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_TOUCHPAD_SETTINGS.enabled,
      mode: parsed.mode === 'zones' || parsed.mode === 'swipe' ? parsed.mode : 'swipe',
      deadzonePercent: typeof parsed.deadzonePercent === 'number' ? parsed.deadzonePercent : 50,
      zoneMappings: {
        1: parsed.zoneMappings?.[1] ?? DEFAULT_TOUCHPAD_ZONE_MAPPINGS[1],
        2: parsed.zoneMappings?.[2] ?? DEFAULT_TOUCHPAD_ZONE_MAPPINGS[2],
        3: parsed.zoneMappings?.[3] ?? DEFAULT_TOUCHPAD_ZONE_MAPPINGS[3],
        4: parsed.zoneMappings?.[4] ?? DEFAULT_TOUCHPAD_ZONE_MAPPINGS[4],
      },
      gestures,
    };
  } catch {
    return { ...DEFAULT_TOUCHPAD_SETTINGS };
  }
}

export function saveTouchpadSettings(storage: Storage | undefined, settings: TouchpadSettings): void {
  try {
    if (storage) {
      storage.setItem(TOUCHPAD_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // Ignore storage quota errors
  }
}

// Deteksi zona berdasarkan koordinat DualSense (X: 0..1920, Y: 0..1080)
export function getTouchpadZone(
  x: number,
  y: number,
  deadzonePercent: number
): TouchpadZone {
  const centerX = 960;
  const centerY = 540;

  // Hitung radius deadzone lingkaran di tengah
  const maxRadius = 300;
  const deadzoneRadius = (maxRadius * deadzonePercent) / 100;
  const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;

  if (distSq < deadzoneRadius ** 2) {
    return null; // Di dalam deadzone tengah
  }

  if (x < centerX && y < centerY) return 1; // Kiri Atas
  if (x >= centerX && y < centerY) return 2; // Kanan Atas
  if (x < centerX && y >= centerY) return 3; // Kiri Bawah
  return 4; // Kanan Bawah
}

export function touchpadTargetToProtocolId(target: TouchpadZoneTarget): number {
  switch (target) {
    case 'triangle': return 1;
    case 'circle': return 2;
    case 'cross': return 3;
    case 'square': return 4;
    case 'l1': return 5;
    case 'r1': return 6;
    case 'l2': return 7;
    case 'r2': return 8;
    case 'l3': return 9;
    case 'r3': return 10;
    case 'dpad-up': return 11;
    case 'dpad-right': return 12;
    case 'dpad-down': return 13;
    case 'dpad-left': return 14;
    case 'create': return 15;
    case 'options': return 16;
    case 'ps': return 17;
    case 'touchpad': return 18;
    case 'none':
    default:
      return 0;
  }
}

export function protocolIdToTouchpadTarget(id: number): TouchpadZoneTarget {
  switch (id) {
    case 1: return 'triangle';
    case 2: return 'circle';
    case 3: return 'cross';
    case 4: return 'square';
    case 5: return 'l1';
    case 6: return 'r1';
    case 7: return 'l2';
    case 8: return 'r2';
    case 9: return 'l3';
    case 10: return 'r3';
    case 11: return 'dpad-up';
    case 12: return 'dpad-right';
    case 13: return 'dpad-down';
    case 14: return 'dpad-left';
    case 15: return 'create';
    case 16: return 'options';
    case 17: return 'ps';
    case 18: return 'touchpad';
    case 0:
    default:
      return 'none';
  }
}


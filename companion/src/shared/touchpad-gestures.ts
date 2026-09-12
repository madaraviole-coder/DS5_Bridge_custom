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
      gestures: Array.isArray(parsed.gestures) && parsed.gestures.length > 0 ? parsed.gestures : DEFAULT_TOUCHPAD_SETTINGS.gestures,
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

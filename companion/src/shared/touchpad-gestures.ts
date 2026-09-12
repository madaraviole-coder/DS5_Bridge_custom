export type TouchpadZone = 1 | 2 | 3 | 4 | null;

export type GestureType = 'Swipe' | 'Tap' | 'Hold';

export interface TouchpadGesture {
  id: string;
  name: string;
  type: GestureType;
  sequence: number[]; // Contoh: [1, 2] untuk Swipe dari Zona 1 ke Zona 2
  actionType: 'windows-shortcut' | 'media' | 'custom-keys';
  actionValue: string; // Contoh: 'toggle-hdr' (Win+Alt+B), 'screenshot' (Win+Shift+S)
}

export interface TouchpadSettings {
  enabled: boolean;
  deadzonePercent: number; // Misal 50%
  gestures: TouchpadGesture[];
}

export const DEFAULT_TOUCHPAD_SETTINGS: TouchpadSettings = {
  enabled: true,
  deadzonePercent: 50,
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

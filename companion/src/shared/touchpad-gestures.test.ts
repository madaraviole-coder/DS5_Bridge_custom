import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOUCHPAD_SETTINGS,
  DEFAULT_TOUCHPAD_ZONE_MAPPINGS,
  getTouchpadZone,
  loadTouchpadSettings,
  saveTouchpadSettings,
  TOUCHPAD_SETTINGS_STORAGE_KEY,
  type TouchpadSettings
} from './touchpad-gestures';

describe('touchpad-gestures', () => {
  it('correctly detects zones based on coordinates', () => {
    // Center is (960, 540)
    // Zone 1: Top-Left (< 960, < 540) far from deadzone
    expect(getTouchpadZone(200, 200, 50)).toBe(1);

    // Zone 2: Top-Right (>= 960, < 540) far from deadzone
    expect(getTouchpadZone(1500, 200, 50)).toBe(2);

    // Zone 3: Bottom-Left (< 960, >= 540) far from deadzone
    expect(getTouchpadZone(200, 900, 50)).toBe(3);

    // Zone 4: Bottom-Right (>= 960, >= 540) far from deadzone
    expect(getTouchpadZone(1500, 900, 50)).toBe(4);

    // Inside deadzone (deadzonePercent = 50 -> maxRadius 300 -> radius 150)
    expect(getTouchpadZone(960, 540, 50)).toBeNull();
    expect(getTouchpadZone(970, 545, 50)).toBeNull();
  });

  it('loads and saves settings with Storage mock', () => {
    const memory = new Map<string, string>();
    const mockStorage: Storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
      clear: () => memory.clear(),
      key: (index: number) => Array.from(memory.keys())[index] ?? null,
      get length() {
        return memory.size;
      }
    };

    // Default when storage is empty
    const initial = loadTouchpadSettings(mockStorage);
    expect(initial.mode).toBe('swipe');
    expect(initial.zoneMappings[1]).toBe(DEFAULT_TOUCHPAD_ZONE_MAPPINGS[1]);
    expect(initial.zoneMappings[2]).toBe(DEFAULT_TOUCHPAD_ZONE_MAPPINGS[2]);

    // Save customized settings
    const updated: TouchpadSettings = {
      ...initial,
      mode: 'zones',
      zoneMappings: {
        1: 'dpad-up',
        2: 'dpad-right',
        3: 'dpad-left',
        4: 'dpad-down'
      }
    };
    saveTouchpadSettings(mockStorage, updated);

    // Verify stored
    expect(memory.has(TOUCHPAD_SETTINGS_STORAGE_KEY)).toBe(true);
    const loaded = loadTouchpadSettings(mockStorage);
    expect(loaded.mode).toBe('zones');
    expect(loaded.zoneMappings[1]).toBe('dpad-up');
    expect(loaded.zoneMappings[4]).toBe('dpad-down');
  });

  it('gracefully handles corrupted JSON in storage', () => {
    const mockStorage: Storage = {
      getItem: () => 'INVALID_JSON_CORRUPTED{{{',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 1
    };

    const fallback = loadTouchpadSettings(mockStorage);
    expect(fallback).toEqual(DEFAULT_TOUCHPAD_SETTINGS);
  });

  it('converts between TouchpadZoneTarget and protocol IDs', async () => {
    const { touchpadTargetToProtocolId, protocolIdToTouchpadTarget } = await import('./touchpad-gestures');
    expect(touchpadTargetToProtocolId('triangle')).toBe(1);
    expect(touchpadTargetToProtocolId('circle')).toBe(2);
    expect(touchpadTargetToProtocolId('cross')).toBe(3);
    expect(touchpadTargetToProtocolId('square')).toBe(4);
    expect(touchpadTargetToProtocolId('l1')).toBe(5);
    expect(touchpadTargetToProtocolId('touchpad')).toBe(18);
    expect(touchpadTargetToProtocolId('none')).toBe(0);

    expect(protocolIdToTouchpadTarget(1)).toBe('triangle');
    expect(protocolIdToTouchpadTarget(2)).toBe('circle');
    expect(protocolIdToTouchpadTarget(3)).toBe('cross');
    expect(protocolIdToTouchpadTarget(4)).toBe('square');
    expect(protocolIdToTouchpadTarget(5)).toBe('l1');
    expect(protocolIdToTouchpadTarget(18)).toBe('touchpad');
    expect(protocolIdToTouchpadTarget(0)).toBe('none');
  });
});

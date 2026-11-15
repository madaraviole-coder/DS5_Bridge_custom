import { describe, expect, it } from 'vitest';
import {
  KITSUNE_KEYBOARD_ROWS,
  cellLabel,
  isKeyboardFlyout,
  moveKeyboardFocus
} from './kitsune-bar-keyboard';

describe('kitsune-bar-keyboard', () => {
  it('recognizes keyboard flyout ids', () => {
    expect(isKeyboardFlyout('keyboard')).toBe(true);
    expect(isKeyboardFlyout('virtual-keyboard')).toBe(true);
    expect(isKeyboardFlyout('audio')).toBe(false);
  });

  it('moves focus within a row with wrap', () => {
    expect(moveKeyboardFocus(1, 0, 'left')).toEqual({ row: 1, col: KITSUNE_KEYBOARD_ROWS[1].length - 1 });
    expect(moveKeyboardFocus(1, 0, 'right')).toEqual({ row: 1, col: 1 });
  });

  it('moves focus between rows and clamps column', () => {
    const lastCol = KITSUNE_KEYBOARD_ROWS[0].length - 1;
    expect(moveKeyboardFocus(0, lastCol, 'down').row).toBe(1);
    expect(moveKeyboardFocus(0, lastCol, 'down').col).toBeLessThanOrEqual(KITSUNE_KEYBOARD_ROWS[1].length - 1);
    expect(moveKeyboardFocus(0, 0, 'up').row).toBe(KITSUNE_KEYBOARD_ROWS.length - 1);
  });

  it('labels cells with shift', () => {
    const q = KITSUNE_KEYBOARD_ROWS[1][0];
    expect(cellLabel(q, false)).toBe('q');
    expect(cellLabel(q, true)).toBe('Q');
  });
});

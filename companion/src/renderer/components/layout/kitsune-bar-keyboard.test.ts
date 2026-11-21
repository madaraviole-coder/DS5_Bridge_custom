import { describe, expect, it } from 'vitest';
import {
  KITSUNE_KEYBOARD_ROWS,
  cellLabel,
  findCharFocus,
  handleKeyboardNavAction,
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

  it('uses Steam-like prompts on action keys', () => {
    const actionRow = KITSUNE_KEYBOARD_ROWS[KITSUNE_KEYBOARD_ROWS.length - 1];
    const byId = (id: string) =>
      KITSUNE_KEYBOARD_ROWS.flat().find((c) => c.kind === 'action' && c.id === id);

    expect(byId('Backspace')).toMatchObject({ kind: 'action', prompt: '□' });
    expect(byId('Abc')).toMatchObject({ kind: 'action', prompt: '○' });
    expect(byId('Space')).toMatchObject({ kind: 'action', prompt: '△' });
    expect(byId('Enter')).toMatchObject({ kind: 'action', prompt: 'R2' });
    const done = byId('Done');
    expect(done).toMatchObject({ kind: 'action', label: 'DONE' });
    expect(done?.kind === 'action' ? done.prompt : 'missing').toBeUndefined();
    expect(actionRow.find((c) => c.kind === 'action' && c.id === 'GyroMouse')).toMatchObject({
      prompt: 'L3+R3'
    });
  });

  it('finds preview focus for letter k', () => {
    expect(findCharFocus('k')).toEqual({ row: 2, col: 7 });
  });

  it('maps Steam-like keyboard nav actions', () => {
    expect(handleKeyboardNavAction('left', { moveMode: false })).toBe('move-focus');
    expect(handleKeyboardNavAction('left', { moveMode: true })).toBe('move-overlay');
    expect(handleKeyboardNavAction('cancel', { moveMode: false })).toBe('toggle-shift');
    expect(handleKeyboardNavAction('cancel', { moveMode: true })).toBe('cancel');
    expect(handleKeyboardNavAction('kb-square', { moveMode: false })).toBe('backspace');
    expect(handleKeyboardNavAction('kb-triangle', { moveMode: false })).toBe('space');
    expect(handleKeyboardNavAction('kb-r2', { moveMode: false })).toBe('enter');
    expect(handleKeyboardNavAction('kb-l2', { moveMode: false })).toBe('toggle-shift');
    expect(handleKeyboardNavAction('kb-l1', { moveMode: false })).toBe('caret-left');
    expect(handleKeyboardNavAction('kb-r1', { moveMode: false })).toBe('caret-right');
    expect(handleKeyboardNavAction('kb-gyro', { moveMode: false })).toBe('toggle-gyro');
  });
});

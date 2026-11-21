/** QWERTY layout cells for the Kitsune Bar in-overlay gamepad keyboard. */

export type KitsuneNavAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'select'
  | 'cancel'
  | 'kb-l1'
  | 'kb-r1'
  | 'kb-l2'
  | 'kb-r2'
  | 'kb-square'
  | 'kb-triangle'
  | 'kb-gyro';

export type KeyboardActionId =
  | 'Shift'
  | 'Space'
  | 'Backspace'
  | 'Enter'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'GyroMouse'
  | 'Done'
  | 'Abc';

export type KeyboardCell =
  | { kind: 'char'; lower: string; upper: string }
  | { kind: 'action'; id: KeyboardActionId; label: string; prompt?: string };

export type KeyboardNavResult =
  | 'move-focus'
  | 'caret-left'
  | 'caret-right'
  | 'toggle-shift'
  | 'backspace'
  | 'space'
  | 'enter'
  | 'done'
  | 'toggle-gyro'
  | 'cancel'
  | 'select'
  | 'move-overlay'
  | 'ignore';

export const KITSUNE_KEYBOARD_ROWS: readonly (readonly KeyboardCell[])[] = [
  [
    { kind: 'char', lower: '1', upper: '!' },
    { kind: 'char', lower: '2', upper: '@' },
    { kind: 'char', lower: '3', upper: '#' },
    { kind: 'char', lower: '4', upper: '$' },
    { kind: 'char', lower: '5', upper: '%' },
    { kind: 'char', lower: '6', upper: '^' },
    { kind: 'char', lower: '7', upper: '&' },
    { kind: 'char', lower: '8', upper: '*' },
    { kind: 'char', lower: '9', upper: '(' },
    { kind: 'char', lower: '0', upper: ')' },
    { kind: 'char', lower: '@', upper: '@' }
  ],
  [
    { kind: 'char', lower: 'q', upper: 'Q' },
    { kind: 'char', lower: 'w', upper: 'W' },
    { kind: 'char', lower: 'e', upper: 'E' },
    { kind: 'char', lower: 'r', upper: 'R' },
    { kind: 'char', lower: 't', upper: 'T' },
    { kind: 'char', lower: 'y', upper: 'Y' },
    { kind: 'char', lower: 'u', upper: 'U' },
    { kind: 'char', lower: 'i', upper: 'I' },
    { kind: 'char', lower: 'o', upper: 'O' },
    { kind: 'char', lower: 'p', upper: 'P' }
  ],
  [
    { kind: 'char', lower: 'a', upper: 'A' },
    { kind: 'char', lower: 's', upper: 'S' },
    { kind: 'char', lower: 'd', upper: 'D' },
    { kind: 'char', lower: 'f', upper: 'F' },
    { kind: 'char', lower: 'g', upper: 'G' },
    { kind: 'char', lower: 'h', upper: 'H' },
    { kind: 'char', lower: 'j', upper: 'J' },
    { kind: 'char', lower: 'k', upper: 'K' },
    { kind: 'char', lower: 'l', upper: 'L' },
    { kind: 'action', id: 'Backspace', label: '⌫', prompt: '□' }
  ],
  [
    { kind: 'action', id: 'Abc', label: 'ABC', prompt: '○' },
    { kind: 'char', lower: 'z', upper: 'Z' },
    { kind: 'char', lower: 'x', upper: 'X' },
    { kind: 'char', lower: 'c', upper: 'C' },
    { kind: 'char', lower: 'v', upper: 'V' },
    { kind: 'char', lower: 'b', upper: 'B' },
    { kind: 'char', lower: 'n', upper: 'N' },
    { kind: 'char', lower: 'm', upper: 'M' },
    { kind: 'char', lower: '-', upper: '_' },
    { kind: 'char', lower: '.', upper: '>' },
    { kind: 'char', lower: '?', upper: '?' },
    { kind: 'char', lower: '!', upper: '!' }
  ],
  [
    { kind: 'action', id: 'ArrowLeft', label: '←', prompt: 'L1' },
    { kind: 'action', id: 'ArrowRight', label: '→', prompt: 'R1' },
    { kind: 'action', id: 'ArrowUp', label: '↑' },
    { kind: 'action', id: 'ArrowDown', label: '↓' },
    { kind: 'action', id: 'Space', label: 'Space', prompt: '△' },
    { kind: 'action', id: 'Enter', label: 'Enter', prompt: 'R2' },
    { kind: 'action', id: 'GyroMouse', label: 'GYRO MOUSE', prompt: 'L3+R3' },
    { kind: 'action', id: 'Done', label: 'DONE' }
  ]
];

export function isKeyboardFlyout(id: string | null | undefined): boolean {
  return id === 'virtual-keyboard' || id === 'keyboard';
}

export function cellLabel(cell: KeyboardCell, shift: boolean): string {
  if (cell.kind === 'action') return cell.label;
  return shift ? cell.upper : cell.lower;
}

export function findCharFocus(ch: string): { row: number; col: number } {
  const target = ch.toLowerCase();
  for (let row = 0; row < KITSUNE_KEYBOARD_ROWS.length; row++) {
    for (let col = 0; col < KITSUNE_KEYBOARD_ROWS[row].length; col++) {
      const cell = KITSUNE_KEYBOARD_ROWS[row][col];
      if (cell.kind === 'char' && cell.lower === target) {
        return { row, col };
      }
    }
  }
  return { row: 2, col: 7 };
}

export function moveKeyboardFocus(
  row: number,
  col: number,
  dir: 'left' | 'right' | 'up' | 'down'
): { row: number; col: number } {
  const rows = KITSUNE_KEYBOARD_ROWS;
  if (dir === 'left') {
    const nextCol = col > 0 ? col - 1 : rows[row].length - 1;
    return { row, col: nextCol };
  }
  if (dir === 'right') {
    const nextCol = col < rows[row].length - 1 ? col + 1 : 0;
    return { row, col: nextCol };
  }
  if (dir === 'up') {
    const nextRow = row > 0 ? row - 1 : rows.length - 1;
    const nextCol = Math.min(col, rows[nextRow].length - 1);
    return { row: nextRow, col: nextCol };
  }
  const nextRow = row < rows.length - 1 ? row + 1 : 0;
  const nextCol = Math.min(col, rows[nextRow].length - 1);
  return { row: nextRow, col: nextCol };
}

export function handleKeyboardNavAction(
  action: KitsuneNavAction,
  ctx: { moveMode: boolean }
): KeyboardNavResult {
  if (ctx.moveMode) {
    if (action === 'left' || action === 'right' || action === 'up' || action === 'down') {
      return 'move-overlay';
    }
    if (action === 'cancel') return 'cancel';
    if (action === 'select') return 'ignore';
  }

  switch (action) {
    case 'left':
    case 'right':
    case 'up':
    case 'down':
      return 'move-focus';
    case 'select':
      return 'select';
    case 'cancel':
      return 'toggle-shift';
    case 'kb-l1':
      return 'caret-left';
    case 'kb-r1':
      return 'caret-right';
    case 'kb-l2':
      return 'toggle-shift';
    case 'kb-r2':
      return 'enter';
    case 'kb-square':
      return 'backspace';
    case 'kb-triangle':
      return 'space';
    case 'kb-gyro':
      return 'toggle-gyro';
    default:
      return 'ignore';
  }
}

export function applyCaretLeft(text: string, caret: number): { text: string; caret: number } {
  const next = Math.max(0, caret - 1);
  return { text, caret: next };
}

export function applyCaretRight(text: string, caret: number): { text: string; caret: number } {
  const next = Math.min(text.length, caret + 1);
  return { text, caret: next };
}

export function applyBackspaceAtCaret(text: string, caret: number): { text: string; caret: number } {
  if (caret <= 0) return { text, caret: 0 };
  return {
    text: `${text.slice(0, caret - 1)}${text.slice(caret)}`,
    caret: caret - 1
  };
}

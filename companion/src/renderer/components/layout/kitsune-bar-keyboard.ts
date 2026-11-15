/** QWERTY layout cells for the Kitsune Bar in-overlay gamepad keyboard. */

export type KeyboardCell =
  | { kind: 'char'; lower: string; upper: string }
  | { kind: 'action'; id: 'Shift' | 'Space' | 'Backspace' | 'Enter'; label: string };

export const KITSUNE_KEYBOARD_ROWS: readonly (readonly KeyboardCell[])[] = [
  [
    { kind: 'char', lower: '`', upper: '~' },
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
    { kind: 'char', lower: '-', upper: '_' },
    { kind: 'char', lower: '=', upper: '+' }
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
    { kind: 'char', lower: 'p', upper: 'P' },
    { kind: 'char', lower: '[', upper: '{' },
    { kind: 'char', lower: ']', upper: '}' }
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
    { kind: 'char', lower: ';', upper: ':' },
    { kind: 'char', lower: "'", upper: '"' }
  ],
  [
    { kind: 'char', lower: 'z', upper: 'Z' },
    { kind: 'char', lower: 'x', upper: 'X' },
    { kind: 'char', lower: 'c', upper: 'C' },
    { kind: 'char', lower: 'v', upper: 'V' },
    { kind: 'char', lower: 'b', upper: 'B' },
    { kind: 'char', lower: 'n', upper: 'N' },
    { kind: 'char', lower: 'm', upper: 'M' },
    { kind: 'char', lower: ',', upper: '<' },
    { kind: 'char', lower: '.', upper: '>' },
    { kind: 'char', lower: '/', upper: '?' }
  ],
  [
    { kind: 'action', id: 'Shift', label: 'Shift' },
    { kind: 'action', id: 'Space', label: 'Space' },
    { kind: 'action', id: 'Backspace', label: 'Bksp' },
    { kind: 'action', id: 'Enter', label: 'Enter' }
  ]
];

export function isKeyboardFlyout(id: string | null | undefined): boolean {
  return id === 'virtual-keyboard' || id === 'keyboard';
}

export function cellLabel(cell: KeyboardCell, shift: boolean): string {
  if (cell.kind === 'action') return cell.label;
  return shift ? cell.upper : cell.lower;
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

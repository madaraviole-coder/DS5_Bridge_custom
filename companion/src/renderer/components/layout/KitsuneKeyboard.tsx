import { IconGripHorizontal } from '@tabler/icons-react';
import {
  KITSUNE_KEYBOARD_ROWS,
  cellLabel,
  findCharFocus,
  type KeyboardCell
} from './kitsune-bar-keyboard';

export interface KitsuneKeyboardProps {
  variant: 'overlay' | 'preview';
  virtualText: string;
  shiftLatch: boolean;
  keyRow: number;
  keyCol: number;
  moveKeyboardMode: boolean;
  gyroMouseOn: boolean;
  gyroError?: string | null;
  onCellActivate?: (row: number, col: number) => void;
  onDone?: () => void;
  onToggleGyro?: () => void;
  onToggleMoveMode?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
}

function isWideAction(cell: KeyboardCell): boolean {
  return cell.kind === 'action' && (cell.id === 'Space' || cell.id === 'GyroMouse' || cell.id === 'Done');
}

export function KitsuneKeyboard({
  variant,
  virtualText,
  shiftLatch,
  keyRow,
  keyCol,
  moveKeyboardMode,
  gyroMouseOn,
  gyroError = null,
  onCellActivate,
  onDone,
  onToggleGyro,
  onToggleMoveMode,
  onClear,
  onCopy
}: KitsuneKeyboardProps) {
  const previewFocus = findCharFocus('k');
  const focusRow = variant === 'preview' ? previewFocus.row : keyRow;
  const focusCol = variant === 'preview' ? previewFocus.col : keyCol;
  const interactive = variant === 'overlay';

  const activate = (row: number, col: number, cell: KeyboardCell) => {
    if (!interactive) return;
    if (cell.kind === 'action' && cell.id === 'Done') {
      onDone?.();
      return;
    }
    if (cell.kind === 'action' && cell.id === 'GyroMouse') {
      onToggleGyro?.();
      return;
    }
    onCellActivate?.(row, col);
  };

  return (
    <div className={`kitsune-keyboard ${variant === 'preview' ? 'kitsune-keyboard-preview' : ''}`}>
      <div className="kitsune-keyboard-chrome">
        <button
          type="button"
          className={`kitsune-keyboard-move ${moveKeyboardMode ? 'active' : ''}`}
          onClick={() => interactive && onToggleMoveMode?.()}
          disabled={!interactive}
        >
          <IconGripHorizontal size={14} />
          <span>MOVE KEYBOARD</span>
        </button>
        <span className="overlay-badge">{shiftLatch ? 'Shift' : 'ABC'}</span>
        {gyroMouseOn ? <span className="overlay-badge gyro-on">GYRO ON</span> : null}
        {gyroError ? <span className="kitsune-keyboard-gyro-error">{gyroError}</span> : null}
      </div>
      <p className="kitsune-keyboard-hints">
        ✕ type · ○ shift · □ bksp · △ space · R2 enter · DONE close
      </p>

      {variant === 'overlay' ? (
        <div className="overlay-keyboard-quickbox">
          <input
            type="text"
            className="overlay-keyboard-input"
            placeholder="✕ type · ○ shift · □ bksp · △ space · R2 enter"
            value={virtualText}
            readOnly
          />
          <div className="overlay-keyboard-actions">
            <button type="button" className="overlay-mini-btn" onClick={() => onCopy?.()}>
              Copy
            </button>
            <button type="button" className="overlay-mini-btn" onClick={() => onClear?.()}>
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className="overlay-keyboard-grid kitsune-keyboard-grid" role="grid" aria-label="Gamepad keyboard">
        {KITSUNE_KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={`kb-row-${rowIndex}`} className="overlay-keyboard-row" role="row">
            {row.map((cell, colIndex) => {
              const focused = focusRow === rowIndex && focusCol === colIndex;
              const label = cellLabel(cell, shiftLatch);
              const wide = isWideAction(cell);
              const prompt = cell.kind === 'action' ? cell.prompt : undefined;
              return (
                <button
                  key={`kb-${rowIndex}-${colIndex}-${label}`}
                  type="button"
                  role="gridcell"
                  className={`overlay-key ${focused ? 'gamepad-focused kb-focus-blue' : ''} ${wide ? 'wide' : ''} ${
                    cell.kind === 'action' && cell.id === 'Abc' && shiftLatch ? 'active' : ''
                  } ${cell.kind === 'action' && cell.id === 'GyroMouse' && gyroMouseOn ? 'active' : ''}`}
                  onClick={() => activate(rowIndex, colIndex, cell)}
                >
                  {prompt ? <span className="overlay-key-prompt">{prompt}</span> : null}
                  <span className="overlay-key-label">{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

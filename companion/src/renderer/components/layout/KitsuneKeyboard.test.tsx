import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KitsuneKeyboard } from './KitsuneKeyboard';
import { findCharFocus } from './kitsune-bar-keyboard';

describe('KitsuneKeyboard', () => {
  it('renders MOVE / GYRO / DONE chrome and blue focus class', () => {
    const focus = findCharFocus('k');
    const html = renderToStaticMarkup(
      <KitsuneKeyboard
        variant="preview"
        virtualText=""
        shiftLatch={false}
        keyRow={focus.row}
        keyCol={focus.col}
        moveKeyboardMode={false}
        gyroMouseOn={false}
      />
    );

    expect(html).toContain('MOVE KEYBOARD');
    expect(html).toContain('GYRO MOUSE');
    expect(html).toContain('DONE');
    expect(html).toContain('kb-focus-blue');
    expect(html).toContain('gamepad-focused');
    expect(html).toContain('○ shift');
    expect(html).toContain('□ bksp');
    expect(html).toContain('△ space');
    expect(html).toContain('R2 enter');
  });
});

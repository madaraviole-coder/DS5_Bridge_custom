import { describe, expect, it } from 'vitest';
import { virtualKeyCodesForTypeKey } from './bridge-service';

describe('virtualKeyCodesForTypeKey', () => {
  it('maps letters with optional shift', () => {
    expect(virtualKeyCodesForTypeKey('a')).toEqual([0x41]);
    expect(virtualKeyCodesForTypeKey('a', true)).toEqual([0x10, 0x41]);
    expect(virtualKeyCodesForTypeKey('A')).toEqual([0x10, 0x41]);
  });

  it('maps space, enter, and backspace', () => {
    expect(virtualKeyCodesForTypeKey('Space')).toEqual([0x20]);
    expect(virtualKeyCodesForTypeKey('Enter')).toEqual([0x0d]);
    expect(virtualKeyCodesForTypeKey('Backspace')).toEqual([0x08]);
  });

  it('maps shifted digit symbols', () => {
    expect(virtualKeyCodesForTypeKey('!')).toEqual([0x10, 0x31]);
    expect(virtualKeyCodesForTypeKey('1', true)).toEqual([0x10, 0x31]);
  });

  it('returns null for empty input', () => {
    expect(virtualKeyCodesForTypeKey('')).toBeNull();
    expect(virtualKeyCodesForTypeKey('   ')).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const runAudioHelperOneShot = vi.hoisted(() => vi.fn());

vi.mock('./audio-helper-one-shot', () => ({
  runAudioHelperOneShot
}));

import { getSystemVolumePercent, setSystemVolumePercent } from './system-volume';

describe('system-volume', () => {
  beforeEach(() => {
    runAudioHelperOneShot.mockReset();
  });

  it('reads volumePercent from media session status JSON', async () => {
    runAudioHelperOneShot.mockResolvedValueOnce(JSON.stringify({ available: true, volumePercent: 37 }));
    await expect(getSystemVolumePercent()).resolves.toBe(37);
    expect(runAudioHelperOneShot).toHaveBeenCalledWith(
      ['--media-session', 'status', '--media-skip-thumbnail'],
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });

  it('sets Windows volume through media-session set-volume', async () => {
    runAudioHelperOneShot.mockResolvedValueOnce(JSON.stringify({ available: true, volumePercent: 55 }));
    await expect(setSystemVolumePercent(55.4)).resolves.toBe(55);
    expect(runAudioHelperOneShot).toHaveBeenCalledWith(
      ['--media-session', 'set-volume', '--media-volume', '55', '--media-skip-thumbnail'],
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });

  it('falls back to requested percent when helper omits volumePercent', async () => {
    runAudioHelperOneShot.mockResolvedValueOnce(JSON.stringify({ available: true }));
    await expect(setSystemVolumePercent(12)).resolves.toBe(12);
  });
});

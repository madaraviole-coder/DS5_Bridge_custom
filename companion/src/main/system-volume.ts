import { runAudioHelperOneShot } from './audio-helper-one-shot';

const SYSTEM_VOLUME_TIMEOUT_MS = 4_000;

function parseVolumePercent(stdout: string): number | null {
  try {
    const parsed = JSON.parse(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '') as {
      volumePercent?: unknown;
    };
    if (typeof parsed.volumePercent === 'number' && Number.isFinite(parsed.volumePercent)) {
      return Math.max(0, Math.min(100, Math.round(parsed.volumePercent)));
    }
  } catch {
    // ignore parse failures
  }
  return null;
}

/** Reads the Windows default render endpoint master volume (0–100). */
export async function getSystemVolumePercent(): Promise<number> {
  const stdout = await runAudioHelperOneShot(
    ['--media-session', 'status', '--media-skip-thumbnail'],
    { timeoutMs: SYSTEM_VOLUME_TIMEOUT_MS }
  );
  const volume = parseVolumePercent(stdout);
  if (volume === null) {
    throw new Error('Could not read Windows system volume.');
  }
  return volume;
}

/** Sets the Windows default render endpoint master volume (0–100). */
export async function setSystemVolumePercent(percent: number): Promise<number> {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const stdout = await runAudioHelperOneShot(
    ['--media-session', 'set-volume', '--media-volume', String(value), '--media-skip-thumbnail'],
    { timeoutMs: SYSTEM_VOLUME_TIMEOUT_MS }
  );
  return parseVolumePercent(stdout) ?? value;
}

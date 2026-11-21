/**
 * Kitsune Bar "System Volume" controls the Windows default playback device.
 * Bridge snapshot `speakerVolumePercent` is DualSense speaker gain (often 100) and
 * must never overwrite the system-volume UI — that caused the slider to snap back to 100%.
 */
export function shouldApplySpeakerVolumeToSystemVolumeUi(): boolean {
  return false;
}

export function clampVolumePercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

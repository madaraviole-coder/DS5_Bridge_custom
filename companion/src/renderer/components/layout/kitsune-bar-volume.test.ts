import { describe, expect, it } from 'vitest';
import { clampVolumePercent, shouldApplySpeakerVolumeToSystemVolumeUi } from './kitsune-bar-volume';

describe('kitsune-bar-volume', () => {
  it('never applies DualSense speakerVolumePercent onto the System Volume UI', () => {
    expect(shouldApplySpeakerVolumeToSystemVolumeUi()).toBe(false);
  });

  it('clamps volume percent to 0–100', () => {
    expect(clampVolumePercent(55.4)).toBe(55);
    expect(clampVolumePercent(-3)).toBe(0);
    expect(clampVolumePercent(140)).toBe(100);
  });
});

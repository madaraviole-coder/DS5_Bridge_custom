import { useState, type MutableRefObject } from 'react';
import type { AudioHapticsSession, BridgeSnapshot } from '../../shared/types';
import {
  BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE,
  BRIDGE_MIC_ENDPOINT_UNAVAILABLE,
  TEST_HAPTICS_LOCK_MS,
  TEST_MIC_LISTEN_MS,
  TEST_SPEAKER_LOCK_MS,
  TEST_SPEAKER_VOLUME_SETTLE_MS
} from '../constants/app-constants';
import { playMicLiveListen, snapMicVolume, snapSpeakerVolume } from '../utils/audio-testing';

export interface UseAudioTestingStateParams {
  snapshot: BridgeSnapshot | null;
  setSnapshot: (snapshot: BridgeSnapshot) => void;
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  hapticsValue: number;
  classicRumbleValue: number;
  showClassicRumbleControl: boolean;
  speakerVolumeValue: number;
  setSpeakerVolumeValue: (val: number) => void;
  speakerVolumeSupported: boolean;
  speakerVolumeEditingRef: MutableRefObject<boolean>;
  micVolumeValue: number;
  setMicVolumeValue: (val: number) => void;
  micVolumeEditingRef: MutableRefObject<boolean>;
  isPreservingPowerSavingCap: (savedValue: number, visibleValue: number) => boolean;
}

export function useAudioTestingState({
  snapshot,
  setSnapshot,
  pendingAction,
  setPendingAction,
  runAction,
  hapticsValue,
  classicRumbleValue,
  showClassicRumbleControl,
  speakerVolumeValue,
  setSpeakerVolumeValue,
  speakerVolumeSupported,
  speakerVolumeEditingRef,
  micVolumeValue,
  setMicVolumeValue,
  micVolumeEditingRef,
  isPreservingPowerSavingCap
}: UseAudioTestingStateParams) {
  const [testLocked, setTestLocked] = useState(false);
  const [speakerTestLocked, setSpeakerTestLocked] = useState(false);
  const [speakerOutputAvailable, setSpeakerOutputAvailable] = useState<boolean | null>(null);
  const [speakerTestError, setSpeakerTestError] = useState<string | null>(null);
  const [micTestLocked, setMicTestLocked] = useState(false);
  const [micTestError, setMicTestError] = useState<string | null>(null);
  const [audioHapticsSessions, setAudioHapticsSessions] = useState<AudioHapticsSession[]>([]);
  const [audioHapticsSessionsLoading, setAudioHapticsSessionsLoading] = useState(false);

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function runFeedbackTest() {
    setTestLocked(true);
    void runAction(showClassicRumbleControl ? 'test-rumble' : 'test', async () => {
      if (snapshot && showClassicRumbleControl) {
        if (
          classicRumbleValue !== snapshot.settings.classicRumbleGainPercent &&
          !isPreservingPowerSavingCap(snapshot.settings.classicRumbleGainPercent, classicRumbleValue)
        ) {
          await window.bridge.setClassicRumbleGain(classicRumbleValue);
        }
        return window.bridge.testClassicRumble();
      }
      if (
        snapshot &&
        hapticsValue !== snapshot.settings.hapticsGainPercent &&
        !isPreservingPowerSavingCap(snapshot.settings.hapticsGainPercent, hapticsValue)
      ) {
        await window.bridge.setHapticsGain(hapticsValue);
      }
      return window.bridge.testHaptics();
    }).finally(() => {
      window.setTimeout(() => setTestLocked(false), TEST_HAPTICS_LOCK_MS);
    });
  }

  function runTestSpeaker() {
    setSpeakerTestLocked(true);
    setPendingAction('speaker');
    setSpeakerTestError(null);
    void (async () => {
      try {
        let volumeChanged = false;
        if (snapshot && speakerVolumeSupported && speakerVolumeValue !== snapshot.settings.speakerVolumePercent) {
          speakerVolumeEditingRef.current = true;
          const next = await window.bridge.setSpeakerVolume(speakerVolumeValue);
          setSnapshot(next);
          setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
          speakerVolumeEditingRef.current = false;
          volumeChanged = true;
        }
        if (volumeChanged) {
          await delay(TEST_SPEAKER_VOLUME_SETTLE_MS);
        }
        const next = await window.bridge.testSpeaker();
        setSnapshot(next);
        setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
        setSpeakerOutputAvailable(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE;
        setSpeakerTestError(message);
        setSpeakerOutputAvailable(true);
        const next = await window.bridge.getStatus();
        setSnapshot(next);
        setSpeakerVolumeValue(snapSpeakerVolume(next.settings.speakerVolumePercent));
        speakerVolumeEditingRef.current = false;
      } finally {
        speakerVolumeEditingRef.current = false;
        setPendingAction(null);
        window.setTimeout(() => setSpeakerTestLocked(false), TEST_SPEAKER_LOCK_MS);
      }
    })();
  }

  function runTestMic() {
    setMicTestLocked(true);
    setPendingAction('mic-test');
    setMicTestError(null);
    void (async () => {
      try {
        if (snapshot && micVolumeValue !== snapshot.settings.micVolumePercent) {
          micVolumeEditingRef.current = true;
          const next = await window.bridge.setMicVolume(micVolumeValue);
          setSnapshot(next);
          setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
          micVolumeEditingRef.current = false;
        }
        await playMicLiveListen(TEST_MIC_LISTEN_MS);
      } catch (error) {
        const message = error instanceof Error ? error.message : BRIDGE_MIC_ENDPOINT_UNAVAILABLE;
        setMicTestError(message);
        const next = await window.bridge.getStatus();
        setSnapshot(next);
        setMicVolumeValue(snapMicVolume(next.settings.micVolumePercent));
      } finally {
        micVolumeEditingRef.current = false;
        setPendingAction(null);
        setMicTestLocked(false);
      }
    })();
  }

  return {
    testLocked,
    setTestLocked,
    speakerTestLocked,
    setSpeakerTestLocked,
    speakerOutputAvailable,
    setSpeakerOutputAvailable,
    speakerTestError,
    setSpeakerTestError,
    micTestLocked,
    setMicTestLocked,
    micTestError,
    setMicTestError,
    audioHapticsSessions,
    setAudioHapticsSessions,
    audioHapticsSessionsLoading,
    setAudioHapticsSessionsLoading,
    runFeedbackTest,
    runTestSpeaker,
    runTestMic
  };
}

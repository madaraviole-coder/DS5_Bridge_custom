import {
  type CSSProperties,
  type MutableRefObject,
  type ComponentType
} from 'react';
import {
  IconAlertHexagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconMicrophone as Mic,
  IconPlayerPlay as Play,
  IconTestPipe,
  IconVolumeOff as VolumeX,
  type TablerIcon
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../shared/types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FeatureTipsPanel } from '../components/ui/FeatureTipsPanel';
import { AudioHapticsConfigLabel } from './HapticsPage';

export interface AudioPageProps {
  active: boolean;
  outputControlLower: string;
  outputControlLabel: string;
  OutputIcon: TablerIcon | ComponentType<{ size?: number }>;
  speakerGainLevel: number;
  SPEAKER_GAIN_OPTIONS: ReadonlyArray<readonly [string, number]>;
  controllerControlsAvailable: boolean;
  speakerVolumeSupported: boolean;
  pendingAction: string | null;
  setSpeakerGainLevel: (value: number) => void;
  audioEnabled: boolean;
  toggleAudioEnabled: () => void;
  showMicrophoneControl: boolean;
  setShowMicrophoneControl: (show: boolean) => void;
  duplexMicEnabled: boolean;
  snapshot: BridgeSnapshot;
  duplexMicLabel: string;
  toggleDuplexMicEnabled: () => void;
  toggleSpeakerEnabled: () => void;
  connected: boolean;
  micVolumeValue: number;
  setMicVolumeValue: (value: number) => void;
  micVolumeCommitPending: boolean;
  micVolumeEditingRef: MutableRefObject<boolean>;
  commitMicVolume: () => void | Promise<void>;
  speakerVolumeValue: number;
  setSpeakerVolumeValue: (value: number) => void;
  speakerVolumeCommitPending: boolean;
  speakerVolumeEditingRef: MutableRefObject<boolean>;
  commitSpeakerVolume: () => void | Promise<void>;
  sliderTickClass: (value: number, max: number) => string | undefined;
  MIC_VOLUME_PRESETS: ReadonlyArray<readonly [string, number | string]>;
  setMicPreset: (preset: number) => void;
  toggleMicMute: () => void;
  SPEAKER_VOLUME_PRESETS: ReadonlyArray<readonly [string, number | string]>;
  setSpeakerPreset: (preset: number) => void;
  audioBufferLengthControlDisabled: boolean;
  audioBufferPercent: (value: number) => number;
  audioBufferLengthValue: number;
  setAudioBufferLengthValue: (value: number) => void;
  audioBufferDelayLabel: (value: number) => string;
  audioBufferZoneTone: (value: number) => 'stutter' | 'risky' | 'safe';
  audioBufferZoneLabel: (value: number) => string;
  audioBufferZoneTooltip: (value: number) => string;
  clampAudioBufferLength: (value: number) => number;
  audioBufferLengthEditingRef: MutableRefObject<boolean>;
  commitAudioBufferLength: () => void | Promise<void>;
  activeAudioTestUnavailable: boolean;
  runTestMic: () => void;
  runTestSpeaker: () => void;
  micTestLocked: boolean;
  micTestError: string | null;
  speakerTestLocked: boolean;
  setSpeakerTestLocked: (locked: boolean) => void;
  gameStreamActive: boolean;
  speakerOutputMissing: boolean;
  activeAudioTestLocked: boolean;
  stopMicLiveListen: () => void;
  activeAudioTestStatusTone: string;
  activeAudioTestStatusLabel: string;
  audioPathTone: string;
  audioPathTooltip: string;
  audioPathLabel: string;
  MIC_VOLUME_STEP: number;
  SPEAKER_VOLUME_STEP: number;
  PERCENT_SLIDER_TICKS: readonly number[];
  AUDIO_BUFFER_LENGTH_MIN: number;
  AUDIO_BUFFER_LENGTH_MAX: number;
  snapMicVolume: (value: number) => number;
  snapSpeakerVolume: (value: number) => number;
}

export function AudioPage({
  active,
  outputControlLower,
  outputControlLabel,
  OutputIcon,
  speakerGainLevel,
  SPEAKER_GAIN_OPTIONS,
  controllerControlsAvailable,
  speakerVolumeSupported,
  pendingAction,
  setSpeakerGainLevel,
  audioEnabled,
  toggleAudioEnabled,
  showMicrophoneControl,
  setShowMicrophoneControl,
  duplexMicEnabled,
  snapshot,
  duplexMicLabel,
  toggleDuplexMicEnabled,
  toggleSpeakerEnabled,
  connected,
  micVolumeValue,
  setMicVolumeValue,
  micVolumeCommitPending,
  micVolumeEditingRef,
  commitMicVolume,
  speakerVolumeValue,
  setSpeakerVolumeValue,
  speakerVolumeCommitPending,
  speakerVolumeEditingRef,
  commitSpeakerVolume,
  sliderTickClass,
  MIC_VOLUME_PRESETS,
  setMicPreset,
  toggleMicMute,
  SPEAKER_VOLUME_PRESETS,
  setSpeakerPreset,
  audioBufferLengthControlDisabled,
  audioBufferPercent,
  audioBufferLengthValue,
  setAudioBufferLengthValue,
  audioBufferDelayLabel,
  audioBufferZoneTone,
  audioBufferZoneLabel,
  audioBufferZoneTooltip,
  clampAudioBufferLength,
  audioBufferLengthEditingRef,
  commitAudioBufferLength,
  activeAudioTestUnavailable,
  runTestMic,
  runTestSpeaker,
  micTestLocked,
  micTestError,
  speakerTestLocked,
  setSpeakerTestLocked,
  gameStreamActive,
  speakerOutputMissing,
  activeAudioTestLocked,
  stopMicLiveListen,
  activeAudioTestStatusTone,
  activeAudioTestStatusLabel,
  audioPathTone,
  audioPathTooltip,
  audioPathLabel,
  MIC_VOLUME_STEP,
  SPEAKER_VOLUME_STEP,
  PERCENT_SLIDER_TICKS,
  AUDIO_BUFFER_LENGTH_MIN,
  AUDIO_BUFFER_LENGTH_MAX,
  snapMicVolume,
  snapSpeakerVolume
}: AudioPageProps) {
  return (
    <div
      className={`control-page audio-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-audio"
      aria-labelledby="control-tab-audio"
      aria-hidden={!active}
    >
      <div className="feature-heading">
        <div>
          <h2>Audio</h2>
          <p>{`Adjust controller ${outputControlLower} and microphone levels.`}</p>
        </div>
        <div className="audio-heading-actions">
          <div className="chords-field chords-inline-field audio-speaker-gain-field">
            <span>Speaker Gain</span>
            <CustomSelect
              value={speakerGainLevel}
              options={SPEAKER_GAIN_OPTIONS}
              disabled={!controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null}
              ariaLabel="Speaker gain"
              className="audio-speaker-gain-select"
              closeOnSelect={true}
              onChange={setSpeakerGainLevel}
              renderValue={(_label, value) => (
                <span>{value}</span>
              )}
              renderOption={(label) => (
                <span className="speaker-gain-option">
                  <strong>{label}</strong>
                </span>
              )}
            />
          </div>
          <div className="audio-heading-controls">
            <div className="inline-switch">
              <span>Enabled</span>
              <button
                type="button"
                role="switch"
                aria-checked={audioEnabled}
                aria-label="Enable audio"
                className={`switch ${audioEnabled ? 'on' : ''}`}
                disabled={!controllerControlsAvailable || pendingAction !== null}
                onClick={toggleAudioEnabled}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="feature-card-grid">
        <section className="feature-card preset-card">
          <div className="feature-card-title">
            <button
              type="button"
              className={`feature-icon audio-enable-button icon-medium ${
                showMicrophoneControl
                  ? duplexMicEnabled
                    ? 'active'
                    : ''
                  : snapshot.settings.speakerEnabled
                    ? 'active'
                    : ''
              }`}
              aria-pressed={showMicrophoneControl ? duplexMicEnabled : snapshot.settings.speakerEnabled}
              aria-label={showMicrophoneControl ? duplexMicLabel : `Enable controller ${outputControlLower}`}
              title={showMicrophoneControl ? duplexMicLabel : `Enable controller ${outputControlLower}`}
              disabled={
                showMicrophoneControl
                  ? !controllerControlsAvailable || pendingAction !== null
                  : !controllerControlsAvailable || !speakerVolumeSupported || pendingAction !== null
              }
              onClick={showMicrophoneControl ? toggleDuplexMicEnabled : toggleSpeakerEnabled}
            >
              {showMicrophoneControl ? <Mic size={20} /> : <OutputIcon size={20} />}
            </button>
            <div className="title-copy">
              <h3>{showMicrophoneControl ? 'Microphone' : outputControlLabel}</h3>
              <p>
                {showMicrophoneControl
                  ? 'Microphone level'
                  : `${outputControlLabel} level`}
              </p>
            </div>
            <div className="dual-selector audio-mode-selector" role="tablist" aria-label="Audio control mode">
              <button
                type="button"
                role="tab"
                aria-selected={!showMicrophoneControl}
                className={!showMicrophoneControl ? 'active' : ''}
                onClick={() => setShowMicrophoneControl(false)}
              >
                {outputControlLabel}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showMicrophoneControl}
                className={showMicrophoneControl ? 'active' : ''}
                onClick={() => setShowMicrophoneControl(true)}
              >
                Mic
              </button>
            </div>
          </div>
          <div className="framed-slider">
            <label className="slider-row">
              <span>0%</span>
              <div className="range-control">
                {showMicrophoneControl ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step={MIC_VOLUME_STEP}
                    value={micVolumeValue}
                    disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                    style={{ '--range-fill': `${micVolumeValue}%` } as CSSProperties}
                    aria-label="Microphone level"
                    onPointerDown={() => {
                      micVolumeEditingRef.current = true;
                    }}
                    onChange={(event) => setMicVolumeValue(snapMicVolume(Number(event.currentTarget.value)))}
                    onPointerUp={() => void commitMicVolume()}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        micVolumeEditingRef.current = true;
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        void commitMicVolume();
                      }
                    }}
                    onBlur={() => void commitMicVolume()}
                  />
                ) : (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step={SPEAKER_VOLUME_STEP}
                    value={speakerVolumeValue}
                    disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled}
                    style={{ '--range-fill': `${speakerVolumeValue}%` } as CSSProperties}
                    onPointerDown={() => {
                      speakerVolumeEditingRef.current = true;
                    }}
                    onChange={(event) => setSpeakerVolumeValue(snapSpeakerVolume(Number(event.currentTarget.value)))}
                    onPointerUp={() => void commitSpeakerVolume()}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        speakerVolumeEditingRef.current = true;
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        void commitSpeakerVolume();
                      }
                    }}
                    onBlur={() => void commitSpeakerVolume()}
                  />
                )}
                <div className="range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((value) => (
                    <span key={value} className={sliderTickClass(value, 100)} />
                  ))}
                </div>
              </div>
              <strong>{showMicrophoneControl ? micVolumeValue : speakerVolumeValue}%</strong>
            </label>
          </div>
          {showMicrophoneControl ? (
            <>
              <div className="segmented-row">
                {MIC_VOLUME_PRESETS.map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    className={micVolumeValue === value ? 'active' : ''}
                    disabled={!connected || !duplexMicEnabled || micVolumeCommitPending}
                    onClick={() => setMicPreset(Number(value))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mic-option-grid">
                <button
                  type="button"
                  className={snapshot.settings.micMuted ? 'active danger' : ''}
                  aria-pressed={snapshot.settings.micMuted}
                  disabled={!connected || !duplexMicEnabled || pendingAction !== null}
                  onClick={toggleMicMute}
                >
                  <VolumeX size={15} />
                  Mute
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="segmented-row">
                {SPEAKER_VOLUME_PRESETS.map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    className={speakerVolumeValue === value ? 'active' : ''}
                    disabled={!connected || !speakerVolumeSupported || !snapshot.settings.speakerEnabled || speakerVolumeCommitPending}
                    onClick={() => setSpeakerPreset(Number(value))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="audio-secondary-controls">
                <div
                  className={`audio-buffer-control framed-slider ${audioBufferLengthControlDisabled ? 'disabled' : ''}`}
                  style={{ '--range-fill': `${audioBufferPercent(audioBufferLengthValue)}%` } as CSSProperties}
                >
                  <div className="audio-buffer-header">
                    <AudioHapticsConfigLabel
                      id="audio-buffer-length-tooltip"
                      label="Audio Buffer Length"
                      tooltip="Sets the DualSense audio buffer value. Lower values reduce haptic delay but increase stutter risk; higher values improve speaker stability at the cost of latency."
                      className="audio-buffer-title"
                    />
                    <div className="audio-buffer-readout">
                      <strong>{audioBufferLengthValue}</strong>
                      <span>{audioBufferDelayLabel(audioBufferLengthValue)}</span>
                    </div>
                    <div
                      className={`audio-buffer-status-icon ${audioBufferZoneTone(audioBufferLengthValue)}`}
                      aria-label={audioBufferZoneLabel(audioBufferLengthValue)}
                      aria-describedby="audio-buffer-zone-tooltip"
                      tabIndex={0}
                    >
                      {audioBufferZoneTone(audioBufferLengthValue) === 'safe' && (
                        <IconCircleCheck size={18} stroke={2.35} aria-hidden="true" />
                      )}
                      {audioBufferZoneTone(audioBufferLengthValue) === 'risky' && (
                        <IconAlertTriangle size={18} stroke={2.35} aria-hidden="true" />
                      )}
                      {audioBufferZoneTone(audioBufferLengthValue) === 'stutter' && (
                        <IconAlertHexagon size={18} stroke={2.35} aria-hidden="true" />
                      )}
                      <span
                        id="audio-buffer-zone-tooltip"
                        className="settings-shortcut-tooltip shortcut-glyph-tooltip audio-buffer-zone-tooltip"
                        role="tooltip"
                      >
                        {audioBufferZoneTooltip(audioBufferLengthValue)}
                      </span>
                    </div>
                  </div>
                  <label className="audio-slider-row audio-buffer-slider-row">
                    <div className="range-control audio-buffer-range-control">
                      <input
                        type="range"
                        min={AUDIO_BUFFER_LENGTH_MIN}
                        max={AUDIO_BUFFER_LENGTH_MAX}
                        step="1"
                        value={audioBufferLengthValue}
                        aria-label="Audio buffer length"
                        aria-valuetext={`${audioBufferLengthValue}, ${audioBufferDelayLabel(audioBufferLengthValue)}, ${audioBufferZoneLabel(audioBufferLengthValue)}`}
                        disabled={audioBufferLengthControlDisabled}
                        onPointerDown={() => {
                          audioBufferLengthEditingRef.current = true;
                        }}
                        onPointerCancel={() => void commitAudioBufferLength()}
                        onChange={(event) => {
                          audioBufferLengthEditingRef.current = true;
                          setAudioBufferLengthValue(clampAudioBufferLength(Number(event.currentTarget.value)));
                        }}
                        onPointerUp={() => void commitAudioBufferLength()}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                            audioBufferLengthEditingRef.current = true;
                          }
                        }}
                        onKeyUp={(event) => {
                          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                            void commitAudioBufferLength();
                          }
                        }}
                        onBlur={() => void commitAudioBufferLength()}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </section>
        <section className="feature-card test-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconTestPipe size={20} /></span>
            <div className="title-copy">
              <h3>Testing</h3>
              <p>{showMicrophoneControl ? 'Listen to the controller microphone for five seconds.' : `Play a short sample through the controller ${outputControlLower}.`}</p>
            </div>
          </div>
          <button
            className="primary-action"
            type="button"
            disabled={activeAudioTestUnavailable}
            onClick={showMicrophoneControl ? runTestMic : runTestSpeaker}
          >
            {showMicrophoneControl ? <Mic size={15} /> : <Play size={15} />}
            {showMicrophoneControl
              ? connected && micTestLocked
                ? 'Live Listening'
                : connected && micTestError
                  ? 'Retry Mic'
                  : 'Test Mic'
              : connected && speakerTestLocked
                ? 'Playing Tone'
                : connected && gameStreamActive
                  ? 'Game Active'
                : connected && speakerOutputMissing
                    ? `Retry ${outputControlLabel}`
                  : `Test ${outputControlLabel}`}
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={!activeAudioTestLocked}
            onClick={showMicrophoneControl ? stopMicLiveListen : () => setSpeakerTestLocked(false)}
          >
            <span className="stop-glyph" aria-hidden="true" />
            Stop Test
          </button>
          <div className="feature-status test-status audio-test-status">
            <span className={`status-badge ${activeAudioTestStatusTone}`} title={activeAudioTestStatusLabel}>
              <span className={`dot ${activeAudioTestStatusTone}`} />
              <strong>{activeAudioTestStatusLabel}</strong>
            </span>
            <span className={`status-badge ${audioPathTone}`} title={audioPathTooltip}>
              <span className={`dot ${audioPathTone}`} />
              <strong>{audioPathLabel}</strong>
            </span>
          </div>
        </section>
      </div>
      <FeatureTipsPanel tab="audio" />
    </div>
  );
}

import {
  IconCrosshair,
  IconCompass
} from '@tabler/icons-react';
import type { BridgeSnapshot, GyroSettings, GyroActivationMode, FlickStickTurnMode } from '../../shared/types';
import { CustomSelect } from '../components/ui/CustomSelect';

export interface GyroPageProps {
  active: boolean;
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  pendingAction: string | null;
  runAction: (label: string, action: () => Promise<BridgeSnapshot>) => Promise<void>;
}

export function GyroPage({
  active,
  snapshot,
  connected,
  pendingAction,
  runAction
}: GyroPageProps) {
  const defaultGyro: GyroSettings = {
    enabled: false,
    sensitivityYaw: 1.0,
    sensitivityPitch: 1.0,
    deadzone: 2,
    smoothFilter: 4,
    activationMode: 'always-on',
    activationButton: 'l2',
    triggerThresholdPercent: 10,
    flickStickEnabled: false,
    flickStickThresholdPercent: 85,
    flickStickSnapDegrees: 45,
    flickStickTurnMode: 'smooth',
    flickStickSmoothDurationMs: 100,
    invertPitch: false,
    invertYaw: false
  };

  const gyro: GyroSettings = {
    ...defaultGyro,
    ...(snapshot?.settings.gyroSettings ?? {})
  };

  const updateGyro = (updates: Partial<GyroSettings>) => {
    const nextSettings: GyroSettings = {
      ...gyro,
      ...updates
    };
    void runAction('gyro-settings', () => window.bridge.setGyroSettings(nextSettings));
  };

  const activationOptions: Array<[string, GyroActivationMode]> = [
    ['Always On', 'always-on'],
    ['Hold Button', 'button-hold'],
    ['Toggle Button', 'button-toggle'],
    ['Touchpad Touch', 'touchpad-touch'],
    ['Trigger Press', 'trigger-press']
  ];

  const buttonOptions: Array<[string, string]> = [
    ['L2 Trigger', 'l2'],
    ['R2 Trigger', 'r2'],
    ['L1 Bumper', 'l1'],
    ['R1 Bumper', 'r1'],
    ['L3 (Left Stick Click)', 'l3'],
    ['R3 (Right Stick Click)', 'r3'],
    ['Touchpad Click', 'touchpad']
  ];

  const flickStickTurnModeOptions: Array<[string, FlickStickTurnMode]> = [
    ['Smooth Turn', 'smooth'],
    ['Instant Turn', 'instant']
  ];

  return (
    <div
      className={`control-page gyro-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-gyro"
      aria-labelledby="control-tab-gyro"
      aria-hidden={!active}
    >
      <div className="feature-heading">
        <div>
          <h2>Gyro Aim & Flick Stick</h2>
          <p>Precision motion aiming and instant angular camera snaps tailored for DS5 Bridge.</p>
        </div>
      </div>

      <div className="feature-card-grid">
        {/* Card 1: Gyro Aiming */}
        <section className="feature-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconCrosshair size={20} /></span>
            <div className="title-copy">
              <h3>Motion Aiming (Gyro)</h3>
              <p>Map DualSense 6-axis gyroscope to high-resolution cursor and mouse aim.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gyro.enabled}
              className={`switch ${gyro.enabled ? 'on' : ''}`}
              disabled={!connected || pendingAction !== null}
              onClick={() => updateGyro({ enabled: !gyro.enabled })}
            >
              <span />
            </button>
          </div>

          <div className="gyro-controls-body">
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Activation Mode</strong>
                <span>When motion sensors engage aim input</span>
              </div>
              <CustomSelect
                value={gyro.activationMode}
                disabled={!connected || !gyro.enabled}
                options={activationOptions}
                ariaLabel="Gyro activation mode"
                onChange={(mode) => updateGyro({ activationMode: mode as GyroActivationMode })}
              />
            </div>

            {gyro.activationMode !== 'always-on' && gyro.activationMode !== 'touchpad-touch' && (
              <div className="settings-menu-row">
                <div className="settings-menu-copy">
                  <strong>Activation Button</strong>
                  <span>Controller button to trigger gyro</span>
                </div>
                <CustomSelect
                  value={gyro.activationButton || 'l2'}
                  disabled={!connected || !gyro.enabled}
                  options={buttonOptions}
                  ariaLabel="Gyro activation button"
                  onChange={(btn) => updateGyro({ activationButton: btn })}
                />
              </div>
            )}

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Yaw (Horizontal) Sensitivity</span>
                <strong>{(gyro.sensitivityYaw ?? 1.0).toFixed(2)}x</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.05"
                value={gyro.sensitivityYaw ?? 1.0}
                disabled={!connected || !gyro.enabled}
                onChange={(e) => updateGyro({ sensitivityYaw: Number(e.target.value) })}
              />
            </div>

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Pitch (Vertical) Sensitivity</span>
                <strong>{(gyro.sensitivityPitch ?? 1.0).toFixed(2)}x</strong>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.05"
                value={gyro.sensitivityPitch ?? 1.0}
                disabled={!connected || !gyro.enabled}
                onChange={(e) => updateGyro({ sensitivityPitch: Number(e.target.value) })}
              />
            </div>

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Smoothing Filter</span>
                <strong>{gyro.smoothFilter ?? 4}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={gyro.smoothFilter ?? 4}
                disabled={!connected || !gyro.enabled}
                onChange={(e) => updateGyro({ smoothFilter: Number(e.target.value) })}
              />
            </div>

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Gyro Center Deadzone</span>
                <strong>{(gyro.deadzone ?? 2)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={gyro.deadzone ?? 2}
                disabled={!connected || !gyro.enabled}
                onChange={(e) => updateGyro({ deadzone: Number(e.target.value) })}
              />
            </div>

            <div className="checkbox-row" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={gyro.invertPitch}
                  disabled={!connected || !gyro.enabled}
                  onChange={(e) => updateGyro({ invertPitch: e.target.checked })}
                />
                Invert Pitch (Y)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={gyro.invertYaw}
                  disabled={!connected || !gyro.enabled}
                  onChange={(e) => updateGyro({ invertYaw: e.target.checked })}
                />
                Invert Yaw (X)
              </label>
            </div>
          </div>
        </section>

        {/* Card 2: Flick Stick */}
        <section className="feature-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconCompass size={20} /></span>
            <div className="title-copy">
              <h3>Flick Stick Snap</h3>
              <p>Instantly snap camera view in the exact angle of stick flick.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gyro.flickStickEnabled}
              className={`switch ${gyro.flickStickEnabled ? 'on' : ''}`}
              disabled={!connected || pendingAction !== null}
              onClick={() => updateGyro({ flickStickEnabled: !gyro.flickStickEnabled })}
            >
              <span />
            </button>
          </div>

          <div className="gyro-controls-body">
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Flick stick pairs seamlessly with gyro aiming: the right stick handles instant direction turns, while gyro handles fine micro-aiming.
            </p>

            <div className="settings-menu-row" style={{ marginTop: '14px' }}>
              <div className="settings-menu-copy">
                <strong>Turn Mode</strong>
                <span>Instant snap or smooth angular rotation</span>
              </div>
              <CustomSelect
                value={gyro.flickStickTurnMode || 'smooth'}
                disabled={!connected || !gyro.flickStickEnabled}
                options={flickStickTurnModeOptions}
                ariaLabel="Flick stick turn mode"
                onChange={(mode) => updateGyro({ flickStickTurnMode: mode as FlickStickTurnMode })}
              />
            </div>

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Flick Snap Threshold</span>
                <strong>{gyro.flickStickSnapDegrees}°</strong>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={gyro.flickStickSnapDegrees}
                disabled={!connected || !gyro.flickStickEnabled}
                onChange={(e) => updateGyro({ flickStickSnapDegrees: Number(e.target.value) })}
              />
            </div>

            <div className="range-control-row">
              <div className="range-control-header">
                <span>Stick Engage Threshold</span>
                <strong>{gyro.flickStickThresholdPercent}%</strong>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={gyro.flickStickThresholdPercent}
                disabled={!connected || !gyro.flickStickEnabled}
                onChange={(e) => updateGyro({ flickStickThresholdPercent: Number(e.target.value) })}
              />
            </div>

            {gyro.flickStickTurnMode === 'smooth' && (
              <div className="range-control-row">
                <div className="range-control-header">
                  <span>Smooth Turn Duration</span>
                  <strong>{gyro.flickStickSmoothDurationMs}ms</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="10"
                  value={gyro.flickStickSmoothDurationMs}
                  disabled={!connected || !gyro.flickStickEnabled}
                  onChange={(e) => updateGyro({ flickStickSmoothDurationMs: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

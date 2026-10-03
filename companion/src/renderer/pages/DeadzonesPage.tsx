import { type CSSProperties, type MutableRefObject } from 'react';
import { IconViewfinder, IconChartLine } from '@tabler/icons-react';
import type { BridgeSnapshot, StickCurveConfig, StickCurveType } from '../../shared/types';
import { FeatureTipsPanel } from '../components/ui/FeatureTipsPanel';
import { CustomSelect } from '../components/ui/CustomSelect';
import { radialDeadzonePreview, stickPositionPercent } from '../radial-deadzone-preview';

export interface DeadzonesPageProps {
  active: boolean;
  snapshot: BridgeSnapshot | null;
  leftStickRadialDeadzoneValue: number;
  rightStickRadialDeadzoneValue: number;
  setLeftStickRadialDeadzoneValue: (value: number) => void;
  setRightStickRadialDeadzoneValue: (value: number) => void;
  controllerControlsAvailable: boolean;
  pendingAction: string | null;
  radialDeadzoneCommitPending: boolean;
  radialDeadzoneEditingRef: MutableRefObject<Record<'left' | 'right', boolean>>;
  commitRadialDeadzone: (side: 'left' | 'right', value: number) => void | Promise<void>;
  sliderTickClass: (value: number, max: number) => string | undefined;
  RADIAL_DEADZONE_MAX_PERCENT: number;
  RADIAL_DEADZONE_TICKS: readonly number[];
  RADIAL_DEADZONE_PRESETS: readonly number[];
  normalizeRadialDeadzonePercent: (value: number) => number;
}

export function DeadzonesPage({
  active,
  snapshot,
  leftStickRadialDeadzoneValue,
  rightStickRadialDeadzoneValue,
  setLeftStickRadialDeadzoneValue,
  setRightStickRadialDeadzoneValue,
  controllerControlsAvailable,
  pendingAction,
  radialDeadzoneCommitPending,
  radialDeadzoneEditingRef,
  commitRadialDeadzone,
  sliderTickClass,
  RADIAL_DEADZONE_MAX_PERCENT,
  RADIAL_DEADZONE_TICKS,
  RADIAL_DEADZONE_PRESETS,
  normalizeRadialDeadzonePercent
}: DeadzonesPageProps) {
  return (
    <div
      className={`control-page deadzones-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-deadzones"
      aria-labelledby="control-tab-deadzones"
      aria-hidden={!active}
    >
      <div className="feature-heading">
        <div>
          <h2>Stick Deadzones</h2>
          <p>Remove center drift with independent radial deadzones for each stick.</p>
        </div>
      </div>

      <div className="feature-card-grid deadzones-grid">
        {(['left', 'right'] as const).map((side) => {
          const value = side === 'left'
            ? leftStickRadialDeadzoneValue
            : rightStickRadialDeadzoneValue;
          const setValue = side === 'left'
            ? setLeftStickRadialDeadzoneValue
            : setRightStickRadialDeadzoneValue;
          const label = side === 'left' ? 'Left Stick' : 'Right Stick';
          const rawAxes = snapshot?.stickInputPreview?.raw;
          const livePreview = rawAxes
            ? radialDeadzonePreview(
                side === 'left' ? rawAxes.lx : rawAxes.ly,
                side === 'left' ? rawAxes.ly : rawAxes.ry,
                value
              )
            : null;
          const disabled = !controllerControlsAvailable
            || pendingAction !== null
            || radialDeadzoneCommitPending;
          return (
            <section className="feature-card deadzone-card" key={side}>
              <div className="feature-card-title">
                <span className="feature-icon"><IconViewfinder size={20} /></span>
                <div className="title-copy">
                  <h3>{label}</h3>
                  <p>Circular center filtering with full-range rescaling.</p>
                </div>
              </div>

              <div className="deadzone-stick-preview">
                <div
                  className="deadzone-stick-field"
                  role="img"
                  aria-label={`${label} physical and deadzone-adjusted output position`}
                  style={{ '--deadzone-diameter': `${Math.max(3, value)}%` } as CSSProperties}
                >
                  <span className="deadzone-axis horizontal" />
                  <span className="deadzone-axis vertical" />
                  <span className="deadzone-radius" />
                  {livePreview ? (
                    <>
                      <span
                        className="deadzone-position-dot output"
                        style={stickPositionPercent(livePreview.output)}
                      />
                      <span
                        className="deadzone-position-dot physical"
                        style={stickPositionPercent(livePreview.physical)}
                      />
                    </>
                  ) : <span className="deadzone-center" />}
                </div>
                <div className="deadzone-preview-copy">
                  <strong>{value}%</strong>
                  <span>{value === 0 ? 'Native input' : 'Center radius'}</span>
                  <div className="deadzone-position-legend" aria-label="Stick position legend">
                    <span><i className="physical" />Physical</span>
                    <span><i className="output" />Output</span>
                  </div>
                </div>
              </div>

              <label className={`slider-row deadzone-slider-row ${disabled ? 'disabled' : ''}`}>
                <span>Radius</span>
                <div className="range-control">
                  <input
                    aria-label={`${label} radial deadzone`}
                    type="range"
                    min={0}
                    max={RADIAL_DEADZONE_MAX_PERCENT}
                    step={1}
                    value={value}
                    disabled={disabled}
                    style={{ '--range-fill': `${value * 2}%` } as CSSProperties}
                    onChange={(event) => {
                      radialDeadzoneEditingRef.current[side] = true;
                      setValue(normalizeRadialDeadzonePercent(Number(event.target.value)));
                    }}
                    onPointerUp={(event) => void commitRadialDeadzone(side, Number(event.currentTarget.value))}
                    onKeyUp={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                        void commitRadialDeadzone(side, Number(event.currentTarget.value));
                      }
                    }}
                    onBlur={(event) => void commitRadialDeadzone(side, Number(event.currentTarget.value))}
                  />
                  <div className="range-ticks" aria-hidden="true">
                    {RADIAL_DEADZONE_TICKS.map((tick) => (
                      <span key={tick} className={sliderTickClass(tick, RADIAL_DEADZONE_MAX_PERCENT)} />
                    ))}
                  </div>
                </div>
                <strong>{value}%</strong>
              </label>

              <div className="segmented-row deadzone-presets" aria-label={`${label} deadzone presets`}>
                {RADIAL_DEADZONE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={value === preset ? 'active' : ''}
                    disabled={disabled}
                    onClick={() => {
                      setValue(preset);
                      void commitRadialDeadzone(side, preset);
                    }}
                  >
                    {preset === 0 ? 'Off' : `${preset}%`}
                  </button>
                ))}
              </div>

              {/* Extended Stick Response Curve & Range (DS5 Bridge) */}
              <div className="stick-curve-settings" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <IconChartLine size={18} style={{ color: 'var(--accent)' }} />
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Response Curve & Range</h4>
                </div>

                {(() => {
                  const curveConfig: StickCurveConfig = snapshot?.settings.stickCurveSettings?.[side] ?? {
                    curveType: 'linear',
                    innerDeadzonePercent: value,
                    outerDeadzonePercent: 0,
                    antiDeadzonePercent: 0,
                    exponent: 1.0,
                    maxRangePercent: 100
                  };

                  const handleUpdateCurve = (updates: Partial<StickCurveConfig>) => {
                    const currentSettings = snapshot?.settings.stickCurveSettings ?? {
                      left: { curveType: 'linear', innerDeadzonePercent: 0, outerDeadzonePercent: 0, antiDeadzonePercent: 0, exponent: 1.0, maxRangePercent: 100 },
                      right: { curveType: 'linear', innerDeadzonePercent: 0, outerDeadzonePercent: 0, antiDeadzonePercent: 0, exponent: 1.0, maxRangePercent: 100 }
                    };
                    const next = {
                      ...currentSettings,
                      [side]: { ...curveConfig, ...updates }
                    };
                    void window.bridge.setStickCurveSettings(next);
                  };

                  const curveOptions: Array<[string, StickCurveType]> = [
                    ['Linear (Standard 1:1)', 'linear'],
                    ['Exponential (Fine center)', 'exponential'],
                    ['Instant (Fast trigger)', 'instant'],
                    ['Wide (Smooth outer)', 'wide'],
                    ['Dynamic (S-Curve)', 'dynamic']
                  ];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="control-row">
                        <label style={{ fontSize: 12 }}>Curve Profile</label>
                        <div style={{ minWidth: 160 }}>
                          <CustomSelect
                            value={curveConfig.curveType}
                            options={curveOptions}
                            ariaLabel="Stick Response Curve Profile"
                            onChange={(val) => handleUpdateCurve({ curveType: val as StickCurveType })}
                          />
                        </div>
                      </div>

                      <div className="slider-container">
                        <label style={{ fontSize: 12 }}>
                          <span>Anti-Deadzone ({curveConfig.antiDeadzonePercent}%)</span>
                          <input
                            type="range"
                            min={0}
                            max={40}
                            step={1}
                            value={curveConfig.antiDeadzonePercent}
                            disabled={disabled}
                            onChange={(e) => handleUpdateCurve({ antiDeadzonePercent: parseInt(e.target.value, 10) })}
                          />
                        </label>
                      </div>

                      <div className="slider-container">
                        <label style={{ fontSize: 12 }}>
                          <span>Max Stick Range ({curveConfig.maxRangePercent}%)</span>
                          <input
                            type="range"
                            min={50}
                            max={120}
                            step={1}
                            value={curveConfig.maxRangePercent}
                            disabled={disabled}
                            onChange={(e) => handleUpdateCurve({ maxRangePercent: parseInt(e.target.value, 10) })}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          );
        })}
      </div>

      <FeatureTipsPanel tab="deadzones" />
    </div>
  );
}

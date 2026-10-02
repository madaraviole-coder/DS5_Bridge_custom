import {
  type CSSProperties,
  type MutableRefObject,
  type ReactNode
} from 'react';
import {
  IconDeviceGamepad2,
  IconPlayerPlay as Play,
  IconRefresh as RefreshCcw,
  IconTestPipe
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../shared/types';
import type { TriggerTestMode, TriggerTestTarget } from '../../shared/protocol';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FeatureTipsPanel } from '../components/ui/FeatureTipsPanel';
import type { SettingsFocusTarget } from '../components/ui/FeatureTipsPanel';

export type TriggerLabSide = 'l2' | 'r2';

export interface TriggersPageProps {
  active: boolean;
  connected: boolean;
  triggerLabOpen: boolean;
  triggerLabEnabled: boolean;
  triggerLabAnyActive: boolean;
  triggerPageEnabled: boolean;
  controllerControlsAvailable: boolean;
  adaptiveTriggersSupported: boolean;
  pendingAction: string | null;
  toggleTriggerLabEnabled: () => void;
  toggleAdaptiveTriggersEnabled: () => void;
  renderTriggerLabCard: (side: TriggerLabSide) => ReactNode;
  snapshot: BridgeSnapshot;
  controllerPowerSavingActive: boolean;
  percentSliderMax: number;
  triggerEffectIntensityValue: number;
  setTriggerEffectIntensityValue: (val: number) => void;
  triggerEffectEditingRef: MutableRefObject<boolean>;
  commitTriggerEffectIntensity: () => void | Promise<void>;
  sliderTickClass: (value: number, max: number) => string | undefined;
  TRIGGER_EFFECT_PRESETS: ReadonlyArray<readonly [string, number | string]>;
  setTriggerIntensityPreset: (value: number) => void;
  adaptiveTriggerOutputActive: boolean;
  TRIGGER_TEST_MODE_OPTIONS: ReadonlyArray<readonly [string, TriggerTestMode]>;
  setTriggerTestMode: (mode: TriggerTestMode) => void;
  TRIGGER_TARGET_OPTIONS: ReadonlyArray<readonly [string, TriggerTestTarget]>;
  triggerTarget: TriggerTestTarget;
  setTriggerTarget: (target: TriggerTestTarget) => void;
  testTriggersUnavailable: boolean;
  runTestAdaptiveTriggers: () => void;
  triggerTestLocked: boolean;
  resetAdaptiveTriggers: () => void;
  triggerStatusTone: string;
  triggerStatusLabel: string;
  focusBridgeSettings: (target: SettingsFocusTarget) => void;
  TRIGGER_EFFECT_STEP: number;
  PERCENT_SLIDER_TICKS: readonly number[];
  snapTriggerEffectIntensity: (value: number) => number;
}

export function TriggersPage({
  active,
  connected,
  triggerLabOpen,
  triggerLabEnabled,
  triggerLabAnyActive,
  triggerPageEnabled,
  controllerControlsAvailable,
  adaptiveTriggersSupported,
  pendingAction,
  toggleTriggerLabEnabled,
  toggleAdaptiveTriggersEnabled,
  renderTriggerLabCard,
  snapshot,
  controllerPowerSavingActive,
  percentSliderMax,
  triggerEffectIntensityValue,
  setTriggerEffectIntensityValue,
  triggerEffectEditingRef,
  commitTriggerEffectIntensity,
  sliderTickClass,
  TRIGGER_EFFECT_PRESETS,
  setTriggerIntensityPreset,
  adaptiveTriggerOutputActive,
  TRIGGER_TEST_MODE_OPTIONS,
  setTriggerTestMode,
  TRIGGER_TARGET_OPTIONS,
  triggerTarget,
  setTriggerTarget,
  testTriggersUnavailable,
  runTestAdaptiveTriggers,
  triggerTestLocked,
  resetAdaptiveTriggers,
  triggerStatusTone,
  triggerStatusLabel,
  focusBridgeSettings,
  TRIGGER_EFFECT_STEP,
  PERCENT_SLIDER_TICKS,
  snapTriggerEffectIntensity
}: TriggersPageProps) {
  return (
    <div
      className={`control-page triggers-page ${active || triggerLabOpen ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-triggers"
      aria-labelledby={triggerLabOpen ? 'control-tab-trigger-lab' : 'control-tab-triggers'}
      aria-hidden={!active && !triggerLabOpen}
    >
      <div className="feature-heading">
        <div>
          <h2>{triggerLabOpen ? 'Trigger Lab' : 'Adaptive Triggers'}</h2>
          <p>{triggerLabOpen ? 'Experimental adaptive trigger profile editor' : 'Set trigger effect intensity and test mode'}</p>
        </div>
        <div className="triggers-heading-controls">
          {triggerLabEnabled && triggerLabAnyActive ? (
            <div className="inline-switch trigger-lab-state-indicator">
              <span className="inline-state-badge warn trigger-lab-state">Lab Override</span>
              <span className="settings-shortcut-tooltip shortcut-glyph-tooltip trigger-lab-override-tooltip">
                Trigger Lab is overriding game adaptive trigger output.
              </span>
            </div>
          ) : null}
          <div className="inline-switch">
            <span>Enabled</span>
            <button
              type="button"
              role="switch"
              aria-checked={triggerPageEnabled}
              aria-label={triggerLabOpen ? 'Enable Trigger Lab' : 'Enable adaptive triggers'}
              title={triggerLabOpen ? 'Enable Trigger Lab' : 'Enable adaptive triggers'}
              className={`switch ${triggerPageEnabled ? 'on' : ''}`}
              disabled={!controllerControlsAvailable || !adaptiveTriggersSupported || pendingAction !== null}
              onClick={triggerLabOpen ? toggleTriggerLabEnabled : toggleAdaptiveTriggersEnabled}
            >
              <span />
            </button>
          </div>
        </div>
      </div>
      {triggerLabOpen ? (
        <div className="feature-card-grid trigger-lab-grid">
          {renderTriggerLabCard('l2')}
          {renderTriggerLabCard('r2')}
        </div>
      ) : (
      <div className="feature-card-grid">
        <section className="feature-card preset-card">
          <div className="feature-card-title">
            <button
              type="button"
              className={`feature-icon triggers-enable-button icon-compact ${snapshot.settings.adaptiveTriggersEnabled ? 'active' : ''} ${controllerPowerSavingActive && snapshot.settings.adaptiveTriggersEnabled ? 'power-saving-active' : ''}`}
              aria-pressed={snapshot.settings.adaptiveTriggersEnabled}
              aria-label="Enable adaptive triggers"
              title="Enable adaptive triggers"
              disabled={!controllerControlsAvailable || !adaptiveTriggersSupported || pendingAction !== null}
              onClick={toggleAdaptiveTriggersEnabled}
            >
              <IconDeviceGamepad2 size={20} />
            </button>
            <div className="title-copy">
              <h3>Intensity</h3>
              <p>Set the overall strength of adaptive trigger effects</p>
            </div>
          </div>
          <div className="framed-slider">
            <label className="slider-row">
              <span>0%</span>
              <div className="range-control">
                <input
                  type="range"
                  min="0"
                  max={percentSliderMax}
                  step={TRIGGER_EFFECT_STEP}
                  value={triggerEffectIntensityValue}
                  disabled={!connected || !adaptiveTriggersSupported || !snapshot.settings.adaptiveTriggersEnabled}
                  style={{ '--range-fill': `${(triggerEffectIntensityValue / percentSliderMax) * 100}%` } as CSSProperties}
                  onPointerDown={() => {
                    triggerEffectEditingRef.current = true;
                  }}
                  onChange={(event) => (
                    setTriggerEffectIntensityValue(snapTriggerEffectIntensity(Number(event.currentTarget.value)))
                  )}
                  onPointerUp={() => void commitTriggerEffectIntensity()}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      triggerEffectEditingRef.current = true;
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                      void commitTriggerEffectIntensity();
                    }
                  }}
                  onBlur={() => void commitTriggerEffectIntensity()}
                />
                <div className="range-ticks" aria-hidden="true">
                  {PERCENT_SLIDER_TICKS.map((value) => (
                    <span key={value} className={sliderTickClass(value, 100)} />
                  ))}
                </div>
              </div>
              <strong>{triggerEffectIntensityValue}%</strong>
            </label>
          </div>
          <div className="segmented-row">
            {TRIGGER_EFFECT_PRESETS.map(([label, value]) => (
              <button
                key={label}
                type="button"
                className={triggerEffectIntensityValue === value ? 'active' : ''}
                disabled={!connected || !adaptiveTriggersSupported || !snapshot.settings.adaptiveTriggersEnabled || pendingAction !== null}
                onClick={() => setTriggerIntensityPreset(Number(value))}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        <section className="feature-card test-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconTestPipe size={20} /></span>
            <div className="title-copy">
              <h3>Testing</h3>
              <p>Choose a trigger effect and run a short test</p>
            </div>
          </div>
          <div className="test-options">
            <div className="select-row wide-select trigger-test-mode-control">
              <CustomSelect
                value={snapshot.settings.triggerTestMode}
                disabled={
                  !connected
                  || !adaptiveTriggersSupported
                  || !snapshot.settings.adaptiveTriggersEnabled
                  || adaptiveTriggerOutputActive
                  || pendingAction !== null
                }
                options={TRIGGER_TEST_MODE_OPTIONS}
                ariaLabel="Trigger test type"
                onChange={setTriggerTestMode}
              />
            </div>
            <div className="target-row">
              <div className="segmented-row compact">
                {TRIGGER_TARGET_OPTIONS.map(([label, value]) => (
                  <button
                    key={value}
                    type="button"
                    className={triggerTarget === value ? 'active' : ''}
                    disabled={!connected || !adaptiveTriggersSupported || adaptiveTriggerOutputActive}
                    onClick={() => setTriggerTarget(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="trigger-action-row">
            <button className="primary-action" type="button" disabled={testTriggersUnavailable} onClick={runTestAdaptiveTriggers}>
              <Play size={15} />
              {connected && adaptiveTriggerOutputActive
                ? 'Game Triggers Active'
                : connected && (triggerTestLocked || snapshot.status?.testAdaptiveTriggersBusy)
                  ? 'Testing'
                  : 'Test Triggers'}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={!connected || !adaptiveTriggersSupported || adaptiveTriggerOutputActive || pendingAction !== null}
              onClick={resetAdaptiveTriggers}
            >
              <RefreshCcw size={14} />
              Reset Triggers
            </button>
          </div>
          <div className={`feature-status test-status ${triggerStatusTone}`}>
            <span className="status-badge">
              <span className={`dot ${triggerStatusTone}`} />
              <strong>{triggerStatusLabel}</strong>
            </span>
          </div>
        </section>
      </div>
      )}
      <FeatureTipsPanel
        tab="triggers"
        triggerLabOpen={triggerLabOpen}
        onSettingsFocusRequest={focusBridgeSettings}
      />
    </div>
  );
}

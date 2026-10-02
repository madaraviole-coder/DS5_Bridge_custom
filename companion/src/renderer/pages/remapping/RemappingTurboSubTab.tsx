import type { Dispatch, SetStateAction } from 'react';
import {
  IconBolt as Zap,
  IconBooks,
  IconFlame,
  IconMinus as Minus,
  IconPlus as Plus,
  IconTrash as Trash2
} from '@tabler/icons-react';
import type { TurboSettings } from '../../../shared/types';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { TURBO_BUTTONS } from '../../constants/app-constants';

export interface RemappingTurboSubTabProps {
  setActiveControlTab: (tab: any) => void;
  selectedTurboActionProfile: string;
  setSelectedTurboActionProfile: (profile: string) => void;
  turboRepeatMode: 'hold' | 'toggle' | 'press';
  setTurboRepeatMode: (mode: 'hold' | 'toggle' | 'press') => void;
  turboIntervalMs: number;
  handleSetTurboInterval: (intervalMs: number) => void;
  turboSettings: TurboSettings;
  handleToggleTurboHumanize: () => void;
  turboNewTriggerPickerOpen: boolean;
  setTurboNewTriggerPickerOpen: Dispatch<SetStateAction<boolean>>;
  handleAddTurboTrigger: (mask: number) => void;
  handleRemoveTurboTrigger: (mask: number) => void;
  turboStartsWhenMode: 'pressed' | 'held' | 'double';
  setTurboStartsWhenMode: (mode: 'pressed' | 'held' | 'double') => void;
  handleToggleTurboMaster: () => void;
  turboTesterActive: boolean;
  turboTesterFlash: boolean;
  turboTesterCount: number;
  startTurboTester: () => void;
  stopTurboTester: () => void;
}

export function RemappingTurboSubTab({
  setActiveControlTab,
  selectedTurboActionProfile,
  setSelectedTurboActionProfile,
  turboRepeatMode,
  setTurboRepeatMode,
  turboIntervalMs,
  handleSetTurboInterval,
  turboSettings,
  handleToggleTurboHumanize,
  turboNewTriggerPickerOpen,
  setTurboNewTriggerPickerOpen,
  handleAddTurboTrigger,
  handleRemoveTurboTrigger,
  turboStartsWhenMode,
  setTurboStartsWhenMode,
  handleToggleTurboMaster,
  turboTesterActive,
  turboTesterFlash,
  turboTesterCount,
  startTurboTester,
  stopTurboTester
}: RemappingTurboSubTabProps) {
  return (
    <section className="feature-card turbo-remapping-card multi-actions-container" aria-label="Turbo Rapid Fire configuration">
      {/* Top Tabs: Chords & Multi-Actions */}
      <div className="multi-actions-top-header">
        <div className="multi-actions-header-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="multi-actions-tab"
            onClick={() => setActiveControlTab('chords')}
          >
            <IconBooks size={18} />
            <span>Chords</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={true}
            className="multi-actions-tab active"
          >
            <Zap size={18} />
            <span>Multi-Actions</span>
          </button>
        </div>
        <p className="multi-actions-subtitle">
          Build actions around button states, thresholds, and repeat behavior.
        </p>
      </div>

      {/* 2-Column Grid: Action Library (Left) vs Trigger Assignments (Right) */}
      <div className="multi-actions-grid">
        {/* Left Column: Action Library */}
        <div className="multi-actions-card action-library-card">
          <div className="action-library-header">
            <h4>Action Library</h4>
            <p className="action-library-sub">Create actions.</p>
          </div>

          {/* Action Profile Row */}
          <div className="action-profile-row">
            <div className="action-profile-select-wrap">
              <CustomSelect
                value={selectedTurboActionProfile}
                options={[
                  ['Turbo 1', 'Turbo 1'],
                  ['Turbo 2', 'Turbo 2'],
                  ['Rapid Fire Pro', 'Rapid Fire Pro']
                ]}
                className="action-profile-select"
                showSelectedCheck={false}
                ariaLabel="Action Profile"
                onChange={(val) => setSelectedTurboActionProfile(val)}
              />
            </div>
            <button
              type="button"
              className="action-profile-add-btn"
              title="Add Action"
              onClick={() => setSelectedTurboActionProfile(`Turbo ${Date.now() % 100}`)}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Action selector */}
          <div className="action-config-field">
            <label className="action-config-label">Action:</label>
            <div className="action-config-control">
              <CustomSelect
                value="turbo"
                options={[
                  ['Turbo', 'turbo'],
                  ['Toggle Rapid', 'toggle-rapid'],
                  ['Burst (3-Shot)', 'burst']
                ]}
                className="action-config-select"
                showSelectedCheck={false}
                ariaLabel="Action type"
                onChange={() => {}}
              />
            </div>
          </div>

          {/* Repeat selector */}
          <div className="action-config-field">
            <label className="action-config-label">Repeat:</label>
            <div className="action-config-control">
              <CustomSelect
                value={turboRepeatMode}
                options={[
                  ['Repeat while held', 'hold'],
                  ['Toggle repeat on press', 'toggle'],
                  ['Fire once on press', 'press']
                ]}
                className="action-config-select"
                showSelectedCheck={false}
                ariaLabel="Repeat mode"
                onChange={(val) => setTurboRepeatMode(val as 'hold' | 'toggle' | 'press')}
              />
            </div>
          </div>

          {/* Interval Stepper */}
          <div className="action-config-field action-interval-field">
            <label className="action-config-label">Interval:</label>
            <div className="action-interval-stepper">
              <button
                type="button"
                className="interval-step-btn"
                title="Decrease interval (faster)"
                onClick={() => handleSetTurboInterval(turboIntervalMs - 10)}
                aria-label="Decrease interval"
              >
                <Minus size={14} />
              </button>
              <div className="interval-value-display">
                <span>{turboIntervalMs} ms</span>
              </div>
              <button
                type="button"
                className="interval-step-btn"
                title="Increase interval (slower)"
                onClick={() => handleSetTurboInterval(turboIntervalMs + 10)}
                aria-label="Increase interval"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Deterministic Output Card */}
          <div className="deterministic-output-box">
            <h5>Deterministic output</h5>
            <div className="deterministic-output-badges">
              <div className="deterministic-pill">
                Assigned button · {turboRepeatMode === 'hold' ? 'repeats while held' : turboRepeatMode === 'toggle' ? 'toggles repeat' : 'fires once'}
              </div>
              <div className="deterministic-pill">
                {turboIntervalMs} ms interval · stops on release
              </div>
            </div>
          </div>

          {/* Anti-Cheat Humanize Safe Cadence Toggle */}
          <div className="action-library-humanize-row">
            <div className="humanize-info">
              <div className="humanize-title">
                <Zap size={15} />
                <span>Anti-Cheat Humanized Jitter</span>
              </div>
              <span className="humanize-sub">±15% realistic micro-variance</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={turboSettings.humanize}
              aria-label="Toggle Humanized Cadence"
              className={`switch switch-orange ${turboSettings.humanize ? 'on' : ''}`}
              onClick={handleToggleTurboHumanize}
            >
              <span />
            </button>
          </div>
        </div>

        {/* Right Column: Trigger Assignments */}
        <div className="multi-actions-card trigger-assignments-card">
          <div className="trigger-assignments-header">
            <div>
              <h4>Trigger Assignments</h4>
              <p className="trigger-assignments-sub">Assign actions to button events.</p>
            </div>
            <div className="new-trigger-wrap">
              <button
                type="button"
                className="new-trigger-btn"
                onClick={() => setTurboNewTriggerPickerOpen((prev) => !prev)}
              >
                <Plus size={15} />
                <span>New Trigger</span>
              </button>

              {turboNewTriggerPickerOpen && (
                <div className="new-trigger-popover">
                  <div className="popover-heading">Choose Button</div>
                  <div className="popover-buttons-grid">
                    {TURBO_BUTTONS.map((btn) => {
                      const isAssigned = (turboSettings.buttonsMask & btn.mask) !== 0;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          className={`popover-btn-choice ${isAssigned ? 'assigned' : ''}`}
                          disabled={isAssigned}
                          onClick={() => handleAddTurboTrigger(btn.mask)}
                        >
                          <span className="popover-glyph">{btn.glyph}</span>
                          <span>{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trigger Cards List */}
          <div className="trigger-cards-list">
            {TURBO_BUTTONS.filter((btn) => (turboSettings.buttonsMask & btn.mask) !== 0).length === 0 ? (
              <div className="empty-triggers-placeholder">
                <Zap size={32} className="empty-icon" />
                <p>No buttons assigned to this action yet.</p>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setTurboNewTriggerPickerOpen(true)}
                >
                  <Plus size={14} />
                  Assign a button
                </button>
              </div>
            ) : (
              TURBO_BUTTONS.filter((btn) => (turboSettings.buttonsMask & btn.mask) !== 0).map((btn) => (
                <div key={btn.id} className="trigger-assignment-item">
                  <div className="trigger-item-left">
                    <div className="trigger-glyph-badge">
                      <span>{btn.glyph}</span>
                    </div>
                    <div className="trigger-starts-when">
                      <span className="starts-when-label">Starts when:</span>
                      <div className="starts-when-select-wrap">
                        <CustomSelect
                          value={turboStartsWhenMode}
                          options={[
                            ['Button is pressed', 'pressed'],
                            ['Button is held', 'held'],
                            ['Double tap button', 'double']
                          ]}
                          className="starts-when-select"
                          showSelectedCheck={false}
                          ariaLabel={`Trigger mode for ${btn.label}`}
                          onChange={(val) => setTurboStartsWhenMode(val as 'pressed' | 'held' | 'double')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="trigger-item-right">
                    <div className="trigger-action-pill">
                      <Zap size={14} className="pill-zap" />
                      <span>{selectedTurboActionProfile} · {turboRepeatMode === 'hold' ? 'Repeat while held' : turboRepeatMode === 'toggle' ? 'Toggle repeat' : 'Fire once'} · {turboIntervalMs} ms</span>
                    </div>
                    <button
                      type="button"
                      className="trigger-delete-btn"
                      title={`Remove ${btn.label} trigger`}
                      onClick={() => handleRemoveTurboTrigger(btn.mask)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Click Tester & Master Toggle */}
      <div className="turbo-tester-bar">
        <div className="tester-bar-master">
          <div className="master-title-row">
            <span className="master-label">Turbo Master:</span>
            <span className={`turbo-status-pill ${turboSettings.enabled ? 'active' : ''}`}>
              {turboSettings.enabled ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={turboSettings.enabled}
            aria-label="Toggle Turbo Mode"
            className={`switch switch-orange ${turboSettings.enabled ? 'on' : ''}`}
            onClick={handleToggleTurboMaster}
          >
            <span />
          </button>
        </div>

        <div className="tester-bar-interactive">
          <button
            type="button"
            className={`turbo-test-trigger ${turboTesterActive ? 'active' : ''}`}
            onMouseDown={startTurboTester}
            onMouseUp={stopTurboTester}
            onMouseLeave={stopTurboTester}
            onTouchStart={startTurboTester}
            onTouchEnd={stopTurboTester}
            aria-label="Hold to test turbo clicking speed"
          >
            <IconFlame size={20} className={turboTesterFlash ? 'fire-flash' : ''} />
            <span>{turboTesterActive ? 'FIRING TURBO...' : 'HOLD TO TEST CADENCE'}</span>
          </button>

          <div className="tester-pulse-row">
            <div className={`turbo-pulse-led ${turboTesterFlash ? 'flash' : ''} ${turboTesterActive ? 'active' : ''}`} />
            <span className="tester-pulse-count">
              <strong>{turboTesterCount}</strong> clicks ({turboSettings.speedCps} CPS / {turboIntervalMs} ms)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

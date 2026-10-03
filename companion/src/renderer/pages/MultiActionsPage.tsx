import { useState } from 'react';
import {
  IconListNumbers,
  IconPlus,
  IconTrash,
  IconCursorText,
  IconKeyboard
} from '@tabler/icons-react';
import type { BridgeSnapshot, MultiActionSequence, MultiActionStep, VirtualCursorSettings, MultiActionsSettings } from '../../shared/types';
import { CustomSelect } from '../components/ui/CustomSelect';

export interface MultiActionsPageProps {
  active: boolean;
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  pendingAction: string | null;
  runAction: (label: string, action: () => Promise<BridgeSnapshot>) => Promise<void>;
}

export function MultiActionsPage({
  active,
  snapshot,
  connected,
  pendingAction,
  runAction
}: MultiActionsPageProps) {
  const multiActionsSettings: MultiActionsSettings = snapshot?.settings.multiActionsSettings ?? {
    enabled: false,
    sequences: []
  };
  const sequences = multiActionsSettings.sequences ?? [];

  const defaultCursorSettings: VirtualCursorSettings = {
    enabled: false,
    controlStick: 'left',
    pointerSpeed: 12,
    scrollSpeed: 10,
    deadzonePercent: 15,
    leftClickButton: 'cross',
    rightClickButton: 'circle',
    middleClickButton: 'square',
    scrollUpButton: 'dpad-up',
    scrollDownButton: 'dpad-down',
    virtualKeyboardShortcut: 'options'
  };
  const cursorSettings: VirtualCursorSettings = {
    ...defaultCursorSettings,
    ...(snapshot?.settings.virtualCursorSettings ?? {})
  };

  const [selectedSequenceId, setSelectedSequenceId] = useState<string>(
    sequences.length > 0 ? sequences[0].id : ''
  );

  const activeSequence = sequences.find((s) => s.id === selectedSequenceId) ?? sequences[0];

  const updateMultiActions = (updates: Partial<MultiActionsSettings>) => {
    const next: MultiActionsSettings = {
      ...multiActionsSettings,
      ...updates
    };
    void runAction('multi-actions', () => window.bridge.setMultiActionsSettings(next));
  };

  const updateSequences = (nextSequences: MultiActionSequence[]) => {
    updateMultiActions({ sequences: nextSequences });
  };

  const updateCursorSettings = (updates: Partial<VirtualCursorSettings>) => {
    const next: VirtualCursorSettings = {
      ...cursorSettings,
      ...updates
    };
    void runAction('virtual-cursor', () => window.bridge.setVirtualCursorSettings(next));
  };

  const handleAddSequence = () => {
    const newSeq: MultiActionSequence = {
      id: `seq-${Date.now()}`,
      name: `Action Sequence #${sequences.length + 1}`,
      triggerButton: 'triangle',
      holdThresholdMs: 0,
      repeatMode: 'none',
      repeatCount: 1,
      repeatIntervalMs: 50,
      steps: [
        { id: `step-${Date.now()}`, type: 'button-press', button: 'cross', delayMs: 100 }
      ]
    };
    updateSequences([...sequences, newSeq]);
    setSelectedSequenceId(newSeq.id);
  };

  const handleDeleteSequence = (id: string) => {
    const next = sequences.filter((s) => s.id !== id);
    updateSequences(next);
    if (selectedSequenceId === id && next.length > 0) {
      setSelectedSequenceId(next[0].id);
    }
  };

  const handleUpdateActiveSequence = (updates: Partial<MultiActionSequence>) => {
    if (!activeSequence) return;
    const next = sequences.map((s) => (s.id === activeSequence.id ? { ...s, ...updates } : s));
    updateSequences(next);
  };

  const handleAddStep = () => {
    if (!activeSequence) return;
    const newStep: MultiActionStep = {
      id: `step-${Date.now()}`,
      type: 'button-press',
      button: 'circle',
      delayMs: 100
    };
    handleUpdateActiveSequence({
      steps: [...activeSequence.steps, newStep]
    });
  };

  const handleRemoveStep = (index: number) => {
    if (!activeSequence) return;
    const newSteps = activeSequence.steps.filter((_, i) => i !== index);
    handleUpdateActiveSequence({ steps: newSteps });
  };

  const handleUpdateStep = (index: number, updates: Partial<MultiActionStep>) => {
    if (!activeSequence) return;
    const newSteps = activeSequence.steps.map((st, i) => (i === index ? { ...st, ...updates } : st));
    handleUpdateActiveSequence({ steps: newSteps });
  };

  const buttonOptions: Array<[string, string]> = [
    ['Cross (X)', 'cross'],
    ['Circle (O)', 'circle'],
    ['Square ([])', 'square'],
    ['Triangle (^)', 'triangle'],
    ['L1 Bumper', 'l1'],
    ['R1 Bumper', 'r1'],
    ['L2 Trigger', 'l2'],
    ['R2 Trigger', 'r2'],
    ['L3 Click', 'l3'],
    ['R3 Click', 'r3'],
    ['D-Pad Up', 'up'],
    ['D-Pad Down', 'down'],
    ['D-Pad Left', 'left'],
    ['D-Pad Right', 'right']
  ];

  return (
    <div
      className={`control-page multi-actions-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-multi-actions"
      aria-labelledby="control-tab-multi-actions"
      aria-hidden={!active}
    >
      <div className="feature-heading">
        <div>
          <h2>Multi-Actions & Virtual Cursor</h2>
          <p>Sequence complex combo macros and navigate your desktop with precision stick control.</p>
        </div>
      </div>

      <div className="feature-card-grid">
        {/* Card 1: Multi-Actions Macro Builder */}
        <section className="feature-card" style={{ gridColumn: 'span 2' }}>
          <div className="feature-card-title">
            <span className="feature-icon"><IconListNumbers size={20} /></span>
            <div className="title-copy">
              <h3>Macro Sequencer (Multi-Actions)</h3>
              <p>Chain button presses and delays executed automatically on trigger.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={multiActionsSettings.enabled}
              className={`switch ${multiActionsSettings.enabled ? 'on' : ''}`}
              disabled={!connected || pendingAction !== null}
              onClick={() => updateMultiActions({ enabled: !multiActionsSettings.enabled })}
            >
              <span />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              className="action-pill primary"
              onClick={handleAddSequence}
              disabled={!connected || pendingAction !== null}
            >
              <IconPlus size={16} /> Add Sequence
            </button>
          </div>

          {sequences.length === 0 ? (
            <div className="feature-card-empty-state">
              <p>No multi-action sequences configured yet. Click "Add Sequence" to create your first combo macro.</p>
            </div>
          ) : (
            <div className="macro-editor-container" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Select Sequence:</label>
                <div style={{ minWidth: 220 }}>
                  <CustomSelect
                      value={activeSequence?.id ?? ''}
                      options={sequences.map((s) => [s.name, s.id])}
                      onChange={(val) => setSelectedSequenceId(val)} ariaLabel={''}                  />
                </div>
                {activeSequence && (
                  <button
                    type="button"
                    className="action-pill danger"
                    onClick={() => handleDeleteSequence(activeSequence.id)}
                    title="Delete sequence"
                  >
                    <IconTrash size={16} /> Delete
                  </button>
                )}
              </div>

              {activeSequence && (
                <div className="macro-details-box" style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Sequence Name</label>
                      <input
                        type="text"
                        className="text-input"
                        value={activeSequence.name}
                        onChange={(e) => handleUpdateActiveSequence({ name: e.target.value })}
                      />
                    </div>
                    <div style={{ width: 160 }}>
                      <label className="field-label">Trigger Button</label>
                      <CustomSelect
                          value={activeSequence.triggerButton}
                          options={buttonOptions}
                          onChange={(val) => handleUpdateActiveSequence({ triggerButton: val })} ariaLabel={''}                      />
                    </div>
                    <div style={{ width: 140 }}>
                      <label className="field-label">Repeat Mode</label>
                      <CustomSelect
                          value={activeSequence.repeatMode}
                          options={[
                            ['Single Run', 'none'],
                            ['While Holding', 'while-holding'],
                            ['Fixed Count', 'fixed-count']
                          ]}
                          onChange={(val) => handleUpdateActiveSequence({ repeatMode: val as any })} ariaLabel={''}                      />
                    </div>
                  </div>

                  <h4 style={{ margin: '12px 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Steps Sequence</h4>
                  <div className="macro-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeSequence.steps.map((step, idx) => (
                      <div
                        key={step.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(255,255,255,0.04)',
                          padding: '8px 12px',
                          borderRadius: 6
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 'bold', width: 24 }}>#{idx + 1}</span>
                        <div style={{ minWidth: 140 }}>
                          <CustomSelect
                            value={step.type}
                            options={[
                              ['Button Press', 'button-press'],
                              ['Delay Pause', 'delay']
                            ]}
                            onChange={(val) => handleUpdateStep(idx, { type: val as any })} ariaLabel={''}                          />
                        </div>
                        {step.type === 'button-press' && (
                          <div style={{ minWidth: 150 }}>
                            <CustomSelect
                              value={step.button || 'cross'}
                              options={buttonOptions}
                              onChange={(val) => handleUpdateStep(idx, { button: val })} ariaLabel={''}                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12 }}>Delay (ms):</span>
                          <input
                            type="number"
                            className="text-input"
                            style={{ width: 75 }}
                            value={step.delayMs ?? 100}
                            onChange={(e) => handleUpdateStep(idx, { delayMs: parseInt(e.target.value, 10) || 0 })}
                          />
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          style={{ marginLeft: 'auto', color: 'var(--status-bad)' }}
                          onClick={() => handleRemoveStep(idx)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="action-pill"
                    style={{ marginTop: 12 }}
                    onClick={handleAddStep}
                  >
                    <IconPlus size={14} /> Add Step
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Card 2: Virtual Cursor (Mouse Emulation) */}
        <section className="feature-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconCursorText size={20} /></span>
            <div className="title-copy">
              <h3>Virtual Cursor Navigation</h3>
              <p>Control the OS mouse cursor using controller analog sticks.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cursorSettings.enabled}
              className={`switch ${cursorSettings.enabled ? 'on' : ''}`}
              disabled={!connected || pendingAction !== null}
              onClick={() => updateCursorSettings({ enabled: !cursorSettings.enabled })}
            >
              <span />
            </button>
          </div>

          <div className="feature-slider-list" style={{ marginTop: 16 }}>
            <div className="control-row">
              <label>Cursor Control Stick</label>
              <div style={{ minWidth: 140 }}>
                <CustomSelect
                  value={cursorSettings.controlStick}
                  options={[
                    ['Left Stick', 'left'],
                    ['Right Stick', 'right']
                  ]}
                  onChange={(val) => updateCursorSettings({ controlStick: val as 'left' | 'right' })} ariaLabel={''}                />
              </div>
            </div>

            <div className="slider-container">
              <label>
                <span>Pointer Speed ({cursorSettings.pointerSpeed})</span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={cursorSettings.pointerSpeed}
                  disabled={!cursorSettings.enabled}
                  onChange={(e) => updateCursorSettings({ pointerSpeed: parseInt(e.target.value, 10) })}
                />
              </label>
            </div>

            <div className="slider-container">
              <label>
                <span>Scroll Wheel Speed ({cursorSettings.scrollSpeed})</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={cursorSettings.scrollSpeed}
                  disabled={!cursorSettings.enabled}
                  onChange={(e) => updateCursorSettings({ scrollSpeed: parseInt(e.target.value, 10) })}
                />
              </label>
            </div>

            <div className="slider-container">
              <label>
                <span>Deadzone ({cursorSettings.deadzonePercent}%)</span>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={cursorSettings.deadzonePercent}
                  disabled={!cursorSettings.enabled}
                  onChange={(e) => updateCursorSettings({ deadzonePercent: parseInt(e.target.value, 10) })}
                />
              </label>
            </div>
          </div>
        </section>

        {/* Card 3: Virtual Keyboard Shortcut Note */}
        <section className="feature-card">
          <div className="feature-card-title">
            <span className="feature-icon"><IconKeyboard size={20} /></span>
            <div className="title-copy">
              <h3>Virtual Keyboard</h3>
              <p>On-screen Windows touch keyboard trigger integration.</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 8 }}>
            DualSense Bridge can summon the Windows Touch Keyboard (`osk.exe` / `TabTip.exe`) instantly using dedicated chord actions or touchpad gestures configured in the <strong>Chords</strong> or <strong>Touchpad</strong> menus.
          </p>
          <div style={{ marginTop: 12 }}>
            <span className="status-badge good">Supported via Chords & Remap</span>
          </div>
        </section>
      </div>
    </div>
  );
}

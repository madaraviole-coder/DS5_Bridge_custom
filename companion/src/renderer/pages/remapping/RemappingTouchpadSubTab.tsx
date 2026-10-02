import {
  IconBolt as Zap,
  IconDeviceGamepad2,
  IconDeviceLaptop as Laptop,
  IconKeyboard as Keyboard,
  IconPlayerPlay as Play,
  IconSparkles as Sparkles,
  IconVolume as Volume2,
  IconX as X
} from '@tabler/icons-react';
import type { RemapButtonId } from '../../../shared/protocol';
import {
  DEFAULT_TOUCHPAD_SETTINGS,
  GESTURE_BUTTON_ACTIONS,
  GESTURE_MEDIA_ACTIONS,
  GESTURE_SEQUENCE_PRESETS,
  GESTURE_WINDOWS_SHORTCUTS,
  type TouchpadGesture,
  type TouchpadMode,
  type TouchpadSettings,
  type TouchpadZoneId,
  type TouchpadZoneTarget,
  formatGestureSequence,
  getGestureActionDescription,
  getGestureActionLabel
} from '../../../shared/touchpad-gestures';
import { CustomSelect } from '../../components/ui/CustomSelect';
import {
  REMAP_BUTTONS,
  TOUCHPAD_MODE_OPTIONS,
  TOUCHPAD_TARGET_OPTIONS
} from '../../constants/app-constants';
import {
  IconTouchpadHand,
  TouchpadZoneTargetOption
} from '../../components/ui/GlyphOptions';

export interface RemappingTouchpadSubTabProps {
  touchpadSettings: TouchpadSettings;
  updateTouchpadSettings: (updater: (prev: TouchpadSettings) => TouchpadSettings) => void;
  selectedTouchpadZone: TouchpadZoneId;
  setSelectedTouchpadZone: (zone: TouchpadZoneId) => void;
  handleTouchpadZoneClick: (zone: TouchpadZoneId) => void;
  swipePathD: string;
  gesturePreviewActive: boolean;
  gestureSequence: number[];
  zoneCoords: Record<TouchpadZoneId, { x: number; y: number }>;
  handlePlayGesturePreview: () => void;
  handleClearGestureSequence: () => void;
  handleSelectGestureSequencePreset: (presetSeq: number[]) => void;
  touchpadGestureTestFeedback: string | null;
  handleTestTouchpadGesture: () => Promise<void> | void;
  handleUpdateGestureActionType: (actionType: TouchpadGesture['actionType']) => void;
  handleUpdateGestureActionValue: (actionValue: string) => void;
  handleApplyTouchpadPreset: (preset: 'face' | 'dpad' | 'shoulders' | 'default') => void;
  handleSetTouchpadZoneMapping: (zone: TouchpadZoneId, target: TouchpadZoneTarget) => void;
}

export function RemappingTouchpadSubTab({
  touchpadSettings,
  updateTouchpadSettings,
  selectedTouchpadZone,
  setSelectedTouchpadZone,
  handleTouchpadZoneClick,
  swipePathD,
  gesturePreviewActive,
  gestureSequence,
  zoneCoords,
  handlePlayGesturePreview,
  handleClearGestureSequence,
  handleSelectGestureSequencePreset,
  touchpadGestureTestFeedback,
  handleTestTouchpadGesture,
  handleUpdateGestureActionType,
  handleUpdateGestureActionValue,
  handleApplyTouchpadPreset,
  handleSetTouchpadZoneMapping
}: RemappingTouchpadSubTabProps) {
  return (
    <section className="feature-card touchpad-remapping-card" aria-label="Touchpad gesture and zone configuration">
      {/* Touchpad Card Header */}
      <div className="touchpad-card-header">
        <div className="touchpad-header-badge">
          <IconTouchpadHand size={24} />
        </div>
        <div className="touchpad-header-text">
          <h3>Touchpad</h3>
          <p>Define touch gestures and assign actions.</p>
        </div>
      </div>

      {/* TOUCHPAD CANVAS */}
      <div className="touchpad-canvas-section">
        <div className="touchpad-canvas-header">
          <h4>TOUCHPAD CANVAS</h4>
          <div className="touchpad-mode-selector">
            <CustomSelect
              value={touchpadSettings.mode}
              options={TOUCHPAD_MODE_OPTIONS}
              ariaLabel="Touchpad operating mode"
              onChange={(mode) => updateTouchpadSettings((prev) => ({ ...prev, mode }))}
            />
          </div>
        </div>

        <div className="touchpad-canvas-wrapper" role="region" aria-label="Touchpad Zone Canvas">
          <svg className="touchpad-canvas-svg" viewBox="0 0 400 220" aria-hidden="true">
            {/* Zone 1 (Top Left) */}
            <path
              className={`touchpad-zone-path ${selectedTouchpadZone === 1 ? 'active' : ''}`}
              d="M 12 6 H 194 V 76 A 34 34 0 0 1 166 104 H 12 A 6 6 0 0 1 6 98 V 12 A 6 6 0 0 1 12 6 Z"
              onClick={() => handleTouchpadZoneClick(1)}
            />
            <text
              x="96"
              y="48"
              textAnchor="middle"
              className={`touchpad-zone-text ${selectedTouchpadZone === 1 ? 'active' : ''}`}
            >
              ZONE 1
            </text>
            <text x="96" y="66" textAnchor="middle" className="touchpad-zone-binding-text">
              {touchpadSettings.zoneMappings[1] === 'none' ? '—' : (REMAP_BUTTONS[touchpadSettings.zoneMappings[1] as RemapButtonId]?.label ?? touchpadSettings.zoneMappings[1])}
            </text>

            {/* Zone 2 (Top Right) */}
            <path
              className={`touchpad-zone-path ${selectedTouchpadZone === 2 ? 'active' : ''}`}
              d="M 206 6 H 388 A 6 6 0 0 1 394 12 V 98 A 6 6 0 0 1 388 104 H 234 A 34 34 0 0 1 206 76 V 6 Z"
              onClick={() => handleTouchpadZoneClick(2)}
            />
            <text
              x="304"
              y="48"
              textAnchor="middle"
              className={`touchpad-zone-text ${selectedTouchpadZone === 2 ? 'active' : ''}`}
            >
              ZONE 2
            </text>
            <text x="304" y="66" textAnchor="middle" className="touchpad-zone-binding-text">
              {touchpadSettings.zoneMappings[2] === 'none' ? '—' : (REMAP_BUTTONS[touchpadSettings.zoneMappings[2] as RemapButtonId]?.label ?? touchpadSettings.zoneMappings[2])}
            </text>

            {/* Zone 3 (Bottom Left) */}
            <path
              className={`touchpad-zone-path ${selectedTouchpadZone === 3 ? 'active' : ''}`}
              d="M 6 122 A 6 6 0 0 1 12 116 H 166 A 34 34 0 0 1 194 144 V 208 A 6 6 0 0 1 188 214 H 12 A 6 6 0 0 1 6 208 Z"
              onClick={() => handleTouchpadZoneClick(3)}
            />
            <text
              x="96"
              y="158"
              textAnchor="middle"
              className={`touchpad-zone-text ${selectedTouchpadZone === 3 ? 'active' : ''}`}
            >
              ZONE 3
            </text>
            <text x="96" y="176" textAnchor="middle" className="touchpad-zone-binding-text">
              {touchpadSettings.zoneMappings[3] === 'none' ? '—' : (REMAP_BUTTONS[touchpadSettings.zoneMappings[3] as RemapButtonId]?.label ?? touchpadSettings.zoneMappings[3])}
            </text>

            {/* Zone 4 (Bottom Right) */}
            <path
              className={`touchpad-zone-path ${selectedTouchpadZone === 4 ? 'active' : ''}`}
              d="M 206 144 A 34 34 0 0 1 234 116 H 388 A 6 6 0 0 1 394 122 V 208 A 6 6 0 0 1 388 214 H 212 A 6 6 0 0 1 206 208 Z"
              onClick={() => handleTouchpadZoneClick(4)}
            />
            <text
              x="304"
              y="158"
              textAnchor="middle"
              className={`touchpad-zone-text ${selectedTouchpadZone === 4 ? 'active' : ''}`}
            >
              ZONE 4
            </text>
            <text x="304" y="176" textAnchor="middle" className="touchpad-zone-binding-text">
              {touchpadSettings.zoneMappings[4] === 'none' ? '—' : (REMAP_BUTTONS[touchpadSettings.zoneMappings[4] as RemapButtonId]?.label ?? touchpadSettings.zoneMappings[4])}
            </text>

            {/* Center Circular Deadzone Cutout */}
            <circle cx="200" cy="110" r="32" className="touchpad-center-circle" />

            {/* Active Indicator in selected zone */}
            {selectedTouchpadZone === 1 && (
              <g transform="translate(96, 48)">
                <circle r="9" stroke="#ff7a00" strokeWidth="2.4" fill="none" />
                <circle r="3.5" fill="#ffffff" />
              </g>
            )}
            {selectedTouchpadZone === 2 && (
              <g transform="translate(304, 48)">
                <circle r="9" stroke="#ff7a00" strokeWidth="2.4" fill="none" />
                <circle r="3.5" fill="#ffffff" />
              </g>
            )}
            {selectedTouchpadZone === 3 && (
              <g transform="translate(96, 158)">
                <circle r="9" stroke="#ff7a00" strokeWidth="2.4" fill="none" />
                <circle r="3.5" fill="#ffffff" />
              </g>
            )}
            {selectedTouchpadZone === 4 && (
              <g transform="translate(304, 158)">
                <circle r="9" stroke="#ff7a00" strokeWidth="2.4" fill="none" />
                <circle r="3.5" fill="#ffffff" />
              </g>
            )}

            {/* Swipe arc visualization (connecting sequence of zones) */}
            {touchpadSettings.mode === 'swipe' && (
              <g>
                {swipePathD ? (
                  <path
                    className="touchpad-swipe-arc"
                    d={swipePathD}
                  />
                ) : (
                  <path
                    className="touchpad-swipe-arc"
                    d="M 96 48 L 304 48"
                  />
                )}
                {gesturePreviewActive && (
                  <circle r="6" fill="#ff7a00">
                    <animateMotion
                      path={swipePathD || "M 96 48 L 304 48"}
                      dur="0.8s"
                      repeatCount="1"
                    />
                  </circle>
                )}
                {/* Sequence step order badges on the canvas */}
                {gestureSequence.map((zoneId, stepIdx) => {
                  const pt = zoneCoords[zoneId as TouchpadZoneId];
                  if (!pt) return null;
                  return (
                    <g key={`step-${stepIdx}`} transform={`translate(${pt.x + 18}, ${pt.y - 18})`}>
                      <circle r="9" fill="#ff7a00" />
                      <text textAnchor="middle" dy="3.5" fill="#ffffff" fontSize="10" fontWeight="bold">
                        {stepIdx + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* GESTURE BUILDER Section */}
        {touchpadSettings.mode === 'swipe' && (
          <div className="gesture-builder-section">
            <div className="gesture-builder-header">
              <div className="gesture-builder-titles">
                <h5>GESTURE BUILDER</h5>
                <p>Click zones in the order the gesture should follow.</p>
              </div>
              <div className="gesture-builder-actions">
                <button
                  type="button"
                  className="gesture-builder-btn play-btn"
                  title="Preview Gesture"
                  onClick={handlePlayGesturePreview}
                >
                  <Play size={16} />
                </button>
                <button
                  type="button"
                  className="gesture-builder-btn"
                  title="Clear Sequence"
                  onClick={handleClearGestureSequence}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="gesture-slots-row">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const val = gestureSequence[index];
                return (
                  <div
                    key={index}
                    className={`gesture-slot ${val !== undefined ? 'filled' : ''}`}
                  >
                    {val !== undefined ? val : '—'}
                  </div>
                );
              })}
            </div>

            <div className="gesture-presets-bar">
              <span className="touchpad-preset-label">Direction Presets:</span>
              {GESTURE_SEQUENCE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="touchpad-preset-chip"
                  onClick={() => handleSelectGestureSequencePreset(p.sequence)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {touchpadSettings.mode === 'swipe' ? (
        <div className="touchpad-gesture-action-section">
          <div className="touchpad-gesture-action-header">
            <div className="touchpad-gesture-header-titles">
              <h4>Swipe Gesture Action</h4>
              <p className="touchpad-subname">
                Trigger an action when performing sequence{' '}
                <strong className="gesture-sequence-highlight">
                  {formatGestureSequence(gestureSequence.length > 0 ? gestureSequence : [1, 2])}
                </strong>
              </p>
            </div>
            <div className="touchpad-gesture-header-actions">
              <button
                type="button"
                className={`touchpad-gesture-test-btn ${touchpadGestureTestFeedback ? 'success' : ''}`}
                onClick={() => void handleTestTouchpadGesture()}
                title="Trigger this action immediately to test it"
              >
                <Zap size={15} />
                <span>{touchpadGestureTestFeedback ?? 'Test Action'}</span>
              </button>
            </div>
          </div>

          {/* Category Tabs: Windows Shortcuts | Media Controls | Controller Button | Custom Hotkey */}
          <div className="touchpad-gesture-category-tabs">
            <button
              type="button"
              className={`touchpad-gesture-category-tab ${(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'windows-shortcut' ? 'active' : ''}`}
              onClick={() => handleUpdateGestureActionType('windows-shortcut')}
            >
              <Laptop size={15} />
              <span>Windows Shortcuts</span>
            </button>
            <button
              type="button"
              className={`touchpad-gesture-category-tab ${(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'media' ? 'active' : ''}`}
              onClick={() => handleUpdateGestureActionType('media')}
            >
              <Volume2 size={15} />
              <span>Media Controls</span>
            </button>
            <button
              type="button"
              className={`touchpad-gesture-category-tab ${(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'button' ? 'active' : ''}`}
              onClick={() => handleUpdateGestureActionType('button')}
            >
              <IconDeviceGamepad2 size={15} />
              <span>Controller Button</span>
            </button>
            <button
              type="button"
              className={`touchpad-gesture-category-tab ${(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'custom-keys' ? 'active' : ''}`}
              onClick={() => handleUpdateGestureActionType('custom-keys')}
            >
              <Keyboard size={15} />
              <span>Custom Hotkey</span>
            </button>
          </div>

          {/* Action Selection Options */}
          <div className="touchpad-gesture-options-panel">
            {(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'windows-shortcut' && (
              <div className="touchpad-gesture-shortcuts-grid">
                {GESTURE_WINDOWS_SHORTCUTS.map((sc) => {
                  const isSelected = touchpadSettings.gestures[0]?.actionValue === sc.value;
                  return (
                    <button
                      key={sc.value}
                      type="button"
                      className={`gesture-action-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUpdateGestureActionValue(sc.value)}
                    >
                      <div className="gesture-action-card-top">
                        <span className="gesture-action-name">{sc.label}</span>
                        <code className="gesture-action-key">{sc.keys.join('+')}</code>
                      </div>
                      <p className="gesture-action-desc">{sc.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'media' && (
              <div className="touchpad-gesture-shortcuts-grid">
                {GESTURE_MEDIA_ACTIONS.map((m) => {
                  const isSelected = touchpadSettings.gestures[0]?.actionValue === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      className={`gesture-action-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUpdateGestureActionValue(m.value)}
                    >
                      <div className="gesture-action-card-top">
                        <span className="gesture-action-name">{m.label}</span>
                      </div>
                      <p className="gesture-action-desc">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'button' && (
              <div className="touchpad-gesture-buttons-grid">
                {GESTURE_BUTTON_ACTIONS.map((b) => {
                  const isSelected = touchpadSettings.gestures[0]?.actionValue === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      className={`gesture-button-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUpdateGestureActionValue(b.value)}
                    >
                      <span className="gesture-button-glyph">{b.glyph}</span>
                      <span className="gesture-button-label">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(touchpadSettings.gestures[0]?.actionType ?? 'windows-shortcut') === 'custom-keys' && (
              <div className="touchpad-gesture-custom-keys-panel">
                <label className="gesture-input-label">
                  <span>Virtual Key Combination:</span>
                  <input
                    type="text"
                    className="gesture-input-text"
                    placeholder="e.g. CTRL+SHIFT+O or ALT+F4"
                    value={touchpadSettings.gestures[0]?.actionValue ?? ''}
                    onChange={(e) => handleUpdateGestureActionValue(e.target.value.toUpperCase())}
                  />
                </label>
                <p className="gesture-input-hint">
                  Supported modifiers: <code>CTRL</code>, <code>SHIFT</code>, <code>ALT</code>, <code>WIN</code> + any key (e.g. A-Z, 0-9, F1-F12, ESC, TAB, ENTER, SPACE).
                </p>
              </div>
            )}
          </div>

          {/* Active Gesture Summary Card */}
          <div className="touchpad-gesture-summary-card">
            <div className="gesture-summary-icon">
              <Sparkles size={20} />
            </div>
            <div className="gesture-summary-info">
              <div className="gesture-summary-title">
                <span>Active Binding:</span>
                <strong>{getGestureActionLabel(touchpadSettings.gestures[0] ?? DEFAULT_TOUCHPAD_SETTINGS.gestures[0])}</strong>
              </div>
              <p className="gesture-summary-desc">
                {getGestureActionDescription(touchpadSettings.gestures[0] ?? DEFAULT_TOUCHPAD_SETTINGS.gestures[0])}
              </p>
            </div>
            <div className="gesture-summary-status">
              <span className="gesture-status-dot active" />
              <span>Hardware Synchronized</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="touchpad-zone-customization-section">
          <div className="touchpad-zone-customization-header">
            <h4>4-Zone Button Mapping</h4>
            <span className="touchpad-subname">Assign a controller button to each touchpad quadrant</span>
          </div>

          <div className="touchpad-presets-bar">
            <span className="touchpad-preset-label">Presets:</span>
            <button
              type="button"
              className="touchpad-preset-chip"
              onClick={() => handleApplyTouchpadPreset('face')}
            >
              Face Buttons (△ ○ □ ✕)
            </button>
            <button
              type="button"
              className="touchpad-preset-chip"
              onClick={() => handleApplyTouchpadPreset('dpad')}
            >
              D-Pad (↑ → ← ↓)
            </button>
            <button
              type="button"
              className="touchpad-preset-chip"
              onClick={() => handleApplyTouchpadPreset('shoulders')}
            >
              Shoulders &amp; Triggers (L1 R1 L2 R2)
            </button>
            <button
              type="button"
              className="touchpad-preset-chip"
              onClick={() => handleApplyTouchpadPreset('default')}
            >
              Reset Defaults
            </button>
          </div>

          <div className="touchpad-zone-grid">
            {([1, 2, 3, 4] as TouchpadZoneId[]).map((zoneId) => {
              const zoneTitles: Record<TouchpadZoneId, { title: string; sub: string }> = {
                1: { title: 'Zone 1', sub: 'Top-Left Quadrant' },
                2: { title: 'Zone 2', sub: 'Top-Right Quadrant' },
                3: { title: 'Zone 3', sub: 'Bottom-Left Quadrant' },
                4: { title: 'Zone 4', sub: 'Bottom-Right Quadrant' },
              };
              const currentVal = touchpadSettings.zoneMappings[zoneId];
              return (
                <div
                  key={zoneId}
                  className={`touchpad-zone-card ${selectedTouchpadZone === zoneId ? 'selected' : ''}`}
                  onClick={() => setSelectedTouchpadZone(zoneId)}
                >
                  <div className="touchpad-zone-card-top">
                    <div className="touchpad-zone-card-title">
                      <span className="touchpad-zone-badge">{zoneId}</span>
                      <div>
                        <div className="touchpad-zone-name">{zoneTitles[zoneId].title}</div>
                        <div className="touchpad-zone-subname">{zoneTitles[zoneId].sub}</div>
                      </div>
                    </div>
                  </div>

                  <CustomSelect
                    value={currentVal}
                    options={TOUCHPAD_TARGET_OPTIONS}
                    className="remapping-select"
                    showSelectedCheck={false}
                    ariaLabel={`${zoneTitles[zoneId].title} mapping`}
                    renderValue={(label, value) => <TouchpadZoneTargetOption label={label} value={value} />}
                    renderOption={(label, value) => <TouchpadZoneTargetOption label={label} value={value} />}
                    onChange={(value) => handleSetTouchpadZoneMapping(zoneId, value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

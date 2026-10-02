import type { CSSProperties, PointerEvent, ReactNode, RefObject } from 'react';
import {
  IconBooks,
  IconBolt as Zap,
  IconDeviceGamepad3,
  IconEdit as Pencil,
  IconPlus as Plus,
  IconReplace,
  IconTrash as Trash2
} from '@tabler/icons-react';
import type {
  ChordAssignableButtonId,
  ChordAssignment,
  ChordControllerSettingAction,
  ChordFunction,
  ChordFunctionType,
  ChordMediaAction,
  ChordStarterId
} from '../../shared/protocol';
import type {
  ChordAssignmentDraftRow,
  ChordAssignmentDropHint,
  ChordButtonSelectValue,
  ChordControllerSettingSelectValue,
  ChordFunctionDraft,
  ChordKeyboardModifier
} from '../types/chords';
import { CHORD_UNASSIGNED_BUTTON } from '../types/chords';
import { CustomSelect } from '../components/ui/CustomSelect';
import { ChordButtonGlyphOption, ChordStarterGlyphOption, type ControlTab } from '../App';

export type RemappingSubTab = 'buttons' | 'sticks' | 'triggers' | 'touchpad' | 'turbo';

export interface ChordsPageProps {
  active: boolean;
  pendingAction: string | null;
  selectedChordFunction: ChordFunction | null;
  chordFunctionOptions: ReadonlyArray<readonly [string, string]>;
  chordFunctions: readonly ChordFunction[];
  chordFunctionDialogOpen: boolean;
  setSelectedChordFunctionId: (id: string) => void;
  setChordFunctionDraft: (draft: ChordFunctionDraft) => void;
  openChordFunctionDialog: (mode: 'rename' | 'delete') => void;
  createChordFunction: () => void;
  chordFunctionDraft: ChordFunctionDraft;
  commitChordFunctionDraft: (draft: ChordFunctionDraft) => void;
  setChordFunctionKeyboardKey: (key: string) => void;
  toggleChordFunctionKeyboardModifier: (modifier: ChordKeyboardModifier) => void;
  renderChordFunctionSummary: (func: ChordFunction) => ReactNode;
  chordAssignmentsSubtitle: string;
  chordAssignmentConflictState: { conflictCount: number; conflictKeys: Set<string> };
  canAddChordDraft: boolean;
  addChordAssignmentDraft: () => void;
  chordAssignmentListRef: RefObject<HTMLDivElement | null>;
  updateChordAssignmentScrollbar: () => void;
  chordAssignments: readonly ChordAssignment[];
  chordAssignmentDraftRows: readonly ChordAssignmentDraftRow[];
  chordStarterOptionsFor: (starter: ChordStarterId) => ReadonlyArray<readonly [string, ChordStarterId]>;
  muteChordStarterIsInactive: (starter: ChordStarterId) => boolean;
  chordButtonOptionsFor: (
    starter: ChordStarterId,
    includeUnassigned?: boolean,
    currentButton?: ChordAssignableButtonId
  ) => ReadonlyArray<readonly [string, ChordButtonSelectValue]>;
  updateChordAssignmentDraftStarter: (id: string, starter: ChordStarterId) => void;
  updateChordAssignmentDraftButton: (id: string, button: ChordButtonSelectValue) => void;
  updateChordAssignmentDraftFunction: (id: string, functionId: string) => void;
  deleteChordAssignmentDraft: (id: string) => void;
  chordAssignmentDropHint: ChordAssignmentDropHint | null;
  draggedChordAssignmentId: string | null;
  startChordAssignmentPointerDrag: (event: PointerEvent<HTMLDivElement>, id: string) => void;
  updateChordAssignmentStarter: (id: string, starter: ChordStarterId) => void;
  updateChordAssignmentButton: (id: string, button: ChordButtonSelectValue) => void;
  setChordAssignmentFunction: (id: string, functionId: string) => void;
  deleteChordAssignment: (id: string) => void;
  chordAssignmentScrollbar: { visible: boolean; height: number; top: number };
  startChordAssignmentScrollbarDrag: (event: PointerEvent<HTMLDivElement>) => void;
  setActiveControlTab: (tab: ControlTab) => void;
  setRemappingSubTab: (subTab: RemappingSubTab) => void;
  CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH: number;
  CHORD_KEYBOARD_KEY_OPTIONS: ReadonlyArray<readonly [string, string]>;
  CHORD_KEYBOARD_MODIFIER_OPTIONS: ReadonlyArray<readonly [string, ChordKeyboardModifier]>;
  MAX_KEYBOARD_FUNCTION_KEYS: number;
  CHORD_MEDIA_ACTION_OPTIONS: ReadonlyArray<readonly [string, ChordMediaAction]>;
  CHORD_CONTROLLER_SETTING_ACTION_OPTIONS: ReadonlyArray<readonly [string, ChordControllerSettingSelectValue]>;
  CHORD_FUNCTION_TYPE_OPTIONS: ReadonlyArray<readonly [string, ChordFunctionType]>;
  chordFunctionToDraft: (func: ChordFunction | null) => ChordFunctionDraft;
  chordControllerSettingSelectValue: (action: ChordControllerSettingAction) => ChordControllerSettingSelectValue;
  chordControllerSettingActionFromSelectValue: (
    value: ChordControllerSettingSelectValue,
    currentAction: ChordControllerSettingAction
  ) => ChordControllerSettingAction;
  chordFunctionSummary: (func: ChordFunction) => string;
  chordAssignmentLabel: (assignment: ChordAssignment) => string;
  chordAssignmentKey: (assignment: ChordAssignment) => string;
}

export function ChordsPage({
  active,
  pendingAction,
  selectedChordFunction,
  chordFunctionOptions,
  chordFunctions,
  chordFunctionDialogOpen,
  setSelectedChordFunctionId,
  setChordFunctionDraft,
  openChordFunctionDialog,
  createChordFunction,
  chordFunctionDraft,
  commitChordFunctionDraft,
  setChordFunctionKeyboardKey,
  toggleChordFunctionKeyboardModifier,
  renderChordFunctionSummary,
  chordAssignmentsSubtitle,
  chordAssignmentConflictState,
  canAddChordDraft,
  addChordAssignmentDraft,
  chordAssignmentListRef,
  updateChordAssignmentScrollbar,
  chordAssignments,
  chordAssignmentDraftRows,
  chordStarterOptionsFor,
  muteChordStarterIsInactive,
  chordButtonOptionsFor,
  updateChordAssignmentDraftStarter,
  updateChordAssignmentDraftButton,
  updateChordAssignmentDraftFunction,
  deleteChordAssignmentDraft,
  chordAssignmentDropHint,
  draggedChordAssignmentId,
  startChordAssignmentPointerDrag,
  updateChordAssignmentStarter,
  updateChordAssignmentButton,
  setChordAssignmentFunction,
  deleteChordAssignment,
  chordAssignmentScrollbar,
  startChordAssignmentScrollbarDrag,
  setActiveControlTab,
  setRemappingSubTab,
  CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH,
  CHORD_KEYBOARD_KEY_OPTIONS,
  CHORD_KEYBOARD_MODIFIER_OPTIONS,
  MAX_KEYBOARD_FUNCTION_KEYS,
  CHORD_MEDIA_ACTION_OPTIONS,
  CHORD_CONTROLLER_SETTING_ACTION_OPTIONS,
  CHORD_FUNCTION_TYPE_OPTIONS,
  chordFunctionToDraft,
  chordControllerSettingSelectValue,
  chordControllerSettingActionFromSelectValue,
  chordFunctionSummary,
  chordAssignmentLabel,
  chordAssignmentKey
}: ChordsPageProps) {
  return (
    <div
      className={`control-page chords-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-chords"
      aria-labelledby="control-tab-chords"
      aria-hidden={!active}
    >
      <div className="feature-heading chords-heading">
        <div className="multi-actions-header-tabs chords-top-nav-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={true}
            className="multi-actions-tab active"
          >
            <IconBooks size={18} />
            <span>Chords</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="multi-actions-tab"
            onClick={() => {
              setActiveControlTab('remapping');
              setRemappingSubTab('turbo');
            }}
          >
            <Zap size={18} />
            <span>Multi-Actions</span>
          </button>
        </div>
        <div>
          <h2>Chords</h2>
          <p>Assign reusable functions to controller buttons and starter chords.</p>
        </div>
      </div>

      <div className="chords-layout">
        <section className="feature-card chords-card chords-function-card">
          <div className="feature-card-title">
            <span className="feature-icon">
              <IconBooks size={24} />
            </span>
            <div className="title-copy">
              <h3>Function Library</h3>
              <p>Create actions.</p>
            </div>
          </div>

          <div className="chords-function-strip">
            <CustomSelect
              value={selectedChordFunction?.id ?? ''}
              options={chordFunctionOptions}
              disabled={pendingAction !== null || chordFunctions.length === 0}
              ariaLabel="Chord function"
              className="chords-function-select"
              closeOnSelect={false}
              suspendOutsideClose={chordFunctionDialogOpen}
              onChange={(value) => {
                const next = chordFunctions.find((func) => func.id === value) ?? null;
                setSelectedChordFunctionId(value);
                setChordFunctionDraft(chordFunctionToDraft(next));
              }}
              renderMenuFooter={() => (
                selectedChordFunction ? (
                  <div className="trigger-lab-profile-actions chords-function-menu-actions">
                    <button
                      type="button"
                      title="Rename"
                      disabled={pendingAction !== null}
                      onClick={() => {
                        openChordFunctionDialog('rename');
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      disabled={pendingAction !== null}
                      onClick={() => {
                        openChordFunctionDialog('delete');
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null
              )}
            />
            <button
              className="heading-icon-action chords-new-function-button"
              type="button"
              title="New Function"
              aria-label="New Function"
              disabled={pendingAction !== null}
              onClick={createChordFunction}
            >
              <Plus size={17} />
            </button>
          </div>

          {selectedChordFunction ? (
            <div className="chords-editor">
              <label className="chords-field chords-inline-field">
                <span>Type</span>
                <CustomSelect
                  value={chordFunctionDraft.type}
                  options={CHORD_FUNCTION_TYPE_OPTIONS}
                  disabled={pendingAction !== null}
                  ariaLabel="Chord function type"
                  onChange={(value) => {
                    const nextDraft = { ...chordFunctionDraft, type: value };
                    setChordFunctionDraft(nextDraft);
                    commitChordFunctionDraft(nextDraft);
                  }}
                />
              </label>

              {chordFunctionDraft.type === 'keyboard' && (
                <div
                  className="chords-keyboard-shortcut-builder"
                  aria-label="Keyboard shortcut"
                  style={{
                    '--chords-keyboard-key-label-width': `${CHORD_KEYBOARD_KEY_MAX_LABEL_LENGTH}ch`
                  } as CSSProperties}
                >
                  <CustomSelect
                    className="chords-keyboard-key-select"
                    value={chordFunctionDraft.keyboardKey}
                    options={CHORD_KEYBOARD_KEY_OPTIONS}
                    disabled={pendingAction !== null}
                    ariaLabel="Keyboard shortcut key"
                    onChange={setChordFunctionKeyboardKey}
                  />
                  <div className="chords-keyboard-modifiers" aria-label="Keyboard shortcut modifiers">
                    {CHORD_KEYBOARD_MODIFIER_OPTIONS.map(([label, modifier]) => {
                      const active = chordFunctionDraft.keyboardModifiers.includes(modifier);
                      const unavailable = !active
                        && chordFunctionDraft.keyboardModifiers.length >= MAX_KEYBOARD_FUNCTION_KEYS - 1;
                      return (
                        <button
                          key={modifier}
                          type="button"
                          className={active ? 'active' : ''}
                          aria-pressed={active}
                          disabled={pendingAction !== null || unavailable}
                          onClick={() => toggleChordFunctionKeyboardModifier(modifier)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {chordFunctionDraft.type === 'media' && (
                <label className="chords-field chords-inline-field">
                  <span>Action</span>
                  <CustomSelect
                    value={chordFunctionDraft.mediaAction}
                    options={CHORD_MEDIA_ACTION_OPTIONS}
                    disabled={pendingAction !== null}
                    ariaLabel="Chord media action"
                    onChange={(value) => {
                      const nextDraft = { ...chordFunctionDraft, mediaAction: value };
                      setChordFunctionDraft(nextDraft);
                      commitChordFunctionDraft(nextDraft);
                    }}
                  />
                </label>
              )}

              {chordFunctionDraft.type === 'controller-setting' && (
                <label className="chords-field chords-inline-field">
                  <span>Action</span>
                  <CustomSelect
                    value={chordControllerSettingSelectValue(chordFunctionDraft.controllerAction)}
                    options={CHORD_CONTROLLER_SETTING_ACTION_OPTIONS}
                    disabled={pendingAction !== null}
                    ariaLabel="Chord controller setting action"
                    onChange={(value) => {
                      const nextDraft = {
                        ...chordFunctionDraft,
                        controllerAction: chordControllerSettingActionFromSelectValue(
                          value,
                          chordFunctionDraft.controllerAction
                        )
                      };
                      setChordFunctionDraft(nextDraft);
                      commitChordFunctionDraft(nextDraft);
                    }}
                  />
                </label>
              )}

              {renderChordFunctionSummary(selectedChordFunction)}
            </div>
          ) : (
            <div className="chords-empty">
              <IconReplace size={26} />
              <strong>No functions yet</strong>
              <span>Create a function, then bind it to a button or chord.</span>
            </div>
          )}
        </section>

        <section className="feature-card chords-card chords-assignment-card">
          <div className="feature-card-title">
            <span className="feature-icon">
              <IconDeviceGamepad3 size={24} />
            </span>
            <div className="title-copy">
              <h3>Assignments</h3>
              <p>{chordAssignmentsSubtitle}</p>
            </div>
            <span
              className="chords-standalone-badge"
              title="Chords persist to onboard Flash memory and execute directly in hardware, even without Companion app"
            >
              Standalone Hardware
            </span>
            {chordAssignmentConflictState.conflictCount > 0 ? (
              <span className="chords-conflict-badge" title="Duplicate, inactive, or shortcut-shadowed chord bindings">
                <strong>{chordAssignmentConflictState.conflictCount}x</strong>
                {chordAssignmentConflictState.conflictCount === 1 ? 'Conflict' : 'Conflicts'}
              </span>
            ) : null}
          </div>

          <div className="chords-assignment-builder">
            <button
              className="heading-action chords-new-chord-button"
              type="button"
              disabled={pendingAction !== null || !canAddChordDraft}
              onClick={addChordAssignmentDraft}
            >
              <IconReplace size={18} />
              New Chord
            </button>
          </div>

          <div className="chords-assignment-scroll-region">
            <div
              className="chords-assignment-list"
              ref={chordAssignmentListRef}
              aria-label="Chord assignments"
              onScroll={updateChordAssignmentScrollbar}
            >
              {chordAssignments.length + chordAssignmentDraftRows.length > 0 ? (
                <>
                {chordAssignmentDraftRows.map((row) => {
                  const func = chordFunctions.find((candidate) => candidate.id === row.functionId);
                  const starterOptions = chordStarterOptionsFor(row.starter);
                  const isInactiveMuteChord = muteChordStarterIsInactive(row.starter);
                  return (
                    <div
                      className={[
                        'chords-assignment-row',
                        'draft',
                        isInactiveMuteChord ? 'mute-starter-inactive' : ''
                      ].filter(Boolean).join(' ')}
                      key={row.id}
                    >
                      <div
                        className="chords-assignment-binding"
                        aria-label="New chord"
                        title="New chord"
                      >
                        <CustomSelect
                          value={row.starter}
                          options={starterOptions}
                          disabled={pendingAction !== null}
                          className="chords-inline-glyph-select chords-inline-starter-select"
                          floatingMenu
                          floatingMenuMinWidth={72}
                          showSelectedCheck={false}
                          ariaLabel="Chord starter"
                          renderValue={(label, value) => <ChordStarterGlyphOption label={label} value={value} />}
                          renderOption={(label, value) => <ChordStarterGlyphOption label={label} value={value} />}
                          onChange={(value) => updateChordAssignmentDraftStarter(row.id, value)}
                        />
                        <span className="chords-binding-connector" aria-hidden="true" />
                        <CustomSelect
                          value={row.button ?? CHORD_UNASSIGNED_BUTTON}
                          options={chordButtonOptionsFor(row.starter, true)}
                          disabled={pendingAction !== null}
                          className="chords-inline-glyph-select chords-inline-button-select"
                          floatingMenu
                          floatingMenuMinWidth={72}
                          showSelectedCheck={false}
                          ariaLabel="Chord button"
                          renderValue={(label, value) => <ChordButtonGlyphOption label={label} value={value} />}
                          renderOption={(label, value) => <ChordButtonGlyphOption label={label} value={value} />}
                          onChange={(value) => updateChordAssignmentDraftButton(row.id, value)}
                        />
                      </div>
                      <span className="chords-function-connector" aria-hidden="true" />
                      <CustomSelect
                        value={row.functionId}
                        options={chordFunctionOptions}
                        disabled={pendingAction !== null}
                        className="chords-assignment-function-select"
                        floatingMenu
                        ariaLabel="New chord function"
                        renderValue={(label) => (
                          <span className="chords-function-option">
                            <strong>{label}</strong>
                            <small>{func ? chordFunctionSummary(func) : 'Missing function'}</small>
                          </span>
                        )}
                        renderOption={(label, value) => {
                          const optionFunction = chordFunctions.find((candidate) => candidate.id === value);
                          return (
                            <span className="chords-function-option">
                              <strong>{label}</strong>
                              <small>{optionFunction ? chordFunctionSummary(optionFunction) : 'Missing function'}</small>
                            </span>
                          );
                        }}
                        onChange={(value) => updateChordAssignmentDraftFunction(row.id, value)}
                      />
                      <button
                        className="heading-icon-action"
                        type="button"
                        title="Remove assignment"
                        disabled={pendingAction !== null}
                        onClick={() => deleteChordAssignmentDraft(row.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
                {chordAssignments.map((assignment, assignmentIndex) => {
                  const func = chordFunctions.find((candidate) => candidate.id === assignment.functionId);
                  const hasConflict = chordAssignmentConflictState.conflictKeys.has(chordAssignmentKey(assignment));
                  const starterOptions = chordStarterOptionsFor(assignment.starter);
                  const isInactiveMuteChord = muteChordStarterIsInactive(assignment.starter);
                  const dropPlacement = chordAssignmentDropHint?.targetId === assignment.id
                    ? chordAssignmentDropHint.placement
                    : null;
                  return (
                    <div
                      className={[
                        'chords-assignment-row',
                        hasConflict ? 'conflict' : '',
                        isInactiveMuteChord ? 'mute-starter-inactive' : '',
                        draggedChordAssignmentId === assignment.id ? 'dragging' : '',
                        dropPlacement === 'before' ? 'drop-before' : '',
                        dropPlacement === 'after' ? 'drop-after' : '',
                        assignmentIndex === 0 && dropPlacement === 'before' ? 'drop-list-start' : ''
                      ].filter(Boolean).join(' ')}
                      key={assignment.id}
                      data-assignment-id={assignment.id}
                      onPointerDown={(event) => startChordAssignmentPointerDrag(event, assignment.id)}
                    >
                      <div
                        className="chords-assignment-binding"
                        aria-label={chordAssignmentLabel(assignment)}
                        title={chordAssignmentLabel(assignment)}
                      >
                        <CustomSelect
                          value={assignment.starter}
                          options={starterOptions}
                          disabled={pendingAction !== null}
                          className="chords-inline-glyph-select chords-inline-starter-select"
                          floatingMenu
                          floatingMenuMinWidth={72}
                          showSelectedCheck={false}
                          ariaLabel={`${chordAssignmentLabel(assignment)} starter`}
                          renderValue={(label, value) => <ChordStarterGlyphOption label={label} value={value} />}
                          renderOption={(label, value) => <ChordStarterGlyphOption label={label} value={value} />}
                          onChange={(value) => updateChordAssignmentStarter(assignment.id, value)}
                        />
                        <span className="chords-binding-connector" aria-hidden="true" />
                        <CustomSelect
                          value={assignment.button}
                          options={chordButtonOptionsFor(
                            assignment.starter,
                            false,
                            assignment.button
                          )}
                          disabled={pendingAction !== null}
                          className="chords-inline-glyph-select chords-inline-button-select"
                          floatingMenu
                          floatingMenuMinWidth={72}
                          showSelectedCheck={false}
                          ariaLabel={`${chordAssignmentLabel(assignment)} button`}
                          renderValue={(label, value) => <ChordButtonGlyphOption label={label} value={value} />}
                          renderOption={(label, value) => <ChordButtonGlyphOption label={label} value={value} />}
                          onChange={(value) => updateChordAssignmentButton(assignment.id, value)}
                        />
                      </div>
                      <span className="chords-function-connector" aria-hidden="true" />
                      <CustomSelect
                        value={assignment.functionId}
                        options={chordFunctionOptions}
                        disabled={pendingAction !== null}
                        className="chords-assignment-function-select"
                        floatingMenu
                        ariaLabel={`${chordAssignmentLabel(assignment)} function`}
                        renderValue={(label) => (
                          <span className="chords-function-option">
                            <strong>{label}</strong>
                            <small>{func ? chordFunctionSummary(func) : 'Missing function'}</small>
                          </span>
                        )}
                        renderOption={(label, value) => {
                          const optionFunction = chordFunctions.find((candidate) => candidate.id === value);
                          return (
                            <span className="chords-function-option">
                              <strong>{label}</strong>
                              <small>{optionFunction ? chordFunctionSummary(optionFunction) : 'Missing function'}</small>
                            </span>
                          );
                        }}
                        onChange={(value) => setChordAssignmentFunction(assignment.id, value)}
                      />
                      <button
                        className="heading-icon-action"
                        type="button"
                        title="Remove assignment"
                        disabled={pendingAction !== null}
                        onClick={() => deleteChordAssignment(assignment.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
                </>
              ) : (
                <div className="chords-empty chords-empty-assignments">
                  <IconDeviceGamepad3 size={26} />
                  <strong>No assignments</strong>
                  <span>Use New Chord to pair a starter, button, and function.</span>
                </div>
              )}
            </div>
            {chordAssignmentScrollbar.visible ? (
              <div className="chords-assignment-scrollbar" aria-hidden="true">
                <div
                  className="chords-assignment-scrollbar-thumb"
                  style={{
                    height: `${chordAssignmentScrollbar.height}px`,
                    transform: `translateY(${chordAssignmentScrollbar.top}px)`
                  }}
                  onPointerDown={startChordAssignmentScrollbarDrag}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

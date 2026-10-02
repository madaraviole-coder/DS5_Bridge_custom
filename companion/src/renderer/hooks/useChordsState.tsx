import {
  useEffect,
  useMemo,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react';
import {
  IconMinus as Minus,
  IconPlus as Plus
} from '@tabler/icons-react';
import {
  CHORD_CONTROLLER_SETTING_STEP_MAX,
  CHORD_CONTROLLER_SETTING_STEP_MIN,
  MAX_CHORD_ASSIGNMENTS,
  MAX_CHORD_FUNCTION_NAME_LENGTH,
  MAX_KEYBOARD_FUNCTION_KEYS,
  isChordBindingAllowed,
  normalizeChordControllerSettingStepPercent,
  type ChordAssignableButtonId,
  type ChordAssignment,
  type ChordControllerSettingAction,
  type ChordFunction,
  type ChordStarterId
} from '../../shared/protocol';
import type { BridgeSnapshot } from '../../shared/types';
import {
  CHORD_BUTTON_MENU_IDS,
  CHORD_KEYBOARD_MODIFIER_OPTIONS,
  CHORD_MUTE_STARTER_ID,
  CHORD_STARTER_OPTIONS,
  CHORD_STARTERS,
  EMPTY_CHORD_FUNCTION_DRAFT
} from '../constants/app-constants';
import {
  CHORD_UNASSIGNED_BUTTON,
  type ChordAssignmentDragSession,
  type ChordAssignmentDraftRow,
  type ChordAssignmentDropHint,
  type ChordAssignmentScrollbarState,
  type ChordButtonSelectValue,
  type ChordFunctionDialogMode,
  type ChordFunctionDialogState,
  type ChordFunctionDraft,
  type ChordKeyboardModifier,
  type ControlTab
} from '../types/app-types';
import {
  chordAssignmentKey,
  chordBindingKey,
  chordButtonLabel,
  chordControllerSettingAdjustmentText,
  chordFunctionFromDraft,
  chordFunctionSummary,
  chordFunctionToDraft,
  chordFunctionTypeLabel,
  chordNotchTargetForAction,
  createChordAssignmentId
} from '../utils/chords';

export interface UseChordsStateParams {
  snapshot: BridgeSnapshot | null;
  activeControlTab: ControlTab;
  pendingAction: string | null;
  runQuietAction: (fn: () => Promise<any>) => Promise<any>;
  chordAssignmentListRef: RefObject<HTMLDivElement | null>;
  chordAssignmentDragRef: MutableRefObject<ChordAssignmentDragSession | null>;
  showDualSenseEdgeRemapButtons: boolean;
}

export function useChordsState({
  snapshot,
  activeControlTab,
  pendingAction,
  runQuietAction,
  chordAssignmentListRef,
  chordAssignmentDragRef,
  showDualSenseEdgeRemapButtons
}: UseChordsStateParams) {
  const [selectedChordFunctionId, setSelectedChordFunctionId] = useState('');
  const [chordFunctionDraft, setChordFunctionDraft] = useState<ChordFunctionDraft>(EMPTY_CHORD_FUNCTION_DRAFT);
  const [chordFunctionDialog, setChordFunctionDialog] = useState<ChordFunctionDialogState | null>(null);
  const [chordFunctionNameDraft, setChordFunctionNameDraft] = useState('');
  const [chordAssignmentDraftRows, setChordAssignmentDraftRows] = useState<ChordAssignmentDraftRow[]>([]);
  const [draggedChordAssignmentId, setDraggedChordAssignmentId] = useState<string | null>(null);
  const [chordAssignmentDropHint, setChordAssignmentDropHint] = useState<ChordAssignmentDropHint | null>(null);
  const [chordAssignmentScrollbar, setChordAssignmentScrollbar] = useState<ChordAssignmentScrollbarState>({
    visible: false,
    top: 0,
    height: 0
  });

  const chordFunctions = snapshot?.settings.chordFunctions ?? [];
  const chordAssignments = snapshot?.settings.chordAssignments ?? [];
  const chordFunctionDialogFunction = chordFunctions.find((func) => func.id === chordFunctionDialog?.functionId) ?? null;
  const selectedChordFunction = chordFunctions.find((func) => func.id === selectedChordFunctionId) ?? null;
  const defaultChordFunctionId = chordFunctions[0]?.id ?? '';

  const chordFunctionOptions = useMemo<Array<[string, string]>>(
    () => chordFunctions.map((func) => [func.name, func.id]),
    [chordFunctions]
  );

  const muteButtonChordStarterActive = snapshot?.settings.muteButtonMode === 'chord'
    || (
      snapshot?.settings.muteButtonMode === 'keyboard'
      && snapshot.settings.muteKeyboardChordStarterEnabled
    );
  const edgeProfileSwitchingBlocked = Boolean(snapshot?.settings.edgeProfileSwitchingBlocked);
  const chordAssignableButtonIds = CHORD_BUTTON_MENU_IDS;

  const chordStarterOptions = useMemo(() => {
    let starters = CHORD_STARTER_OPTIONS;
    if (!showDualSenseEdgeRemapButtons) {
      starters = starters.filter(([, id]) => id !== 'lfn' && id !== 'rfn');
    }
    if (!muteButtonChordStarterActive) {
      starters = starters.filter(([, id]) => id !== 'mute');
    }
    return starters;
  }, [muteButtonChordStarterActive, showDualSenseEdgeRemapButtons]);

  function chordStarterOptionsFor(currentStarter?: ChordStarterId): Array<[string, ChordStarterId]> {
    return currentStarter === CHORD_MUTE_STARTER_ID
      && !chordStarterOptions.some(([, starter]) => starter === CHORD_MUTE_STARTER_ID)
      ? [...chordStarterOptions, [CHORD_STARTERS.mute.label, CHORD_MUTE_STARTER_ID]]
      : chordStarterOptions;
  }

  const canAddChordDraft =
    Boolean(defaultChordFunctionId) &&
    chordAssignments.length + chordAssignmentDraftRows.length < MAX_CHORD_ASSIGNMENTS;

  const chordAssignmentsSubtitle = muteButtonChordStarterActive
    ? showDualSenseEdgeRemapButtons
      ? 'Pair PS, LFN, RFN, or Mute with a button.'
      : 'Pair PS or Mute with a button.'
    : showDualSenseEdgeRemapButtons
      ? 'Pair PS, LFN, or RFN with a button.'
      : 'Pair PS with a button.';

  const chordAssignmentConflictState = useMemo(() => {
    const counts = new Map<string, number>();
    for (const assignment of chordAssignments) {
      const key = chordAssignmentKey(assignment);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const conflictKeys = new Set<string>();
    let conflictCount = 0;
    for (const [key, count] of counts) {
      if (count > 1) {
        conflictKeys.add(key);
        conflictCount += count - 1;
      }
    }
    const shortcutKeys = new Set<string>();
    if (snapshot?.settings.sleepKeybindEnabled) {
      shortcutKeys.add(chordBindingKey('ps', 'triangle'));
    }
    if (snapshot?.settings.speakerVolumeShortcutEnabled) {
      shortcutKeys.add(chordBindingKey('ps', 'dpad-up'));
      shortcutKeys.add(chordBindingKey('ps', 'dpad-down'));
    }
    for (const assignment of chordAssignments) {
      const key = chordAssignmentKey(assignment);
      if (shortcutKeys.has(key)) {
        conflictKeys.add(key);
        conflictCount += 1;
      }
      if (assignment.starter === CHORD_MUTE_STARTER_ID && !muteButtonChordStarterActive) {
        conflictKeys.add(key);
        conflictCount += 1;
      }
      if (!isChordBindingAllowed(
        assignment.starter,
        assignment.button,
        edgeProfileSwitchingBlocked
      )) {
        conflictKeys.add(key);
        conflictCount += 1;
      }
    }
    return { conflictCount, conflictKeys };
  }, [
    chordAssignments,
    edgeProfileSwitchingBlocked,
    muteButtonChordStarterActive,
    snapshot?.settings.sleepKeybindEnabled,
    snapshot?.settings.speakerVolumeShortcutEnabled
  ]);

  function allowedChordButtonsForStarter(
    starter: ChordStarterId,
    currentButton?: ChordAssignableButtonId | null,
    includeUnassigned = false
  ): Array<[string, ChordButtonSelectValue]> {
    const ids = chordAssignableButtonIds.filter((id) =>
      isChordBindingAllowed(starter, id, edgeProfileSwitchingBlocked)
    );
    if (currentButton && !ids.includes(currentButton)) {
      ids.push(currentButton);
    }
    const options = ids.map((id): [string, ChordButtonSelectValue] => [chordButtonLabel(id), id]);
    return includeUnassigned ? [['Choose Button', CHORD_UNASSIGNED_BUTTON], ...options] : options;
  }

  function firstAllowedChordButton(starter: ChordStarterId): ChordAssignableButtonId | null {
    return (
      chordAssignableButtonIds.find((id) =>
        isChordBindingAllowed(starter, id, edgeProfileSwitchingBlocked)
      ) ?? null
    );
  }

  function updateChordAssignmentScrollbar() {
    const list = chordAssignmentListRef.current;
    if (!list) {
      return;
    }
    const maxScroll = list.scrollHeight - list.clientHeight;
    if (maxScroll <= 1) {
      setChordAssignmentScrollbar((current) =>
        current.visible ? { visible: false, top: 0, height: 0 } : current
      );
      return;
    }
    const trackHeight = list.clientHeight;
    const height = Math.max(30, Math.round((list.clientHeight / list.scrollHeight) * trackHeight));
    const top = Math.round((list.scrollTop / maxScroll) * (trackHeight - height));
    setChordAssignmentScrollbar((current) =>
      current.visible && current.top === top && current.height === height
        ? current
        : { visible: true, top, height }
    );
  }

  useEffect(() => {
    const list = chordAssignmentListRef.current;
    if (!list || activeControlTab !== 'chords') {
      return;
    }
    const frame = window.requestAnimationFrame(updateChordAssignmentScrollbar);
    const observer = new ResizeObserver(updateChordAssignmentScrollbar);
    observer.observe(list);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeControlTab, chordAssignments.length, chordAssignmentDraftRows.length]);

  function commitChordConfiguration(
    nextFunctions: ChordFunction[],
    nextAssignments: ChordAssignment[],
    _action = 'chords-save'
  ) {
    void runQuietAction(() => window.bridge.setChordConfiguration(nextFunctions, nextAssignments));
  }

  function createChordFunction() {
    const id = `function-${Date.now().toString(36)}`;
    const nextDraft: ChordFunctionDraft = {
      ...EMPTY_CHORD_FUNCTION_DRAFT,
      id,
      name: `Function ${chordFunctions.length + 1}`
    };
    const nextFunction = chordFunctionFromDraft(nextDraft);
    setSelectedChordFunctionId(id);
    setChordFunctionDraft(chordFunctionToDraft(nextFunction));
    commitChordConfiguration([...chordFunctions, nextFunction], chordAssignments, 'chords-create-function');
  }

  function commitChordFunctionDraft(nextDraft = chordFunctionDraft) {
    const nextFunction = chordFunctionFromDraft(nextDraft);
    const exists = chordFunctions.some((func) => func.id === nextFunction.id);
    const nextFunctions = exists
      ? chordFunctions.map((func) => (func.id === nextFunction.id ? nextFunction : func))
      : [...chordFunctions, nextFunction];
    setSelectedChordFunctionId(nextFunction.id);
    commitChordConfiguration(nextFunctions, chordAssignments, `chords-function-${nextFunction.id}`);
  }

  function setChordFunctionKeyboardKey(keyboardKey: string) {
    const nextDraft = { ...chordFunctionDraft, keyboardKey };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function toggleChordFunctionKeyboardModifier(modifier: ChordKeyboardModifier) {
    const enabled = chordFunctionDraft.keyboardModifiers.includes(modifier);
    if (!enabled && chordFunctionDraft.keyboardModifiers.length >= MAX_KEYBOARD_FUNCTION_KEYS - 1) {
      return;
    }
    const keyboardModifiers = enabled
      ? chordFunctionDraft.keyboardModifiers.filter((candidate) => candidate !== modifier)
      : CHORD_KEYBOARD_MODIFIER_OPTIONS.map(([, candidate]) => candidate).filter(
          (candidate) => candidate === modifier || chordFunctionDraft.keyboardModifiers.includes(candidate)
        );
    const nextDraft = { ...chordFunctionDraft, keyboardModifiers };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function setChordFunctionControllerAction(action: ChordControllerSettingAction) {
    const nextDraft = { ...chordFunctionDraft, controllerAction: action };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function setChordFunctionControllerStepPercent(stepPercent: number) {
    const nextDraft = {
      ...chordFunctionDraft,
      controllerStepPercent: normalizeChordControllerSettingStepPercent(stepPercent)
    };
    setChordFunctionDraft(nextDraft);
    commitChordFunctionDraft(nextDraft);
  }

  function renderChordFunctionSummary(func: ChordFunction) {
    const notchTarget = func.type === 'controller-setting' ? chordNotchTargetForAction(func.action) : null;
    const detailLabel = func.type === 'keyboard' ? 'Keys' : notchTarget ? 'Adjustment' : 'Action';
    const detailValue =
      func.type === 'controller-setting' && notchTarget
        ? chordControllerSettingAdjustmentText(func.action)
        : chordFunctionSummary(func);

    return (
      <div className="chords-function-summary chords-function-summary-grouped">
        <div className="chords-function-summary-header">
          <span>Summary</span>
          {func.type === 'controller-setting' && notchTarget ? (
            <div className="chords-function-summary-options">
              <label className="chords-step-selector">
                <span>Step</span>
                <input
                  type="number"
                  min={CHORD_CONTROLLER_SETTING_STEP_MIN}
                  max={CHORD_CONTROLLER_SETTING_STEP_MAX}
                  step={1}
                  value={
                    chordFunctionDraft.id === func.id
                      ? chordFunctionDraft.controllerStepPercent
                      : func.stepPercent
                  }
                  disabled={pendingAction !== null}
                  aria-label={`${notchTarget.target.label} step percent`}
                  onChange={(event) => {
                    const nextValue = normalizeChordControllerSettingStepPercent(event.target.value);
                    setChordFunctionDraft((draft) => ({ ...draft, controllerStepPercent: nextValue }));
                  }}
                  onBlur={(event) => {
                    setChordFunctionControllerStepPercent(Number(event.currentTarget.value));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                />
                <small>%</small>
              </label>
              <div
                className="dual-selector chords-notch-direction-selector"
                role="group"
                aria-label={`${notchTarget.target.label} direction`}
              >
                <button
                  type="button"
                  className={notchTarget.direction === 'down' ? 'active' : ''}
                  title={`Decrease ${notchTarget.target.label}`}
                  aria-label={`Decrease ${notchTarget.target.label}`}
                  disabled={pendingAction !== null}
                  onClick={() => setChordFunctionControllerAction(notchTarget.target.downAction)}
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  className={notchTarget.direction === 'up' ? 'active' : ''}
                  title={`Increase ${notchTarget.target.label}`}
                  aria-label={`Increase ${notchTarget.target.label}`}
                  disabled={pendingAction !== null}
                  onClick={() => setChordFunctionControllerAction(notchTarget.target.upAction)}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="chords-function-summary-detail">
          <div className="chords-function-summary-detail-row">
            <span>Type</span>
            <strong>{chordFunctionTypeLabel(func.type)}</strong>
          </div>
          <div className="chords-function-summary-detail-row">
            <span>{detailLabel}</span>
            <strong>
              {detailValue}
              {func.type === 'controller-setting' && notchTarget ? (
                <em> — {func.stepPercent}% step</em>
              ) : null}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  function openChordFunctionDialog(mode: ChordFunctionDialogMode) {
    if (!selectedChordFunction) {
      return;
    }
    setChordFunctionNameDraft(selectedChordFunction.name);
    setChordFunctionDialog({ mode, functionId: selectedChordFunction.id });
  }

  function closeChordFunctionDialog() {
    setChordFunctionDialog(null);
    setChordFunctionNameDraft('');
  }

  function deleteChordFunction(functionId: string) {
    const nextFunctions = chordFunctions.filter((func) => func.id !== functionId);
    const nextAssignments = chordAssignments.filter((assignment) => assignment.functionId !== functionId);
    const nextSelected = nextFunctions[0] ?? null;
    setSelectedChordFunctionId(nextSelected?.id ?? '');
    setChordFunctionDraft(chordFunctionToDraft(nextSelected));
    setChordAssignmentDraftRows((rows) => rows.filter((row) => row.functionId !== functionId));
    commitChordConfiguration(nextFunctions, nextAssignments, `chords-delete-function-${functionId}`);
  }

  function submitChordFunctionDialog() {
    if (!chordFunctionDialog) {
      return;
    }
    const current = chordFunctions.find((func) => func.id === chordFunctionDialog.functionId);
    if (!current) {
      closeChordFunctionDialog();
      return;
    }
    if (chordFunctionDialog.mode === 'delete') {
      deleteChordFunction(current.id);
      closeChordFunctionDialog();
      return;
    }
    const nextName = chordFunctionNameDraft.trim().slice(0, MAX_CHORD_FUNCTION_NAME_LENGTH);
    if (!nextName || nextName === current.name) {
      closeChordFunctionDialog();
      return;
    }
    const nextFunction = { ...current, name: nextName };
    const nextFunctions = chordFunctions.map((func) => (func.id === current.id ? nextFunction : func));
    setSelectedChordFunctionId(current.id);
    setChordFunctionDraft(chordFunctionToDraft(nextFunction));
    commitChordConfiguration(nextFunctions, chordAssignments, `chords-rename-function-${current.id}`);
    closeChordFunctionDialog();
  }

  function commitChordAssignment(nextAssignment: ChordAssignment, replaceAssignmentId?: string) {
    const replacingExisting = replaceAssignmentId
      ? chordAssignments.some((assignment) => assignment.id === replaceAssignmentId)
      : false;
    if (!replacingExisting && chordAssignments.length >= MAX_CHORD_ASSIGNMENTS) {
      return;
    }
    const nextAssignments = replacingExisting
      ? chordAssignments.map((assignment) =>
          assignment.id === replaceAssignmentId ? nextAssignment : assignment
        )
      : [...chordAssignments, nextAssignment];
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-assignment-${nextAssignment.id}`);
  }

  function addChordAssignmentDraft() {
    if (!canAddChordDraft) {
      return;
    }
    setChordAssignmentDraftRows((rows) => [
      ...rows,
      {
        id: `draft-${Date.now().toString(36)}-${rows.length}`,
        starter: chordStarterOptions[0]?.[1] ?? 'ps',
        button: null,
        functionId: defaultChordFunctionId
      }
    ]);
  }

  function commitChordAssignmentDraft(row: ChordAssignmentDraftRow, button: ChordAssignableButtonId) {
    if (!row.functionId || !isChordBindingAllowed(row.starter, button, edgeProfileSwitchingBlocked)) {
      return;
    }
    const nextAssignment: ChordAssignment = {
      id: createChordAssignmentId(row.starter, button),
      kind: 'chord',
      starter: row.starter,
      button,
      functionId: row.functionId
    };
    setChordAssignmentDraftRows((rows) => rows.filter((draft) => draft.id !== row.id));
    commitChordAssignment(nextAssignment);
  }

  function updateChordAssignmentDraftStarter(rowId: string, starter: ChordStarterId) {
    setChordAssignmentDraftRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              starter,
              button:
                row.button && isChordBindingAllowed(starter, row.button, edgeProfileSwitchingBlocked)
                  ? row.button
                  : null
            }
          : row
      )
    );
  }

  function updateChordAssignmentDraftButton(rowId: string, button: ChordButtonSelectValue) {
    if (button === CHORD_UNASSIGNED_BUTTON) {
      return;
    }
    const row = chordAssignmentDraftRows.find((draft) => draft.id === rowId);
    if (row) {
      commitChordAssignmentDraft(row, button);
    }
  }

  function updateChordAssignmentDraftFunction(rowId: string, functionId: string) {
    setChordAssignmentDraftRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, functionId } : row))
    );
  }

  function deleteChordAssignmentDraft(rowId: string) {
    setChordAssignmentDraftRows((rows) => rows.filter((row) => row.id !== rowId));
  }

  function updateChordAssignmentStarter(assignmentId: string, starter: ChordStarterId) {
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current) {
      return;
    }
    const button = isChordBindingAllowed(starter, current.button, edgeProfileSwitchingBlocked)
      ? current.button
      : firstAllowedChordButton(starter);
    if (!button) {
      return;
    }
    commitChordAssignment(
      {
        ...current,
        starter,
        button
      },
      assignmentId
    );
  }

  function updateChordAssignmentButton(assignmentId: string, button: ChordButtonSelectValue) {
    if (button === CHORD_UNASSIGNED_BUTTON) {
      return;
    }
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current || !isChordBindingAllowed(current.starter, button, edgeProfileSwitchingBlocked)) {
      return;
    }
    commitChordAssignment(
      {
        ...current,
        button
      },
      assignmentId
    );
  }

  function setChordAssignmentFunction(assignmentId: string, functionId: string) {
    const current = chordAssignments.find((assignment) => assignment.id === assignmentId);
    if (!current) {
      return;
    }
    commitChordAssignment(
      {
        ...current,
        functionId
      },
      assignmentId
    );
  }

  function deleteChordAssignment(assignmentId: string) {
    const nextAssignments = chordAssignments.filter((assignment) => assignment.id !== assignmentId);
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-delete-assignment-${assignmentId}`);
  }

  function startChordAssignmentScrollbarDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = chordAssignmentListRef.current;
    if (!list || !chordAssignmentScrollbar.visible || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startScrollTop = list.scrollTop;
    const maxScroll = list.scrollHeight - list.clientHeight;
    const thumbTravel = list.clientHeight - chordAssignmentScrollbar.height;
    const move = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      list.scrollTop = startScrollTop + ((moveEvent.clientY - startY) / thumbTravel) * maxScroll;
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  function reorderChordAssignment(sourceId: string, targetId: string, placement: 'before' | 'after') {
    if (sourceId === targetId) {
      return;
    }
    const sourceIndex = chordAssignments.findIndex((assignment) => assignment.id === sourceId);
    if (sourceIndex === -1 || !chordAssignments.some((assignment) => assignment.id === targetId)) {
      return;
    }
    const nextAssignments = [...chordAssignments];
    const [moved] = nextAssignments.splice(sourceIndex, 1);
    if (!moved) {
      return;
    }
    const targetIndex = nextAssignments.findIndex((assignment) => assignment.id === targetId);
    if (targetIndex === -1) {
      return;
    }
    nextAssignments.splice(placement === 'after' ? targetIndex + 1 : targetIndex, 0, moved);
    commitChordConfiguration(chordFunctions, nextAssignments, `chords-reorder-assignment-${sourceId}`);
  }

  function setChordAssignmentDragDropHint(nextHint: ChordAssignmentDropHint | null) {
    const session = chordAssignmentDragRef.current;
    if (session) {
      session.dropHint = nextHint;
    }
    setChordAssignmentDropHint((current) =>
      current?.targetId === nextHint?.targetId && current?.placement === nextHint?.placement
        ? current
        : nextHint
    );
  }

  function createChordAssignmentDragOverlay(sourceRow: HTMLDivElement): HTMLElement {
    const overlay = sourceRow.cloneNode(true) as HTMLElement;
    const rect = sourceRow.getBoundingClientRect();
    overlay.classList.add('chords-assignment-drag-overlay');
    overlay.classList.remove('dragging', 'drop-before', 'drop-after');
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    (sourceRow.closest<HTMLElement>('.shell') ?? document.body).appendChild(overlay);
    return overlay;
  }

  function moveChordAssignmentDragOverlay(
    session: ChordAssignmentDragSession,
    clientX: number,
    clientY: number
  ) {
    if (!session.overlay) {
      return;
    }
    session.overlay.style.transform = `translate3d(${clientX - session.offsetX}px, ${
      clientY - session.offsetY
    }px, 0) scale(1.01)`;
  }

  function updateChordAssignmentDropTarget(sourceId: string, _clientX: number, clientY: number) {
    const list = chordAssignmentListRef.current;
    if (!list) {
      setChordAssignmentDragDropHint(null);
      return;
    }
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>('.chords-assignment-row[data-assignment-id]:not(.draft)')
    ).filter((row) => row.dataset.assignmentId !== sourceId);
    if (rows.length === 0) {
      setChordAssignmentDragDropHint(null);
      return;
    }
    let nearest: { targetId: string; placement: 'before' | 'after'; distance: number } | null = null;
    for (const row of rows) {
      const targetId = row.dataset.assignmentId;
      if (!targetId) {
        continue;
      }
      const rect = row.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const placement = clientY > centerY ? 'after' : 'before';
      const edgeY = placement === 'after' ? rect.bottom : rect.top;
      const distance = Math.abs(clientY - edgeY);
      if (!nearest || distance < nearest.distance) {
        nearest = { targetId, placement, distance };
      }
    }
    setChordAssignmentDragDropHint(
      nearest && {
        targetId: nearest.targetId,
        placement: nearest.placement
      }
    );
  }

  function finishChordAssignmentPointerDrag(cancelled = false) {
    const session = chordAssignmentDragRef.current;
    if (!session) {
      return;
    }
    session.cleanup();
    session.overlay?.remove();
    document.body.classList.remove('chords-assignment-pointer-dragging');
    chordAssignmentDragRef.current = null;
    setDraggedChordAssignmentId(null);
    setChordAssignmentDropHint(null);
    if (!cancelled && session.active && session.dropHint) {
      reorderChordAssignment(session.id, session.dropHint.targetId, session.dropHint.placement);
    }
    if (session.active) {
      window.addEventListener(
        'click',
        (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        },
        { capture: true, once: true }
      );
    }
  }

  function startChordAssignmentPointerDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    assignmentId: string
  ) {
    if (pendingAction !== null || event.button !== 0 || chordAssignmentDragRef.current) {
      return;
    }
    const sourceRow = event.currentTarget;
    const rect = sourceRow.getBoundingClientRect();
    const session: ChordAssignmentDragSession = {
      active: false,
      id: assignmentId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      overlay: null,
      startX: event.clientX,
      startY: event.clientY,
      cleanup: () => undefined,
      dropHint: null
    };
    const activate = (clientX: number, clientY: number) => {
      if (session.active) {
        return;
      }
      session.active = true;
      session.overlay = createChordAssignmentDragOverlay(sourceRow);
      document.body.classList.add('chords-assignment-pointer-dragging');
      setDraggedChordAssignmentId(assignmentId);
      moveChordAssignmentDragOverlay(session, clientX, clientY);
    };
    const move = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - session.startX;
      const deltaY = moveEvent.clientY - session.startY;
      if (!session.active && Math.hypot(deltaX, deltaY) < 5) {
        return;
      }
      activate(moveEvent.clientX, moveEvent.clientY);
      moveEvent.preventDefault();
      moveChordAssignmentDragOverlay(session, moveEvent.clientX, moveEvent.clientY);
      updateChordAssignmentDropTarget(assignmentId, moveEvent.clientX, moveEvent.clientY);
    };
    const end = () => finishChordAssignmentPointerDrag(false);
    const cancel = () => finishChordAssignmentPointerDrag(true);
    const keyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        finishChordAssignmentPointerDrag(true);
      }
    };
    session.cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', keyDown);
    };
    chordAssignmentDragRef.current = session;
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', keyDown);
  }

  return {
    chordFunctions,
    chordAssignments,
    selectedChordFunctionId,
    setSelectedChordFunctionId,
    chordFunctionDraft,
    setChordFunctionDraft,
    chordFunctionDialog,
    chordFunctionDialogFunction,
    setChordFunctionDialog,
    chordFunctionNameDraft,
    setChordFunctionNameDraft,
    chordAssignmentDraftRows,
    setChordAssignmentDraftRows,
    draggedChordAssignmentId,
    chordAssignmentDropHint,
    chordAssignmentScrollbar,
    selectedChordFunction,
    defaultChordFunctionId,
    chordFunctionOptions,
    canAddChordDraft,
    chordStarterOptions,
    chordStarterOptionsFor,
    chordAssignmentsSubtitle,
    chordAssignmentConflictState,
    allowedChordButtonsForStarter,
    firstAllowedChordButton,
    commitChordConfiguration,
    createChordFunction,
    commitChordFunctionDraft,
    setChordFunctionKeyboardKey,
    toggleChordFunctionKeyboardModifier,
    setChordFunctionControllerAction,
    setChordFunctionControllerStepPercent,
    renderChordFunctionSummary,
    openChordFunctionDialog,
    closeChordFunctionDialog,
    deleteChordFunction,
    submitChordFunctionDialog,
    commitChordAssignment,
    addChordAssignmentDraft,
    commitChordAssignmentDraft,
    updateChordAssignmentDraftStarter,
    updateChordAssignmentDraftButton,
    updateChordAssignmentDraftFunction,
    deleteChordAssignmentDraft,
    updateChordAssignmentStarter,
    updateChordAssignmentButton,
    setChordAssignmentFunction,
    deleteChordAssignment,
    updateChordAssignmentScrollbar,
    startChordAssignmentScrollbarDrag,
    reorderChordAssignment,
    startChordAssignmentPointerDrag
  };
}

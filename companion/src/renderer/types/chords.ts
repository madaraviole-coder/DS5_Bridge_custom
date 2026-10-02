import type {
  ChordAssignableButtonId,
  ChordControllerSettingAction,
  ChordFunctionType,
  ChordMediaAction,
  ChordStarterId
} from '../../shared/protocol';

export const CHORD_UNASSIGNED_BUTTON = '__unassigned__';

export type ChordKeyboardModifier = 'Ctrl' | 'Shift' | 'Alt' | 'Win';
export type ChordNotchTargetId = 'speaker' | 'mic' | 'haptics' | 'rumble' | 'triggers' | 'lighting';
export type ChordNotchDirection = 'down' | 'up';
export type ChordNotchAction = Extract<ChordControllerSettingAction, `${ChordNotchTargetId}-${ChordNotchDirection}`>;
export type ChordControllerSettingSelectValue = Exclude<ChordControllerSettingAction, ChordNotchAction> | ChordNotchTargetId;

export type ChordFunctionDraft = {
  id: string;
  name: string;
  type: ChordFunctionType;
  keyboardKey: string;
  keyboardModifiers: ChordKeyboardModifier[];
  mediaAction: ChordMediaAction;
  controllerAction: ChordControllerSettingAction;
  controllerStepPercent: number;
};

export type ChordFunctionDialogMode = 'rename' | 'delete';

export type ChordFunctionDialogState = {
  mode: ChordFunctionDialogMode;
  functionId: string;
};

export type ChordButtonSelectValue = ChordAssignableButtonId | typeof CHORD_UNASSIGNED_BUTTON;

export type ChordAssignmentDraftRow = {
  id: string;
  starter: ChordStarterId;
  button: ChordAssignableButtonId | null;
  functionId: string;
};

export type ChordAssignmentDropHint = {
  targetId: string;
  placement: 'before' | 'after';
};

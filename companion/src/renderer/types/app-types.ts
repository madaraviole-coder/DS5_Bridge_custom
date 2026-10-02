import type { TablerIcon } from '@tabler/icons-react';
import type {
  BridgeStatusPayload,
  ChordStarterId,
  RemapButtonId,
  TriggerTestMode,
  TriggerTestTarget
} from '../../shared/protocol';

export * from './chords';

export type ControlTab =
  | 'overview'
  | 'devices'
  | 'haptics'
  | 'audio-haptics'
  | 'audio'
  | 'triggers'
  | 'trigger-lab'
  | 'lighting'
  | 'deadzones'
  | 'remapping'
  | 'chords'
  | 'system';

export type SidebarControlTab = ControlTab;

export type ControlTabDefinition = Readonly<{
  id: SidebarControlTab;
  label: string;
  Icon: TablerIcon;
}>;

export type ControlTabGroupId = 'controller' | 'input' | 'labs';

export type ControlTabGroupDefinition = Readonly<{
  id: ControlTabGroupId;
  label: string;
  Icon: TablerIcon;
  tabs: readonly ControlTabDefinition[];
}>;

export type ControllerType = BridgeStatusPayload['controllerType'];
export type KnownControllerType = Exclude<ControllerType, 'unknown'>;

export type RemapButtonDefinition = {
  id: RemapButtonId;
  label: string;
  glyphUrl?: string;
  textGlyph?: string;
};

export type ChordStarterDefinition = {
  id: ChordStarterId;
  label: string;
  glyphUrl?: string;
  textGlyph?: string;
  Icon?: TablerIcon;
};

export type TargetOnlyRemapButtonId = Extract<RemapButtonId, 'ps' | 'touchpad'>;
export type SourceRemapButtonId = Exclude<RemapButtonId, TargetOnlyRemapButtonId>;
export type DualSenseEdgeRemapButtonId = Extract<SourceRemapButtonId, 'lb' | 'rb' | 'lfn' | 'rfn'>;
export type StandardRemapButtonId = Exclude<SourceRemapButtonId, DualSenseEdgeRemapButtonId>;

export type RemapProfileDialogMode = 'save' | 'rename' | 'delete';
export type ControllerProfileDialogMode = 'save' | 'rename' | 'delete';

export type ChordAssignmentDragSession = {
  active: boolean;
  id: string;
  offsetX: number;
  offsetY: number;
  overlay: HTMLElement | null;
  startX: number;
  startY: number;
  cleanup: () => void;
  dropHint: {
    targetId: string;
    placement: 'before' | 'after';
  } | null;
};

export type ChordAssignmentScrollbarState = {
  visible: boolean;
  top: number;
  height: number;
};

export type TriggerLabProfileDialogMode = 'save' | 'rename' | 'delete';
export type TriggerLabBuiltinProfileId = 'default';
export type TriggerLabCustomProfileId = 'custom' | `custom-${string}`;
export type TriggerLabProfileId = TriggerLabBuiltinProfileId | TriggerLabCustomProfileId;
export type TriggerLabSide = Extract<TriggerTestTarget, 'l2' | 'r2'>;

export type TriggerLabDraft = {
  profileId: TriggerLabProfileId;
  mode: TriggerTestMode;
  startPercent: number;
  wallPercent: number;
  forcePercent: number;
};

export type TriggerLabCustomProfile = {
  id: TriggerLabCustomProfileId;
  name: string;
  mode: TriggerTestMode;
  startPercent: number;
  wallPercent: number;
  forcePercent: number;
  active: boolean;
};

export type TriggerLabProfileDialogState = {
  mode: TriggerLabProfileDialogMode;
  side: TriggerLabSide;
};

export type TriggerLabSplitState = {
  drafts: Record<TriggerLabSide, TriggerLabDraft>;
  active: Record<TriggerLabSide, boolean>;
};

export type TriggerLabWorkspaceState = {
  enabled: boolean;
  linked: boolean;
  drafts: Record<TriggerLabSide, TriggerLabDraft>;
  active: Record<TriggerLabSide, boolean>;
  splitState: TriggerLabSplitState | null;
};

export type TriggerLabInitialState = TriggerLabWorkspaceState & {
  profiles: TriggerLabCustomProfile[];
};

export type RemapCalloutLayout = {
  top: number;
  points: string;
};

export type EdgeRemapControlLayout = {
  left: number;
  top: number;
  anchor: 'top' | 'bottom';
  linePoints: string;
};

export type LightbarPaletteCell = {
  color: string;
  name: string;
};

export type NotificationFocusTarget = 'controller-status' | 'low-battery' | 'all';
export type { SettingsFocusTarget } from '../components/ui/FeatureTipsPanel';

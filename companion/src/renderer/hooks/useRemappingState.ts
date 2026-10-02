import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { RemapButtonId } from '../../shared/protocol';
import type { BridgeSnapshot, TurboSettings } from '../../shared/types';
import {
  DEFAULT_TOUCHPAD_SETTINGS,
  DEFAULT_TOUCHPAD_ZONE_MAPPINGS,
  loadTouchpadSettings,
  saveTouchpadSettings,
  type TouchpadGesture,
  type TouchpadSettings,
  type TouchpadZoneId,
  type TouchpadZoneTarget
} from '../../shared/touchpad-gestures';
import {
  DEFAULT_REMAP_DRAFT,
  REMAP_ALL_BUTTON_IDS,
  REMAP_EDGE_BUTTON_IDS,
  REMAP_EDGE_CONTROL_POINTS,
  REMAP_EDGE_LAYOUT_ASSET,
  REMAP_EDGE_LINE_POINTS,
  REMAP_LEFT_BUTTON_IDS,
  REMAP_RIGHT_BUTTON_IDS,
  REMAP_STANDARD_BUTTON_IDS,
  REMAP_STANDARD_LAYOUT_ASSET
} from '../constants/app-constants';
import type {
  ControlTab,
  DualSenseEdgeRemapButtonId,
  EdgeRemapControlLayout,
  KnownControllerType,
  RemapCalloutLayout,
  RemapProfileDialogMode,
  StandardRemapButtonId
} from '../types/app-types';
import { storedRemapControllerType } from '../utils/tab-helpers';

export interface UseRemappingStateParams {
  snapshot: BridgeSnapshot | null;
  activeControlTab: ControlTab;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  remappingLayoutRef: RefObject<HTMLDivElement | null>;
  remappingLeftSideRef: RefObject<HTMLDivElement | null>;
  remappingRightSideRef: RefObject<HTMLDivElement | null>;
  remappingArtRef: RefObject<HTMLImageElement | null>;
}

export function useRemappingState({
  snapshot,
  activeControlTab,
  runAction,
  remappingLayoutRef,
  remappingLeftSideRef,
  remappingRightSideRef,
  remappingArtRef
}: UseRemappingStateParams) {
  const [remapDraft, setRemapDraft] = useState<Record<RemapButtonId, RemapButtonId>>(DEFAULT_REMAP_DRAFT);
  const [remappingSubTab, setRemappingSubTab] = useState<'buttons' | 'sticks' | 'triggers' | 'touchpad' | 'turbo'>('buttons');
  const [turboSettings, setTurboSettings] = useState<TurboSettings>(() => ({
    enabled: false,
    speedCps: 8,
    humanize: true,
    buttonsMask: 0
  }));
  const [turboTesterActive, setTurboTesterActive] = useState(false);
  const [turboTesterFlash, setTurboTesterFlash] = useState(false);
  const [turboTesterCount, setTurboTesterCount] = useState(0);
  const turboTesterRef = useRef<{ active: boolean; timer: number | null }>({ active: false, timer: null });
  const [touchpadSettings, setTouchpadSettings] = useState<TouchpadSettings>(() =>
    loadTouchpadSettings(window.localStorage)
  );
  const [selectedTouchpadZone, setSelectedTouchpadZone] = useState<TouchpadZoneId>(2);
  const [gesturePreviewActive, setGesturePreviewActive] = useState<boolean>(false);
  const [gestureSequence, setGestureSequence] = useState<number[]>(() => {
    try {
      const saved = loadTouchpadSettings(window.localStorage);
      return saved.gestures[0]?.sequence ?? [1, 2];
    } catch {
      return [1, 2];
    }
  });
  const [touchpadGestureTestFeedback, setTouchpadGestureTestFeedback] = useState<string | null>(null);
  const [turboNewTriggerPickerOpen, setTurboNewTriggerPickerOpen] = useState(false);
  const [selectedTurboActionProfile, setSelectedTurboActionProfile] = useState('Turbo 1');
  const [turboRepeatMode, setTurboRepeatMode] = useState<'hold' | 'toggle' | 'press'>('hold');
  const [turboStartsWhenMode, setTurboStartsWhenMode] = useState<'pressed' | 'held' | 'double'>('pressed');
  const [remapProfileDialogMode, setRemapProfileDialogMode] = useState<RemapProfileDialogMode | null>(null);
  const [remapProfileNameDraft, setRemapProfileNameDraft] = useState('');
  const [remapCalloutLayout, setRemapCalloutLayout] = useState<Record<StandardRemapButtonId, RemapCalloutLayout> | null>(
    null
  );
  const [edgeRemapControlLayout, setEdgeRemapControlLayout] =
    useState<Record<DualSenseEdgeRemapButtonId, EdgeRemapControlLayout> | null>(null);
  const [hoveredRemapButton, setHoveredRemapButton] = useState<RemapButtonId | null>(null);
  const [lastRemapControllerType, setLastRemapControllerType] = useState<KnownControllerType>(storedRemapControllerType);

  const liveControllerType = snapshot?.status?.controllerType;
  const remapControllerType =
    snapshot?.status?.controllerConnected && liveControllerType && liveControllerType !== 'unknown'
      ? liveControllerType
      : lastRemapControllerType;
  const showDualSenseEdgeRemapButtons = remapControllerType === 'dualsense-edge';
  const remapModifiedCount = useMemo(
    () => REMAP_ALL_BUTTON_IDS.filter((buttonId) => remapDraft[buttonId] !== buttonId).length,
    [remapDraft]
  );
  const remappingLayoutAsset = showDualSenseEdgeRemapButtons
    ? REMAP_EDGE_LAYOUT_ASSET
    : REMAP_STANDARD_LAYOUT_ASSET;

  useEffect(() => {
    return () => {
      turboTesterRef.current.active = false;
      if (turboTesterRef.current.timer !== null) {
        window.clearTimeout(turboTesterRef.current.timer);
      }
    };
  }, []);

  useEffect(() => {
    if (activeControlTab !== 'remapping') {
      return;
    }

    const layoutElement = remappingLayoutRef.current;
    const leftSideElement = remappingLeftSideRef.current;
    const rightSideElement = remappingRightSideRef.current;
    const artElement = remappingArtRef.current;
    if (!layoutElement || !leftSideElement || !rightSideElement || !artElement) {
      return;
    }

    function updateRemapCalloutPositions() {
      if (!layoutElement || !leftSideElement || !rightSideElement || !artElement) {
        return;
      }

      const layoutRect = layoutElement.getBoundingClientRect();
      const leftRect = leftSideElement.getBoundingClientRect();
      const rightRect = rightSideElement.getBoundingClientRect();
      const artRect = artElement.getBoundingClientRect();
      if (!layoutRect.width || !layoutRect.height || !artRect.width || !artRect.height) {
        return;
      }

      const layoutScaleX = (layoutRect.width || layoutElement.offsetWidth || 1) / (layoutElement.offsetWidth || 1);
      const layoutScaleY =
        (layoutRect.height || layoutElement.offsetHeight || 1) / (layoutElement.offsetHeight || 1);
      const toLocalX = (clientX: number) => (clientX - layoutRect.left) / layoutScaleX;
      const toLocalY = (clientY: number) => (clientY - layoutRect.top) / layoutScaleY;
      const artLeft = toLocalX(artRect.left);
      const artTop = toLocalY(artRect.top);
      const artWidth = artRect.width / layoutScaleX;
      const artHeight = artRect.height / layoutScaleY;
      const leftTop = toLocalY(leftRect.top);
      const rightTop = toLocalY(rightRect.top);
      const viewBoxAspect = remappingLayoutAsset.viewBoxWidth / remappingLayoutAsset.viewBoxHeight;
      const renderedSvgHeight = Math.min(artHeight, artWidth / viewBoxAspect);
      const renderedSvgWidth = renderedSvgHeight * viewBoxAspect;
      const renderedSvgTop = artTop + (artHeight - renderedSvgHeight) / 2;
      const renderedSvgLeft = artLeft + (artWidth - renderedSvgWidth) / 2;
      const nextLayout = {} as Record<StandardRemapButtonId, RemapCalloutLayout>;
      const mapSvgPoint = ([x, y]: [number, number]) =>
        `${renderedSvgLeft + (x / remappingLayoutAsset.viewBoxWidth) * renderedSvgWidth},${
          renderedSvgTop + (y / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight
        }`;
      const mapSvgX = (x: number) =>
        renderedSvgLeft + (x / remappingLayoutAsset.viewBoxWidth) * renderedSvgWidth;
      const mapSvgY = (y: number) =>
        renderedSvgTop + (y / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight;
      const remapPillEdgeX = (side: HTMLElement, buttonId: StandardRemapButtonId, edge: 'left' | 'right') => {
        const pill = side.querySelector<HTMLElement>(`[data-remap-button-id="${buttonId}"]`);
        if (!pill) {
          return edge === 'right'
            ? toLocalX(side.getBoundingClientRect().right)
            : toLocalX(side.getBoundingClientRect().left);
        }
        const pillRect = pill.getBoundingClientRect();
        return toLocalX(edge === 'right' ? pillRect.right : pillRect.left);
      };

      for (const buttonId of REMAP_LEFT_BUTTON_IDS) {
        const top =
          renderedSvgTop +
          (remappingLayoutAsset.calloutY[buttonId] / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight -
          leftTop;
        const pillRightX = remapPillEdgeX(leftSideElement, buttonId, 'right');
        nextLayout[buttonId] = {
          top,
          points: [`${pillRightX},${leftTop + top}`, ...remappingLayoutAsset.calloutPoints[buttonId].map(mapSvgPoint)].join(
            ' '
          )
        };
      }
      for (const buttonId of REMAP_RIGHT_BUTTON_IDS) {
        const top =
          renderedSvgTop +
          (remappingLayoutAsset.calloutY[buttonId] / remappingLayoutAsset.viewBoxHeight) * renderedSvgHeight -
          rightTop;
        const pillLeftX = remapPillEdgeX(rightSideElement, buttonId, 'left');
        nextLayout[buttonId] = {
          top,
          points: [
            `${pillLeftX},${rightTop + top}`,
            ...remappingLayoutAsset.calloutPoints[buttonId].map(mapSvgPoint)
          ].join(' ')
        };
      }

      setRemapCalloutLayout((current) => {
        if (
          current &&
          REMAP_STANDARD_BUTTON_IDS.every(
            (buttonId) =>
              Math.abs(current[buttonId].top - nextLayout[buttonId].top) < 0.5 &&
              current[buttonId].points === nextLayout[buttonId].points
          )
        ) {
          return current;
        }
        return nextLayout;
      });

      if (showDualSenseEdgeRemapButtons) {
        const nextEdgeLayout = {} as Record<DualSenseEdgeRemapButtonId, EdgeRemapControlLayout>;
        for (const buttonId of REMAP_EDGE_BUTTON_IDS) {
          const point = REMAP_EDGE_CONTROL_POINTS[buttonId];
          nextEdgeLayout[buttonId] = {
            left: mapSvgX(point.x),
            top: mapSvgY(point.y),
            anchor: point.anchor,
            linePoints: REMAP_EDGE_LINE_POINTS[buttonId].map(mapSvgPoint).join(' ')
          };
        }
        setEdgeRemapControlLayout((current) => {
          if (
            current &&
            REMAP_EDGE_BUTTON_IDS.every(
              (buttonId) =>
                Math.abs(current[buttonId].left - nextEdgeLayout[buttonId].left) < 0.5 &&
                Math.abs(current[buttonId].top - nextEdgeLayout[buttonId].top) < 0.5 &&
                current[buttonId].anchor === nextEdgeLayout[buttonId].anchor &&
                current[buttonId].linePoints === nextEdgeLayout[buttonId].linePoints
            )
          ) {
            return current;
          }
          return nextEdgeLayout;
        });
      } else {
        setEdgeRemapControlLayout(null);
      }
    }

    updateRemapCalloutPositions();
    const resizeObserver = new ResizeObserver(updateRemapCalloutPositions);
    resizeObserver.observe(leftSideElement);
    resizeObserver.observe(rightSideElement);
    resizeObserver.observe(layoutElement);
    resizeObserver.observe(artElement);
    window.addEventListener('resize', updateRemapCalloutPositions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateRemapCalloutPositions);
    };
  }, [activeControlTab, remappingLayoutAsset, showDualSenseEdgeRemapButtons]);

  function setButtonRemap(buttonId: RemapButtonId, targetId: RemapButtonId) {
    setRemapDraft((draft) => ({ ...draft, [buttonId]: targetId }));
    void runAction(`remap-${buttonId}`, () => window.bridge.setButtonRemap(buttonId, targetId));
  }

  function restoreButtonRemappingDefaults() {
    void runAction('remap-restore', () => window.bridge.restoreButtonRemappingDefaults());
  }

  function updateTouchpadSettings(updater: (prev: TouchpadSettings) => TouchpadSettings) {
    setTouchpadSettings((prev) => {
      const next = updater(prev);
      saveTouchpadSettings(window.localStorage, next);
      if (typeof window !== 'undefined' && window.bridge?.setTouchpadZoneConfig) {
        void runAction('touchpad-config', () => window.bridge.setTouchpadZoneConfig(next));
      }
      return next;
    });
  }

  function handleTouchpadZoneClick(zone: TouchpadZoneId) {
    setSelectedTouchpadZone(zone);
    if (touchpadSettings.mode === 'swipe') {
      setGestureSequence((prev) => {
        if (prev.length >= 6) return [zone];
        const next = [...prev, zone];
        updateTouchpadSettings((s) => ({
          ...s,
          gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, sequence: next } : g))
        }));
        return next;
      });
    }
  }

  function handleSetTouchpadZoneMapping(zone: TouchpadZoneId, target: TouchpadZoneTarget) {
    updateTouchpadSettings((prev) => ({
      ...prev,
      zoneMappings: {
        ...prev.zoneMappings,
        [zone]: target
      }
    }));
  }

  function handleApplyTouchpadPreset(preset: 'face' | 'dpad' | 'shoulders' | 'default') {
    let mappings;
    if (preset === 'face') {
      mappings = {
        1: 'triangle' as TouchpadZoneTarget,
        2: 'circle' as TouchpadZoneTarget,
        3: 'square' as TouchpadZoneTarget,
        4: 'cross' as TouchpadZoneTarget
      };
    } else if (preset === 'dpad') {
      mappings = {
        1: 'dpad-up' as TouchpadZoneTarget,
        2: 'dpad-right' as TouchpadZoneTarget,
        3: 'dpad-left' as TouchpadZoneTarget,
        4: 'dpad-down' as TouchpadZoneTarget
      };
    } else if (preset === 'shoulders') {
      mappings = {
        1: 'l1' as TouchpadZoneTarget,
        2: 'r1' as TouchpadZoneTarget,
        3: 'l2' as TouchpadZoneTarget,
        4: 'r2' as TouchpadZoneTarget
      };
    } else {
      mappings = { ...DEFAULT_TOUCHPAD_ZONE_MAPPINGS };
    }
    updateTouchpadSettings((prev) => ({
      ...prev,
      zoneMappings: mappings
    }));
  }

  function handlePlayGesturePreview() {
    setGesturePreviewActive(true);
    window.setTimeout(() => {
      setGesturePreviewActive(false);
    }, 1200);
  }

  function handleClearGestureSequence() {
    setGestureSequence([]);
    updateTouchpadSettings((s) => ({
      ...s,
      gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, sequence: [] } : g))
    }));
  }

  function handleSelectGestureSequencePreset(presetSeq: number[]) {
    setGestureSequence(presetSeq);
    updateTouchpadSettings((s) => ({
      ...s,
      gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, sequence: presetSeq } : g))
    }));
    handlePlayGesturePreview();
  }

  function handleUpdateGestureActionType(actionType: TouchpadGesture['actionType']) {
    let defaultValue = '';
    if (actionType === 'windows-shortcut') defaultValue = 'toggle-hdr';
    else if (actionType === 'media') defaultValue = 'play-pause';
    else if (actionType === 'button') defaultValue = 'triangle';
    else if (actionType === 'custom-keys') defaultValue = 'CTRL+SHIFT+O';

    updateTouchpadSettings((s) => ({
      ...s,
      gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, actionType, actionValue: defaultValue } : g))
    }));
  }

  function handleUpdateGestureActionValue(actionValue: string) {
    updateTouchpadSettings((s) => ({
      ...s,
      gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, actionValue } : g))
    }));
  }

  function handleUpdateGestureName(name: string) {
    updateTouchpadSettings((s) => ({
      ...s,
      gestures: s.gestures.map((g, idx) => (idx === 0 ? { ...g, name } : g))
    }));
  }

  async function handleTestTouchpadGesture() {
    const currentGesture = touchpadSettings.gestures[0];
    if (!currentGesture) return;
    try {
      if (window.bridge?.executeTouchpadGesture) {
        await window.bridge.executeTouchpadGesture(currentGesture);
      }
      setTouchpadGestureTestFeedback('Action Executed!');
      window.setTimeout(() => setTouchpadGestureTestFeedback(null), 2200);
    } catch {
      setTouchpadGestureTestFeedback('Failed to execute');
      window.setTimeout(() => setTouchpadGestureTestFeedback(null), 2200);
    }
  }

  const zoneCoords: Record<TouchpadZoneId, { x: number; y: number }> = {
    1: { x: 96, y: 48 },
    2: { x: 304, y: 48 },
    3: { x: 96, y: 158 },
    4: { x: 304, y: 158 }
  };

  const swipePathD = useMemo(() => {
    if (gestureSequence.length < 2) return '';
    let d = `M ${zoneCoords[gestureSequence[0] as TouchpadZoneId]?.x ?? 96} ${
      zoneCoords[gestureSequence[0] as TouchpadZoneId]?.y ?? 48
    }`;
    for (let i = 1; i < gestureSequence.length; i++) {
      const pt = zoneCoords[gestureSequence[i] as TouchpadZoneId];
      if (pt) {
        d += ` L ${pt.x} ${pt.y}`;
      }
    }
    return d;
  }, [gestureSequence]);

  const turboIntervalMs = Math.round(1000 / Math.max(2, Math.min(30, turboSettings.speedCps)));

  function handleSetTurboInterval(intervalMs: number) {
    const clamped = Math.max(33, Math.min(500, Math.round(intervalMs)));
    const speedCps = Math.max(2, Math.min(30, Math.round(1000 / clamped)));
    handleSetTurboSpeed(speedCps);
  }

  function handleAddTurboTrigger(mask: number) {
    updateTurboSettings((prev) => ({
      ...prev,
      buttonsMask: prev.buttonsMask | mask
    }));
    setTurboNewTriggerPickerOpen(false);
  }

  function handleRemoveTurboTrigger(mask: number) {
    updateTurboSettings((prev) => ({
      ...prev,
      buttonsMask: prev.buttonsMask & ~mask
    }));
  }

  function updateTurboSettings(updater: (prev: TurboSettings) => TurboSettings) {
    setTurboSettings((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined' && window.bridge?.setTurboConfig) {
        void runAction('turbo-config', () => window.bridge.setTurboConfig(next));
      }
      return next;
    });
  }

  function handleToggleTurboMaster() {
    updateTurboSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled
    }));
  }

  function handleSetTurboSpeed(speedCps: number) {
    updateTurboSettings((prev) => ({
      ...prev,
      speedCps: Math.max(2, Math.min(30, Math.round(speedCps)))
    }));
  }

  function handleToggleTurboHumanize() {
    updateTurboSettings((prev) => ({
      ...prev,
      humanize: !prev.humanize
    }));
  }

  function handleToggleTurboButton(buttonMask: number) {
    updateTurboSettings((prev) => ({
      ...prev,
      buttonsMask: prev.buttonsMask ^ buttonMask
    }));
  }

  function startTurboTester() {
    if (turboTesterRef.current.active) return;
    turboTesterRef.current.active = true;
    setTurboTesterActive(true);
    setTurboTesterCount(0);

    const tick = () => {
      if (!turboTesterRef.current.active) return;
      setTurboTesterCount((c) => c + 1);
      setTurboTesterFlash(true);
      window.setTimeout(() => setTurboTesterFlash(false), 35);

      const baseMs = 1000 / Math.max(2, Math.min(30, turboSettings.speedCps));
      const jitterPct = turboSettings.humanize ? (Math.random() * 30 - 15) / 100 : 0;
      const nextDelay = Math.max(15, Math.round(baseMs * (1 + jitterPct)));
      turboTesterRef.current.timer = window.setTimeout(tick, nextDelay);
    };

    tick();
  }

  function stopTurboTester() {
    turboTesterRef.current.active = false;
    if (turboTesterRef.current.timer !== null) {
      window.clearTimeout(turboTesterRef.current.timer);
      turboTesterRef.current.timer = null;
    }
    setTurboTesterActive(false);
  }

  function selectButtonRemappingProfile(profileId: string) {
    void runAction('remap-profile', () => window.bridge.selectButtonRemappingProfile(profileId));
  }

  const selectedRemapProfile = snapshot?.settings.buttonRemappingProfiles.find(
    (profile) => profile.id === snapshot.settings.selectedButtonRemappingProfileId
  );
  const selectedRemapProfileId = selectedRemapProfile?.id ?? 'default';
  const selectedRemapProfileIsDefault = selectedRemapProfileId === 'default';

  function renameButtonRemappingProfile() {
    if (!selectedRemapProfile || selectedRemapProfileIsDefault) {
      return;
    }
    setRemapProfileNameDraft(selectedRemapProfile.name);
    setRemapProfileDialogMode('rename');
  }

  function saveButtonRemappingProfile() {
    setRemapProfileNameDraft(`Custom Profile ${snapshot?.settings.buttonRemappingProfiles.length ?? 1}`);
    setRemapProfileDialogMode('save');
  }

  function deleteButtonRemappingProfile() {
    if (!selectedRemapProfile || selectedRemapProfileIsDefault) {
      return;
    }
    setRemapProfileDialogMode('delete');
  }

  function closeRemapProfileDialog() {
    setRemapProfileDialogMode(null);
    setRemapProfileNameDraft('');
  }

  function submitRemapProfileDialog() {
    if (!selectedRemapProfile && remapProfileDialogMode !== 'save') {
      return;
    }
    if (remapProfileDialogMode === 'save') {
      const nextName = remapProfileNameDraft.trim();
      if (!nextName) {
        return;
      }
      closeRemapProfileDialog();
      void runAction('remap-save-profile', () => window.bridge.saveButtonRemappingProfile(nextName));
      return;
    }
    if (remapProfileDialogMode === 'rename' && selectedRemapProfile && !selectedRemapProfileIsDefault) {
      const nextName = remapProfileNameDraft.trim();
      if (!nextName || nextName === selectedRemapProfile.name) {
        closeRemapProfileDialog();
        return;
      }
      closeRemapProfileDialog();
      void runAction('remap-rename-profile', () =>
        window.bridge.renameButtonRemappingProfile(selectedRemapProfile.id, nextName)
      );
      return;
    }
    if (remapProfileDialogMode === 'delete' && selectedRemapProfile && !selectedRemapProfileIsDefault) {
      closeRemapProfileDialog();
      void runAction('remap-delete-profile', () =>
        window.bridge.deleteButtonRemappingProfile(selectedRemapProfile.id)
      );
    }
  }

  return {
    remapDraft,
    setRemapDraft,
    remappingSubTab,
    setRemappingSubTab,
    turboSettings,
    setTurboSettings,
    turboTesterActive,
    turboTesterFlash,
    turboTesterCount,
    touchpadSettings,
    setTouchpadSettings,
    selectedTouchpadZone,
    setSelectedTouchpadZone,
    gesturePreviewActive,
    gestureSequence,
    touchpadGestureTestFeedback,
    turboNewTriggerPickerOpen,
    setTurboNewTriggerPickerOpen,
    selectedTurboActionProfile,
    setSelectedTurboActionProfile,
    turboRepeatMode,
    setTurboRepeatMode,
    turboStartsWhenMode,
    setTurboStartsWhenMode,
    remapProfileDialogMode,
    setRemapProfileDialogMode,
    remapProfileNameDraft,
    setRemapProfileNameDraft,
    remapCalloutLayout,
    edgeRemapControlLayout,
    hoveredRemapButton,
    setHoveredRemapButton,
    lastRemapControllerType,
    setLastRemapControllerType,
    remapControllerType,
    showDualSenseEdgeRemapButtons,
    remapModifiedCount,
    remappingLayoutAsset,
    swipePathD,
    turboIntervalMs,
    setButtonRemap,
    restoreButtonRemappingDefaults,
    updateTouchpadSettings,
    handleTouchpadZoneClick,
    handleSetTouchpadZoneMapping,
    handleApplyTouchpadPreset,
    handlePlayGesturePreview,
    handleClearGestureSequence,
    handleSelectGestureSequencePreset,
    handleUpdateGestureActionType,
    handleUpdateGestureActionValue,
    handleUpdateGestureName,
    handleTestTouchpadGesture,
    handleSetTurboInterval,
    handleAddTurboTrigger,
    handleRemoveTurboTrigger,
    updateTurboSettings,
    handleToggleTurboMaster,
    handleSetTurboSpeed,
    handleToggleTurboHumanize,
    handleToggleTurboButton,
    startTurboTester,
    stopTurboTester,
    selectButtonRemappingProfile,
    selectedRemapProfile,
    renameButtonRemappingProfile,
    saveButtonRemappingProfile,
    deleteButtonRemappingProfile,
    closeRemapProfileDialog,
    submitRemapProfileDialog
  };
}

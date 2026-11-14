import { useEffect, useMemo, useRef, useState } from 'react';
import type { BridgeSnapshot, TurboSettings } from '@shared/types';
import { DEFAULT_TURBO_SETTINGS } from '@shared/types';
import {
  DEFAULT_TOUCHPAD_SETTINGS,
  DEFAULT_TOUCHPAD_ZONE_MAPPINGS,
  loadTouchpadSettings,
  saveTouchpadSettings,
  type TouchpadGesture,
  type TouchpadSettings,
  type TouchpadZoneId,
  type TouchpadZoneTarget
} from '@shared/touchpad-gestures';
import type { RemappingTouchpadSubTabProps } from '../../pages/remapping/RemappingTouchpadSubTab';
import type { RemappingTurboSubTabProps } from '../../pages/remapping/RemappingTurboSubTab';

export type RemappingSubTab = 'buttons' | 'touchpad' | 'turbo';

export interface ButtonRemappingSubTabsRuntime {
  snapshot: BridgeSnapshot | null;
  runAction: (label: string, action: () => Promise<any>) => Promise<any>;
}

const ZONE_COORDS: Record<TouchpadZoneId, { x: number; y: number }> = {
  1: { x: 96, y: 48 },
  2: { x: 304, y: 48 },
  3: { x: 96, y: 158 },
  4: { x: 304, y: 158 }
};

export function useButtonRemappingSubTabs(
  runtime: ButtonRemappingSubTabsRuntime,
  setActiveControlTab?: (tab: any) => void
) {
  const { snapshot, runAction } = runtime;
  const [remappingSubTab, setRemappingSubTab] = useState<RemappingSubTab>('buttons');

  // --- TURBO STATE ---
  const [turboSettings, setTurboSettings] = useState<TurboSettings>(() =>
    snapshot?.settings?.turboSettings ?? { ...DEFAULT_TURBO_SETTINGS }
  );
  const [turboTesterActive, setTurboTesterActive] = useState(false);
  const [turboTesterFlash, setTurboTesterFlash] = useState(false);
  const [turboTesterCount, setTurboTesterCount] = useState(0);
  const turboTesterRef = useRef<{ active: boolean; timer: number | null }>({ active: false, timer: null });
  const [turboNewTriggerPickerOpen, setTurboNewTriggerPickerOpen] = useState(false);
  const [selectedTurboActionProfile, setSelectedTurboActionProfile] = useState('Turbo 1');
  const [turboRepeatMode, setTurboRepeatMode] = useState<'hold' | 'toggle' | 'press'>('hold');
  const [turboStartsWhenMode, setTurboStartsWhenMode] = useState<'pressed' | 'held' | 'double'>('pressed');

  // --- TOUCHPAD STATE ---
  const [touchpadSettings, setTouchpadSettings] = useState<TouchpadSettings>(() => {
    if (snapshot?.settings?.touchpadSettings) {
      return snapshot.settings.touchpadSettings;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return loadTouchpadSettings(window.localStorage);
    }
    return { ...DEFAULT_TOUCHPAD_SETTINGS };
  });
  const [selectedTouchpadZone, setSelectedTouchpadZone] = useState<TouchpadZoneId>(2);
  const [gesturePreviewActive, setGesturePreviewActive] = useState(false);
  // ponytail: gestureSequence targets gestures[0]; upgrade to gesture-profile selector if multiple custom gestures needed
  const [gestureSequence, setGestureSequence] = useState<number[]>(() => {
    try {
      const saved = snapshot?.settings?.touchpadSettings ??
        (typeof window !== 'undefined' && window.localStorage ? loadTouchpadSettings(window.localStorage) : DEFAULT_TOUCHPAD_SETTINGS);
      return saved.gestures?.[0]?.sequence ?? [1, 2];
    } catch {
      return [1, 2];
    }
  });
  const [touchpadGestureTestFeedback, setTouchpadGestureTestFeedback] = useState<string | null>(null);

  // Sync state if snapshot updates from bridge
  useEffect(() => {
    if (snapshot?.settings?.turboSettings) {
      setTurboSettings(snapshot.settings.turboSettings);
    }
  }, [snapshot?.settings?.turboSettings]);

  useEffect(() => {
    if (snapshot?.settings?.touchpadSettings) {
      setTouchpadSettings(snapshot.settings.touchpadSettings);
    }
  }, [snapshot?.settings?.touchpadSettings]);

  useEffect(() => {
    return () => {
      turboTesterRef.current.active = false;
      if (turboTesterRef.current.timer !== null) {
        window.clearTimeout(turboTesterRef.current.timer);
      }
    };
  }, []);

  // --- TOUCHPAD ACTIONS ---
  function updateTouchpadSettings(updater: (prev: TouchpadSettings) => TouchpadSettings) {
    setTouchpadSettings((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined' && window.localStorage) {
        saveTouchpadSettings(window.localStorage, next);
      }
      void runAction('touchpad-config', () => (window as any).bridge?.setTouchpadZoneConfig?.(next));
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
    let mappings: Record<TouchpadZoneId, TouchpadZoneTarget>;
    if (preset === 'face') {
      mappings = {
        1: 'triangle',
        2: 'circle',
        3: 'square',
        4: 'cross'
      };
    } else if (preset === 'dpad') {
      mappings = {
        1: 'dpad-up',
        2: 'dpad-right',
        3: 'dpad-left',
        4: 'dpad-down'
      };
    } else if (preset === 'shoulders') {
      mappings = {
        1: 'l1',
        2: 'r1',
        3: 'l2',
        4: 'r2'
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

  async function handleTestTouchpadGesture() {
    const currentGesture = touchpadSettings.gestures[0];
    if (!currentGesture) return;
    try {
      if (typeof window !== 'undefined' && (window as any).bridge?.executeTouchpadGesture) {
        await (window as any).bridge.executeTouchpadGesture(currentGesture);
      }
      setTouchpadGestureTestFeedback('Action Executed!');
      window.setTimeout(() => setTouchpadGestureTestFeedback(null), 2200);
    } catch {
      setTouchpadGestureTestFeedback('Failed to execute');
      window.setTimeout(() => setTouchpadGestureTestFeedback(null), 2200);
    }
  }

  const swipePathD = useMemo(() => {
    if (gestureSequence.length < 2) return '';
    let d = `M ${ZONE_COORDS[gestureSequence[0] as TouchpadZoneId]?.x ?? 96} ${
      ZONE_COORDS[gestureSequence[0] as TouchpadZoneId]?.y ?? 48
    }`;
    for (let i = 1; i < gestureSequence.length; i++) {
      const pt = ZONE_COORDS[gestureSequence[i] as TouchpadZoneId];
      if (pt) {
        d += ` L ${pt.x} ${pt.y}`;
      }
    }
    return d;
  }, [gestureSequence]);

  // --- TURBO ACTIONS ---
  const turboIntervalMs = Math.round(1000 / Math.max(2, Math.min(30, turboSettings.speedCps)));

  function updateTurboSettings(updater: (prev: TurboSettings) => TurboSettings) {
    setTurboSettings((prev) => {
      const next = updater(prev);
      void runAction('turbo-config', () => (window as any).bridge?.setTurboConfig?.(next));
      return next;
    });
  }

  function handleSetTurboInterval(intervalMs: number) {
    const clamped = Math.max(33, Math.min(500, Math.round(intervalMs)));
    const speedCps = Math.max(2, Math.min(30, Math.round(1000 / clamped)));
    handleSetTurboSpeed(speedCps);
  }

  function handleSetTurboSpeed(speedCps: number) {
    updateTurboSettings((prev) => ({
      ...prev,
      speedCps: Math.max(2, Math.min(30, Math.round(speedCps)))
    }));
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

  function handleToggleTurboMaster() {
    updateTurboSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled
    }));
  }

  function handleToggleTurboHumanize() {
    updateTurboSettings((prev) => ({
      ...prev,
      humanize: !prev.humanize
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
    setTurboTesterFlash(false);
  }

  const touchpadProps: RemappingTouchpadSubTabProps = {
    touchpadSettings,
    updateTouchpadSettings,
    selectedTouchpadZone,
    setSelectedTouchpadZone,
    handleTouchpadZoneClick,
    swipePathD,
    gesturePreviewActive,
    gestureSequence,
    zoneCoords: ZONE_COORDS,
    handlePlayGesturePreview,
    handleClearGestureSequence,
    handleSelectGestureSequencePreset,
    touchpadGestureTestFeedback,
    handleTestTouchpadGesture,
    handleUpdateGestureActionType,
    handleUpdateGestureActionValue,
    handleApplyTouchpadPreset,
    handleSetTouchpadZoneMapping
  };

  const turboProps: RemappingTurboSubTabProps = {
    setActiveControlTab: setActiveControlTab ?? (() => {}),
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
  };

  return {
    remappingSubTab,
    setRemappingSubTab,
    touchpadProps,
    turboProps
  };
}

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  IconDeviceGamepad2,
  IconFlask2,
  IconVolume,
  IconVolumeOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconMusic,
  IconCamera,
  IconSparkles,
  IconBrandDiscord,
  IconBrandSpotify,
  IconActivity,
  IconVideo,
  IconKeyboard,
  IconBolt,
  IconFolder
} from '@tabler/icons-react';
import {
  type BridgeSnapshot,
  type GyroSettings,
  type KitsuneBarItemConfig,
  DEFAULT_KITSUNE_BAR_MODULES
} from '../../../shared/types';
import { batteryLabel, isChargingPowerState } from '../../utils/controller-status';
import { KitsuneDockBar } from './KitsuneDockBar';
import { KitsuneKeyboard } from './KitsuneKeyboard';
import {
  KITSUNE_KEYBOARD_ROWS,
  applyBackspaceAtCaret,
  applyCaretLeft,
  applyCaretRight,
  handleKeyboardNavAction,
  isKeyboardFlyout,
  moveKeyboardFocus,
  type KeyboardCell,
  type KitsuneNavAction
} from './kitsune-bar-keyboard';
import { clampVolumePercent } from './kitsune-bar-volume';
// speakerVolumePercent must not drive System Volume UI — see kitsune-bar-volume.ts

const DEFAULT_GYRO: GyroSettings = {
  enabled: false,
  sensitivityYaw: 1.0,
  sensitivityPitch: 1.0,
  deadzone: 2,
  smoothFilter: 4,
  activationMode: 'always-on',
  activationButton: 'l2',
  triggerThresholdPercent: 10,
  flickStickEnabled: false,
  flickStickThresholdPercent: 85,
  flickStickSnapDegrees: 45,
  flickStickTurnMode: 'smooth',
  flickStickSmoothDurationMs: 100,
  invertPitch: false,
  invertYaw: false
};

export function KitsuneBarOverlay() {
  const [snapshot, setSnapshot] = useState<BridgeSnapshot | null>(null);
  const [haptics, setHaptics] = useState(100);
  const [volume, setVolume] = useState(50);
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState(1);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [virtualText, setVirtualText] = useState('');
  const [textCaret, setTextCaret] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [keyRow, setKeyRow] = useState(0);
  const [keyCol, setKeyCol] = useState(0);
  const [shiftLatch, setShiftLatch] = useState(false);
  const [moveKeyboardMode, setMoveKeyboardMode] = useState(false);
  const [gyroMouseOn, setGyroMouseOn] = useState(false);
  const [gyroError, setGyroError] = useState<string | null>(null);
  const [stickVolumeActive, setStickVolumeActive] = useState(false);

  const volumeRef = useRef(volume);
  const volumeCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAudibleVolumeRef = useRef(50);
  const virtualTextRef = useRef(virtualText);
  const textCaretRef = useRef(textCaret);
  const shiftLatchRef = useRef(shiftLatch);
  const keyRowRef = useRef(keyRow);
  const keyColRef = useRef(keyCol);
  const activeFlyoutRef = useRef(activeFlyout);
  const focusedIndexRef = useRef(focusedIndex);
  const moveKeyboardModeRef = useRef(moveKeyboardMode);
  const gyroMouseOnRef = useRef(gyroMouseOn);
  const snapshotRef = useRef(snapshot);
  const layerItemsRef = useRef<KitsuneBarItemConfig[]>([]);
  const allItemsRef = useRef<KitsuneBarItemConfig[]>([]);

  volumeRef.current = volume;
  virtualTextRef.current = virtualText;
  textCaretRef.current = textCaret;
  shiftLatchRef.current = shiftLatch;
  keyRowRef.current = keyRow;
  keyColRef.current = keyCol;
  activeFlyoutRef.current = activeFlyout;
  focusedIndexRef.current = focusedIndex;
  moveKeyboardModeRef.current = moveKeyboardMode;
  gyroMouseOnRef.current = gyroMouseOn;
  snapshotRef.current = snapshot;

  useEffect(() => {
    let unmounted = false;
    const applySnapshot = (s: BridgeSnapshot | null | undefined) => {
      if (!unmounted && s) {
        setSnapshot(s);
        setHaptics(s.settings.hapticsGainPercent);
        // Volume UI uses Windows system volume (get/setSystemVolume), not speakerVolumePercent.
        if (s.settings.kitsuneBarSettings?.activeLayer) {
          setActiveLayer(s.settings.kitsuneBarSettings.activeLayer);
        }
        if (s.settings.gyroSettings) {
          setGyroMouseOn(Boolean(s.settings.gyroSettings.enabled));
        }
      }
    };

    const applySystemVolume = (current: number) => {
      if (unmounted) return;
      const clamped = clampVolumePercent(current);
      setVolume(clamped);
      volumeRef.current = clamped;
      if (clamped > 0) lastAudibleVolumeRef.current = clamped;
      setVolumeError(null);
    };

    void window.bridge.getStatus().then(applySnapshot);
    void window.bridge.getSystemVolume?.().then(applySystemVolume).catch((error: unknown) => {
      if (!unmounted) {
        setVolumeError(error instanceof Error ? error.message : String(error));
      }
    });
    const unsubscribe = window.bridge.onSnapshot(applySnapshot);
    const heartbeat = setInterval(() => {
      void window.bridge.getStatus().then(applySnapshot);
    }, 1000);

    return () => {
      unmounted = true;
      clearInterval(heartbeat);
      unsubscribe();
    };
  }, []);

  const handleClose = () => {
    setActiveFlyout(null);
    void window.bridge.resizeKitsuneBar(780, 64);
    void window.bridge.toggleKitsuneBar();
  };

  useEffect(() => {
    let height = 64;
    if (activeFlyout) {
      if (isKeyboardFlyout(activeFlyout)) {
        height = 420;
      } else if (['performance-hud', 'activity', 'spotify-widget', 'spotify'].includes(activeFlyout)) {
        height = 300;
      } else {
        height = 250;
      }
    }
    void window.bridge.resizeKitsuneBar(780, height);
  }, [activeFlyout]);

  useEffect(() => {
    if (isKeyboardFlyout(activeFlyout)) {
      setKeyRow(0);
      setKeyCol(0);
      setShiftLatch(false);
      setMoveKeyboardMode(false);
    }
  }, [activeFlyout]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const insideBar = target.closest('.kitsune-bar-overlay-bar');
      const insideFlyout = target.closest('.kitsune-bar-overlay-flyout');
      if (!insideBar && !insideFlyout) {
        setActiveFlyout(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeFlyout) {
          setActiveFlyout(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFlyout]);

  const handleHapticsChange = (val: number) => {
    setHaptics(val);
    void window.bridge.setHapticsGain(val);
  };

  const commitSystemVolume = async (val: number) => {
    const clamped = clampVolumePercent(val);
    setVolume(clamped);
    volumeRef.current = clamped;
    if (clamped > 0) {
      lastAudibleVolumeRef.current = clamped;
    }
    try {
      const applied = clampVolumePercent(await window.bridge.setSystemVolume(clamped));
      setVolume(applied);
      volumeRef.current = applied;
      if (applied > 0) {
        lastAudibleVolumeRef.current = applied;
      }
      setVolumeError(null);
    } catch (error) {
      setVolumeError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleVolumeChange = (val: number) => {
    const clamped = clampVolumePercent(val);
    setVolume(clamped);
    volumeRef.current = clamped;
    if (volumeCommitRef.current) {
      clearTimeout(volumeCommitRef.current);
    }
    volumeCommitRef.current = setTimeout(() => {
      volumeCommitRef.current = null;
      void commitSystemVolume(clamped);
    }, 120);
  };

  useEffect(() => {
    if (activeFlyout !== 'audio') return;
    let cancelled = false;
    void window.bridge.getSystemVolume?.().then((current) => {
      if (cancelled) return;
      const clamped = clampVolumePercent(current);
      setVolume(clamped);
      volumeRef.current = clamped;
      if (clamped > 0) lastAudibleVolumeRef.current = clamped;
      setVolumeError(null);
    }).catch((error: unknown) => {
      if (!cancelled) {
        setVolumeError(error instanceof Error ? error.message : String(error));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeFlyout]);

  const rawSettings = snapshot?.settings.kitsuneBarSettings;
  const totalLayers = rawSettings?.totalLayers ?? 2;
  const items: KitsuneBarItemConfig[] = useMemo(() => {
    if (rawSettings?.items && Array.isArray(rawSettings.items) && rawSettings.items.length > 0) {
      return rawSettings.items;
    }
    return DEFAULT_KITSUNE_BAR_MODULES;
  }, [rawSettings?.items]);

  const currentItem = items.find((i) => i.id === activeFlyout);

  const layerItems = items
    .filter((it) => it.layer === activeLayer && it.enabled)
    .sort((a, b) => a.order - b.order);

  const cycleLayer = (dir: 'up' | 'down') => {
    if (dir === 'up') {
      setActiveLayer((prev) => (prev > 1 ? prev - 1 : totalLayers));
    } else {
      setActiveLayer((prev) => (prev < totalLayers ? prev + 1 : 1));
    }
  };

  layerItemsRef.current = layerItems;
  allItemsRef.current = items;

  const insertAtCaret = (chunk: string) => {
    const caret = textCaretRef.current;
    setVirtualText((prev) => `${prev.slice(0, caret)}${chunk}${prev.slice(caret)}`);
    setTextCaret(caret + chunk.length);
  };

  const handleKeyboardDone = useCallback(() => {
    const text = virtualTextRef.current;
    if (text) {
      void navigator.clipboard?.writeText(text);
    }
    setActiveFlyout(null);
  }, []);

  const handleToggleGyro = useCallback(async () => {
    const current = {
      ...DEFAULT_GYRO,
      ...(snapshotRef.current?.settings.gyroSettings ?? {})
    };
    const nextEnabled = !gyroMouseOnRef.current;
    setGyroMouseOn(nextEnabled);
    setGyroError(null);
    try {
      await window.bridge.setGyroSettings({ ...current, enabled: nextEnabled });
    } catch {
      setGyroError('Gyro unavailable');
      setGyroMouseOn(!nextEnabled);
    }
  }, []);

  const applyKeyboardCell = async (cell: KeyboardCell) => {
    if (cell.kind === 'action') {
      if (cell.id === 'Shift' || cell.id === 'Abc') {
        setShiftLatch((prev) => !prev);
        return;
      }
      if (cell.id === 'Space') {
        insertAtCaret(' ');
        await window.bridge.typeVirtualKey?.('Space');
        return;
      }
      if (cell.id === 'Backspace') {
        const next = applyBackspaceAtCaret(virtualTextRef.current, textCaretRef.current);
        setVirtualText(next.text);
        setTextCaret(next.caret);
        await window.bridge.typeVirtualKey?.('Backspace');
        return;
      }
      if (cell.id === 'Enter') {
        insertAtCaret('\n');
        await window.bridge.typeVirtualKey?.('Enter');
        return;
      }
      if (cell.id === 'ArrowLeft') {
        setTextCaret((c) => applyCaretLeft(virtualTextRef.current, c).caret);
        return;
      }
      if (cell.id === 'ArrowRight') {
        setTextCaret((c) => applyCaretRight(virtualTextRef.current, c).caret);
        return;
      }
      if (cell.id === 'ArrowUp' || cell.id === 'ArrowDown') {
        return;
      }
      if (cell.id === 'GyroMouse') {
        await handleToggleGyro();
        return;
      }
      if (cell.id === 'Done') {
        handleKeyboardDone();
        return;
      }
      return;
    }
    const ch = shiftLatchRef.current ? cell.upper : cell.lower;
    insertAtCaret(ch);
    await window.bridge.typeVirtualKey?.(ch, shiftLatchRef.current);
    if (shiftLatchRef.current && /[a-z]/i.test(cell.lower)) {
      setShiftLatch(false);
    }
  };

  useEffect(() => {
    const unsubscribe = window.bridge.onKitsuneNav?.((nav) => {
      const flyout = activeFlyoutRef.current;

      const flyoutItem = flyout ? allItemsRef.current.find((item) => item.id === flyout) : undefined;
      if (isKeyboardFlyout(flyout) || flyoutItem?.icon === 'keyboard') {
        const result = handleKeyboardNavAction(nav as KitsuneNavAction, {
          moveMode: moveKeyboardModeRef.current
        });
        switch (result) {
          case 'move-focus': {
            if (nav === 'left' || nav === 'right' || nav === 'up' || nav === 'down') {
              const next = moveKeyboardFocus(keyRowRef.current, keyColRef.current, nav);
              setKeyRow(next.row);
              setKeyCol(next.col);
            }
            return;
          }
          case 'move-overlay': {
            if (nav === 'left' || nav === 'right' || nav === 'up' || nav === 'down') {
              void window.bridge.moveKitsuneBar?.(nav);
            }
            return;
          }
          case 'select': {
            const cell = KITSUNE_KEYBOARD_ROWS[keyRowRef.current]?.[keyColRef.current];
            if (cell) void applyKeyboardCell(cell);
            return;
          }
          case 'cancel': {
            // Move mode only — Circle is shift while typing (Steam-like remap).
            if (moveKeyboardModeRef.current) {
              setMoveKeyboardMode(false);
            }
            return;
          }
          case 'caret-left': {
            setTextCaret((c) => applyCaretLeft(virtualTextRef.current, c).caret);
            return;
          }
          case 'caret-right': {
            setTextCaret((c) => applyCaretRight(virtualTextRef.current, c).caret);
            return;
          }
          case 'toggle-shift': {
            setShiftLatch((prev) => !prev);
            return;
          }
          case 'backspace': {
            const next = applyBackspaceAtCaret(virtualTextRef.current, textCaretRef.current);
            setVirtualText(next.text);
            setTextCaret(next.caret);
            void window.bridge.typeVirtualKey?.('Backspace');
            return;
          }
          case 'space': {
            insertAtCaret(' ');
            void window.bridge.typeVirtualKey?.('Space');
            return;
          }
          case 'enter': {
            insertAtCaret('\n');
            void window.bridge.typeVirtualKey?.('Enter');
            return;
          }
          case 'done': {
            handleKeyboardDone();
            return;
          }
          case 'toggle-gyro': {
            void handleToggleGyro();
            return;
          }
          case 'ignore':
          default:
            return;
        }
      }

      if (flyout === 'audio') {
        if (nav === 'left' || nav === 'right') {
          const delta = nav === 'left' ? -5 : 5;
          const next = Math.max(0, Math.min(100, volumeRef.current + delta));
          setStickVolumeActive(true);
          void commitSystemVolume(next);
          return;
        }
        if (nav === 'select') {
          const next = volumeRef.current > 0 ? 0 : lastAudibleVolumeRef.current || 50;
          setStickVolumeActive(true);
          void commitSystemVolume(next);
          return;
        }
        if (nav === 'cancel') {
          setActiveFlyout(null);
          setStickVolumeActive(false);
          return;
        }
        return;
      }

      const items = layerItemsRef.current;
      if (nav === 'left') {
        setFocusedIndex((prev) => (items.length > 0 ? (prev > 0 ? prev - 1 : items.length - 1) : 0));
      } else if (nav === 'right') {
        setFocusedIndex((prev) => (items.length > 0 ? (prev < items.length - 1 ? prev + 1 : 0) : 0));
      } else if (nav === 'up') {
        cycleLayer('up');
      } else if (nav === 'down') {
        cycleLayer('down');
      } else if (nav === 'select') {
        const item = items[focusedIndexRef.current];
        if (item) {
          setActiveFlyout((cur) => (cur === item.id ? null : item.id));
        }
      } else if (nav === 'cancel') {
        if (flyout) {
          setActiveFlyout(null);
        } else {
          handleClose();
        }
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [totalLayers, handleKeyboardDone, handleToggleGyro]);

  const connected = Boolean(snapshot?.status?.controllerConnected);
  const activeProfile = snapshot?.settings.controllerProfiles.find(
    (p) => p.id === snapshot.settings.selectedControllerProfileId
  )?.name ?? 'Default';

  const isCharging = snapshot ? isChargingPowerState(snapshot.status?.rawPowerState) : false;
  const batteryPctText = snapshot ? batteryLabel(snapshot) : '85%';

  const renderIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case 'gamepad':
        return <IconDeviceGamepad2 size={size} />;
      case 'flask':
        return <IconFlask2 size={size} />;
      case 'volume':
        return <IconVolume size={size} />;
      case 'mic':
        return <IconMicrophone size={size} />;
      case 'music':
        return <IconMusic size={size} />;
      case 'camera':
        return <IconCamera size={size} />;
      case 'folder':
        return <IconFolder size={size} />;
      case 'discord':
        return <IconBrandDiscord size={size} />;
      case 'activity':
        return <IconActivity size={size} />;
      case 'spotify':
        return <IconBrandSpotify size={size} />;
      case 'video':
        return <IconVideo size={size} />;
      case 'keyboard':
        return <IconKeyboard size={size} />;
      case 'bolt':
        return <IconBolt size={size} />;
      default:
        return <IconDeviceGamepad2 size={size} />;
    }
  };

  return (
    <div className="kitsune-bar-overlay-root">
      <KitsuneDockBar
        variant="overlay"
        layerItems={layerItems}
        focusedIndex={focusedIndex}
        activeFlyout={activeFlyout}
        activeLayer={activeLayer}
        totalLayers={totalLayers}
        batteryPctText={batteryPctText}
        isCharging={isCharging}
        renderIcon={renderIcon}
        onHome={() => {
          void window.bridge.showMainWindow();
          handleClose();
        }}
        onProfiles={() => setActiveFlyout(activeFlyout === 'profiles' ? null : 'profiles')}
        onPs={() => setActiveFlyout(activeFlyout === 'ps' ? null : 'ps')}
        onModuleClick={(id, index) => {
          setFocusedIndex(index);
          setActiveFlyout(activeFlyout === id ? null : id);
        }}
        onLayerUp={() => cycleLayer('up')}
        onLayerDown={() => cycleLayer('down')}
        onSleep={() => void window.bridge.sleepController()}
        onClose={handleClose}
      />

      {/* Flyout Quick Menus */}
      {activeFlyout && (
        <div className="kitsune-bar-overlay-flyout">
          {activeFlyout === 'profiles' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Controller Profiles</strong>
                <span>{snapshot?.settings.controllerProfiles.length ?? 0}</span>
              </div>
              <div className="overlay-profile-list">
                {snapshot?.settings.controllerProfiles.map((p) => {
                  const isSel = p.id === snapshot.settings.selectedControllerProfileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`overlay-profile-item ${isSel ? 'active' : ''}`}
                      onClick={() => void window.bridge.selectControllerProfile(p.id)}
                    >
                      <span>{p.name}</span>
                      {isSel && <span className="profile-active-tag">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeFlyout === 'ps' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>PlayStation Quick Menu</strong>
                <span className={`status-pill ${connected ? 'connected' : 'offline'}`}>
                  {connected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="overlay-ps-actions">
                <button
                  type="button"
                  className="overlay-quick-btn"
                  onClick={() => {
                    void window.bridge.showMainWindow();
                    handleClose();
                  }}
                >
                  Open Companion
                </button>
                <button
                  type="button"
                  className="overlay-quick-btn"
                  onClick={() => void window.bridge.sleepController()}
                >
                  Turn Off Controller
                </button>
              </div>
            </div>
          )}

          {activeFlyout === 'controller' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Controller Settings</strong>
                <span className={`status-pill ${connected ? 'connected' : 'offline'}`}>
                  {connected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="overlay-flyout-meta">
                <span>Profile: {activeProfile}</span>
              </div>
              <div className="overlay-slider-row">
                <IconSparkles size={14} />
                <span>Haptics: {haptics}%</span>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="10"
                  value={haptics}
                  onChange={(e) => handleHapticsChange(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {activeFlyout === 'audio' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>System Volume</strong>
                <span>{volume}%</span>
              </div>
              <p className="overlay-flyout-meta">Windows playback device · stick left/right adjusts</p>
              {volumeError ? <p className="overlay-flyout-meta">{volumeError}</p> : null}
              <div className={`overlay-slider-row ${stickVolumeActive ? 'stick-active' : ''}`}>
                {volume > 0 ? <IconVolume size={14} /> : <IconVolumeOff size={14} />}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => {
                    setStickVolumeActive(false);
                    handleVolumeChange(Number(e.target.value));
                  }}
                  onPointerUp={(e) => {
                    if (volumeCommitRef.current) {
                      clearTimeout(volumeCommitRef.current);
                      volumeCommitRef.current = null;
                    }
                    void commitSystemVolume(Number(e.currentTarget.value));
                  }}
                />
              </div>
            </div>
          )}

          {activeFlyout === 'mic' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Microphone</strong>
                <span>{snapshot?.settings.micMuted ? 'Muted' : 'Live'}</span>
              </div>
              <button
                type="button"
                className={`overlay-quick-btn ${snapshot?.settings.micMuted ? '' : 'primary'}`}
                onClick={() => void window.bridge.setMicMute(!snapshot?.settings.micMuted)}
              >
                {snapshot?.settings.micMuted ? <IconMicrophoneOff size={14} /> : <IconMicrophone size={14} />}
                <span>{snapshot?.settings.micMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          )}

          {activeFlyout === 'music' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Media Control</strong>
              </div>
              <div className="overlay-media-row">
                <button type="button" className="overlay-quick-btn" title="Previous Track">
                  Prev
                </button>
                <button type="button" className="overlay-quick-btn primary" title="Play / Pause">
                  Play/Pause
                </button>
                <button type="button" className="overlay-quick-btn" title="Next Track">
                  Next
                </button>
              </div>
            </div>
          )}

          {activeFlyout === 'lab' && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Trigger Lab</strong>
              </div>
              <button
                type="button"
                className="overlay-quick-btn primary"
                onClick={() => {
                  void window.bridge.setTriggerTestMode('weapon');
                }}
              >
                Test Weapon Trigger Effect
              </button>
            </div>
          )}

          {(activeFlyout === 'screenshot' || currentItem?.icon === 'camera') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Screen Capture</strong>
                <span className="overlay-badge">Windows Tool</span>
              </div>
              <p className="overlay-flyout-meta">Take instantaneous screenshot or region snip</p>
              <div className="overlay-ps-actions">
                <button
                  type="button"
                  className="overlay-quick-btn primary"
                  onClick={async () => {
                    await window.bridge.triggerScreenshot();
                  }}
                >
                  <IconCamera size={15} />
                  <span>Snipping Tool</span>
                </button>
                <button
                  type="button"
                  className="overlay-quick-btn"
                  onClick={async () => {
                    await window.bridge.openScreenshotsFolder();
                  }}
                >
                  <IconFolder size={15} />
                  <span>Screenshots</span>
                </button>
              </div>
            </div>
          )}

          {(isKeyboardFlyout(activeFlyout) || currentItem?.icon === 'keyboard') && (
            <div className="overlay-flyout-card overlay-keyboard-card">
              <KitsuneKeyboard
                variant="overlay"
                virtualText={virtualText}
                shiftLatch={shiftLatch}
                keyRow={keyRow}
                keyCol={keyCol}
                moveKeyboardMode={moveKeyboardMode}
                gyroMouseOn={gyroMouseOn}
                gyroError={gyroError}
                onCellActivate={(row, col) => {
                  setKeyRow(row);
                  setKeyCol(col);
                  const cell = KITSUNE_KEYBOARD_ROWS[row]?.[col];
                  if (cell) void applyKeyboardCell(cell);
                }}
                onDone={handleKeyboardDone}
                onToggleGyro={() => {
                  void handleToggleGyro();
                }}
                onToggleMoveMode={() => setMoveKeyboardMode((prev) => !prev)}
                onCopy={() => {
                  if (virtualText) {
                    void navigator.clipboard?.writeText(virtualText);
                  }
                }}
                onClear={() => {
                  setVirtualText('');
                  setTextCaret(0);
                }}
              />
              <button
                type="button"
                className="overlay-quick-btn"
                onClick={async () => {
                  await window.bridge.openOnScreenKeyboard();
                }}
              >
                <IconKeyboard size={16} />
                <span>Windows OSK</span>
              </button>
            </div>
          )}

          {(activeFlyout === 'discord-overlay' || activeFlyout === 'discord' || currentItem?.icon === 'discord') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Discord Voice</strong>
                <span className="status-pill connected">Ready</span>
              </div>
              <p className="overlay-flyout-meta">Connected: Gaming Voice Channel</p>
              <div className="overlay-ps-actions">
                <button
                  type="button"
                  className="overlay-quick-btn"
                  onClick={() => void window.bridge.setMicMute(!snapshot?.settings.micMuted)}
                >
                  {snapshot?.settings.micMuted ? <IconMicrophoneOff size={14} /> : <IconMicrophone size={14} />}
                  <span>{snapshot?.settings.micMuted ? 'Unmute' : 'Mute Voice'}</span>
                </button>
                <button
                  type="button"
                  className="overlay-quick-btn"
                  onClick={() => {
                    void window.bridge.openExternal?.('discord://');
                  }}
                >
                  <IconBrandDiscord size={14} />
                  <span>Open Discord</span>
                </button>
              </div>
            </div>
          )}

          {(activeFlyout === 'performance-hud' || activeFlyout === 'activity' || currentItem?.icon === 'activity') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Performance HUD</strong>
                <span className="overlay-badge">Telemetry</span>
              </div>
              <div className="overlay-telemetry-grid">
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">FPS</span>
                  <span className="telemetry-chip-val highlight">144</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">GPU</span>
                  <span className="telemetry-chip-val">58°C · 42%</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">CPU</span>
                  <span className="telemetry-chip-val">18% · 4.8G</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">RAM</span>
                  <span className="telemetry-chip-val">14.2 GB</span>
                </div>
              </div>
            </div>
          )}

          {(activeFlyout === 'spotify-widget' || activeFlyout === 'spotify' || currentItem?.icon === 'spotify') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Spotify Player</strong>
                <span className="overlay-badge">Spotify</span>
              </div>
              <div className="overlay-spotify-track">
                <IconBrandSpotify size={20} color="#22c55e" />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Nightcall</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kavinsky</span>
                </div>
              </div>
              <div className="overlay-media-row">
                <button type="button" className="overlay-quick-btn" title="Previous Track">
                  Prev
                </button>
                <button type="button" className="overlay-quick-btn primary" title="Play / Pause">
                  Play/Pause
                </button>
                <button type="button" className="overlay-quick-btn" title="Next Track">
                  Next
                </button>
              </div>
            </div>
          )}

          {(activeFlyout === 'obs-controller' || activeFlyout === 'video' || currentItem?.icon === 'video') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>OBS Stream Deck</strong>
                <span className="overlay-badge">OBS Studio</span>
              </div>
              <p className="overlay-flyout-meta">Stream: Idle · Ready</p>
              <div className="overlay-ps-actions">
                <button type="button" className="overlay-quick-btn primary">
                  Start Stream
                </button>
                <button type="button" className="overlay-quick-btn">
                  Record
                </button>
              </div>
            </div>
          )}

          {(activeFlyout === 'battery-health' || activeFlyout === 'bolt' || currentItem?.icon === 'bolt') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Battery Diagnostics</strong>
                <span className="status-pill connected">Healthy</span>
              </div>
              <div className="overlay-telemetry-grid">
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">Charge</span>
                  <span className="telemetry-chip-val highlight">{batteryPctText}</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">Health</span>
                  <span className="telemetry-chip-val">98%</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">Voltage</span>
                  <span className="telemetry-chip-val">4.12V</span>
                </div>
                <div className="telemetry-chip">
                  <span className="telemetry-chip-lbl">Est. Time</span>
                  <span className="telemetry-chip-val">~7h 45m</span>
                </div>
              </div>
            </div>
          )}

          {!['controller', 'profiles', 'ps', 'audio', 'mic', 'music', 'lab', 'screenshot', 'virtual-keyboard', 'keyboard', 'discord-overlay', 'discord', 'performance-hud', 'activity', 'spotify-widget', 'spotify', 'obs-controller', 'video', 'battery-health', 'bolt'].includes(activeFlyout) &&
           !['camera', 'keyboard', 'video', 'spotify', 'activity', 'discord', 'bolt', 'volume', 'mic', 'music', 'flask', 'gamepad'].includes(currentItem?.icon || '') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>{currentItem?.name || 'Custom Module'}</strong>
                <span className="overlay-badge">Running</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Active in Layer {activeLayer}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

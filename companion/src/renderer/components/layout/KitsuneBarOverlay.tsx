import { useEffect, useState, useMemo } from 'react';
import {
  IconHome,
  IconCopy,
  IconDeviceGamepad2,
  IconFlask2,
  IconVolume,
  IconVolumeOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconMusic,
  IconCamera,
  IconChevronUp,
  IconChevronDown,
  IconPower,
  IconX,
  IconSparkles,
  IconBrandDiscord,
  IconBrandSpotify,
  IconActivity,
  IconVideo,
  IconKeyboard,
  IconBolt,
  IconFolder
} from '@tabler/icons-react';
import type { BridgeSnapshot, KitsuneBarItemConfig } from '../../../shared/types';
import kitsuneInputLogoUrl from '../../assets/kitsune-input-logo.svg';
import psHomeGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import { batteryLabel, isChargingPowerState } from '../../utils/controller-status';
import { DEFAULT_KITSUNE_BAR_MODULES } from '../../pages/KitsuneBarPage';

export function KitsuneBarOverlay() {
  const [snapshot, setSnapshot] = useState<BridgeSnapshot | null>(null);
  const [haptics, setHaptics] = useState(100);
  const [volume, setVolume] = useState(100);
  const [activeLayer, setActiveLayer] = useState(1);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [virtualText, setVirtualText] = useState('');

  useEffect(() => {
    let unmounted = false;
    const applySnapshot = (s: BridgeSnapshot | null | undefined) => {
      if (!unmounted && s) {
        setSnapshot(s);
        setHaptics(s.settings.hapticsGainPercent);
        setVolume(s.settings.speakerVolumePercent);
        if (s.settings.kitsuneBarSettings?.activeLayer) {
          setActiveLayer(s.settings.kitsuneBarSettings.activeLayer);
        }
      }
    };

    void window.bridge.getStatus().then(applySnapshot);
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
      if (['virtual-keyboard', 'keyboard', 'performance-hud', 'activity', 'spotify-widget', 'spotify'].includes(activeFlyout)) {
        height = 300;
      } else {
        height = 250;
      }
    }
    void window.bridge.resizeKitsuneBar(780, height);
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

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    void window.bridge.setSpeakerVolume(val);
  };

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
      <div className="kitsune-bar-overlay-bar">
        {/* Core Fixed Items (Left) */}
        <div className="kitsune-dock-group fixed-core-left">
          <button
            type="button"
            className="dock-item"
            title="Open Main Window"
            onClick={() => {
              void window.bridge.showMainWindow();
              handleClose();
            }}
          >
            <IconHome size={18} />
          </button>
          <button
            type="button"
            className="dock-item"
            title="Game Profiles"
            onClick={() => setActiveFlyout(activeFlyout === 'profiles' ? null : 'profiles')}
          >
            <IconCopy size={18} />
          </button>
          <button
            type="button"
            className="dock-item ps-dock-button"
            title="PlayStation Home"
            onClick={() => setActiveFlyout(activeFlyout === 'ps' ? null : 'ps')}
          >
            <img src={psHomeGlyphUrl} alt="PS" className="dock-ps-icon" />
          </button>
          <div
            className="dock-item battery-dock-item"
            title={`Battery: ${batteryPctText}${isCharging ? ' (Charging)' : ''}`}
          >
            <div className="dock-battery-meter">
              <span className="battery-bar" />
              <span className="battery-bar" />
              <span className="battery-bar" />
              <span className="battery-bar" />
            </div>
          </div>
        </div>

        {/* Dynamic Layer Modules */}
        <div className="kitsune-dock-group layer-modules">
          {layerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dock-item module-item ${activeFlyout === item.id ? 'active' : ''}`}
              title={`${item.name}`}
              onClick={() => setActiveFlyout(activeFlyout === item.id ? null : item.id)}
            >
              {renderIcon(item.icon, 18)}
            </button>
          ))}
        </div>

        {/* Core Fixed Items (Right) */}
        <div className="kitsune-dock-group fixed-core-right">
          <div className="dock-layer-stepper" title={`Current Layer: ${activeLayer}/${totalLayers}`}>
            <button
              type="button"
              className="stepper-arrow up"
              aria-label="Previous Layer"
              onClick={() => cycleLayer('up')}
            >
              <IconChevronUp size={11} stroke={3} />
            </button>
            <span className="stepper-label">{`${activeLayer}/${totalLayers}`}</span>
            <button
              type="button"
              className="stepper-arrow down"
              aria-label="Next Layer"
              onClick={() => cycleLayer('down')}
            >
              <IconChevronDown size={11} stroke={3} />
            </button>
          </div>
          <button
            type="button"
            className="dock-item sleep-dock-button"
            title="Sleep Controller"
            onClick={() => void window.bridge.sleepController()}
          >
            <IconPower size={18} />
          </button>
          <button
            type="button"
            className="dock-item close-dock-button"
            title="Close Overlay"
            onClick={handleClose}
          >
            <IconX size={15} />
          </button>
        </div>
      </div>

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
                <strong>Audio Volume</strong>
                <span>{volume}%</span>
              </div>
              <div className="overlay-slider-row">
                <IconVolume size={14} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
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

          {(activeFlyout === 'virtual-keyboard' || activeFlyout === 'keyboard' || currentItem?.icon === 'keyboard') && (
            <div className="overlay-flyout-card">
              <div className="overlay-flyout-header">
                <strong>Gamepad Keyboard</strong>
                <span className="overlay-badge">Input</span>
              </div>
              <button
                type="button"
                className="overlay-quick-btn primary"
                onClick={async () => {
                  await window.bridge.openOnScreenKeyboard();
                }}
              >
                <IconKeyboard size={16} />
                <span>Launch Windows OSK</span>
              </button>
              <div className="overlay-keyboard-quickbox">
                <input
                  type="text"
                  className="overlay-keyboard-input"
                  placeholder="Type with controller or mouse..."
                  value={virtualText}
                  onChange={(e) => setVirtualText(e.target.value)}
                />
                <div className="overlay-keyboard-actions">
                  <button
                    type="button"
                    className="overlay-mini-btn"
                    onClick={() => {
                      if (virtualText) {
                        void navigator.clipboard?.writeText(virtualText);
                      }
                    }}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="overlay-mini-btn"
                    onClick={() => setVirtualText('')}
                  >
                    Clear
                  </button>
                </div>
              </div>
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

          {!['controller', 'profiles', 'ps', 'audio', 'mic', 'music', 'lab', 'screenshot', 'virtual-keyboard', 'keyboard', 'discord-overlay', 'discord', 'performance-hud', 'activity', 'spotify-widget', 'spotify', 'obs-controller', 'video', 'battery-health', 'bolt'].includes(activeFlyout) && (
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

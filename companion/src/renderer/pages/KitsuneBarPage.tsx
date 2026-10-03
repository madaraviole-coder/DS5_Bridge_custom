import { useState, useMemo } from 'react';
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
  IconGripVertical,
  IconPlus,
  IconFolder,
  IconRotate,
  IconTool,
  IconSearch,
  IconCheck,
  IconBrandDiscord,
  IconBrandSpotify,
  IconActivity,
  IconVideo,
  IconKeyboard,
  IconDeviceFloppy,
  IconBolt,
  IconTrash,
  IconMinus
} from '@tabler/icons-react';
import kitsuneInputLogoUrl from '../assets/kitsune-input-logo.svg';
import psHomeGlyphUrl from '../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import type { BridgeSnapshot, KitsuneBarItemConfig, KitsuneBarSettings } from '../../shared/types';
import { batteryLabel, isChargingPowerState } from '../utils/controller-status';

export interface KitsuneBarPageProps {
  active: boolean;
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  pendingAction: string | null;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  onOpenLibrary?: () => void;
}

export const DEFAULT_KITSUNE_BAR_MODULES: KitsuneBarItemConfig[] = [
  { id: 'controller', name: 'Controller', icon: 'gamepad', type: 'module', layer: 1, order: 0, enabled: true },
  { id: 'lab', name: 'Lab', icon: 'flask', type: 'module', layer: 1, order: 1, enabled: true },
  { id: 'audio', name: 'Audio', icon: 'volume', type: 'module', layer: 1, order: 2, enabled: true },
  { id: 'mic', name: 'Mic', icon: 'mic', type: 'module', layer: 1, order: 3, enabled: true },
  { id: 'music', name: 'Music', icon: 'music', type: 'module', layer: 1, order: 4, enabled: true },
  { id: 'screenshot', name: 'Screenshot', icon: 'camera', type: 'module', layer: 1, order: 5, enabled: true }
];

interface WorkshopModule {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  version: string;
  icon: string;
}

const WORKSHOP_CATALOG: WorkshopModule[] = [
  {
    id: 'discord-overlay',
    name: 'Discord Overlay',
    category: 'Social',
    description: 'Show active voice channels, speaking avatars, and quick deafen / mute controls.',
    author: 'Kitsune Community',
    version: 'v1.4.0',
    icon: 'discord'
  },
  {
    id: 'performance-hud',
    name: 'Performance HUD',
    category: 'Hardware',
    description: 'Real-time telemetry showing FPS, GPU temperature, CPU utilization, and 1% lows.',
    author: 'HardwareLab',
    version: 'v2.1.2',
    icon: 'activity'
  },
  {
    id: 'spotify-widget',
    name: 'Spotify Player',
    category: 'Media',
    description: 'Now playing album cover art, playback scrubbing, and playlist quick-picker.',
    author: 'AudioPhile',
    version: 'v1.0.8',
    icon: 'spotify'
  },
  {
    id: 'obs-controller',
    name: 'OBS Stream Deck',
    category: 'Streaming',
    description: 'Switch scenes, toggle streaming/recording, and manage audio sources on the fly.',
    author: 'StreamTools',
    version: 'v1.1.0',
    icon: 'video'
  },
  {
    id: 'virtual-keyboard',
    name: 'Gamepad Keyboard',
    category: 'Utilities',
    description: 'On-screen virtual keyboard with dual-touchpad and stick typing acceleration.',
    author: 'InputMaster',
    version: 'v1.3.5',
    icon: 'keyboard'
  },
  {
    id: 'battery-health',
    name: 'Battery Diagnostics',
    category: 'Hardware',
    description: 'Detailed charge cycles, voltage health, temperature sensors, and power draw.',
    author: 'PicoMod',
    version: 'v1.0.2',
    icon: 'bolt'
  }
];

export function KitsuneBarPage({
  active,
  snapshot,
  connected,
  pendingAction,
  runAction,
  onOpenLibrary
}: KitsuneBarPageProps) {
  const [activeTab, setActiveTab] = useState<'kitsune-bar' | 'workshop'>('kitsune-bar');
  const [activePreviewLayer, setActivePreviewLayer] = useState(1);
  const [viewLayer, setViewLayer] = useState(1);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const rawSettings = snapshot?.settings.kitsuneBarSettings;
  const isEnabled = rawSettings?.enabled ?? true;
  const totalLayers = rawSettings?.totalLayers ?? 2;
  const items: KitsuneBarItemConfig[] = useMemo(() => {
    if (rawSettings?.items && Array.isArray(rawSettings.items) && rawSettings.items.length > 0) {
      return rawSettings.items;
    }
    return DEFAULT_KITSUNE_BAR_MODULES;
  }, [rawSettings?.items]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleEnabled = async () => {
    const updated: KitsuneBarSettings = {
      ...(rawSettings ?? {
        enabled: true,
        toggleShortcut: 'ps-button',
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }),
      enabled: !isEnabled,
      toggleShortcut: rawSettings?.toggleShortcut ?? 'ps-button',
      totalLayers,
      activeLayer: activePreviewLayer,
      items
    };
    await runAction('toggle-kitsune-bar', () => window.bridge.setKitsuneBarSettings(updated));
    showNotification(isEnabled ? 'Kitsune Bar disabled' : 'Kitsune Bar enabled');
  };

  const handleUpdateToggleShortcut = async (toggleShortcut: 'ps-button' | 'chord' | 'keyboard') => {
    const updated: KitsuneBarSettings = {
      ...(rawSettings ?? {
        enabled: true,
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }),
      enabled: isEnabled,
      toggleShortcut,
      totalLayers,
      activeLayer: activePreviewLayer,
      items
    };
    await runAction('update-toggle-shortcut', () => window.bridge.setKitsuneBarSettings(updated));
    showNotification(
      toggleShortcut === 'ps-button'
        ? 'Shortcut set to PS Home Button'
        : toggleShortcut === 'keyboard'
        ? 'Shortcut set to Keyboard (Ctrl+Shift+K)'
        : 'Shortcut set to Controller Chord'
    );
  };

  const updateItems = async (newItems: KitsuneBarItemConfig[]) => {
    const updated: KitsuneBarSettings = {
      ...(rawSettings ?? {
        enabled: true,
        toggleShortcut: 'ps-button',
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }),
      enabled: isEnabled,
      toggleShortcut: rawSettings?.toggleShortcut ?? 'ps-button',
      totalLayers,
      activeLayer: activePreviewLayer,
      items: newItems
    };
    await runAction('update-kitsune-bar-items', () => window.bridge.setKitsuneBarSettings(updated));
  };

  const handleResetLayout = async () => {
    await updateItems([...DEFAULT_KITSUNE_BAR_MODULES]);
    setViewLayer(1);
    setActivePreviewLayer(1);
    showNotification('Layout reset to default');
  };

  const handleAddLayer = async () => {
    const newTotal = totalLayers + 1;
    const updated: KitsuneBarSettings = {
      ...(rawSettings ?? {
        enabled: true,
        toggleShortcut: 'ps-button',
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }),
      enabled: isEnabled,
      toggleShortcut: rawSettings?.toggleShortcut ?? 'ps-button',
      totalLayers: newTotal,
      activeLayer: activePreviewLayer,
      items
    };
    await runAction('add-layer', () => window.bridge.setKitsuneBarSettings(updated));
    setViewLayer(newTotal);
    showNotification(`Added Layer ${newTotal}`);
  };

  const handleDeleteLayer = async () => {
    if (totalLayers <= 1) {
      showNotification('Cannot delete the only layer');
      return;
    }
    const layerToDelete = viewLayer;
    const fallbackLayer = layerToDelete > 1 ? layerToDelete - 1 : 1;
    const updatedItems = items.map((it) => {
      if (it.layer === layerToDelete) {
        return { ...it, layer: fallbackLayer };
      }
      if (it.layer > layerToDelete) {
        return { ...it, layer: it.layer - 1 };
      }
      return it;
    });

    const newTotal = totalLayers - 1;
    const updated: KitsuneBarSettings = {
      ...(rawSettings ?? {
        enabled: true,
        toggleShortcut: 'ps-button',
        customHotkey: 'Control+Shift+K',
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      }),
      enabled: isEnabled,
      toggleShortcut: rawSettings?.toggleShortcut ?? 'ps-button',
      totalLayers: newTotal,
      activeLayer: Math.min(activePreviewLayer, newTotal),
      items: updatedItems
    };
    await runAction('delete-layer', () => window.bridge.setKitsuneBarSettings(updated));
    setViewLayer(fallbackLayer);
    setActivePreviewLayer((prev) => Math.min(prev, newTotal));
    showNotification(`Deleted Layer ${layerToDelete} (items moved to Layer ${fallbackLayer})`);
  };

  const handleDeleteItem = async (itemId: string) => {
    const itemToDelete = items.find((it) => it.id === itemId);
    const updated = items.filter((it) => it.id !== itemId);
    await updateItems(updated);
    showNotification(`Removed ${itemToDelete?.name ?? 'item'}`);
  };

  const handleUninstallWorkshopModule = async (modId: string) => {
    const mod = WORKSHOP_CATALOG.find((m) => m.id === modId);
    const updated = items.filter((it) => it.id !== modId);
    await updateItems(updated);
    showNotification(`Removed ${mod?.name ?? modId} from Bar`);
  };

  const handleAddFolder = async () => {
    const folderId = `folder-${Date.now()}`;
    const newFolder: KitsuneBarItemConfig = {
      id: folderId,
      name: 'Folder',
      icon: 'folder',
      type: 'folder',
      layer: viewLayer,
      order: items.length,
      enabled: true
    };
    await updateItems([...items, newFolder]);
    showNotification('New folder created');
  };

  const handleItemLayerChange = async (itemId: string, targetLayer: number) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, layer: targetLayer } : it));
    await updateItems(updated);
    showNotification(`Item moved to Layer ${targetLayer}`);
  };

  const handleMoveItemOrder = async (index: number, direction: 'up' | 'down') => {
    const layerItems = items.filter((it) => it.layer === viewLayer);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layerItems.length) return;

    const reorderedLayer = [...layerItems];
    const [moved] = reorderedLayer.splice(index, 1);
    reorderedLayer.splice(targetIndex, 0, moved);

    const otherItems = items.filter((it) => it.layer !== viewLayer);
    const finalItems = [
      ...otherItems,
      ...reorderedLayer.map((it, idx) => ({ ...it, order: idx }))
    ];
    await updateItems(finalItems);
  };

  const handleInstallWorkshopModule = async (mod: WorkshopModule) => {
    if (items.some((it) => it.id === mod.id)) {
      showNotification(`${mod.name} is already installed`);
      return;
    }
    const newModule: KitsuneBarItemConfig = {
      id: mod.id,
      name: mod.name,
      icon: mod.icon,
      type: 'module',
      layer: viewLayer,
      order: items.length,
      enabled: true
    };
    await updateItems([...items, newModule]);
    showNotification(`Installed ${mod.name} to Layer ${viewLayer}`);
  };

  const cyclePreviewLayer = (dir: 'up' | 'down') => {
    if (dir === 'up') {
      setActivePreviewLayer((prev) => (prev > 1 ? prev - 1 : totalLayers));
    } else {
      setActivePreviewLayer((prev) => (prev < totalLayers ? prev + 1 : 1));
    }
  };

  const layerItemsInPreview = items
    .filter((it) => it.layer === activePreviewLayer && it.enabled)
    .sort((a, b) => a.order - b.order);

  const layerItemsInManager = items
    .filter((it) => it.layer === viewLayer)
    .sort((a, b) => a.order - b.order);

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

  const isCharging = snapshot ? isChargingPowerState(snapshot.status?.rawPowerState) : false;
  const batteryPctText = snapshot ? batteryLabel(snapshot) : '85%';

  return (
    <div
      className={`control-page kitsune-bar-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-kitsune-bar"
      aria-labelledby="control-tab-kitsune-bar"
      aria-hidden={!active}
    >
      {/* Top Page Navigation */}
      <div className="kitsune-bar-subnav">
        <button
          type="button"
          className={`kitsune-bar-subnav-btn ${activeTab === 'kitsune-bar' ? 'active' : ''}`}
          onClick={() => setActiveTab('kitsune-bar')}
        >
          <img src={kitsuneInputLogoUrl} alt="" className="kitsune-subnav-fox-icon" />
          <span>Kitsune Bar</span>
        </button>
        <button
          type="button"
          className={`kitsune-bar-subnav-btn ${activeTab === 'workshop' ? 'active' : ''}`}
          onClick={() => setActiveTab('workshop')}
        >
          <IconTool size={16} />
          <span>Workshop</span>
        </button>
      </div>

      {notification && (
        <div className="kitsune-toast-banner" role="status">
          <IconCheck size={16} />
          <span>{notification}</span>
        </div>
      )}

      {activeTab === 'kitsune-bar' && (
        <div className="kitsune-bar-content">
          {/* Main Enable Card */}
          <div className="kitsune-bar-card kitsune-bar-hero-card">
            <div className="kitsune-hero-left">
              <div className="kitsune-orange-box">
                <img src={kitsuneInputLogoUrl} alt="Kitsune" className="kitsune-box-logo" />
              </div>
              <div className="kitsune-hero-copy">
                <h3>Kitsune Bar</h3>
                <p>Open the quick controller overlay from PS Home Button.</p>
              </div>
            </div>
            <div className="kitsune-hero-right">
              <span className="kitsune-switch-label">{isEnabled ? 'Enabled' : 'Disabled'}</span>
              <label className="switch switch-orange" aria-label="Toggle Kitsune Bar">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  disabled={pendingAction !== null}
                  onChange={handleToggleEnabled}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>

          {/* Shortcut Trigger Settings Card */}
          <div className="kitsune-bar-card kitsune-trigger-card">
            <div className="kitsune-trigger-left">
              <div className="kitsune-trigger-icon-wrap">
                <img src={psHomeGlyphUrl} alt="PS Home" className="kitsune-trigger-glyph" />
              </div>
              <div className="kitsune-trigger-copy">
                <h4>Overlay Shortcut</h4>
                <p>Summon Kitsune Bar with PS Home Button on your controller or keyboard hotkey.</p>
              </div>
            </div>
            <div className="kitsune-trigger-right">
              <select
                className="kitsune-select"
                value={rawSettings?.toggleShortcut ?? 'ps-button'}
                onChange={(e) => handleUpdateToggleShortcut(e.target.value as any)}
                aria-label="Select Kitsune Bar Shortcut"
              >
                <option value="ps-button">PS Home Button (Controller)</option>
                <option value="keyboard">Keyboard ({rawSettings?.customHotkey ?? 'Ctrl+Shift+K'})</option>
                <option value="chord">Controller Chord Combo</option>
              </select>
            </div>
          </div>

          {/* Quick Overlay Visual Dock Preview */}
          <div className="kitsune-bar-preview-wrapper">
            <div className="kitsune-bar-preview-dock" aria-label="Kitsune Bar Preview">
              {/* Left Core Fixed Items */}
              <div className="kitsune-dock-group fixed-core-left">
                <button
                  type="button"
                  className="dock-item"
                  title="Home"
                  onClick={() => setActiveFlyout(activeFlyout === 'home' ? null : 'home')}
                >
                  <IconHome size={18} />
                </button>
                <button
                  type="button"
                  className="dock-item"
                  title="Library & Games"
                  onClick={() => onOpenLibrary?.()}
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

              {/* Active Layer Modules */}
              <div className="kitsune-dock-group layer-modules">
                {layerItemsInPreview.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`dock-item module-item ${activeFlyout === item.id ? 'active' : ''}`}
                    title={`${item.name} (${item.type})`}
                    onClick={() => setActiveFlyout(activeFlyout === item.id ? null : item.id)}
                  >
                    {renderIcon(item.icon, 18)}
                  </button>
                ))}
              </div>

              {/* Right Fixed Items */}
              <div className="kitsune-dock-group fixed-core-right">
                <div className="dock-layer-stepper" title={`Current Layer: ${activePreviewLayer}/${totalLayers}`}>
                  <button
                    type="button"
                    className="stepper-arrow up"
                    aria-label="Previous Layer"
                    onClick={() => cyclePreviewLayer('up')}
                  >
                    <IconChevronUp size={11} stroke={3} />
                  </button>
                  <span className="stepper-label">{`${activePreviewLayer}/${totalLayers}`}</span>
                  <button
                    type="button"
                    className="stepper-arrow down"
                    aria-label="Next Layer"
                    onClick={() => cyclePreviewLayer('down')}
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
              </div>
            </div>

            {/* Interactive Flyout Popups for Preview */}
            {activeFlyout && (
              <div className="kitsune-bar-preview-flyout">
                {activeFlyout === 'controller' && (
                  <div className="flyout-card">
                    <h4>Controller Controls</h4>
                    <p className="flyout-sub">Quick Tuning & Profile</p>
                    <div className="flyout-row">
                      <span>Status</span>
                      <strong className={connected ? 'connected-text' : ''}>
                        {connected ? 'Connected' : 'Offline'}
                      </strong>
                    </div>
                    <div className="flyout-row">
                      <span>Profile</span>
                      <span>
                        {snapshot?.settings.controllerProfiles.find(
                          (p) => p.id === snapshot.settings.selectedControllerProfileId
                        )?.name ?? 'Default'}
                      </span>
                    </div>
                  </div>
                )}
                {activeFlyout === 'audio' && (
                  <div className="flyout-card">
                    <h4>Speaker Volume</h4>
                    <p className="flyout-sub">{snapshot?.settings.speakerVolumePercent ?? 100}%</p>
                    <div className="flyout-slider-row">
                      <IconVolume size={16} />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={snapshot?.settings.speakerVolumePercent ?? 100}
                        onChange={(e) => void window.bridge.setSpeakerVolume(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
                {activeFlyout === 'mic' && (
                  <div className="flyout-card">
                    <h4>Microphone</h4>
                    <p className="flyout-sub">
                      {snapshot?.settings.micMuted ? 'Muted' : `Volume: ${snapshot?.settings.micVolumePercent ?? 100}%`}
                    </p>
                    <button
                      type="button"
                      className="kitsune-btn-outline"
                      onClick={() => void window.bridge.setMicMute(!snapshot?.settings.micMuted)}
                    >
                      {snapshot?.settings.micMuted ? <IconMicrophoneOff size={15} /> : <IconMicrophone size={15} />}
                      <span>{snapshot?.settings.micMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>
                  </div>
                )}
                {activeFlyout === 'music' && (
                  <div className="flyout-card">
                    <h4>Media Playback</h4>
                    <p className="flyout-sub">Windows Media Player</p>
                    <div className="flyout-media-btns">
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Media Previous')}>
                        Prev
                      </button>
                      <button type="button" className="primary-action" onClick={() => showNotification('Media Play/Pause')}>
                        Play/Pause
                      </button>
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Media Next')}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'screenshot' || activeFlyout === 'camera') && (
                  <div className="flyout-card">
                    <h4>Screen Capture</h4>
                    <p className="flyout-sub">Take instantaneous game screenshot</p>
                    <div className="flyout-media-btns">
                      <button
                        type="button"
                        className="primary-action"
                        onClick={async () => {
                          const res = await window.bridge.triggerScreenshot();
                          showNotification(res.message);
                        }}
                      >
                        <IconCamera size={15} />
                        <span>Snipping Tool</span>
                      </button>
                      <button
                        type="button"
                        className="kitsune-btn-outline"
                        onClick={async () => {
                          const res = await window.bridge.openScreenshotsFolder();
                          showNotification(res.message);
                        }}
                      >
                        <IconFolder size={15} />
                        <span>Folder</span>
                      </button>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'virtual-keyboard' || activeFlyout === 'keyboard') && (
                  <div className="flyout-card">
                    <h4>Gamepad Virtual Keyboard</h4>
                    <p className="flyout-sub">Windows On-Screen Keyboard & typing</p>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={async () => {
                        const res = await window.bridge.openOnScreenKeyboard();
                        showNotification(res.message);
                      }}
                    >
                      <IconKeyboard size={15} />
                      <span>Open Windows OSK</span>
                    </button>
                  </div>
                )}
                {(activeFlyout === 'discord-overlay' || activeFlyout === 'discord') && (
                  <div className="flyout-card">
                    <h4>Discord Overlay</h4>
                    <p className="flyout-sub">Voice channel controls</p>
                    <div className="flyout-media-btns">
                      <button type="button" className="primary-action" onClick={() => showNotification('Mute Voice Toggled')}>
                        Toggle Mute
                      </button>
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Deafen Toggled')}>
                        Deafen
                      </button>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'performance-hud' || activeFlyout === 'activity') && (
                  <div className="flyout-card">
                    <h4>Performance HUD</h4>
                    <p className="flyout-sub">Real-time gaming telemetry</p>
                    <div className="flyout-row">
                      <span>FPS: 144</span>
                      <span>GPU: 58°C · 42%</span>
                    </div>
                    <div className="flyout-row">
                      <span>CPU: 18% · 4.8GHz</span>
                      <span>RAM: 14.2 GB</span>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'spotify-widget' || activeFlyout === 'spotify') && (
                  <div className="flyout-card">
                    <h4>Spotify Player</h4>
                    <p className="flyout-sub">Now Playing · Spotify</p>
                    <div className="flyout-media-btns">
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Spotify Prev')}>
                        Prev
                      </button>
                      <button type="button" className="primary-action" onClick={() => showNotification('Spotify Play/Pause')}>
                        Play/Pause
                      </button>
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Spotify Next')}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'obs-controller' || activeFlyout === 'video') && (
                  <div className="flyout-card">
                    <h4>OBS Stream Deck</h4>
                    <p className="flyout-sub">Stream Controls</p>
                    <div className="flyout-media-btns">
                      <button type="button" className="primary-action" onClick={() => showNotification('Streaming Toggled')}>
                        Stream
                      </button>
                      <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Recording Toggled')}>
                        Record
                      </button>
                    </div>
                  </div>
                )}
                {(activeFlyout === 'battery-health' || activeFlyout === 'bolt') && (
                  <div className="flyout-card">
                    <h4>Battery Diagnostics</h4>
                    <p className="flyout-sub">Health: 98% · Voltage: 4.12V</p>
                    <div className="flyout-row">
                      <span>Cycles: 42</span>
                      <span>Est. Remaining: 7h 45m</span>
                    </div>
                  </div>
                )}
                {activeFlyout === 'lab' && (
                  <div className="flyout-card">
                    <h4>Trigger Lab</h4>
                    <p className="flyout-sub">Quick test current weapon profile</p>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => showNotification('Adaptive Triggers Test Triggered')}
                    >
                      <IconFlask2 size={15} />
                      <span>Test Trigger Profile</span>
                    </button>
                  </div>
                )}
                {activeFlyout === 'ps' && (
                  <div className="flyout-card">
                    <h4>PlayStation Button</h4>
                    <p className="flyout-sub">Toggle Kitsune Quick Bar</p>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => void window.bridge.toggleKitsuneBar()}
                    >
                      <span>Toggle Overlay Window</span>
                    </button>
                  </div>
                )}
                {activeFlyout === 'home' && (
                  <div className="flyout-card">
                    <h4>DS5 Bridge Home</h4>
                    <p className="flyout-sub">Quick application navigation</p>
                    <button type="button" className="kitsune-btn-outline" onClick={() => showNotification('Returning to Overview')}>
                      <span>Overview Page</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bar Items Configuration Section */}
          <div className="kitsune-bar-items-section">
            <div className="kitsune-bar-items-header">
              <div className="header-titles">
                <h4>Bar Items</h4>
                <p>Choose each item's destination below. Core and Sleep stay fixed.</p>
              </div>
              <div className="header-actions">
                {/* Layer Selector */}
                <div className="kitsune-layer-select-wrap">
                  <select
                    className="kitsune-select"
                    value={viewLayer}
                    onChange={(e) => setViewLayer(Number(e.target.value))}
                    aria-label="Select Bar Items Layer"
                  >
                    {Array.from({ length: totalLayers }, (_, i) => i + 1).map((lvl) => {
                      const count = items.filter((it) => it.layer === lvl).length;
                      return (
                        <option key={lvl} value={lvl}>
                          {`Layer ${lvl} · ${count}/6`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  className="kitsune-btn-action"
                  title="Add another layer"
                  onClick={handleAddLayer}
                >
                  <IconPlus size={15} />
                  <span>Layer</span>
                </button>

                {totalLayers > 1 && (
                  <button
                    type="button"
                    className="kitsune-btn-action danger"
                    title={`Delete Layer ${viewLayer}`}
                    onClick={handleDeleteLayer}
                  >
                    <IconTrash size={15} />
                    <span>Delete Layer</span>
                  </button>
                )}

                <button
                  type="button"
                  className="kitsune-btn-action"
                  title="Create a new folder module"
                  onClick={handleAddFolder}
                >
                  <IconFolder size={15} />
                  <span>Folder</span>
                </button>

                <button
                  type="button"
                  className="kitsune-btn-action"
                  title="Reset to default layout"
                  onClick={handleResetLayout}
                >
                  <IconRotate size={15} />
                  <span>Reset Layout</span>
                </button>
              </div>
            </div>

            {/* Items Table / List */}
            <div className="kitsune-bar-items-list" role="list">
              {layerItemsInManager.map((item, idx) => (
                <div key={item.id} className="kitsune-item-row" role="listitem">
                  <div className="item-row-left">
                    <span className="item-drag-handle" title="Drag to reorder">
                      <IconGripVertical size={16} />
                    </span>
                    <span className="item-icon-wrap">{renderIcon(item.icon, 18)}</span>
                    <span className="item-name">{item.name}</span>
                  </div>

                  <div className="item-row-middle">
                    <span className="item-type-badge">{item.type === 'folder' ? 'Folder' : 'Module'}</span>
                  </div>

                  <div className="item-row-right">
                    <div className="item-reorder-btns">
                      <button
                        type="button"
                        className="reorder-arrow-btn"
                        disabled={idx === 0}
                        title="Move Up"
                        onClick={() => handleMoveItemOrder(idx, 'up')}
                      >
                        <IconChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="reorder-arrow-btn"
                        disabled={idx === layerItemsInManager.length - 1}
                        title="Move Down"
                        onClick={() => handleMoveItemOrder(idx, 'down')}
                      >
                        <IconChevronDown size={14} />
                      </button>
                    </div>

                    <select
                      className="kitsune-layer-destination-select"
                      value={item.layer}
                      aria-label={`Destination layer for ${item.name}`}
                      onChange={(e) => handleItemLayerChange(item.id, Number(e.target.value))}
                    >
                      {Array.from({ length: totalLayers }, (_, i) => i + 1).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {`Layer ${lvl}`}
                        </option>
                      ))}
                      <option value={0}>Hidden</option>
                    </select>

                    <button
                      type="button"
                      className="item-delete-btn"
                      title={`Remove ${item.name}`}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {layerItemsInManager.length === 0 && (
                <div className="kitsune-empty-layer">
                  <p>No modules assigned to Layer {viewLayer}. Use the dropdown above or add modules from Workshop.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workshop' && (
        <div className="kitsune-workshop-content">
          <div className="workshop-header">
            <div>
              <h3>Kitsune Workshop</h3>
              <p>Discover community modules, telemetry widgets, and quick controller overlays.</p>
            </div>
            <div className="workshop-search-box">
              <IconSearch size={16} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="workshop-grid">
            {WORKSHOP_CATALOG.filter(
              (mod) =>
                mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mod.category.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((mod) => {
              const installed = items.some((it) => it.id === mod.id);
              return (
                <div key={mod.id} className="workshop-card">
                  <div className="workshop-card-top">
                    <div className="workshop-icon-badge">{renderIcon(mod.icon, 22)}</div>
                    <div className="workshop-card-meta">
                      <h5>{mod.name}</h5>
                      <span className="workshop-category-pill">{mod.category}</span>
                    </div>
                  </div>
                  <p className="workshop-description">{mod.description}</p>
                  <div className="workshop-card-footer">
                    <span className="workshop-author-version">
                      {mod.author} · {mod.version}
                    </span>
                    {installed ? (
                      <div className="workshop-btn-group">
                        <button
                          type="button"
                          className="workshop-action-btn installed"
                          disabled
                        >
                          <IconCheck size={14} />
                          <span>Installed</span>
                        </button>
                        <button
                          type="button"
                          className="workshop-action-btn remove"
                          title="Remove from bar"
                          onClick={() => handleUninstallWorkshopModule(mod.id)}
                        >
                          <IconTrash size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="workshop-action-btn"
                        onClick={() => handleInstallWorkshopModule(mod)}
                      >
                        <IconPlus size={14} />
                        <span>Add to Bar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

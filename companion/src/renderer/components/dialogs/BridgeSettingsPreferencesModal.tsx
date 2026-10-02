import {
  IconBrandDiscord,
  IconBrandGithub,
  IconRadioactive,
  IconSettings as SettingsIcon,
  IconUpload,
  IconUsb,
  IconX as X
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../../shared/types';
import { CustomSelect } from '../ui/CustomSelect';
import {
  IDLE_DISCONNECT_TIMEOUT_OPTIONS,
  UI_SCALE_OPTIONS
} from '../../constants/app-constants';
import { ThemeOption } from '../ui/GlyphOptions';
import { UI_THEME_OPTIONS } from '../../ui-themes';
import psHomeGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import triangleGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/Triangle.svg';
import dpadUpGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Up.svg';
import dpadDownGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Down.svg';

export interface BridgeSettingsPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: BridgeSnapshot;
  connected: boolean;
  pendingAction: string | null;
  runAction: (label: string, action: () => Promise<BridgeSnapshot>) => Promise<void>;
  usbSuspendDisconnectSupported: boolean;
  wakeOnConnectSupported: boolean;
  sleepControllerSupported: boolean;
  settingsFocusTarget: string | null;
  picoFirmwareMessage: string | null;
  picoFirmwareError: string | null;
  nukePicoFlash: () => void;
  mountPicoBootloader: () => void;
  flashPicoFirmware: () => void;
}

export function BridgeSettingsPreferencesModal({
  isOpen,
  onClose,
  snapshot,
  connected,
  pendingAction,
  runAction,
  usbSuspendDisconnectSupported,
  wakeOnConnectSupported,
  sleepControllerSupported,
  settingsFocusTarget,
  picoFirmwareMessage,
  picoFirmwareError,
  nukePicoFlash,
  mountPicoBootloader,
  flashPicoFirmware
}: BridgeSettingsPreferencesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="settings-menu bridge-settings-modal bridge-settings-preferences-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Bridge settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <SettingsIcon size={16} />
            <span>Bridge Settings</span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="Close bridge settings"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="bridge-settings-columns">
          <div className="bridge-settings-column">
            <div className="settings-menu-section-label">Appearance</div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Theme</strong>
              </div>
              <CustomSelect
                value={snapshot.settings.uiThemePreset}
                options={UI_THEME_OPTIONS}
                className="settings-theme-select"
                showSelectedCheck={false}
                ariaLabel="UI theme"
                disabled={pendingAction !== null}
                renderValue={(label, value) => <ThemeOption label={label} value={value} />}
                renderOption={(label, value) => <ThemeOption label={label} value={value} />}
                onChange={(value) => {
                  void runAction('ui-theme', () => window.bridge.setUiThemePreset(value));
                }}
              />
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>UI Scale</strong>
              </div>
              <CustomSelect
                value={snapshot.settings.uiScalePercent}
                options={UI_SCALE_OPTIONS}
                className="settings-scale-select"
                showSelectedCheck={false}
                ariaLabel="UI scale"
                disabled={pendingAction !== null}
                onChange={(value) => {
                  void runAction('ui-scale', () => window.bridge.setUiScalePercent(value));
                }}
              />
            </div>
            <div className="settings-menu-section-label">General</div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Launch at Startup</strong>
                <span>Start in the tray when Windows starts</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.launchAtStartupEnabled}
                className={`switch ${snapshot.settings.launchAtStartupEnabled ? 'on' : ''}`}
                disabled={pendingAction !== null}
                onClick={() => void runAction('launch-at-startup', () => (
                  window.bridge.setLaunchAtStartupEnabled(!snapshot.settings.launchAtStartupEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Battery Tray Icon</strong>
                <span>Show controller battery percentage in the tray</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.showBatteryPercentTrayIcon}
                className={`switch ${snapshot.settings.showBatteryPercentTrayIcon ? 'on' : ''}`}
                disabled={pendingAction !== null}
                onClick={() => void runAction('battery-tray-icon', () => (
                  window.bridge.setShowBatteryPercentTrayIcon(!snapshot.settings.showBatteryPercentTrayIcon)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Pico LED</strong>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.ledEnabled}
                className={`switch ${snapshot.settings.ledEnabled ? 'on' : ''}`}
                disabled={!connected}
                onClick={() => void runAction('led', () => window.bridge.setLedEnabled(!snapshot.settings.ledEnabled))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-section-label">Connection Behavior</div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Idle Disconnect</strong>
              </div>
              <div className="settings-menu-controls">
                <CustomSelect
                  value={snapshot.settings.idleDisconnectTimeoutMinutes}
                  options={IDLE_DISCONNECT_TIMEOUT_OPTIONS}
                  className="settings-timeout-select"
                  showSelectedCheck={false}
                  ariaLabel="Idle disconnect timeout"
                  disabled={!connected || !snapshot.settings.idleDisconnectEnabled}
                  onChange={(value) => {
                    void runAction('idle-timeout', () => window.bridge.setIdleDisconnectTimeoutMinutes(value));
                  }}
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={snapshot.settings.idleDisconnectEnabled}
                  className={`switch ${snapshot.settings.idleDisconnectEnabled ? 'on' : ''}`}
                  disabled={!connected}
                  onClick={() => void runAction('idle', () => (
                    window.bridge.setIdleDisconnectEnabled(!snapshot.settings.idleDisconnectEnabled)
                  ))}
                >
                  <span />
                </button>
              </div>
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>PC Sleep Disconnect</strong>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.usbSuspendDisconnectEnabled}
                className={`switch ${snapshot.settings.usbSuspendDisconnectEnabled ? 'on' : ''}`}
                disabled={!connected || !usbSuspendDisconnectSupported}
                onClick={() => void runAction('usb-suspend', () => (
                  window.bridge.setUsbSuspendDisconnectEnabled(!snapshot.settings.usbSuspendDisconnectEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Wake PC on Controller</strong>
                <span>Wake through USB when a controller reconnects. Requires Windows wake permission and DualSense, DualSense Edge, or DS4 mode.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.wakeOnConnectEnabled}
                className={`switch ${snapshot.settings.wakeOnConnectEnabled ? 'on' : ''}`}
                disabled={!connected || !wakeOnConnectSupported || pendingAction !== null}
                onClick={() => void runAction('wake-on-connect', () => (
                  window.bridge.setWakeOnConnectEnabled(!snapshot.settings.wakeOnConnectEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-row pico-firmware-row">
              <div className="pico-firmware-header">
                <strong>Firmware</strong>
                <div className="pico-firmware-actions">
                  <button
                    type="button"
                    className="heading-action danger"
                    disabled={pendingAction !== null}
                    onClick={nukePicoFlash}
                  >
                    <IconRadioactive size={14} />
                    {pendingAction === 'pico-firmware-nuke' ? 'Nuking...' : 'Nuke'}
                  </button>
                  <div className="pico-firmware-dual-action" role="group" aria-label="Pico firmware bootloader actions">
                    <button
                      type="button"
                      className="heading-action"
                      disabled={pendingAction !== null}
                      onClick={mountPicoBootloader}
                    >
                      <IconUsb size={14} />
                      {pendingAction === 'pico-firmware-mount' ? 'Mounting...' : 'Mount'}
                    </button>
                    <button
                      type="button"
                      className="heading-action"
                      disabled={pendingAction !== null}
                      onClick={flashPicoFirmware}
                    >
                      <IconUpload size={14} />
                      {pendingAction === 'pico-firmware-flash' ? 'Flashing...' : 'Flash'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="settings-menu-copy pico-firmware-copy">
                <span>Mount reboots the Pico into UF2 mode. Flash copies a selected firmware UF2. Nuke wipes flash with Pico Universal Flash Nuke.</span>
                {picoFirmwareMessage ? (
                  <span className="pico-firmware-message good">{picoFirmwareMessage}</span>
                ) : null}
                {picoFirmwareError ? (
                  <span className="pico-firmware-message bad">{picoFirmwareError}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="bridge-settings-column">
            <div className="settings-menu-section-label">Power & Controller</div>
            <div className={`settings-menu-row ${settingsFocusTarget === 'controller-power-saving' ? 'settings-menu-row-highlight' : ''}`}>
              <div className="settings-menu-copy">
                <strong>Controller Power Saving</strong>
                <span>Caps haptics, triggers, and lightbar brightness at 60% while headphones are plugged in</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.controllerPowerSavingEnabled}
                className={`switch ${snapshot.settings.controllerPowerSavingEnabled ? 'on' : ''}`}
                disabled={pendingAction !== null}
                onClick={() => void runAction('controller-power-saving', () => (
                  window.bridge.setControllerPowerSavingEnabled(!snapshot.settings.controllerPowerSavingEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Player Slot LED</strong>
                <span>Show the controller player indicator lights</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.playerLedEnabled}
                className={`switch ${snapshot.settings.playerLedEnabled ? 'on' : ''}`}
                disabled={!connected}
                onClick={() => void runAction('player-led', () => (
                  window.bridge.setPlayerLedEnabled(!snapshot.settings.playerLedEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-section-label">Shortcuts</div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Block Edge Profile Switching</strong>
                <span>Reserve LFN/RFN + face buttons for chords when a DualSense Edge connects to this bridge</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.edgeProfileSwitchingBlocked}
                className={`switch ${snapshot.settings.edgeProfileSwitchingBlocked ? 'on' : ''}`}
                disabled={!connected || pendingAction !== null}
                onClick={() => void runAction('edge-profile-switching', () => (
                  window.bridge.setEdgeProfileSwitchingBlocked(!snapshot.settings.edgeProfileSwitchingBlocked)
                ))}
              >
                <span />
              </button>
            </div>
            <div className={`settings-menu-row ${settingsFocusTarget === 'sleep-shortcut' ? 'settings-menu-row-highlight' : ''}`}>
              <div className="settings-menu-copy settings-menu-copy-tooltip">
                <strong>Sleep Shortcut</strong>
                <div className="settings-shortcut-tooltip shortcut-glyph-tooltip" role="tooltip">
                  <span>Put controller to sleep with</span>
                  <span className="shortcut-glyph-row" aria-label="PlayStation Home and Triangle">
                    <span className="shortcut-glyph-key">
                      <img src={psHomeGlyphUrl} alt="PlayStation Home" />
                    </span>
                    <span className="shortcut-plus" aria-hidden="true">+</span>
                    <span className="shortcut-glyph-key">
                      <img src={triangleGlyphUrl} alt="Triangle" />
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.sleepKeybindEnabled}
                className={`switch ${snapshot.settings.sleepKeybindEnabled ? 'on' : ''}`}
                disabled={!connected || !sleepControllerSupported || pendingAction !== null}
                onClick={() => void runAction('sleep-keybind', () => (
                  window.bridge.setSleepKeybindEnabled(!snapshot.settings.sleepKeybindEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className={`settings-menu-row ${settingsFocusTarget === 'volume-shortcut' ? 'settings-menu-row-highlight' : ''}`}>
              <div className="settings-menu-copy settings-menu-copy-tooltip">
                <strong>Volume Shortcut</strong>
                <div className="settings-shortcut-tooltip shortcut-glyph-tooltip" role="tooltip">
                  <span>Controller volume up/down with</span>
                  <span className="shortcut-glyph-row" aria-label="PlayStation Home and D-pad Up or D-pad Down">
                    <span className="shortcut-glyph-key">
                      <img src={psHomeGlyphUrl} alt="PlayStation Home" />
                    </span>
                    <span className="shortcut-plus" aria-hidden="true">+</span>
                    <span className="shortcut-glyph-pair">
                      <span className="shortcut-glyph-key">
                        <img src={dpadUpGlyphUrl} alt="D-pad Up" />
                      </span>
                      <span className="shortcut-glyph-key">
                        <img src={dpadDownGlyphUrl} alt="D-pad Down" />
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.speakerVolumeShortcutEnabled}
                className={`switch ${snapshot.settings.speakerVolumeShortcutEnabled ? 'on' : ''}`}
                disabled={!connected}
                onClick={() => void runAction('volume-shortcut', () => (
                  window.bridge.setSpeakerVolumeShortcutEnabled(!snapshot.settings.speakerVolumeShortcutEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-section-label">Lightbar</div>
            <div className="settings-menu-row">
              <div className="settings-menu-copy">
                <strong>Automatic Restore</strong>
                <span>Reapply the saved color after games clear it</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.settings.lightbarRestoreEnabled}
                className={`switch ${snapshot.settings.lightbarRestoreEnabled ? 'on' : ''}`}
                disabled={!connected || pendingAction !== null}
                onClick={() => void runAction('lightbar-restore', () => (
                  window.bridge.setLightbarRestoreEnabled(!snapshot.settings.lightbarRestoreEnabled)
                ))}
              >
                <span />
              </button>
            </div>
            <div className="settings-menu-section-label">About</div>
            <button
              type="button"
              className="settings-menu-link-row"
              onClick={() => void window.bridge.openExternal('https://github.com/SundayMoments')}
            >
              <span className="settings-menu-link-icon" aria-hidden="true">
                <IconBrandGithub size={18} />
              </span>
              <span className="settings-menu-link-copy">
                <strong>GitHub</strong>
                <span>SundayMoments</span>
              </span>
            </button>
            <button
              type="button"
              className="settings-menu-link-row"
              onClick={() => void window.bridge.openExternal('https://discord.gg/By5jhh73wr')}
            >
              <span className="settings-menu-link-icon" aria-hidden="true">
                <IconBrandDiscord size={18} />
              </span>
              <span className="settings-menu-link-copy">
                <strong>Discord</strong>
                <span>Official DS5 Bridge Discord</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

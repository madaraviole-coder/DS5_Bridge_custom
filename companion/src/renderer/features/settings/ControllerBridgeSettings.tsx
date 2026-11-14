import psHomeGlyphUrl from '@product-assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';
import triangleGlyphUrl from '@product-assets/glyphs/ps5-buttons-outline-white/svg/Triangle.svg';
import dpadUpGlyphUrl from '@product-assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Up.svg';
import dpadDownGlyphUrl from '@product-assets/glyphs/ps5-buttons-outline-white/svg/D-Pad Down.svg';
import { CustomSelect } from '../../components/CustomSelect';
import { ToggleRow } from './SettingsToggleRow';
import {
  SearchableSetting,
  SettingsBridgeNotice,
  SettingsGroupLabel,
  settingsUnsupportedMessage,
  type SettingsCategoryProps
} from './SettingsCategoryContentSupport';

const GLYPH_LABELS = {
  home: 'PlayStation Home',
  triangle: 'Triangle',
  dpadUp: 'D-pad Up',
  dpadDown: 'D-pad Down'
} as const;

export const IDLE_DISCONNECT_TIMEOUT_OPTIONS: Array<[string, number]> = [
  ['5 min', 5],
  ['15 min', 15],
  ['30 min', 30]
];

// ponytail: fixed presets (250/350/500), upgrade if user-defined presets are needed
export const PS_DEBOUNCE_PRESETS = [
  { label: '250ms', val: 250 },
  { label: '350ms', val: 350 },
  { label: '500ms', val: 500 }
] as const;

function ShortcutGlyphs({ label, glyphs }: {
  readonly label: string;
  readonly glyphs: ReadonlyArray<ReadonlyArray<readonly [url: string, name: string]>>;
}) {
  return (
    <span className="shortcut-glyph-row" aria-label={label}>
      {glyphs.map((group, index) => (
        <span key={group.map(([, name]) => name).join('-')} className="shortcut-glyph-pair">
          {index > 0 ? <span className="shortcut-plus" aria-hidden="true">+</span> : null}
          {group.map(([url, name]) => (
            <span key={name} className="shortcut-glyph-key"><img src={url} alt={name} /></span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function ConnectionPowerSettings({ model, actions, matchingSettingIds }: SettingsCategoryProps) {
  const { settings } = model;
  return <>
    <h3 className="settings-menu-section-label">Connection &amp; Power</h3>
    <SettingsBridgeNotice model={model} ids={['idle-disconnect', 'pc-sleep-disconnect']} matchingSettingIds={matchingSettingIds} />
    <SearchableSetting id="idle-disconnect" matchingSettingIds={matchingSettingIds}>
      <div className="settings-menu-row">
        <div className="settings-menu-copy">
          <strong id="settings-idle-disconnect-label">Idle Disconnect</strong>
          <span>Disconnect the controller after it sits unused</span>
        </div>
        <div className="settings-menu-controls">
          <CustomSelect
            value={settings.idleDisconnectTimeoutMinutes}
            options={IDLE_DISCONNECT_TIMEOUT_OPTIONS}
            className="settings-timeout-select"
            floatingMenu
            floatingMenuAlign="end"
            showSelectedCheck={false}
            ariaLabel="Idle disconnect timeout"
            disabled={!model.connected || !settings.idleDisconnectEnabled || model.busy}
            onChange={actions.setIdleDisconnectTimeout}
          />
          <button
            type="button"
            role="switch"
            aria-labelledby="settings-idle-disconnect-label"
            aria-checked={settings.idleDisconnectEnabled}
            className={`switch ${settings.idleDisconnectEnabled ? 'on' : ''}`}
            disabled={!model.connected || model.busy}
            onClick={actions.toggleIdleDisconnect}
          >
            <span />
          </button>
        </div>
      </div>
    </SearchableSetting>
    <SearchableSetting id="pc-sleep-disconnect" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="PC Sleep Disconnect"
        description="Disconnect the controller when the PC sleeps"
        checked={settings.usbSuspendDisconnectEnabled}
        disabled={!model.connected || !model.support.usbSuspendDisconnect || model.busy}
        unavailableReason={settingsUnsupportedMessage(model, model.support.usbSuspendDisconnect)}
        onToggle={actions.toggleUsbSuspendDisconnect}
      />
    </SearchableSetting>
    <SettingsGroupLabel label="Power" ids={['controller-power-saving']} matchingSettingIds={matchingSettingIds} />
    <SearchableSetting id="controller-power-saving" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Controller Power Saving"
        description="Caps haptics, triggers, and lightbar brightness at 60% while headphones are plugged in"
        checked={settings.controllerPowerSavingEnabled}
        disabled={model.busy}
        highlighted={model.focusTarget === 'controller-power-saving'}
        onToggle={actions.toggleControllerPowerSaving}
      />
    </SearchableSetting>
  </>;
}

export function LightsSettings({ model, actions, matchingSettingIds }: SettingsCategoryProps) {
  const { settings } = model;
  return <>
    <h3 className="settings-menu-section-label">Lights &amp; Indicators</h3>
    <SettingsBridgeNotice model={model} ids={['pico-led', 'player-slot-led', 'lightbar-restore']} matchingSettingIds={matchingSettingIds} />
    <SearchableSetting id="pico-led" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Bridge LED"
        description="Light the Pico status LED"
        checked={settings.ledEnabled}
        disabled={!model.connected || model.busy}
        onToggle={actions.toggleLed}
      />
    </SearchableSetting>
    <SearchableSetting id="player-slot-led" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Player LEDs"
        description="Show the controller player indicator lights"
        checked={settings.playerLedEnabled}
        disabled={!model.connected || model.busy}
        onToggle={actions.togglePlayerLed}
      />
    </SearchableSetting>
    <SettingsGroupLabel label="Light Bar" ids={['lightbar-restore']} matchingSettingIds={matchingSettingIds} />
    <SearchableSetting id="lightbar-restore" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Automatic Restore"
        description="Reapply the saved color after games clear it"
        checked={settings.lightbarRestoreEnabled}
        disabled={!model.connected || model.busy}
        onToggle={actions.toggleLightbarRestore}
      />
    </SearchableSetting>
  </>;
}

export function ShortcutSettings({ model, actions, matchingSettingIds }: SettingsCategoryProps) {
  const { settings } = model;
  return <>
    <h3 className="settings-menu-section-label">Shortcuts</h3>
    <SettingsBridgeNotice
      model={model}
      ids={['edge-profile-switching', 'sleep-shortcut', 'volume-shortcut']}
      matchingSettingIds={matchingSettingIds}
    />
    <SearchableSetting id="sleep-shortcut" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Sleep Shortcut"
        description="Put the controller to sleep from the controller"
        tooltip={(
          <span className="settings-shortcut-tooltip-copy">
            <span>Put controller to sleep with</span>
            <ShortcutGlyphs
              label="PlayStation Home and Triangle"
              glyphs={[[[psHomeGlyphUrl, GLYPH_LABELS.home]], [[triangleGlyphUrl, GLYPH_LABELS.triangle]]]}
            />
          </span>
        )}
        checked={settings.sleepKeybindEnabled}
        disabled={!model.connected || !model.support.sleepController || model.busy}
        unavailableReason={settingsUnsupportedMessage(model, model.support.sleepController)}
        highlighted={model.focusTarget === 'sleep-shortcut' || model.focusTarget === 'shortcuts'}
        onToggle={actions.toggleSleepShortcut}
      />
    </SearchableSetting>
    <SearchableSetting id="volume-shortcut" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Volume Shortcut"
        description="Change the controller speaker volume from the controller"
        tooltip={(
          <span className="settings-shortcut-tooltip-copy">
            <span>Controller volume up/down with</span>
            <ShortcutGlyphs
              label="PlayStation Home and D-pad Up or D-pad Down"
              glyphs={[[[psHomeGlyphUrl, GLYPH_LABELS.home]], [[dpadUpGlyphUrl, GLYPH_LABELS.dpadUp], [dpadDownGlyphUrl, GLYPH_LABELS.dpadDown]]]}
            />
          </span>
        )}
        checked={settings.speakerVolumeShortcutEnabled}
        disabled={!model.connected || model.busy}
        highlighted={model.focusTarget === 'volume-shortcut' || model.focusTarget === 'shortcuts'}
        onToggle={actions.toggleVolumeShortcut}
      />
    </SearchableSetting>
    <SearchableSetting id="edge-profile-switching" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Block Edge Profile Switching"
        description="Reserve LFN/RFN + face buttons for chords when a DualSense Edge connects to this bridge"
        checked={settings.edgeProfileSwitchingBlocked}
        disabled={!model.connected || model.busy}
        onToggle={actions.toggleEdgeProfileSwitching}
      />
    </SearchableSetting>
    <SearchableSetting id="kitsune-bar-enabled" matchingSettingIds={matchingSettingIds}>
      <ToggleRow
        label="Kitsune Bar Overlay"
        description="Enable controller overlay and shortcut bar"
        checked={settings.kitsuneBarSettings?.enabled ?? false}
        disabled={model.busy}
        onToggle={actions.toggleKitsuneBarEnabled}
      />
    </SearchableSetting>
    <SearchableSetting id="kitsune-bar-debounce" matchingSettingIds={matchingSettingIds}>
      <div className="settings-menu-row">
        <div className="settings-menu-copy">
          <strong id="settings-kitsune-bar-debounce-label">PS Button Debounce</strong>
          <span>Delay in milliseconds to prevent accidental double taps on PS button</span>
        </div>
        <div className="settings-menu-controls">
          <span className="settings-debounce-value" style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-secondary)' }}>
            {settings.kitsuneBarSettings?.debounceMs ?? 350} ms
          </span>
          <div className="kitsune-debounce-presets" role="group" aria-label="PS Button Debounce Presets">
            {PS_DEBOUNCE_PRESETS.map((preset) => (
              <button
                key={preset.val}
                type="button"
                className={`kitsune-preset-chip ${(settings.kitsuneBarSettings?.debounceMs ?? 350) === preset.val ? 'active' : ''}`}
                disabled={model.busy}
                onClick={() => actions.setKitsuneBarDebounceMs(preset.val)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={150}
            max={800}
            step={25}
            aria-label="PS Button Debounce"
            aria-labelledby="settings-kitsune-bar-debounce-label"
            value={settings.kitsuneBarSettings?.debounceMs ?? 350}
            disabled={model.busy}
            onChange={(e) => actions.setKitsuneBarDebounceMs(Number(e.target.value))}
          />
        </div>
      </div>
    </SearchableSetting>
  </>;
}

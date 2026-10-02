# Layout Check & Test Guard Synchronization Analysis Report

## Executive Summary
This investigation resolves the failures in `npm run layout:check` and establishes a zero-regression test guard maintenance strategy for the companion UI modularization refactor. 

Key Findings:
1. `layout-check.mjs` fails immediately on line 124 (`TimeoutError: 30000ms exceeded`) because `<nav className="control-tabs" aria-label="Controls">` in `App.tsx` (line 7452) lacks `role="tablist"`. Playwright query `page.getByRole('tablist', { name: 'Controls' })` fails to resolve.
2. Commit `9548037` reorganized the sidebar into collapsible accordion groups (`Controller`, `Input`, `Labs`), leaving them collapsed by default (`openControlGroupId === null`), relocated `System` outside `<nav>` into `.sidebar-actions`, renamed `'Triggers'` to `'Adaptive Triggers'`, and promoted `Audio Haptics` from an inline switch to a dedicated tab inside the `Labs` group. While `visual-smoke.mjs` was partially adapted, `layout-check.mjs` was not synchronized, resulting in multiple subsequent timeouts and selector misses.
3. In `companion/src/renderer/app-behavior.test.ts` (38 tests) and `styles-layout.test.ts` (10 tests), assertions directly inspect `App.tsx` via `readFileSync`. Decomposing `App.tsx` into modular components will break these guards unless a dual-phase synchronization strategy (dynamic source aggregation during M1–M5 transitioning to targeted modular imports) is applied.

---

## 1. Root Cause Analysis: `npm run layout:check`

### 1.1 Verbatim Error Reproduction
Running `node scripts/layout-check.mjs` after `npm run build:app`:
```
locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('tablist', { name: 'Controls' }).getByRole('tab', { name: 'Overview' })

    at G:\Documents\GitHub\DS5_Bridge_custom\companion\scripts\layout-check.mjs:124:60 {
  name: 'TimeoutError'
}
```

### 1.2 Identified Failure Points

| # | Failure Point | Location in Code | Mechanism & Consequence |
|---|---------------|------------------|-------------------------|
| 1 | **Missing `role="tablist"` on Controls Nav** | `App.tsx:7452`<br>`layout-check.mjs:73` | In `App.tsx:7452`, `<nav className="control-tabs" aria-label="Controls">` has the default ARIA role `navigation`. `layout-check.mjs:73` queries `page.getByRole('tablist', { name: 'Controls' })`. Playwright fails to find the tablist and times out after 30 seconds at line 124 trying to click `Overview`. |
| 2 | **Collapsed Accordion Tab Groups** | `App.tsx:2879, 7472`<br>`layout-check.mjs:176-178` | State `openControlGroupId` defaults to `null`. Groups (`Controller`, `Input`, `Labs`) are collapsed (`grid-template-rows: 0fr`, `overflow: hidden`, `tabIndex: -1`). Once `role="tablist"` is fixed, `controlsNav.getByRole('tab', { name: tab }).click()` for `Haptics`, `Audio`, `Triggers`, `Lighting` times out because the tabs are hidden inside the collapsed `Controller` accordion. |
| 3 | **Relocation of System Tab** | `App.tsx:7542-7553`<br>`layout-check.mjs:177, 559` | Commit `9548037` moved `System` out of `<nav className="control-tabs">` into `.sidebar-actions > .header-settings` as `<button id="control-tab-system" className="sidebar-action-button">`. It has no `role="tab"` and is not a descendant of `controlsNav`. `controlsNav.getByRole('tab', { name: 'System' })` will fail. |
| 4 | **Tab Naming Drift (`Triggers` vs `Adaptive Triggers`)** | `App.tsx:817`<br>`layout-check.mjs:7, 8` | In `CONTROL_TAB_DEFINITIONS.triggers`, the label was updated to `'Adaptive Triggers'`. `layout-check.mjs` lists `'Triggers'`. Strict-mode queries or exact matching without fallback will miss the tab. |
| 5 | **Removal of Inline Audio Haptics Switch** | `App.tsx:8258`<br>`layout-check.mjs:256, 436` | Commit `9548037` eliminated the inline toggle `<button role="switch" aria-label="Enter Audio Haptics">` from the Haptics page (`expect(appSource).not.toContain('setAudioHapticsOpen')`). Audio Haptics was promoted to a full tab in the `Labs` group. Lines 256 and 436 in `layout-check.mjs` try to click non-existent switches and time out. |
| 6 | **Playwright Strict Mode / Ambiguity between `Haptics` and `Audio Haptics`** | `layout-check.mjs:177, 254` | If substring matching is used, `getByRole('tab', { name: 'Haptics' })` matches both `Haptics` and `Audio Haptics` when the `Labs` group is expanded or visible, triggering Playwright strict mode violation. |

---

## 2. Comparative Analysis: `layout-check.mjs` vs `visual-smoke.mjs`

| Dimension | `companion/scripts/visual-smoke.mjs` | `companion/scripts/layout-check.mjs` (Current) |
|---|---|---|
| **Controls Container Selector** | `page.getByRole('navigation', { name: 'Controls' })` (line 98) | `page.getByRole('tablist', { name: 'Controls' })` (line 73) |
| **Accordion Expansion** | Inspects visibility; if hidden, clicks parent group trigger (`Controller` or `Input`) (lines 107–112) | Blindly attempts to click tab without expanding groups; causes timeout (lines 177, 440) |
| **System Tab Handling** | Special-cases System: `page.getByRole('button', { name: 'System', exact: true }).click()` (line 104) | Treats System as a tab inside `controlsNav`: `controlsNav.getByRole('tab', { name: 'System' })` (lines 177, 559) |
| **Audio Haptics Handling** | Guards switch with `if (await enterAudioHaptics.count())` (gracefully skipped) (lines 161–172) | Hard-fails on unconditional `await page.getByRole('switch', { name: 'Enter Audio Haptics' }).click()` (line 256) |
| **Tab Label Consistency** | Uses full labels: `'Adaptive Triggers'`, `'Stick Deadzones'`, `'Button Remapping'` (line 9) | Uses legacy short labels: `'Triggers'` (lines 7, 8) |

---

## 3. Exact Fix Design for `App.tsx` and `scripts/layout-check.mjs`

### 3.1 `companion/src/renderer/App.tsx` Fix
Add `role="tablist"` to the `<nav>` element at line 7452:

```diff
--- a/companion/src/renderer/App.tsx
+++ b/companion/src/renderer/App.tsx
@@ -7449,7 +7449,7 @@ export function App() {
           </div>
           <div className="sidebar-section-label">Controls</div>
           <div className="sidebar-controls">
-            <nav className="control-tabs" aria-label="Controls">
+            <nav className="control-tabs" role="tablist" aria-label="Controls">
               {(() => {
                 const { id, label, Icon } = CONTROL_TAB_DEFINITIONS.overview;
                 return (
```

### 3.2 `companion/scripts/layout-check.mjs` Fix
Introduce a unified, robust `selectTab(tabName)` helper in `scripts/layout-check.mjs`:
1. If `tabName === 'System'`, click `#control-tab-system`.
2. Map canonical group memberships:
   - `Controller`: `Devices`, `Audio`, `Haptics`, `Adaptive Triggers` / `Triggers`, `Lighting`
   - `Input`: `Stick Deadzones`, `Button Remapping`, `Chords`
   - `Labs`: `Audio Haptics`, `Trigger Lab`
3. Check visibility of the target tab with `exact: true`. If not visible, expand its containing accordion group.
4. Click the tab button.
5. In Audio Haptics testing, replace `getByRole('switch', { name: 'Enter Audio Haptics' })` with `await selectTab('Audio Haptics')`, and replace `getByRole('switch', { name: 'Exit Audio Haptics' })` with transitioning to the next test tab (`await selectTab('Haptics')`).

```javascript
  // Helper to safely navigate tabs across accordion groups and standalone buttons
  const groupMap = {
    'Devices': 'Controller',
    'Audio': 'Controller',
    'Haptics': 'Controller',
    'Triggers': 'Controller',
    'Adaptive Triggers': 'Controller',
    'Lighting': 'Controller',
    'Stick Deadzones': 'Input',
    'Button Remapping': 'Input',
    'Chords': 'Input',
    'Audio Haptics': 'Labs',
    'Trigger Lab': 'Labs'
  };

  const selectTab = async (tabName) => {
    if (tabName === 'System') {
      await page.locator('#control-tab-system').click();
      await page.waitForTimeout(150);
      return;
    }

    const targetLabel = tabName === 'Triggers' ? 'Adaptive Triggers' : tabName;
    const tabButton = controlsNav.getByRole('tab', { name: targetLabel, exact: true });

    if (!(await tabButton.isVisible())) {
      const groupName = groupMap[tabName] || groupMap[targetLabel];
      if (groupName) {
        await controlsNav.getByRole('button', { name: groupName, exact: true }).click();
        await page.waitForTimeout(100);
      }
    }

    await tabButton.click();
    await page.waitForTimeout(150);
  };
```

#### Application in `layout-check.mjs`:
- Line 124: `await controlsNav.getByRole('tab', { name: 'Overview' }).click();` (remains valid as Overview is not grouped).
- Lines 176–178: Replace loop body with `await selectTab(tab);`.
- Lines 254–257: Replace with `await selectTab('Audio Haptics');`.
- Line 436: Replace `Exit Audio Haptics` click with `await selectTab('Haptics');` (or let loop handle it).
- Lines 439–441: In `testButtonTabs`, use `await selectTab(tab);`.
- Line 559: Replace `await controlsNav.getByRole('tab', { name: 'System' }).click();` with `await selectTab('System');`.

### 3.3 Alignment Recommendation for `visual-smoke.mjs`
In `companion/scripts/visual-smoke.mjs` line 98, change:
`const controlsNav = page.getByRole('navigation', { name: 'Controls' });`
to:
`const controlsNav = page.getByRole('tablist', { name: 'Controls' });` (or `page.locator('nav.control-tabs')`).
This ensures both test scripts use uniform ARIA role querying.

---

## 4. Comprehensive Map of `App.tsx` String Inspections in Tests

`app-behavior.test.ts` (38 tests) and `styles-layout.test.ts` (10 tests) inspect `appSource = readFileSync(..., 'utf8')`. Below is the complete catalog of assertions mapped to their future modular homes:

### 4.1 `companion/src/renderer/app-behavior.test.ts`

| Test Name (Line #) | Inspected Identifiers / Patterns in `App.tsx` | Target Modular File |
|---|---|---|
| `ports Devices as a firmware-backed controller management tab` (27) | `{ id: 'devices', label: 'Devices', Icon: IconBluetooth }`<br>`<ControllerDevicesPage`<br>`window.bridge.requestControllerScan()`<br>`window.bridge.forgetControllerPairings()`<br>`window.bridge.forgetControllerPairing(request.bluetoothAddress)`<br>`observeControllerDevice(`<br>`saveControllerDeviceCache(window.localStorage` | `App.tsx` (shell definition & component render)<br>`hooks/useBridgeTelemetry.ts` or `pages/ControllerDevicesPage.tsx` |
| `does not expose retired host encoder controls` (50) | `not.toContain('toggleHostEncodedAudioEnabled')`<br>`not.toContain('setHostEncodedAudioEnabled')`<br>`not.toContain('Disable Host Encoding?')`<br>`not.toContain('Enable host encoded audio')`<br>`toContain('Pico Local')` | `pages/AudioPage.tsx`<br>`hooks/useAudioState.ts` |
| `presents DualSense Edge as a PlayStation host persona` (58) | `['DualSense Edge', 'dualsense-edge']`<br>`['DualSense Edge', 'persona-dualsense-edge']`<br>`extractFunction('HostPersonaOption')` | `pages/OverviewPage.tsx`<br>`components/ui/HostPersonaOption.tsx` |
| `requires explicit confirmation and a disconnected controller before emergency device repair` (66) | `extractFunction('openDeviceCleanupConfirm')`<br>`extractFunction('runWindowsDeviceCleanup')`<br>`IconTool`<br>`setDeviceCleanupConfirmVisible(true)`<br>`controllerConnected`<br>`repairWindowsDeviceCache`<br>`Emergency Device Repair` | `components/dialogs/DeviceCleanupConfirmModal.tsx`<br>`pages/SystemPage.tsx`<br>`hooks/useSystemState.ts` |
| `does not block haptic testing just because audio is active` (81) | Slices between `const testHapticsUnavailable =` and `const hapticsStatusReady =`<br>`not.toContain('gameStreamActive')`<br>`not.toContain('audioRecent')` | `pages/HapticsPage.tsx`<br>`hooks/useHapticsState.ts` |
| `does not block rumble testing while game output is active` (93) | Slices between `const testRumbleUnavailable =` and `const hapticsStatusReady =`<br>`not.toContain('gameStreamActive')` | `pages/HapticsPage.tsx`<br>`hooks/useHapticsState.ts` |
| `keeps haptic test and cooldown labels as real test state` (105) | Slices `<button className="primary-action" ... activeFeedbackTestUnavailable>`<br>`not.toContain('Audio Active')`<br>`toContain('testLocked')`<br>`toContain('snapshot.status?.testHapticsCooldown')` | `pages/HapticsPage.tsx` |
| `does not show generic command-pending copy in renderer status badges` (116) | `not.toContain('Command Pending')` | All renderer files |
| `distinguishes controller-ready, wake-enabled, and bridge-only health states` (120) | Slices `function healthLabel` to `function hexByte`<br>`return 'Wake with controller enabled';`<br>`return 'Bridge online';`<br>`return 'All systems normal';`<br>`title={overviewHealthTitle}` | `pages/OverviewPage.tsx`<br>`hooks/useBridgeTelemetry.ts` |
| `dims primary feature toggles when the controller is unavailable` (138) | `const controllerControlsAvailable = connected && controllerConnected;`<br>`controllerControlsAvailable ? '' : 'controller-unavailable'`<br>`disabled={!controllerControlsAvailable \|\| pendingAction !== null}` | `pages/OverviewPage.tsx`<br>`hooks/useDeviceConnection.ts` |
| `offers a persisted automatic lightbar restore toggle in bridge settings` (147) | `<strong>Automatic Restore</strong>`<br>`Reapply the saved color after games clear it`<br>`snapshot.settings.lightbarRestoreEnabled`<br>`window.bridge.setLightbarRestoreEnabled(`<br>`indexOf('>Lightbar</div>') < indexOf('>About</div>')` | `components/dialogs/BridgeSettingsModal.tsx` |
| `links the official DS5 Bridge Discord from About` (155) | `IconBrandDiscord`<br>`window.bridge.openExternal('https://discord.gg/By5jhh73wr')`<br>`<strong>Discord</strong>` | `components/dialogs/BridgeSettingsModal.tsx` |
| `uses the device container border instead of a compact status dot` (162) | `const sidebarDeviceTone =`<br>`className={`hero-main device-status-${sidebarDeviceTone}`}`<br>`<div className="bridge-state compact-device-status">` | `App.tsx` (sidebar) |
| `exposes the firmware-gated audio buffer length control` (173) | `AUDIO_BUFFER_LENGTH_MIN = 16`<br>`audioBufferLengthControlSupported`<br>`window.bridge.setHapticsBufferLength`<br>`Audio Buffer Length`<br>`audio-buffer-readout`<br>`className={`audio-buffer-control framed-slider`<br>Index ordering checks for presets, buffer, testCard | `pages/AudioPage.tsx`<br>`hooks/useAudioState.ts` |
| `exposes Pico firmware maintenance actions in Bridge Settings` (198) | `function mountPicoBootloader()`<br>`function flashPicoFirmware()`<br>`function nukePicoFlash()`<br>`window.bridge.mountPicoBootloader()`<br>`pico-firmware-dual-action` | `components/dialogs/BridgeSettingsModal.tsx`<br>`components/dialogs/FirmwareUpdateModal.tsx` |
| `exposes the battery percentage tray icon preference in Bridge Settings` (212) | `Battery Tray Icon`<br>`snapshot.settings.showBatteryPercentTrayIcon`<br>`window.bridge.setShowBatteryPercentTrayIcon`<br>`Wake PC on Controller`<br>`firmwareFlags.wakeOnConnectControl` | `components/dialogs/BridgeSettingsModal.tsx` |
| `exposes the DualSense Edge profile blocker and uses it to gate reserved chords` (222) | `Block Edge Profile Switching`<br>`snapshot.settings.edgeProfileSwitchingBlocked`<br>`window.bridge.setEdgeProfileSwitchingBlocked`<br>`isChordBindingAllowed(` | `pages/chords/ChordsPage.tsx`<br>`pages/chords/chord-math-helpers.ts` |
| `distinguishes active charging from connected external power` (230) | `function isChargingPowerState(...)`<br>`function isExternalPowerState(...)`<br>`batteryCharging ? 'Charging' : 'Connected to power'`<br>`device-power-indicator` | `pages/OverviewPage.tsx` or `hooks/useBridgeTelemetry.ts` |
| `uses the compact Kitsune device card as a Devices shortcut` (244) | `sidebarControllerCard = controllerDevicesModel.cards.find(`<br>`aria-label="Open Devices"`<br>`onClick={() => selectControlTab('devices')}`<br>`device-meta-row`<br>`device-battery-percentage` | `App.tsx` (sidebar card) |
| `keeps the haptics test button actionable instead of relabeling it as game-active` (257) | Slice `<button className="primary-action" ...>`<br>`not.toContain('Game Active')`<br>`testLocked`<br>`Test Haptics` | `pages/HapticsPage.tsx` |
| `keeps the rumble test button actionable instead of relabeling it as game-active` (271) | Slice `<button className="primary-action" ...>`<br>`not.toContain('Game Active')`<br>`testLocked`<br>`Test Rumble` | `pages/HapticsPage.tsx` |
| `does not let initial status overwrite a newer live snapshot` (287) | `let cancelled = false;`<br>`let receivedLiveSnapshot = false;`<br>`if (!cancelled && !receivedLiveSnapshot)` | `hooks/useBridgeTelemetry.ts` |
| `does not snap snapshot values back to coarse slider notches` (298) | Slices `function displayHapticsValue` to `function sliderTickClass`<br>`not.toContain('snapHapticsValue')`<br>`snapshot.settings.hapticsGainPercent`<br>`snapshot.settings.lightbarBrightnessPercent` | `hooks/useOverviewState.ts`<br>`pages/OverviewPage.tsx` |
| `shows mute as a chord starter when chord mode or keyboard chord starter is active` (313) | `mute: { id: CHORD_MUTE_STARTER_ID, label: 'Mute Button', Icon: MicOff }`<br>`chords-starter-icon-glyph`<br>`function chordStarterOptionsFor`<br>`muteButtonChordStarterActive`<br>`window.bridge.setMuteButtonAction` | `pages/chords/ChordsPage.tsx`<br>`hooks/useChordsState.ts` |
| `offers Print Screen and numpad numerals as chord keyboard shortcut keys` (335) | `CHORD_KEYBOARD_KEY_OPTIONS`<br>`['Print Screen', 'Print Screen']`<br>`extractFunction('normalizeChordKeyLabel')` | `pages/chords/chord-math-helpers.ts` |
| `exposes bridge selection, stable naming, and direct USB controller status` (354) | `snapshot?.bridgeDevices ?? null`<br>`window.bridge.selectBridge`<br>`window.bridge.setBridgeLabel`<br>`title="Rename bridge"`<br>`USB direct` | `App.tsx` (sidebar bridge selector) |
| `groups sidebar controls and promotes the two labs to navigation destinations` (367) | `type ControlTabGroupId = 'controller' \| 'input' \| 'labs'`<br>`id: 'labs'`<br>`label: 'Labs'`<br>`CONTROL_TAB_GROUPS.map`<br>`triggerLabOpen = activeControlTab === 'trigger-lab'`<br>`audioHapticsOpen = activeControlTab === 'audio-haptics'`<br>`sidebar-action-button ${activeControlTab === 'system' ? 'active' : ''}` | `App.tsx` (shell tab definitions & routing) |
| `exposes only radial stick deadzones from the premium analog controls` (384) | Slices `id="control-panel-deadzones"` to `<FeatureTipsPanel tab="deadzones" />`<br>`deadzones: { id: 'deadzones', label: 'Stick Deadzones'`<br>`window.bridge.setRadialDeadzones`<br>`radialDeadzonePreview(`<br>`title: 'Tune Each Stick'` | `pages/DeadzonesPage.tsx`<br>`hooks/useDeadzonesState.ts` |
| `keeps all four abbreviated personas on the overview quick-actions row` (414) | `dualsense: 'DS'`<br>`dualsense-edge: 'DSE'`<br>`ds4: 'DS4'`<br>`xbox: 'XBOX'`<br>`HOST_PERSONA_SHORT_LABELS` | `pages/OverviewPage.tsx` |
| `advertises Kitsune Input with a dismissible titlebar promotion` (424) | `import '@fontsource/montserrat/latin-500.css';`<br>`!snapshot.settings.kitsuneInputPromotionDismissed`<br>`aria-label="Explore Kitsune Input"`<br>`Take controller customization further`<br>`window.bridge.setKitsuneInputPromotionDismissed` | `components/ui/KitsuneInputPromotionDialog.tsx`<br>`App.tsx` |
| `keeps Audio Haptics page enablement aligned with its feature tile` (459) | `aria-checked={audioHapticsOpen ? audioReactiveHapticsEnabled : activeHapticsFeatureEnabled}`<br>`window.bridge.setHapticsEnabled(true)`<br>`window.bridge.setAudioReactiveHapticsConfig` | `pages/HapticsPage.tsx`<br>`hooks/useHapticsState.ts` |
| `keeps Trigger Lab enablement independent from the global adaptive-trigger setting` (468) | `triggerLabEnabled, setTriggerLabEnabled`<br>`triggerPageEnabled = triggerLabOpen ? triggerLabEnabled : adaptiveTriggersEnabled`<br>`runAction('trigger-lab-enabled', () => window.bridge.resetAdaptiveTriggers())` | `pages/TriggersPage.tsx`<br>`hooks/useTriggersState.ts` |
| `restores Trigger Lab independently, including after global trigger settings change` (477) | `[adaptiveTriggersEnabled, connected, triggerLabEnabled]`<br>`triggerLabRestoreAppliedRef.current = false` | `hooks/useTriggersState.ts` |
| `integrates Touchpad 4-zone remapping and gesture builder` (483) | `remappingSubTab, setRemappingSubTab`<br>`TOUCHPAD CANVAS`<br>`GESTURE BUILDER`<br>`4-Zone Button Mapping`<br>`ZONE 1`..`ZONE 4` | `pages/remapping/RemapTouchpadSubPage.tsx`<br>`pages/remapping/RemappingPage.tsx` |
| `renders Kitsune-style Overview cards with Game Profile auto-switch and Technical Status` (500) | `aria-label="Active Game"`<br>`Auto-switch`<br>`Edit Profile`<br>`Game Profiles`<br>`Technical Status`<br>`window.bridge.saveGameProfile`<br>`game-profiles-modal`<br>`kitsune-bar-modal` | `pages/OverviewPage.tsx`<br>`components/dialogs/GameProfilesModal.tsx`<br>`hooks/useOverviewState.ts` |
| `renders Touchpad Swipe Sequence action configuration` (537) | `touchpad-gesture-action-section`<br>`Swipe Gesture Action`<br>`touchpad-gesture-test-btn`<br>`Direction Presets:` | `pages/remapping/RemapTouchpadSubPage.tsx` |
| `renders Turbo Mode with Kitsune Multi-Actions layout matching design` (563) | `multi-actions-container`<br>`Action Library`<br>`Trigger Assignments`<br>`new-trigger-btn`<br>`turbo-tester-bar`<br>`HOLD TO TEST CADENCE` | `pages/remapping/RemapTurboSubPage.tsx` |

### 4.2 `companion/src/renderer/styles-layout.test.ts`

| Test Name (Line #) | Inspected Identifiers / Patterns in `App.tsx` | Target Modular File |
|---|---|---|
| `keeps system card subtitles short enough for shared headers` (112) | `'Firmware'`<br>`'Debug Data'`<br>`not.toContain('Firmware and polling.')` | `pages/SystemPage.tsx` |
| `defines preset theme selectors and the Bridge Settings theme control` (143) | `ariaLabel="UI theme"`<br>`settings-theme-select`<br>`UI_THEME_PREVIEW_SWATCHES` | `components/dialogs/BridgeSettingsModal.tsx` |
| `uses the cached theme and branded panel for the startup loading state` (161) | `UI_THEME_PRESET_STORAGE_KEY`<br>`STARTUP_TUTORIAL_COMPLETED_STORAGE_KEY`<br>`function StartupScreen`<br>`storedUiThemePreset` | `components/ui/StartupTutorial.tsx`<br>`App.tsx` |
| `uses theme-aware colors for the navbar bridge mark` (213) | `function BridgeMark()`<br>`fill="var(--bridge-mark-primary)"`<br>`fill="var(--bridge-mark-secondary)"` | `components/ui/BridgeMark.tsx` |
| `keeps autosave indicators aligned with profile action button styling` (324) | `function ProfileSaveStatus()`<br>`autosave-check-outline`<br>`autosave-check-fill` | `components/ui/SystemProfileSummary.tsx` or `pages/SystemPage.tsx` |
| `renders the Power Saving Green Icon tip as the filled success tile with a white glyph` (378) | `title: 'Green Icon'`<br>`tone: 'success'` | `components/ui/FeatureTipsPanel.tsx` |
| `uses the main haptics gain control in the Audio Haptics card` (475) | `aria-label="Haptics gain"`<br>`value={hapticsValue}`<br>`commitHapticsValue`<br>`HAPTICS_PRESETS.map` | `pages/HapticsPage.tsx` |
| `keeps the audio buffer length control compact and aligned` (488) | `className={`audio-buffer-control framed-slider ${audioBufferLengthControlDisabled ? 'disabled' : ''}`}` | `pages/AudioPage.tsx` |
| `keeps Pico firmware maintenance actions compact inside Bridge Settings` (513) | `className="settings-menu-row pico-firmware-row"`<br>`not.toContain('<strong>Pico Firmware</strong>')` | `components/dialogs/BridgeSettingsModal.tsx` |
| `keeps the Bridge Settings preferences modal typography compact` (584) | `bridge-settings-modal bridge-settings-preferences-modal` | `components/dialogs/BridgeSettingsModal.tsx` |

---

## 5. Maintenance Strategy for 100% Test Suite Pass During Extraction

### 5.1 Dual-Phase Strategy Architecture

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Source Aggregator (Milestones M1 – M5)       │
│ - Virtual aggregation of all renderer modules          │
│ - Guarantees 339/339 tests pass without disruption     │
│ - Zero false failures while code moves between files   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Modular Source Guards (Milestone M6 Hardening)│
│ - Dedicated source readers matching precedent          │
│   (e.g., controllerDevicesPageSource)                  │
│ - Direct unit testing of exported utility functions    │
│ - Strict boundary checks per extracted module          │
└────────────────────────────────────────────────────────┘
```

### 5.2 Phase 1: Dynamic Source Aggregation in Test Files
In both `app-behavior.test.ts` and `styles-layout.test.ts`, replace the single-file read:
`const appSource = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'App.tsx'), 'utf8');`

with an aggregator function that reads `App.tsx` plus all extracted `.ts` and `.tsx` source files in `src/renderer/`:

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rendererDir = path.dirname(fileURLToPath(import.meta.url));

function collectRendererSources(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'assets') {
        results.push(...collectRendererSources(fullPath));
      }
    } else if (
      (entry.endsWith('.tsx') || entry.endsWith('.ts')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx') &&
      !entry.endsWith('.d.ts')
    ) {
      results.push(readFileSync(fullPath, 'utf8'));
    }
  }
  return results;
}

// Aggregated source guarantees all string assertions find their targets
// regardless of which module they were extracted into.
const aggregatedSource = collectRendererSources(rendererDir).join('\n');
const appSource = aggregatedSource;
```

#### Why This Works:
1. **Backwards Compatibility**: Every single `expect(appSource).toContain(...)` and `extractFunction(...)` call continues to work identically.
2. **Negative Assertions Preserved**: `expect(appSource).not.toContain(...)` checks remain valid across the entire codebase.
3. **Zero Milestone Coupling**: Individual agents can extract `OverviewPage`, `HapticsPage`, `TriggersPage`, etc., without worrying about breaking cross-cutting behavior tests.

### 5.3 Phase 2: Clean Modular Precedent & Unit Testing
Follow the existing pattern in `app-behavior.test.ts` (lines 9–12, 29, 35) established by `ControllerDevicesPage`:
1. `App.tsx` tests assert component wiring:
   ```typescript
   expect(appShellSource).toContain('<OverviewPage');
   expect(appShellSource).toContain('<HapticsPage');
   expect(appShellSource).toContain('<AudioPage');
   ```
2. Extracted page tests assert internal domain details against the extracted page:
   ```typescript
   const overviewPageSource = readFileSync(path.join(rendererDir, 'pages/OverviewPage.tsx'), 'utf8');
   expect(overviewPageSource).toContain('aria-label="Active Game"');
   ```
3. Pure helper functions are exported and tested directly with real arguments:
   ```typescript
   import { normalizeChordKeyLabel } from './utils/chord-math-helpers';
   expect(normalizeChordKeyLabel('prtscn')).toBe('Print Screen');
   ```
   This replaces fragile AST string slicing (`extractFunction`).

---

## 6. Implementation Action Plan for Implementing Agents

1. **Step 1 (App.tsx)**: Add `role="tablist"` to `<nav className="control-tabs" role="tablist" aria-label="Controls">` at `App.tsx:7452`.
2. **Step 2 (layout-check.mjs)**:
   - Add `selectTab(tabName)` helper handling accordions, exact role queries, and the `#control-tab-system` button.
   - Update tab navigation calls across `layout-check.mjs` to use `selectTab`.
   - Update Audio Haptics test navigation to use `selectTab('Audio Haptics')` and remove obsolete switch selectors.
3. **Step 3 (Test Suite Safety)**: Update `app-behavior.test.ts` and `styles-layout.test.ts` to use `collectRendererSources` so component extraction can proceed without test breakage.
4. **Step 4 (Verification)**:
   - Run `npm run build:app`
   - Run `node scripts/layout-check.mjs` (must pass with 0 errors)
   - Run `npm run test:companion` (must pass 339/339 tests)

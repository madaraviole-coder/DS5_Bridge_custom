# E2E Test Infrastructure & Verification Specification: DS5 Bridge Companion

## Executive Overview
This document specifies the comprehensive End-to-End (E2E) testing infrastructure for the DS5 Bridge Companion application. It establishes an opaque-box test framework across four verification tiers, mapping directly to all 18 inventoried features from `PROJECT.md` and user requirements from `ORIGINAL_REQUEST.md`.

The framework exercises the application through public interface contracts, simulated bridge hardware transports, DOM accessibility structures, and user-facing event flows without coupling to private internal implementation details.

---

## 4-Tier Verification Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIER 4: REAL-WORLD SCENARIOS                         │
│   Full user lifecycles: Onboarding, Competitive FPS, Audio Haptics,    │
│            Persona Transition, Degraded Bridge Recovery                │
├────────────────────────────────────────────────────────────────────────┤
│                TIER 3: CROSS-FEATURE COMBINATIONS                      │
│   Pairwise subsystem interactions: Audio+Triggers, Profile+Deadzones,   │
│      ErrorBoundary+Telemetry, CustomSelect+Themes, Touchpad+Chords     │
├────────────────────────────────────────────────────────────────────────┤
│             TIER 2: BOUNDARY & CORNER CASES (>=5 / feature)            │
│   Edge values (0%, 100%), rapid reconnection, null telemetry, invalid  │
│        payloads, overflow tolerances, high-speed burst inputs          │
├────────────────────────────────────────────────────────────────────────┤
│                TIER 1: FEATURE COVERAGE (>=5 / feature)                │
│    Primary happy paths for all 18 inventoried architectural features   │
│         (90 comprehensive baseline functional specifications)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Authoritative Requirements & Expected Output Sources
Each test derives its expected outcomes strictly from authoritative sources:
1. `ORIGINAL_REQUEST.md`: Modular UI requirements (R1), Style guide contracts (R2), State resilience (R3), and acceptance criteria.
2. `PROJECT.md`: Feature inventory (Features 1–18), milestone specifications (M1–M6), and interface contracts (`ErrorBoundary`, `CustomSelect`, `useBridgeTelemetry`, tab page signatures).
3. `UI_STYLE_GUIDE.md`: Layout tolerances (1px card height matching, 2px button alignment, 0px uncontrolled overflow), typography scales, color tokens, and custom control rules.
4. `src/shared/protocol.ts` & `src/shared/types.ts`: Protocol packet schemas, ACK results, companion settings, and telemetry snapshot data contracts.

---

## Tier 1: Feature Coverage (Baseline Functional Specifications)

Across all 18 inventoried features, Tier 1 mandates at least 5 distinct functional test cases per feature (90 test cases total).

### Feature 1: UI Design Primitives Extraction
- **T1-F01-01 (CustomSelect Selection & Rendering)**
  - *Input*: `<CustomSelect value="dark" options={[{value:'light', label:'Light'}, {value:'dark', label:'Dark'}]} onChange={spy} />`
  - *Expected*: Renders button with selected label "Dark", `role="combobox"`, `aria-expanded="false"`. Clicking opens dropdown with `role="listbox"`.
  - *Source*: `PROJECT.md` § Interface Contracts.
- **T1-F01-02 (CustomSelect Option Selection)**
  - *Input*: Click on unselected option "Light" in open dropdown.
  - *Expected*: Calls `onChange('light')`, updates aria attributes, and closes dropdown.
  - *Source*: `PROJECT.md` § Interface Contracts.
- **T1-F01-03 (FeatureTipsPanel Collapsible Behavior)**
  - *Input*: Render `<FeatureTipsPanel title="Tips" tips={['Tip A', 'Tip B']} />` and toggle expand button.
  - *Expected*: Panel toggles `aria-expanded` and reveals tips list content.
  - *Source*: `PROJECT.md` § Feature Inventory F1.
- **T1-F01-04 (SystemProfileSummary Header Display)**
  - *Input*: Render `<SystemProfileSummary profileName="Default" isConnected={true} firmwareVersion="v1.7.1" />`.
  - *Expected*: Displays profile badge, connected health indicator (`tone="good"`), and firmware version string.
  - *Source*: `PROJECT.md` § Feature Inventory F1.
- **T1-F01-05 (StartupTutorial Flow Completion)**
  - *Input*: Render `<StartupTutorial onComplete={spy} />`, step through tutorial slides, click "Continue".
  - *Expected*: Invokes `onComplete` callback, sets completion key in `window.localStorage`.
  - *Source*: `PROJECT.md` § Feature Inventory F1; `scripts/visual-smoke.mjs`.

### Feature 2: ErrorBoundary Architecture
- **T1-F02-01 (Root ErrorBoundary Crash Catching)**
  - *Input*: Render tree inside `<ErrorBoundary>` with child component throwing an uncaught render error.
  - *Expected*: Error caught without crashing DOM root; renders fallback UI notice containing error description.
  - *Source*: `PROJECT.md` § Interface Contracts `ErrorBoundary`.
- **T1-F02-02 (Per-Tab ErrorBoundary Isolation)**
  - *Input*: Render tab container with two tabs; Tab A throws an error while Tab B is healthy.
  - *Expected*: Tab A renders localized error card with retry button; Tab B and sidebar navigation remain fully interactive.
  - *Source*: `PROJECT.md` § Architecture (2-tier ErrorBoundary).
- **T1-F02-03 (ErrorBoundary Reset & Recovery)**
  - *Input*: Child error condition resolved; user clicks "Retry" button on fallback UI.
  - *Expected*: `onReset` invoked, ErrorBoundary clears error state, renders child content successfully.
  - *Source*: `PROJECT.md` § Interface Contracts `ErrorBoundary`.
- **T1-F02-04 (Custom Fallback Component Support)**
  - *Input*: `<ErrorBoundary fallbackComponent={CustomFallback}><Crashy /></ErrorBoundary>`.
  - *Expected*: Renders `CustomFallback` receiving `error` and `resetErrorBoundary` props.
  - *Source*: `PROJECT.md` § Interface Contracts `ErrorBoundary`.
- **T1-F02-05 (Accessible Error Role & Live Notice)**
  - *Input*: Render error boundary in triggered state.
  - *Expected*: Fallback container has `role="alert"` and accessible warning icon.
  - *Source*: `ORIGINAL_REQUEST.md` § R3.

### Feature 3: UI Style Guide & Select Compliance
- **T1-F03-01 (Native Select Elimination)**
  - *Input*: Inspect rendered DOM of Game Profiles Modal, System Tab, and Audio Haptics views.
  - *Expected*: Zero `<select>` tags in DOM; all dropdown controls use `.custom-select-button` / `<CustomSelect>`.
  - *Source*: `PROJECT.md` § Core Problem & Feature Inventory F3.
- **T1-F03-02 (Paired Feature Card Equal Heights)**
  - *Input*: Measure left and right card bounding boxes in standard 2-column feature card grids.
  - *Expected*: `Math.abs(left.height - right.height) <= 1px`.
  - *Source*: `scripts/layout-check.mjs`; `UI_STYLE_GUIDE.md`.
- **T1-F03-03 (Slotted Button Badge & Text Alignment)**
  - *Input*: Inspect primary and secondary action buttons in test cards.
  - *Expected*: 24x24px icon badges, 10px–14px gap to label text, text height <= 24px (unwrapped).
  - *Source*: `scripts/layout-check.mjs`.
- **T1-F03-04 (Zero Uncontrolled Layout Overflow)**
  - *Input*: Inspect active page containers and dialogs.
  - *Expected*: `scrollHeight - clientHeight <= 1px` and `scrollWidth - clientWidth <= 1px`.
  - *Source*: `scripts/layout-check.mjs`; `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F03-05 (Design Token CSS Variable Compliance)**
  - *Input*: Inspect computed styles for background, card borders, and primary accents across theme presets.
  - *Expected*: Colors resolve against `--color-bg-base`, `--color-card-border`, `--color-accent` variables.
  - *Source*: `UI_STYLE_GUIDE.md`.

### Feature 4: Layout Check Navigation Fix
- **T1-F04-01 (Tablist Navigation Role)**
  - *Input*: Inspect `<nav className="control-tabs">`.
  - *Expected*: Element possesses `role="tablist"` and `aria-label="Controls"`.
  - *Source*: `PROJECT.md` § Feature Inventory F4; `scripts/layout-check.mjs`.
- **T1-F04-02 (Tab Button Roles and Attributes)**
  - *Input*: Inspect tab buttons within `.control-tabs`.
  - *Expected*: Each button has `role="tab"`, `aria-selected` reflecting active state, and valid `id`.
  - *Source*: `scripts/layout-check.mjs`.
- **T1-F04-03 (Accordion Navigation Grouping)**
  - *Input*: Click accordion group header "Input" or "Controller".
  - *Expected*: Expands/collapses member tabs cleanly, updating group expansion state.
  - *Source*: `PROJECT.md` § Feature Inventory F4.
- **T1-F04-04 (Sidebar Support Badge Spacing)**
  - *Input*: Measure spacing above and below `.sidebar-kofi-badge`.
  - *Expected*: `Math.abs(spacingAbove - spacingBelow) <= 1px`.
  - *Source*: `scripts/layout-check.mjs`.
- **T1-F04-05 (Single Active Tab Invariant)**
  - *Input*: Click different tabs sequentially (Overview -> Haptics -> Triggers).
  - *Expected*: Exactly one tab possesses `aria-selected="true"` and active class at any point in time.
  - *Source*: `scripts/layout-check.mjs`.

### Feature 5: Overview Tab Modularization
- **T1-F05-01 (Overview Page Component Rendering)**
  - *Input*: Render `OverviewPage` with connected controller model.
  - *Expected*: Renders controller identity, battery status, and quick action panels.
  - *Source*: `PROJECT.md` § Feature Inventory F5.
- **T1-F05-02 (Host Persona Switching)**
  - *Input*: Select "PlayStation 5" or "DualSense Edge" persona in Overview quick actions.
  - *Expected*: Dispatches `window.bridge.setHostPersonaMode(...)`.
  - *Source*: `src/renderer/app-behavior.test.ts`.
- **T1-F05-03 (Overview Quick Sliders Sync)**
  - *Input*: Change quick haptics slider on Overview page.
  - *Expected*: Dispatches `window.bridge.setHapticsGain(...)`.
  - *Source*: `PROJECT.md` § Feature Inventory F5.
- **T1-F05-04 (Overview Action Buttons Dispatch)**
  - *Input*: Click "Pair New" button in Overview.
  - *Expected*: Dispatches `window.bridge.requestControllerScan()` or pairing action.
  - *Source*: `PROJECT.md` § Feature Inventory F5.
- **T1-F05-05 (File LOC Constraint Check)**
  - *Input*: Measure LOC of `OverviewPage.tsx` and `useOverviewState.ts`.
  - *Expected*: Each file is strictly < 1,000 LOC.
  - *Source*: `PROJECT.md` § Feature Inventory F5.

### Feature 6: Deadzones Tab Modularization
- **T1-F06-01 (Deadzones Page Rendering)**
  - *Input*: Render `DeadzonesPage` with initial deadzone values (Left: 5%, Right: 5%).
  - *Expected*: Renders two independent radial sliders and preview canvas/SVG.
  - *Source*: `PROJECT.md` § Feature Inventory F6.
- **T1-F06-02 (Stick Input Preview Request on Mount)**
  - *Input*: Mount `DeadzonesPage`.
  - *Expected*: Invokes `window.bridge.requestStickInputPreview()`.
  - *Source*: `src/renderer/App.tsx`; `PROJECT.md` § Feature Inventory F6.
- **T1-F06-03 (Stick Input Preview Release on Unmount)**
  - *Input*: Unmount `DeadzonesPage`.
  - *Expected*: Invokes `window.bridge.releaseStickInputPreview()`.
  - *Source*: `src/renderer/App.tsx`; `PROJECT.md` § Feature Inventory F6.
- **T1-F06-04 (Radial Deadzones Update)**
  - *Input*: Drag right deadzone slider to 12%.
  - *Expected*: Dispatches `window.bridge.setRadialDeadzones(5, 12)`.
  - *Source*: `src/preload.ts` § `setRadialDeadzones`.
- **T1-F06-05 (Radial Preview Drawing Function)**
  - *Input*: Evaluate `radial-deadzone-preview` helper with stick coordinates (0.2, 0.4) and deadzone 0.1.
  - *Expected*: Computes correct normalized deadzone circle radius and deflected coordinate point.
  - *Source*: `src/renderer/radial-deadzone-preview.test.ts`.

### Feature 7: Haptics Tab Modularization
- **T1-F07-01 (Haptics Master Toggle & Gain)**
  - *Input*: Toggle haptics enabled; adjust haptics gain to 85%.
  - *Expected*: Dispatches `setHapticsEnabled` and `setHapticsGain(85)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F7.
- **T1-F07-02 (Classic Rumble Settings)**
  - *Input*: Adjust classic rumble gain to 75% and toggle classic rumble V1 mode.
  - *Expected*: Dispatches `setClassicRumbleGain(75)` and `setClassicRumbleV1Enabled(...)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F7.
- **T1-F07-03 (Audio Haptics Sub-Mode Switch)**
  - *Input*: Click switch "Enter Audio Haptics".
  - *Expected*: Transitions view to Audio Haptics 2-card grid; switch changes to "Exit Audio Haptics".
  - *Source*: `scripts/layout-check.mjs`.
- **T1-F07-04 (Audio Haptics Session Listing)**
  - *Input*: Enter Audio Haptics view with mock bridge returning active sessions.
  - *Expected*: Calls `listAudioHapticsSessions()` and renders session list items with process titles.
  - *Source*: `src/preload.ts`; `scripts/layout-check.mjs`.
- **T1-F07-05 (Audio-Reactive DSP Config)**
  - *Input*: Change bass focus to "deep" and mode to "mix".
  - *Expected*: Calls `setAudioReactiveHapticsConfig(...)` with updated config payload.
  - *Source*: `src/shared/protocol.ts`.

### Feature 8: Audio Tab Modularization
- **T1-F08-01 (Speaker Volume & Gain Controls)**
  - *Input*: Adjust speaker volume to 80% and gain level to 3.
  - *Expected*: Calls `setSpeakerVolume(80)` and `setSpeakerGainLevel(3)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F8.
- **T1-F08-02 (Mic Volume & Mute Controls)**
  - *Input*: Adjust mic volume to 90% and toggle mic mute.
  - *Expected*: Calls `setMicVolume(90)` and updates mute state in bridge.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F8.
- **T1-F08-03 (Audio Mode Selector Tabs)**
  - *Input*: Click audio mode buttons "Speaker", "Mic".
  - *Expected*: Active panel switches between speaker controls and mic controls.
  - *Source*: `scripts/visual-smoke.mjs`.
- **T1-F08-04 (Audio Endpoint Matching Logic)**
  - *Input*: Evaluate `isBridgeAudioDeviceLabel("Wireless Controller Audio")`.
  - *Expected*: Returns true; calculates correct label affinity score.
  - *Source*: `src/renderer/audio-endpoint-matching.test.ts`.
- **T1-F08-05 (Speaker Test Tone Trigger)**
  - *Input*: Click "Test Speaker" button.
  - *Expected*: Audio element or helper process triggered; button shows active test state.
  - *Source*: `scripts/layout-check.mjs`.

### Feature 9: Triggers Tab Modularization
- **T1-F09-01 (Adaptive Triggers Master Toggle & Intensity)**
  - *Input*: Toggle adaptive triggers enabled; adjust intensity to 90%.
  - *Expected*: Calls `setAdaptiveTriggersEnabled` and `setTriggerEffectIntensity(90)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F9.
- **T1-F09-02 (Trigger Test Mode Selector)**
  - *Input*: Select test mode "feedback", "weapon", or "vibration".
  - *Expected*: Calls `setTriggerTestMode(...)` with selected mode string.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F9.
- **T1-F09-03 (Trigger Lab Sub-Mode Switch)**
  - *Input*: Click "Enter Trigger Lab" switch.
  - *Expected*: View transitions to Trigger Lab custom curve editor; switch updates to "Exit Trigger Lab".
  - *Source*: `scripts/visual-smoke.mjs`.
- **T1-F09-04 (Trigger Lab Meter Visualization)**
  - *Input*: Render `<TriggerLabMeter pullDepth={128} resistance={200} />`.
  - *Expected*: Renders SVG element with gauge bar and path matching calculated coordinates.
  - *Source*: `PROJECT.md` § Feature Inventory F1/F9.
- **T1-F09-05 (Custom Trigger Profile Persistence)**
  - *Input*: Save custom trigger curve in Trigger Lab.
  - *Expected*: Writes serialized profile to `window.localStorage` under trigger lab key.
  - *Source*: `src/renderer/App.tsx`.

### Feature 10: Lighting Tab Modularization
- **T1-F10-01 (Lightbar Enable & Brightness)**
  - *Input*: Toggle lightbar; adjust brightness slider to 70%.
  - *Expected*: Calls `setLightbarBrightness(70)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F10.
- **T1-F10-02 (Preset Color Swatch Selection)**
  - *Input*: Click preset swatch "#0066FF" (PlayStation Blue).
  - *Expected*: Calls `setLightbarColor('#0066FF', brightness)`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F10.
- **T1-F10-03 (Custom Color Input)**
  - *Input*: Set custom color picker value to "#FF4500".
  - *Expected*: Persists color to localStorage and dispatches bridge update.
  - *Source*: `src/renderer/App.tsx`.
- **T1-F10-04 (Player LED Indicator Toggle)**
  - *Input*: Toggle player LED setting.
  - *Expected*: Dispatches bridge command updating player LED state.
  - *Source*: `src/shared/protocol.ts`.
- **T1-F10-05 (File LOC Constraint Check)**
  - *Input*: Check LOC of `LightingPage.tsx` and `useLightingState.ts`.
  - *Expected*: Files strictly < 1,000 LOC.
  - *Source*: `PROJECT.md` § Feature Inventory F10.

### Feature 11: System Tab Modularization
- **T1-F11-01 (Polling Rate Mode Selector)**
  - *Input*: Select 1000Hz polling rate.
  - *Expected*: Dispatches `setPollingRateMode('1000hz')` to bridge.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F11.
- **T1-F11-02 (Host Persona Switching in System Tab)**
  - *Input*: Switch persona to Xbox 360 mode.
  - *Expected*: Dispatches `setHostPersonaMode('xbox-360')`.
  - *Source*: `src/preload.ts`; `PROJECT.md` § Feature Inventory F11.
- **T1-F11-03 (Idle Disconnect Timeout)**
  - *Input*: Select idle disconnect timeout of 15 minutes.
  - *Expected*: Updates companion setting `idleDisconnectTimeoutMinutes: 15`.
  - *Source*: `src/shared/types.ts`.
- **T1-F11-04 (Mute Button Mode Selector)**
  - *Input*: Select "OS Mute Keyboard Shortcut" mode.
  - *Expected*: Updates `muteButtonMode` in settings store.
  - *Source*: `src/shared/types.ts`.
- **T1-F11-05 (System Typography Consistency)**
  - *Input*: Measure font sizes across mute labels, device labels, and select values in System tab.
  - *Expected*: Font sizes match within 0.25px tolerance.
  - *Source*: `scripts/layout-check.mjs`.

### Feature 12: Dialog & Modal Modularization
- **T1-F12-01 (Game Profiles Modal CRUD)**
  - *Input*: Open Game Profiles Modal, add profile with executable "game.exe", save.
  - *Expected*: Profile added to `settings.gameProfiles` and displayed in profile list.
  - *Source*: `src/shared/types.ts`; `PROJECT.md` § Feature Inventory F12.
- **T1-F12-02 (Firmware Update Modal Display)**
  - *Input*: Trigger firmware update modal when `diagnostics.firmwareUpdateAvailable` is populated.
  - *Expected*: Renders version comparison, release notes, and update action button.
  - *Source*: `src/main/pico-firmware-updater.test.ts`.
- **T1-F12-03 (Device Cleanup Modal Confirmation)**
  - *Input*: Open Windows Device Cleanup modal, click confirm.
  - *Expected*: Invokes `window.bridge.runWindowsDeviceCleanup()`.
  - *Source*: `src/preload.ts`.
- **T1-F12-04 (Modal Focus Trap and Backdrop)**
  - *Input*: Open modal, press Tab repeatedly.
  - *Expected*: Focus cycles within modal elements; Escape key closes modal.
  - *Source*: `PROJECT.md` § Architecture.
- **T1-F12-05 (FeedbackToast Notification)**
  - *Input*: Dispatch success notification "Profile Saved".
  - *Expected*: Renders toast container with `role="status"` and accessible text.
  - *Source*: `PROJECT.md` § Architecture.

### Feature 13: Remapping Tab Modularization
- **T1-F13-01 (Remapping Sub-Tab Switching)**
  - *Input*: Switch between "Buttons & Sticks", "Touchpad", and "Turbo" sub-tabs.
  - *Expected*: Sub-page views update cleanly with corresponding controls.
  - *Source*: `PROJECT.md` § Feature Inventory F13.
- **T1-F13-02 (Physical Button Remapping)**
  - *Input*: Remap L1 button to R1 action in `RemapButtonsSubPage`.
  - *Expected*: Updates draft button remapping map in state.
  - *Source*: `src/shared/protocol.ts`.
- **T1-F13-03 (Touchpad 4-Zone Division)**
  - *Input*: Configure Top-Left zone of touchpad to trigger "Options".
  - *Expected*: Updates touchpad zone mapping payload.
  - *Source*: `src/shared/touchpad-gestures.ts`.
- **T1-F13-04 (Turbo Settings Configuration)**
  - *Input*: Enable turbo, set speed to 12 CPS, enable humanize jitter.
  - *Expected*: Updates `turboSettings: { enabled: true, speedCps: 12, humanize: true }`.
  - *Source*: `src/shared/types.ts`.
- **T1-F13-05 (Remapping Profile Switch)**
  - *Input*: Select remapping profile from dropdown.
  - *Expected*: Calls `window.bridge.selectButtonRemappingProfile(...)`.
  - *Source*: `src/preload.ts`.

### Feature 14: Chords Tab Modularization
- **T1-F14-01 (Chords Page Rendering)**
  - *Input*: Render `ChordsPage` with default chord list.
  - *Expected*: Renders chord assignments table and starter key indicator.
  - *Source*: `PROJECT.md` § Feature Inventory F14.
- **T1-F14-02 (Chord Assignment Creation)**
  - *Input*: Add chord: Modifier = Mute, Trigger = D-Pad Up, Action = Volume Up.
  - *Expected*: Adds chord assignment object to chord assignments list.
  - *Source*: `src/shared/protocol.ts`.
- **T1-F14-03 (Chord Math Helper Bitmask Calculation)**
  - *Input*: Call `chord-math-helpers` with active controller buttons bitmask.
  - *Expected*: Computes matching chord ID and returns mapped function.
  - *Source*: `PROJECT.md` § Feature Inventory F14.
- **T1-F14-04 (Chord Conflict Detection)**
  - *Input*: Create two chords with identical modifier and trigger combinations.
  - *Expected*: Displays warning badge indicating duplicate trigger binding.
  - *Source*: `PROJECT.md` § Feature Inventory F14.
- **T1-F14-05 (File LOC Constraint Check)**
  - *Input*: Inspect LOC of `ChordsPage.tsx` and `chord-math-helpers.ts`.
  - *Expected*: Each file is strictly < 1,000 LOC.
  - *Source*: `PROJECT.md` § Feature Inventory F14.

### Feature 15: Telemetry Decoupling & Bridge Hooks
- **T1-F15-01 (Telemetry Ingestion Stream)**
  - *Input*: Emit new `BridgeSnapshot` via `window.bridge.onSnapshot`.
  - *Expected*: `useBridgeTelemetry` receives snapshot and updates consumer tabs.
  - *Source*: `PROJECT.md` § Interface Contracts `useBridgeTelemetry`.
- **T1-F15-02 (Connection State Machine)**
  - *Input*: Bridge state changes from 'connected' to 'no-bridge'.
  - *Expected*: `isConnected` becomes false, `connectionError` displays searching message.
  - *Source*: `PROJECT.md` § Interface Contracts `useBridgeTelemetry`.
- **T1-F15-03 (Scrub Deferral Buffering)**
  - *Input*: User initiates slider drag (`windowDraggingRef = true`); new snapshots arrive.
  - *Expected*: Telemetry updates for dragged property are deferred until mouseup.
  - *Source*: `PROJECT.md` § Interface Contracts `useBridgeTelemetry`.
- **T1-F15-04 (Reconnect Trigger)**
  - *Input*: Call `reconnect()` on `useBridgeTelemetry` or `useDeviceConnection`.
  - *Expected*: Triggers bridge device rescan and status refresh.
  - *Source*: `PROJECT.md` § Interface Contracts `useBridgeTelemetry`.
- **T1-F15-05 (Clean Hook Teardown)**
  - *Input*: Component consuming bridge hooks unmounts.
  - *Expected*: Snapshot listener unsubscribe function is invoked.
  - *Source*: `PROJECT.md` § Interface Contracts `useBridgeTelemetry`.

### Feature 16: Shell Slimming (<500 LOC App.tsx)
- **T1-F16-01 (Shell Delegation to Modular Pages)**
  - *Input*: Inspect `App.tsx` render structure.
  - *Expected*: Renders top-level shell `<nav>` and delegates page bodies to imported Page components.
  - *Source*: `PROJECT.md` § Architecture.
- **T1-F16-02 (Shell Line Count Verification)**
  - *Input*: Count lines of `src/renderer/App.tsx`.
  - *Expected*: Total line count strictly < 500 LOC (and <= 1000 LOC ceiling).
  - *Source*: `PROJECT.md` § Feature Inventory F16; `ORIGINAL_REQUEST.md`.
- **T1-F16-03 (Modal Portal Rendering)**
  - *Input*: Trigger modal open state in shell.
  - *Expected*: Modal renders into document body or portal root without interfering with active tab.
  - *Source*: `PROJECT.md` § Architecture.
- **T1-F16-04 (Sidebar Routing State)**
  - *Input*: Select tab 'deadzones' in sidebar.
  - *Expected*: Active tab state updates; `DeadzonesPage` renders into main view container.
  - *Source*: `PROJECT.md` § Feature Inventory F16.
- **T1-F16-05 (Zero Redundant State Duplication)**
  - *Input*: Verify tab state ownership between shell and domain hooks.
  - *Expected*: Shell coordinates navigation and global modals; domain hooks manage tab details.
  - *Source*: `PROJECT.md` § Feature Inventory F16.

### Feature 17: Test Guard Synchronization
- **T1-F17-01 (app-behavior.test.ts Modular Coverage)**
  - *Input*: Run `vitest run src/renderer/app-behavior.test.ts`.
  - *Expected*: All tests pass without failing on modular file imports.
  - *Source*: `PROJECT.md` § Feature Inventory F17.
- **T1-F17-02 (styles-layout.test.ts Design Guard Coverage)**
  - *Input*: Run `vitest run src/renderer/styles-layout.test.ts`.
  - *Expected*: All tests pass confirming CSS tokens and rules exist.
  - *Source*: `PROJECT.md` § Feature Inventory F17.
- **T1-F17-03 (Baseline Suite Regressions Check)**
  - *Input*: Run `npm run test:companion`.
  - *Expected*: 100% of existing tests pass (>= 339 tests).
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F17-04 (File Length Guard Verification)**
  - *Input*: Execute LOC audit across all files in `src/renderer/`.
  - *Expected*: Zero files exceed 1,000 LOC.
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F17-05 (Native Select Ban Enforcement)**
  - *Input*: Scan all `.tsx` files in `src/renderer/` for `<select`.
  - *Expected*: Zero occurrences found.
  - *Source*: `ORIGINAL_REQUEST.md` § R2.

### Feature 18: Automated Verification & Acceptance Signoff
- **T1-F18-01 (TypeScript Typecheck Clean Pass)**
  - *Input*: Execute `npm run typecheck`.
  - *Expected*: Exit code 0 with zero diagnostic errors across main and renderer tsconfigs.
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F18-02 (Application Build Success)**
  - *Input*: Execute `npm run build:app`.
  - *Expected*: Production bundle generated in `dist/` with exit code 0.
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F18-03 (Layout Check Clean Pass)**
  - *Input*: Execute `npm run layout:check`.
  - *Expected*: Zero layout tolerance or overflow errors.
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F18-04 (Companion Test Suite Pass)**
  - *Input*: Execute `npm run test:companion`.
  - *Expected*: >= 339 tests passing with 0 failures.
  - *Source*: `ORIGINAL_REQUEST.md` § Acceptance Criteria.
- **T1-F18-05 (Acceptance Signoff Publication)**
  - *Input*: Verify `TEST_READY.md` exists and contains test results summary and command instructions.
  - *Expected*: Documentation is complete and validated.
  - *Source*: Dispatch prompt & `PROJECT.md` § Milestone M6.

---

## Tier 2: Boundary & Corner Cases (Stress & Adversarial Specifications)

Across all 18 inventoried features, Tier 2 mandates at least 5 boundary/corner test cases per feature (90 test cases total).

### Feature 1: UI Design Primitives Extraction (Boundaries)
- **T2-F01-01 (CustomSelect Empty Options)**: Pass `options={[]}` to `CustomSelect`; renders cleanly without exceptions.
- **T2-F01-02 (CustomSelect Ultra-Long Labels)**: Option label with 500 characters; text truncates with ellipsis without expanding container.
- **T2-F01-03 (FeatureTipsPanel Empty Tips)**: Pass `tips={[]}`; gracefully renders empty state without crashing.
- **T2-F01-04 (SystemProfileSummary Null Values)**: Null profileName, null version, disconnected state; displays safe fallback strings (`--`).
- **T2-F01-05 (StartupTutorial Corrupted Storage)**: LocalStorage contains malformed JSON; resets gracefully and shows tutorial.

### Feature 2: ErrorBoundary Architecture (Boundaries)
- **T2-F02-01 (Non-Error Exceptions)**: Component throws a string (`throw "error"`) or null; ErrorBoundary normalizes to Error object.
- **T2-F02-02 (Persistent Crash on Retry)**: Child component throws again upon Retry click; ErrorBoundary remains safely in fallback UI.
- **T2-F02-03 (Deeply Nested Boundaries)**: ErrorBoundary within ErrorBoundary; inner boundary catches without triggering outer boundary.
- **T2-F02-04 (Rapid Error Bursts)**: Child throws multiple errors in rapid succession; prevents infinite re-render loops.
- **T2-F02-05 (Uncaught Rejection in Event Handler)**: Async error triggered inside button handler; captured gracefully.

### Feature 3: UI Style Guide & Select Compliance (Boundaries)
- **T2-F03-01 (UI Scale Extremes)**: UI scale set to 75% or 150%; card height delta remains <= 1px.
- **T2-F03-02 (Dropdown Viewport Edge Auto-Flip)**: Dropdown button positioned 10px from viewport bottom; options flip above button.
- **T2-F03-03 (Theme Contrast Minimums)**: Verify text contrast ratio >= 4.5:1 across all 5 themes.
- **T2-F03-04 (Minimum Viewport Width Constraint)**: Viewport resized to 900px minimum width; zero horizontal scrollbar or clipping.
- **T2-F03-05 (50+ CustomSelect Options List)**: CustomSelect with 50 items; listbox caps max-height (300px) and scrolls vertically.

### Feature 4: Layout Check Navigation Fix (Boundaries)
- **T2-F04-01 (Rapid Tab Switching)**: User clicks 10 tabs in 50ms; only the final selected tab is rendered active.
- **T2-F04-02 (Deep Tab Linking / Unknown Tab ID)**: Requested tab ID does not exist; defaults gracefully to 'overview'.
- **T2-F04-03 (Keyboard Navigation Wrap-Around)**: Pressing ArrowDown on last tab wraps focus to first tab.
- **T2-F04-04 (All Accordion Groups Collapsed)**: User collapses all groups; clicking an external tab link auto-expands parent group.
- **T2-F04-05 (Zero-Pixel Support Badge Drift)**: Badge vertical position stable across tab transitions within 1px.

### Feature 5: Overview Tab Modularization (Boundaries)
- **T2-F05-01 (0% Battery Level & Unknown Health)**: Battery telemetry 0% with discharging flag; renders low-battery indicator.
- **T2-F05-02 (Unrecognized Controller Model)**: VID/PID does not match DualSense/Edge; renders generic controller placeholder.
- **T2-F05-03 (Rapid Persona Switching)**: User triggers persona switches before previous transition finishes; debounces requests.
- **T2-F05-04 (Telemetry Freeze Recovery)**: Snapshot stream halts for 5 seconds; overview displays stale telemetry warning banner.
- **T2-F05-05 (Extreme Packet Loss Display)**: Packet loss reported at 100%; health status transitions to 'warn'/'bad'.

### Feature 6: Deadzones Tab Modularization (Boundaries)
- **T2-F06-01 (0% Radial Deadzone Boundary)**: Setting 0% deadzone sends exact 0 payload; full stick deflection unconstrained.
- **T2-F06-02 (100% Radial Deadzone Boundary)**: Setting 100% deadzone completely clamps stick input to center (0,0).
- **T2-F06-03 (Stick Telemetry Integer Limits)**: Raw stick values (-32768, 32767) normalize accurately without NaN or infinity.
- **T2-F06-04 (Rapid Slider Scrubbing)**: Left/right deadzones dragged concurrently; updates throttled to avoid IPC flood.
- **T2-F06-05 (Unmount During In-Flight Stick Preview)**: Component unmounts while preview request is pending; releases cleanly.

### Feature 7: Haptics Tab Modularization (Boundaries)
- **T2-F07-01 (0% Haptics Gain Zeroing)**: 0% gain sends 0 to bridge; actuators completely silent.
- **T2-F07-02 (Zero Audio Sessions State)**: `listAudioHapticsSessions` returns empty array; renders empty state message.
- **T2-F07-03 (Buffer Length Clamping)**: Invalid buffer lengths outside [16, 256] clamp to valid hardware boundaries.
- **T2-F07-04 (Audio Haptics Rapid Sub-Mode Toggle)**: Rapidly toggling sub-mode 10 times does not leak audio session listeners.
- **T2-F07-05 (Expired Audio Session Handling)**: Audio session terminates while selected; UI marks session as 'inactive' gracefully.

### Feature 8: Audio Tab Modularization (Boundaries)
- **T2-F08-01 (0% Speaker Volume Mute Clamp)**: 0% speaker volume sets mute flag while retaining previous volume level for unmute.
- **T2-F08-02 (Missing Audio Hardware Detection)**: System has no audio devices; test button disabled with tooltip.
- **T2-F08-03 (Audio Device Name with Unicode & Emojis)**: Audio device with unicode characters parses cleanly in matcher.
- **T2-F08-04 (Test Tone Audio Playback Interruption)**: User clicks test tone then navigates away; playback halts cleanly.
- **T2-F08-05 (Max Speaker Gain Boost)**: Speaker gain level set to maximum (Level 8); checks distortion warning flag.

### Feature 9: Triggers Tab Modularization (Boundaries)
- **T2-F09-01 (0% Trigger Intensity)**: Intensity 0% turns off adaptive trigger force motors completely.
- **T2-F09-02 (Physical Pull Extrema)**: Trigger pull depth at 0 and 255; visualizer SVG scales within canvas bounds.
- **T2-F09-03 (Corrupted Custom Profile JSON)**: Local storage custom profile contains invalid syntax; resets to default curve.
- **T2-F09-04 (Trigger Lab Max Curve Points)**: Adding 32+ curve segments enforces UI segment limit gracefully.
- **T2-F09-05 (Trigger Test Mode Rapid Switching)**: Rapidly cycling test modes sends synchronized packets without sequence inversion.

### Feature 10: Lighting Tab Modularization (Boundaries)
- **T2-F10-01 (0% Brightness Dark Mode)**: Brightness 0% shuts off lightbar while keeping chosen color stored.
- **T2-F10-02 (Malformed Hex Color Input)**: Hex input `#12`, `#ZZZZZZ`, or empty; rejects invalid values and restores previous color.
- **T2-F10-03 (High-Frequency Color Drag)**: Color picker dragged continuously; updates throttled to bridge refresh interval.
- **T2-F10-04 (All Player LEDs Disabled)**: All player LEDs toggled off; sends 0x00 LED mask to bridge.
- **T2-F10-05 (Lightbar State Retention on Reconnect)**: Bridge reconnects; companion re-applies persisted custom color.

### Feature 11: System Tab Modularization (Boundaries)
- **T2-F11-01 (0 Minute Idle Timeout)**: Idle timeout set to 0 (Disabled); timer completely disarmed.
- **T2-F11-02 (Polling Rate Switch During Active Traffic)**: Switching to 250Hz under load flushes buffers safely.
- **T2-F11-03 (Persona Switch Timeout Handling)**: Bridge takes > 5s to re-enumerate in new persona; displays timeout banner.
- **T2-F11-04 (Corrupted Settings Fallback)**: Corrupted companion settings file falls back to defaults without launch crash.
- **T2-F11-05 (Mute Keypress with Zero Modifiers)**: Mute keyboard shortcut configured without modifier keys; dispatches correctly.

### Feature 12: Dialog & Modal Modularization (Boundaries)
- **T2-F12-01 (Double Modal Triggering)**: Opening Dialog B while Dialog A is active replaces Dialog A with focus trap transfer.
- **T2-F12-02 (Executable Path with 1024 Characters)**: Extremely long executable path in GameProfilesModal truncates cleanly.
- **T2-F12-03 (Firmware Flash Disconnection Mid-Operation)**: Bridge unplugged during flash; modal shows recovery instructions.
- **T2-F12-04 (Device Cleanup Script Execution Failure)**: Script exits with error code; modal shows verbatim log path and error.
- **T2-F12-05 (Rapid Escape Key Stroking)**: Pressing Escape 10 times in 100ms triggers single clean modal close.

### Feature 13: Remapping Tab Modularization (Boundaries)
- **T2-F13-01 (Cyclic Remapping Chains)**: Mapping A->B and B->A resolves unambiguously without evaluation recursion.
- **T2-F13-02 (Turbo Speed Clamping [1, 30 CPS])**: Turbo speed < 1 clamps to 1; > 30 clamps to 30.
- **T2-F13-03 (Touchpad Exact Midpoint Coordinate)**: Touchpad touch at exact center coordinate (1920/2, 1080/2); assigned deterministically.
- **T2-F13-04 (Remapping Profile Deletion of Last Profile)**: Attempting to delete the only profile is blocked or resets to Default.
- **T2-F13-05 (Full 16-Button Turbo Mask)**: All buttons assigned to turbo; bitmask 0xFFFF processed safely.

### Feature 14: Chords Tab Modularization (Boundaries)
- **T2-F14-01 (Zero Chords Enabled)**: Chord assignments list empty; chord engine idles with 0 CPU overhead.
- **T2-F14-02 (3+ Key Simultaneous Chords)**: 3 keys pressed together; chord priority resolves highest priority single action.
- **T2-F14-03 (Chord Hold Time Threshold Clamping)**: Hold threshold < 50ms clamps to 50ms; > 3000ms clamps to 3000ms.
- **T2-F14-04 (Chord Trigger Overlap Warning)**: Two chords with identical inputs highlight conflict banner.
- **T2-F14-05 (Bitmask 0x00 / 0xFFFF Edge Values)**: Bitmask arithmetic in `chord-math-helpers` handles full integer boundaries.

### Feature 15: Telemetry Decoupling & Bridge Hooks (Boundaries)
- **T2-F15-01 (100 Snapshots in 100ms Burst)**: Rapid snapshot burst updates state via batched React transitions without freezing.
- **T2-F15-02 (Null / Partial Snapshot Ingestion)**: Snapshot with missing optional fields does not throw TypeError.
- **T2-F15-03 (Concurrent Reconnect Invocations)**: 5 calls to `reconnect()` in flight are debounced to single IPC call.
- **T2-F15-04 (Scrub Release with Network Drop)**: User releases slider drag while bridge disconnects; state sets cleanly.
- **T2-F15-05 (Hook Unmount During Active Listener)**: Unmounting during listener execution does not trigger "state update on unmounted component".

### Feature 16: Shell Slimming (<500 LOC App.tsx) (Boundaries)
- **T2-F16-01 (1000 Rapid Tab Cycles Memory Leak)**: Cycling tabs 1000 times does not leak detached DOM nodes.
- **T2-F16-02 (Window Resize from 1920x1080 to 900x600)**: Active tab and modal state persist without reset.
- **T2-F16-03 (Null Initial Snapshot Startup)**: App shell renders splash/loading state when initial snapshot is null.
- **T2-F16-04 (Unknown Route Pathname)**: Malformed URL/route resets to Overview without blank screen.
- **T2-F16-05 (App.tsx LOC Ceiling Guard)**: App.tsx verified to remain < 500 LOC.

### Feature 17: Test Guard Synchronization (Boundaries)
- **T2-F17-01 (File Exceeding 1000 LOC Detection)**: Test guard flags any file in `src/renderer/` exceeding 1000 lines.
- **T2-F17-02 (Native Select Intrusion Detection)**: Test guard flags any file introducing `<select`.
- **T2-F17-03 (Windows CRLF vs Linux LF Equivalence)**: Line count and regex matching behave identically across line endings.
- **T2-F17-04 (Missing Modular File Graceful Alert)**: Synchronized tests give clear, actionable errors when modular files are missing.
- **T2-F17-05 (Suite Execution Timeout Guard)**: Entire companion test suite runs in under 10 seconds.

### Feature 18: Automated Verification & Acceptance Signoff (Boundaries)
- **T2-F18-01 (TypeScript Strict Mode Zero Warnings)**: No implicit any, unused locals, or unsafe type assertions.
- **T2-F18-02 (Production Build Tree-Shaking)**: Build contains no dead test dependencies or unreferenced assets.
- **T2-F18-03 (Multi-Threaded Test Concurrency)**: Vitest workers run tests in parallel without file write collisions.
- **T2-F18-04 (Layout Check Zero Pixel Tolerance)**: Card heights and alignment tolerances enforced strictly at 1px / 2px.
- **T2-F18-05 (Non-Zero Exit Code on Single Failure)**: Any test failure returns exit code 1 to abort CI pipelines immediately.

---

## Tier 3: Cross-Feature Combinations (Pairwise Interaction Specifications)

Tier 3 exercises interactions between interconnected subsystems to verify state synchronization and prevent cascade failures.

1. **XF-01 (Audio Haptics + Adaptive Triggers)**
   - *Subsystems*: Audio Haptics (F7) & Adaptive Triggers (F9).
   - *Interaction*: Enabling audio-reactive haptics DSP while running adaptive trigger resistance test presets.
   - *Verification*: Telemetry stream processes both motor commands without command dropping or IPC queue saturation.
2. **XF-02 (Profile Switching + Radial Deadzones + Remapping)**
   - *Subsystems*: Game Profiles (F12), Deadzones (F6), and Remapping (F13).
   - *Interaction*: Automatic profile switch triggered by active game process detection; updates deadzones, paddle assignments, and trigger resistance simultaneously.
   - *Verification*: Bridge receives unified configuration update; active page UI displays new profile parameters.
3. **XF-03 (ErrorBoundary Recovery + Telemetry Stream)**
   - *Subsystems*: ErrorBoundary (F2) & Telemetry Decoupling (F15).
   - *Interaction*: Simulating a render crash inside Deadzones tab while high-frequency stick telemetry is streaming.
   - *Verification*: Per-tab ErrorBoundary catches crash, stick preview stream is cancelled cleanly, clicking "Retry" restores live stick preview.
4. **XF-04 (CustomSelect in Modal + Theme Preset Change)**
   - *Subsystems*: UI Primitives (F1), Dialogs (F12), and Style Guide (F3).
   - *Interaction*: Opening Game Profiles Modal, expanding CustomSelect dropdown, and toggling UI theme preset from 'dark' to 'kiwi'.
   - *Verification*: Dropdown remains open and positioned correctly; contrast tokens update immediately without visual clipping.
5. **XF-05 (Touchpad Remapping + Chords Engine)**
   - *Subsystems*: Remapping (F13) & Chords (F14).
   - *Interaction*: Assigning a touchpad 2-finger tap gesture as a chord modifier trigger.
   - *Verification*: Chord engine receives normalized input event and executes assigned chord action without remapping interference.
6. **XF-06 (Accordion Navigation + Scaled UI Layout Check)**
   - *Subsystems*: Layout Check Navigation (F4) & UI Style Guide (F3).
   - *Interaction*: Expanding and collapsing navigation accordion groups while UI scale is set to 125%.
   - *Verification*: Sidebar card heights and Ko-fi badge spacing remain within 1px tolerance; zero overflow.
7. **XF-07 (Host Persona Switch + Controller Hardware Re-enumeration)**
   - *Subsystems*: Overview/System (F5/F11) & Telemetry Decoupling (F15).
   - *Interaction*: Switching persona from PlayStation to Xbox 360 mode.
   - *Verification*: Persona transition countdown displays; bridge hook handles disconnect and reconnect without unhandled rejections.
8. **XF-08 (Shell Slimming + Nested Modal Chaining)**
   - *Subsystems*: Shell Slimming (F16) & Dialog Modals (F12).
   - *Interaction*: Opening Startup Tutorial -> Opening Settings -> Opening Firmware Update modal.
   - *Verification*: Focus trap transfers cleanly; Escape key closes modals in reverse LIFO order.

---

## Tier 4: Real-World Application Scenarios (End-to-End User Workflows)

Tier 4 exercises complete user lifecycles from start to finish.

### Scenario 1: First-Time User Onboarding & Controller Pairing Workflow
1. User launches DS5 Bridge Companion with clean environment (empty localStorage).
2. Shell detects initial state and displays `StartupTutorial` modal.
3. User completes tutorial step 1 (Feature toggle), views Ko-fi badge, clicks "Continue".
4. Tutorial dismisses; `ds5bridge.startupTutorialCompleted.v1` is stored as '1'.
5. User navigates to "Devices" tab; empty state shows "Connect a controller to save it here."
6. User connects DualSense Edge controller via Bluetooth.
7. Bridge detects hardware; `DevicesModel` populates connected card with VID/PID `0x054C / 0x0DF2`, power `80%`.
8. User clicks controller menu, selects "Rename", enters "Desk Edge", confirms.
9. Cached identity updates in localStorage; card reflects "Desk Edge".

### Scenario 2: Competitive FPS Controller Calibration
1. User navigates to "Deadzones" tab.
2. Shell requests stick input preview; live stick crosshair animates in SVG canvas.
3. User adjusts Left Stick deadzone to 3% and Right Stick deadzone to 5%.
4. Bridge applies radial deadzones via IPC.
5. User navigates to "Adaptive Triggers" tab; enters Trigger Lab.
6. User configures hair-trigger profile (instant resistance break at 5% pull).
7. User navigates to "Button Remapping" tab; maps rear paddle L4 to Jump (Cross) and R4 to Slide (Circle).
8. User navigates to "Chords" tab; binds Mute + Options to Reset Calibration.
9. User saves configuration as game profile "Apex Legends".
10. All settings persist and reflect across UI cards.

### Scenario 3: Immersive Audio Haptics Gaming Session
1. User connects headset to DualSense 3.5mm jack.
2. Companion detects audio endpoint "Wireless Controller Audio" via label matcher.
3. User navigates to "Haptics" tab; toggles "Enter Audio Haptics".
4. Audio Haptics panel loads active audio sessions via `listAudioHapticsSessions()`.
5. User selects game audio process `game.exe`.
6. User sets Mode to "Mix", Bass Focus to "Deep Rumble", and Gain to 90%.
7. Bridge activates real-time DSP filter.
8. System switches audio device; companion re-matches endpoint without crashing.
9. User returns to standard view; haptics remain active and responsive.

### Scenario 4: Host Persona Switching & Re-enumeration
1. User is playing a legacy PC game requiring Xbox 360 controller emulation.
2. User opens "System" tab; views active persona "PlayStation 5".
3. User selects "Xbox 360" persona in CustomSelect dropdown.
4. Transition overlay initiates with countdown timer.
5. Bridge unbinds DualSense HID interface and enumerates virtual XInput controller.
6. Telemetry hook handles transport disconnection and re-establishes connection.
7. Shell updates button glyphs from PlayStation symbols (Cross/Circle) to Xbox letters (A/B).
8. Game detects XInput device; companion confirms active Xbox persona.

### Scenario 5: Degraded Bridge Recovery & Device Cleanup Workflow
1. Hardware connection experiences USB hub packet loss; bridge state transitions to 'error'.
2. Global telemetry hook intercepts error state; renders warning banner with "Recover Bridge" action.
3. User clicks "Bridge Settings" -> "Device Cleanup".
4. `DeviceCleanupConfirmModal` displays warning regarding Windows device registry cleanup.
5. User confirms cleanup; `runWindowsDeviceCleanup()` triggers execution script.
6. Script completes; companion prompts user to reconnect Pico bridge.
7. Bridge re-attaches; companion validates firmware version and syncs stored settings.
8. Bridge state returns to 'connected'; banner clears; all tabs resume normal operation.

---

## Opaque-Box Test Runner Architecture

The test suite is executed using an opaque-box test runner designed to run in both headless environments and developer terminals:
1. **Virtual Bridge Mock (`MockBridgeApi`)**: A complete in-memory implementation of the `BridgeApi` IPC contract that models firmware states, snapshots, settings persistence, and hardware events deterministically.
2. **Server-Side Markup & Component Runner**: Uses React's `renderToStaticMarkup` with Vitest to evaluate rendered DOM trees, accessibility roles, geometry constraints, and event dispatch contracts.
3. **Clean Pass/Fail Signals**: Every test outputs clean assertions without non-deterministic timing flakes or external USB dependencies.
4. **Execution Commands**:
   - Full Companion Suite: `npm run test:companion`
   - Dedicated E2E Runner: `node scripts/run-e2e-tests.mjs` or `npx vitest run src/renderer/e2e`

---

## Conclusion & Verification Signoff
The 4-tier methodology ensures complete coverage of all 18 features, strict boundary stress testing, pairwise cross-feature verification, and realistic user workflow validation, ensuring the DS5 Bridge Companion UI modularization is verified to production grade.

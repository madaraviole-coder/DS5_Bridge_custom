# Comprehensive Architecture Survey & Decomposition Blueprint: DS5 Bridge Monolithic Renderer

**Author**: Explorer Survey Agent (`teamwork_preview_explorer`)  
**Target Codebase**: `companion/src/renderer`  
**Date**: 2026-09-30  
**Status**: Completed Architectural Investigation  

---

## 1. Executive Summary & Problem Formulation

The DS5 Bridge Companion application is an Electron-based desktop application (with a fallback WebHID development mode) providing low-latency control, advanced haptics tuning, adaptive trigger configuration, button remapping, chord shortcuts, and system maintenance for Sony DualSense and DualSense Edge controllers connected via a custom Raspberry Pi Pico bridge firmware.

While the backend architecture (`src/main/`) and protocol transport (`src/shared/`) have achieved high test coverage (339+ tests passing in vitest), the frontend renderer has accumulated severe technical debt in the form of an extreme monolith:
- `src/renderer/App.tsx` contains **12,508 lines of code** in a single file.
- It contains **109 `useState` hooks**, **27 `useRef` hooks**, **209 handler/helper functions**, and manages 10 separate feature domains plus modals, dialogs, and navigation in one giant component tree.
- `src/renderer/styles.css` spans **11,272 lines of code**.
- Zero React `<ErrorBoundary>` components exist across the entire application, meaning any uncaught runtime exception in any subtab immediately crashes the entire React root and leaves users with a blank screen.
- The test suite (`src/renderer/app-behavior.test.ts` and `src/renderer/styles-layout.test.ts`) guards against feature regressions using direct string inspection (`readFileSync('App.tsx', 'utf8')`) against raw source code, creating a tight architectural coupling that must be carefully accounted for during modularization.

This document provides the definitive architectural map and decomposition plan to break `App.tsx` into modular components and domain hooks such that **no single file in `src/renderer/` exceeds 1,000 LOC**, while preserving 100% of user-facing behavior, device telemetry, and IPC contracts.

---

## 2. Line of Code (LOC) Census

### 2.1 All Files in `companion/src/renderer/`
| File | Lines (LOC) | Role / Content |
|---|---|---|
| `App.tsx` | **12,508** | **Monolithic renderer component, tabs, states, and dialogs** |
| `styles.css` | **11,272** | **Monolithic CSS stylesheet for all companion UI** |
| `web-bridge-adapter.ts` | **1,689** | WebHID & browser mock implementation of `BridgeApi` |
| `styles-layout.test.ts` | 657 | Vitest suite validating CSS tokens and layout rules |
| `app-behavior.test.ts` | 615 | Vitest suite asserting behavior and source invariants |
| `controller-devices.ts` | 408 | Data models & cache helpers for controller devices |
| `ControllerDevicesPage.tsx` | 334 | Extracted view component for the Devices tab |
| `controller-devices.test.ts` | 260 | Unit tests for controller device caching & mutations |
| `ControllerDevicesPage.test.tsx` | 130 | Component tests for ControllerDevicesPage |
| `radial-deadzone-preview.ts` | 60 | Canvas math & preview logic for stick deadzones |
| `ui-themes.ts` | 57 | Theme presets and swatch palettes |
| `audio-endpoint-matching.ts` | 45 | Utility matching Windows audio endpoints to controller |
| `audio-endpoint-matching.test.ts` | 42 | Tests for audio endpoint matching |
| `radial-deadzone-preview.test.ts` | 41 | Tests for radial deadzone calculations |
| `main.tsx` | 16 | React 19 entry point (`createRoot`) |
| `global.d.ts` | 10 | Global declaration for `window.bridge: BridgeApi` |

### 2.2 Structural Breakdown of `App.tsx` (12,508 LOC)
| Code Section | Line Range | LOC | Contents & Responsibilities |
|---|---|---|---|
| **1. Imports & Domain Types** | Lines 1 – 1,291 | 1,291 | Module imports, TS types (`ControlTab`, `RemapButtonDefinition`, `TriggerLabDraft`, etc.), static option tuples (`MUTE_KEY_OPTIONS`, `HAPTICS_PRESETS`, etc.) |
| **2. Standalone UI Components (Pre-`App`)** | Lines 1,292 – 2,846 | 1,555 | Standalone React components defined before `App()`: `SystemProfileSummary` (566 LOC), `FeatureTipsPanel` (240 LOC), `CustomSelect` (212 LOC), `StartupTutorial` (104 LOC), `KitsuneInputPromotionDialog` (94 LOC), `TriggerLabMeter`, `BridgeMark`, `ThemeOption`, glyph pickers |
| **3. Chord & Remap Pure Helpers** | Lines 2,847 – 3,078 | 232 | Pure helper functions: SVG coordinate mapping, chord label normalizers, chord function serializers |
| **4. `App()` State & Ref Declarations** | Lines 3,079 – 3,506 | 428 | 109 `useState` hooks, 27 `useRef` hooks spanning all 10 domain tabs |
| **5. Effects & Telemetry Ingestion** | Lines 3,507 – 4,548 | 1,042 | Bridge snapshot subscription (`onSnapshot`, `getStatus`), window drag snapshot deferral, device cache sync, chord keyboard sync, callout position geometry effects |
| **6. Domain Handlers & Callbacks** | Lines 4,549 – 7,559 | 3,011 | 209 action handlers: `commitHapticsValue`, `commitSpeakerVolume`, `runTestSpeaker`, `renderTriggerLabCard`, `handleTouchpadZoneClick`, `startTurboTester`, `confirmControllerDeviceForget`, `runWindowsDeviceCleanup`, etc. |
| **7. Sidebar & Shell JSX** | Lines 7,200 – 7,559 | 360 | Desktop shell layout, sidebar navigation groups (`Controller`, `Input`, `Labs`), Ko-fi badge, quick status indicator |
| **8. Tab: Overview** | Lines 7,560 – 8,057 | 498 | Overview cards (Game Profile, Active Profile, Kitsune Bar), host persona segmented controls, quick sliders, technical status |
| **9. Tab: Devices** | Lines 8,058 – 8,082 | 25 | Delegation to `<ControllerDevicesPage />` |
| **10. Tab: Deadzones** | Lines 8,083 – 8,216 | 134 | Stick deadzone sliders, presets, visual preview meters, stick telemetry preview |
| **11. Tab: Haptics & Audio Haptics** | Lines 8,217 – 8,679 | 463 | Haptics gain slider, feedback boost, classic rumble controls, test buttons, Audio Haptics process routing & DSP config |
| **12. Tab: Audio** | Lines 8,680 – 9,027 | 348 | Speaker volume, mic volume, gain levels, buffer length slider, test tone playback, mic test |
| **13. Tab: Triggers & Trigger Lab** | Lines 9,028 – 9,219 | 192 | Effect intensity slider, test modes, trigger testing, Trigger Lab integration |
| **14. Tab: Lighting** | Lines 9,220 – 9,431 | 212 | Color preset swatches, custom color popover palette, brightness slider, player LEDs, mute LED |
| **15. Tab: Remapping** | Lines 9,432 – 10,524 | 1,093 | Subtabs: Buttons (interactive SVG callouts), Sticks, Triggers, Touchpad (4-zone + gesture builder), Turbo (Multi-Actions library + tester) |
| **16. Tab: Chords** | Lines 10,525 – 10,983 | 459 | Chord function library, shortcut draft editor, assignment drag-and-drop table, custom scrollbar |
| **17. Tab: System** | Lines 10,984 – 11,400 | 417 | Polling rate, persona, mute button mode, power saving, sleep shortcuts, emergency device repair, firmware flashing |
| **18. Dialogs, Modals & Toast Overlays** | Lines 11,401 – 12,508 | 1,108 | Startup tutorial modal, Kitsune promotion modal, Game profiles modal, Kitsune bar info modal, Device rename/forget modals, Profile dialogs |

---

## 3. Comprehensive Mapping of the 10 Domain Tabs

Below is the detailed architectural map of each domain tab:

### 3.1 Overview Tab
- **Source Range**: `App.tsx:7560-8057` (498 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: Title "Controller Overview", description "Key settings, active features, and bridge status.", sleep controller action button with a 2-click confirmation flow (`armOverviewSleepConfirmation`, `handleOverviewSleepController`, `overviewSleepConfirmVisible`, auto-cleared via `SLEEP_CONFIRM_MS = 2400`), and health status badge (`healthLabel(snapshot)`, `overviewHealthTitle`).
  - Kitsune-style Paired Cards:
    1. Active Game card (`aria-label="Active Game"`, orange toggle `switch-orange` for auto-switch, active game profile badge, "Edit Profile" button opening `GameProfilesModal`).
    2. Active Profile card (`aria-label="Active Profile"`, controller profile name, autosave check indicator `ProfileSaveStatus`, "Game Profiles" button opening library).
    3. Library card (`aria-label="Library"`, manage game profiles shortcut).
    4. Kitsune Bar card (`aria-label="Kitsune Bar"`, overlay info card opening `KitsuneBarModal`).
  - Quick Controls Section:
    - Host Persona 4-column segmented buttons: DualSense (`DS`), DualSense Edge (`DSE`), DS4 (`DS4`), Xbox 360 (`XBOX`) via `HOST_PERSONA_SHORT_LABELS` and `setHostPersonaMode`.
    - Profile quick-select buttons (`applyPreset`).
    - Quick Sliders: Haptics gain (`hapticsValue`), Speaker volume (`speakerVolumeValue`), Mic volume (`micVolumeValue`), Lightbar brightness (`lightbarBrightnessValue`).
  - Technical Status Section:
    - Bridge connection status, controller connection status, battery percentage, charging state indicator (`isChargingPowerState`, `isExternalPowerState`), controller hardware type (`DualSense` vs `DualSense Edge`), connection type (USB vs Bluetooth), firmware version, connection uptime (`UptimeValue`).
- **Telemetry Consumption**:
  - `snapshot.state` (`connected` vs `disconnected`).
  - `snapshot.status`: `controllerConnected`, `batteryPercent`, `batteryCharging`, `powerState`, `controllerType`, `connectionType`, `firmwareVersion`, `uptimeSeconds`.
  - `snapshot.settings`: `gameProfileAutoSwitchEnabled`, `activeGameProfileId`, `hostPersonaMode`, `selectedPresetId`, `hapticsGainPercent`, `speakerVolumePercent`, `micVolumePercent`, `lightbarBrightnessPercent`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setGameProfileAutoSwitchEnabled(boolean)`
  - `window.bridge.setHostPersonaMode(HostPersonaMode)`
  - `window.bridge.sleepController()`
  - `window.bridge.applyPreset(BridgePresetId)`
  - `window.bridge.setHapticsGain(number)`
  - `window.bridge.setSpeakerVolume(number)`
  - `window.bridge.setMicVolume(number)`
  - `window.bridge.setLightbarColor(string, number)`
- **Dependencies & Modal Triggers**:
  - `setIsGameProfilesModalOpen(true)`, `setEditingGameProfile(profile)`, `setIsKitsuneBarInfoOpen(true)`.

### 3.2 Devices Tab
- **Source Range**: `App.tsx:8058-8082` (25 LOC).
- **Existing UI Elements & Controls**:
  - Renders `<ControllerDevicesPage />` from `src/renderer/ControllerDevicesPage.tsx`.
  - Devices heading: "Current and last controllers." with Scan icon (`IconScan`), "Pair Controller" action button, and "Forget Controllers" bulk action button.
  - Active controller card: connection state badge, battery percentage, Bluetooth address, link key status, rename button (`onOpenRename`), forget button (`onOpenForgetOne`).
  - Known device history list with 3-dot dropdown menu (`openMenuKey`, `trusted-device-menu`).
- **Telemetry Consumption**:
  - Synchronized into `controllerDevices` array in `localStorage` via `observeControllerDevice` inside a `useEffect` watching `snapshot.status` and `snapshot.diagnostics.deviceIdentity`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.requestControllerScan()`
  - `window.bridge.forgetControllerPairings()`
  - `window.bridge.forgetControllerPairing(bluetoothAddress)`
- **Dependencies & Modal Triggers**:
  - Uses `openControllerDeviceRename`, `openControllerDeviceForgetOne`, `openControllerDeviceForgetAll`, triggering dialogs rendered in `App.tsx` lines 12,150–12,250.

### 3.3 Deadzones Tab
- **Source Range**: `App.tsx:8083-8216` (134 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: "Stick Deadzones", "Shape analog stick deadzones and precision.", feature-icon (`IconViewfinder`).
  - Feature card grid:
    - Left & Right stick radial deadzone sliders (`leftStickRadialDeadzoneValue`, `rightStickRadialDeadzoneValue`).
    - Preset buttons (0%, 5%, 10%, 20% via `RADIAL_DEADZONE_PRESETS`).
    - Stick input live preview visualizer: renders `<canvas>` using `radialDeadzonePreview` showing real-time Physical vs Output positions.
    - Active stick input preview lifecycle: automatically requests live stick report telemetry on tab mount via `window.bridge.requestStickInputPreview()` and releases on tab unmount via `window.bridge.releaseStickInputPreview()`.
  - Tips Panel: `<FeatureTipsPanel tab="deadzones" />` ("Tune Each Stick", "Keep It Low").
- **Telemetry Consumption**:
  - `snapshot.settings.leftStickRadialDeadzonePercent`, `snapshot.settings.rightStickRadialDeadzonePercent`.
  - Live stick input telemetry when preview is active.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setRadialDeadzones(leftPercent, rightPercent)`
  - `window.bridge.requestStickInputPreview()`
  - `window.bridge.releaseStickInputPreview()`
- **Dependencies**:
  - `radial-deadzone-preview.ts` canvas rendering logic.

### 3.4 Haptics Tab (Standard & Audio Haptics)
- **Source Range**: `App.tsx:8217-8679` (463 LOC).
- **Existing UI Elements & Controls**:
  - Header: Master Haptics switch (`toggleHapticsEnabled`), and mode toggle switch ("Enter Audio Haptics" / "Exit Audio Haptics").
  - Mode 1: Standard Haptics (`.feature-card-grid`):
    - Left Card (Settings):
      - Feedback Gain slider (`hapticsValue`, max 200% standard, up to 500% with boost), preset buttons (Off, 50, 75, 100).
      - Feedback Boost toggle switch (`toggleFeedbackBoostEnabled`).
      - Classic Rumble collapsible section: enable switch (`toggleClassicRumbleEnabled`), gain slider (`classicRumbleValue`), preset buttons, and V1 legacy classic rumble toggle (`toggleClassicRumbleV1Enabled`).
    - Right Card (Slotted Testing Card):
      - Slotted primary test button: "Test Haptics" (`runFeedbackTest` -> `window.bridge.testHaptics()`).
      - Slotted secondary test button: "Test Rumble" (`window.bridge.testClassicRumble()`).
      - Cooldown lockouts (`TEST_HAPTICS_LOCK_MS = 1100`, `testLocked`).
      - Status text at bottom (`feature-status`).
  - Mode 2: Audio Haptics (`.audio-haptics-grid`):
    - Left Card:
      - Source selector (System Audio vs Specific Process Audio session via `CustomSelect`).
      - Frequency mode selector (Full Spectrum, Low Pass, Peak).
      - Bass focus, response speed, attack/release controls (`AudioHapticsConfigLabel`, `CustomSelect`).
    - Right Card:
      - Active audio sessions table, process refresh button (`window.bridge.listAudioHapticsSessions()`), routing status.
- **Telemetry Consumption**:
  - `snapshot.settings.hapticsEnabled`, `snapshot.settings.hapticsGainPercent`, `snapshot.settings.feedbackBoostEnabled`.
  - `snapshot.settings.classicRumbleEnabled`, `snapshot.settings.classicRumbleGainPercent`, `snapshot.settings.classicRumbleV1Enabled`.
  - `snapshot.settings.audioReactiveHapticsConfig`.
  - `snapshot.status.testHapticsCooldown`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setHapticsGain(number)`
  - `window.bridge.setHapticsEnabled(boolean)`
  - `window.bridge.setFeedbackBoostEnabled(boolean)`
  - `window.bridge.setClassicRumbleGain(number)`
  - `window.bridge.setClassicRumbleEnabled(boolean)`
  - `window.bridge.setClassicRumbleV1Enabled(boolean)`
  - `window.bridge.testHaptics()`
  - `window.bridge.testClassicRumble()`
  - `window.bridge.setAudioReactiveHapticsConfig(Partial<AudioReactiveHapticsConfig>)`
  - `window.bridge.listAudioHapticsSessions()`

### 3.5 Audio Tab
- **Source Range**: `App.tsx:8680-9027` (348 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: "Controller Audio", description, master audio switch (`toggleAudioEnabled`).
  - Left Card (Audio Settings):
    - Speaker volume slider (`speakerVolumeValue`, 0-100%, step 10), preset buttons (Mute, 50, 75, 100), speaker gain level select (`setSpeakerGainLevel`).
    - Microphone section toggle (`setShowMicrophoneControl`), mic volume slider (`micVolumeValue`), preset buttons, duplex mic toggle (`toggleDuplexMicEnabled`), mic mute toggle (`toggleMicMute`).
    - Audio Buffer Length framed slider (`AUDIO_BUFFER_LENGTH_MIN = 16` to `AUDIO_BUFFER_LENGTH_MAX = 128`), delay label and safety zone indicators (`audioBufferDelayLabel`, `audioBufferZoneLabel`).
  - Right Card (Slotted Testing Card):
    - Slotted primary test button: "Test Speaker" (`runTestSpeaker`). Plays embedded tone asset (`test-speaker-tone-silence-tail.mp3`) routed directly to the DualSense WASAPI output sink.
    - Slotted secondary test button: "Test Mic" (`runTestMic`). Triggers 5-second microphone listen / VU meter test.
    - Status copy (`feature-status`).
- **Telemetry Consumption**:
  - `snapshot.settings.speakerEnabled`, `snapshot.settings.speakerVolumePercent`, `snapshot.settings.speakerGainLevel`.
  - `snapshot.settings.micVolumePercent`, `snapshot.settings.micMute`, `snapshot.settings.duplexMicEnabled`.
  - `snapshot.settings.hapticsBufferLength`.
  - `snapshot.status.firmwareFlags.hapticsBufferLengthControl`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setSpeakerVolume(number)`
  - `window.bridge.setSpeakerGainLevel(number)`
  - `window.bridge.setSpeakerEnabled(boolean)`
  - `window.bridge.setMicVolume(number)`
  - `window.bridge.setMicMute(boolean)`
  - `window.bridge.setDuplexMicEnabled(boolean)`
  - `window.bridge.setHapticsBufferLength(number)`
  - `window.bridge.testSpeaker()`

### 3.6 Triggers Tab (Standard & Trigger Lab)
- **Source Range**: `App.tsx:9028-9219` (192 LOC).
- **Existing UI Elements & Controls**:
  - Header: Master Adaptive Triggers switch (`toggleAdaptiveTriggersEnabled` or `toggleTriggerLabEnabled`), and mode toggle switch ("Trigger Lab").
  - Mode 1: Standard Adaptive Triggers:
    - Left Card: Effect Intensity slider (0-100%, step 10), preset buttons (Off, Medium, Full), test mode select (`TRIGGER_TEST_MODE_OPTIONS`: Off, Rigid, Pulse, Bow, Machine Gun, etc.).
    - Right Card: Trigger selection (L2, R2, Both), Test Triggers slotted action button (`runTestAdaptiveTriggers`), Reset Triggers secondary slotted action button (`resetAdaptiveTriggers`).
  - Mode 2: Trigger Lab (`renderTriggerLabCard`):
    - L2 & R2 independent or linked configuration (`triggerLabLinked`).
    - Profile management (Select profile, custom profile save/rename/delete dialogs).
    - Trigger mode parameter inputs: Mode, Start position, Stop position, Force, Frequency.
    - Live feedback meter (`TriggerLabMeter`).
- **Telemetry Consumption**:
  - `snapshot.settings.adaptiveTriggersEnabled`, `snapshot.settings.triggerEffectIntensityPercent`, `snapshot.settings.triggerTestMode`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setAdaptiveTriggersEnabled(boolean)`
  - `window.bridge.setTriggerEffectIntensity(number)`
  - `window.bridge.setTriggerTestMode(TriggerTestMode)`
  - `window.bridge.testAdaptiveTriggers(mode, target)`
  - `window.bridge.applyAdaptiveTriggerEffect(AdaptiveTriggerPreviewEffect)`
  - `window.bridge.previewAdaptiveTriggerEffect(AdaptiveTriggerPreviewEffect)`
  - `window.bridge.resetAdaptiveTriggers()`

### 3.7 Lighting Tab
- **Source Range**: `App.tsx:9220-9431` (212 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: "Lightbar & LEDs", master lightbar enable switch (`toggleLightbarEnabled`).
  - Left Card (Color & Behavior):
    - Preset color swatches: Yellow (`#FFFF00`), Blue (`#0000FF`), Green (`#00FF00`), Red (`#FF0000`), Purple (`#8000FF`), White (`#FFFFFF`).
    - Custom color swatch with gradient border: 1-click selects remembered custom color; double-click opens compact dark palette popover (`LIGHTBAR_CUSTOM_PALETTE`, `LightbarPaletteCell`, `selectCustomLightbarColor`).
    - Selected color metadata display (`selected-color-info`: color name and uppercase hex code).
    - Game lightbar override toggle switch (`setLightbarOverrideEnabled`).
  - Right Card (Brightness & LEDs):
    - Brightness slider (0-100%, step 10), preset buttons.
    - Player LED enable switch (`setPlayerLedEnabled`).
    - Mic Mute LED indicator enable switch (`setLedEnabled`).
- **Telemetry Consumption**:
  - `snapshot.settings.lightbarEnabled`, `snapshot.settings.lightbarColor`, `snapshot.settings.lightbarBrightnessPercent`.
  - `snapshot.settings.lightbarOverrideEnabled`, `snapshot.settings.playerLedEnabled`, `snapshot.settings.ledEnabled`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setLightbarColor(colorHex, brightnessPercent)`
  - `window.bridge.setLightbarEnabled(boolean)`
  - `window.bridge.setLightbarOverrideEnabled(boolean)`
  - `window.bridge.setPlayerLedEnabled(boolean)`
  - `window.bridge.setLedEnabled(boolean)`

### 3.8 Remapping Tab (Buttons, Sticks, Triggers, Touchpad, Turbo)
- **Source Range**: `App.tsx:9432-10524` (1,093 LOC).
- **Existing UI Elements & Controls**:
  - Subtab Navigation Bar (`.remapping-subtabs`): Buttons, Sticks, Triggers, Touchpad, Multi-Actions (Turbo).
  - Subtab 1: Buttons:
    - Profile header: Select remapping profile, Save profile, Rename profile, Delete profile, Restore defaults.
    - Interactive DualSense & DualSense Edge SVG layout (`RemapCalloutLayout`, `EdgeRemapControlLayout`):
      - Interactive button pills with hover states (`hoveredRemapButton`).
      - Remap dropdowns (`CustomSelect`, `RemapGlyphOption`).
      - DualSense Edge back paddle mapping (`lb`, `rb`, `lfn`, `rfn`).
  - Subtab 2: Sticks:
    - Deadzone & sensitivity shortcut view (links to Deadzones tab).
  - Subtab 3: Triggers:
    - Trigger threshold shortcut view (links to Triggers tab).
  - Subtab 4: Touchpad (4-Zone Mapping & Gesture Builder):
    - 4-Zone Button Mapping: Interactive Touchpad Canvas SVG with Zone 1, 2, 3, 4 selection, target button mapping select (`TouchpadZoneTargetOption`).
    - Swipe Gesture Builder: Swipe sequence configuration, direction presets (Left, Right, Up, Down), category tabs (Windows Shortcuts, Media Controls, Controller Button, Custom Hotkey), Test Action button (`handleTestTouchpadGesture`).
  - Subtab 5: Turbo (Multi-Actions):
    - Left Column: Action Library (Create actions, Action profile select, Interval stepper, Deterministic output status).
    - Right Column: Trigger Assignments (New trigger popover, glyph badge, Starts when mode: Pressed / Held / Double Press, Trigger action pill).
    - Interactive Turbo Tester: "HOLD TO TEST CADENCE" with flashing indicator and frequency counter.
- **Telemetry Consumption**:
  - `snapshot.settings.buttonRemappingDraft`, `snapshot.settings.buttonRemappingProfiles`.
  - `snapshot.settings.touchpadSettings`, `snapshot.settings.turboSettings`.
  - `snapshot.status.controllerType` (determines Edge paddle visibility).
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setButtonRemap(buttonId, targetId)`
  - `window.bridge.selectButtonRemappingProfile(profileId)`
  - `window.bridge.saveButtonRemappingProfile(name)`
  - `window.bridge.renameButtonRemappingProfile(profileId, name)`
  - `window.bridge.deleteButtonRemappingProfile(profileId)`
  - `window.bridge.restoreButtonRemappingDefaults()`
  - `window.bridge.setTouchpadZoneConfig(TouchpadSettings)`
  - `window.bridge.executeTouchpadGesture(TouchpadGesture)`
  - `window.bridge.setTurboConfig(TurboSettings)`

### 3.9 Chords Tab
- **Source Range**: `App.tsx:10525-10983` (459 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: "Chord Shortcuts", description.
  - Paired Grid Layout:
    - Left Card: Chord Functions Library:
      - Defined chord functions list.
      - Create Function, Rename Function, Delete Function.
      - Function Draft Editor: Type (Keyboard shortcut, Media action, Controller setting notch, Launch app), Keyboard modifiers (Ctrl, Shift, Alt, Win), Key selector (`CHORD_KEYBOARD_KEY_OPTIONS`), Controller setting target (Speaker, Mic, Haptics, Rumble, Triggers, Lighting) and step adjustment text (`chordControllerSettingAdjustmentText`).
    - Right Card: Chord Bindings / Assignments:
      - Active bindings table: Starter button (PS, LFN, RFN, Mute via `ChordStarterGlyphOption`) + Action button (`ChordButtonGlyphOption`) -> Assigned Function (`CustomSelect`).
      - Inactive warning banner when Mute chord starter is disabled.
      - Edge Profile blocker check (`edgeProfileSwitchingBlocked`).
      - Custom drag-and-drop pointer tracking: pointer down, drag overlay creation, reorder ghost drop target, pointer up commit (`startChordAssignmentPointerDrag`, `updateChordAssignmentDropTarget`, `finishChordAssignmentPointerDrag`).
      - Custom scrollbar geometry implementation (`chordAssignmentScrollbar`, `startChordAssignmentScrollbarDrag`).
- **Telemetry Consumption**:
  - `snapshot.settings.chordFunctions`, `snapshot.settings.chordAssignments`.
  - `snapshot.settings.edgeProfileSwitchingBlocked`, `snapshot.settings.muteButtonMode`.
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setChordConfiguration(functions, assignments)`
  - `window.bridge.setChordFunctions(functions)`
  - `window.bridge.setChordAssignments(assignments)`

### 3.10 System Tab
- **Source Range**: `App.tsx:10984-11400` (417 LOC).
- **Existing UI Elements & Controls**:
  - `feature-heading`: "System & Hardware", master "Restore Defaults" button (`restoreDefaults`).
  - Paired Grid (`.system-card`):
    - Left Card (Hardware & Input):
      - Polling Rate mode (`setPollingRateMode`: 250Hz, 500Hz, 1000Hz).
      - Host Persona mode (`setHostPersonaMode`: DualSense, DualSense Edge, DS4, Xbox 360).
      - Mute Button Action (`setMuteButtonAction`: Standard, Push-to-Talk, Push-to-Mute, Windows Shortcut, Chord Starter).
      - Keyboard shortcut usage and modifiers for Mute button.
    - Right Card (Preferences & Automation):
      - Idle Disconnect switch & timeout minutes.
      - USB Suspend Disconnect switch.
      - Wake on Connect switch.
      - Controller Power Saving mode switch (caps haptics at 60% when audio active).
      - Sleep Controller keybind shortcut switch.
      - Speaker Volume shortcut switch.
      - Launch at Startup switch.
      - Battery percentage in tray icon switch.
      - UI Theme preset select (`ThemeOption`, `setUiThemePreset`).
      - UI Scale percent select (`setUiScalePercent`).
  - Maintenance & Diagnostics Section:
    - Emergency Windows Device Repair button (`openDeviceCleanupConfirm` -> `runWindowsDeviceCleanup`).
    - Firmware Update actions (`mountPicoBootloader`, `flashPicoFirmware`, `nukePicoFlash`).
    - Firmware log directory choose & clear buttons.
    - Diagnostics toggle (`showDiagnostics`), renders `SystemProfileSummary` (lines 1824–2390, 566 LOC).
- **Telemetry Consumption**:
  - `snapshot.settings.*` (all system settings).
  - `snapshot.diagnostics` (device identity, bridge logs, bus timing).
- **IPC / Bridge Transport Calls**:
  - `window.bridge.setPollingRateMode`
  - `window.bridge.setHostPersonaMode`
  - `window.bridge.setMuteButtonAction`
  - `window.bridge.setIdleDisconnectEnabled`
  - `window.bridge.setIdleDisconnectTimeoutMinutes`
  - `window.bridge.setUsbSuspendDisconnectEnabled`
  - `window.bridge.setWakeOnConnectEnabled`
  - `window.bridge.setControllerPowerSavingEnabled`
  - `window.bridge.setSleepKeybindEnabled`
  - `window.bridge.setSpeakerVolumeShortcutEnabled`
  - `window.bridge.setLaunchAtStartupEnabled`
  - `window.bridge.setShowBatteryPercentTrayIcon`
  - `window.bridge.setUiThemePreset`
  - `window.bridge.setUiScalePercent`
  - `window.bridge.repairWindowsDeviceCache()`
  - `window.bridge.mountPicoBootloader()`
  - `window.bridge.flashPicoFirmware()`
  - `window.bridge.nukePicoFlash()`
  - `window.bridge.restoreDefaults()`
  - `window.bridge.getDiagnostics()`
  - `window.bridge.selectFirmwareLogDirectory()`
  - `window.bridge.clearFirmwareLogDirectory()`

---

## 4. State Management, Bridge Transport & Error Resiliency Architecture

### 4.1 Telemetry Pipeline & Snapshot Ingestion
Device telemetry originates in the main process bridge (`src/main/bridge-service.ts`) through HID report parsing of the Pico bridge and controller. The main process emits telemetry updates over Electron IPC on the `'bridge:snapshot'` channel.

In the renderer, snapshot ingestion flows through `App.tsx:3599-3688`:
1. On mount, `window.bridge.getStatus()` fetches the initial `BridgeSnapshot`.
2. Simultaneously, `window.bridge.onSnapshot(listener)` subscribes to live snapshots.
3. Crucially, a race guard exists: `receivedLiveSnapshot` prevents older initial status promises from overwriting a newer live snapshot:
   ```typescript
   let cancelled = false;
   let receivedLiveSnapshot = false;
   window.bridge.getStatus().then((next) => {
     if (!cancelled && !receivedLiveSnapshot) {
       applySnapshot(next);
     }
   });
   const unsubscribe = window.bridge.onSnapshot((next) => {
     receivedLiveSnapshot = true;
     if (windowDraggingRef.current) {
       deferredSnapshotRef.current = next;
       return;
     }
     applySnapshot(next);
   });
   ```

### 4.2 Scrubbing & Window Drag Deferral
To prevent telemetry updates from stomping over local UI slider values while a user is actively scrubbing or dragging the window:
- `windowDraggingRef` and `deferredSnapshotRef` hold the latest snapshot until the drag operation completes.
- Domain-specific editing refs (`hapticsEditingRef`, `radialDeadzoneEditingRef`, `classicRumbleEditingRef`, `speakerVolumeEditingRef`, `micVolumeEditingRef`, `audioBufferLengthEditingRef`, `lightbarBrightnessEditingRef`, `triggerEffectEditingRef`) are checked inside `applySnapshot(next)`. If a slider is being actively dragged, the snapshot will not overwrite that slider's local state.

### 4.3 IPC Structure: Electron ContextBridge vs WebHID
All renderer IPC is abstracted through `window.bridge: BridgeApi`:
- In Electron desktop mode, `preload.ts` uses `contextBridge.exposeInMainWorld('bridge', api)` mapping each method to `ipcRenderer.invoke('bridge:<method>')`.
- In web development mode, `main.tsx` calls `initWebBridgeIfNeeded()` from `src/renderer/web-bridge-adapter.ts`, which injects a polyfill on `window.bridge` communicating directly with WebHID or local mocks.
- This clean interface means **no renderer component should ever call `ipcRenderer` directly**; all components interface purely through `window.bridge`.

### 4.4 Connection, Disconnection & Reconnection States
The application distinguishes three distinct connection states:
1. `connected = snapshot?.state === 'connected'` (Pico USB Bridge is connected to Windows).
2. `controllerConnected = snapshot?.status?.controllerConnected` (DualSense is actively paired and connected to the Pico Bridge).
3. `controllerControlsAvailable = connected && controllerConnected` (hardware controls are active and interactable).

When a controller disconnects while the bridge remains plugged in:
- `snapshot.state` remains `'connected'`.
- `snapshot.status.controllerConnected` becomes `false`.
- Primary controls are dimmed using `.controller-unavailable`, disabling interactive sliders and test triggers without crashing the UI.
- The health badge transitions to `'Wake with controller enabled'` or `'Bridge online'`.

### 4.5 Error Handling & Error Boundaries (Critical Finding)
**Observation**: There is currently **zero** `ErrorBoundary` implementation anywhere in `companion/src/renderer`.
- If any component throws an error (e.g. during SVG rendering, canvas drawing, or unexpected payload shapes from the bridge), React 19's default behavior is to completely unmount the root component tree. This results in a catastrophic blank white/black window.
- Hardware errors from the bridge are stored in `snapshot.diagnostics.lastError` and individual action errors like `speakerTestError`, `micTestError`, `deviceCleanupError`, and `picoFirmwareError` are tracked in local state.

**Required Architectural Fix**:
Introduce a two-tier `ErrorBoundary` system:
1. **Application-Level ErrorBoundary** (in `main.tsx` or wrapping `<App />`): Catches fatal errors, shows a clean diagnostic screen with an option to restart or reconnect the bridge without a blank screen.
2. **Tab-Level ErrorBoundary** (wrapping each individual domain tab in `<App />`): If an issue occurs within an active tab (e.g., SVG path calculation error in Remapping or canvas error in Deadzones), only that specific tab renders a localized error fallback card with a "Reload Tab" button, leaving the sidebar, connection status, and other tabs 100% operational.

---

## 5. UI Style Guide & Layout Contract Analysis

`UI_STYLE_GUIDE.md` enforces a strict layout contract verified by `src/renderer/styles-layout.test.ts` and `scripts/layout-check.mjs`:
- Standard content width: `--app-content-width: 820px`.
- Card geometry: `--card-radius: 4px`, `--card-padding: 16px`, `--card-gap: 14px`.
- Shared minimum feature card height: `--feature-card-height: 355px`.
- Paired Card Grid: All main tabs (Haptics, Audio, Triggers, Lighting, System) must use:
  ```tsx
  <div className="feature-card-grid">
    <section className="feature-card">...</section>
    <section className="feature-card">...</section>
  </div>
  ```
- Slotted Testing Cards: Testing cards are strictly slotted, not free-flowing. The primary and secondary action rows must align at exact vertical grid rows across Haptics, Audio, and Triggers:
  ```css
  --feature-status-grid-rows: var(--feature-card-header-height) 76px var(--action-height) var(--action-height) minmax(40px, 1fr);
  ```
- Control Uniformity: Sliders must use `stacked-slider` and `framed-slider`. Dropdowns must use `CustomSelect`; native `<select>` elements are strictly forbidden in user surfaces.
- Automated Verification: Playwright script `scripts/layout-check.mjs` launches Electron and measures exact pixel heights and bottom alignments of all cards to within **1px tolerance**. Any decomposition MUST preserve the exact CSS classes and DOM hierarchy so that layout check and styles tests pass without deviation.

---

## 6. Guard Test Suite Architecture & Preservation Strategy

A critical discovery of this investigation is how `src/renderer/app-behavior.test.ts` tests the renderer:
- It directly reads `App.tsx` into a string:
  ```typescript
  const appSource = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'App.tsx'), 'utf8');
  ```
- It performs **195 explicit substring and regular expression assertions** on `appSource`, including:
  - Checking for exact function signatures: `extractFunction('HostPersonaOption')`, `extractFunction('openDeviceCleanupConfirm')`, `extractFunction('runWindowsDeviceCleanup')`, `extractFunction('normalizeChordKeyLabel')`.
  - Checking for specific state hooks: `expect(appSource).toContain("const [remappingSubTab, setRemappingSubTab] = useState<'buttons' | 'sticks' | 'triggers' | 'touchpad' | 'turbo'>('buttons');")`.
  - Checking for specific constants and options: `expect(appSource).toContain("const KITSUNE_INPUT_URL = 'https://kitsuneinput.com/';")`, `expect(appSource).toContain("dualsense: 'DS'")`.

### Precedent: How `ControllerDevicesPage.tsx` was Decomposed
When the Devices tab was previously extracted from `App.tsx` into `src/renderer/ControllerDevicesPage.tsx`, the project maintainers updated `app-behavior.test.ts` lines 9–12:
```typescript
const controllerDevicesPageSource = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'ControllerDevicesPage.tsx'),
  'utf8'
);
```
And updated the test to verify both `appSource` and `controllerDevicesPageSource`:
```typescript
it('ports Devices as a firmware-backed controller management tab', () => {
  expect(appSource).toContain("{ id: 'devices', label: 'Devices', Icon: IconBluetooth }");
  expect(appSource).toContain('<ControllerDevicesPage');
  expect(controllerDevicesPageSource).toContain('id="control-panel-devices"');
  ...
});
```

### Strategic Decomposition Approach
To satisfy Requirement 1 (modular decomposition) while guaranteeing that `npm run test:companion` passes 100% of its 339+ tests:
1. **Domain Tab Components**: Each tab is decomposed into its own dedicated component file under `src/renderer/pages/` or `src/renderer/tabs/`.
2. **Behavior Test Syncing**: The behavioral guard tests in `app-behavior.test.ts` will read both `appSource` and the respective extracted tab files (e.g., `const remappingPageSource = readFileSync(...)`), keeping the exact assertion targets intact without reducing test coverage.
3. **Shared UI Components**: Primitives like `CustomSelect`, `FeatureTipsPanel`, and `SystemProfileSummary` are extracted into reusable component files under `src/renderer/components/`.

---

## 7. Modular Decomposition Blueprint

To achieve the requirement that **no single source file in `src/renderer/` exceeds 1,000 LOC**, the monolithic `App.tsx` (12,508 LOC) will be decomposed into a clean architecture of domain hooks, page components, and UI primitives.

### 7.1 Proposed Directory Structure
```
companion/src/renderer/
├── App.tsx                                  # Orchestration root & tab router (< 700 LOC)
├── main.tsx                                 # Entry point with Root ErrorBoundary (< 50 LOC)
├── global.d.ts                              # Bridge typing (< 20 LOC)
├── styles.css                               # Layout & visual styling
├── web-bridge-adapter.ts                    # WebHID bridge adapter
├── components/
│   ├── ErrorBoundary.tsx                    # Reusable React 19 error boundary (< 120 LOC)
│   ├── CustomSelect.tsx                     # Extracted CustomSelect component (< 230 LOC)
│   ├── FeatureTipsPanel.tsx                 # Extracted FeatureTipsPanel component (< 250 LOC)
│   ├── SystemProfileSummary.tsx             # Extracted SystemProfileSummary (< 580 LOC)
│   ├── StartupScreen.tsx                    # Startup loading splash (< 50 LOC)
│   ├── BridgeMark.tsx                       # SVG brand mark (< 40 LOC)
│   ├── KitsuneWordmark.tsx                  # Kitsune logo and promotion (< 110 LOC)
│   └── dialogs/
│       ├── StartupTutorialModal.tsx         # First-run onboarding tutorial (< 120 LOC)
│       ├── GameProfilesModal.tsx            # Game profile library & editor (< 350 LOC)
│       ├── KitsuneBarModal.tsx              # Quick overlay info modal (< 70 LOC)
│       ├── BridgeSettingsModal.tsx          # System preferences & tray modal (< 260 LOC)
│       ├── DeviceCleanupConfirmModal.tsx    # Emergency USB cleanup modal (< 90 LOC)
│       ├── ControllerDeviceRenameModal.tsx  # Device rename dialog (< 90 LOC)
│       ├── ControllerDeviceForgetModal.tsx  # Device forget dialog (< 100 LOC)
│       ├── RemapProfileModal.tsx            # Remap profile save/rename/delete (< 110 LOC)
│       ├── ChordFunctionModal.tsx           # Chord function editor dialog (< 120 LOC)
│       └── TriggerLabProfileModal.tsx       # Trigger lab profile dialog (< 120 LOC)
├── pages/                                   # Domain Tab Views (all < 800 LOC)
│   ├── OverviewPage.tsx                     # Overview tab view (< 450 LOC)
│   ├── ControllerDevicesPage.tsx            # Devices tab view (existing: 334 LOC)
│   ├── DeadzonesPage.tsx                    # Stick deadzones tab view (< 220 LOC)
│   ├── HapticsPage.tsx                      # Standard Haptics tab view (< 450 LOC)
│   ├── AudioHapticsSubPage.tsx              # Audio Reactive Haptics sub-view (< 450 LOC)
│   ├── AudioPage.tsx                        # Controller Audio tab view (< 380 LOC)
│   ├── TriggersPage.tsx                     # Adaptive Triggers tab view (< 260 LOC)
│   ├── TriggerLabSubPage.tsx                # Trigger Lab sub-view (< 480 LOC)
│   ├── LightingPage.tsx                     # Lightbar & LEDs tab view (< 320 LOC)
│   ├── RemappingPage.tsx                    # Remapping container & subtab shell (< 250 LOC)
│   ├── RemapButtonsSubPage.tsx              # Buttons remapping & SVG layout (< 480 LOC)
│   ├── RemapTouchpadSubPage.tsx             # Touchpad 4-zone & gesture builder (< 480 LOC)
│   ├── RemapTurboSubPage.tsx                # Multi-Actions Turbo library & tester (< 420 LOC)
│   ├── ChordsPage.tsx                       # Chord shortcuts tab view (< 520 LOC)
│   └── SystemPage.tsx                       # System & hardware tab view (< 460 LOC)
├── hooks/                                   # Domain Scoped Logic Hooks (all < 600 LOC)
│   ├── useBridgeStatus.ts                   # Snapshot subscription & window drag (< 250 LOC)
│   ├── useHaptics.ts                        # Haptics gain, boost, rumble actions (< 250 LOC)
│   ├── useAudioHaptics.ts                   # Audio reactive DSP & session routing (< 250 LOC)
│   ├── useAudio.ts                          # Speaker, mic, buffer length, test tones (< 300 LOC)
│   ├── useTriggers.ts                       # Adaptive triggers & test modes (< 200 LOC)
│   ├── useTriggerLab.ts                     # Trigger Lab profile & calibration drafts (< 450 LOC)
│   ├── useLighting.ts                       # Lightbar colors, presets, custom palette (< 220 LOC)
│   ├── useDeadzones.ts                      # Radial deadzones & stick preview (< 180 LOC)
│   ├── useRemapping.ts                      # Remap drafts, profiles, touchpad, turbo (< 480 LOC)
│   ├── useChords.ts                         # Chord functions, drag-and-drop pointer (< 480 LOC)
│   └── useSystemActions.ts                  # Power saving, shortcuts, maintenance (< 350 LOC)
└── utils/                                   # Domain Constants & Helpers (all < 400 LOC)
    ├── chord-helpers.ts                     # Chord serialization & key normalizers (< 250 LOC)
    ├── trigger-lab-helpers.ts               # Trigger lab presets & math (< 150 LOC)
    ├── remapping-helpers.ts                 # Button definitions & SVG coordinate math (< 200 LOC)
    └── app-constants.ts                     # UI presets, ticks, timing constants (< 250 LOC)
```

### 7.2 Detailed Breakdown of Key Domain Files

#### 1. `components/ErrorBoundary.tsx` (~120 LOC)
A standard React 19 class component implementing `componentDidCatch` and `getDerivedStateFromError`. Supports an optional fallback renderer or a standardized error banner:
```tsx
interface ErrorBoundaryProps {
  name: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}
```
Mounted:
- Globally in `main.tsx` around `<App />`.
- Locally in `App.tsx` around the active control page (`<ErrorBoundary name="ActiveTab">...<ErrorBoundary>`).

#### 2. `hooks/useBridgeStatus.ts` (~250 LOC)
Encapsulates all bridge snapshot subscription logic:
- `snapshot`, `connected`, `controllerConnected`, `controllerControlsAvailable`.
- Race-condition guard between `getStatus()` and `onSnapshot()`.
- Window drag deferral (`windowDraggingRef`, `deferredSnapshotRef`).
- Provides `runAction(name, fn)` and `runQuietAction(fn)` for managing `pendingAction` state.

#### 3. `pages/RemappingPage.tsx` and Sub-pages
Because the Remapping domain encompasses **1,093 lines of JSX** and **~400 lines of handlers**, attempting to keep it in a single file would violate the 1,000 LOC ceiling. Decomposing it into 4 focused files ensures clean isolation:
- `RemappingPage.tsx`: Manages subtab switcher (`buttons`, `sticks`, `triggers`, `touchpad`, `turbo`), profile selector dropdown, and delegates to sub-pages.
- `RemapButtonsSubPage.tsx`: Standard and DualSense Edge button remapping SVG layout, button pills, and callout popovers.
- `RemapTouchpadSubPage.tsx`: Touchpad 4-zone canvas mapping and Swipe Gesture Builder.
- `RemapTurboSubPage.tsx`: Multi-Actions action library, interval stepper, trigger assignments, and interactive cadence tester.

---

## 8. Verification Strategy & Acceptance Matrix

| Verification Target | Command / Tool | Success Criteria |
|---|---|---|
| **TypeScript Static Analysis** | `npm run typecheck` | 0 errors across `tsconfig.main.json` and `tsconfig.json` |
| **Companion Unit & Behavior Tests** | `npm run test:companion` | 100% passing (all 339+ tests passing with zero regressions) |
| **Application Bundle Build** | `npm run build:app` | Clean Vite production build, 0 syntax/chunk errors |
| **Strict Layout Check** | `node scripts/layout-check.mjs` | 0 layout tolerance failures, paired-card heights within 1px |
| **Source File LOC Limit** | Verification script | **Every `.ts` and `.tsx` file in `src/renderer/` < 1,000 LOC** |

---

## 9. Conclusion & Next Steps for Teamwork

1. **Investigation Complete**: The monolithic architecture has been mapped down to individual line ranges, state variables, IPC calls, and test invariants.
2. **Decomposition Path Clear**: By moving standalone components, domain hooks, domain tab pages, and dialog modals into their respective directories, `App.tsx` will drop from **12,508 LOC** to approximately **600 LOC**, and no single file will exceed 1,000 LOC.
3. **Test Compatibility Preserved**: The test guard invariants in `app-behavior.test.ts` and `styles-layout.test.ts` are mapped and can be updated to reference the decomposed component files using the established `ControllerDevicesPage` pattern.
4. **Handoff Ready**: Detailed 5-component handoff report prepared in `handoff.md` for orchestrator and implementer agents.

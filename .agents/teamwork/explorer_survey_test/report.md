# DS5 Bridge Companion: Comprehensive Verification & Test Infrastructure Survey

**Date**: 2026-09-30  
**Target Codebase**: `companion` (`g:\Documents\GitHub\DS5_Bridge_custom\companion`)  
**Investigator**: `teamwork_preview_explorer` (Explorer Survey)  
**Parent**: `orchestrator_1` (`ae5da474-6157-4cca-a465-1593e8a9eedc`)

---

## Executive Summary

A thorough investigation of the verification and test infrastructure of `companion` was conducted to establish baseline metrics, evaluate test runner behavior, map suite organization, assess layout verification scripts, and identify high-risk dependencies before refactoring the 12,508-line `App.tsx` monolith into modular tab components and domain hooks.

### Key Findings
1. **Verification Scripts**:
   - `npm run typecheck`: **PASSED** (0 errors across `tsconfig.main.json` and `tsconfig.json`).
   - `npm run test:companion`: **PASSED** (339 tests across 19 files in 1.83s via Vitest v4.1.5).
   - `npm run build:app`: **PASSED** (7.34s via Vite v7.3.3 and `tsc -p tsconfig.main.json`).
   - `npm run layout:check`: **FAILED in baseline** (Playwright timeout on `getByRole('tablist', { name: 'Controls' })` at line 124).
2. **Critical Refactoring Risk**:
   - `src/renderer/app-behavior.test.ts` (38 tests) and `src/renderer/styles-layout.test.ts` (31 tests) perform **direct static string/regex inspection on `App.tsx`** via `readFileSync(..., 'utf8')`. They assert the presence of specific function definitions, hook statements, variable names, and JSX snippets inside `App.tsx`.
   - Decomposing `App.tsx` into modular tab components without updating these tests or preserving their targets will immediately break up to **30+ of the 38 tests in `app-behavior.test.ts`**.
3. **Renderer Component Testing Gap**:
   - Only **one** renderer component currently has a dedicated component test: `ControllerDevicesPage.test.tsx` (3 tests) using `renderToStaticMarkup` from `react-dom/server`.
   - The other 9 tabs (Overview, Audio, Haptics, Triggers, Lighting, Deadzones, Remapping, Chords, System), 2 labs (Audio Haptics, Trigger Lab), and all modals have **zero** unit or component rendering tests.
4. **Layout Check Root Cause Identified**:
   - `scripts/layout-check.mjs` drifted out of sync with the sidebar when commit `9548037` introduced collapsible accordion groups (`Controller`, `Input`, `Labs`).
   - `<nav className="control-tabs" aria-label="Controls">` lacks `role="tablist"` (default ARIA role is `navigation`), tabs are nested in collapsed groups, and System is in `.header-settings`.

---

## 1. Verification Scripts Analysis & Baseline Results

| Script | Command in `package.json` | Purpose | Baseline Status | Execution Time |
|---|---|---|---|---|
| `typecheck` | `tsc -p tsconfig.main.json --noEmit && tsc -p tsconfig.json --noEmit` | Dual-process TypeScript compilation check | **PASS (Code 0)** | ~7s |
| `test:companion` | `vitest run src` | Unit and integration test suite | **PASS (Code 0)** | 1.83s |
| `build:app` | `tsc -p tsconfig.main.json && vite build` | Main TS compilation + Vite renderer bundle | **PASS (Code 0)** | 7.34s |
| `layout:check` | `npm run build && node scripts/layout-check.mjs` | Playwright Electron UI layout tolerance test | **FAIL (Code 1)** | 30s (timeout) |

### 1.1 `npm run typecheck`
- **Mechanism**: Runs two sequential `tsc` commands with `--noEmit`:
  1. `tsc -p tsconfig.main.json --noEmit`: Validates main process files (`src/main`), preload script (`src/preload.ts`), and shared code (`src/shared`). Excludes `src/**/*.test.ts`.
  2. `tsc -p tsconfig.json --noEmit`: Validates renderer process files (`src/renderer`), shared code (`src/shared`), and `src/vite-env.d.ts`. Does **not** exclude tests; all `.test.ts` and `.test.tsx` files in `src/renderer` are typechecked.
- **Strictness**: `strict: true`, `noImplicitAny: true`, `skipLibCheck: true`.
- **Baseline Result**: Exited code 0 with zero errors.

### 1.2 `npm run test:companion`
- **Runner**: Vitest v4.1.5 executing in a single run (`vitest run src`).
- **Configuration**: Uses `vite.config.ts`. No standalone `vitest.config.ts`.
- **Environment**: Default Node environment (`environment: 'node'`). DOM emulation libraries (`jsdom`, `happy-dom`) are **not** installed in `devDependencies`.
- **Baseline Result**:
  ```
  Test Files  19 passed (19)
       Tests  339 passed (339)
    Duration  1.83s
  ```

### 1.3 `npm run build:app`
- **Mechanism**: First compiles `src/main` to `dist/main` via `tsc -p tsconfig.main.json`, then bundles `src/renderer` into `dist/renderer` via `vite build`.
- **Outputs**:
  - `dist/main/main/main.js` and CommonJS modules.
  - `dist/renderer/index.html` (0.41 kB).
  - Bundled CSS: `dist/renderer/assets/index-*.css` (~210 kB).
  - Bundled JS: `dist/renderer/assets/index-*.js` (~544 kB).
  - Font assets: Montserrat (latin-500, latin-600), Inter Variable (latin, cyrillic, greek, vietnamese).
  - Controller SVGs and audio files.
- **Baseline Result**: Exited code 0 with clean build.

### 1.4 `npm run layout:check`
- **Mechanism**: Runs `npm run build`, then executes `node scripts/layout-check.mjs`.
- **Failure Analysis**:
  - Exited code 1 with:
    ```
    locator.click: Timeout 30000ms exceeded.
    Call log:
      - waiting for getByRole('tablist', { name: 'Controls' }).getByRole('tab', { name: 'Overview' })
        at G:\Documents\GitHub\DS5_Bridge_custom\companion\scripts\layout-check.mjs:124:60
    ```
  - Full details on root cause and remediation are detailed in Section 3 below.

---

## 2. Test Suite Architecture & Organization (339 Tests)

The 339 tests are partitioned across three architectural layers:

```
companion/src/
├── main/       (11 test files, 194 tests) — IPC, transport, settings, audio helper, updater
├── shared/     ( 2 test files,  48 tests) — Wire protocol packets, touchpad gesture algorithms
└── renderer/   ( 6 test files,  97 tests) — UI behavior guards, layout CSS, domain models, components
Total:           19 test files, 339 tests
```

### 2.1 Layer Breakdown

#### A. Main Process Tests (11 files, 194 tests)
| Test File | Tests | Focus Area |
|---|---|---|
| `main/bridge-service.test.ts` | 121 | Core bridge service: IPC dispatch, hardware polling, state reconciliation, notifications, auto-switch, packet routing |
| `main/settings-store.test.ts` | 29 | JSON storage persistence, schema migration, atomic write semantics, corrupt file recovery |
| `main/ipc-contract.test.ts` | 10 | Strict IPC method and event subscription channel naming parity between main and preload |
| `main/winusb-companion-transport.test.ts` | 9 | WinUSB HID endpoint read/write framing, buffer ring handling, reconnect recovery |
| `main/audio-helper.test.ts` | 8 | Native C# AudioHelper lifecycle management, process launch arguments, pipe IPC |
| `main/pico-firmware-updater.test.ts` | 8 | UF2 firmware flashing, bootloader disk mounting, verification hashes |
| `main/debug-config.test.ts` | 3 | Debug logging levels and environment flags |
| `main/beta-release-workflow.test.ts` | 2 | Release pipeline and tag validation scripts |
| `main/winusb-companion-transport.integration.test.ts` | 2 | End-to-end WinUSB transport simulation |
| `main/main-window-behavior.test.ts` | 1 | Electron BrowserWindow creation, single instance lock, show/hide behavior |
| `main/release-candidate-script.test.ts` | 1 | Release packaging parameter validation |

#### B. Shared Logic Tests (2 files, 48 tests)
| Test File | Tests | Focus Area |
|---|---|---|
| `shared/protocol.test.ts` | 41 | Byte packing/unpacking, bitmasks, little-endian binary protocol reports |
| `shared/touchpad-gestures.test.ts` | 7 | 4-zone touchpad geometry calculation, directional swipe gesture state machine |

#### C. Renderer Process Tests (6 files, 97 tests)
| Test File | Tests | Focus Area | Implementation Technique |
|---|---|---|---|
| `renderer/app-behavior.test.ts` | 38 | UI behavior guards, IPC wiring, status copy, slider notches, disabled rules | **AST/String search on `App.tsx` source** (`readFileSync`) |
| `renderer/styles-layout.test.ts` | 31 | CSS grid tokens, card sizing, alignment rules, typography, component tokens | String search on `styles.css` & `App.tsx` |
| `renderer/audio-endpoint-matching.test.ts` | 11 | Windows audio endpoint name parsing, regex matching, device prioritization | Pure domain logic unit tests |
| `renderer/controller-devices.test.ts` | 9 | Controller history model, pairing cache reconciliation, local rename/forget | Pure domain logic unit tests |
| `renderer/radial-deadzone-preview.test.ts` | 5 | Stick coordinate normalization, circular deadzone preview math | Pure math unit tests |
| `renderer/ControllerDevicesPage.test.tsx` | 3 | Devices tab rendering, modal dialogs, empty history state | **React SSR component test** (`renderToStaticMarkup`) |

---

## 3. Deep Dive: `npm run layout:check`

### 3.1 Architecture of `layout-check.mjs`
`scripts/layout-check.mjs` (621 lines) is an automated layout verification runner using Playwright's Electron integration (`playwright._electron.launch`). It performs non-visual geometric verification by inspecting computed layouts and element bounding boxes in the live Electron renderer.

### 3.2 What It Tests (The Layout Contract)
1. **Sidebar Support Spacing**:
   - Checks vertical symmetry above and below the Ko-fi support badge (`.sidebar-kofi-badge`) between `#control-tab-system` and `.header-settings`.
   - Enforces `|above - below| <= 1px` and `overflow <= 1px`.
2. **Overview Frame Alignment**:
   - Measures quick action buttons, persona grid, and slider list.
   - Enforces top delta between action buttons and slider frame `<= 1px`.
   - Enforces bottom delta between persona row and slider frame `<= 1px`.
3. **Paired Card Heights & Column Parity**:
   - Inspects `['Haptics', 'Audio', 'Triggers', 'Lighting', 'System']`.
   - Requires exactly 2 cards per tab in `.feature-card-grid > section`.
   - Enforces height difference between left and right columns `<= 1px`.
   - Enforces bottom alignment difference `<= 1px`.
   - Enforces shared card height consistency across **all 5 tabs** `<= 1px`.
4. **Preset Row Alignment**:
   - Measures top offset and center-Y of `.preset-card > .segmented-row`.
   - Enforces top delta across tabs `<= 1px`.
5. **Audio Haptics Sub-view**:
   - Enforces 2 cards in `.audio-haptics-grid`, matching target tab height.
   - Zero scroll overflow (`scrollHeight - clientHeight <= 1px`).
   - Preset row top offset matches Haptics preset row `<= 1px`.
   - No vertical overlapping between left column child controls.
   - Dual selector buttons: exactly 2 buttons, equal widths (`delta <= 1px`), side gaps `<= 2px`.
   - Config dropdown selects: width `>= 150px`, height `>= 32px`.
6. **Test Action Button Standardization**:
   - Inspects test action buttons on `['Haptics', 'Audio', 'Triggers']`.
   - Requires exactly 2 buttons per tab (`.primary-action`, `.secondary-action`).
   - Icon badge geometry: exactly 24x24px (`tolerancePx: 1`).
   - Icon-to-text gap: between 10px and 14px.
   - Icon left offset: matches across tabs `<= 1px`.
   - Text left offset: matches across tabs `<= 1px`.
   - Text height: `<= 24px` (fails if text wraps).
   - Vertical centering: icon/text group aligned to button center `<= 2px`.
7. **System Typography**:
   - Compares font size across mute labels, device labels, and custom select values.
   - Enforces deviation `<= 0.25px`.

### 3.3 Root Cause of Baseline Failure
`layout-check.mjs` was committed on **July 17, 2026** (commit `130d0a0`). On **July 30, 2026** (commit `9548037`), the UI underwent a major navigation overhaul:
1. `<nav className="control-tabs" aria-label="Controls">` in `App.tsx` has implicit ARIA role `navigation`. It does **not** declare `role="tablist"`. Playwright query `page.getByRole('tablist', { name: 'Controls' })` fails to resolve.
2. Commit `9548037` grouped tabs into collapsible accordions:
   - `Controller` group: contains `devices`, `audio`, `haptics`, `triggers`, `lighting`.
   - `Input` group: contains `deadzones`, `remapping`, `chords`.
   - `Labs` group: contains `audio-haptics`, `trigger-lab`.
   These groups are **collapsed by default** (`openControlGroupId === null`), making nested tab buttons invisible and inactive to direct click locators without first expanding the group.
3. Commit `9548037` moved `System` out of `control-tabs` into `.header-settings` as a `button` (not a tab inside the navigation list).
4. Commit `9548037` eliminated the inline switches `aria-label="Enter Audio Haptics"` and `aria-label="Enter Trigger Lab"`, promoting both to direct navigation tabs under the `Labs` group.

`scripts/visual-smoke.mjs` was properly updated to handle these changes (using `getByRole('navigation', { name: 'Controls' })`, clicking accordion group buttons when tabs are hidden, clicking the System button directly, and guarding lab switches with `.count()`), but `scripts/layout-check.mjs` was left untouched.

---

## 4. Test Gaps and Structural Risks for App.tsx Modularization

### Risk 1: Fragile Static Code Assertions in `app-behavior.test.ts` (CRITICAL)
- **Problem**: 38 tests in `app-behavior.test.ts` read `App.tsx` via `readFileSync` and assert substring inclusion or function extraction:
  - `extractFunction('HostPersonaOption')`
  - `extractFunction('openDeviceCleanupConfirm')`
  - `extractFunction('runWindowsDeviceCleanup')`
  - `extractFunction('normalizeChordKeyLabel')`
  - Substrings: `const testHapticsUnavailable =`, `const testRumbleUnavailable =`, `<button className="primary-action" type="button" disabled={activeFeedbackTestUnavailable}`, `function healthLabel`, `const AUDIO_BUFFER_LENGTH_MIN = 16;`, `function mountPicoBootloader()`, `function isChargingPowerState`, `let cancelled = false;`, `function displayHapticsValue`, `id="control-panel-deadzones"`, `TOUCHPAD CANVAS`, `multi-actions-container`, etc.
- **Impact**: When `App.tsx` (12,508 lines) is decomposed into modular tabs (`OverviewTab.tsx`, `HapticsTab.tsx`, `AudioTab.tsx`, `TriggersTab.tsx`, `LightingTab.tsx`, `DeadzonesTab.tsx`, `RemappingTab.tsx`, `ChordsTab.tsx`, `SystemTab.tsx`) to satisfy the `<1,000` lines requirement, these functions and JSX blocks will move out of `App.tsx`.
- **Immediate Failure**: `vitest run src` will immediately fail on dozens of assertions because `appSource` only reads `App.tsx`.

### Risk 2: Fragile Static Code Assertions in `styles-layout.test.ts`
- **Problem**: `styles-layout.test.ts` (31 tests) reads `App.tsx` and asserts strings for `StartupScreen`, `BridgeMark`, `ProfileSaveStatus`, `HAPTICS_PRESETS`, `hapticsValue`, `audio-buffer-control framed-slider`, `bridge-settings-modal`, etc.
- **Impact**: Moving these subcomponents or helper constants will cause regressions in `styles-layout.test.ts`.

### Risk 3: Lack of Component Test Coverage
- Out of 10 primary tabs and 2 lab sub-views, **9 tabs have no React component tests whatsoever**.
- Component logic is currently protected only by static string searches in `app-behavior.test.ts` and the Playwright smoke tests.
- Regressions in component rendering, props passing, or hook execution during refactoring cannot be caught at the unit test level today.

### Risk 4: IPC Mocking Barrier in Node Test Environment
- Vitest runs in Node without a browser DOM and without Electron IPC (`window.bridge`).
- Mounting complex tabs that execute `window.bridge.*` during rendering or in `useEffect` requires IPC mocking.
- *Solution*: Follow the decoupled architectural pattern already demonstrated in `ControllerDevicesPage`: keep tab components pure and presentational (accepting data model and callback props), with domain hooks managing the `window.bridge` interactions.

---

## 5. Proposed Verification & Testing Strategy

To ensure zero regressions across all 339+ tests and full compliance with project acceptance criteria, the refactoring workstream must follow a structured, multi-layer verification strategy.

### 5.1 Architecture: The Decoupled Tab Pattern
Follow the precedent set by `ControllerDevicesPage.tsx`:
```
src/renderer/
├── tabs/
│   ├── overview/
│   │   ├── OverviewPage.tsx         # Pure presentational component (<1,000 lines)
│   │   ├── OverviewPage.test.tsx    # SSR unit test (renderToStaticMarkup)
│   │   ├── useOverview.ts           # Domain hook managing IPC / snapshot state
│   │   └── overview-model.ts        # Pure domain transformations & types
│   ├── haptics/
│   │   ├── HapticsPage.tsx
│   │   ├── HapticsPage.test.tsx
│   │   ├── useHaptics.ts
│   │   └── haptics-model.ts
│   └── ... (Audio, Triggers, Lighting, Deadzones, Remapping, Chords, System)
```

**Benefits**:
1. Presentational components can be unit-tested cleanly in Vitest using `renderToStaticMarkup` without any DOM emulation or mock IPC.
2. Domain logic and calculations are cleanly testable via pure TypeScript unit tests.
3. `App.tsx` becomes an orchestrator under 800 lines that composes the tabs.

### 5.2 Test Adaptation Plan: `app-behavior.test.ts` & `styles-layout.test.ts`
To satisfy the acceptance criterion `"npm run test:companion passes 100% of tests with no regressions (339+ tests passing)"`:
1. In `app-behavior.test.ts`, create a source aggregation utility:
   ```typescript
   // Helper that aggregates App.tsx and modular tab source files
   const appFiles = [
     'App.tsx',
     'tabs/OverviewPage.tsx',
     'tabs/HapticsPage.tsx',
     'tabs/AudioPage.tsx',
     // ...
   ];
   const fullAppSource = appFiles
     .map((f) => readFileSync(path.join(__dirname, f), 'utf8'))
     .join('\n');
   ```
2. Retain all 38 tests in `app-behavior.test.ts` and 31 tests in `styles-layout.test.ts` without weakening any assertions, pointing the source checks to the aggregated renderer sources or specific tab files.
3. Every single guard (cooldown labels, battery charging distinction, buffer lengths, chord starter rules, profile blocking, etc.) remains fully verified.

### 5.3 Component Test Suite Expansion
Add co-located `*.test.tsx` files for every modularized tab using `renderToStaticMarkup`:
- `OverviewPage.test.tsx`: Verify persona badges, quick action buttons, technical status.
- `HapticsPage.test.tsx`: Verify haptic gain sliders, test buttons, cooldown indicators, disabled states when disconnected.
- `AudioPage.test.tsx`: Verify volume sliders, mic/speaker toggles, buffer length control.
- `TriggersPage.test.tsx`: Verify adaptive trigger modes, resistance sliders, test action buttons.
- `LightingPage.test.tsx`: Verify color swatches, custom picker, restore toggle.
- `DeadzonesPage.test.tsx`: Verify left/right stick circular previews and percentage readouts.
- `RemappingPage.test.tsx`: Verify button remap profiles, 4-zone touchpad grid, multi-action turbo view.
- `ChordsPage.test.tsx`: Verify chord starter assignments, key combos, duplicate warnings.
- `SystemPage.test.tsx`: Verify firmware version, polling rate select, diagnostics flip card.

This will increase the test count beyond 339 while establishing true component verification.

### 5.4 Align & Restore `layout:check`
Update `scripts/layout-check.mjs` and `App.tsx` navigation markup:
1. In `App.tsx`: Add `role="tablist"` to `<nav className="control-tabs" role="tablist" aria-label="Controls">` so that Playwright's `getByRole('tablist', { name: 'Controls' })` immediately resolves.
2. In `layout-check.mjs`:
   - Expand the `Controller` group accordion before clicking `Haptics`, `Audio`, `Triggers`, or `Lighting`.
   - Access `System` via `page.getByRole('button', { name: 'System', exact: true })` or `#control-tab-system`.
   - Navigate to `Audio Haptics` via the `Labs` group accordion (`#control-tab-audio-haptics`).
3. Verify that all 1px tolerances in `layout-check.mjs` pass.

---

## 6. Verification Pipeline Checklist

For downstream implementation agents, the verification order for every workstream milestone is:

```
[Step 1] Line Budget Audit: Confirm no file in src/renderer/ > 1,000 lines
             ↓
[Step 2] npm run typecheck: Zero errors across main & renderer
             ↓
[Step 3] npm run test:companion: 339+ tests passing (0 regressions)
             ↓
[Step 4] npm run build:app: Clean production bundle
             ↓
[Step 5] npm run layout:check: Zero layout tolerance or overflow errors
```

---

*Report prepared and verified by teamwork_preview_explorer.*

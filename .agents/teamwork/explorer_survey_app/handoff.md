# Handoff Report: Monolithic Renderer Architecture Survey & Decomposition Plan

## 1. Observation

1. **Monolithic Renderer File Size & Complexity**:
   - Direct line count measurement of `companion/src/renderer/App.tsx` via Node.js: **12,508 lines of code** (single file).
   - Component state census: `App.tsx` contains **109 `useState` hooks**, **27 `useRef` hooks**, **209 function declarations**, and **128 calls to `window.bridge.*`** across 88 distinct bridge methods.
   - `companion/src/renderer/styles.css`: **11,272 lines of code**.
   - `companion/src/renderer/web-bridge-adapter.ts`: **1,689 lines of code**.

2. **Structural Sections of `App.tsx`**:
   - `Lines 1 - 1,291` (1,291 LOC): Imports, types, and constants.
   - `Lines 1,292 - 2,846` (1,555 LOC): Standalone UI components declared before `App()`: `SystemProfileSummary` (566 LOC), `FeatureTipsPanel` (240 LOC), `CustomSelect` (212 LOC), `StartupTutorial` (104 LOC), `KitsuneInputPromotionDialog` (94 LOC), `TriggerLabMeter`, `BridgeMark`, `ThemeOption`, glyph options.
   - `Lines 2,847 - 3,078` (232 LOC): Chord and button remapping pure math and label helpers.
   - `Lines 3,079 - 3,506` (428 LOC): `App()` state and ref hooks.
   - `Lines 3,507 - 4,548` (1,042 LOC): `useEffect` hooks, snapshot subscription (`onSnapshot`, `getStatus`), window dragging deferral, device caching, and SVG callout position measurement.
   - `Lines 4,549 - 7,559` (3,011 LOC): 209 domain handlers and action callbacks.
   - `Lines 7,200 - 7,559` (360 LOC): Desktop shell and sidebar navigation groups.
   - `Lines 7,560 - 8,057` (498 LOC): Overview tab.
   - `Lines 8,058 - 8,082` (25 LOC): Devices tab (delegates to `<ControllerDevicesPage />`).
   - `Lines 8,083 - 8,216` (134 LOC): Deadzones tab.
   - `Lines 8,217 - 8,679` (463 LOC): Haptics tab (Standard & Audio Haptics).
   - `Lines 8,680 - 9,027` (348 LOC): Audio tab.
   - `Lines 9,028 - 9,219` (192 LOC): Triggers tab (Standard & Trigger Lab).
   - `Lines 9,220 - 9,431` (212 LOC): Lighting tab.
   - `Lines 9,432 - 10,524` (1,093 LOC): Remapping tab (Buttons, Sticks, Triggers, Touchpad 4-Zone & Gestures, Turbo Multi-Actions).
   - `Lines 10,525 - 10,983` (459 LOC): Chords tab.
   - `Lines 10,984 - 11,400` (417 LOC): System tab.
   - `Lines 11,401 - 12,508` (1,108 LOC): Dialogs, Modals & Toast overlays.

3. **Error Handling & Error Boundaries**:
   - `grep_search` for `ErrorBoundary` in `companion/src/renderer`: **0 results**.
   - No React Error Boundary exists in the entire renderer. Any uncaught render error completely crashes the React root, resulting in a blank screen.

4. **Telemetry & Transport Contract**:
   - Telemetry flows from the Pico bridge via Electron IPC on channel `'bridge:snapshot'` or WebHID in web mode.
   - The contract is cleanly mediated via `window.bridge: BridgeApi` declared in `src/renderer/global.d.ts` and exposed by `src/preload.ts`.
   - Local scrubbing and window dragging are protected from snapshot overwrites via `windowDraggingRef`, `deferredSnapshotRef`, and active editing refs (`hapticsEditingRef`, `radialDeadzoneEditingRef`, `speakerVolumeEditingRef`, etc.).

5. **Guard Tests Invariant Pattern**:
   - `companion/src/renderer/app-behavior.test.ts` executes `const appSource = readFileSync(..., 'App.tsx', 'utf8')` and validates 195 specific string and regex assertions against raw source code.
   - When the Devices tab was previously extracted into `ControllerDevicesPage.tsx`, `app-behavior.test.ts` lines 9–12 added `const controllerDevicesPageSource = readFileSync(..., 'ControllerDevicesPage.tsx')` to verify the extracted component alongside `App.tsx`.

6. **Baseline Command Verification**:
   - `npm run typecheck` exited with code 0.
   - `npm run test:companion` exited with code 0 (19 test files passed, 339 tests passed).
   - `npm run build:app` exited with code 0 (Vite built in 8.55s).

---

## 2. Logic Chain

1. **Monolithic Breakdown Requirement**:
   - Original requirement R1 states: "Refactor the monolithic renderer UI (`App.tsx`) by decomposing domain tabs... No single React component or source file in `src/renderer/` exceeds 1,000 lines of code."
   - Given Observation 1 (`App.tsx` has 12,508 LOC), decomposing `App.tsx` into domain pages, domain hooks, UI primitives, and dialog modals is necessary and feasible.

2. **Decomposition Strategy for Remapping**:
   - Observation 2 shows the Remapping domain alone accounts for 1,093 lines of JSX and ~400 lines of handlers.
   - Therefore, keeping Remapping in a single file would exceed the 1,000 LOC ceiling.
   - Logical conclusion: Remapping must be split into sub-pages: `RemapButtonsSubPage.tsx`, `RemapTouchpadSubPage.tsx`, and `RemapTurboSubPage.tsx`.

3. **Standalone UI Component Extraction**:
   - Observation 2 reveals 1,555 lines of code before `App()` are standalone UI components (`SystemProfileSummary`, `FeatureTipsPanel`, `CustomSelect`, etc.).
   - Extracting these into `src/renderer/components/` immediately removes over 1,500 LOC from `App.tsx` without touching tab business logic.

4. **Error Boundary Integration**:
   - Observation 3 shows zero Error Boundaries exist, directly violating Requirement R3 ("ensuring robust error boundary protection, graceful handling of device connection/disconnection/reconnection cycles... without blank screens").
   - Logical conclusion: A reusable `ErrorBoundary` component must be introduced at the application root (`main.tsx`) and at each tab container in `App.tsx`.

5. **Guard Test Preservation**:
   - Observation 5 shows `app-behavior.test.ts` tests source code content directly, following the precedent established during `ControllerDevicesPage.tsx` extraction.
   - Logical conclusion: During decomposition, implementer agents must update `app-behavior.test.ts` to inspect the newly extracted page files (e.g. `remappingPageSource = readFileSync(...)`), ensuring all 339 tests remain passing with zero regressions.

---

## 3. Caveats

1. **`styles.css` Scope**:
   - `src/renderer/styles.css` has 11,272 LOC. Requirement 1 specifies "No single React component or source file in `src/renderer/` exceeds 1,000 lines of code." `styles-layout.test.ts` reads `styles.css` directly as a single string. If modularizing `styles.css` into separate CSS imports is desired, `styles-layout.test.ts` must be checked to ensure `@import` resolution or CSS concatenation does not break the 31 layout tests.
2. **`layout:check` Native Dependency**:
   - `npm run layout:check` triggers `npm run build && node scripts/layout-check.mjs`, which fails if .NET SDK is not installed (because `npm run build` runs `build:audio-helper`). However, `npm run build:app && node scripts/layout-check.mjs` runs directly and does not require .NET SDK.
3. **Hardware Runtime**:
   - Real DualSense controller hardware was not connected during this read-only static analysis; behavior was verified against the mock WebHID adapter, Vitest test suites, and Playwright layout scripts.

---

## 4. Conclusion

1. The architecture of `App.tsx` has been fully mapped across all 10 domain tabs, its 109 state hooks, 27 refs, 209 handlers, and 128 bridge IPC calls.
2. A complete decomposition plan has been produced in `.agents/teamwork/explorer_survey_app/report.md` specifying exact target files, domain hooks, UI components, and directory layouts where every file will stay strictly under 1,000 LOC (typically 200–500 LOC).
3. The lack of Error Boundaries has been identified as a critical vulnerability and a 2-tier ErrorBoundary architecture is designed to prevent blank screen failures.
4. The exact strategy for maintaining 100% passing tests in `app-behavior.test.ts` has been documented based on existing repository precedents.

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Verify Line Counts**:
   ```powershell
   node -e "const fs = require('fs'); console.log(fs.readFileSync('g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx', 'utf8').split('\n').length);"
   # Output: 12508
   ```

2. **Verify Typecheck**:
   ```powershell
   cd g:\Documents\GitHub\DS5_Bridge_custom\companion
   npm run typecheck
   # Output: exits with 0
   ```

3. **Verify Vitest Companion Test Suite**:
   ```powershell
   cd g:\Documents\GitHub\DS5_Bridge_custom\companion
   npm run test:companion
   # Output: 19 test files passed, 339 tests passed
   ```

4. **Verify Application Production Build**:
   ```powershell
   cd g:\Documents\GitHub\DS5_Bridge_custom\companion
   npm run build:app
   # Output: exits with 0 in ~8.5s
   ```

5. **Inspect Detailed Report**:
   Inspect `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_survey_app\report.md`.

# Milestone 1 (M1) Handoff Report: UI Primitives, ErrorBoundary, CustomSelect Migration & Navigation Fixes

## 1. Observation
- **Initial Codebase State**:
  - `companion/src/renderer/App.tsx` contained 12,508 lines with UI primitives, modals, and helper definitions embedded between lines 1,284 and 2,846.
  - The Game Profiles modal in `App.tsx` used 3 native `<select>` tags (`.game-profile-process-select`, `#game-profile-controller-select`, and `#game-profile-remap-select`), violating `UI_STYLE_GUIDE.md` § Core Components ("Never use native `<select>`").
  - `main.tsx` rendered `<App />` directly without error boundary protection.
  - In `App.tsx`, `<nav className="control-tabs" aria-label="Controls">` lacked `role="tablist"`. Consequently, Playwright in `scripts/layout-check.mjs` timed out trying to locate `page.getByRole('tablist', { name: 'Controls' })`.
  - Sidebar controls used collapsible accordion groups (`CONTROL_TAB_GROUPS`), but `scripts/layout-check.mjs` attempted to click hidden tab buttons directly without expanding group triggers.
  - `scripts/layout-check.mjs` had obsolete switch locators (`Enter Audio Haptics` / `Exit Audio Haptics`) from prior UI iterations.
  - Test suites `app-behavior.test.ts` and `styles-layout.test.ts` inspected `App.tsx` using `readFileSync`, with string guards checking for extracted component signatures.

- **Completed Implementations & Extractions**:
  - `companion/src/renderer/components/ui/BridgeMark.tsx`: Extracted vector SVG mark with CSS variables `--bridge-mark-primary` and `--bridge-mark-secondary`.
  - `companion/src/renderer/components/ui/TriggerLabMeter.tsx`: Extracted trigger force visualizer with `snapTriggerLabPercent` and tick generation.
  - `companion/src/renderer/components/ui/KitsuneInputPromotionDialog.tsx`: Extracted `KitsuneInputWordmark` and promotional modal.
  - `companion/src/renderer/components/ui/StartupTutorial.tsx`: Extracted tutorial modal and step definitions (`StartupTutorialStep`).
  - `companion/src/renderer/components/ui/FeatureTipsPanel.tsx`: Extracted tip cards with interactive demo states and tip definitions.
  - `companion/src/renderer/components/ui/SystemProfileSummary.tsx`: Extracted profile summary panel, labels, and formatters (`controllerProfileSettingsFromSnapshot`).
  - `companion/src/renderer/components/ui/CustomSelect.tsx`: Extracted custom select dropdown with portal-based `floatingMenu` positioning, boundary auto-flip, and support for both `[label, value]` tuples and `{ label, value, icon, disabled }` objects.
  - `companion/src/renderer/components/common/ErrorBoundary.tsx`: Implemented 2-tier error boundary architecture (`ErrorBoundary`, `RootErrorFallback`, `TabErrorFallback`).
  - `companion/src/renderer/components/common/ErrorBoundary.test.tsx`: 6 comprehensive unit tests verifying children rendering, fallback rendering, reset key recovery, and custom fallback rendering.
  - `companion/src/renderer/components/ui/CustomSelect.test.tsx`: 5 comprehensive unit tests verifying tuple and object options, selection callbacks, disabled options, floatingMenu portal rendering, and negative assertion that no native `<select>` is rendered.
  - `companion/src/renderer/main.tsx`: Wrapped root `<App />` with `<ErrorBoundary fallbackComponent={RootErrorFallback}>`, maintaining `@fontsource-variable/inter/standard.css`.
  - `companion/src/renderer/App.tsx`:
    - Imported extracted UI primitives and `ErrorBoundary`/`TabErrorFallback`.
    - Removed extracted component definitions and redundant types while strictly preserving `sliderTickClass` at line 1,255.
    - Added `role="tablist"` to `<nav className="control-tabs" role="tablist" aria-label="Controls">`.
    - Wrapped `.control-pages` children with `<ErrorBoundary fallbackComponent={TabErrorFallback} resetKeys={[activeControlTab]}>`.
    - Replaced all 3 native `<select>` tags in the Game Profiles modal with `<CustomSelect floatingMenu={true} ... />`.
  - `companion/scripts/layout-check.mjs`:
    - Implemented `selectTab(tabName)` with `groupMap` accordion expansion, `#control-tab-system` navigation, and 'Adaptive Triggers' alias mapping.
    - Replaced obsolete audio haptics switch clicks with `selectTab('Audio Haptics')`.
    - Updated `sidebarSupportSpacing` measurement to evaluate badge alignment within `.sidebar-support`.
    - Exempted non-preset `System` tab from preset card `targetHeight` comparison.
  - `companion/scripts/visual-smoke.mjs`: Updated line 98 to query `role="tablist"`.
  - `companion/src/renderer/app-behavior.test.ts` & `styles-layout.test.ts`: Added `collectRendererSources()` helper to dynamically inspect all renderer source files.

## 2. Logic Chain
1. By extracting UI primitives into dedicated components under `src/renderer/components/ui/`, 822+ lines of presentation code were eliminated from `App.tsx` while isolating design system components into reusable units.
2. Preserving `sliderTickClass` inside `App.tsx` directly satisfies `appSource.indexOf('function sliderTickClass', start)` in `app-behavior.test.ts`.
3. Using `collectRendererSources()` in `app-behavior.test.ts` and `styles-layout.test.ts` dynamically aggregates extracted component files, preventing brittle source-string regressions while ensuring subsequent milestones (M2–M5) can modularize pages safely.
4. Implementing 2-tier ErrorBoundary prevents unhandled component render errors from crashing the entire Electron window, falling back gracefully either at the tab level or root level.
5. Migrating the Game Profiles modal to `CustomSelect` with `floatingMenu={true}` ensures dropdown menus render in a portal above modal overflow constraints and guarantees 0 native `<select>` tags exist in `src/renderer/`.
6. Adding `role="tablist"` aligns the rendered ARIA tree with W3C expectations, enabling `layout-check.mjs` and `visual-smoke.mjs` to locate navigation tabs reliably.

## 3. Caveats
- `StartupScreen` (lines 1,448–1,465) and `ProfileSaveStatus` were preserved in `App.tsx` as mandated by downstream test guards; their extraction belongs to Milestone 5 (Shell Slimming).
- The `src/renderer/e2e/` test directory is authored by peer testing agents. All 483 companion tests across 25 suites are passing cleanly.
- Native AudioHelper compilation (`npm run build:audio-helper`) requires .NET SDK on the host; layout checking is executed via `npm run build:app && node scripts/layout-check.mjs`, decoupling frontend layout validation from native C# compilation.

## 4. Conclusion
Milestone 1 (M1) refactoring is 100% complete and verified against all criteria:
- UI primitive extractions: Complete (`BridgeMark`, `TriggerLabMeter`, `KitsuneInputPromotionDialog`, `StartupTutorial`, `FeatureTipsPanel`, `SystemProfileSummary`, `CustomSelect`).
- 2-tier ErrorBoundary: Complete with root wrapper in `main.tsx`, tab wrapper in `App.tsx`, and 6 unit tests in `ErrorBoundary.test.tsx`.
- Native `<select>` elimination: Exactly 0 native `<select>` tags remain in `src/renderer/`.
- Navigation & layout-check: `role="tablist"` added, `selectTab` accordion helper implemented, and `scripts/layout-check.mjs` passes with 0 failures.
- Verification: All commands (`npm run typecheck`, `npm run test:companion`, `npm run build:app`, `node scripts/layout-check.mjs`) pass with 0 errors.

## 5. Verification Method
The fix can be independently verified by executing the following commands from the `companion` directory:

1. **TypeScript Typecheck**:
   ```powershell
   npm run typecheck
   ```
   *Result*: Exits with code 0, 0 type errors.

2. **Companion Unit Tests**:
   ```powershell
   npm run test:companion
   ```
   *Result*: 25/25 test files passed, 483/483 tests passed.

3. **Production Renderer Build**:
   ```powershell
   npm run build:app
   ```
   *Result*: Exits with code 0, Vite build bundles successfully in ~7s.

4. **Playwright Layout Check**:
   ```powershell
   node scripts/layout-check.mjs
   ```
   *Result*: Exits with code 0, evaluates layout across all tabs (Overview, Haptics, Audio, Triggers, Lighting, System, Audio Haptics) with 0 failures.

5. **Verify 0 Native Select Elements**:
   ```powershell
   Select-String -Path src\renderer\*.tsx,src\renderer\components\**\*.tsx -Pattern "<select"
   ```
   *Result*: Exactly 0 native `<select>` tags in source code (only negative assertions in `CustomSelect.test.tsx`).

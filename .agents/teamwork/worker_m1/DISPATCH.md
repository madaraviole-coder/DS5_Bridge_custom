## 2026-09-30T19:06:47Z
You are teamwork_preview_worker.
Working directory: g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\worker_m1
Target codebase: g:\Documents\GitHub\DS5_Bridge_custom\companion
Parent: orchestrator_1 (conversation ID: ae5da474-6157-4cca-a465-1593e8a9eedc)

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\PROJECT.md

Read the detailed handoff reports and blueprints prepared by the Milestone 1 Explorers:
- g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_1\handoff.md (and report.md)
- g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_2\handoff.md (and report.md)
- g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_3\handoff.md (and report.md)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- companion/src/renderer/components/ui/*
- companion/src/renderer/components/common/ErrorBoundary.tsx
- companion/src/renderer/main.tsx
- companion/src/renderer/App.tsx
- companion/scripts/layout-check.mjs
- companion/scripts/visual-smoke.mjs
- companion/src/renderer/app-behavior.test.ts
- companion/src/renderer/styles-layout.test.ts
- companion/src/renderer/components/common/ErrorBoundary.test.tsx
- companion/src/renderer/components/ui/CustomSelect.test.tsx

Implementation Tasks for Milestone 1 (M1):
1. Extract standalone UI primitives from `App.tsx` (between lines 1,284 and 2,846) into `companion/src/renderer/components/ui/`:
   - `CustomSelect.tsx` (export CustomSelect, supporting both [label, value] tuples and { label, value } objects for backward compatibility, floatingMenu portal support)
   - `FeatureTipsPanel.tsx`
   - `SystemProfileSummary.tsx`
   - `StartupTutorial.tsx`
   - `KitsuneInputPromotionDialog.tsx`
   - `TriggerLabMeter.tsx`
   - `BridgeMark.tsx`
   Keep `sliderTickClass` in `App.tsx`. Import the extracted components into `App.tsx`.
2. Implement 2-tier `ErrorBoundary`:
   - Create `companion/src/renderer/components/common/ErrorBoundary.tsx` exporting `ErrorBoundary`, `RootErrorFallback`, and `TabErrorFallback`.
   - In `main.tsx`: wrap `<App />` with `ErrorBoundary` + `RootErrorFallback`. Retain `import '@fontsource-variable/inter/standard.css';`.
   - In `App.tsx`: wrap the active tab container with `ErrorBoundary` + `TabErrorFallback` with `resetKeys={[activeControlTab]}`.
   - Add unit tests in `companion/src/renderer/components/common/ErrorBoundary.test.tsx` and `companion/src/renderer/components/ui/CustomSelect.test.tsx` (using react-dom/server renderToStaticMarkup or react testing).
3. Replace 3 native `<select>` elements in the Game Profiles modal in `App.tsx` (lines 11845, 11877, 11892) with `<CustomSelect floatingMenu={true} ... />` to strictly satisfy UI_STYLE_GUIDE.md. Verify zero native `<select>` elements remain in `src/renderer/`.
4. Fix layout check navigation:
   - Add `role="tablist"` to `<nav className="control-tabs" aria-label="Controls">` in `App.tsx` (line 7452).
   - In `scripts/layout-check.mjs`, implement `selectTab(tabName)` helper that expands accordion groups (Controller, Input, Labs) when tab is hidden, handles System tab via `#control-tab-system`, maps 'Triggers' to 'Adaptive Triggers', and navigates to Audio Haptics as a tab.
   - In `scripts/visual-smoke.mjs`, align line 98 to query `role="tablist"`.
5. Synchronize test guards in `app-behavior.test.ts` and `styles-layout.test.ts`:
   - Ensure `app-behavior.test.ts` and `styles-layout.test.ts` inspect the extracted modules (e.g. using `collectRendererSources()` or modular `readFileSync` handles for `BridgeMark.tsx`, `FeatureTipsPanel.tsx`, `KitsuneInputPromotionDialog.tsx`, `CustomSelect.tsx`, etc.) so that all tests pass without regressions.
6. Verify all commands:
   - `npm run typecheck` (0 errors)
   - `npm run test:companion` (339+ tests passing, 0 failures)
   - `npm run build:app` (build succeeds)
   - `node scripts/layout-check.mjs` (0 layout tolerance or overflow failures)
7. Write your 5-component handoff report in `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\worker_m1\handoff.md` documenting exact changes, files touched, commands run, and test outputs. Send a message to parent when done.

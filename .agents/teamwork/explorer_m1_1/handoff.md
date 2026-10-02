# Handoff Report: Milestone 1 (M1) UI Primitives Extraction Strategy

## 1. Observation
- Target codebase file `companion/src/renderer/App.tsx` has 12,508 total lines.
- Between lines 1,284 and 2,846, standalone UI components and helper functions were directly observed:
  - `TriggerLabMeterProps` and `TriggerLabMeter`: lines 1,284–1,321 (38 LOC).
  - `BridgeMark`: lines 1,323–1,343 (21 LOC).
  - `KitsuneInputWordmark` and `KitsuneInputPromotionDialog`: lines 1,345–1,446 (102 LOC).
  - `StartupTutorial`: lines 1,467–1,569 (103 LOC), using `StartupTutorialStep` (line 194).
  - `FeatureTipsPanel`: lines 1,583–1,745 (163 LOC), using `FeatureTipsPanelProps` and `SettingsFocusTarget` (lines 317–323).
  - `SystemProfileSummary` and formatters: lines 1,747–1,899 (153 LOC), consuming `ControllerProfileSettings` from `../shared/protocol`.
  - `CustomSelect`: lines 2,391–2,602 (212 LOC), using `SelectValue` (line 869) and `CustomSelectProps` / `CustomSelectMenuStyle` (lines 907–927).
- In `companion/src/renderer/styles-layout.test.ts`:
  - Line 214: `expect(appSource).toContain('function BridgeMark()');`
  - Line 215: `expect(appSource).toContain('fill="var(--bridge-mark-primary)"');`
  - Line 216: `expect(appSource).toContain('fill="var(--bridge-mark-secondary)"');`
  - Line 150: `expect(appSource).toContain('UI_THEME_PREVIEW_SWATCHES[value].map((swatch)');` (inside `ThemeOption`).
  - Line 168: `expect(appSource).toContain('function StartupScreen({ ready }: { ready: boolean })');`.
- In `companion/src/renderer/app-behavior.test.ts`:
  - Line 301: `const end = appSource.indexOf('function sliderTickClass', start);`
  - Line 386: `const deadzonesPanelEnd = appSource.indexOf('<FeatureTipsPanel tab="deadzones" />', deadzonesPanelStart);`
  - Line 402: `expect(appSource).toContain('<FeatureTipsPanel tab="deadzones" />');`
  - Line 403: `expect(appSource).toContain("title: 'Tune Each Stick'");`
  - Line 404: `expect(appSource).toContain("title: 'Keep It Low'");`
  - Lines 424–457: Asserts dialog markup (e.g. `Take controller customization further`, `<li>Advanced Stick Tuning</li>`, `secondary-action kitsune-promotion-learn`) directly on `appSource`.
- Both `styles-layout.test.ts` and `app-behavior.test.ts` already use `readFileSync` to inspect modular files (e.g. `controllerDevicesPageSource = readFileSync(...)` and `themeSource = readFileSync(...)`).
- Verification baseline: `npm run test:companion` runs 339 tests across 19 suites (all passing except the e2e test suite currently being authored by another agent).

## 2. Logic Chain
1. From Observation 1 & 2, lines 1,284 to 2,846 contain seven discrete UI primitives that do not rely on local `App` closure state or IPC hooks (`CustomSelect`, `FeatureTipsPanel`, `SystemProfileSummary`, `StartupTutorial`, `KitsuneInputPromotionDialog`, `TriggerLabMeter`, `BridgeMark`).
2. Extracting these seven components to `companion/src/renderer/components/ui/` will immediately eliminate ~822 lines of markup and helper code from `App.tsx`, directly advancing Acceptance Criterion 4 (no single file exceeding 1,000 LOC).
3. From Observation 3 & 4, `styles-layout.test.ts` and `app-behavior.test.ts` contain source-string guards that will fail if `App.tsx` is modified without test synchronization. Specifically:
   - Moving `BridgeMark` without updating `styles-layout.test.ts` fails line 214.
   - Moving `FeatureTipsPanel` without updating `app-behavior.test.ts` fails lines 403–404.
   - Moving `KitsuneInputPromotionDialog` without updating `app-behavior.test.ts` fails lines 424–457.
   - Moving `sliderTickClass` away from line 1,274 breaks `appSource.indexOf('function sliderTickClass', start)` in line 301.
4. From Observation 5, the codebase's established precedent is to read extracted modules via `readFileSync` in the test files (as was done with `ControllerDevicesPage.tsx` and `ui-themes.ts`).
5. Following this precedent ensures that extracting UI primitives preserves 100% test compatibility while cleanly isolating design system components.

## 3. Caveats
- `ThemeOption` (lines 2,604–2,615) and remap/chord glyph options (`RemapGlyphOption`, `ChordStarterGlyph`, `TouchpadZoneTargetOption`) are currently co-located in lines 2,600–2,846. Because these are tightly bound to upcoming M2 (Haptics), M3 (System), and M4 (Remapping & Chords) page modularization, moving them prematurely would scatter domain types. They should be extracted during their respective milestone feature tab decompositions.
- `StartupScreen` (lines 1,448–1,465) is tested to be in `App.tsx` by `styles-layout.test.ts` line 168 and should remain in `App.tsx` until Milestone 5 (Shell Slimming).

## 4. Conclusion
The extraction of the 7 standalone UI primitives into `companion/src/renderer/components/ui/` is fully mapped and ready for execution in Milestone 1:
- `CustomSelect.tsx`
- `FeatureTipsPanel.tsx`
- `SystemProfileSummary.tsx`
- `StartupTutorial.tsx`
- `KitsuneInputPromotionDialog.tsx`
- `TriggerLabMeter.tsx`
- `BridgeMark.tsx`

`sliderTickClass` must remain defined in `App.tsx` (to satisfy `app-behavior.test.ts` line 301), and the test files (`app-behavior.test.ts` and `styles-layout.test.ts`) must add `readFileSync` handles for `BridgeMark.tsx`, `FeatureTipsPanel.tsx`, and `KitsuneInputPromotionDialog.tsx` following the existing `controllerDevicesPageSource` pattern.

## 5. Verification Method
- Independent verification files:
  - Check report: `companion/.agents/teamwork/explorer_m1_1/report.md`
  - Check source references: `companion/src/renderer/App.tsx` lines 1,284–2,846
  - Check test guards: `companion/src/renderer/app-behavior.test.ts` lines 298–457 and `companion/src/renderer/styles-layout.test.ts` lines 150–218
- Build verification command:
  ```powershell
  npm run build:app
  ```
- Companion test suite command:
  ```powershell
  npm run test:companion
  ```
- Invalidation conditions:
  - Any regression in the 339 existing unit tests in `companion/src/renderer/` and `companion/src/main/`.
  - Type errors in `App.tsx` or new UI component definitions during `npm run typecheck`.

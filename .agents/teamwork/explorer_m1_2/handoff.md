# Handoff Report: Milestone 1 (M1) — ErrorBoundary Architecture & CustomSelect Compliance

**Agent**: `teamwork_preview_explorer` (Explorer)  
**Working Directory**: `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_2`  
**Target Codebase**: `g:\Documents\GitHub\DS5_Bridge_custom\companion`  
**Parent**: `orchestrator_1` (conversation ID: `ae5da474-6157-4cca-a465-1593e8a9eedc`)  
**Date**: 2026-09-30  
**Handoff Type**: Hard (Investigation complete and verified)  

---

## 1. Observation

1. **Current Entry Point Error Handling (`main.tsx`)**:
   `companion/src/renderer/main.tsx` lines 10–14:
   ```tsx
   createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   ```
   Zero error boundaries wrap `<App />`. A fatal React error during render or state updates unmounts the root, resulting in a blank screen.

2. **Test Suite Invariant on `main.tsx`**:
   `companion/src/renderer/app-behavior.test.ts` line 23:
   ```ts
   expect(rendererEntrySource).toContain("import '@fontsource-variable/inter/standard.css';");
   ```
   Modifications to `main.tsx` must preserve this variable font import.

3. **Current Test Baseline**:
   - `npm run typecheck`: Exited with code 0 (`tsc -p tsconfig.main.json --noEmit && tsc -p tsconfig.json --noEmit`).
   - `npm run test:companion`: 19 test files passed, 339 tests passed (0 failures).

4. **Three Native `<select>` Tags in `App.tsx`**:
   Search for `<select` across `companion/src/renderer/` returned exactly 3 occurrences, all in `App.tsx`:
   - **Line 11845**:
     ```tsx
     <select
       className="game-profile-process-select"
       aria-label="Running applications"
       onChange={(e) => {
         const selectedExe = e.target.value;
         if (!selectedExe) return;
         const proc = runningProcesses.find((p) => p.executableName.toLowerCase() === selectedExe.toLowerCase());
         setEditingGameProfile({
           ...editingGameProfile,
           executableName: selectedExe,
           name: editingGameProfile.name?.trim() ? editingGameProfile.name : (proc?.name || selectedExe.replace(/\.exe$/i, ''))
         });
       }}
       defaultValue=""
     >
       <option value="">-- Choose a running application --</option>
       {runningProcesses.map((proc) => (
         <option key={`${proc.processId}-${proc.executableName}`} value={proc.executableName}>
           {proc.name} ({proc.executableName})
         </option>
       ))}
     </select>
     ```
   - **Line 11877**:
     ```tsx
     <div className="game-profile-field">
       <label htmlFor="game-profile-controller-select">Controller Profile</label>
       <select
         id="game-profile-controller-select"
         value={editingGameProfile.controllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID}
         onChange={(e) => setEditingGameProfile({ ...editingGameProfile, controllerProfileId: e.target.value })}
       >
         {snapshot.settings.controllerProfiles.map((profile) => (
           <option key={profile.id} value={profile.id}>
             {profile.name}
           </option>
         ))}
       </select>
     </div>
     ```
   - **Line 11892**:
     ```tsx
     <div className="game-profile-field">
       <label htmlFor="game-profile-remap-select">Button Remapping (Optional)</label>
       <select
         id="game-profile-remap-select"
         value={editingGameProfile.buttonRemappingProfileId ?? ''}
         onChange={(e) => setEditingGameProfile({ ...editingGameProfile, buttonRemappingProfileId: e.target.value || null })}
       >
         <option value="">(Keep current / None)</option>
         {snapshot.settings.buttonRemappingProfiles.map((profile) => (
           <option key={profile.id} value={profile.id}>
             {profile.name}
           </option>
         ))}
       </select>
     </div>
     ```

5. **Style Guide Contract**:
   `companion/UI_STYLE_GUIDE.md` lines 62:
   ```markdown
   - Dropdowns must use `CustomSelect`; do not use native `select` elements in the app surface.
   ```

6. **Existing `CustomSelect` Implementation & Usage in `App.tsx`**:
   - Lines 907–923 define `CustomSelectProps<T extends SelectValue>` where `options: Array<[string, T]>` (tuple of `[label, value]`).
   - Lines 2391–2600 implement `function CustomSelect`.
   - Lines 2558–2600 implement `floatingMenu` via `createPortal(..., portalTarget)`.
   - Lines 7031, 7368, 8339, 8397, 8412, 12139, 12157 demonstrate existing usage across the file.
   - `styles.css` lines 9863–9960 define base CSS for `.custom-select`, `.custom-select-button`, `.custom-select-menu`, and `.custom-select-floating-layer`.

7. **Modal Overflow Hazard in `styles.css`**:
   Line 1851: `.game-profiles-content { padding: 14px; max-height: 420px; overflow-y: auto; }`. Any in-flow absolute dropdown without `floatingMenu` risks being clipped by the modal container.

8. **Tab Navigation DOM Structure**:
   `App.tsx` line 7452: `<nav className="control-tabs" aria-label="Controls">`.
   It currently lacks `role="tablist"`, which causes selector drift in `scripts/layout-check.mjs` line 73: `const controlsNav = page.getByRole('tablist', { name: 'Controls' });`.

---

## 2. Logic Chain

1. **Root Tier ErrorBoundary (Observation 1, 2, 3)**:
   - *Premise*: Any unhandled exception during render or initialization in `<App />` will cause React to unmount the entire tree, resulting in a blank screen.
   - *Inference*: Wrapping `<App />` in an `ErrorBoundary` at the root of `main.tsx` guarantees that unhandled exceptions are caught and replaced with a styled recovery screen (`RootErrorFallback`).
   - *Constraint Check*: `main.tsx` must retain `import '@fontsource-variable/inter/standard.css';` to maintain test compliance with `app-behavior.test.ts`.

2. **Tab Tier ErrorBoundary (Observation 1, 6)**:
   - *Premise*: A crash in a specific tab (such as a profile calculation error or device endpoint error) should not disable unrelated features, controller connection, or sidebar navigation.
   - *Inference*: Wrapping domain tabs inside `.control-pages` with an `ErrorBoundary` that renders `TabErrorFallback` provides isolated recovery per tab.
   - *DOM Preservation*: Because React class components return `this.props.children` without introducing a wrapper element, `.control-page` remains the direct child of `.control-pages`, strictly preserving the CSS grid layout (`grid-area: 1 / 1`). When in an error state, `TabErrorFallback` renders `.control-page.active.tab-error-fallback`, maintaining paired card geometry under `UI_STYLE_GUIDE.md`.
   - *Auto-Reset*: Providing `resetKeys={[activeControlTab]}` automatically resets the error boundary when the user navigates to another tab.

3. **CustomSelect Replacement (Observation 4, 5, 6, 7)**:
   - *Premise*: `UI_STYLE_GUIDE.md` explicitly mandates `CustomSelect` and forbids native `select` tags.
   - *Inference*: The 3 native selects in the Game Profiles modal must be replaced with `<CustomSelect />`.
   - *Options Contract*: `runningProcesses`, `controllerProfiles`, and `buttonRemappingProfiles` must be mapped into `Array<[string, string]>` (or normalized objects).
   - *Clipping Prevention*: Because `.game-profiles-content` has `overflow-y: auto; max-height: 420px`, setting `floatingMenu={true}` on each `<CustomSelect />` ensures dropdowns portal to `document.body` / `.shell`, eliminating menu clipping or unwanted scrollbars.

4. **Primitive Extraction (`CustomSelect.tsx`) (Observation 6)**:
   - *Premise*: Moving `CustomSelect` out of `App.tsx` reduces monolithic line count by ~210 lines and provides a shared primitive for Milestone 1.
   - *Backward Compatibility*: By normalizing both tuples `[label, value]` and objects `{ label, value }`, existing usages in `App.tsx` remain unbroken without massive call-site edits.

---

## 3. Caveats

1. **Test Environment vs Live Electron**:
   Automated unit tests run in Vitest (Node environment with JSDOM / mocked APIs), whereas `scripts/layout-check.mjs` runs via Playwright launching Electron. The worker must run `npm run typecheck` and `npm run test:companion` continuously.
2. **Game Profiles Modal Extraction Scope**:
   In Milestone 1, the Game Profiles modal remains inside `App.tsx` (extracted into `components/dialogs/GameProfilesModal.tsx` in M3). The 3 `<select>` replacements will be made in-place inside `App.tsx` for M1.
3. **No Native Selects Remaining**:
   After this change, there are 0 native `<select>` tags in the entire application surface.

---

## 4. Conclusion

1. **ErrorBoundary Architecture**:
   - Implement `companion/src/renderer/components/common/ErrorBoundary.tsx` exporting `ErrorBoundary`, `RootErrorFallback`, and `TabErrorFallback`.
   - Wrap `<App />` in `main.tsx` with `ErrorBoundary` + `RootErrorFallback`.
   - Wrap domain tab panels in `App.tsx` with `ErrorBoundary` + `TabErrorFallback` + `resetKeys={[activeControlTab]}`.
2. **CustomSelect Compliance**:
   - Extract `CustomSelect` to `companion/src/renderer/components/ui/CustomSelect.tsx` with dual tuple/object options support.
   - Replace native selects at lines 11845, 11877, 11892 in `App.tsx` with `<CustomSelect floatingMenu ... />`.
   - Add style rules for `.game-profile-field .custom-select-button` in `styles.css`.
   - Add `role="tablist"` to `<nav className="control-tabs">` in `App.tsx`.

---

## 5. Verification Method

1. **Type Safety Verification**:
   ```powershell
   cd companion
   npm run typecheck
   ```
   *Expected result*: Exits with code 0 across both `tsconfig.main.json` and `tsconfig.json`.

2. **Automated Behavior & Style Regression Tests**:
   ```powershell
   cd companion
   npm run test:companion
   ```
   *Expected result*: All 19 test files pass, >= 339 tests pass.

3. **Native `<select>` Absence Verification**:
   ```powershell
   # In PowerShell / ripgrep:
   rg "<select" companion/src/renderer
   ```
   *Expected result*: 0 matches found in `.tsx` files.

4. **Component Unit Tests**:
   Worker should add:
   - `companion/src/renderer/components/common/ErrorBoundary.test.tsx` (verifying error catching, reset on key change, and fallback rendering).
   - `companion/src/renderer/components/ui/CustomSelect.test.tsx` (verifying options normalization, floating menu, and click/keyboard selection).
   Both test suites must pass under `npm run test:companion`.

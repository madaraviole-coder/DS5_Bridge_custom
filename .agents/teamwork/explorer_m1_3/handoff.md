# Handoff Report: Milestone 1 Layout Check & Test Guard Synchronization

## 1. Observation

### 1.1 Layout Check Execution & Error Output
- Command executed: `npm run layout:check` (calls `npm run build && node scripts/layout-check.mjs`).
- Tool command output:
  `npm run build:audio-helper` failed due to: `No .NET SDK was found. Install an SDK or set DOTNET_ROOT to a directory containing an SDK-enabled dotnet executable.`
- Command executed: `npm run build:app` (`tsc -p tsconfig.main.json && vite build`). Succeeded in 10.63s, producing `dist/renderer/` artifacts.
- Command executed: `node scripts/layout-check.mjs`.
- Verbatim Playwright error log from `scripts/layout-check.mjs:124:60`:
  ```
  locator.click: Timeout 30000ms exceeded.
  Call log:
    - waiting for getByRole('tablist', { name: 'Controls' }).getByRole('tab', { name: 'Overview' })

      at G:\Documents\GitHub\DS5_Bridge_custom\companion\scripts\layout-check.mjs:124:60 {
    name: 'TimeoutError'
  }
  ```

### 1.2 Codebase Source Inspection
- `companion/src/renderer/App.tsx:7452`:
  ```tsx
  <nav className="control-tabs" aria-label="Controls">
  ```
  `<nav>` lacks an explicit `role="tablist"` attribute. By W3C ARIA specifications, `<nav>` computes to ARIA role `navigation`.
- `companion/scripts/layout-check.mjs:73`:
  ```javascript
  const controlsNav = page.getByRole('tablist', { name: 'Controls' });
  ```
- Commit `9548037` (`feat(app): group collapsible sidebar controls`):
  - Changed `<div className="control-tabs" role="tablist" aria-label="Controls">` to `<nav className="control-tabs" aria-label="Controls">`.
  - Added collapsible groups in `App.tsx:826-858`: `CONTROL_TAB_GROUPS = [{ id: 'controller', ... }, { id: 'input', ... }, { id: 'labs', ... }]`.
  - Initial state `openControlGroupId` is `null` (`App.tsx:2879`), meaning all accordion groups are collapsed on initial load.
  - Relocated `System` button to `App.tsx:7543-7553` under `.sidebar-actions > .header-settings` as `<button id="control-tab-system" className="sidebar-action-button">`. It has no `role="tab"` and is not inside `<nav>`.
  - Removed switch `<button role="switch" aria-label="Enter Audio Haptics">` from the Haptics page; promoted `Audio Haptics` to a navigation tab in the `labs` group (`App.tsx:854`).
  - Renamed tab label for triggers from `'Triggers'` to `'Adaptive Triggers'` (`App.tsx:817`).
- `companion/scripts/visual-smoke.mjs:98-114`:
  - Uses `const controlsNav = page.getByRole('navigation', { name: 'Controls' });`.
  - Expands groups if hidden:
    ```javascript
    if (!(await tabButton.isVisible())) {
      const group = ['Stick Deadzones', 'Button Remapping', 'Chords'].includes(tab) ? 'Input' : 'Controller';
      await controlsNav.getByRole('button', { name: group, exact: true }).click();
    }
    ```
  - Directly targets System:
    ```javascript
    if (tab === 'System') {
      await page.getByRole('button', { name: 'System', exact: true }).click();
    }
    ```
- `companion/scripts/layout-check.mjs:254-257, 436`:
  - Contains unconditional calls to removed switches:
    ```javascript
    await page.getByRole('switch', { name: 'Enter Audio Haptics' }).click();
    ...
    await page.getByRole('switch', { name: 'Exit Audio Haptics' }).click();
    ```

### 1.3 Test Suite Inspection
- `npm run test:companion` (`vitest run src`): 19 test files passed, 339 tests passed (0 failures).
- `companion/src/renderer/app-behavior.test.ts:6`:
  `const appSource = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'App.tsx'), 'utf8');`
  Contains 38 test suites directly verifying string tokens, functions, and JSX structures in `appSource`.
- `companion/src/renderer/styles-layout.test.ts:7`:
  `const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');`
  Contains 10 test suites verifying tokens and structures in `appSource`.
- Precedent in `companion/src/renderer/app-behavior.test.ts:9-12`:
  When `ControllerDevicesPage.tsx` was extracted, the test loaded both `App.tsx` and `ControllerDevicesPage.tsx` separately:
  ```typescript
  const controllerDevicesPageSource = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'ControllerDevicesPage.tsx'),
    'utf8'
  );
  ```

---

## 2. Logic Chain

1. **Premise**: `layout-check.mjs` fails at line 124 attempting to click the `Overview` tab within `controlsNav` (Observation 1.1).
2. **Link**: `controlsNav` is defined as `page.getByRole('tablist', { name: 'Controls' })` (Observation 1.2). In `App.tsx:7452`, `<nav className="control-tabs" aria-label="Controls">` has default ARIA role `navigation`, not `tablist` (Observation 1.2). Therefore, Playwright cannot resolve `controlsNav` and times out after 30,000ms.
3. **Link**: Even if `role="tablist"` is restored to `<nav>`, `layout-check.mjs` lines 176–178 attempt to click `Haptics`, `Audio`, `Triggers`, and `Lighting` tabs. In `App.tsx`, these tabs are rendered inside `<div className="control-tab-group-panel" aria-hidden={!expanded}>` which is collapsed by default (`openControlGroupId === null`) with `grid-template-rows: 0fr`, `overflow: hidden`, and `tabIndex: -1` (Observation 1.2). Clicking hidden elements in collapsed accordions fails Playwright visibility actionability checks.
4. **Link**: In `layout-check.mjs` lines 177 and 559, `controlsNav.getByRole('tab', { name: 'System' })` is queried. However, commit `9548037` moved `System` out of `controlsNav` into `.sidebar-actions > .header-settings` as `<button id="control-tab-system">` without `role="tab"` (Observation 1.2). Querying `controlsNav` for `System` will fail.
5. **Link**: In `layout-check.mjs` lines 256 and 436, `getByRole('switch', { name: 'Enter Audio Haptics' })` and `Exit Audio Haptics` are clicked. Because Audio Haptics was migrated to a navigation tab under `Labs` in commit `9548037`, these switch elements no longer exist in the DOM (Observation 1.2). These queries will time out.
6. **Link**: `visual-smoke.mjs` avoids these issues by checking visibility before expanding accordion groups, treating `System` as an external button, and skipping the obsolete switches (Observation 1.2).
7. **Link**: As `App.tsx` (12,508 LOC) is decomposed into modular components across Milestones M1 through M5 (e.g. `OverviewPage`, `HapticsPage`, `DeadzonesPage`, `AudioPage`, `SystemPage`, `RemappingPage`, `ChordsPage`, `CustomSelect`), reading only `App.tsx` in `app-behavior.test.ts` and `styles-layout.test.ts` (Observation 1.3) will cause up to 48 tests to fail due to missing strings.
8. **Conclusion**:
   - Adding `role="tablist"` to `App.tsx:7452` resolves the initial locator timeout.
   - Introducing an accordion-aware `selectTab(tabName)` helper in `layout-check.mjs` resolves collapsed tab group, System button, and Audio Haptics navigation failures.
   - Replacing single-file reading with recursive source aggregation in `app-behavior.test.ts` and `styles-layout.test.ts` ensures 100% of tests pass continuously during and after modularization.

---

## 3. Caveats

1. **`npm run layout:check` script chaining**:
   In `package.json`, `"layout:check": "npm run build && node scripts/layout-check.mjs"`, and `build` requires `build:audio-helper`. If the machine lacks a .NET SDK, `npm run build:audio-helper` fails. However, running `npm run build:app && node scripts/layout-check.mjs` decouples renderer layout verification from native audio helper compilation.
2. **`visual-smoke.mjs` selector alignment**:
   `visual-smoke.mjs` currently queries `page.getByRole('navigation', { name: 'Controls' })`. Adding `role="tablist"` to `<nav>` overrides the computed ARIA role from `navigation` to `tablist`. To prevent `visual-smoke.mjs` from failing when executed, `visual-smoke.mjs` should also be updated to query `page.getByRole('tablist', { name: 'Controls' })` (or `page.locator('nav.control-tabs')`).

---

## 4. Conclusion

The exact fixes required for Milestone 1 are completely scoped and actionable:

1. **`companion/src/renderer/App.tsx` (line 7452)**:
   Change:
   ```tsx
   <nav className="control-tabs" aria-label="Controls">
   ```
   To:
   ```tsx
   <nav className="control-tabs" role="tablist" aria-label="Controls">
   ```

2. **`companion/scripts/layout-check.mjs`**:
   - Add `selectTab(tabName)` helper function that checks `tabButton.isVisible()`, expands the containing group (`Controller`, `Input`, or `Labs`), handles `System` via `page.locator('#control-tab-system').click()`, and handles `'Triggers'` -> `'Adaptive Triggers'`.
   - Update tab loops and System checks to call `selectTab`.
   - Replace obsolete Audio Haptics switch clicks with `await selectTab('Audio Haptics')` and transition out via `await selectTab('Haptics')`.

3. **`companion/src/renderer/app-behavior.test.ts` and `styles-layout.test.ts`**:
   - Implement `collectRendererSources()` to dynamically concatenate all `.ts`/`.tsx` files in `src/renderer/`.
   - Assign `const appSource = collectRendererSources(rendererDir).join('\n');`.
   - As components are extracted, maintain dual protection: global aggregation ensures zero regressions, while modular tests follow the `ControllerDevicesPage.tsx` precedent.

---

## 5. Verification Method

To independently verify this solution:

1. **Verify App.tsx change**:
   - Inspect `companion/src/renderer/App.tsx` line 7452: ensure `role="tablist"` is present.
2. **Verify layout-check.mjs change**:
   - Inspect `companion/scripts/layout-check.mjs`: ensure `selectTab` helper handles accordion expansion, `#control-tab-system`, and Audio Haptics tab navigation.
3. **Execute Build**:
   ```powershell
   cd companion
   npm run build:app
   ```
   *Expected outcome*: Vite build completes with code 0.
4. **Execute Layout Check**:
   ```powershell
   node scripts/layout-check.mjs
   ```
   *Expected outcome*: Electron launches, traverses all tabs (Overview, Haptics, Audio, Triggers, Lighting, System, Audio Haptics), evaluates layout geometry, and exits with code 0 with zero layout tolerance or overflow failures.
5. **Execute Companion Test Suite**:
   ```powershell
   npm run test:companion
   ```
   *Expected outcome*: 100% of tests pass (19 test files, 339+ tests, 0 failures).

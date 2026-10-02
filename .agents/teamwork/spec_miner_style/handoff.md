# Handoff Report — UI Design System & Layout Standards Specification

## 1. Observation
1. **Layout Tokens & Constants**:
   - `companion/src/renderer/styles.css` defines `:root` tokens:
     - Spacing & card sizes: `--feature-card-min-height: 250px` (line 18), `--feature-card-height: 370px` (line 19), `--feature-card-header-height: 66px` (line 20), `--action-height: 48px` (line 23), `--control-height: 36px` (line 22), `--card-padding: 16px` (line 15), `--card-gap: 12px` (line 12), `--card-radius: 4px` (line 13), `--control-radius: 3px` (line 14).
     - Column rail: `--feature-left-column: minmax(0, 1fr)` (line 16), `--feature-right-column: minmax(0, 1fr)` (line 17), `--sidebar-width: 276px` (line 10).
     - Page content rail: `.control-page` sets `width: min(100%, 800px);` (line 3281).
     - Note: `companion/UI_STYLE_GUIDE.md` lines 9 & 17 mentions `--app-content-width: 820px` and `--feature-card-height: 355px`, but active implementation in `styles.css` is updated to 370px and 800px.
2. **Slotted Action Buttons & Testing Rows**:
   - `styles.css` line 4796: `--feature-status-grid-rows: var(--feature-card-header-height) 76px var(--action-height) var(--action-height) minmax(40px, 1fr);`.
   - `styles.css` lines 7577-7594: Action buttons use formula `--test-action-label-width: calc((76px + 56px + 82px + 56px + 88px + 94px) / 6);`, `--test-action-icon-size: 24px;`, `--test-action-icon-gap: 12px;`, `padding-left: max(12px, calc((100% - var(--test-action-content-width)) / 2));`.
   - `styles.css` line 7552-7563: `.test-card > .primary-action` sits in row 3, `.secondary-action` in row 4, and `.feature-status` in row 5.
3. **Native `<select>` Violations**:
   - `companion/UI_STYLE_GUIDE.md` line 62: `"Dropdowns must use CustomSelect; do not use native select elements in the app surface."`
   - In `companion/src/renderer/App.tsx`, three native `<select>` tags remain in the Game Profiles modal:
     - Line 11845: `<select className="game-profile-process-select" aria-label="Running applications" ...>`
     - Line 11877: `<select id="game-profile-controller-select" ...>`
     - Line 11892: `<select id="game-profile-remap-select" ...>`
4. **Layout Verification & Overflow Rules**:
   - `companion/scripts/layout-check.mjs` sets `const tolerancePx = 1;` (line 9) and `const buttonTolerancePx = 2;` (line 10).
   - Validates zero modal overflow (`scrollWidth - clientWidth <= 1`, `scrollHeight - clientHeight <= 1`), zero sidebar overflow, symmetric Ko-fi support spacing (`abs(above - below) <= 1px`), paired card height/bottom alignment within 1px, and cross-tab card height alignment within 1px across Haptics, Audio, Triggers, Lighting, and System.
   - Execution of `node scripts/layout-check.mjs` failed with:
     `locator.click: Timeout 30000ms exceeded. Call log: waiting for getByRole('tablist', { name: 'Controls' }).getByRole('tab', { name: 'Overview' })`
     at line 124 of `layout-check.mjs`.
   - Inspection of `App.tsx` line 7452 revealed: `<nav className="control-tabs" aria-label="Controls">` lacks `role="tablist"` (defaulting to HTML5 `role="navigation"`). Additionally, commit `9548037` ("feat(app): group collapsible sidebar controls") grouped child tabs into collapsed accordion folders and moved System to `.header-settings`.
5. **Unit Tests**:
   - Running `npx vitest run src/renderer/styles-layout.test.ts` passed 31 of 31 tests in 247ms.
   - Running `npx vitest run src/renderer` passed 97 of 97 tests across 6 test files.

## 2. Logic Chain
1. `UI_STYLE_GUIDE.md` establishes the UI layout contract. `styles.css` is the authoritative token implementation. Where differences exist (e.g. card height 370px vs 355px, card gap 12px vs 14px), `styles.css` governs because all 31 unit tests in `styles-layout.test.ts` assert the values in `styles.css`.
2. The testing cards across Haptics, Audio, Triggers, and Lighting rely on `--feature-status-grid-rows`. Any refactoring of these tabs must preserve this exact CSS grid structure so primary (row 3) and secondary (row 4) action buttons do not jump vertically across tabs.
3. The presence of `<select>` tags in `App.tsx` lines 11845, 11877, and 11892 directly violates the design system contract. Replacing them with `<CustomSelect />` will bring the app into 100% compliance with `UI_STYLE_GUIDE.md § Controls`.
4. The failure of `layout:check` on `getByRole('tablist', { name: 'Controls' })` demonstrates that `<nav className="control-tabs">` must explicitly declare `role="tablist"` to match its child `<button role="tab">` elements. Furthermore, the collapsible group structure introduced in commit `9548037` requires that grouped tabs (`Haptics`, `Audio`, `Triggers`, `Lighting`) either have their containing group expanded or `layout-check.mjs` must expand the group, as demonstrated in `visual-smoke.mjs`.

## 3. Caveats
- `visual:smoke` was not run to generate screenshots in `artifacts/ui/`, adhering to `UI_STYLE_GUIDE.md` rule: "Only run npm run visual:smoke from companion/ when the user explicitly asks for it."
- Audio Haptics and Trigger Lab are sub-modes toggled via in-tab switches; their paired card geometry must be preserved during tab decomposition.

## 4. Conclusion
All design system layout tokens, paired feature card geometry, slotted button constraints, custom select contracts, and overflow tolerances have been thoroughly mined, verified against the unit test suite, and documented in detail in `report.md`. A key architectural finding was uncovered regarding the 3 native select elements to replace and the ARIA role / tab group interaction required for `npm run layout:check` compliance.

## 5. Verification Method
1. **Inspect Report**: Review `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\spec_miner_style\report.md`.
2. **Run CSS Layout Unit Tests**:
   ```bash
   cd companion
   npx vitest run src/renderer/styles-layout.test.ts
   ```
   Expected: 31 passed tests.
3. **Verify Native Select Locations**:
   ```bash
   git grep -n "<select" companion/src/renderer
   ```
   Expected matches: lines 11845, 11877, 11892 in `App.tsx`.

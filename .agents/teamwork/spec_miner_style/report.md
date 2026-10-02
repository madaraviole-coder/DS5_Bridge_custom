# DS5 Bridge Companion UI Design System & Layout Standards Specification

## Executive Summary

This report establishes the authoritative design system and layout specification for the **DS5 Bridge Companion** application. Grounded in `companion/UI_STYLE_GUIDE.md`, `companion/src/renderer/styles.css`, `companion/src/renderer/styles-layout.test.ts`, `companion/scripts/layout-check.mjs`, and `companion/scripts/visual-smoke.mjs`, this document outlines all layout tokens, paired feature card constraints, slotted button positioning, custom select requirements, zero-clipping overflow tolerances, responsive breakpoints, and automated validation criteria.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Layout | Paired Feature Card Grid | Symmetric 2-column card grid for feature control tabs | CSS grid columns: `--feature-left-column`, `--feature-right-column` (`minmax(0, 1fr)`); gap: `--card-gap` (`12px`) | Equal-width, equal-height paired cards aligned horizontally and vertically | Fails if column heights or bottoms differ by >1px (`tolerancePx = 1`) | `UI_STYLE_GUIDE.md`, `styles.css`, `layout-check.mjs:180-213` |
| 2 | Layout | Cross-Tab Card Height Uniformity | Standardized card height across all primary feature tabs | Tab activation: Haptics, Audio, Triggers, Lighting, System | Card height matches baseline within ±1px across tabs (`--feature-card-height: 370px`) | Throws if card height differs from baseline tab by >1px | `layout-check.mjs:216-219`, `styles-layout.test.ts:51-53` |
| 3 | Layout | Slotted Card Header | Fixed-height structured header bar pinned to the top of each card | Container: `.feature-card-title`; 44px icon slot, `minmax(0, 1fr)` title/subtitle, auto right slot | Pinned header bar with height >= 66px (`--feature-card-header-height: 66px`) | Throws if header min-height != 66px or breaks grid | `styles.css:5013-5023`, `styles-layout.test.ts:95-98` |
| 4 | Layout | Slotted Action Buttons | Pinned action rows in testing cards aligned tab-to-tab | Testing buttons: `.test-card > .primary-action` (row 3), `.test-card > .secondary-action` (row 4) | 48px action buttons pinned in row 3 and 4 across Haptics, Audio, Triggers | Throws if buttons are not in expected rows or deviate horizontally | `UI_STYLE_GUIDE.md:58-60`, `styles.css:7522-7564`, `styles-layout.test.ts:93-107` |
| 5 | Layout | Button Icon & Text Centering | Synchronized horizontal and vertical centering for action buttons | Circular 24x24px badge icon, text label, 12px gap | Icon and text offsets match across tabs within 1px; vertically centered within 2px | Throws if icon != 24px, gap not 10-14px, or offset differs by >1px | `layout-check.mjs:479-556`, `styles.css:7581-7607` |
| 6 | Layout | Preset Control Row Alignment | Preset segmented rows positioned identically across tabs | Segmented row: `.feature-card-grid > .preset-card > .segmented-row` | Top offset (`rowRect.top - cardRect.top`) matches baseline within 1px | Throws if preset top offset differs across tabs by >1px | `layout-check.mjs:221-251`, `layout-check.mjs:366-383` |
| 7 | Layout | Overview Quick Control Framing | Framing alignment between quick actions/persona buttons and quick sliders | Left `.overview-quick-actions` vs right `.overview-sliders` | Slider top aligns with action top (delta <= 1px); slider bottom aligns with persona bottom (delta <= 1px) | Throws if slider frame top or bottom deviates by >1px | `layout-check.mjs:127-174`, `styles-layout.test.ts:557-582` |
| 8 | Controls | CustomSelect Dropdown | Accessible custom dropdown replacing native HTML `<select>` elements | Options array `[string, T]`, current value `T`, positioning props | Stylized floating/inline listbox with checkmark, auto-flip, dynamic max-height | Throws if dropdown width < 150px or height < 32px | `UI_STYLE_GUIDE.md:62`, `App.tsx:2391-2580`, `layout-check.mjs:427-434` |
| 9 | Overflow | Zero Uncontrolled Overflow Tolerance | Zero clipping or scrollbar leakage across all cards and modal dialogs | Modal dialogs, sidebar, cards | Horizontal and vertical overflow must not exceed 1px (`scrollWidth - clientWidth <= 1px`, `scrollHeight - clientHeight <= 1px`) | Throws descriptive error specifying exact horizontal and vertical pixel overflow | `layout-check.mjs:36-45`, `layout-check.mjs:358-363`, `visual-smoke.mjs:135-144` |
| 10 | Layout | Sidebar Spacing & Overflow Control | Non-scrolling shell sidebar with symmetric support badge spacing | Outer `.hero-card` grid, inner `.sidebar-controls`, Ko-fi badge | Sidebar overflow <= 1px; distance above badge equals distance below badge (±1px) | Throws if outer sidebar overflows or badge margins are asymmetric | `layout-check.mjs:74-109`, `styles-layout.test.ts:610-620` |
| 11 | Typography | System Page Typography Uniformity | Strict font-size parity across labels and dropdown values on System page | Mute labels, device labels, system select values | Uniform font size (14.0px) across all sampled controls within ±0.25px | Throws if any label or select value font-size deviates by >0.25px | `layout-check.mjs:562-598`, `styles.css:9610-9640` |
| 12 | Theming | Theme Preset System | Multi-theme palette token definitions supporting light and dark aesthetics | Preset themes: `dark`, `light`, `bubble-gum`, `pomegranate`, `kiwi` | Dynamic token switching (`data-theme`), flat window bar, branded bridge mark | Missing theme blocks cause compile/visual check failures | `styles.css:1-661`, `styles-layout.test.ts:143-160`, `ui-themes.ts` |
| 13 | Layout | Audio Haptics Paired Card Mode | Secondary paired card layout entered via Haptics switch | Toggle "Enter Audio Haptics" switch in Haptics tab | 2-card grid (`.audio-haptics-grid`) matching cross-tab card height and preset top | Throws if card heights differ, content overflows, or children overlap | `layout-check.mjs:254-365`, `styles.css:6924-6946` |
| 14 | Controls | Audio Haptics Dual Selectors | Dual segment selector buttons for mode and routing | Selector `.audio-haptics-routing-stack .dual-selector` | Exactly 2 buttons with equal widths (delta <= 1px) and side gaps <= 2px | Throws if button count != 2, width delta > 1px, or gaps > 2px | `layout-check.mjs:281-302`, `layout-check.mjs:393-416` |
| 15 | Responsiveness | Responsive Media Queries | Layout adaptations for narrower viewports (900px, 880px, 760px) | Viewport widths: <= 900px, <= 880px, <= 760px | Single-column fallbacks for multi-actions, turbo, deadzones, and devices | Layout fails if elements overlap or clip when columns collapse | `styles.css:3640`, `styles.css:4991`, `styles.css:5760`, `styles.css:10799` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Modal Dialogs | Startup Tutorial & Ko-fi Support Modal open on initial launch | `assertNoModalOverflow` enforces `scrollWidth - clientWidth <= 1px` and `scrollHeight - clientHeight <= 1px`. Ko-fi badge rendered aspect ratio must match natural image aspect ratio within ±0.02. |
| 2 | Action Button Labels | Variable length action button text across tabs (e.g. "Trigger Effect", "Stop Effect", "Play Tone", "Haptic Rumble") | Single-line height constraint `textHeight <= 24px` prevents wrapping. Fixed label width `calc((76px + 56px + 82px + 56px + 88px + 94px) / 6)` ensures identical icon/text left offsets across tabs. |
| 3 | System Page Layout | System Profile Panel with dense summary metadata | `grid-template-rows: auto minmax(0, 1fr) 148px;` on `.system-page`. Page must require zero vertical scrolling (`scrollHeight <= clientHeight + 1`). System profile summary must not overflow its panel (`panelSize.scrollHeight <= panelSize.clientHeight + 1`). |
| 4 | Audio Haptics Left Card Children | Sequential controls inside `.audio-haptics-card:first-child` | Evaluates `previous.bottom - current.top <= 1px` for all children; zero overlap permitted between presets, slider, spacer, and routing stack. |
| 5 | CustomSelect Placement | Select positioned near bottom or top of viewport or card boundary | `updateMenuMaxHeight` measures boundary (`.system-card, .feature-card, .settings-menu, .control-page`). If `spaceBelow < 184px` and `spaceAbove > spaceBelow`, flips placement to `'top'`. |
| 6 | CustomSelect Long Lists | Select with > 18 options (e.g. game profiles, process list, MIDI devices) | `longList` switches default menu max-height from 232px to 360px and dynamically clamps to available boundary space. Automatically scrolls selected option into view. |
| 7 | Controller Unavailable | Disconnected or unresponsive DualSense controller | `.shell.controller-unavailable` mutes active switches to `var(--text-disabled)`, switch background becomes `var(--surface-disabled-strong)`, opacity becomes `var(--disabled-opacity)` (0.62), feature icon shadows stripped. |
| 8 | Window Dragging State | Electron window title bar dragging | `.shell.window-dragging` disables all animations and transitions (`!important`), replaces gradients with flat backgrounds, and removes drop-shadows and filters to maintain 60 FPS dragging. |

---

## 1. Paired Feature Card Geometry and Constraints

### Core Philosophy
The DS5 Bridge Companion UI is designed as a calm, dense, desktop tool surface. Main feature pages (**Haptics**, **Audio**, **Triggers**, **Lighting**, and **System**) must maintain an identical paired two-column layout.

### Card Grid Specification
Every main feature view must strictly adhere to the following markup:
```tsx
<div className="feature-card-grid">
  <section className="feature-card [preset-card | trigger-card | etc.]">
    <div className="feature-card-title">...</div>
    ...
  </section>
  <section className="feature-card [test-card | behavior-card | etc.]">
    <div className="feature-card-title">...</div>
    ...
  </section>
</div>
```

### Geometric Dimensions and CSS Rules
1. **Grid Columns**:
   - `grid-template-columns: var(--feature-left-column) var(--feature-right-column);`
   - Tokens: `--feature-left-column: minmax(0, 1fr);`, `--feature-right-column: minmax(0, 1fr);`
   - Both columns must be identical in width (`1fr`). Column widths must not be overridden individually.
2. **Card Height and Sizing**:
   - Card minimum height: `--feature-card-min-height: 250px;`
   - Feature card height token: `--feature-card-height: 370px;` (UI Style Guide originally documented 355px, updated to 370px in `styles.css` `:root`).
   - Cards must remain content-sized rather than stretched to the viewport:
     ```css
     .control-page {
       grid-template-rows: auto minmax(var(--feature-card-height), auto);
     }
     .feature-card-grid {
       height: auto;
       align-items: stretch;
     }
     .feature-card {
       min-height: 0;
       height: auto;
     }
     ```
3. **Card Interior Padding**:
   - `--card-padding: 16px;`
   - Border radius: `--card-radius: 4px;`
4. **Header Slotting (`.feature-card-title`)**:
   - Fixed height: `--feature-card-header-height: 66px;`
   - Layout:
     ```css
     .feature-card-title {
       min-height: var(--feature-card-header-height); /* 66px */
       display: grid;
       grid-template-columns: 44px minmax(0, 1fr) auto;
       align-items: center;
       gap: 12px;
       margin: calc(var(--card-padding) * -1) calc(var(--card-padding) * -1) 16px;
       padding: 10px 14px;
       border-bottom: 1px solid var(--surface-divider);
       border-radius: calc(var(--card-radius) - 1px) calc(var(--card-radius) - 1px) 0 0;
       background: var(--surface-card-header);
     }
     ```
   - Left slot (44px): `.feature-icon` (44x44px rounded container with 24x24px Lucide SVG icon).
   - Center slot (`minmax(0, 1fr)`): `.title-copy` containing `h3` heading and `p` subtitle. Subtitles must remain concise (single line, no wrapping).
   - Right slot (`auto`): Page-level switch, mode toggle, or status badge.
5. **Horizontal & Vertical Alignment Contract**:
   - Left card bottom vs Right card bottom: delta <= 1px.
   - Left card height vs Right card height: delta <= 1px.
   - Cross-tab card height alignment: Left card height must match across Haptics, Audio, Triggers, Lighting, and System within 1px.

---

## 2. Layout Tokens

All shared tokens are defined in `companion/src/renderer/styles.css` under `:root` and theme selectors (`.shell[data-theme="..."]`):

### Spacing & Sizing Tokens
- `--window-bar-height: 32px;`
- `--sidebar-width: 276px;`
- `--layout-gap: 0px;` (vertical gap in content rail)
- `--card-gap: 12px;` (gap between cards in grid)
- `--card-padding: 16px;`
- `--card-radius: 4px;`
- `--control-radius: 3px;`
- `--control-height: 36px;` (standard compact controls)
- `--action-height: 48px;` (full-width test/action buttons)
- `--feature-card-min-height: 250px;`
- `--feature-card-height: 370px;`
- `--feature-card-header-height: 66px;`
- `--dual-selector-segment-width: 76px;`

### Typography Tokens
- Font Family: `"Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;`
- Base line-height: `1.35;`
- Colors:
  - `--text-primary: #f7f9ff;` (dark theme default)
  - `--text-strong: #ffffff;`
  - `--text-secondary: #c1cadd;`
  - `--text-muted: #9fb1c9;`
  - `--text-dim: #8492a6;`
  - `--text-control: #eef4ff;`
  - `--text-disabled: rgba(199, 211, 228, 0.58);`
- Semantic Text Tokens:
  - `--page-heading-text` / `--page-subtitle-text` (tinted chrome for page level)
  - `--card-heading-text` / `--card-subtitle-text` (card level)
  - `--settings-copy-text`
  - `--sidebar-label` / `--sidebar-link` / `--sidebar-link-hover` / `--sidebar-link-disabled`

### Surface & Border Tokens
- `--surface-card: rgba(3, 10, 18, 0.52);`
- `--surface-card-hover: rgba(5, 14, 24, 0.66);`
- `--surface-card-header: rgba(3, 9, 16, 0.48);`
- `--surface-panel: rgba(3, 10, 18, 0.52);`
- `--surface-control: rgba(6, 14, 23, 0.78);`
- `--surface-control-soft: rgba(4, 10, 17, 0.16);`
- `--surface-border: rgba(142, 164, 194, 0.18);`
- `--surface-border-strong: rgba(142, 164, 194, 0.28);`
- `--surface-divider: rgba(142, 164, 194, 0.16);`

### Theme Presets
5 supported themes:
1. `dark` (Default high-contrast slate dark)
2. `light` (Clean desktop light slate)
3. `bubble-gum` (Vibrant magenta / pink accent)
4. `pomegranate` (Deep berry wine dark with hot pink / lime accents)
5. `kiwi` (Deep forest midnight with lime chartreuse accents)

---

## 3. Slotted Button Positions and Control Alignment

### Testing Card Grid Slotting
The right-hand card across Haptics, Audio, Triggers, and Lighting is rigidly slotted using `--feature-status-grid-rows`:
```css
--feature-status-grid-rows: var(--feature-card-header-height) 76px var(--action-height) var(--action-height) minmax(40px, 1fr);
```
- **Row 1 (`var(--feature-card-header-height) = 66px`)**: Title header
- **Row 2 (`76px`)**: Options / setup controls (`.test-options`, preset swatches)
- **Row 3 (`var(--action-height) = 48px`)**: Primary action button (`.primary-action`)
- **Row 4 (`var(--action-height) = 48px`)**: Secondary action button (`.secondary-action`)
- **Row 5 (`minmax(40px, 1fr)`)**: Status block (`.feature-status`, `.lighting-status`)

### Action Button Specifications (`.primary-action`, `.secondary-action`)
```css
.test-card > .primary-action,
.test-card > .secondary-action,
.trigger-action-row .primary-action,
.trigger-action-row .secondary-action {
  --test-action-icon-size: 24px;
  --test-action-icon-gap: 12px;
  --test-action-label-width: calc((76px + 56px + 82px + 56px + 88px + 94px) / 6);
  --test-action-content-width: calc(var(--test-action-icon-size) + var(--test-action-icon-gap) + var(--test-action-label-width));
  display: grid;
  grid-template-columns: var(--test-action-icon-size) minmax(0, 1fr);
  justify-content: stretch;
  justify-items: start;
  column-gap: var(--test-action-icon-gap);
  padding-left: max(12px, calc((100% - var(--test-action-content-width)) / 2));
  padding-right: 12px;
  text-align: left;
  white-space: nowrap;
}
```
Validation rules:
- Icon badge size: 24x24 px (circular badge, `border-radius: 50%`, `padding: 5px`, `stroke-width: 2.4`).
- Icon-to-text gap: Exactly 12px (`10px <= iconTextGap <= 14px`).
- Cross-tab horizontal alignment: `iconLeftOffset` and `textLeftOffset` must match across Haptics, Audio, and Triggers within 1px.
- Vertical alignment: Group center and icon center must be aligned with button vertical center within 2px.
- Text wrapping: Text must not wrap; `textHeight <= 24px`.

### Preset Control Row Alignment
Preset buttons (`.segmented-row`) in feature cards must maintain identical vertical positioning:
- `rowRect.top - cardRect.top` must match within 1px across tabs.

### Overview Quick Controls Alignment
- Top delta: `sliderRect.top - actionTop` must be within ±1px.
- Bottom delta: `sliderRect.bottom - personaRect.bottom` must be within ±1px.

---

## 4. CustomSelect Specification and Native Select Replacement

### Architectural Mandate
`UI_STYLE_GUIDE.md § Controls` explicitly mandates:
> **"Dropdowns must use `CustomSelect`; do not use native `select` elements in the app surface."**

### Native Select Violations in Current Codebase
A comprehensive audit reveals **3 native `<select>` violations** in `companion/src/renderer/App.tsx`:
1. Line 11845: `<select className="game-profile-process-select" aria-label="Running applications" ...>`
2. Line 11877: `<select id="game-profile-controller-select" ...>`
3. Line 11892: `<select id="game-profile-remap-select" ...>`

**Remediation Requirement**: These native `<select>` tags in the Game Profile management modal must be replaced with the modularized `<CustomSelect />` component.

### `CustomSelect` Component Contract
- **Interface**:
  ```typescript
  type CustomSelectProps<T extends SelectValue> = {
    value: T;
    options: Array<[string, T]>;
    disabled?: boolean;
    className?: string;
    floatingMenu?: boolean;
    floatingMenuMinWidth?: number;
    suspendOutsideClose?: boolean;
    showSelectedCheck?: boolean;
    closeOnSelect?: boolean;
    getOptionClassName?: (label: string, value: T) => string | undefined;
    renderValue?: (label: string, value: T) => ReactNode;
    renderOption?: (label: string, value: T) => ReactNode;
    renderMenuFooter?: (closeMenu: () => void) => ReactNode;
    ariaLabel: string;
    onChange: (value: T) => void;
  };
  ```
- **Boundary Collision & Auto-Flipping**:
  - Detects nearest boundary container (`.system-card, .feature-card, .settings-menu, .control-page`) or viewport.
  - Automatically flips placement between `'top'` and `'bottom'` based on available clearance (`preferredVisibleHeight = 184px`).
  - Sets `--custom-select-menu-max-height` (max 360px for lists > 18 items, default 232px, clamped to clearance).
- **Floating Portal Option**:
  - `floatingMenu={true}` renders menu into `.shell` root via portal to escape parent overflow clipping.
- **Dimensional Constraints (from `layout-check.mjs`)**:
  - `selectWidth >= 150px`
  - `selectHeight >= 32px`
- **Accessibility**:
  - `role="listbox"` / `role="option"`, `aria-haspopup="listbox"`, `aria-expanded`, keyboard navigation (ArrowDown, Enter, Space).

---

## 5. Zero Clipping / Uncontrolled Overflow Tolerance Rules

The test automation strictly checks for layout overflow and clipping:

### 1. Absolute Tolerance Thresholds
- Pixel tolerance: `tolerancePx = 1` (1.0 pixel). Any overflow > 1px fails.
- Button alignment tolerance: `buttonTolerancePx = 2` (2.0 pixels).
- Typography tolerance: `fontSizeDelta <= 0.25px`.

### 2. Modal Overflow Rule
```javascript
const overflow = {
  horizontal: Math.max(0, element.scrollWidth - element.clientWidth),
  vertical: Math.max(0, element.scrollHeight - element.clientHeight)
};
if (overflow.horizontal > 1 || overflow.vertical > 1) {
  throw new Error(`Modal overflowed`);
}
```
Enforced on:
- Startup Feature Tile Tutorial dialog
- Support DS5 Bridge (Ko-fi) dialog
- Bridge Settings dialog
- Kitsune Input promotion dialog

### 3. Sidebar Shell Rule
- The outer sidebar container (`.hero-card`) must **never** scroll:
  `Math.max(0, sidebar.scrollHeight - sidebar.clientHeight) <= 1px`.
- Only the inner `.sidebar-controls` element is allowed to scroll (`overflow-y: auto; overscroll-behavior: contain; min-height: 0;`).
- Ko-fi support badge spacing symmetry:
  `Math.abs(spacingAbove - spacingBelow) <= 1px`.

### 4. Card Content Overflow & Child Collision Rule
- For every card in `.feature-card-grid` and `.audio-haptics-grid`:
  `card.scrollHeight - card.clientHeight <= 1px`.
- Sequential child elements inside cards must not collide:
  `previous.bottom - current.top <= 1px`.

### 5. System Page Vertical Scrolling Zero-Tolerance
- `systemPageSize.scrollHeight > systemPageSize.clientHeight + 1` -> Failure.
- `systemProfilePanel.scrollHeight > systemProfilePanel.clientHeight + 1` -> Failure.
- The System page must fit completely without page-level vertical scrollbars.

---

## 6. Responsiveness Rules and Styling Constraints

### Responsive Breakpoints
1. **`@media (max-width: 900px)`**:
   - `.multi-actions-grid`: Collapses from `360px 1fr` to single column `1fr`.
2. **`@media (max-width: 880px)`**:
   - `.turbo-grid`: Collapses from `repeat(2, minmax(0, 1fr))` to single column `minmax(0, 1fr)`.
3. **`@media (max-width: 760px)`**:
   - `.deadzones-grid`: Collapses from 2-column to 1-column `minmax(0, 1fr)`.
   - `.deadzones-page`: Switches to `grid-template-rows: auto auto auto;`.
   - `.devices-action-strip`: Collapses to single column `minmax(0, 1fr)`.
   - `.trusted-device-card`: Rebalances columns to `minmax(0, 1fr) minmax(118px, 34%)`.
   - `.trusted-device-grid`: Collapses to single column `minmax(0, 1fr)`.
4. **`@media (prefers-reduced-motion: reduce)`**:
   - Disables all non-essential CSS transitions, gloss animations, and spinner transforms.

### Desktop Content Rail & Scaling Rules
- App root `.shell` has fixed dimensions: `width: 100vw; height: 100vh; overflow: hidden;`.
- Window content area:
  - Sidebar: Fixed width `276px` (`--sidebar-width`).
  - Active page content rail: `width: min(100%, 800px);`.
- Viewport scaling: No `transform: scale(var(--app-scale))` or `--app-base-width`. Layout scales via standard CSS flex/grid and content bounds.

---

## 7. Automated Layout Verification Suite (`npm run layout:check`)

### Implementation & Architecture
- **Script**: `companion/scripts/layout-check.mjs`
- **Execution Command**: `npm run layout:check` (invokes `npm run build && node scripts/layout-check.mjs`)
- **Technology**: Playwright Electron runner (`import { _electron as electron } from 'playwright';`)
- **Environment**: Sets `DS5_BRIDGE_ALLOW_PARALLEL_AUTOMATION_INSTANCE: '1'`

### Validation Steps & Assertions

```
1. Electron Launch & Cold Start Reset
   ├── Launch Electron binary
   ├── Clear 'ds5bridge.startupTutorialCompleted.v1' from localStorage
   └── Reload app to force tutorial dialogs

2. Tutorial & Support Dialog Validation
   ├── Assert zero overflow on 'Feature tile tutorial' (<= 1px horiz/vert)
   ├── Step to 'Support DS5 Bridge' dialog
   ├── Assert zero overflow on 'Support tutorial' (<= 1px horiz/vert)
   ├── Validate Ko-fi badge rendered aspect ratio (abs(natural - rendered) <= 0.02)
   └── Dismiss tutorial

3. Sidebar Geometry Verification
   ├── Measure Ko-fi badge spacing above vs below: abs(above - below) <= 1px
   └── Assert sidebar scrollHeight - clientHeight <= 1px

4. Overview Page Alignment
   ├── Verify Quick Action buttons top vs Quick Sliders top: delta <= 1px
   └── Verify Persona buttons bottom vs Quick Sliders bottom: delta <= 1px

5. Primary Feature Tabs (Haptics, Audio, Triggers, Lighting, System)
   ├── Query active `.feature-card-grid > section` (must equal 2 cards)
   ├── Card bottom delta: abs(left.bottom - right.bottom) <= 1px
   ├── Card height delta: abs(left.height - right.height) <= 1px
   ├── Cross-tab height consistency: abs(left.height - targetHeight) <= 1px
   └── Preset row top offset: abs(presetRow.top - targetPresetTop) <= 1px

6. Audio Haptics Mode (Activated via switch)
   ├── Assert 2 cards in `.audio-haptics-grid`
   ├── Paired height & bottom delta <= 1px
   ├── Height matches cross-tab target height (<= 1px)
   ├── Zero card overflow (scrollHeight - clientHeight <= 1px)
   ├── Preset row top offset matches expectedTop (<= 1px)
   ├── Left children non-overlap check: previous.bottom - current.top <= 1px
   ├── Dual selector check: 2 buttons, width delta <= 1px, side gaps <= 2px
   └── Config pair dropdowns: selectWidth >= 150px, selectHeight >= 32px

7. Slotted Test Action Buttons (Haptics, Audio, Triggers)
   ├── Exactly 2 buttons (.primary-action, .secondary-action)
   ├── Icon badge dimensions: 24x24 px (tolerance <= 1px)
   ├── Icon-text gap: between 10px and 14px (nominal 12px)
   ├── Cross-tab iconLeftOffset: delta <= 1px
   ├── Cross-tab textLeftOffset: delta <= 1px
   ├── Text height <= 24px (no wrapping)
   └── Vertical alignment: group & icon vertical center delta <= 2px

8. System Page Typography Parity
   ├── Sample mute labels, device labels, system select values
   └── All font sizes must match target within 0.25px (target: 14.0px)
```

### 7.2 Automation Discrepancy & Navigation Contract Analysis
During live execution of `layout:check` (`scripts/layout-check.mjs`), a critical locator timeout was diagnosed:
`locator.click: Timeout 30000ms exceeded. Call log: waiting for getByRole('tablist', { name: 'Controls' }).getByRole('tab', { name: 'Overview' })`

**Root Cause Analysis**:
1. **Missing `role="tablist"` on `<nav className="control-tabs">`**:
   In `App.tsx` (line 7452):
   ```tsx
   <nav className="control-tabs" aria-label="Controls">
   ```
   HTML5 `<nav>` elements implicitly carry `role="navigation"`, not `role="tablist"`. Because the child buttons carry `role="tab"`, the WAI-ARIA tablist container role must be explicitly added: `<nav className="control-tabs" aria-label="Controls" role="tablist">`.
2. **Collapsible Tab Groups & System Button Navigation**:
   Commit `9548037` ("feat(app): group collapsible sidebar controls") refactored the sidebar into collapsible groups (`Controller`, `Input`, `Labs`), keeping child tabs collapsed by default, and relocated the `System` tab into the `.header-settings` bottom bar.
   - `visual-smoke.mjs` was updated to handle this by expanding groups when needed (`controlsNav.getByRole('button', { name: group }).click()`) and selecting System via `getByRole('button', { name: 'System' })`.
   - `layout-check.mjs` (which predates the collapsible groups refactor) expects either:
     a. `openControlGroupId` to default to `'controller'` or automatically expand the group containing the active tab, OR
     b. `layout-check.mjs` to auto-expand the parent group when navigating to grouped tabs, and to locate `#control-tab-system` appropriately.
   - Standardizing the sidebar navigation ARIA contract ensures `npm run layout:check` succeeds deterministically.

---

## 8. Summary of Modularization Guidelines for Subsequent Work

When refactoring the monolithic `App.tsx` into modular domain tabs:
1. **Never alter card grid wrappers**: Every main tab view must render `.feature-card-grid` containing two sibling `<section className="feature-card ...">` elements.
2. **Preserve header structure**: Every card must start with `<div className="feature-card-title">` having a 44px icon container, title copy, and right-aligned switch/action.
3. **Preserve slotted test card rows**: Any card rendering primary and secondary action buttons must use `.test-card` or `.behavior-card` with `--feature-status-grid-rows`.
4. **Use `CustomSelect` exclusively**: Replace the 3 remaining native `<select>` elements in the Game Profiles modal. Do not introduce new native selects.
5. **Zero-overflow compliance**: Ensure no content spills past container bounds (`scrollHeight - clientHeight <= 1px`).
6. **Maintain CSS regression suite**: All 31 tests in `src/renderer/styles-layout.test.ts` and `npm run layout:check` must pass at 100%.
7. **Ensure ARIA tablist contract**: Maintain `role="tablist"` on `<nav className="control-tabs">` and ensure grouped tab transitions are accessible.

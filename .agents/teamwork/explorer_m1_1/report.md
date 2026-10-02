# Milestone 1 (M1): UI Primitives Extraction Strategy & Specification

## 1. Executive Summary
This report defines the comprehensive extraction plan for isolating standalone UI primitives currently embedded within the monolithic `companion/src/renderer/App.tsx` (specifically between lines 1,284 and 2,846) into dedicated, reusable components under `companion/src/renderer/components/ui/`.

By extracting these 7 standalone UI primitives, `App.tsx` is relieved of ~822 lines of markup and presentation logic while establishing the design system foundational components required for the subsequent modularization milestones (M2–M5).

---

## 2. Inventory of Target UI Primitives

| Component Name | Source Lines in `App.tsx` | Size | Target File Path | Primary Function |
|---|---|---|---|---|
| `CustomSelect` | 869, 907–927, 2391–2602 | ~235 LOC | `src/renderer/components/ui/CustomSelect.tsx` | Keyboard-accessible, auto-flipping custom dropdown select (used in 40+ locations, replaces native `<select>`) |
| `FeatureTipsPanel` | 317–322, 1583–1745 | ~170 LOC | `src/renderer/components/ui/FeatureTipsPanel.tsx` | Collapsible, context-aware tips panel with interactive sample toggles |
| `SystemProfileSummary` | 1747–1899 | ~153 LOC | `src/renderer/components/ui/SystemProfileSummary.tsx` | Status panel showing active audio, feel, lighting, and system profile settings |
| `StartupTutorial` | 194, 1467–1569 | ~103 LOC | `src/renderer/components/ui/StartupTutorial.tsx` | Multi-step first-launch onboarding modal (feature tiles + Ko-fi support) |
| `KitsuneInputPromotionDialog` | 1345–1446 | ~102 LOC | `src/renderer/components/ui/KitsuneInputPromotionDialog.tsx` | Promotional modal and wordmark for Kitsune Input advanced suite |
| `TriggerLabMeter` | 1284–1321 | ~38 LOC | `src/renderer/components/ui/TriggerLabMeter.tsx` | DualSense trigger resistance visualization range slider with notch indicators |
| `BridgeMark` | 1323–1343 | ~21 LOC | `src/renderer/components/ui/BridgeMark.tsx` | Theme-aware vector SVG logo for DS5 Bridge |

---

## 3. Deep Component Analysis: Dependencies, Types, Props, and CSS

### 3.1 `CustomSelect`
- **Source Lines**: 869 (`SelectValue`), 907–927 (`CustomSelectProps`, `CustomSelectMenuStyle`), 2391–2602 (`CustomSelect` component).
- **Target File**: `companion/src/renderer/components/ui/CustomSelect.tsx`
- **Props & Types**:
  ```typescript
  export type SelectValue = string | number;

  export type CustomSelectOption<T extends SelectValue = SelectValue> = [string, T];

  export type CustomSelectProps<T extends SelectValue> = {
    id?: string;
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
    ariaLabel?: string;
    onChange: (value: T) => void;
  };

  export type CustomSelectMenuStyle = CSSProperties & {
    '--custom-select-menu-max-height'?: string;
  };
  ```
- **Dependencies**:
  - `react`: `type CSSProperties`, `type ReactNode`, `useEffect`, `useRef`, `useState`
  - `react-dom`: `createPortal`
  - `@tabler/icons-react`: `IconCheck as Check`, `IconChevronDown as ChevronDown`
- **CSS Class Names**:
  - `.custom-select`, `.custom-select-button`, `.custom-select-menu`, `.custom-select-menu-options`, `.custom-select-menu-footer`
  - States & placement: `.open`, `.menu-top`, `.menu-bottom`, `.disabled`, `.selected`, `.custom-select-floating-layer`, `.dialog-suspended`
- **Internal Mechanics**:
  - Boundary-aware placement calculation: measures available viewport and parent container (`.system-card, .feature-card, .settings-menu, .control-page`), flipping between `'top'` and `'bottom'`.
  - Auto-scroll to selected option via `requestAnimationFrame` on menu opening.
  - Floating layer portal into `.shell` or `document.body` for overlay menus.
  - Click-outside dismissal listener with `suspendOutsideClose` override.

### 3.2 `FeatureTipsPanel`
- **Source Lines**: 317–323, 1583–1745.
- **Target File**: `companion/src/renderer/components/ui/FeatureTipsPanel.tsx`
- **Props & Types**:
  ```typescript
  export type SettingsFocusTarget = 'controller-power-saving' | 'sleep-shortcut' | 'volume-shortcut';

  export type FeatureTipsPanelProps = {
    tab: 'audio' | 'haptics' | 'triggers' | 'lighting' | 'deadzones';
    onSettingsFocusRequest?: (target: SettingsFocusTarget) => void;
    audioHapticsOpen?: boolean;
    triggerLabOpen?: boolean;
  };
  ```
- **Dependencies**:
  - `react`: `type ReactNode`, `useState`
  - `@tabler/icons-react`:
    - `IconViewfinder` (Deadzones stick tuning)
    - `IconCircleCheck` (Deadzones guidance)
    - `IconSparkleHighlight` (Feature tile toggle)
    - `IconAdjustmentsHorizontal as Settings2` (Unavailable controls)
    - `IconFlask2` (Trigger Lab override)
    - `IconDeviceAudioTape` (Audio haptics)
    - `IconHeadphones as Headphones` (Headphone routing)
    - `IconBatteryEco` (Power saving limit)
    - `IconLinkOff as LinkOffIcon` / `IconLink as LinkIcon` (Trigger link/split)
    - `IconBrandDeezer` (Audio haptics mode)
    - `IconPalette as Palette` (Lighting custom swatch)
    - `IconPlayerPlay as Play` (Test feedback)
    - `IconQuestionMark` (Heading icon)
- **CSS Class Names**:
  - `.feature-help-panel`, `.feature-help-heading`, `.feature-help-grid`, `.feature-help-item`, `.feature-help-copy`
  - Icon buttons & states: `.feature-help-icon`, `.feature-help-icon-button`, `.active`, `.success`
- **Internal State**:
  - `featureTileSampleActive` (boolean): toggles interactive demo icon in the panel.
  - `triggerLabLinkTipSplit` (boolean): toggles linked/split icon demo for triggers tab.

### 3.3 `SystemProfileSummary`
- **Source Lines**: 1747–1899.
- **Target File**: `companion/src/renderer/components/ui/SystemProfileSummary.tsx`
- **Props & Types**:
  ```typescript
  export type SystemProfileSummaryProps = {
    settings: ControllerProfileSettings;
    powerSavingActive: boolean;
  };
  ```
- **Dependencies**:
  - `react`: JSX runtime
  - `@tabler/icons-react`:
    - `IconVolume as Volume2`
    - `IconSparkles as Sparkles`
    - `IconBulb`
    - `IconAdjustmentsHorizontal as Settings2`
  - `../../../shared/protocol`: `type ControllerProfileSettings`
  - `../../../shared/types`: `type BridgeSnapshot`
- **Helper Utilities Encapsulated in Module**:
  - `controllerProfileSettingsFromSnapshot(snapshot: BridgeSnapshot): ControllerProfileSettings`
  - `muteButtonSummary(settings: ControllerProfileSettings): string`
  - `percentLabel(value: number): string`
  - `enabledLabel(enabled: boolean): string`
  - `lightbarColorLabel(color: string): string`
  - `optionLabel<T>(options: Array<[string, T]>, value: T): string`
  - Reference to `CONTROLLER_POWER_SAVING_CAP_PERCENT = 40`
  - Reference to option arrays (`POLLING_RATE_OPTIONS`, `MUTE_KEY_OPTIONS`, `MUTE_MODIFIER_OPTIONS`, `LIGHTBAR_COLOR_NAMES`)
- **CSS Class Names**:
  - `.system-profile-summary`, `.system-profile-summary-group`, `.system-profile-summary-heading`, `.eco-limited`

### 3.4 `StartupTutorial`
- **Source Lines**: 194 (`StartupTutorialStep`), 1467–1569.
- **Target File**: `companion/src/renderer/components/ui/StartupTutorial.tsx`
- **Props & Types**:
  ```typescript
  export type StartupTutorialStep = 'feature-toggle' | 'support' | 'done';

  export type StartupTutorialProps = {
    step: Exclude<StartupTutorialStep, 'done'>;
    featureExampleActive: boolean;
    supportCountdown: number;
    kofiBadgeUrl: string;
    onFeatureExampleToggle: () => void;
    onFeatureStepComplete: () => void;
    onSupport: () => void;
    onFinish: () => void;
  };
  ```
- **Dependencies**:
  - `react`: JSX runtime
  - `@tabler/icons-react`:
    - `IconSparkleHighlight`
    - `IconArrowRight as ArrowRight`
    - `IconHeart as Heart`
- **CSS Class Names**:
  - `.modal-backdrop`, `.startup-tutorial-backdrop`, `.settings-menu`, `.bridge-settings-modal`, `.startup-tutorial-modal`, `.settings-menu-heading`, `.bridge-settings-modal-heading`, `.modal-heading-copy`, `.startup-tutorial-step`, `.startup-tutorial-copy`, `.startup-tutorial-feature-demo`, `.startup-tutorial-feature-icon`, `.active`, `.startup-tutorial-actions`, `.primary-action`, `.startup-tutorial-kofi-button`

### 3.5 `KitsuneInputPromotionDialog`
- **Source Lines**: 1345–1446.
- **Target File**: `companion/src/renderer/components/ui/KitsuneInputPromotionDialog.tsx`
- **Props & Types**:
  ```typescript
  export type KitsuneInputPromotionDialogProps = {
    dismissing: boolean;
    onClose(): void;
    onDismissForever(): void;
    onLearnMore(): void;
    onPurchase(): void;
  };

  export function KitsuneInputWordmark(): JSX.Element;
  ```
- **Dependencies**:
  - `react`: JSX runtime
  - `@tabler/icons-react`:
    - `IconX as X`
    - `IconArrowRight as ArrowRight`
    - `IconExternalLink`
    - `IconEyeOff`
  - Asset:
    - `import kitsuneInputLogoUrl from '../../assets/kitsune-input-logo.svg';`
- **CSS Class Names**:
  - `.modal-backdrop`, `.kitsune-promotion-backdrop`, `.settings-menu`, `.kitsune-promotion-modal`, `.modal-close-button`, `.kitsune-promotion-close`, `.kitsune-promotion-hero`, `.kitsune-promotion-hero-logo`, `.kitsune-promotion-hero-copy`, `.kitsune-promotion-wordmark`, `.kitsune-promotion-wordmark-kitsune`, `.kitsune-promotion-wordmark-input`, `.kitsune-promotion-feature-grid`, `.kitsune-promotion-feature-card`, `.kitsune-promotion-feature-kicker`, `.kitsune-promotion-actions`, `.primary-action`, `.secondary-action`, `.kitsune-promotion-learn`, `.kitsune-promotion-dismiss`

### 3.6 `TriggerLabMeter`
- **Source Lines**: 1284–1321.
- **Target File**: `companion/src/renderer/components/ui/TriggerLabMeter.tsx`
- **Props & Types**:
  ```typescript
  export type TriggerLabMeterProps = {
    label: string;
    value: number;
    disabled?: boolean;
    onChange: (value: number) => void;
    onCommit: (value: number) => void;
  };
  ```
- **Dependencies**:
  - `react`: `type CSSProperties`
  - Step & tick constants:
    - `TRIGGER_LAB_SLIDER_STEP = 5`
    - `TRIGGER_LAB_SLIDER_TICKS = Array.from({ length: 21 }, (_, index) => index * 5)`
    - `snapTriggerLabPercent(value: number): number`
    - `sliderTickClass(value: number, max: number): string | undefined`
- **CSS Class Names**:
  - `.range-control`, `.trigger-lab-meter`, `.range-ticks`, `.milestone`, `.milestone.endpoint`

### 3.7 `BridgeMark`
- **Source Lines**: 1323–1343.
- **Target File**: `companion/src/renderer/components/ui/BridgeMark.tsx`
- **Props & Types**:
  ```typescript
  export function BridgeMark(): JSX.Element;
  ```
- **Dependencies**: Pure SVG (no external packages or icons).
- **CSS Tokens Used in SVG**:
  - `fill="var(--bridge-mark-primary)"`
  - `fill="var(--bridge-mark-secondary)"`
- **CSS Class Names**:
  - `.bridge-mark`

---

## 4. Other Components and Glyph Options in Lines 1,292 to 2,846

Between lines 1,292 and 2,846 of `App.tsx`, additional helper components and glyph renderers exist:

| Component / Function | Lines | Purpose | Recommended Destination & Milestone |
|---|---|---|---|
| `StartupScreen` | 1448–1465 | Loading splash screen | Keep in `App.tsx` (tested by `styles-layout.test.ts` line 168: `toContain('function StartupScreen({ ready }')`). Move to shell component in M5. |
| `ProfileSaveStatus` | 1571–1581 | "Changes Are Automatically Saved" indicator | `components/ui/ProfileSaveStatus.tsx` or retain until System/Settings tab modularization (M3). |
| `ThemeOption` | 2604–2615 | Swatch preview inside Theme select | Keep in `App.tsx` or export from `ui-themes.ts` (tested by `styles-layout.test.ts` line 150: `toContain('UI_THEME_PREVIEW_SWATCHES[value].map((swatch)')`). |
| `AudioHapticsConfigLabel` | 2617–2639 | Tooltip label for audio haptics configuration | Extract with Haptics page in Milestone 2. |
| `UptimeValue` | 2641–2669 | Live ticking uptime counter | Extract with System page in Milestone 3. |
| `RemapGlyphOption` | 2671–2683 | Button icon/text badge for remap selects | Extract with Remapping in Milestone 4 (`components/ui/RemapGlyphOption.tsx` or `pages/remapping/`). |
| `TouchpadZoneTargetOption` | 2685–2716 | Touchpad 4-zone select option | Extract with Remapping in Milestone 4 (`pages/remapping/RemapTouchpadSubPage.tsx`). |
| `IconTouchpadHand` | 2718–2738 | Touchpad gesture SVG hand icon | Extract with Remapping in Milestone 4. |
| `RemapSourceGlyph` | 2740–2748 | Remap source button display badge | Extract with Remapping in Milestone 4. |
| `ChordStarterGlyph` | 2750–2765 | Chord starter badge (tested by `app-behavior.test.ts` line 316: `toContain('chords-starter-icon-glyph')`) | Extract with Chords page in Milestone 4 (`pages/chords/ChordsPage.tsx`). |
| `ChordStarterGlyphOption` | 2767–2773 | Chord starter select option | Extract with Chords in Milestone 4. |
| `ChordButtonGlyphOption` | 2775–2785 | Chord target button select option | Extract with Chords in Milestone 4. |
| `HostPersonaOption` | 2787–2803 | Host persona select option (tested by `app-behavior.test.ts` line 420) | Extract with Overview / System in Milestone 2/3. |
| `AudioHapticsSourceOption` | 2805–2845 | Audio reactive haptics process option | Extract with Haptics in Milestone 2 (`pages/HapticsPage.tsx`). |

---

## 5. Test Suite Synchronization Strategy

Both `companion/src/renderer/app-behavior.test.ts` and `companion/src/renderer/styles-layout.test.ts` use `readFileSync` to read source code files into memory and perform direct string assertions.

### 5.1 Established Precedents in the Codebase
When `ControllerDevicesPage` was extracted from `App.tsx`, `app-behavior.test.ts` (lines 9–12) established the pattern:
```typescript
const controllerDevicesPageSource = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'ControllerDevicesPage.tsx'),
  'utf8'
);
```
And in `styles-layout.test.ts` (line 8):
```typescript
const themeSource = readFileSync(new URL('./ui-themes.ts', import.meta.url), 'utf8');
```

### 5.2 Test Assertions & Required Synchronization for M1 Extracted Components

#### A. `BridgeMark`
- **Test File**: `companion/src/renderer/styles-layout.test.ts` (lines 213–217)
- **Current Code**:
  ```typescript
  it('uses theme-aware colors for the navbar bridge mark', () => {
    expect(appSource).toContain('function BridgeMark()');
    expect(appSource).toContain('fill="var(--bridge-mark-primary)"');
    expect(appSource).toContain('fill="var(--bridge-mark-secondary)"');
    expect(appSource).not.toContain('bridgeMarkUrl');
  ```
- **Synchronization Action**:
  Add `bridgeMarkSource = readFileSync(new URL('./components/ui/BridgeMark.tsx', import.meta.url), 'utf8');` and update the test to verify:
  ```typescript
  expect(bridgeMarkSource).toContain('export function BridgeMark()');
  expect(bridgeMarkSource).toContain('fill="var(--bridge-mark-primary)"');
  expect(bridgeMarkSource).toContain('fill="var(--bridge-mark-secondary)"');
  expect(appSource).toContain("import { BridgeMark } from './components/ui/BridgeMark';");
  ```

#### B. `sliderTickClass` & `TriggerLabMeter`
- **Test File**: `companion/src/renderer/app-behavior.test.ts` (lines 298–311)
- **Current Code**:
  ```typescript
  it('does not snap snapshot values back to coarse slider notches', () => {
    const start = appSource.indexOf('function displayHapticsValue');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = appSource.indexOf('function sliderTickClass', start);
    expect(end).toBeGreaterThan(start);
  ```
- **Synchronization Action**:
  `function sliderTickClass` is located at line 1,274 in `App.tsx`. Because `sliderTickClass` is also used across haptics, triggers, and deadzone sliders in `App.tsx`, **`function sliderTickClass` MUST remain defined in `App.tsx`** (and can be exported for `TriggerLabMeter.tsx` to import, or vice versa with a wrapper function). This preserves `appSource.indexOf('function sliderTickClass', start)` without requiring test alteration.

#### C. `FeatureTipsPanel`
- **Test File**: `companion/src/renderer/app-behavior.test.ts` (lines 385–404)
- **Current Code**:
  ```typescript
  const deadzonesPanelStart = appSource.indexOf('id="control-panel-deadzones"');
  const deadzonesPanelEnd = appSource.indexOf('<FeatureTipsPanel tab="deadzones" />', deadzonesPanelStart);
  ...
  expect(appSource).toContain('<FeatureTipsPanel tab="deadzones" />');
  expect(appSource).toContain("title: 'Tune Each Stick'");
  expect(appSource).toContain("title: 'Keep It Low'");
  ```
- **Synchronization Action**:
  The deadzones markup `<FeatureTipsPanel tab="deadzones" />` remains in `App.tsx`.
  For `title: 'Tune Each Stick'` and `title: 'Keep It Low'`, add `featureTipsPanelSource = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'components', 'ui', 'FeatureTipsPanel.tsx'), 'utf8');` and assert that `featureTipsPanelSource` contains those tip titles.

#### D. `KitsuneInputPromotionDialog`
- **Test File**: `companion/src/renderer/app-behavior.test.ts` (lines 424–457)
- **Current Code**:
  Asserts both the titlebar banner in `App.tsx` (`!snapshot.settings.kitsuneInputPromotionDismissed`, `aria-label="Explore Kitsune Input"`, `const KITSUNE_INPUT_URL = ...`) and the modal markup (`Take controller customization further`, `<li>Advanced Stick Tuning</li>`, `secondary-action kitsune-promotion-learn`, etc.).
- **Synchronization Action**:
  Add `kitsuneDialogSource = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'components', 'ui', 'KitsuneInputPromotionDialog.tsx'), 'utf8');`.
  Keep the banner and IPC assertions on `appSource`, and assert the dialog features and buttons on `kitsuneDialogSource`.

#### E. `StartupTutorial` & `SystemProfileSummary`
- Neither component has internal JSX string assertions in `app-behavior.test.ts` or `styles-layout.test.ts`. `StartupTutorial` state variables (`storedStartupTutorialStep`, `saveStartupTutorialCompleted`) remain in `App.tsx`. Extraction produces zero test conflicts.

---

## 6. Implementation Plan & File Specifications

### 6.1 `companion/src/renderer/components/ui/CustomSelect.tsx`
Create `src/renderer/components/ui/CustomSelect.tsx`:
- Export `SelectValue`, `CustomSelectOption`, `CustomSelectProps`, `CustomSelectMenuStyle`, and `CustomSelect`.
- Include auto-flip calculation, custom menu scrolling to active option, and floating layer support.
- In `App.tsx`:
  - `import { CustomSelect, type CustomSelectProps, type SelectValue } from './components/ui/CustomSelect';`
  - Remove original definitions from lines 869, 907–927, and 2391–2602.
  - Apply `CustomSelect` to replace the 3 native `<select>` tags in the Game Profiles modal (lines 11,845, 11,877, 11,892) per Milestone 1 Feature 3.

### 6.2 `companion/src/renderer/components/ui/FeatureTipsPanel.tsx`
Create `src/renderer/components/ui/FeatureTipsPanel.tsx`:
- Export `SettingsFocusTarget`, `FeatureTipsPanelProps`, and `FeatureTipsPanel`.
- Co-locate interactive sample toggles (`featureTileSampleActive`, `triggerLabLinkTipSplit`).
- In `App.tsx`:
  - `import { FeatureTipsPanel, type FeatureTipsPanelProps } from './components/ui/FeatureTipsPanel';`
  - Remove original definitions from lines 317–322 and 1583–1745.

### 6.3 `companion/src/renderer/components/ui/SystemProfileSummary.tsx`
Create `src/renderer/components/ui/SystemProfileSummary.tsx`:
- Export `SystemProfileSummaryProps`, `controllerProfileSettingsFromSnapshot`, and `SystemProfileSummary`.
- Encapsulate formatting helpers: `muteButtonSummary`, `percentLabel`, `enabledLabel`, `lightbarColorLabel`, `optionLabel`.
- In `App.tsx`:
  - `import { SystemProfileSummary, controllerProfileSettingsFromSnapshot } from './components/ui/SystemProfileSummary';`
  - Remove original definitions from lines 1747–1899.

### 6.4 `companion/src/renderer/components/ui/StartupTutorial.tsx`
Create `src/renderer/components/ui/StartupTutorial.tsx`:
- Export `StartupTutorialStep`, `StartupTutorialProps`, and `StartupTutorial`.
- In `App.tsx`:
  - `import { StartupTutorial, type StartupTutorialProps, type StartupTutorialStep } from './components/ui/StartupTutorial';`
  - Remove original component from lines 1467–1569.

### 6.5 `companion/src/renderer/components/ui/KitsuneInputPromotionDialog.tsx`
Create `src/renderer/components/ui/KitsuneInputPromotionDialog.tsx`:
- Export `KitsuneInputPromotionDialogProps`, `KitsuneInputWordmark`, and `KitsuneInputPromotionDialog`.
- Import `kitsuneInputLogoUrl` from `../../assets/kitsune-input-logo.svg`.
- In `App.tsx`:
  - `import { KitsuneInputPromotionDialog } from './components/ui/KitsuneInputPromotionDialog';`
  - Remove lines 1345–1446.

### 6.6 `companion/src/renderer/components/ui/TriggerLabMeter.tsx`
Create `src/renderer/components/ui/TriggerLabMeter.tsx`:
- Export `TriggerLabMeterProps` and `TriggerLabMeter`.
- Encapsulate `TRIGGER_LAB_SLIDER_STEP` (5) and ticks generation.
- In `App.tsx`:
  - Export `sliderTickClass` so `appSource.indexOf('function sliderTickClass')` continues to match.
  - `import { TriggerLabMeter } from './components/ui/TriggerLabMeter';`
  - Remove lines 1284–1321.

### 6.7 `companion/src/renderer/components/ui/BridgeMark.tsx`
Create `src/renderer/components/ui/BridgeMark.tsx`:
- Export `BridgeMark`.
- In `App.tsx`:
  - `import { BridgeMark } from './components/ui/BridgeMark';`
  - Remove lines 1323–1343.

---

## 7. Verification Matrix

| Verification Step | Command / Target | Expected Outcome |
|---|---|---|
| TypeScript Typecheck | `npm run typecheck` | Clean zero-error compilation across main and renderer targets |
| Unit Test Suite | `npm run test:companion` | 339+ tests passing (100% pass rate) |
| App Production Build | `npm run build:app` | Vite build completes in ~10s with zero errors |
| Layout / Style Check | `npm run layout:check` | Verifies no visual clipping or styling regressions |
| Source Line Verification | Code inspect `App.tsx` | ~822 lines reduced from `App.tsx` in `src/renderer/` |

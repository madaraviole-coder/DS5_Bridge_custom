# Investigation Report: Milestone 1 (M1) — ErrorBoundary Architecture & CustomSelect Compliance

**Author**: `teamwork_preview_explorer` (Explorer)  
**Target Codebase**: `g:\Documents\GitHub\DS5_Bridge_custom\companion`  
**Date**: 2026-09-30  
**Status**: Completed  

---

## 1. Executive Summary

This investigation establishes the technical architecture and exact implementation blueprint for **Milestone 1 (M1)**:
1. **2-Tier ErrorBoundary Architecture**:
   - **Root Tier** in `companion/src/renderer/main.tsx` wrapping `<App />` with a fail-safe `RootErrorFallback` to prevent blank white screens on catastrophic initialization or render crashes.
   - **Secondary Tier (Tab Tier)** in `companion/src/renderer/App.tsx` wrapping domain tab panels within `.control-pages` with a friendly, recoverable `TabErrorFallback` that preserves application chrome, hardware telemetry, and sidebar navigation while offering "Try Again" and "Return to Overview" recovery actions.
2. **CustomSelect Compliance**:
   - Investigation of the 3 native `<select>` tags in `App.tsx` (lines 11845, 11877, 11892 in the Game Profiles modal), which currently violate `UI_STYLE_GUIDE.md § Controls` ("*Dropdowns must use CustomSelect; do not use native select elements in the app surface*").
   - Detailed blueprint for replacing all 3 native `<select>` tags with `<CustomSelect />`, including options data mapping, selection handlers, accessible labels, portal placement (`floatingMenu`), and CSS token alignment.
3. **UI Primitive Extraction**:
   - Architecture for extracting `CustomSelect` from `App.tsx` into `companion/src/renderer/components/ui/CustomSelect.tsx`, standardizing support for both tuple options (`[label, value]`) and object options (`{ label, value }`).

Both `npm run typecheck` (0 errors) and `npm run test:companion` (339 tests passing across 19 test suites) were verified as the pristine baseline before any modifications.

---

## 2. Baseline Architecture & Codebase State

### 2.1 File State Summary
- **`companion/src/renderer/main.tsx`** (16 LOC):
  Currently renders `<App />` directly inside `<React.StrictMode>` with zero error boundary protection. Any uncaught React error during component render, state update, or lifecycle throws unhandled and unmounts the entire React DOM root, leaving a blank Electron window.
- **`companion/src/renderer/App.tsx`** (12,508 LOC):
  Houses the entire application shell, 10 domain tab panels, modal dialogs, and embedded UI controls.
  - Zero `ErrorBoundary` components exist anywhere in the renderer.
  - Contains exactly three native `<select>` elements in the Game Profiles modal (lines 11845, 11877, 11892).
  - Contains an embedded `CustomSelect` component (lines 2391–2600) and associated types (lines 907–927).
- **`companion/src/renderer/styles.css`** (11,272 LOC):
  Contains design system tokens under `:root` and complete styling for `.custom-select`, `.custom-select-button`, `.custom-select-menu`, and `.custom-select-floating-layer`.

### 2.2 Test Suite Invariants
- `app-behavior.test.ts` (line 23) asserts:
  `expect(rendererEntrySource).toContain("import '@fontsource-variable/inter/standard.css';");`
- `app-behavior.test.ts` (lines 520–535) asserts IPC calls and modal class names (`game-profiles-modal`, `kitsune-bar-modal`), but **does not** assert native `<select>` tags.
- `styles-layout.test.ts` (lines 421–424) tests `.custom-select-menu button.selected`.
- Current test suite status: **339/339 passing**.

---

## 3. 2-Tier ErrorBoundary Architecture

### 3.1 Design Philosophy
React error boundaries must be class components implementing `componentDidCatch` and/or `static getDerivedStateFromError`. 
A production-grade error boundary architecture for a hardware companion app requires two distinct operational tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ main.tsx: <ErrorBoundary fallbackComponent={RootErrorFallback}>        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ App.tsx: Shell (Sidebar, Device Header, Window Controls)           │ │
│ │                                                                    │ │
│ │ ┌────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Tab Tier: <ErrorBoundary fallbackComponent={TabErrorFallback}  │ │ │
│ │ │           resetKeys={[activeControlTab]}>                      │ │ │
│ │ │   <OverviewPage /> | <HapticsPage /> | <TriggersPage /> ...     │ │ │
│ │ └────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Root Tier (Catastrophic Resilience)**:
   - Wrapped around `<App />` in `main.tsx`.
   - Protects against fatal initialization crashes, corrupted state stores, and unhandled bridge transport errors.
   - If triggered, renders `RootErrorFallback` filling the window with safe, self-contained dark-theme styling, allowing the user to reload the window, retry rendering, or copy diagnostic stack traces.
2. **Tab Tier (Localized View Isolation)**:
   - Wrapped around each domain tab inside `.control-pages` in `App.tsx`.
   - Protects against tab-specific render errors (e.g., malformed profile JSON, unsupported audio device enumerations, trigger lab curve evaluation faults).
   - If triggered, **only the crashing tab displays the fallback UI**. The rest of the companion app—including controller telemetry, USB/Bluetooth bridge communication, sidebar navigation, status bar, and settings modal—remains 100% interactive.
   - User can switch to other tabs freely; switching tabs or clicking "Try Again" resets the error state via `resetKeys={[activeControlTab]}`.

### 3.2 Component Specification: `ErrorBoundary.tsx`
**Path**: `companion/src/renderer/components/common/ErrorBoundary.tsx`

#### Props Interface
```typescript
import React, { Component, type ReactNode, type ErrorInfo, type ComponentType } from 'react';

export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ComponentType<FallbackProps>;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

#### Lifecycle & State Handling
- `static getDerivedStateFromError(error: Error)`: Captures the thrown error and sets `hasError: true`.
- `componentDidCatch(error: Error, errorInfo: ErrorInfo)`: Logs the error details to `console.error` and forwards to `props.onError` if defined.
- `componentDidUpdate(prevProps: ErrorBoundaryProps)`: Compares `resetKeys` using `Object.is`. If any key changed and `hasError` is true, automatically invokes `resetErrorBoundary()`.
- `resetErrorBoundary()`: Clears error state (`hasError: false, error: null`) and triggers `props.onReset?.()`.
- `render()`: When `hasError === false`, returns `this.props.children` **directly without wrapping DOM nodes**, preserving existing grid relationships (`grid-area: 1 / 1` in `.control-pages`).

---

### 3.3 Root Fallback UI (`RootErrorFallback`)
**Visual Requirements**:
- Must be visually resilient even if external stylesheets fail to load (inline style fallbacks alongside class names).
- Background: `#050913` (canvas dark theme) / `#07111c` (surface dark theme).
- Centered layout with warning emblem (`AlertTriangle` from `lucide-react`).
- Title: "DS5 Bridge Companion Error".
- Subtitle: "The application encountered a fatal error during rendering."
- Monospace error box showing `error.message`.
- Action buttons:
  - **"Try Again"**: Calls `resetErrorBoundary()`.
  - **"Reload Application"**: Calls `window.location.reload()`.
  - **"Copy Diagnostic Details"**: Copies formatted error report (Name, Message, Stack, User Agent, Timestamp) to clipboard.
- Collapsible `<details>` element with formatted `error.stack`.

---

### 3.4 Tab Fallback UI (`TabErrorFallback`)
**Visual Requirements & Style Guide Compliance**:
- Adheres strictly to `UI_STYLE_GUIDE.md § Page Structure`:
  - Outer container: `className="control-page active tab-error-fallback" role="alert"` (retaining `grid-area: 1 / 1`).
  - Section 1 (`feature-heading`):
    - Icon: `AlertTriangle` (size 24).
    - Title: `Unable to display ${tabName ?? 'this'} view`.
    - Subtitle: "An unexpected error occurred in this view. Your controller connection remains active."
  - Section 2 (`feature-card-grid`):
    - **Left Card (`feature-card`)**:
      - Heading: `<h3>Error Summary</h3>`
      - Message box: `<code>{error.message}</code>`
      - Primary action: `<button type="button" className="primary-action" onClick={resetErrorBoundary}><RefreshCw size={14} /> Try Again</button>`
      - Secondary action: `<button type="button" className="secondary-action" onClick={onNavigateHome}>Switch to Overview</button>`
    - **Right Card (`feature-card`)**:
      - Heading: `<h3>Hardware & Bridge Status</h3>`
      - Informational copy: "Device telemetry and bridge communication are unaffected by this view error."
      - Diagnostic `<details>` for stack trace.

---

## 4. Native `<select>` Tags Investigation & Replacement Blueprint

### 4.1 Native Select Analysis in `App.tsx`
All three native `<select>` tags in the application reside in the Game Profiles modal in `companion/src/renderer/App.tsx`.

| Select # | App.tsx Line | Purpose | Container |
|---|---|---|---|
| 1 | Line 11845 | Running Applications Process Selection | `.game-profile-field` |
| 2 | Line 11877 | Controller Profile Selection | `.game-profile-form-grid > .game-profile-field` |
| 3 | Line 11892 | Button Remapping Profile Selection | `.game-profile-form-grid > .game-profile-field` |

### 4.2 Modal Container Clipping Risk & `floatingMenu`
The Game Profiles modal content container is defined in `styles.css`:
```css
.game-profiles-content {
  padding: 14px;
  max-height: 420px;
  overflow-y: auto;
}
```
**Critical Finding**: Because `.game-profiles-content` has `overflow-y: auto` and a fixed max-height of 420px, standard absolute-positioned dropdown menus (`top: calc(100% + 6px)`) would cause ugly scrollbars or visual clipping when expanded.
**Solution**: `<CustomSelect floatingMenu={true} />` activates portal mounting to `.shell` / `document.body` with fixed coordinate calculation and viewport boundary clamping. All 3 selects in the modal **must** use `floatingMenu`.

---

### 4.3 Detailed Replacement Blueprint for the 3 Selects

#### 4.3.1 Select 1: Running Applications Process Select (Line 11845)
**Current Native Implementation**:
```tsx
{runningProcesses.length > 0 ? (
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
) : (
  <span className="game-profile-scan-hint">
    {runningProcessesLoading ? 'Scanning active processes...' : 'Click "Scan Running Apps" to auto-detect running games.'}
  </span>
)}
```

**Replacement Blueprint**:
1. **Options Data Mapping**:
   ```tsx
   const runningProcessOptions: Array<[string, string]> = [
     ['-- Choose a running application --', ''],
     ...runningProcesses.map((proc): [string, string] => [
       `${proc.name} (${proc.executableName})`,
       proc.executableName
     ])
   ];
   ```
2. **Value Mapping**:
   If `editingGameProfile.executableName` matches a running process, reflect it; otherwise default to `''`:
   ```tsx
   const selectedProcessValue = runningProcesses.some(
     (p) => p.executableName.toLowerCase() === (editingGameProfile.executableName ?? '').toLowerCase()
   ) ? (runningProcesses.find(
     (p) => p.executableName.toLowerCase() === (editingGameProfile.executableName ?? '').toLowerCase()
   )?.executableName ?? '') : '';
   ```
3. **Replacement JSX**:
   ```tsx
   {runningProcesses.length > 0 ? (
     <CustomSelect
       value={selectedProcessValue}
       options={runningProcessOptions}
       ariaLabel="Running applications"
       className="game-profile-process-select"
       floatingMenu
       disabled={runningProcessesLoading}
       onChange={(selectedExe) => {
         if (!selectedExe) return;
         const proc = runningProcesses.find((p) => p.executableName.toLowerCase() === selectedExe.toLowerCase());
         setEditingGameProfile((current) => (current ? {
           ...current,
           executableName: selectedExe,
           name: current.name?.trim() ? current.name : (proc?.name || selectedExe.replace(/\.exe$/i, ''))
         } : null));
       }}
     />
   ) : (
     <span className="game-profile-scan-hint">
       {runningProcessesLoading ? 'Scanning active processes...' : 'Click "Scan Running Apps" to auto-detect running games.'}
     </span>
   )}
   ```

---

#### 4.3.2 Select 2: Controller Profile Select (Line 11877)
**Current Native Implementation**:
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

**Replacement Blueprint**:
1. **Options Data Mapping**:
   ```tsx
   const controllerProfileOptions: Array<[string, string]> = snapshot.settings.controllerProfiles.map(
     (profile): [string, string] => [profile.name, profile.id]
   );
   ```
2. **Value Mapping**:
   `editingGameProfile.controllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID`
3. **Replacement JSX**:
   ```tsx
   <div className="game-profile-field">
     <label id="game-profile-controller-label">Controller Profile</label>
     <CustomSelect
       value={editingGameProfile.controllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID}
       options={controllerProfileOptions}
       ariaLabel="Controller Profile"
       className="game-profile-custom-select"
       floatingMenu
       onChange={(profileId) => {
         setEditingGameProfile((current) => (current ? {
           ...current,
           controllerProfileId: profileId
         } : null));
       }}
     />
   </div>
   ```

---

#### 4.3.3 Select 3: Button Remapping Profile Select (Line 11892)
**Current Native Implementation**:
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

**Replacement Blueprint**:
1. **Options Data Mapping**:
   ```tsx
   const buttonRemappingProfileOptions: Array<[string, string]> = [
     ['(Keep current / None)', ''],
     ...snapshot.settings.buttonRemappingProfiles.map(
       (profile): [string, string] => [profile.name, profile.id]
     )
   ];
   ```
2. **Value Mapping**:
   `editingGameProfile.buttonRemappingProfileId ?? ''`
3. **Replacement JSX**:
   ```tsx
   <div className="game-profile-field">
     <label id="game-profile-remap-label">Button Remapping (Optional)</label>
     <CustomSelect
       value={editingGameProfile.buttonRemappingProfileId ?? ''}
       options={buttonRemappingProfileOptions}
       ariaLabel="Button Remapping Profile"
       className="game-profile-custom-select"
       floatingMenu
       onChange={(profileId) => {
         setEditingGameProfile((current) => (current ? {
           ...current,
           buttonRemappingProfileId: profileId || null
         } : null));
       }}
     />
   </div>
   ```

---

### 4.4 CSS Style Tokens & Modal Geometry
To align with `.game-profile-field input` (32px height, 6px radius) and `UI_STYLE_GUIDE.md § Controls`, append the following rule to `companion/src/renderer/styles.css`:

```css
.game-profile-field .custom-select-button,
.game-profile-process-select .custom-select-button {
  height: 32px;
  font-size: 12px;
  padding: 0 10px;
  border-radius: 6px;
  background: var(--surface-control);
  border: 1px solid var(--surface-border);
  color: var(--text-primary);
}

.game-profile-field .custom-select.open .custom-select-button,
.game-profile-process-select.custom-select.open .custom-select-button {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}
```

---

## 5. UI Primitive Extraction: `CustomSelect.tsx`

### 5.1 Extraction Target
Extract `CustomSelect` from `App.tsx` (lines 2391–2600) into dedicated primitive:
`companion/src/renderer/components/ui/CustomSelect.tsx`

### 5.2 Unified Options Contract
To satisfy both existing call sites in `App.tsx` and future modular components according to `PROJECT.md § Interface Contracts`:

```typescript
export type SelectValue = string | number;

export type SelectOptionTuple<T extends SelectValue> = [string, T];

export interface SelectOptionObject<T extends SelectValue> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export type SelectOption<T extends SelectValue> = SelectOptionTuple<T> | SelectOptionObject<T>;

export interface CustomSelectProps<T extends SelectValue> {
  id?: string;
  value: T;
  options: Array<SelectOption<T>>;
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
}
```

Normalizing options internally via:
```typescript
function normalizeOptions<T extends SelectValue>(options: Array<SelectOption<T>>): SelectOptionObject<T>[] {
  return options.map((opt) => {
    if (Array.isArray(opt)) {
      return { label: opt[0], value: opt[1] };
    }
    return opt;
  });
}
```
This guarantees 100% backward compatibility with all 30+ existing `CustomSelect` call sites in `App.tsx` while supporting object options.

---

## 6. Implementation Action Plan for Worker

| Step | Action | Files Affected | Acceptance Verification |
|---|---|---|---|
| **Step 1** | Create `ErrorBoundary.tsx` with `ErrorBoundary`, `RootErrorFallback`, and `TabErrorFallback` | `companion/src/renderer/components/common/ErrorBoundary.tsx` | Exported types & components typecheck cleanly |
| **Step 2** | Create `ErrorBoundary.test.tsx` test suite | `companion/src/renderer/components/common/ErrorBoundary.test.tsx` | All boundary test cases pass |
| **Step 3** | Wrap `<App />` with `ErrorBoundary` in `main.tsx` | `companion/src/renderer/main.tsx` | `app-behavior.test.ts` passes ("self-hosts Inter font") |
| **Step 4** | Extract `CustomSelect.tsx` to `components/ui/` | `companion/src/renderer/components/ui/CustomSelect.tsx` | Typecheck & imports resolve |
| **Step 5** | Create `CustomSelect.test.tsx` test suite | `companion/src/renderer/components/ui/CustomSelect.test.tsx` | Tests pass for tuples, objects, portal, and keyboard |
| **Step 6** | Update `App.tsx`: Import `CustomSelect`, wrap tab panels with `ErrorBoundary` | `companion/src/renderer/App.tsx` | Tab panels safely isolated |
| **Step 7** | Replace 3 native `<select>` tags in Game Profiles modal in `App.tsx` | `companion/src/renderer/App.tsx` | Grep confirms 0 `<select` tags in codebase |
| **Step 8** | Add styling rules for `.game-profile-field .custom-select-button` | `companion/src/renderer/styles.css` | Height and radius match inputs |
| **Step 9** | Fix navigation selector: add `role="tablist"` to `<nav className="control-tabs">` | `companion/src/renderer/App.tsx` | `role="tablist"` in place for layout automation |
| **Step 10** | Run full verification suite | Codebase | `npm run typecheck` + `npm run test:companion` pass with 0 regressions |

---

## 7. Architectural Decisions & Rationale

1. **Why per-tab boundaries inside `.control-pages`?**  
   Wrapping each tab panel prevents an error in one tab (e.g. Haptics audio endpoint enumeration) from crashing the user's entire app. The user can still switch to Deadzones or System, and device telemetry continues streaming uninterrupted.
2. **Why no extra DOM node in ErrorBoundary?**  
   React class components can return `this.props.children` directly. Since `.control-pages` uses CSS Grid with `grid-area: 1 / 1`, returning children directly ensures that CSS layout and Playwright layout checks see identical DOM structures.
3. **Why normalize `options` in `CustomSelect`?**  
   There are over 30 existing calls to `CustomSelect` across `App.tsx` passing `Array<[string, T]>`. Normalizing both tuples and objects avoids having to rewrite dozens of working call sites during Milestone 1, preventing regression risk.
4. **Why `floatingMenu` for modal selects?**  
   `.game-profiles-content` has `overflow-y: auto`. Portaling the dropdown menu to `document.body` / `.shell` completely avoids dropdown clipping or modal scroll jumps.

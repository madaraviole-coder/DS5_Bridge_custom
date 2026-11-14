# Restoring Custom Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore access to Turbo Mode, Touchpad 4-Zone/Mouse, Kitsune-Bar Shortcuts, Game Profiles, and WebHID within the new DS5 Bridge v2.0.1 modular architecture.

**Architecture:** Integrate Touchpad and Turbo sub-tabs into `ButtonRemappingPage.tsx` supported by a dedicated sub-tabs controller hook, connect Kitsune-Bar and PS debounce settings to `SettingsPage.tsx`, and verify all IPC bridge pathways and test suites.

**Tech Stack:** React 19, TypeScript, Electron, Vite, Tabler Icons.

## Global Constraints

- Never break existing v2.0.1 upstream page layouts or responsive design styles.
- Preserve all existing tests and ensure `npm run typecheck` and `npm run test:companion` pass.
- No arbitrary external npm dependencies; reuse existing packages in `package.json`.
- Follow the `<1,000` LOC ceiling per file rule.

---

### Task 1: Create Touchpad & Turbo State Controller Hook

**Files:**
- Create: `companion/src/renderer/features/button-remapping/use-button-remapping-subtabs.ts`
- Modify: `companion/src/renderer/features/button-remapping/use-button-remapping-controller.ts:25-35`
- Test: `companion/src/renderer/features/button-remapping/subtabs-controller.test.ts`

**Interfaces:**
- Consumes: `runtime: AppRuntime` (`snapshot`, `runAction`)
- Produces: `remappingSubTab`, `setRemappingSubTab`, `touchpadProps`, `turboProps`

- [x] **Step 1: Write unit test for subtabs controller**

Create `companion/src/renderer/features/button-remapping/subtabs-controller.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useButtonRemappingSubTabs } from './use-button-remapping-subtabs';
import { DEFAULT_TOUCHPAD_SETTINGS } from '../../../shared/touchpad-gestures';
import { DEFAULT_TURBO_SETTINGS } from '../../../shared/types';

describe('useButtonRemappingSubTabs', () => {
  const mockRuntime = {
    snapshot: {
      settings: {
        touchpadSettings: { ...DEFAULT_TOUCHPAD_SETTINGS },
        turboSettings: { ...DEFAULT_TURBO_SETTINGS }
      }
    },
    runAction: vi.fn()
  } as any;

  it('initializes with buttons subtab and switches tabs', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    expect(result.current.remappingSubTab).toBe('buttons');

    act(() => {
      result.current.setRemappingSubTab('turbo');
    });
    expect(result.current.remappingSubTab).toBe('turbo');

    act(() => {
      result.current.setRemappingSubTab('touchpad');
    });
    expect(result.current.remappingSubTab).toBe('touchpad');
  });

  it('updates turbo settings and triggers bridge action', () => {
    const { result } = renderHook(() => useButtonRemappingSubTabs(mockRuntime));
    act(() => {
      result.current.turboProps.handleSetTurboInterval(100);
    });
    expect(mockRuntime.runAction).toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run companion/src/renderer/features/button-remapping/subtabs-controller.test.ts`
Expected: FAIL due to missing `use-button-remapping-subtabs.ts`.

- [x] **Step 3: Implement `useButtonRemappingSubTabs`**

Create `companion/src/renderer/features/button-remapping/use-button-remapping-subtabs.ts` extracting touchpad & turbo state and actions cleanly from `useRemappingState.ts`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run companion/src/renderer/features/button-remapping/subtabs-controller.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add companion/src/renderer/features/button-remapping/
git commit -m "feat(remapping): add subtabs state controller hook for touchpad and turbo"
```

---

### Task 2: Mount Sub-Tabs inside ButtonRemappingPage

**Files:**
- Modify: `companion/src/renderer/features/button-remapping/ButtonRemappingPage.tsx:30-120`
- Test: `companion/src/renderer/features/button-remapping/ButtonRemappingPage.rendered.test.tsx`

**Interfaces:**
- Consumes: `useButtonRemappingSubTabs` from Task 1
- Produces: Rendered sub-tab navigation (`Buttons`, `Touchpad`, `Turbo`) and view switching in `ButtonRemappingPage`

- [x] **Step 1: Write test for ButtonRemappingPage sub-tab switching**

Add test assertions in `companion/src/renderer/features/button-remapping/ButtonRemappingPage.rendered.test.tsx`:
```typescript
it('renders subtab buttons and displays Turbo / Touchpad views on click', async () => {
  // Test that clicking "Touchpad" and "Turbo" subtabs displays corresponding sections
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run companion/src/renderer/features/button-remapping/ButtonRemappingPage.rendered.test.tsx`
Expected: FAIL (subtabs not rendered yet).

- [x] **Step 3: Implement Sub-Tabs in `ButtonRemappingPage.tsx`**

Integrate:
- Sub-tab pill selector (`Buttons`, `Touchpad`, `Turbo`) under the feature heading.
- Render conditional view:
  - `remappingSubTab === 'buttons'`: Existing physical button layout and callout lines.
  - `remappingSubTab === 'touchpad'`: `<RemappingTouchpadSubTab {...touchpadProps} />`.
  - `remappingSubTab === 'turbo'`: `<RemappingTurboSubTab {...turboProps} />`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run companion/src/renderer/features/button-remapping/ButtonRemappingPage.rendered.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add companion/src/renderer/features/button-remapping/ButtonRemappingPage.tsx
git commit -m "feat(remapping): add Touchpad and Turbo sub-tabs to ButtonRemappingPage"
```

---

### Task 3: Integrate Kitsune-Bar & PS Debounce into Settings

**Files:**
- Modify: `companion/src/renderer/features/settings/ControllerBridgeSettings.tsx:140-200`
- Modify: `companion/src/renderer/features/settings/types.ts`
- Modify: `companion/src/renderer/features/settings/use-settings-page-controller.ts`
- Test: `companion/src/renderer/features/settings/ControllerBridgeSettings.rendered.test.tsx`

**Interfaces:**
- Consumes: `snapshot.settings.psButtonDebounceMs`, `kitsuneBarEnabled`
- Produces: Settings controls for Kitsune-Bar overlay and PS button debounce

- [x] **Step 1: Add unit tests for Kitsune-Bar settings**

Add test in `companion/src/renderer/features/settings/ControllerBridgeSettings.rendered.test.tsx` verifying Kitsune Bar and PS button debounce toggle rows render and respond to events.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run companion/src/renderer/features/settings/ControllerBridgeSettings.rendered.test.tsx`
Expected: FAIL.

- [x] **Step 3: Implement Kitsune Bar and PS debounce in ControllerBridgeSettings**

Add setting rows:
- `Kitsune Bar Overlay`: Toggles overlay service.
- `PS Button Debounce`: Slider or select for debounce ms.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run companion/src/renderer/features/settings/ControllerBridgeSettings.rendered.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add companion/src/renderer/features/settings/
git commit -m "feat(settings): add Kitsune-Bar and PS debounce settings controls"
```

---

### Task 4: Full App Build & Verification

**Files:**
- Modify: None (verification step)
- Test: Full test suite & build check

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck` in `companion/`
Expected: No errors.

- [ ] **Step 2: Run test suite**

Run: `npm run test:companion` in `companion/`
Expected: All tests pass.

- [ ] **Step 3: Build Companion application**

Run: `npm run build` in `companion/`
Expected: Build succeeds with `dist/` updated.

- [ ] **Step 4: Final commit and push**

```bash
git push origin port-dev
```

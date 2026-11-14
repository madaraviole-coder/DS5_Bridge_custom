# Kitsune Bar Trigger Separation, Gamepad Focus & Standalone Sidebar Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the collision between Kitsune Bar and Turbo rapid-fire by requiring a 1.0s hold on the PS button, suppress game inputs while Kitsune Bar is open while enabling gamepad navigation in the overlay, and add a standalone Kitsune Bar configuration page to the companion sidebar.

**Architecture:**
- **Firmware:** `src/companion.cpp` changes PS button queueing from tap to 1.0s hold, adds `CommandSetInputSuppressed = 0x48`, neutralizes USB reports to PC while active, and generates navigation events from D-pad and face buttons.
- **Companion Main:** `controller-shortcut-service.ts` adds a 1.0s hold timer for node-hid, `bridge-service.ts` routes suppression and navigation events, and `main.ts` suppresses inputs when the overlay window is visible.
- **Companion Renderer:** `KitsuneBarOverlay.tsx` listens for navigation events to highlight and activate modules, while `ShellSidebar.tsx` and `control-tabs.tsx` add a standalone sidebar tab for `KitsuneBarPage`.

**Tech Stack:** C++ (Pico SDK / TinyUSB), TypeScript, Node.js / Electron, React 19, Vitest.

## Global Constraints

- Do not break existing Turbo double-tap behavior in `src/turbo_controller.cpp`.
- Preserve existing button remapping, touch zones, and upstream v2.0.1 layouts.
- `npm run typecheck` and `npm run test:companion` must pass cleanly without regressions.
- All new UI strings must pass localization catalog checks.
- Do NOT run `git push` without explicit user permission.

---

### Task 1: Firmware 1.0s PS Hold, Input Suppression & Navigation Events

**Files:**
- Modify: `src/companion.cpp:180-220, 3060-3100, 3810-3940`
- Modify: `src/companion.h:80-95`
- Test: Build firmware with cmake/ninja

**Interfaces:**
- Consumes: `report` from `companion_process_controller_report(uint8_t *report, uint16_t len)`
- Produces: `CommandSetInputSuppressed = 0x48`, `ShortcutEventNavLeft = 0x07`, `ShortcutEventNavRight = 0x08`, `ShortcutEventNavUp = 0x09`, `ShortcutEventNavDown = 0x0A`, `ShortcutEventNavSelect = 0x0B`, `ShortcutEventNavCancel = 0x0C`

- [ ] **Step 1: Define opcodes and events in `src/companion.cpp`**

In `src/companion.cpp`:
```cpp
enum CompanionCommand : uint8_t {
    // ...
    CommandSetTouchpadZoneConfig = 0x46,
    CommandSetTurboConfig = 0x47,
    CommandSetInputSuppressed = 0x48,
    // ...
};

enum ShortcutEvent : uint8_t {
    ShortcutEventControllerVolumeDown = 0x01,
    ShortcutEventControllerVolumeUp = 0x02,
    ShortcutEventSleepController = 0x03,
    ShortcutEventMicMuteOn = 0x04,
    ShortcutEventMicMuteOff = 0x05,
    ShortcutEventPsButton = 0x06,
    ShortcutEventNavLeft = 0x07,
    ShortcutEventNavRight = 0x08,
    ShortcutEventNavUp = 0x09,
    ShortcutEventNavDown = 0x0A,
    ShortcutEventNavSelect = 0x0B,
    ShortcutEventNavCancel = 0x0C,
};
```

- [ ] **Step 2: Add `s_input_suppressed` command handler in `src/companion.cpp`**

```cpp
static bool s_input_suppressed = false;

// Inside companion command switch:
case CommandSetInputSuppressed:
    s_input_suppressed = (value != 0);
    set_ack(command_id, sequence, AckOk);
    return;
```

- [ ] **Step 3: Implement 1.0s PS hold timer and input suppression in `companion_process_controller_report`**

In `src/companion.cpp`:
```cpp
    // PS Home button 1.0s hold -> queue ShortcutEventPsButton
    static uint32_t s_home_press_start_us = 0;
    static bool s_home_hold_triggered = false;

    if (home_pressed) {
        if (s_home_press_start_us == 0) {
            s_home_press_start_us = now;
            s_home_hold_triggered = false;
        } else if (!s_home_hold_triggered && static_cast<int32_t>(now - s_home_press_start_us) >= 1000000) {
            s_home_hold_triggered = true;
            if (!home_chord_consumed && !s_laptop_mode_chord_latched) {
                queue_shortcut_event(ShortcutEventPsButton);
            }
        }
    } else {
        s_home_press_start_us = 0;
        s_home_hold_triggered = false;
    }

    // Input suppression & overlay gamepad navigation
    if (s_input_suppressed) {
        static uint8_t s_prev_dpad = 0x08;
        static bool s_prev_cross = false;
        static bool s_prev_circle = false;

        const uint8_t cur_dpad = report[7] & kDpadMask;
        const bool cur_cross = (report[7] & 0x20) != 0;
        const bool cur_circle = (report[7] & 0x40) != 0;

        if (cur_dpad != s_prev_dpad) {
            if (cur_dpad == 6) queue_shortcut_event(ShortcutEventNavLeft);
            else if (cur_dpad == 2) queue_shortcut_event(ShortcutEventNavRight);
            else if (cur_dpad == 0) queue_shortcut_event(ShortcutEventNavUp);
            else if (cur_dpad == 4) queue_shortcut_event(ShortcutEventNavDown);
        }
        if (cur_cross && !s_prev_cross) queue_shortcut_event(ShortcutEventNavSelect);
        if (cur_circle && !s_prev_circle) queue_shortcut_event(ShortcutEventNavCancel);

        s_prev_dpad = cur_dpad;
        s_prev_cross = cur_cross;
        s_prev_circle = cur_circle;

        // Neutralize output to PC game
        report[0] = 128; report[1] = 128;
        report[2] = 128; report[3] = 128;
        report[4] = 0;   report[5] = 0;
        report[7] = 0x08;
        report[8] = 0;
        report[9] &= ~0x01; // suppress home to host while suppressed
    }
```

- [ ] **Step 4: Verify firmware compilation**

Run: `ninja -C build` (or `cmake --build build`)
Expected: ds5-bridge compiles cleanly.

- [ ] **Step 5: Commit changes locally**

```bash
git add src/companion.cpp src/companion.h
git commit -m "feat(firmware): add 1.0s PS hold trigger and input suppression for Kitsune Bar"
```

---

### Task 2: Controller Shortcut Service & Bridge Service Hold / Nav Routing

**Files:**
- Modify: `companion/src/main/controller-shortcut-service.ts`
- Modify: `companion/src/main/bridge-service.ts`
- Modify: `companion/src/main/main.ts`
- Modify: `companion/src/preload.ts`
- Modify: `companion/src/renderer/web-bridge-types.ts`
- Test: `companion/src/main/controller-shortcut-service.test.ts`

**Interfaces:**
- Consumes: Node-hid packets in `controller-shortcut-service.ts`, `ShortcutEvent` in `bridge-service.ts`
- Produces: `bridge:setInputSuppressed`, `window.bridge.onKitsuneNav((event: string) => void)`

- [ ] **Step 1: Write unit test for `controller-shortcut-service.ts` hold behavior**

Create or update test verifying a 400ms tap does not emit `ps-button`, but a $\ge 1000\text{ms}$ press does emit `ps-button`.

- [ ] **Step 2: Update `controller-shortcut-service.ts` to implement 1.0s hold timer**

```typescript
private psHoldTimer: NodeJS.Timeout | null = null;
public static readonly PS_HOLD_DURATION_MS = 1000;

public handleReport(data: Buffer): void {
  const isPressed = ControllerShortcutService.parsePsButtonState(data, this.activePid);

  if (!this.wasPsPressed && isPressed) {
    if (this.psHoldTimer) clearTimeout(this.psHoldTimer);
    this.psHoldTimer = setTimeout(() => {
      this.psHoldTimer = null;
      this.emit('ps-button');
    }, ControllerShortcutService.PS_HOLD_DURATION_MS);
  } else if (this.wasPsPressed && !isPressed) {
    if (this.psHoldTimer) {
      clearTimeout(this.psHoldTimer);
      this.psHoldTimer = null;
    }
  }

  this.wasPsPressed = isPressed;
}
```

- [ ] **Step 3: Add `setInputSuppressed` and nav routing in `bridge-service.ts` and `main.ts`**

In `bridge-service.ts`:
```typescript
async setInputSuppressed(suppressed: boolean): Promise<boolean> {
  return this.transport.sendCompanionCommand(0x48, suppressed ? 1 : 0);
}
```
Route nav shortcut events (`0x07` to `0x0C`) to `kitsuneBarWindow.webContents.send('kitsune:nav', navType)`.

In `main.ts`:
When `toggleKitsuneBar()` shows window: `void service.setInputSuppressed(true);`
When `kitsuneBarWindow.hide()` or close: `void service.setInputSuppressed(false);`

- [ ] **Step 4: Update `preload.ts` and `web-bridge-types.ts`**

Expose:
```typescript
onKitsuneNav: (callback: (nav: 'left' | 'right' | 'up' | 'down' | 'select' | 'cancel') => void) => () => void;
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/main/`
Expected: PASS.

- [ ] **Step 6: Commit changes locally**

```bash
git add companion/src/main/ companion/src/preload.ts companion/src/renderer/web-bridge-types.ts
git commit -m "feat(companion): add 1.0s hold detection, input suppression IPC, and nav event routing"
```

---

### Task 3: Gamepad Navigation in `KitsuneBarOverlay.tsx`

**Files:**
- Modify: `companion/src/renderer/components/layout/KitsuneBarOverlay.tsx`
- Test: `companion/src/renderer/components/layout/KitsuneBarOverlay.rendered.test.tsx`

**Interfaces:**
- Consumes: `window.bridge.onKitsuneNav`
- Produces: Visual module highlight, layer switching, flyout activation, and dismissal

- [ ] **Step 1: Write test for overlay gamepad navigation**

Add test verifying `onKitsuneNav` calls change selected module and trigger flyouts.

- [ ] **Step 2: Implement navigation state and listener in `KitsuneBarOverlay.tsx`**

```typescript
const [focusedIndex, setFocusedIndex] = useState(0);

useEffect(() => {
  const unsubscribe = window.bridge.onKitsuneNav?.((nav) => {
    if (nav === 'left') {
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : layerItems.length - 1));
    } else if (nav === 'right') {
      setFocusedIndex((prev) => (prev < layerItems.length - 1 ? prev + 1 : 0));
    } else if (nav === 'up') {
      cycleLayer('up');
    } else if (nav === 'down') {
      cycleLayer('down');
    } else if (nav === 'select') {
      const target = layerItems[focusedIndex];
      if (target) handleModuleClick(target);
    } else if (nav === 'cancel') {
      if (activeFlyout) setActiveFlyout(null);
      else handleClose();
    }
  });
  return () => {
    unsubscribe?.();
  };
}, [layerItems, focusedIndex, activeFlyout]);
```

- [ ] **Step 3: Run test**

Run: `npx vitest run src/renderer/components/layout/KitsuneBarOverlay`
Expected: PASS.

- [ ] **Step 4: Commit changes locally**

```bash
git add companion/src/renderer/components/layout/KitsuneBarOverlay.tsx
git commit -m "feat(overlay): add controller gamepad navigation to KitsuneBarOverlay"
```

---

### Task 4: Standalone Kitsune Bar Sidebar Tab in Companion App

**Files:**
- Modify: `companion/src/renderer/features/shell/control-tabs.tsx`
- Modify: `companion/src/renderer/features/shell/ShellSidebar.tsx`
- Modify: `companion/src/renderer/App.tsx`
- Test: `companion/src/renderer/app-behavior.test.ts`

**Interfaces:**
- Consumes: `ControlTab = ... | 'kitsune-bar'`
- Produces: Standalone tab button in `ShellSidebar` and `<KitsuneBarPage />` rendering in `App.tsx`

- [ ] **Step 1: Add `'kitsune-bar'` tab definition in `control-tabs.tsx`**

```typescript
import { IconLayoutNavbar } from '@tabler/icons-react';

export type ControlTab =
  | 'overview'
  | 'kitsune-bar'
  // ...

export const CONTROL_TAB_DEFINITIONS = {
  overview: { id: 'overview', label: 'Overview', Icon: IconLayoutDashboard },
  'kitsune-bar': { id: 'kitsune-bar', label: 'Kitsune Bar', Icon: IconLayoutNavbar },
  // ...
};
```

- [ ] **Step 2: Render standalone `kitsune-bar` button in `ShellSidebar.tsx`**

In `ShellSidebar.tsx`:
```tsx
<div className="control-tab-list">
  {renderTabButton(CONTROL_TAB_DEFINITIONS.overview)}
  {renderTabButton(CONTROL_TAB_DEFINITIONS['kitsune-bar'])}
  {CONTROL_TAB_GROUPS.map(...)}
</div>
```

- [ ] **Step 3: Render `KitsuneBarPage` in `App.tsx`**

In `App.tsx`:
Import `KitsuneBarPage` from `./pages/KitsuneBarPage`.
When `activeControlTab === 'kitsune-bar'`, render `<KitsuneBarPage active={true} snapshot={snapshot} connected={connected} />`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/renderer/app-behavior.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes locally**

```bash
git add companion/src/renderer/features/shell/ companion/src/renderer/App.tsx
git commit -m "feat(navigation): add standalone Kitsune Bar tab to companion sidebar"
```

---

### Task 5: Localization & Full App Verification

**Files:**
- Modify: `companion/src/renderer/common/localization/locales/*.json` if needed.
- Test: Full build and typecheck.

- [ ] **Step 1: Run localization sync and checks**

Run: `npm run localize:extract && npm run localize:check` in `companion/`
Expected: Localization master is current.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` in `companion/`
Expected: 0 errors.

- [ ] **Step 3: Run full companion test suite**

Run: `npm run test:companion` in `companion/`
Expected: All tests pass.

- [ ] **Step 4: Build companion app**

Run: `npm run build` in `companion/`
Expected: Build succeeds.

- [ ] **Step 5: Final local commit (DO NOT push without asking)**

```bash
git commit -m "chore: complete Kitsune Bar trigger separation and focus implementation"
```

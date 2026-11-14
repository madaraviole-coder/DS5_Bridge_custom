# Kitsune Bar Trigger Separation, Gamepad Focus & Standalone Sidebar Menu Design

## Summary
Kitsune Bar overlay previously clashed with the controller's rapid-fire Turbo feature when using the PS (Home) button, and gamepad inputs were passed through to background games while the overlay was open. Additionally, the full configuration page for Kitsune Bar was omitted from the v2 sidebar. This design provides:
1. Trigger separation: PS button hold ($\ge 1.0\text{s}$) exclusively triggers Kitsune Bar toggle; double-tap ($\le 450\text{ms}$) remains exclusively for Turbo arming.
2. Gamepad navigation inside `KitsuneBarOverlay` with input suppression so background games do not receive inputs while the overlay is open.
3. Standalone sidebar menu for `Kitsune Bar` in the Companion UI adjacent to `Overview`.

---

## 1. Trigger Separation (Turbo vs Kitsune Bar)

### Problem
- `src/turbo_controller.cpp` listens for rising edges on the PS/Home button. Double-pressing within 450ms activates Turbo arming mode.
- `controller-shortcut-service.ts` previously emitted `ps-button` on any single PS button press (with 350ms debounce).
- Tapping the PS button to arm Turbo triggered Kitsune Bar opening/closing simultaneously.

### Solution
- In `companion/src/main/controller-shortcut-service.ts`:
  - When the PS button is pressed down, start a 1000ms hold timer.
  - If the PS button is released before 1000ms has elapsed (such as during a single tap or double tap for Turbo), the timer is cleared and no `ps-button` toggle event is emitted.
  - If the PS button remains held for $\ge 1000\text{ms}$, emit the `ps-button-hold` event which calls `toggleKitsuneBar()`.
  - Haptic / lightbar feedback or an audio chime indicates when the hold threshold is reached.
- In `src/turbo_controller.cpp`:
  - Retain the $\le 450\text{ms}$ double-tap detection for arming Turbo.

---

## 2. Input Suppression & Overlay Gamepad Navigation

### Input Suppression (Zero Out Gamepad to PC Games)
- When `kitsuneBarWindow` becomes visible:
  - Companion invokes `window.bridge.setInputSuppressed(true)` via IPC handler `bridge:setInputSuppressed`.
  - In firmware / bridge communication (or synthetic USB HID layer), controller input reports delivered to the host OS have buttons masked to zero and thumbsticks centered (neutral $X=128, Y=128$) so game characters do not move or fire while the player interacts with Kitsune Bar.
  - Raw controller HID reports continue to stream to the Companion app so the overlay can capture user input.
- When `kitsuneBarWindow` is hidden / closed:
  - Companion invokes `window.bridge.setInputSuppressed(false)`.
  - Normal gamepad passthrough to PC games immediately resumes.

### Gamepad Navigation in `KitsuneBarOverlay.tsx`
- The overlay hooks into `navigator.getGamepads()` (or Companion IPC controller events) in an active frame loop:
  - **D-Pad Left / Right:** Navigate and highlight modules in the active layer.
  - **D-Pad Up / Down:** Switch between Layer 1 and Layer 2.
  - **Cross (X) / Button 0:** Activate / toggle selected flyout or action.
  - **Circle (O) / Button 1:** Close the currently open flyout; if no flyout is open, close Kitsune Bar.
  - **Hold PS Button ($\ge 1.0\text{s}$):** Direct quick close of Kitsune Bar.

---

## 3. Standalone Sidebar Navigation in Companion

### Sidebar Tab Configuration
- In `companion/src/renderer/features/shell/control-tabs.tsx`:
  - Add `'kitsune-bar'` to `ControlTab` union type.
  - Define `CONTROL_TAB_DEFINITIONS['kitsune-bar']`:
    - `id: 'kitsune-bar'`
    - `label: 'Kitsune Bar'`
    - `Icon: IconLayoutNavbar` (or `IconSparkles`)
  - Add `CONTROL_TAB_DEFINITIONS['kitsune-bar']` to `CONTROL_TABS` as a standalone tab located below `overview`.
- In `companion/src/renderer/features/shell/ShellSidebar.tsx`:
  - Render the `kitsune-bar` tab button alongside `overview` before the collapsible control groups.
- In `companion/src/renderer/App.tsx`:
  - Wire `activeControlTab === 'kitsune-bar'` to render `<KitsuneBarPage />` with full configuration props (`snapshot`, `connected`, and action handlers for items, shortcuts, layers, and debounce).

---

## 4. Verification & Testing

1. **Unit & Rendered Tests:**
   - Test hold-timing logic in `controller-shortcut-service.test.ts`: verify releases $<1000\text{ms}$ do not trigger, while hold $\ge 1000\text{ms}$ triggers.
   - Test sidebar tab presence in `control-tabs.test.ts` and `ShellSidebar.rendered.test.tsx`.
   - Test gamepad navigation handlers in `KitsuneBarOverlay.test.tsx`.
2. **Typecheck & Localization:**
   - Run `npm run typecheck` to verify complete type conformance.
   - Run `npm run test:companion` to ensure all 93+ test suites pass without regression.
   - Run `npm run build` to confirm clean production packaging.

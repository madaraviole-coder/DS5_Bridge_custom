# Design Spec: Restoring Custom Features on Upstream v2.0.1 Architecture

## Context & Motivation
Following the upstream sync merge (`cc56412`) bringing DS5 Bridge v2.0.1 features into branch `port-dev`, several custom features previously present in `fa76fdd` became inaccessible from the companion UI. Upstream v2 restructured the UI into modular feature domains under `src/renderer/features/`. While firmware backends (`turbo_controller.cpp`, `touchpad_zone.cpp`, `touchpad_mouse.cpp`), IPC channels, and settings store properties were preserved, the frontend UI components and wiring were bypassed.

This design restores full access to all custom features (**Turbo Mode**, **Touchpad 4-Zone & Mouse**, **Kitsune-Bar Shortcuts**, **Game Profile Auto-Switching**, and **WebHID/WebUSB**) while maintaining compliance with upstream v2.0.1 modular architecture and UI design patterns.

---

## Architecture & Integration Plan

### 1. Button Remapping Sub-Tabs (Buttons, Touchpad, Turbo)
- **Component Placement:** Inside `companion/src/renderer/features/button-remapping/ButtonRemappingPage.tsx`.
- **Sub-Tab Navigation Bar:**
  - Adds sub-tab navigation buttons under the header:
    - **Buttons:** Physical layout mapping (current upstream DualSense/Edge view).
    - **Touchpad:** Mode switcher (4-Zone vs Mouse Mode), Deadzone slider, Gestures configuration, and Zone mapping (NW, NE, SW, SE).
    - **Turbo:** Master switch, Speed slider (2-30 CPS), Humanize toggle, Turbo Button Selector chips, and interactive Tester Meter.
- **State Management:**
  - Enhance `use-button-remapping-controller.ts` or pair it with `useTurboTouchpadState` to expose:
    - `touchpadSettings` & `setTouchpadConfig` (via `window.bridge.setTouchpadZoneConfig`).
    - `turboSettings` & `setTurboConfig` (via `window.bridge.setTurboConfig`).
    - Local test state for the interactive Turbo speed tester.
- **Visuals & Assets:**
  - Reuse `RemappingTouchpadSubTab.tsx` and `RemappingTurboSubTab.tsx`, styled with existing CSS classes (`.turbo-*`, `.touchpad-*`, `.multi-actions-container`).

---

### 2. Kitsune-Bar & Controller Shortcut Services
- **Integration Point:**
  - Exposed through the Settings page (`features/settings/SettingsPage.tsx`) under a dedicated **Kitsune Bar & Shortcuts** section, with access to `KitsuneBarModal.tsx`.
- **Functionality:**
  - Toggle background controller shortcut capture service.
  - PS button debounce time control to prevent unintended double-taps/drops.
  - Quick launcher shortcut configurations.

---

### 3. Game Profile Auto-Switching
- **Integration Point:**
  - Re-enable the foreground window watcher in `companion/src/main/` (`ForegroundProcessMonitor`).
  - Wire auto-profile association from settings: matching executable name triggers `bridge:selectButtonRemappingProfile` / `bridge:selectControllerProfile`.
  - UI entry in Settings and profile modal (`GameProfilesModal.tsx`).

---

### 4. WebHID & WebUSB Support
- Verify and maintain clean exports in `web-bridge-adapter.ts` and `vite.config.ts`.
- Ensure desktop Electron builds (`npm run build:app`) and browser build (`npm run build:web`) operate independently without dependency conflicts.

---

## Error Handling & Resilience
- **Disconnected Bridge Fallback:** UI disables live testing triggers and displays appropriate offline tooltips when no bridge is detected.
- **Safe Defaults:** If invalid JSON or null config is read from `companion-settings.json`, default fallback objects (`DEFAULT_TURBO_SETTINGS`, `DEFAULT_TOUCHPAD_SETTINGS`) are cleanly loaded without crash.
- **No Performance Regression:** Lazy-load sub-tab components to maintain rapid initial window render time under 100ms.

---

## Verification & Testing
1. **TypeScript Typecheck:** `npm run typecheck` passes with zero errors.
2. **Component & Unit Tests:** `npm run test:companion` passes all suites.
3. **Build Output:** `npm run build` succeeds cleanly.
4. **Interactive Verification:**
   - Launch `npm run dev` and confirm sub-tabs "Buttons", "Touchpad", and "Turbo" appear in Button Remapping.
   - Adjusting Turbo CPS slider and toggling buttons updates state and triggers IPC bridge calls.
   - Touchpad zone mapping changes sync to companion settings.

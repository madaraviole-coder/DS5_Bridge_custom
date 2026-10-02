# Original User Request

## Initial Request — 2026-09-30T18:49:01Z

Refactor and upgrade the DS5 Bridge Companion UI and architecture to production grade by modularizing the monolithic UI, strictly aligning all views with the UI Style Guide, and hardening state and error handling. Use a full multi-agent team to execute parallel review, modularization, and verification workstreams.

Working directory: g:\Documents\GitHub\DS5_Bridge_custom\companion
Integrity mode: development

## Requirements

### R1. UI Modularization & Architectural Decomposition
Refactor the monolithic renderer UI (`App.tsx`) by decomposing domain tabs (including Overview, Devices, Haptics, Audio, Triggers, Lighting, Deadzones, Remapping, Chords, and System) into dedicated modular components and domain-scoped hooks, preserving all existing user-facing behavior, device telemetry, and IPC communication.

### R2. Design System & UI Style Guide Alignment
Ensure all control tabs strictly comply with `UI_STYLE_GUIDE.md`, standardizing layout tokens, paired feature card geometry, slotted button positions, custom select usage, and responsive styling with zero visual clipping or uncontrolled overflows.

### R3. State Resilience & Error Handling
Decouple UI presentation from bridge transport and device telemetry states, ensuring robust error boundary protection, graceful handling of device connection/disconnection/reconnection cycles, and clear user-facing feedback for all hardware actions.

## Acceptance Criteria

### Automated Verification
- [ ] `npm run typecheck` succeeds with zero errors across main and renderer TypeScript configurations.
- [ ] `npm run test:companion` passes 100% of tests with no regressions (339+ tests passing).
- [ ] `npm run build:app` succeeds without errors.
- [ ] Monolithic UI reduction: No single React component or source file in `src/renderer/` exceeds 1,000 lines of code.

### UI & Layout Compliance
- [ ] `npm run layout:check` completes with zero layout tolerance or overflow failures.
- [ ] All feature tabs adhere to `UI_STYLE_GUIDE.md` specifications for card heights, grid tokens, and custom control components.
- [ ] Device connection, disconnection, and reconnection transitions handle cleanly without unhandled exceptions or blank screens.

## Verification Resources
- Test suite: `npm run test:companion`
- Type verification: `npm run typecheck`
- Application build: `npm run build:app`
- Layout automation: `npm run layout:check`
- Style contract: `UI_STYLE_GUIDE.md`

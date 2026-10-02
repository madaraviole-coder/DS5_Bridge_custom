# Orchestrator Execution Plan: DS5 Bridge Companion UI Modularization

## Objective
Decompose monolithic `App.tsx`, align all views with `UI_STYLE_GUIDE.md`, decouple state and error handling, and verify all automated acceptance criteria (zero typecheck errors, 100% test pass >=339, build:app succeeds, all src/renderer files <1000 LOC, layout:check zero failures).

## Phase 0: Survey Phase
- Spawn 3 parallel investigators:
  1. `explorer_survey_app`: Analyze `App.tsx`, state, hooks, IPC, telemetry, domain tabs (Overview, Devices, Haptics, Audio, Triggers, Lighting, Deadzones, Remapping, Chords, System), and existing component structures.
  2. `spec_miner_style`: Analyze `UI_STYLE_GUIDE.md`, layout rules, tokens, cards, slots, custom controls, and `npm run layout:check` requirements.
  3. `explorer_survey_test`: Analyze existing test harness (`npm run test:companion`, tests in `src/` or `test/`), verification commands, build configurations, and current baseline test suite.
- Merge survey findings into complete Feature Inventory and Architecture in `PROJECT.md`.

## Phase 1: Architecture & Decomposition (PROJECT.md)
- Define modular architecture, directory layout in `src/renderer/`, domain boundaries, shared hooks, UI token imports, error boundary layer.
- Group domain tabs into logical, independent milestones with clear interface contracts and file boundaries.
- Cross-check Feature Inventory to ensure every feature is mapped to a milestone.

## Phase 2: Dual Track Dispatch
- Track 1 (Implementation): Sub-orchestrators for milestones (e.g. Design System & Layout Foundation, Domain Tab Modularization, State Resilience & IPC Hooks).
- Track 2 (Testing): E2E Testing Orchestrator ensuring opaque-box test runner and verification suite (Tiers 1-4).

## Phase 3: Milestone Gate Execution & Synthesis
- Monitor sub-orchestrators and enforce iteration loop (Explorer -> Worker -> Reviewer x2 -> Challenger x2 -> Forensic Auditor).
- Maintain `GATE_STATUS.md` and `DEAD_ENDS.md`.

## Phase 4: Final Milestone & Acceptance Signoff
- Phase 1: 100% pass of E2E tests and companion tests (>=339).
- Phase 2: Adversarial coverage hardening.
- Automated checks: typecheck, build:app, layout:check, line-count verification (<1000 LOC per file in renderer).

## Phase 5: Handoff & Completion
- Write final handoff and send completion report to parent.

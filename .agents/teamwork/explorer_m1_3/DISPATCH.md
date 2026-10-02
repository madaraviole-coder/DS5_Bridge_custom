## 2026-09-30T19:00:17Z
You are teamwork_preview_explorer.
Working directory: g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_3
Target codebase: g:\Documents\GitHub\DS5_Bridge_custom\companion
Parent: orchestrator_1 (conversation ID: ae5da474-6157-4cca-a465-1593e8a9eedc)

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\PROJECT.md

Task for Milestone 1 (M1) — Layout Check & Test Guard Synchronization:
1. Examine `companion/scripts/layout-check.mjs` and `companion/scripts/visual-smoke.mjs`.
2. Identify why `npm run layout:check` failed:
   - `<nav className="control-tabs" aria-label="Controls">` in `App.tsx` (line 7452) is missing `role="tablist"`.
   - Sidebar tab groups are collapsed by default after commit 9548037. Compare how `visual-smoke.mjs` expands groups vs `layout-check.mjs`.
3. Design the exact fix for `App.tsx` (`role="tablist"`) and `scripts/layout-check.mjs` so `npm run layout:check` completes with zero layout tolerance or overflow failures.
4. Review `companion/src/renderer/app-behavior.test.ts` and `styles-layout.test.ts`:
   - Map all assertions that inspect `App.tsx` via `readFileSync`.
   - Detail how these test files should be maintained during component extraction (e.g. aggregating sources or importing modular components) so 100% of tests pass.
5. Write your report to `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_3\report.md` and handoff to `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_3\handoff.md`, then send a message back.

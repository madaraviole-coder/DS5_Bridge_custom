## 2026-09-30T19:00:17Z
You are teamwork_preview_explorer.
Working directory: g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_2
Target codebase: g:\Documents\GitHub\DS5_Bridge_custom\companion
Parent: orchestrator_1 (conversation ID: ae5da474-6157-4cca-a465-1593e8a9eedc)

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\PROJECT.md

Task for Milestone 1 (M1) — ErrorBoundary Architecture & CustomSelect Compliance:
1. Examine `companion/src/renderer/main.tsx` and `companion/src/renderer/App.tsx`.
2. Design a production-grade 2-tier `ErrorBoundary`:
   - `companion/src/renderer/components/common/ErrorBoundary.tsx`
   - Root tier wrapping `<App />` in `main.tsx` to prevent blank screens on fatal crashes.
   - Secondary tier wrapping active tab containers in `App.tsx` with friendly recovery ("Try Again" button).
3. Investigate the 3 native `<select>` tags in `App.tsx` (lines 11845, 11877, 11892 in Game Profiles modal).
   - Detail how to replace each with `<CustomSelect />` to comply with `UI_STYLE_GUIDE.md § Controls`.
   - Specify options data mapping, selection handlers, and accessible labels.
4. Formulate the exact implementation blueprint for Worker.
5. Write your report to `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_2\report.md` and handoff to `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_m1_2\handoff.md`, then send a message back.

## 2026-09-30T18:51:48Z
You are teamwork_preview_spec_miner.
Working directory: g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\spec_miner_style
Target codebase: g:\Documents\GitHub\DS5_Bridge_custom\companion
Parent: orchestrator_1 (conversation ID: ae5da474-6157-4cca-a465-1593e8a9eedc)

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Investigate and extract the exact specification requirements for the DS5 Bridge Companion UI design system and layout standards:
1. Examine `companion/UI_STYLE_GUIDE.md` and related design system files in the companion codebase (tokens, CSS/SCSS, component libraries, layout constants).
2. Extract all specifications regarding:
   - Paired feature card geometry and constraints (fixed/min heights, header slotting, padding)
   - Layout tokens (spacing, grid layout, container sizing)
   - Slotted button positions and control alignment
   - Custom select usage (replacing native HTML selects)
   - Zero clipping / uncontrolled overflow tolerance rules
   - Responsiveness rules and styling constraints
3. Check `companion/package.json` to see how `npm run layout:check` is implemented and executed, what script or test suite executes it, and what tolerances or rules it validates.
4. Document all findings, precise requirements, constraints, and acceptance criteria in:
`g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\spec_miner_style\report.md`
5. Write your handoff in `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\spec_miner_style\handoff.md` and send a message back to parent when done.

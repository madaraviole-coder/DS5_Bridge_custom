## 2026-09-30T18:51:48Z

You are teamwork_preview_explorer.
Working directory: g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_survey_test
Target codebase: g:\Documents\GitHub\DS5_Bridge_custom\companion
Parent: orchestrator_1 (conversation ID: ae5da474-6157-4cca-a465-1593e8a9eedc)

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Thoroughly explore the verification and test infrastructure of `companion`:
1. Check `companion/package.json` for all verification scripts:
   - `npm run typecheck`
   - `npm run test:companion`
   - `npm run build:app`
   - `npm run layout:check`
2. Run baseline checks (or inspect the test runners, config files, jest/vitest/playwright configs):
   - What test framework is used?
   - How are the 339+ tests organized?
   - Are there existing unit/component tests for renderer components?
   - How does `npm run layout:check` run, and what does it test?
   - What tsconfig files exist (main vs renderer)?
3. Identify potential test gaps or risks when refactoring `App.tsx` and creating modular tabs and domain hooks.
4. Propose an E2E and component test verification strategy to ensure zero regressions across all 339+ tests.
5. Document all findings in:
`g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_survey_test\report.md`
6. Write your handoff in `g:\Documents\GitHub\DS5_Bridge_custom\.agents\teamwork\explorer_survey_test\handoff.md` and send a message back to parent when done.

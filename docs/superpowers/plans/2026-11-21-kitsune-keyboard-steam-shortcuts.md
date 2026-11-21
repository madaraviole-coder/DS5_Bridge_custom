# Kitsune Keyboard Steam-like Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remap Kitsune Keyboard bindings to Steam-like shortcuts (Circle=shift, Square=backspace, Triangle=space, R2=enter; DONE closes) on a single layout, keeping MOVE/GYRO.

**Architecture:** Extend firmware/protocol with `NAV_KB_TRIANGLE` (`0x17`); update `handleKeyboardNavAction` results; wire overlay handlers; refresh key prompts in `KitsuneKeyboard` / layout cells.

**Tech Stack:** C++ firmware, TypeScript, React, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-21-kitsune-keyboard-steam-shortcuts-design.md`
- No multi-page layouts
- Do not break MOVE KEYBOARD / GYRO / dock nav outside keyboard
- Skip git commits unless user asks
- `npm run typecheck` + touched vitest must pass

---

### Task 1: Unit remap `handleKeyboardNavAction` + layout prompts

**Files:**
- Modify: `companion/src/renderer/components/layout/kitsune-bar-keyboard.ts`
- Modify: `companion/src/renderer/components/layout/kitsune-bar-keyboard.test.ts`

- [ ] Add `'kb-triangle'` to `KitsuneNavAction`; add `'space' | 'enter'` to `KeyboardNavResult`
- [ ] Remap: cancel→toggle-shift (not move mode); kb-square→backspace; kb-triangle→space; kb-r2→enter; move-mode cancel still `cancel`
- [ ] Update cell prompts: Abc `○`/`L2`, Backspace `□`, Space `△`, Enter `R2`, Done without R2
- [ ] Tests for new map; vitest PASS

### Task 2: Protocol + firmware Triangle event

**Files:**
- Modify: `protocol.ts`, `bridge-service.ts`, `preload.ts`, adapters/mocks
- Modify: `src/companion.cpp`

- [ ] `NAV_KB_TRIANGLE: 0x17` → emit `kitsune-nav` `'kb-triangle'`
- [ ] Firmware rising-edge Triangle when suppressed; reset prev when not suppressed

### Task 3: Overlay + keyboard UI wiring

**Files:**
- Modify: `KitsuneBarOverlay.tsx`, `KitsuneKeyboard.tsx` (+ tests if needed)

- [ ] Handle `space` / `enter` results; remove keyboard-open `cancel`→close (only move-mode exit)
- [ ] `kb-r2` no longer calls `handleKeyboardDone`
- [ ] Hint/prompts match spec
- [ ] typecheck + vitest touched files PASS

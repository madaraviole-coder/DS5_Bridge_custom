# Kitsune Bar & Keyboard Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Kitsune Bar/Keyboard to the “Made for the controller” mockup (white dock focus, blue key focus), extract shared presentational widgets, wire full keyboard controller bindings (incl. MOVE KEYBOARD + GYRO MOUSE), and add a live-preview showcase on `KitsuneBarPage`.

**Architecture:** Pure layout/helpers in `kitsune-bar-keyboard.ts`; presentational `KitsuneDockBar` + `KitsuneKeyboard`; overlay owns gamepad/IPC state; page embeds `variant="preview"`. New firmware shortcut events (0x11–0x16) for L1/R1/L2/R2/Square/L3+R3 while input is suppressed.

**Tech Stack:** TypeScript, React 19, Electron, Vitest, C++ (Pico companion firmware).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-15-kitsune-bar-keyboard-visual-parity-design.md`
- Dock/keyboard focus: white ring / `#3B82F6` (not orange)
- Showcase: live widgets only (no game screenshots)
- Do not break Turbo / PS-hold separation
- `npm run typecheck` and companion tests must pass
- Do NOT `git push` without explicit user permission
- Do NOT create git commits unless the user asks (user rule overrides plan commit steps — skip commits; leave working tree ready)

---

## File map

| File | Role |
|------|------|
| `companion/src/renderer/components/layout/kitsune-bar-keyboard.ts` | Layout, focus, binding helpers |
| `companion/src/renderer/components/layout/KitsuneKeyboard.tsx` | Presentational keyboard |
| `companion/src/renderer/components/layout/KitsuneDockBar.tsx` | Presentational dock |
| `companion/src/renderer/components/layout/KitsuneBarOverlay.tsx` | Overlay orchestration |
| `companion/src/renderer/pages/KitsuneBarPage.tsx` | Showcase section |
| `companion/src/renderer/styles.css` | Tokens + styles |
| `companion/src/shared/protocol.ts` | `SHORTCUT_EVENT` 0x11–0x16 |
| `companion/src/main/bridge-service.ts` | Emit extended `kitsune-nav` |
| `companion/src/preload.ts` + adapters/mocks | Nav union type |
| `src/companion.cpp` | Emit keyboard action events when suppressed |

---

### Task 1: Keyboard helpers + binding map (TDD)

**Files:**
- Modify: `companion/src/renderer/components/layout/kitsune-bar-keyboard.ts`
- Modify: `companion/src/renderer/components/layout/kitsune-bar-keyboard.test.ts`

**Interfaces:**
- Produces:
  - `export type KitsuneNavAction = 'left' | 'right' | 'up' | 'down' | 'select' | 'cancel' | 'kb-l1' | 'kb-r1' | 'kb-l2' | 'kb-r2' | 'kb-square' | 'kb-gyro'`
  - `export type KeyboardCell = { kind: 'char'; lower: string; upper: string } | { kind: 'action'; id: KeyboardActionId; label: string; prompt?: string }`
  - `export type KeyboardActionId = 'Shift' | 'Space' | 'Backspace' | 'Enter' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'GyroMouse' | 'Done' | 'Abc'`
  - `export function handleKeyboardNavAction(action: KitsuneNavAction, ctx: { moveMode: boolean }): 'move-focus' | 'caret-left' | 'caret-right' | 'toggle-shift' | 'backspace' | 'done' | 'toggle-gyro' | 'cancel' | 'select' | 'move-overlay' | 'ignore'`
  - Extended `KITSUNE_KEYBOARD_ROWS` with action row prompts (L1/R1/L2/R2/L3+R3/□)

- [x] **Step 1: Write failing tests** for `handleKeyboardNavAction` and action-row cells containing GyroMouse/Done/ArrowLeft with prompts

- [x] **Step 2: Run** `cd companion && npx vitest run src/renderer/components/layout/kitsune-bar-keyboard.test.ts` — expect FAIL

- [x] **Step 3: Implement** helpers + extend layout rows (keep QWERTY char rows; replace bottom action row with mockup-style actions including prompts)

- [x] **Step 4: Re-run tests** — expect PASS

---

### Task 2: `KitsuneKeyboard` presentational component

**Files:**
- Create: `companion/src/renderer/components/layout/KitsuneKeyboard.tsx`
- Create: `companion/src/renderer/components/layout/KitsuneKeyboard.test.tsx`
- Modify: `companion/src/renderer/styles.css` (keyboard tokens: blue focus `#3B82F6`, MOVE header, prompt glyphs)

**Interfaces:**
- Consumes: `KITSUNE_KEYBOARD_ROWS`, `cellLabel` from Task 1
- Produces:
```ts
export interface KitsuneKeyboardProps {
  variant: 'overlay' | 'preview';
  virtualText: string;
  shiftLatch: boolean;
  keyRow: number;
  keyCol: number;
  moveKeyboardMode: boolean;
  gyroMouseOn: boolean;
  gyroError?: string | null;
  onCellActivate?: (row: number, col: number) => void;
  onDone?: () => void;
  onToggleGyro?: () => void;
  onToggleMoveMode?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
}
```
- Preview: force focus on letter `k` (find row/col) when `variant === 'preview'`; ignore clicks for mutations if callbacks omitted

- [ ] **Step 1: Failing render test** — asserts `MOVE KEYBOARD`, `GYRO MOUSE`, `DONE`, class `overlay-key gamepad-focused` with blue styling class `kb-focus-blue`

- [ ] **Step 2: Implement component + CSS**

- [ ] **Step 3: Tests PASS**

---

### Task 3: `KitsuneDockBar` presentational component

**Files:**
- Create: `companion/src/renderer/components/layout/KitsuneDockBar.tsx`
- Create: `companion/src/renderer/components/layout/KitsuneDockBar.test.tsx`
- Modify: `companion/src/renderer/styles.css` — `.dock-item.gamepad-focused` → white outline box, no orange glow; bar surface `rgba(10,14,22,0.72)`

**Interfaces:**
```ts
export interface KitsuneDockBarProps {
  variant: 'overlay' | 'preview';
  layerItems: Array<{ id: string; name: string; icon: string }>;
  focusedIndex: number;
  activeFlyout: string | null;
  activeLayer: number;
  totalLayers: number;
  batteryPctText: string;
  isCharging: boolean;
  renderIcon: (iconName: string, size?: number) => React.ReactNode;
  onHome?: () => void;
  onProfiles?: () => void;
  onPs?: () => void;
  onModuleClick?: (id: string, index: number) => void;
  onLayerUp?: () => void;
  onLayerDown?: () => void;
  onSleep?: () => void;
  onClose?: () => void;
}
```
- Preview: default `focusedIndex` highlights a module (controller/gamepad) with white ring

- [ ] **Step 1: Failing test** for white-focus class presence / no orange on focused item

- [ ] **Step 2: Extract dock markup from overlay into component + CSS**

- [ ] **Step 3: Tests PASS**

---

### Task 4: Firmware + protocol keyboard action events

**Files:**
- Modify: `src/companion.cpp` (suppressed-input block ~3987–4070)
- Modify: `companion/src/shared/protocol.ts` — add:
  - `NAV_KB_L1: 0x11`, `NAV_KB_R1: 0x12`, `NAV_KB_L2: 0x13`, `NAV_KB_R2: 0x14`, `NAV_KB_SQUARE: 0x15`, `NAV_KB_GYRO: 0x16`
- Modify: `companion/src/main/bridge-service.ts` — map to `kitsune-nav` `'kb-l1'|...|'kb-gyro'`
- Modify: `companion/src/preload.ts`, `web-bridge-adapter.ts`, `e2e/mock-bridge.ts` — widen `onKitsuneNav` union

**Firmware behavior (rising edge while `s_input_suppressed`):**
- L1 → `0x11`, R1 → `0x12`, L2 digital → `0x13`, R2 digital → `0x14`, Square → `0x15`
- L3 && R3 both newly pressed (or both down on frame where either rose while other held) → `0x16` once per combo

Keep existing D-pad/stick nav, Cross/Circle, R-stick overlay move.

- [ ] **Step 1: Add protocol constants + bridge emit mapping + type unions**

- [ ] **Step 2: Emit events in `companion.cpp` suppressed block with prev-button state**

- [ ] **Step 3: Unit-test bridge mapping if existing shortcut tests pattern allows; otherwise typecheck**

---

### Task 5: Wire `KitsuneBarOverlay` to shared widgets + full bindings

**Files:**
- Modify: `companion/src/renderer/components/layout/KitsuneBarOverlay.tsx`
- Modify/create overlay tests as needed under `companion/src/renderer/`

**Behavior:**
- Replace inline dock + keyboard JSX with `<KitsuneDockBar variant="overlay" …>` and `<KitsuneKeyboard variant="overlay" …>`
- State: `moveKeyboardMode`, `gyroMouseOn`, `gyroError`
- On `onKitsuneNav`:
  - If keyboard flyout + `moveKeyboardMode` and nav is left/right/up/down → treat as overlay move is already via `kitsune-move`; for D-pad call nothing on focus — instead parent should ignore focus moves (handleKeyboardNavAction → `move-overlay` is N/A for D-pad if main already moved… Spec: D-pad moves window in move mode → emit is still nav left/right; overlay should call `window.bridge` move if exposed, OR rely on… wait: D-pad currently emits NavLeft not OverlayMove. So in move mode, overlay must call move API.)
  - Expose/use existing move: check if renderer has `moveKitsuneBar` IPC; if not, add `bridge:moveKitsuneBar` invoke mirroring main’s `moveKitsuneBar`
  - `kb-l1`/`kb-r1`: caret in `virtualText`
  - `kb-l2`: toggle shift
  - `kb-square` / cancel per spec (cancel: exit move mode else close)
  - `kb-r2` / Done: clipboard + close
  - `kb-gyro`: `setGyroSettings({ ...current, enabled: !enabled })` with rollback on failure
- Circle/`cancel`: if `moveKeyboardMode` → set false; else close flyout (update current cancel-as-backspace when text non-empty — spec says close flyout; prefer spec: cancel closes unless move mode)

- [ ] **Step 1: Add `moveKitsuneBar` to preload/bridge if missing**

- [ ] **Step 2: Refactor overlay to shared widgets + handlers**

- [ ] **Step 3: Tests for nav handlers (mock bridge)**

---

### Task 6: Companion showcase “Made for the controller”

**Files:**
- Modify: `companion/src/renderer/pages/KitsuneBarPage.tsx`
- Modify: `companion/src/renderer/KitsuneBarPage.test.tsx`
- Modify: `companion/src/renderer/styles.css` — showcase grid/cards/stage

**UI:**
```tsx
<section className="kitsune-made-for-controller">
  <h2>Made for the controller</h2>
  <div className="kitsune-showcase-grid">
    <article>… KitsuneDockBar variant="preview" … copy …</article>
    <article>… KitsuneKeyboard variant="preview" … copy …</article>
  </div>
</section>
```
Place below hero/enable card (keep existing settings).

- [ ] **Step 1: Failing page test** for heading + both widgets

- [ ] **Step 2: Implement section**

- [ ] **Step 3: PASS + `npm run typecheck` in companion**

---

### Task 7: Regression polish

- [ ] **Step 1:** Run `cd companion && npm run typecheck`

- [ ] **Step 2:** Run `cd companion && npm run test:companion` (or project’s companion test script)

- [ ] **Step 3:** Fix any failures; update `ai-notes/2026-11-15-kitsune-bar-keyboard-visual-parity.md` with outcomes

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Shared DockBar + Keyboard | 2, 3 |
| Blue key / white dock focus | 2, 3 |
| Full keyboard bindings | 1, 4, 5 |
| MOVE KEYBOARD mode | 5 |
| GYRO MOUSE via setGyroSettings | 5 |
| Live showcase section | 6 |
| Tests + typecheck | 1–7 |

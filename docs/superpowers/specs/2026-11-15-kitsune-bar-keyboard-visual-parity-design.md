# Kitsune Bar & Keyboard Visual Parity + Companion Showcase Design

## Summary

Restyle Kitsune Bar and Kitsune Keyboard to match the “Made for the controller” mockup nearly 1:1 (dark translucent bar, white focus ring on dock items, blue key focus), extract shared presentational widgets for reuse, implement full controller keyboard bindings (including MOVE KEYBOARD and GYRO MOUSE), and add a live-preview showcase section on `KitsuneBarPage`.

**Out of scope:** Static screenshot assets of in-game footage; changing PS-hold / Turbo trigger separation (already covered by `2026-11-14-kitsune-bar-integration-and-focus-design.md`).

---

## Goals

1. Overlay dock + keyboard look like the reference mockup (blue focus `#3B82F6`, white dock selection box, dark glass surfaces).
2. One visual source of truth: shared `KitsuneDockBar` and `KitsuneKeyboard` used by overlay and Companion page.
3. Full keyboard controller UX: L1/R1 arrows, L2 shift, Square backspace, R2 Done, L3+R3 gyro mouse, MOVE KEYBOARD via existing `moveKitsuneBar`.
4. Companion showcase: heading “Made for the controller” with two cards embedding live widget previews (no game screenshots).

---

## Architecture

```
kitsune-bar-keyboard.ts       ← layout cells, focus math, binding helpers (extend)
components/layout/
  KitsuneDockBar.tsx          ← presentational dock (shared)
  KitsuneKeyboard.tsx         ← presentational keyboard chrome + grid (shared)
  KitsuneBarOverlay.tsx       ← overlay window: gamepad, IPC, flyouts, state
pages/
  KitsuneBarPage.tsx          ← settings + “Made for the controller” showcase
styles.css                    ← tokens + dock/keyboard/showcase styles
```

| Layer | Responsibility |
|--------|----------------|
| Shared widgets | Render only; props for items, focus, prompts, callbacks, `variant: 'overlay' \| 'preview'` |
| Overlay | Gamepad loop, IPC (`moveKitsuneBar`, gyro, typing, resize), flyout orchestration |
| Page showcase | Compose widgets with fixed demo focus; no gamepad binding |

---

## Visual Design

### Tokens

| Token | Value |
|--------|--------|
| Bar surface | `rgba(10, 14, 22, 0.72)` + `backdrop-filter: blur(18px)` |
| Bar / key border | `rgba(255, 255, 255, 0.12)` |
| Dock focus | White outline box (~2px), no orange glow |
| Keyboard focus | Fill `#3B82F6`, high-contrast white label |
| Keycap fill | Dark grey translucent |
| Icons / text | White / light grey |

Remove orange as the primary overlay accent for dock/keyboard focus. Orange may remain elsewhere in Companion chrome; overlay dock + keyboard follow mockup palette.

### KitsuneDockBar

- Horizontal pill; white line icons in a single row.
- Selected item: white rectangular focus ring.
- `variant="overlay"`: participates in window drag regions as today.
- `variant="preview"`: no `-webkit-app-region: drag`; fixed demo selection (e.g. controller icon).

### KitsuneKeyboard

- Header row: grip icon + label `MOVE KEYBOARD` (toggles move mode in overlay).
- QWERTY grid with controller prompt glyphs on action keys (L1, R1, L2, R2, □, L3+R3).
- Action row includes: arrows, ABC/shift, **GYRO MOUSE**, **DONE** (R2), Enter, Backspace.
- `variant="preview"`: one key (e.g. `K`) permanently in blue focused state for visual demo; clicks no-op.

### Showcase (`KitsuneBarPage`)

- Section title: **Made for the controller**.
- Two cards side-by-side (stack on narrow width):
  - **Kitsune Bar** — “Audio, profiles, and shortcuts. Right where you play.” + live `KitsuneDockBar` on a dark stage.
  - **Kitsune Keyboard** — “Search and type with your controller in hand.” + live `KitsuneKeyboard` on a dark stage.
- Enable toggle / shortcut settings cards remain above or below this section without replacing them.

---

## Input & Data Flow (overlay keyboard)

State owned by `KitsuneBarOverlay`: `keyRow`, `keyCol`, `shiftLatch`, `gyroMouseOn`, `moveKeyboardMode`, `virtualText`, `activeFlyout`, `focusedIndex`.

| Input | Action |
|--------|--------|
| D-pad / existing L-stick nav | Move key focus |
| Cross | Activate focused cell (type / action) |
| Circle | If move mode: exit move mode; else close keyboard flyout |
| L1 / R1 | Move caret in `virtualText` (Left/Right); do not inject OS arrows while overlay owns typing |
| L2 | Toggle shift latch |
| Square | Backspace on `virtualText` |
| R2 / DONE | If `virtualText` non-empty, copy to clipboard; always close keyboard flyout |
| L3+R3 simultaneous | Toggle `gyroSettings.enabled` via `setGyroSettings` (UI mirror: `gyroMouseOn`); on IPC failure revert + “Gyro unavailable” |
| MOVE KEYBOARD mode on | R-stick or D-pad → `moveKitsuneBar('left'\|'right'\|'up'\|'down')`; D-pad does not move key focus in this mode |

Shared keyboard receives callbacks only: `onCellActivate`, `onDone`, `onToggleGyro`, `onToggleMoveMode`. Preview does not wire gamepad.

### Edge cases

- Gyro IPC failure → revert toggle UI; show short overlay badge/toast “Gyro unavailable”.
- `moveKitsuneBar` at screen edge → silent no-op.
- DONE with empty text → close keyboard only.
- Preview: pointer on keys is no-op (does not mutate bridge settings).

---

## File-Level Changes (expected)

| File | Change |
|------|--------|
| `companion/src/renderer/components/layout/KitsuneDockBar.tsx` | **New** presentational dock |
| `companion/src/renderer/components/layout/KitsuneKeyboard.tsx` | **New** presentational keyboard |
| `companion/src/renderer/components/layout/kitsune-bar-keyboard.ts` | Extend layout / binding helpers for prompts & actions |
| `companion/src/renderer/components/layout/KitsuneBarOverlay.tsx` | Use shared widgets; wire full bindings + move/gyro state |
| `companion/src/renderer/pages/KitsuneBarPage.tsx` | Add showcase section with live previews |
| `companion/src/renderer/styles.css` | Mockup tokens; dock/keyboard/showcase styles |
| Tests under `companion/src/renderer/**` | Unit + rendered coverage as below |

Reuse existing IPC: `resizeKitsuneBar`, `moveKitsuneBar`, `setGyroSettings`, clipboard / typing paths already used by overlay.

---

## Testing

1. **Unit** — `kitsune-bar-keyboard`: focus movement on extended layout; binding map helpers (L1→Left, L2→shift, Square→backspace, R2→done, L3+R3→gyro toggle).
2. **Rendered widgets** — Dock white focus class; keyboard blue focus class; MOVE / GYRO / DONE chrome present.
3. **Overlay handlers** — Gamepad path covers L1/R1/L2/R2/Square/L3+R3 and move-keyboard mode calling `moveKitsuneBar`.
4. **Page** — “Made for the controller” section renders both widgets.
5. **Regression** — `npm run typecheck` and existing companion test suite.

---

## Success Criteria

- Overlay dock and keyboard visually match the mockup palette and focus treatment.
- Showcase uses the same React widgets (`variant="preview"`), not duplicated markup or static PNGs of the UI.
- All controller bindings in the input table work while the keyboard flyout is open.
- MOVE KEYBOARD repositions the overlay window via existing main-process move API.
- Tests above pass; no regression in Kitsune Bar enable/shortcut settings.

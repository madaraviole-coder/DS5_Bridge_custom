# Kitsune Keyboard Steam-like Shortcuts Design

## Summary

Remap Kitsune Keyboard controller shortcuts toward Steam Deck OSK habits on a **single QWERTY layout** (no ABC/123/symbols pages). Keep MOVE KEYBOARD and GYRO MOUSE. Close keyboard via on-grid **DONE** or existing PS-hold overlay close — not Circle.

## Goals

1. Face/shoulder bindings feel familiar to Steam OSK users (with Circle/Square swapped per product choice).
2. R2 inserts **Enter**; on-grid **DONE** dismisses the keyboard (clipboard commit if text non-empty).
3. Triangle emits a new suppressed-input nav event for **Space**.
4. Update on-key / hint prompts to match the new map.
5. Preserve MOVE KEYBOARD mode and L3+R3 GYRO MOUSE.

## Out of scope

- Multi-page layouts (ABC / 123 / symbols) — deferred; was approach #1, not chosen.
- Changing how the keyboard flyout is opened from the dock.
- Changing PS-hold Kitsune Bar toggle / Turbo separation.

## Binding map (DualSense)

| Input | Nav / source | Result |
|--------|----------------|--------|
| D-pad / L-stick | `left/right/up/down` | Move key focus (or move overlay when MOVE mode on) |
| Cross | `select` | Activate focused cell |
| Circle | `cancel` | **Toggle shift** |
| Square | `kb-square` | **Backspace** |
| Triangle | `kb-triangle` (new `0x17`) | **Space** |
| L1 / R1 | `kb-l1` / `kb-r1` | Caret left / right in `virtualText` |
| L2 | `kb-l2` | Toggle shift (redundant with Circle) |
| R2 | `kb-r2` | **Enter** (newline + `typeVirtualKey('Enter')`) — does **not** close |
| On-grid DONE | UI callback | If text non-empty → clipboard; close keyboard flyout |
| Hold PS | existing | Close / toggle Kitsune Bar overlay |
| L3+R3 | `kb-gyro` | Toggle gyro mouse |
| MOVE KEYBOARD | existing mode | D-pad moves overlay via `moveKitsuneBar` |

## Architecture

```
src/companion.cpp              ← emit NAV_KB_TRIANGLE on Triangle rising edge when suppressed
companion/src/shared/protocol.ts
companion/src/main/bridge-service.ts
preload + adapters             ← widen onKitsuneNav with 'kb-triangle'
kitsune-bar-keyboard.ts        ← handleKeyboardNavAction results: space, enter; cancel→toggle-shift; kb-square→backspace; kb-r2→enter
KitsuneBarOverlay.tsx          ← wire space/enter; cancel no longer closes flyout while keyboard open
KitsuneKeyboard.tsx            ← prompt labels / hint chrome
```

### `handleKeyboardNavAction` results (keyboard open, not move mode)

| Action | Result |
|--------|--------|
| `left/right/up/down` | `move-focus` |
| `select` | `select` |
| `cancel` | `toggle-shift` |
| `kb-l1` / `kb-r1` | `caret-left` / `caret-right` |
| `kb-l2` | `toggle-shift` |
| `kb-r2` | `enter` |
| `kb-square` | `backspace` |
| `kb-triangle` | `space` |
| `kb-gyro` | `toggle-gyro` |

Move mode unchanged: D-pad → `move-overlay`; `cancel` → exit move mode (`cancel` result only in move mode).

## UI prompts

- Backspace key prompt: `□` (Square)
- Shift / ABC prompt: `○` (Circle) and/or `L2`
- Space action (if shown): `△`
- Enter (R2) reflected on Enter key or hint: `R2`
- DONE remains an on-grid dismiss control (no R2 prompt on DONE)

## Edge cases

- Circle while keyboard open never closes the flyout (shift only).
- Empty text + DONE → close only.
- Enter with R2 does not dismiss; user must DONE or PS-hold.
- Firmware Triangle edge uses same prev-button pattern as other kb events; reset when not suppressed.

## Testing

1. Unit: `handleKeyboardNavAction` for cancel→toggle-shift, kb-square→backspace, kb-triangle→space, kb-r2→enter; move-mode cancel still exits move.
2. Protocol/bridge: `NAV_KB_TRIANGLE` → `kb-triangle`.
3. Render: prompts show Square backspace / Circle shift where applicable.
4. `npm run typecheck` + companion vitest for touched files.

## Success criteria

- Steam-oriented face-button muscle memory (with Circle=shift, Square=backspace).
- R2 types Enter; DONE closes.
- Triangle types Space end-to-end when overlay suppressed.
- MOVE + GYRO still work.
- No layout page system introduced.

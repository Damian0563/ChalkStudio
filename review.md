Prior review addressed: `lastPop` cache, `event.data` guard before `setAttrs`, resize listener + cleanup, dropped spurious `async` on mount, WS `message.json()` try/catch.

## `chalkstudio/app/pages/session/[id].vue`

L71-80: 🟡 risk: sprite pop on every `draw`/`drawStart`/`drawEnd`. Throttled pops trail mid-stroke. Guard with `drawStart || drawEnd`.

L78: 🟡 risk: `event?.color || color.value` falls back to local `#f5f0e8`. Drop fallback or assign client color on WS open.

L70: 🟡 risk: `JSON.parse(messageEvent.data)` uncaught — malformed frame throws in handler. Wrap try/catch like server.

L25-28: 🔵 nit: `BOARD_WIDTH`/`BOARD_HEIGHT` only seed viewport; never board bounds. Rename or wire to layer size.

L37-39: 🔵 nit: `color`/`strokeWidth`/`user` hardcoded — not wired to toolbar or WS `peer.context.color`.

L43: 🟡 risk: `isPanning` checked in `handleMouseDown` but never set — pan tool inert.

## `chalkstudio/app/components/BoardZoom.vue`

L34-38: 🔵 nit: presentational lift is clean; no issue. Parent owns zoom state — good.

## `chalkstudio/app/composables/useKeyboard.ts`

L11: 🔵 nit: `!zoom` guard dead — `zoom` required in `UseKeyboardOptions`. Remove check.

L10-22: 🟡 risk: Ctrl/Meta +/-/= fires while focus in `<input>`/`<textarea>`. Skip when `e.target` is editable.

L26-28: 🔵 nit: handler only handles zoom — fine for now; name/doc scope or extend when adding shortcuts.

## `chalkstudio/app/composables/useZoom.ts`

L31-35: 🟡 risk: `indexOf` returns `-1` when `zoom` ∉ `ZOOM_LEVELS` — buttons no-op. Clamp to nearest level on mount.

L17-27: 🔵 nit: zoom mutates layer only — document that drawing must use `getBoardPointer`.

## `chalkstudio/server/routes/ws/session/[room].ts`

L45-46: 🔵 nit: `catch (_)` swallows parse errors — log before `peer.close(1002)`.

L41-43: 🟡 risk: `peer.context.color` may be undefined if `open` failed partially. Guard before spread.

L29-33: 🟡 risk: `roomSize` from `peer.peers` at `open` — race can duplicate color index. Server-side atomic assign or welcome frame.

## Still open (unchanged files)

`useBoardPopUp.ts` L17-20: 🟡 risk: no `img.onerror` — failed load no-ops forever.

`BoardToolbar.vue` L10-106: 🟡 risk: static markup — pen/color/stroke/pan/undo non-functional.

`Settings.vue` L12-34: 🟡 risk: modal lacks focus trap/`aria-labelledby`.

`types/board.ts` L13: 🔵 nit: `data: any` — narrow to Konva serializable attrs.

Fixes prior review: per-user `userSpritePops` throttle, `event.data?.attrs` on `setAttrs`, `lastWsMessage` init `Date.now()`.

## `chalkstudio/app/pages/session/[id].vue`

L68-76: 🟡 risk: sprite pop runs on every `draw`/`drawStart`/`drawEnd` — removed start/end guard. Throttled pops will trail mid-stroke. Restore `drawStart || drawEnd` guard or pop only on start.

L73: 🟡 risk: `event?.color || color.value` still falls back to local `#f5f0e8`. Drop fallback or sync server-assigned color on WS open.

L72: 🔵 nit: double `userSpritePops.get(event.user)`. Cache in `const lastPop = …`.

L83: 🟡 risk: `Konva.Node.create(event.data)` — no guard that `event.data` exists. Bail if missing.

L95-98: 🔴 bug: `resize` listener removed — stage stays stale after window resize. Re-add `window.addEventListener('resize', …)` or use `useResizeObserver`.

L25-28: 🔵 nit: `BOARD_WIDTH`/`BOARD_HEIGHT` unused after mount; viewport tracks window, not board size. Rename or wire to layer bounds.

L95: 🔵 nit: `onMounted(async …)` has no `await`. Drop `async`.

L37-39: 🔵 nit: `color`/`strokeWidth`/`user` hardcoded — not wired to `BoardToolbar` or WS `peer.context.color`.

L43: 🟡 risk: `isPanning` checked in `handleMouseDown` but never set — pan tool is inert until toolbar wired.

## `chalkstudio/app/composables/useBoardPopUp.ts`

L17-20: 🟡 risk: no `img.onerror` — failed load leaves `spriteImage` null; `popUpSprite` no-ops forever.

L24: 🟡 risk: early return when image not loaded — early WS events miss popup. Queue/retry after `onload`.

L79-83: 🔵 nit: pill `fill` and `stroke` both `sprite.color` — 1px stroke invisible. Use contrasting stroke or drop stroke.

L53-60: 🔵 nit: square `Konva.Image` under circular stroke — custom `imageUrl` corners bleed past ring. Add circle `clipFunc` if non-SVG avatars expected.

L107-114: ❓ q: still no fade-out tween — popup destroyed on pop-in `onFinish` (now 0.6s). Intentional?

## `chalkstudio/app/components/BoardToolbar.vue`

L10-106: 🟡 risk: toolbar is static markup — no `@click`, no v-model, no inject/provide to session. Pen/color/stroke/pan/undo are non-functional.

## `chalkstudio/app/components/BoardZoom.vue`

L41-47: 🔵 nit: local `zoom` ref not initialized from layer's current scale — UI can lie if layer pre-scaled.

## `chalkstudio/app/composables/useZoom.ts`

L31-35: 🟡 risk: `indexOf` returns `-1` when `zoom` ∉ `ZOOM_LEVELS` — buttons no-op with no recovery. Clamp to nearest level or reset on mount.

L17-27: 🔵 nit: zoom mutates layer scale/position only — fine if all drawing uses `getBoardPointer`; document that contract.

## `chalkstudio/app/components/Settings.vue`

L31-32: 🔵 nit: settings body is empty placeholder — ship content or hide until ready.

L12-34: 🟡 risk: modal has no focus trap/`aria-labelledby` — keyboard users tab behind overlay. Add focus trap + label `id` on title.

## `chalkstudio/server/routes/ws/session/[room].ts`

L29-33: 🟡 risk: `roomSize` from `peer.peers` at `open` — count/timing may race; two peers can get same `spriteColors` index. Assign server-side with atomic counter or send color in welcome frame.

L34: 🔵 nit: `catch (_)` swallows open errors — log before `peer.close(1008)`.

L38-43: 🟡 risk: `message.json()` uncaught on malformed client payload — try/catch or validate before publish.

L42: 🟡 risk: `peer.context.color` can be undefined if `open` failed partially — guard before spread.

## `chalkstudio/app/types/board.ts`

L13: 🔵 nit: `data: any` — narrow to Konva serializable attrs or `{ attrs: { id?: string; points?: number[] } }`.

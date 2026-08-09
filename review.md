Fixes prior review: line id + `remoteLines` map, 50ms draw throttle, guarded `points` access.

## `chalkstudio/app/pages/session/[id].vue`

L47-48: 🟡 risk: `LAST_SPRITEPOP` is global per viewer — one sprite/sec across all remotes. Key throttle by `event.user`.

L64: 🟡 risk: `event?.color || color.value` falls back to local chalk `#f5f0e8`, not server-assigned peer color. Drop fallback or sync assigned color on WS open.

L79: 🟡 risk: `line.setAttrs(event.data.attrs)` — no optional chain on `data`. Use `event.data?.attrs` (same guard as L69).

L122: 🔵 nit: `lastWsMessage` init `ref(20)` is misleading. Init `0` or `Date.now()`.

L28-29: 🔵 nit: `color`/`strokeWidth` never set from server `peer.context.color` — local stroke and remote sprite palette can diverge.

## `chalkstudio/app/composables/useBoardPopUp.ts`

L17-20: 🟡 risk: no `img.onerror` — failed load leaves `spriteImage` null; `popUpSprite` silently no-ops forever.

L24: 🟡 risk: early return when image not loaded yet — early WS events miss popup. Queue/retry after `onload`.

L53-60: 🔵 nit: square `Konva.Image` under circular stroke — custom `imageUrl` corners bleed past ring. Add circle `clipFunc` if non-SVG avatars expected.

L79-83: 🔵 nit: pill `fill` and `stroke` both `sprite.color` — 1px stroke invisible. Use contrasting stroke or drop stroke.

L107-114: ❓ q: second float/fade tween removed — popup now destroyed right after 0.3s pop-in. Intentional?

## `chalkstudio/server/routes/ws/session/[room].ts`

L29-33: 🟡 risk: `roomSize` from `peer.peers` at `open` — count/timing may include self or race on simultaneous joins; two peers can get same `spriteColors` index. Assign color server-side with atomic counter or send color in welcome frame.

L34: 🔵 nit: `catch (_)` swallows open errors — log before `peer.close(1008)`.

L38-43: 🟡 risk: `message.json()` uncaught on malformed client payload — try/catch or validate before publish.

L42: 🟡 risk: `peer.context.color` can be undefined if `open` failed partially — guard before spread.

## `chalkstudio/app/types/board.ts`

L13: 🔵 nit: `data: any` — narrow to Konva serializable attrs or `{ attrs: { id?: string; points?: number[] } }`.

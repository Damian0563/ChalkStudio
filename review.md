# Caveman Review — current diff

Scope: `session/[id].vue`, `ws/session/[room].ts`, `types/board.ts`.

---

## `chalkstudio/app/pages/session/[id].vue`

L36: 🔵 nit: `isPanning` never set — dead state. Remove or wire pan mode.

L30: 🟡 risk: hardcoded `user` ref `'Damian'`. Derive from auth/session id so sprites and events aren't all the same label.

L52: 🟡 risk: `JSON.parse(messageEvent.data)` uncaught — bad payload kills handler. Wrap in try/catch; ignore non-string `data`.

L56: 🔴 bug: `let x, y: number` only types `y`; `x` is implicit `any`. Use `let x: number, y: number`.

L58-62: 🟡 risk: `event.data.attrs.points[...]` after optional `event.data?.attrs?.points` — `data` can still be undefined. Guard `event.data?.attrs?.points` before index.

L65-68: 🔴 bug: every `draw` WS message `add()`s a new `Konva.Line` — remote stroke becomes N stacked lines. Key lines by id; update points on existing node or destroy/replace one line per stroke.

L70: 🔵 nit: `console.log(event)` in hot path. Drop or gate behind dev flag.

L74-77: 🟡 risk: `popUpSprite` is a stub (`console.log` only) — `drawStart`/`drawEnd` UX not implemented.

L91: 🟡 risk: `handleMouseDown` typed `MouseEvent` but bound to `@touchstart` — touch coords/button differ. Split handler or union `MouseEvent | TouchEvent`.

L100-110: 🟡 risk: no stable line/stroke id in outbound events — remotes can't correlate `drawStart`/`draw`/`drawEnd`. Set `line.id(...)` (or uuid) before first `send`.

L123: 🟡 risk: `send()` on every `mousemove` with full `toObject()` — floods WS. Throttle (~16ms) or send point deltas.

L128: 🟡 risk: `drawEnd` always sent even when `currentLine` undefined (mouseup without draw). Skip send when `!currentLine.value`.

---

## `chalkstudio/server/routes/ws/session/[room].ts`

L14: 🟡 risk: `getRoomName` throw in `open` uncaught — bad URL drops connection without clean close. try/catch + `peer.close(1008)`.

L18: 🟡 risk: `publish(..., message)` relays crossws Message wrapper, not client JSON string — clients expect parseable JSON. Use `message.text()` (prior behavior) or `message.json()`.

L18: 🟡 risk: still no payload size cap, schema check, or rate limit before relay.

L21: 🟡 risk: `peer.context?.room as string` — if `open` failed before assign, `unsubscribe(undefined)`. Guard or assert room set.

---

## `chalkstudio/app/types/board.ts`

L10: 🔵 nit: `type: string` — use discriminated union (`'drawStart' | 'draw' | 'drawEnd'`) so handlers exhaust cleanly.

L12: 🔵 nit: `data: any` — type as Konva serialized node or `{ attrs: { points?: number[] } }` for draw events.

---

## Resolved from prior review (this diff)

- Remote strokes now rendered (`draw` branch + `Konva.Node.create`).
- `send` on mousemove/mouseup wired.
- `contextmenu` prevented.
- `getRoomName` cached on `peer.context.room`.
- Duplicate `watch(data)` logging removed.
- `e: any` replaced with Konva event types.

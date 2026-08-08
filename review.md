# Caveman Review — feat branch

Scope: session canvas + WebSocket collab wiring (Konva, vue-konva, Nitro WS).

---

## `chalkstudio/app/pages/session/[id].vue`

L33: 🔵 nit: `isPanning` never set — dead state. Remove or wire pan mode.

L47-55: 🟡 risk: incoming WS only `console.log` — remote strokes never rendered. Parse `event.data`, add `Konva.Line` to layer.

L48-50 / L53-55: 🔵 nit: duplicate logging (`onMessage` + `watch(data)`). Keep one.

L65: 🔵 nit: `e: any`. Type as Konva event (`Konva.KonvaEventObject<MouseEvent>`).

L83: 🔴 bug: `send()` only on mousedown with partial line — collaborators get a dot, not the stroke. Send on mousemove (throttled) and/or mouseup with final points.

L87-99: 🔴 bug: `handleMouseMove` updates local canvas but never `send()` — other peers stay blank during draw.

L101-104: 🟡 risk: `handleMouseUp` clears line without final sync message — remote may miss stroke end. Send `{ type: 'draw-end', id }` or full points on up.

L57-63: 🟡 risk: no `contextmenu` preventDefault — right-click opens browser menu on canvas. `@contextmenu.prevent` on stage wrapper.

L47: ❓ q: does `useWebSocket('/ws/session/...')` resolve to `ws:` in prod behind reverse proxy, or need explicit `wss://` from runtime config?

---

## `chalkstudio/app/pages/workspace.vue`

L3: 🔴 bug: hardcoded `/session/123` — every "New" joins same room. Generate UUID (`crypto.randomUUID()`) before navigate.

---

## `chalkstudio/server/routes/ws/session/[room].ts`

L16-17: 🟡 risk: blind `peer.publish(room, message.text())` — no size cap, schema check, or rate limit. Validate JSON + max bytes before relay.

L4-9: 🟡 risk: `getRoomName` throws on bad URL — uncaught in `open`/`message`/`close`. Return early or close peer with code 1008.

L13-21: 🔵 nit: `getRoomName(peer)` called 3× per lifecycle. Cache in `open`, store on peer context.

---

## `chalkstudio/app/plugins/vue-konva.client.ts`

(no findings)

---

## `chalkstudio/app/composables/useKonva.ts`

(no findings)

---

## `chalkstudio/nuxt.config.ts`

L10-12: 🟡 risk: `nitro.experimental.websocket` — confirm stable path before prod deploy; flag may change across Nitro versions.

L5-7: 🔵 nit: hardcoded `devServer.port: 3000` — fine locally; omit if team uses other ports.

---

## `chalkstudio/app/types/konva.d.ts`

(no findings)

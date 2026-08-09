## `chalkstudio/app/pages/session/[id].vue`

L58-62: 🟡 risk: `event.data.attrs.points[...]` after optional `event.data?.attrs?.points` — `data` can still be undefined. Guard `event.data?.attrs?.points` before index.

L65-68: 🔴 bug: every `draw` WS message `add()`s a new `Konva.Line` — remote stroke becomes N stacked lines. Key lines by id; update points on existing node or destroy/replace one line per stroke.


L100-110: 🟡 risk: no stable line/stroke id in outbound events — remotes can't correlate `drawStart`/`draw`/`drawEnd`. Set `line.id(...)` (or uuid) before first `send`.

L123: 🟡 risk: `send()` on every `mousemove` with full `toObject()` — floods WS. Throttle (~16ms) or send point deltas.



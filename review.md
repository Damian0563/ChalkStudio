Prior review dropped (not re-flagged): sprite pop throttle, `event?.color` fallback, board constant naming, hardcoded toolbar state, `isPanning` inert, keyboard editable-focus skip, `useZoom` clamp/docs, server WS items, `useBoardPopUp` onerror, static `BoardToolbar`, Settings a11y trap, `types/board` `data: any`.

Addressed since last review: WS `JSON.parse` try/catch, dead `!zoom` guard removed.

L104: 🔵 nit: `quickNotice` never cleared after dismiss — rapid identical errors need new object ref each time (works today via `catch`, fragile).

## `chalkstudio/app/components/Notice.vue`

L128-131: 🔵 nit: watch ignores `message` becoming `undefined` — parent can't reset/clear queued notice via prop.


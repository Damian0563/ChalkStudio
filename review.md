Prior review dropped (not re-flagged): sprite pop throttle, `event?.color` fallback, board constant naming, hardcoded toolbar state, `isPanning` inert, keyboard editable-focus skip, `useZoom` clamp/docs, server WS items, `useBoardPopUp` onerror, static `BoardToolbar`, Settings a11y trap, `types/board` `data: any`.

Addressed since last review: WS `JSON.parse` try/catch, dead `!zoom` guard removed.

## `chalkstudio/app/pages/session/[id].vue`

L75-104: 🟡 risk: `try/catch` wraps Konva draw path — non-parse throws surface as "Error parsing message".

L32: 🔵 nit: `loading` stays `false` — `<Spinner>` never shows; wire WS/connect or remove.

L104: 🔵 nit: `quickNotice` never cleared after dismiss — rapid identical errors need new object ref each time (works today via `catch`, fragile).

## `chalkstudio/app/components/Notice.vue`

L128-131: 🔵 nit: watch ignores `message` becoming `undefined` — parent can't reset/clear queued notice via prop.

## `chalkstudio/app/components/Spinner.vue`

L2: 🔵 nit: full-screen overlay lacks `role="status"` / `aria-busy="true"` when visible.

# Canvas images

Notes on putting images on the whiteboard. Nothing here is implemented;
so far only the types exist — `BoardMeta.imageSources` in
`chalkstudio/shared/types.ts` and `BoardImage` in
`chalkstudio/app/types/board.ts`. The restore path this note describes
would hang off `applyBoardState` in
`chalkstudio/app/composables/useBoardState.ts`.

## Konva will not serialize an image, by design

A board is persisted as `stage.toJSON()`, which walks every node's
attrs through this filter in `konva/lib/Node.js`:

```js
nonPlainObject =
    Util.isObject(val) && !Util._isPlainObject(val) && !Util._isArray(val);
if (nonPlainObject) { continue; }
```

`_isPlainObject` is `obj.constructor === Object`, so an
`HTMLImageElement` fails it and the `image` attr is skipped outright.
The key does not appear in the output at all — not as `null`, not as
`{}`. `Util._prepareToStringify` separately drops DOM elements at
nested levels, so there is no wrapping trick that gets around it.

This is worse than it sounds because the failure is **silent and
symmetric**. Saving loses the bitmap without error, and reloading calls
`Konva.Node.create` on a node with no source, which builds a
`Konva.Image` that draws nothing. A board would round-trip cleanly and
simply come back without its pictures.

## The id is the only thing that survives

Custom attrs *do* survive the filter above, as long as they are plain
values — the `_isAttrAccessor` branch immediately below it exists for
exactly that case. So the node carries a string and nothing else:

    data          →  the Konva JSON, holding `imageId` per image node
    imageSources  →  imageId → URL, alongside it

The attr must **not** be called `image`. That name is a real
`Konva.Image` accessor expecting an element, and assigning a string to
it leaves the node trying to draw a string. Hence `imageId`.

`imageSources` is a `Record`, not a `Map`. A `Map` keeps its entries in
internal slots, so `JSON.stringify` yields `{}` — the same failure as
the bitmap, one level up:

```js
JSON.stringify({ x: new Map([["a", "u"]]) })  // {"x":{}}
```

## Stored object names, minted URLs

The map the client receives and the map the database holds are **not
the same map**, and conflating them is the trap.

If signed URLs were persisted, they would rot: a board saved today
opens to dead links next month, and the JSON would carry live
credentials to anyone who got a copy of it. So the column stores
durable object names, and the read path mints a signed URL per name at
response time:

    stored  imageId → objectName          (jsonb on `boards`)
    wire    imageId → signed bucket URL   (`BoardMeta.imageSources`)

The client type stays exactly as written — it just gets a usable URL
and never learns where it came from. Expiry becomes a server concern
and stops being a persistence concern.

One wrinkle this creates: a board left open for hours can outlive its
signed URLs, so any image loaded lazily late in a session may 403. The
answer is either an expiry comfortably longer than a session, or a
small re-mint endpoint the loader falls back to on failure. Worth
deciding before the first long session finds it.

The public-bucket alternative — permanent URLs, no signing — was
rejected: board images are user content on a per-board ACL
(`boards.authorization`, `boards.allowed_users`), and a public object
URL is a link anyone can pass around regardless of who may open the
board.

## Rebuilding: create empty, patch async

`Konva.Node.create` is synchronous and loading is not, so the node is
born blank and filled in afterwards. This needs no new plumbing —
`applyBoardState` already hands every restored node to `onRestore`, and
`useHistory` calls the same hook when undo/redo re-creates a node. A
`useBoardImages` composable mirrors `useStickyNotes` and contributes a
`restoreBoardImage` beside `restoreStickyNote`:

```ts
const restoreNode = (node: KonvaTypes.Node) => {
	restoreStickyNote(node)
	restoreBoardImage(node)
}
```

Two details keep this from being fragile:

**Reserve the box up front.** A blank `Konva.Image` has no intrinsic
size, so without stored dimensions the board reflows as bitmaps arrive.
Every image node gets its dimensions at placement time anyway, so
`width` and `height` on `BoardImage` should become required rather than
optional — it is the difference between a board that fills in and a
board that jumps.

**Cache on `imageId`, holding the promise.** Copy-paste gives two nodes
the same id, and undo/redo re-creates nodes repeatedly. A module-level
`Map<string, Promise<HTMLImageElement>>` collapses concurrent loads of
the same object. A `Map` is correct *here* for precisely the reason it
was wrong above: this one never crosses the wire.

## crossOrigin, and why the thumbnail depends on it

`img.crossOrigin = 'anonymous'` must be set before `src`, and the
bucket needs a CORS rule to match — `chalkstudio-bucket` in `main.tf`
has none today.

This is not just about the fetch succeeding. Without it every loaded
image **taints the canvas**, and a tainted canvas makes
`stage.toDataURL()` throw. That is presumably how `BoardMeta.image`,
the board thumbnail, gets generated. So adding canvas images silently
breaks thumbnail capture unless CORS lands first. Of everything in this
note, this is the dependency most likely to be discovered late.

## Optimistic placement gets its safety for free

On upload, the node can show the file immediately via
`URL.createObjectURL(file)` while the bucket PUT is still in flight,
swapping in the real URL on completion.

Normally the worry would be a `blob:` URL leaking into saved state.
It cannot — Konva refuses to serialize the `image` attr at all. The
exact behaviour that makes this whole note necessary is what makes the
optimistic path safe. The only real hazard is saving mid-upload, so the
save path has to await pending uploads or drop nodes whose object does
not exist yet.

## Broadcasting

`BoardEvent` gained `image-new`, `image-move`, `image-dragStart`,
`image-dragEnd`, `image-delete` and `image-transform`. There is no
`image-edit`; unlike a sticky note there is no text to change.

`image-new` should carry the URL in its payload. Sending only the id
would force every other participant into a board refetch to render a
single pasted image, and they cannot mint a URL themselves.

## Still open

- The jsonb column on `boards`, and `/api/boards/save/[id]` — the route
  `useBoardState.ts` already posts to does not exist yet.
- Whether uploads go through a server route or a signed upload URL
  straight to the bucket.
- Re-mint endpoint versus long expiry, per above.

# TODO

## Sticky notes: edit text through a textarea overlaying the Konva node

Editing an existing note currently listens to `keydown` on `window` (`StickyNoteEditor.vue`) and appends to `noteConfig.text`. This has gaps:

- **No mobile typing.** Tapping a canvas node focuses nothing editable, so the on-screen keyboard never opens. Only hardware keyboards work.
- **Unreliable on Android and with IME input.** Many soft keyboards send `key === 'Unidentified'` (`keyCode 229`), which the `e.key.length === 1` check drops. Autocorrect, swipe typing, emoji and composed or non-Latin input have the same problem.
- **No caret, cursor movement, selection or paste.** `Konva.Text` has no built-in caret, so one would have to be drawn by hand.

**Plan:** on `tap.sticky` / `click.sticky`, position a transparent `<textarea>` over the note's text node and let it take the input. `Konva.Text` then only renders `noteConfig.text`, and the browser provides the caret, selection, paste and soft keyboard.

- Match the text node's font family, size, weight, alignment, line height and padding. Apply the stage's scale/position and the group's transform so the textarea stays aligned while zooming, panning, dragging and resizing.
- Bind the textarea with `v-model` / the `input` event instead of `window` keydown. Keep a keydown listener only for Esc. Enforce `maxlength` on the textarea.
- Hide the Konva text (or make its fill transparent) while editing, so the two renderings don't appear doubled.
- **iOS Safari:** call `.focus()` synchronously inside the tap handler, not after `await ensureNoteFont(...)`, `nextTick` or a watcher, or the keyboard won't open.
- Watch for small line-wrap differences between the browser textarea and Konva's `wrap: 'word'` layout.

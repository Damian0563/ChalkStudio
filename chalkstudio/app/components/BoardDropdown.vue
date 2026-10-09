<template>
  <div
    v-if="!open"
    class="fixed top-4 left-4 z-10 overflow-hidden rounded-xl border border-chalk/10 bg-board-raised/92 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.55)] backdrop-blur-sm"
  >
    <div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />
    <button
      type="button"
      title="Open menu"
      class="flex h-10 w-10 items-center justify-center text-chalk transition-colors hover:bg-chalk/[0.06] hover:text-chalk active:bg-coral/15 active:text-coral-soft"
      aria-label="Open menu"
      aria-haspopup="dialog"
      @click="open = true"
    >
      <Icon name="lucide:menu" class="h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  </div>

  <template v-else>
    <motion.div
      class="fixed inset-0 z-20 bg-board/40"
      aria-hidden="true"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ duration: 0.22 }"
      @click="open = false"
    />

    <motion.aside
      class="fixed inset-y-0 left-0 z-20 flex h-screen w-72 max-w-[85vw] md:w-80 lg:w-96 flex-col overflow-hidden border-r border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]"
      role="dialog"
      aria-modal="true"
      :aria-label="showManual ? 'Manual' : 'Board menu'"
      :initial="{ x: '-100%' }"
      :animate="{ x: 0 }"
      :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="h-px w-full chalk-line opacity-55" aria-hidden="true" />

      <div class="flex items-center justify-between gap-2 border-b border-chalk/10 px-4 py-3">
        <div class="flex min-w-0 items-center gap-1.5">
          <button
            v-if="showManual"
            type="button"
            class="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
            aria-label="Back to menu"
            @click="showManual = false"
          >
            <Icon name="lucide:arrow-left" class="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
          <span class="truncate font-display text-base font-semibold tracking-tight text-chalk">
            {{ showManual ? "Manual" : "Chalk Studio" }}
          </span>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
          aria-label="Close menu"
          @click="open = false"
        >
          <Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </div>

      <div v-if="!showManual" class="flex flex-1 flex-col overflow-y-auto">
        <nav class="flex flex-col gap-1 px-3 py-3" aria-label="Board menu">
          <button
            type="button"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-chalk/80 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
            @click="goHome"
          >
            <Icon
              name="lucide:house"
              class="h-4 w-4 shrink-0 text-chalk-faint"
              aria-hidden="true"
            />
            Go home
          </button>
          <button
            type="button"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-chalk/80 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
            @click="showManual = true"
          >
            <Icon
              name="lucide:book-open"
              class="h-4 w-4 shrink-0 text-chalk-faint"
              aria-hidden="true"
            />
            Manual
            <Icon
              name="lucide:chevron-right"
              class="ml-auto h-4 w-4 shrink-0 text-chalk-faint/70"
              aria-hidden="true"
            />
          </button>
        </nav>

        <section class="border-t border-chalk/10 px-4 py-4">
          <p
            class="mb-2.5 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint"
          >
            <Icon name="lucide:settings" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Settings
          </p>
          <div class="overflow-hidden rounded-lg border border-chalk/10">
            <label
              v-for="toggle in settingToggles"
              :key="toggle.key"
              class="flex cursor-pointer items-center justify-between gap-4 border-b border-chalk/10 px-3 py-3 transition-colors last:border-b-0 hover:bg-chalk/[0.03]"
            >
              <span class="text-[0.8125rem] font-semibold text-chalk/90">{{ toggle.label }}</span>
              <input v-model="settings[toggle.key]" type="checkbox" class="peer sr-only" />
              <span
                class="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-chalk/[0.08] ring-1 ring-chalk/10 transition-[background-color,box-shadow] duration-200 peer-checked:bg-coral/20 peer-checked:ring-coral/35 peer-focus-visible:ring-2 peer-focus-visible:ring-coral-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-board-raised peer-checked:[&>span]:translate-x-5"
              >
                <span
                  class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-chalk shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-200 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
            </label>
          </div>
        </section>

        <section class="border-t border-chalk/10 px-4 py-4">
          <p
            class="mb-2.5 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint"
          >
            <Icon name="lucide:palette" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Theme
          </p>
          <div
            class="grid grid-cols-2 gap-2 lg:grid-cols-3"
            role="radiogroup"
            aria-label="Board background"
          >
            <button
              v-for="option in boardBackgrounds"
              :key="option.value"
              type="button"
              role="radio"
              class="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors"
              :class="
                background === option.value
                  ? 'border-coral/40 bg-coral/10 text-chalk'
                  : 'border-chalk/10 text-chalk/75 hover:bg-chalk/[0.04] hover:text-chalk'
              "
              :aria-checked="background === option.value"
              @click="background = option.value"
            >
              <span
                class="h-6 w-6 shrink-0 rounded-md ring-1 ring-chalk/15 chalk-grain"
                :style="{ backgroundColor: option.value }"
                aria-hidden="true"
              />
              <span class="truncate">{{ option.name }}</span>
            </button>
          </div>
        </section>

        <section v-if="isOwner" class="mt-auto border-t border-chalk/10 px-4 py-4">
          <p
            class="mb-2.5 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint"
          >
            <Icon name="lucide:crown" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Board
            <span
              class="ml-auto rounded-full border border-coral/25 bg-coral/10 px-2 py-0.5 text-[0.6rem] tracking-[0.1em] text-coral-soft"
            >
              Owner
            </span>
          </p>
          <div class="overflow-hidden rounded-lg border border-chalk/10">
            <button
              type="button"
              class="flex w-full items-center gap-3 border-b border-chalk/10 px-3 py-3 text-left text-[0.8125rem] font-semibold text-chalk/90 transition-colors hover:bg-chalk/[0.03]"
            >
              <Icon
                name="lucide:pencil-line"
                class="h-4 w-4 shrink-0 text-chalk-faint"
                aria-hidden="true"
              />
              Edit board details
            </button>
          </div>
        </section>
      </div>

      <div v-else class="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <section v-for="section in manualSections" :key="section.title">
          <p
            class="mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-chalk-faint"
          >
            <Icon :name="section.icon" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {{ section.title }}
          </p>
          <ul class="overflow-hidden rounded-lg border border-chalk/10">
            <li
              v-for="entry in section.entries"
              :key="entry.description"
              class="flex flex-col gap-1.5 border-b border-chalk/10 px-3 py-2.5 last:border-b-0"
            >
              <span class="flex flex-wrap items-center gap-1">
                <kbd
                  v-for="(key, index) in entry.keys"
                  :key="`${entry.description}-${index}`"
                  class="rounded border border-chalk/10 bg-chalk/[0.06] px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-chalk/70"
                >
                  {{ key }}
                </kbd>
              </span>
              <span class="text-[0.8125rem] leading-snug text-chalk/85">{{
                entry.description
              }}</span>
            </li>
          </ul>
        </section>
      </div>
    </motion.aside>
  </template>

  <UnsavedChangesModal :open="confirmLeave" @stay="confirmLeave = false" @leave="navigateTo('/')" />
</template>

<script setup lang="ts">
import { motion } from "motion-v";
import type { KeyboardShortcut } from "~/composables/useKeyboard";
import type { BoardSettings } from "~/types/board";

type ManualSection = {
  title: string;
  icon: string;
  entries: KeyboardShortcut[];
};

const manualSections: ManualSection[] = [
  {
    title: "Drawing",
    icon: "lucide:pencil",
    entries: [
      { description: "Draw with the pen, or erase strokes with the eraser", keys: ["Drag"] },
      {
        description: "Pick the stroke color and width (on the pen or eraser tool)",
        keys: ["Double-click"],
      },
      { description: "Move around the board with the pan tool", keys: ["Drag"] },
    ],
  },
  {
    title: "Sticky notes",
    icon: "lucide:sticky-note",
    entries: [
      {
        description:
          "Choose a paper from the sticky notes tool, drag the note into place and confirm",
        keys: ["Drag", "Enter"],
      },
      { description: "Edit a note: text, colors, font, alignment and size", keys: ["Click"] },
      { description: "Move or resize a note using the toggles in its editor", keys: ["Click"] },
      { description: "Delete a note with the discard button shown while editing", keys: ["Click"] },
    ],
  },
  {
    title: "Images",
    icon: "lucide:image",
    entries: [
      {
        description: "Add an image from the toolbar, or paste one from the clipboard",
        keys: ["Ctrl / ⌘", "V"],
      },
      {
        description: "Select an image to resize it by its corners or delete it",
        keys: ["Double-click"],
      },
      { description: "Deselect the image by clicking anywhere on the board", keys: ["Click"] },
    ],
  },
  {
    title: "Participants",
    icon: "lucide:users",
    entries: [
      {
        description: "Jump to where another participant was last active by clicking their avatar",
        keys: ["Click"],
      },
    ],
  },
  {
    title: "Keyboard",
    icon: "lucide:keyboard",
    entries: keyboardShortcuts,
  },
];

const settingToggles: { key: keyof BoardSettings; label: string }[] = [
  { key: "focusMode", label: "Focus mode" },
  { key: "showSprites", label: "Show user avatars on remote events" },
  { key: "consolidateParticipantsPanel", label: "Consolidate participants panel" },
];

const settings = defineModel<BoardSettings>("settings", { required: true });
const background = defineModel<string>("background", { required: true });
const isOwner = defineModel<boolean>("isOwner", { required: true });
const props = defineProps<{ isSaved: boolean }>();
const open = ref(false);
const showManual = ref(false);
const confirmLeave = ref(false);
const goHome = () => {
  if (props.isSaved) navigateTo("/");
  else confirmLeave.value = true;
};
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  if (confirmLeave.value) confirmLeave.value = false;
  else open.value = false;
};

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener("keydown", onKeydown);
  } else {
    showManual.value = false;
    window.removeEventListener("keydown", onKeydown);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

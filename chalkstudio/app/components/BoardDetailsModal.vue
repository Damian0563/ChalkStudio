<template>
  <AnimatePresence>
    <motion.div
      v-if="board"
      class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-board/80 p-4 backdrop-blur-md"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0, transition: { duration: 0.2 } }"
      :transition="{ duration: 0.25 }"
      @click.self="close"
    >
      <motion.div
        class="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-chalk/10 bg-board-raised shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-details-title"
        :initial="{ opacity: 0, scale: 0.96, y: 20 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{
          opacity: 0,
          scale: 0.97,
          y: 10,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        }"
        :transition="{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }"
      >
        <div class="h-px w-full shrink-0 chalk-line opacity-55" aria-hidden="true" />

        <div
          class="flex shrink-0 items-center gap-3 border-b border-chalk/10 py-4 pl-6 pr-4 sm:pl-8 sm:pr-5"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-coral/25 bg-coral/10 text-coral-soft"
            aria-hidden="true"
          >
            <Icon name="lucide:presentation" class="h-5 w-5" />
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2
              id="board-details-title"
              class="truncate font-display text-lg font-semibold tracking-tight text-chalk sm:text-xl"
              :title="board.title"
            >
              {{ board.title }}
            </h2>
            <p class="flex min-w-0 items-center gap-1.5 font-sans text-xs text-chalk-faint">
              <Icon name="lucide:clock" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span class="truncate"
                >Edited
                <time :datetime="board.modifiedAt">{{
                  formatModifiedAt(board.modifiedAt, modifiedAtFormat)
                }}</time></span
              >
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1 self-start">
            <button
              v-if="deleteBoard"
              type="button"
              aria-label="Delete board"
              @click="showDeleteBoardModal = true"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-coral/10 hover:text-coral-soft"
            >
              <Icon name="lucide:trash" class="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
            <button
              ref="closeButton"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-chalk/40 transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
              aria-label="Close"
              @click="close"
            >
              <Icon name="lucide:x" class="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="onSubmit">
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            <div class="flex flex-col gap-4 font-sans text-sm">
              <div class="flex flex-col gap-1.5">
                <label for="board-details-name" class="text-xs font-semibold text-chalk-muted"
                  >Title</label
                >
                <div class="relative">
                  <Icon
                    name="lucide:type"
                    class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-faint/70"
                    aria-hidden="true"
                  />
                  <input
                    id="board-details-name"
                    v-model="form.title"
                    type="text"
                    required
                    :maxlength="TITLE_MAX"
                    :class="[inputClass, 'pl-10 pr-3.5']"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-baseline justify-between">
                  <label
                    for="board-details-description"
                    class="text-xs font-semibold text-chalk-muted"
                  >
                    Description <span class="font-normal text-chalk-faint/70">(optional)</span>
                  </label>
                  <span
                    class="font-sans text-[0.7rem] tabular-nums text-chalk-faint/60"
                    aria-hidden="true"
                  >
                    {{ form.description.length }}/{{ DESCRIPTION_MAX }}
                  </span>
                </div>
                <textarea
                  id="board-details-description"
                  v-model="form.description"
                  rows="2"
                  :maxlength="DESCRIPTION_MAX"
                  placeholder="What will this board be used for?"
                  :class="[inputClass, 'resize-none px-3.5']"
                />
              </div>

              <fieldset class="flex flex-col gap-1.5">
                <legend class="mb-1.5 text-xs font-semibold text-chalk-muted">Access</legend>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="option in accessOptions"
                    :key="option.value"
                    class="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/20"
                    :class="
                      form.authorization === option.value
                        ? 'border-coral-soft/50 bg-coral/[0.08]'
                        : 'border-chalk/10 bg-board/60 hover:border-chalk/25 hover:bg-chalk/[0.04]'
                    "
                  >
                    <input
                      v-model="form.authorization"
                      type="radio"
                      name="board-details-access"
                      :value="option.value"
                      class="sr-only"
                    />
                    <Icon
                      :name="option.icon"
                      class="mt-0.5 h-4 w-4 shrink-0"
                      :class="
                        form.authorization === option.value ? 'text-coral-soft' : 'text-chalk-faint'
                      "
                      aria-hidden="true"
                    />
                    <span class="min-w-0">
                      <span
                        class="block font-sans text-sm font-semibold"
                        :class="
                          form.authorization === option.value ? 'text-chalk' : 'text-chalk/85'
                        "
                      >
                        {{ option.label }}</span
                      >
                      <span class="mt-0.5 block font-sans text-xs leading-snug text-chalk-faint">{{
                        option.hint
                      }}</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div v-if="form.authorization === 'invite'" class="flex flex-col gap-1.5">
                <label for="board-details-invite" class="text-xs font-semibold text-chalk-muted">
                  Invitees
                  <span class="font-normal text-chalk-faint/70"
                    >({{ form.allowedUsers.length }})</span
                  >
                </label>
                <div
                  class="flex min-h-[2.625rem] flex-wrap items-center gap-1.5 rounded-lg border border-chalk/10 bg-board/60 px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-coral-soft/60 focus-within:ring-2 focus-within:ring-coral/20"
                >
                  <span
                    v-for="email in form.allowedUsers"
                    :key="email"
                    class="flex max-w-full items-center gap-1 rounded-md bg-chalk/[0.08] py-0.5 pl-2 pr-1 text-xs text-chalk"
                  >
                    <span class="truncate">{{ email }}</span>
                    <button
                      type="button"
                      class="flex h-4 w-4 shrink-0 items-center justify-center rounded text-chalk-faint transition-colors hover:bg-chalk/10 hover:text-chalk"
                      :aria-label="`Remove ${email}`"
                      @click="removeInvite(email)"
                    >
                      <Icon name="lucide:x" class="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                  <input
                    id="board-details-invite"
                    v-model="inviteDraft"
                    type="email"
                    multiple
                    autocomplete="off"
                    :placeholder="form.allowedUsers.length ? '' : 'name@school.edu, then Enter'"
                    class="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 font-sans text-sm text-chalk placeholder:text-chalk-faint/50 focus:outline-none"
                    aria-describedby="board-details-invite-hint"
                    @keydown="onInviteKeydown"
                    @blur="addInvites"
                  />
                </div>
                <p
                  id="board-details-invite-hint"
                  class="font-sans text-xs"
                  :class="inviteError ? 'text-coral-soft' : 'text-chalk-faint/70'"
                >
                  {{ inviteError || "Press Enter or comma to add each address." }}
                </p>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold text-chalk-muted">Board link</span>
                <div class="flex items-center gap-2">
                  <code
                    class="min-w-0 flex-1 truncate rounded-lg border border-chalk/10 bg-board/60 px-3 py-2 text-xs text-chalk-faint"
                  >
                    {{ boardUrl }}
                  </code>
                  <button
                    type="button"
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-chalk/[0.06] hover:text-chalk"
                    :aria-label="copied ? 'Link copied' : 'Copy link'"
                    @click="copy(boardUrl)"
                  >
                    <Icon
                      :name="copied ? 'lucide:check' : 'lucide:copy'"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex shrink-0 items-center justify-end gap-2.5 border-t border-chalk/10 bg-board/40 px-6 py-3 sm:px-8"
          >
            <button
              v-if="hasChanges"
              type="submit"
              :disabled="!isReady"
              class="rounded-lg border border-chalk/15 px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:border-chalk/30 hover:bg-chalk/[0.06] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-chalk/15 disabled:hover:bg-transparent"
            >
              Save changes
            </button>
            <NuxtLink
              v-if="!isCurrentBoard"
              :to="`/session/${board.id}`"
              class="group flex items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 font-sans text-sm font-semibold text-chalk transition-colors hover:bg-coral-soft"
            >
              Open board
              <Icon
                name="lucide:arrow-right"
                class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </form>
      </motion.div>
    </motion.div>
  </AnimatePresence>
  <DeleteBoardPopUp
    v-if="deleteBoard"
    :open="showDeleteBoardModal"
    :title="board?.title ?? ''"
    @cancel="showDeleteBoardModal = false"
    @confirm="
      showDeleteBoardModal = false;
      onDelete();
    "
  />
</template>

<script setup lang="ts">
import { motion, AnimatePresence } from "motion-v";
import type { BoardCreationPayload, BoardSummary } from "#shared/types";
import type { QuickNotice } from "@/types/general";
import type { AccessOption, FormatModifiedAt } from "@/composables/useWorkspace";
import { useBoardForm } from "@/composables/useBoardForm";
const board = defineModel<BoardSummary | null>("board", { required: true });
const showDeleteBoardModal: Ref<boolean> = ref(false);
const props = defineProps<{
  accessOptions: AccessOption[];
  formatModifiedAt: FormatModifiedAt;
  updateBoard: (
    id: string,
    board: BoardCreationPayload,
  ) => Promise<Pick<BoardSummary, "modifiedAt">>;
  deleteBoard?: (id: string) => Promise<void>;
  triggerReload?: (board: BoardCreationPayload) => void;
}>();
const emits = defineEmits<{
  (e: "load"): void;
  (e: "message", notice: QuickNotice): void;
  (e: "deleted", id: string): void;
}>();

const {
  TITLE_MAX,
  DESCRIPTION_MAX,
  inputClass,
  form,
  inviteDraft,
  inviteError,
  isReady,
  hasChanges,
  resetForm,
  addInvites,
  removeInvite,
  onInviteKeydown,
  runRequest,
  submitForm,
} = useBoardForm({
  baseline: () => board.value,
  onLoad: () => emits("load"),
  onMessage: (notice) => emits("message", notice),
});

const modifiedAtFormat: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

const closeButton = useTemplateRef<HTMLButtonElement>("closeButton");
const requestUrl = useRequestURL();
const { copy, copied } = useClipboard({ legacy: true });

const route = useRoute();
const isCurrentBoard = computed(() => route.path === `/session/${board.value?.id}`);
const boardUrl = computed(() => `${requestUrl.origin}/session/${board.value?.id}`);

watch(
  () => board.value?.id,
  (id) => {
    resetForm();
    showDeleteBoardModal.value = false;
    if (id) nextTick(() => closeButton.value?.focus());
  },
  { immediate: true },
);

onKeyStroke("Escape", () => {
  if (showDeleteBoardModal.value) showDeleteBoardModal.value = false;
  else if (board.value) close();
});

const close = () => {
  board.value = null;
};

const onSubmit = () => {
  const saved = board.value;
  if (!saved || !hasChanges.value) return;
  return submitForm(async (changes) => {
    const { modifiedAt } = await props.updateBoard(saved.id, changes);
    Object.assign(saved, changes, { modifiedAt });
    props.triggerReload?.(changes);
    emits("message", { message: "Board updated.", type: "success" });
  }, "An error occured while saving the board. Please try again later.");
};

const onDelete = () => {
  const saved = board.value;
  const deleteBoard = props.deleteBoard;
  if (!saved || !deleteBoard) return;
  return runRequest(async () => {
    await deleteBoard(saved.id);
    close();
    emits("deleted", saved.id);
    emits("message", { message: "Board deleted.", type: "success" });
  }, "An error occured while deleting the board. Please try again later.");
};
</script>

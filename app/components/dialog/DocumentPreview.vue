<script setup lang="ts">
interface Props {
  modelValue: boolean;
  filePath: string | null;
  fileName: string | null;
  fileType: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  filePath: null,
  fileName: null,
  fileType: null,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const isVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

const close = () => {
  isVisible.value = false;
};

const fileUrl = computed(() => {
  if (!props.filePath) return "";
  if (props.filePath.startsWith("blob:") || props.filePath.startsWith("data:")) return props.filePath;
  return `/api/files?path=${props.filePath}`;
});

const isImage = computed(() => {
  if (!props.fileType) {
    if (props.fileName) {
      const ext = props.fileName.split('.').pop()?.toLowerCase();
      if (ext && ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return true;
    }
    return false;
  }
  return (
    props.fileType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
      props.fileType.toLowerCase()
    )
  );
});

const isPdf = computed(() => {
  if (!props.fileType) {
    if (props.fileName) {
      const ext = props.fileName.split('.').pop()?.toLowerCase();
      if (ext === "pdf") return true;
    }
    return false;
  }
  return props.fileType.includes("pdf") || props.fileType === "pdf";
});

const displayName = computed(() => {
  return props.fileName || "Document";
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-100 overflow-y-auto"
        @click.self="close"
      >
        <div class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" @click="close" />

        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            appear
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isVisible"
              class="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
              @click.stop
            >
              <div
                class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <i
                    :class="[
                      isImage
                        ? 'mdi mdi-file-image text-purple-500'
                        : isPdf
                          ? 'mdi mdi-file-pdf-box text-red-500'
                          : 'mdi mdi-file text-slate-400',
                    ]"
                    class="text-xl shrink-0"
                  />
                  <h3
                    class="text-lg font-semibold text-slate-900 dark:text-white truncate"
                  >
                    {{ displayName }}
                  </h3>
                </div>
                <button
                  class="p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                  @click="close"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div class="p-6">
                <div
                  v-if="isImage"
                  class="flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden"
                >
                  <img
                    :src="fileUrl"
                    :alt="displayName"
                    class="max-w-full max-h-[70vh] object-contain"
                  />
                </div>

                <div
                  v-else-if="isPdf"
                  class="w-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden"
                >
                  <iframe
                    :src="fileUrl"
                    class="w-full border-0 rounded-lg"
                    style="height: 70vh"
                  />
                </div>

                <div
                  v-else
                  class="flex flex-col items-center justify-center py-16 text-slate-400"
                >
                  <i class="mdi mdi-file-alert-outline text-5xl mb-3" />
                  <p class="text-sm">{{ $t("messages.no_preview_available") }}</p>
                  <a
                    :href="fileUrl"
                    target="_blank"
                    class="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                  >
                    {{ $t("button.download-file") }}
                  </a>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

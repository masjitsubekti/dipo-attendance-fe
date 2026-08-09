<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

interface Props {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  retryDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "Image",
  fallbackSrc: "/images/default-user.jpg",
  retryDelay: 2000,
});

const isLoading = ref(true);
const retried = ref(false);
const currentSrc = ref(props.src || props.fallbackSrc);

const handleLoad = () => {
  isLoading.value = false;
};

const handleError = () => {
  if (!retried.value && props.src && props.src !== props.fallbackSrc) {
    retried.value = true;
    // Keep loading state true while retrying
    isLoading.value = true;
    setTimeout(() => {
      const originalSrc = props.src;
      // Temporarily set to fallback or empty to trigger reactivity on re-assignment
      currentSrc.value = "";
      setTimeout(() => {
        currentSrc.value = originalSrc || props.fallbackSrc;
      }, 50);
    }, props.retryDelay);
  } else {
    currentSrc.value = props.fallbackSrc;
    isLoading.value = false;
  }
};

// Sync if props.src changes (useful when MQTT pushes new data or switching items)
watch(
  () => props.src,
  (newSrc) => {
    currentSrc.value = newSrc || props.fallbackSrc;
    isLoading.value = true;
    retried.value = false;
  },
);
</script>

<template>
  <div
    class="relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 w-full h-full flex items-center justify-center"
  >
    <!-- Shimmer Loader / Skeleton -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
    >
      <div
        class="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-shimmer"
      ></div>
    </div>

    <img
      v-if="currentSrc"
      :src="currentSrc"
      :alt="alt"
      class="w-full h-full object-cover transition-all duration-500"
      :class="{
        'opacity-0 scale-95 blur-sm': isLoading,
        'opacity-100 scale-100 blur-0': !isLoading,
      }"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-150%) skewX(-20deg);
  }
  100% {
    transform: translateX(150%) skewX(-20deg);
  }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
</style>

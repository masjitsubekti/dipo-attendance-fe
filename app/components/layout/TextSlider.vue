<script setup lang="ts">
interface Slide {
  title1: string;
  titleHighlight: string;
  title2?: string;
  description: string;
}

interface Props {
  slides: Slide[];
  autoPlayInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoPlayInterval: 5000,
});

const currentSlide = ref(0);
let slideInterval: ReturnType<typeof setInterval>;

const goToSlide = (index: number) => {
  currentSlide.value = index;
  resetInterval();
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % props.slides.length;
};

const resetInterval = () => {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, props.autoPlayInterval);
};

onMounted(() => {
  slideInterval = setInterval(nextSlide, props.autoPlayInterval);
});

onUnmounted(() => {
  clearInterval(slideInterval);
});
</script>

<template>
  <div class="text-center overflow-hidden">
    <TransitionGroup
      tag="div"
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-x-8"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-300 ease-in absolute inset-0"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-8"
    >
      <div v-for="(slide, index) in slides" v-show="currentSlide === index" :key="`slide-${index}`">
        <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          {{ slide.title1 }}
          <br />
          <span class="text-primary-500">{{ slide.titleHighlight }}</span>
          <span v-if="slide.title2">{{ slide.title2 }}</span>
        </h1>
        <p class="text-slate-600 dark:text-slate-300 font-medium">
          {{ slide.description }}
        </p>
      </div>
    </TransitionGroup>

    <div class="flex justify-center gap-2 mt-8">
      <button
        v-for="(_, index) in slides"
        :key="index"
        :class="[
          'h-2 rounded-full transition-all duration-300',
          currentSlide === index
            ? 'w-8 bg-primary-500'
            : 'w-2 bg-primary-200 dark:bg-primary-800 hover:bg-primary-300 dark:hover:bg-primary-700',
        ]"
        @click="goToSlide(index)"
      />
    </div>
  </div>
</template>

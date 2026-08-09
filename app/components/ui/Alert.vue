<template>
  <div 
    class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-xl p-4"
    :class="[config.bg, config.border]"
  >
    <div class="flex items-center gap-3">
      <div 
        class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
        :class="config.iconBg"
      >
        <UiIcon :name="icon || config.defaultIcon" size="md" :class="config.iconColor" />
      </div>
      <div>
        <div class="text-sm font-bold" :class="config.title">
          {{ title }}
        </div>
        <div class="text-xs mt-0.5" :class="config.desc">
          <slot>{{ description }}</slot>
        </div>
      </div>
    </div>
    <div v-if="actionText" class="w-full sm:w-auto shrink-0">
      <UiButton
        size="sm"
        :color="config.buttonColor"
        class="flex items-center gap-1.5 shadow-sm px-4 py-2 rounded-lg text-xs font-bold w-full sm:w-auto justify-center"
        @click="$emit('action')"
      >
        <slot name="action-icon">
          <UiIcon v-if="actionIcon" :name="actionIcon" size="sm" />
        </slot>
        {{ actionText }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  icon?: string;
  actionText?: string;
  actionIcon?: string;
}>(), {
  type: 'info'
});

defineEmits<{
  (e: 'action'): void;
}>();

const config = computed(() => {
  switch (props.type) {
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        border: 'border-amber-200 dark:border-amber-900',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-800 dark:text-amber-300',
        title: 'text-amber-900 dark:text-amber-200',
        desc: 'text-amber-700 dark:text-amber-300/80',
        buttonColor: 'warning',
        defaultIcon: 'mdi mdi-alert-circle-outline'
      };
    case 'success':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        border: 'border-emerald-200 dark:border-emerald-900',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-800 dark:text-emerald-300',
        title: 'text-emerald-900 dark:text-emerald-200',
        desc: 'text-emerald-700 dark:text-emerald-300/80',
        buttonColor: 'success',
        defaultIcon: 'mdi mdi-check-circle-outline'
      };
    case 'error':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        border: 'border-rose-200 dark:border-rose-900',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconColor: 'text-rose-800 dark:text-rose-300',
        title: 'text-rose-900 dark:text-rose-200',
        desc: 'text-rose-700 dark:text-rose-300/80',
        buttonColor: 'danger',
        defaultIcon: 'mdi mdi-close-circle-outline'
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-900',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-800 dark:text-blue-300',
        title: 'text-blue-900 dark:text-blue-200',
        desc: 'text-blue-700 dark:text-blue-300/80',
        buttonColor: 'primary',
        defaultIcon: 'mdi mdi-information-outline'
      };
  }
});
</script>

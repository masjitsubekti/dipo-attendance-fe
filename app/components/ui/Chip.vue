<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default" | "secondary";
  variant?: "filled" | "ghost" | "outline" | "tonal";
  size?: "sm" | "md" | "lg";
  clearable?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: "default",
  variant: "tonal",
  size: "md",
  clearable: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'close', event: MouseEvent): void;
}>();

const variantClasses = computed(() => {
  const c = props.color;
  const v = props.variant;
  
  const base = "inline-flex items-center font-medium transition-colors rounded-full";
  
  const styles = {
    tonal: {
      primary: "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/40",
      secondary: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60",
      success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40",
      warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40",
      danger: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40",
      info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40",
      default: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40",
    },
    outline: {
      primary: "bg-transparent text-primary-600 dark:text-primary-400 border border-primary-500 dark:border-primary-500/50",
      secondary: "bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
      success: "bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500 dark:border-emerald-500/50",
      warning: "bg-transparent text-amber-600 dark:text-amber-400 border border-amber-500 dark:border-amber-500/50",
      danger: "bg-transparent text-red-600 dark:text-red-400 border border-red-500 dark:border-red-500/50",
      info: "bg-transparent text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-500/50",
      default: "bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
    },
    filled: {
      primary: "bg-primary-500 text-white border border-transparent hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500",
      secondary: "bg-slate-600 text-white border border-transparent hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
      success: "bg-emerald-500 text-white border border-transparent hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500",
      warning: "bg-amber-500 text-white border border-transparent hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
      danger: "bg-red-500 text-white border border-transparent hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500",
      info: "bg-blue-500 text-white border border-transparent hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500",
      default: "bg-slate-600 text-white border border-transparent hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
    },
    ghost: {
      primary: "bg-transparent text-primary-600 dark:text-primary-400 border border-transparent",
      secondary: "bg-transparent text-slate-600 dark:text-slate-300 border border-transparent",
      success: "bg-transparent text-emerald-600 dark:text-emerald-400 border border-transparent",
      warning: "bg-transparent text-amber-600 dark:text-amber-400 border border-transparent",
      danger: "bg-transparent text-red-600 dark:text-red-400 border border-transparent",
      info: "bg-transparent text-blue-600 dark:text-blue-400 border border-transparent",
      default: "bg-transparent text-slate-600 dark:text-slate-300 border border-transparent",
    }
  };
  
  const selectedStyle = styles[v] || styles.tonal;
  const styleClasses = selectedStyle[c] || selectedStyle.default;
  
  return [base, styleClasses].join(" ");
});

const sizeClasses = {
  sm: "text-[11px] px-2.5 py-0.5 rounded-full font-medium gap-1",
  md: "text-xs px-3 py-1 rounded-full font-medium gap-1.5",
  lg: "text-sm px-3.5 py-1.5 rounded-full font-medium gap-2",
};

const closeButtonColors = computed(() => {
  if (props.variant === 'filled') {
    return 'text-white/85 hover:bg-white/20 hover:text-white';
  }
  
  const c = props.color;
  const colors = {
    primary: "text-primary-500 hover:bg-primary-200/50 dark:text-primary-400 dark:hover:bg-primary-800/50",
    secondary: "text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-600/50",
    success: "text-emerald-500 hover:bg-emerald-200/50 dark:text-emerald-400 dark:hover:bg-emerald-800/50",
    warning: "text-amber-500 hover:bg-amber-200/50 dark:text-amber-400 dark:hover:bg-amber-800/50",
    danger: "text-red-500 hover:bg-red-200/50 dark:text-red-400 dark:hover:bg-red-800/50",
    info: "text-blue-500 hover:bg-blue-200/50 dark:text-blue-400 dark:hover:bg-blue-800/50",
    default: "text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-600/50",
  };
  return colors[c] || colors.default;
});

const handleClose = (e: MouseEvent) => {
  if (props.disabled) return;
  emit('close', e);
};
</script>

<template>
  <span :class="[variantClasses, sizeClasses[size], { 'opacity-60 cursor-not-allowed': disabled }]">
    <slot />
    <button
      v-if="clearable"
      type="button"
      :disabled="disabled"
      :class="[
        'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none p-0.5 cursor-pointer',
        size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-4.5 h-4.5' : 'w-5 h-5',
        closeButtonColors
      ]"
      @click="handleClose"
    >
      <i :class="['mdi mdi-close-circle font-bold', size === 'lg' ? 'text-lg' : size === 'md' ? 'text-sm' : 'text-[11px]']" />
    </button>
  </span>
</template>

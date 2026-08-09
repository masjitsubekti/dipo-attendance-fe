<script setup lang="ts">
/**
 * UiCard - Card container with variant support
 * 
 * Variants:
 * - elevated (default): White bg with smooth shadow, no border
 * - outlined: White bg with border, no shadow
 * - flat: White bg only, no shadow, no border
 * - tonal: Subtle tinted background (slate-50), no shadow
 */
interface Props {
  hover?: boolean;
  padding?: boolean;
  variant?: 'elevated' | 'outlined' | 'flat' | 'tonal';
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  padding: true,
  variant: 'elevated',
});

const cardClass = computed(() => {
  const base = 'rounded-xl transition-all duration-300';

  const variantMap: Record<string, string> = {
    elevated: 'card',
    outlined: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    flat: 'bg-white dark:bg-slate-800',
    tonal: 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700',
  };

  const classes = [variantMap[props.variant] || variantMap.elevated];

  if (props.hover && props.variant === 'elevated') {
    classes[0] = 'card-hover';
  } else if (props.hover) {
    classes.push('hover:shadow-md hover:-translate-y-0.5 cursor-pointer');
  }

  if (props.padding) {
    classes.push('p-6');
  }

  if (props.variant !== 'elevated') {
    classes.push(base);
  }

  return classes;
});
</script>

<template>
  <div :class="cardClass">
    <div v-if="$slots.header" class="border-b border-slate-200 dark:border-slate-700 -mx-6 -mt-6 px-6 py-4 mb-6">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="border-t border-slate-200 dark:border-slate-700 -mx-6 -mb-6 px-6 py-4 mt-6">
      <slot name="footer" />
    </div>
  </div>
</template>

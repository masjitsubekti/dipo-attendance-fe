<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  message?: string;
  icon?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  detail?: Record<string, number>;
  detailConfig?: Record<string, { label: string; color: string; icon: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
});

const colorClasses = {
  primary:
    "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  success:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  warning:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

const formattedDetails = computed(() => {
  if (!props.detail || !props.detailConfig) return [];

  return Object.entries(props.detail).map(([key, value]) => ({
    label: props.detailConfig?.[key]?.label || key,
    value,
    color: props.detailConfig?.[key]?.color || "",
    icon: props.detailConfig?.[key]?.icon || "",
  }));
});

const hasDetail = computed(
  () => props.detail && Object.keys(props.detail).length > 0,
);
</script>

<template>
  <UiCard class="relative overflow-hidden">
    <div class="flex items-start justify-between">
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          {{ title }}
        </p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ value }}
        </p>
      </div>
      <div v-if="icon" :class="['p-2 rounded-xl px-3', colorClasses[color]]">
        <UiIcon :name="icon" type="mdi" size="2xl" />
      </div>
    </div>

    <div
      v-if="hasDetail"
      class="grid bg-none border-none grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full"
    >
      <div
        v-for="detail in formattedDetails"
        :key="detail.label"
        class="flex items-center gap-3 min-w-0"
      >
        <div
          v-if="detail.icon"
          :class="['p-1.5 rounded-lg px-2.5 shrink-0', detail.color]"
        >
          <UiIcon :name="detail.icon" type="mdi" size="xl" />
        </div>
        <div class="flex flex-col min-w-0">
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
            {{ detail.label }}
          </p>
          <p class="font-semibold text-slate-900 dark:text-white truncate">
            {{ detail.value }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else-if="message !== undefined"
      class="flex items-center gap-1 text-md font-semibold mt-6"
    >
      {{ message }}
    </div>
  </UiCard>
</template>

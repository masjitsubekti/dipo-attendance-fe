<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
    <div class="min-w-0">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        Dashboard Executive
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pemantauan &amp; analisis presensi pegawai secara real-time.
      </p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end">
      <div class="text-left sm:text-right">
        <h2 class="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
          {{ currentTime }}
        </h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
          {{ currentDate }}
        </p>
      </div>

      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <!-- Active Filter Pill Badges -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {{ currentInstitutionLabel }}
          </span>
          <span
            v-if="selectedDepartment !== 'all'"
            class="inline-flex max-w-[220px] items-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            :title="`Dept: ${currentDepartmentLabel}`"
          >
            <i class="mdi mdi-domain mr-1 shrink-0"></i>
            <span class="truncate">Dept: {{ currentDepartmentLabel }}</span>
          </span>
          <span
            class="inline-flex max-w-[260px] items-center rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
            :title="`Periode: ${dailyPeriodLabel}`"
          >
            <i class="mdi mdi-calendar-range mr-1 shrink-0"></i>
            <span class="truncate">{{ dailyPeriodLabel }}</span>
          </span>
          <span
            v-if="selectedMonthLabel"
            class="inline-flex max-w-[220px] items-center rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
            :title="`Bulan Grafik: ${selectedMonthLabel}`"
          >
            <i class="mdi mdi-calendar-month-outline mr-1 shrink-0"></i>
            <span class="truncate">Bulan: {{ selectedMonthLabel }}</span>
          </span>
        </div>

        <UiButton
          variant="outline"
          color="secondary"
          size="sm"
          class="flex w-full items-center justify-center gap-2 sm:w-auto cursor-pointer"
          :aria-expanded="showFilters"
          @click="$emit('toggle-filters')"
        >
          <i class="mdi mdi-filter-variant text-base"></i>
          Filter
          <i
            class="mdi text-base transition-transform"
            :class="showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          ></i>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentTime: string;
  currentDate: string;
  currentInstitutionLabel: string;
  currentDepartmentLabel: string;
  selectedDepartment: string;
  dailyPeriodLabel: string;
  selectedMonthLabel: string;
  showFilters: boolean;
}>();

defineEmits<{
  (e: "toggle-filters"): void;
}>();
</script>

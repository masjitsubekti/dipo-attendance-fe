<template>
  <UiCard class="lg:col-span-2" :padding="true">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Jumlah Pegawai Hadir per Departemen
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Analisis jumlah pegawai hadir antar departemen
        </p>
      </div>
      <UiBadge variant="success" class="text-xs font-semibold">{{ selectedMonthLabel }}</UiBadge>
    </div>

    <div class="h-[280px] w-full">
      <UiChart
        type="bar"
        height="280"
        :series="series"
        :options="options"
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
defineProps<{
  selectedMonthLabel: string;
  series: any[];
  options: any;
}>();
</script>

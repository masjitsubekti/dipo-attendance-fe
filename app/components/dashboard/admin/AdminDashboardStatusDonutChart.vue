<template>
  <UiCard class="flex flex-col justify-between" :padding="true">
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Proporsi Status Presensi
        </h2>
        <UiBadge variant="primary" class="text-xs font-semibold">{{ selectedMonthLabel }}</UiBadge>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Komposisi akumulasi status kehadiran pegawai
      </p>

      <div class="h-[240px] w-full flex items-center justify-center">
        <UiChart
          type="donut"
          height="240"
          :series="series"
          :options="options"
        />
      </div>
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

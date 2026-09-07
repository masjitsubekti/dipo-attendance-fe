<template>
  <div class="w-full">
    <UiCard :padding="true" class="w-full">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Tren Kehadiran Pegawai Harian
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Grafik jumlah Hadir Tepat Waktu, Terlambat, dan Absen/Izin secara harian
          </p>
        </div>

        <div>
          <UiBadge variant="success" class="text-xs font-semibold">
            <i class="mdi mdi-calendar-month-outline mr-1"></i>
            {{ selectedMonthLabel }}
          </UiBadge>
        </div>
      </div>

      <div class="h-[340px] w-full">
        <UiChart
          type="line"
          height="340"
          :series="series"
          :options="options"
        />
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  selectedMonthLabel: string;
  series: any[];
  options: any;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Card 1: Presensi Pegawai Summary -->
    <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex h-full flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                Summary Presensi
              </p>
              <p class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                {{ dailyPeriodLabel }}
              </p>
            </div>
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-400">
              <i class="mdi mdi-account-group-outline text-2xl"></i>
            </div>
          </div>

          <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div class="min-w-0 pr-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.totalPresent }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Hadir</span>
              </h3>
            </div>

            <div class="min-w-0 pl-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.onTimeCount }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Tepat Waktu</span>
              </h3>
            </div>
          </div>
        </div>

        <!-- Footer Breakdown for Card 1 -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1 font-medium">
            Total Pegawai: <strong class="text-slate-700 dark:text-slate-200 font-bold">{{ metrics.totalEmployees }}</strong>
          </span>
          <span class="inline-flex items-center gap-1 font-medium">
            Kehadiran: <strong class="text-slate-700 dark:text-slate-200 font-bold">{{ metrics.attendancePercentage }}%</strong>
          </span>
        </div>
      </div>
    </UiCard>

    <!-- Card 2: Keterlambatan & Pulang Cepat (Disiplin Jam Kerja) -->
    <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex h-full flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                Terlambat & Pulang Cepat
              </p>
              <p class="text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                {{ dailyPeriodLabel }}
              </p>
            </div>
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-400">
              <i class="mdi mdi-clock-alert-outline text-2xl"></i>
            </div>
          </div>

          <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div class="min-w-0 pr-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.lateCount }}
                <span class="text-xs font-bold text-amber-600 dark:text-amber-400">Telat</span>
              </h3>
            </div>

            <div class="min-w-0 pl-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.earlyLeaveCount }}
                <span class="text-xs font-bold text-orange-600 dark:text-orange-400">Plg Cepat</span>
              </h3>
            </div>
          </div>
        </div>

        <!-- Footer Breakdown for Card 2 -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1 font-medium">
            <strong class="text-amber-600 dark:text-amber-400 font-bold">{{ metrics.totalLateHours }}j ({{ metrics.totalLateMinutes }}m)</strong>
          </span>
          <span class="inline-flex items-center gap-1 font-medium">
            <strong class="text-orange-600 dark:text-orange-400 font-bold">{{ metrics.totalEarlyLeaveHours }}j ({{ metrics.totalEarlyLeaveMinutes }}m)</strong>
          </span>
        </div>
      </div>
    </UiCard>

    <!-- Card 3: Izin, Cuti & Dinas Luar -->
    <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex h-full flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                Izin, Cuti &amp; Dinas Luar
              </p>
              <p class="text-[10px] font-semibold text-blue-600 dark:text-blue-300">
                {{ dailyPeriodLabel }}
              </p>
            </div>
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/40 dark:text-blue-400">
              <i class="mdi mdi-account-clock-outline text-2xl"></i>
            </div>
          </div>

          <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div class="min-w-0 pr-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.sickCount + metrics.leaveCount + metrics.permitCount }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Izin/Cuti</span>
              </h3>
            </div>

            <div class="min-w-0 pl-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.dutyCount }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Dinas</span>
              </h3>
            </div>
          </div>
        </div>

        <!-- Footer Breakdown for Sakit, Cuti & Izin -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1 font-medium">
            Sakit: <strong class="text-slate-700 dark:text-slate-200 font-bold">{{ metrics.sickCount }}</strong>
          </span>
          <span class="inline-flex items-center gap-1 font-medium">
            Cuti: <strong class="text-slate-700 dark:text-slate-200 font-bold">{{ metrics.leaveCount }}</strong>
          </span>
          <span class="inline-flex items-center gap-1 font-medium">
            Izin Lainnya: <strong class="text-slate-700 dark:text-slate-200 font-bold">{{ metrics.permitCount }}</strong>
          </span>
        </div>
      </div>
    </UiCard>

    <!-- Card 4: Mangkir & Alpha Alert -->
    <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex h-full flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-1">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                Mangkir &amp; Alpha
              </p>
              <p class="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {{ dailyPeriodLabel }}
              </p>
            </div>
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-400">
              <i class="mdi mdi-alert-octagon-outline text-2xl"></i>
            </div>
          </div>

          <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div class="min-w-0 pr-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.mangkirCount }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Mangkir</span>
              </h3>
            </div>

            <div class="min-w-0 pl-3 text-left">
              <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                {{ metrics.alphaCount }}
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Alpha</span>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
interface Metrics {
  totalEmployees: number;
  totalPresent: number;
  attendancePercentage: number;
  onTimeCount: number;
  lateCount: number;
  pendingCheckinCount: number;
  totalLateMinutes: number;
  totalLateHours: number;
  totalEarlyLeaveMinutes: number;
  totalEarlyLeaveHours: number;
  earlyLeaveCount: number;
  avgLateMins: number;
  severeLateCount: number;
  totalPermits: number;
  sickCount: number;
  leaveCount: number;
  permitCount: number;
  dutyCount: number;
  totalAbsenceAlert: number;
  mangkirCount: number;
  alphaCount: number;
}

defineProps<{
  metrics: Metrics;
  dailyPeriodLabel: string;
  comparisonLabel: string;
}>();
</script>

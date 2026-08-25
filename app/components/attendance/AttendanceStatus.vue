<script setup lang="ts">
import type { AttendanceRecord } from '~/types/attendance';

interface Props {
  attendance: AttendanceRecord | null;
  canCheckin: boolean;
  canCheckout: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { loading: false });

const { formatDate } = useFormat();

const formatTime = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '—';
  return formatDate(isoStr, 'HH:mm', true);
};

const formatDateHeader = (): string => {
  return formatDate(new Date(), 'dddd, DD MMMM YYYY', false);
};

const statusConfig = computed(() => {
  const att = props.attendance;
  if (!att?.checkinTime && !att?.checkoutTime) return { label: 'Belum Presensi', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-white dark:bg-slate-900', dot: 'bg-slate-400' };
  if (att?.checkinTime && !att?.checkoutTime) return { label: 'Sedang Bekerja', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', dot: 'bg-emerald-500 animate-pulse' };
  return { label: 'Selesai', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/70 dark:bg-blue-950/30', dot: 'bg-blue-500' };
});

const statusLabelMap: Record<string, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  absent: 'Tidak Hadir',
  incomplete: 'Belum Lengkap',
  leave: 'Cuti',
  holiday: 'Libur',
};
</script>

<template>
  <div class="mt-2">
    <!-- Date banner -->
    <p class="text-center text-xs text-slate-500 dark:text-slate-400 mb-3 capitalize font-medium">{{ formatDateHeader() }}</p>

    <!-- Main status card -->
    <div
      :class="[
        'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300',
        statusConfig.bg,
      ]"
    >
      <!-- Skeleton loading -->
      <div v-if="loading" class="p-5 animate-pulse space-y-4">
        <div class="flex justify-between">
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
        </div>
        <div class="flex justify-around">
          <div class="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl w-28"></div>
          <div class="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl w-28"></div>
        </div>
      </div>

      <div v-else class="p-5">
        <!-- Header row -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-slate-800 dark:text-white">Presensi Hari Ini</span>
          <div class="flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full', statusConfig.dot]"></span>
            <span :class="['text-xs font-medium', statusConfig.color]">{{ statusConfig.label }}</span>
          </div>
        </div>

        <!-- Check In / Check Out times -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Check In -->
          <div
            :class="[
              'rounded-xl p-3.5 flex flex-col gap-1.5 border transition-colors',
              attendance?.checkinTime
                ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700/40'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30',
            ]"
          >
            <div class="flex items-center gap-1.5">
              <i class="mdi mdi-login text-xs" :class="attendance?.checkinTime ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'"></i>
              <span class="text-xs text-slate-500 dark:text-slate-400">Check In</span>
            </div>
            <span
              :class="[
                'text-2xl font-bold tracking-tight leading-none',
                attendance?.checkinTime ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-600',
              ]"
            >
              {{ formatTime(attendance?.checkinTime) }}
            </span>
            <div v-if="attendance?.lateMinutes && attendance.lateMinutes > 0" class="flex items-center gap-1">
              <i class="mdi mdi-clock-alert-outline text-[10px] text-amber-600 dark:text-amber-400"></i>
              <span class="text-[10px] text-amber-600 dark:text-amber-400">Terlambat {{ attendance.lateMinutes }} mnt</span>
            </div>
          </div>

          <!-- Check Out -->
          <div
            :class="[
              'rounded-xl p-3.5 flex flex-col gap-1.5 border transition-colors',
              attendance?.checkoutTime
                ? 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700/40'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30',
            ]"
          >
            <div class="flex items-center gap-1.5">
              <i class="mdi mdi-logout text-xs" :class="attendance?.checkoutTime ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"></i>
              <span class="text-xs text-slate-500 dark:text-slate-400">Check Out</span>
            </div>
            <span
              :class="[
                'text-2xl font-bold tracking-tight leading-none',
                attendance?.checkoutTime ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-600',
              ]"
            >
              {{ formatTime(attendance?.checkoutTime) }}
            </span>
            <div v-if="attendance?.earlyLeaveMinutes && attendance.earlyLeaveMinutes > 0" class="flex items-center gap-1">
              <i class="mdi mdi-exit-run text-[10px] text-rose-600 dark:text-rose-400"></i>
              <span class="text-[10px] text-rose-600 dark:text-rose-400">Pulang cepat {{ attendance.earlyLeaveMinutes }} mnt</span>
            </div>
            <div v-if="attendance?.overtimeMinutes && attendance.overtimeMinutes > 0" class="flex items-center gap-1">
              <i class="mdi mdi-briefcase-clock text-[10px] text-purple-600 dark:text-purple-400"></i>
              <span class="text-[10px] text-purple-600 dark:text-purple-400">Lembur {{ attendance.overtimeMinutes }} mnt</span>
            </div>
          </div>
        </div>

        <!-- Status badge -->
        <div v-if="attendance?.status" class="mt-3 flex justify-center">
          <span
            :class="[
              'text-xs font-semibold px-3 py-1 rounded-full border',
              attendance.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/40' :
              attendance.status === 'late' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/40' :
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
            ]"
          >
            {{ statusLabelMap[attendance.status] || attendance.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

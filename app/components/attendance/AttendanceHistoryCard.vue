<script setup lang="ts">
import type { AttendanceRecord } from '~/types/attendance';

interface Props {
  attendance: AttendanceRecord;
}

defineProps<Props>();

const { formatDate } = useFormat();

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return formatDate(iso, 'HH:mm', true);
};

const formatDateLabel = (iso: string): string => {
  return formatDate(iso, 'ddd, DD MMM YYYY', true);
};

const statusConfig = (status: string | null) => {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: 'Hadir', cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/40' },
    late: { label: 'Terlambat', cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/40' },
    incomplete: { label: 'Belum Lengkap', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700/40' },
    absent: { label: 'Tidak Hadir', cls: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700/40' },
    leave: { label: 'Cuti', cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700/40' },
  };
  return map[status || ''] ?? { label: status || '—', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700' };
};
</script>

<template>
  <div class="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
    <!-- Date header -->
    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-800 dark:text-white capitalize">
        {{ formatDateLabel(attendance.attendanceDate) }}
      </p>
      <span
        :class="['text-[11px] font-semibold px-2.5 py-1 rounded-full border', statusConfig(attendance.status).cls]"
      >
        {{ statusConfig(attendance.status).label }}
      </span>
    </div>

    <!-- Times row -->
    <div class="flex gap-3">
      <div class="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/30">
        <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
          <i class="mdi mdi-login text-emerald-600 dark:text-emerald-500"></i> Check In
        </p>
        <p class="text-base font-bold" :class="attendance.checkinTime ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'">
          {{ formatTime(attendance.checkinTime) }}
        </p>
      </div>
      <div class="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/30">
        <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
          <i class="mdi mdi-logout text-blue-600 dark:text-blue-500"></i> Check Out
        </p>
        <p class="text-base font-bold" :class="attendance.checkoutTime ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'">
          {{ formatTime(attendance.checkoutTime) }}
        </p>
      </div>
    </div>

    <!-- Additional stats -->
    <div v-if="attendance.lateMinutes || attendance.earlyLeaveMinutes || attendance.overtimeMinutes" class="flex flex-wrap gap-2">
      <span v-if="attendance.lateMinutes && attendance.lateMinutes > 0" class="text-[10px] px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30">
        <i class="mdi mdi-clock-alert-outline mr-1"></i>Terlambat {{ attendance.lateMinutes }}m
      </span>
      <span v-if="attendance.earlyLeaveMinutes && attendance.earlyLeaveMinutes > 0" class="text-[10px] px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/30">
        <i class="mdi mdi-exit-run mr-1"></i>Pulang cepat {{ attendance.earlyLeaveMinutes }}m
      </span>
      <span v-if="attendance.overtimeMinutes && attendance.overtimeMinutes > 0" class="text-[10px] px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700/30">
        <i class="mdi mdi-briefcase-clock mr-1"></i>Lembur {{ attendance.overtimeMinutes }}m
      </span>
    </div>
  </div>
</template>

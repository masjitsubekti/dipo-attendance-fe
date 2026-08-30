<script setup lang="ts">
import type { AttendanceRecord } from '~/types/attendance';

interface Props {
  attendance: AttendanceRecord;
}

const props = defineProps<Props>();

const { formatDate } = useFormat();
const { getFileUrl } = useFileUrl();

const formatDateLabel = (iso: string): string => {
  return formatDate(iso, 'dddd, D MMMM YYYY', true);
};

const formatTimeWithSeconds = (iso: string | null | undefined): string => {
  if (!iso) return '--:--:--';
  return formatDate(iso, 'HH:mm:ss', true);
};

const durationText = computed(() => {
  if (!props.attendance.checkinTime || !props.attendance.checkoutTime) return null;
  const start = new Date(props.attendance.checkinTime).getTime();
  const end = new Date(props.attendance.checkoutTime).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const diffSecs = Math.floor((end - start) / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} Menit`);
  parts.push(`${seconds} Detik`);
  return parts.join(' ');
});

const statusConfig = (status: string | null) => {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: 'Hadir', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40' },
    late: { label: 'Terlambat', cls: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40' },
    incomplete: { label: 'Belum Lengkap', cls: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/40' },
    absent: { label: 'Tidak Hadir', cls: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40' },
    leave: { label: 'Cuti', cls: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/40' },
  };
  return map[status || ''] ?? { label: status || '—', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
};
</script>

<template>
  <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
    <!-- Top Header: Date & Status Badge -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-white capitalize leading-snug">
          {{ formatDateLabel(attendance.attendanceDate) }}
        </h3>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
          {{ durationText || (attendance.checkinTime ? 'Sedang Bekerja / Belum Checkout' : 'Belum Ada Presensi') }}
        </p>
      </div>

      <span
        :class="['text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0', statusConfig(attendance.status).cls]"
      >
        {{ statusConfig(attendance.status).label }}
      </span>
    </div>

    <!-- Bottom Row: Check In & Check Out with Avatars -->
    <div class="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
      <!-- Check In Column -->
      <div class="flex items-center gap-2">
        <div class="shrink-0">
          <img
            v-if="attendance.checkinPhoto"
            :src="getFileUrl(attendance.checkinPhoto)"
            alt="Check In"
            class="w-9 h-9 rounded-full object-cover border border-amber-300 dark:border-amber-500/40 shadow-xs"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <i class="mdi mdi-account text-xl"></i>
          </div>
        </div>

        <div class="space-y-0.5 min-w-0">
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">CHECK IN</span>
          <div class="flex items-center gap-1">
            <span
              class="px-2 py-0.5 rounded-md border text-xs font-semibold font-mono tracking-tight"
              :class="attendance.checkinTime ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'"
            >
              {{ formatTimeWithSeconds(attendance.checkinTime) }}
            </span>
            <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">WIB</span>
          </div>
        </div>
      </div>

      <!-- Check Out Column -->
      <div class="flex items-center gap-2">
        <div class="shrink-0">
          <img
            v-if="attendance.checkoutPhoto"
            :src="getFileUrl(attendance.checkoutPhoto)"
            alt="Check Out"
            class="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-xs"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <i class="mdi mdi-account text-xl"></i>
          </div>
        </div>

        <div class="space-y-0.5 min-w-0">
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">CHECK OUT</span>
          <div class="flex items-center gap-1">
            <span
              class="px-2 py-0.5 rounded-md border text-xs font-semibold font-mono tracking-tight"
              :class="attendance.checkoutTime ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'"
            >
              {{ formatTimeWithSeconds(attendance.checkoutTime) }}
            </span>
            <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">WIB</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional stats -->
    <div v-if="attendance.lateMinutes || attendance.earlyLeaveMinutes || attendance.overtimeMinutes" class="flex flex-wrap gap-1.5 pt-1">
      <span v-if="attendance.lateMinutes && attendance.lateMinutes > 0" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30 font-medium">
        <i class="mdi mdi-clock-alert-outline mr-0.5"></i>Terlambat {{ attendance.lateMinutes }}m
      </span>
      <span v-if="attendance.earlyLeaveMinutes && attendance.earlyLeaveMinutes > 0" class="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/30 font-medium">
        <i class="mdi mdi-exit-run mr-0.5"></i>Pulang cepat {{ attendance.earlyLeaveMinutes }}m
      </span>
      <span v-if="attendance.overtimeMinutes && attendance.overtimeMinutes > 0" class="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700/30 font-medium">
        <i class="mdi mdi-briefcase-clock mr-0.5"></i>Lembur {{ attendance.overtimeMinutes }}m
      </span>
    </div>
  </div>
</template>

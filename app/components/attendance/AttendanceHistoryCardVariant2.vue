<script setup lang="ts">
import type { AttendanceRecord } from '~/types/attendance';

interface Props {
  attendance: AttendanceRecord;
}

const props = defineProps<Props>();

const { formatDate } = useFormat();

const dayNames: Record<number, string> = {
  0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu'
};

const monthNames: Record<number, string> = {
  0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mei', 5: 'Jun',
  6: 'Jul', 7: 'Agt', 8: 'Sep', 9: 'Okt', 10: 'Nov', 11: 'Des'
};

const formatDateLabel = (iso: string): string => {
  if (!iso) return '-';
  const formatted = formatDate(iso, 'dddd, D MMM YYYY', true);
  if (formatted && formatted !== '-' && !/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December/i.test(formatted)) {
    return formatted;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dayName = dayNames[d.getUTCDay()] ?? '';
  const dateNum = d.getUTCDate();
  const monthName = monthNames[d.getUTCMonth()] ?? '';
  const year = d.getUTCFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
};

const formatTimeShort = (iso: string | null | undefined): string => {
  if (!iso) return '--:--';
  return formatDate(iso, 'HH:mm', true);
};

const statusConfig = (status: string | null) => {
  const map: Record<string, { label: string; badgeCls: string; borderCls: string; iconCls: string }> = {
    present: {
      label: 'Hadir',
      badgeCls: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
      borderCls: 'border-l-emerald-500',
      iconCls: 'text-emerald-600 dark:text-emerald-400',
    },
    late: {
      label: 'Terlambat',
      badgeCls: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
      borderCls: 'border-l-amber-500',
      iconCls: 'text-amber-600 dark:text-amber-400',
    },
    incomplete: {
      label: 'Belum Lengkap',
      badgeCls: 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400',
      borderCls: 'border-l-orange-500',
      iconCls: 'text-orange-600 dark:text-orange-400',
    },
    absent: {
      label: 'Tidak Hadir',
      badgeCls: 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400',
      borderCls: 'border-l-rose-500',
      iconCls: 'text-rose-600 dark:text-rose-400',
    },
    leave: {
      label: 'Izin / Cuti',
      badgeCls: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400',
      borderCls: 'border-l-purple-500',
      iconCls: 'text-purple-600 dark:text-purple-400',
    },
  };
  return (
    map[status || ''] ?? {
      label: status || '—',
      badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      borderCls: 'border-l-slate-400',
      iconCls: 'text-slate-600',
    }
  );
};

const locationName = computed(() => {
  return (
    (props.attendance as any).checkinLocationName ||
    (props.attendance as any).locationName ||
    (props.attendance as any).checkoutLocationName ||
    'Lokasi Presensi'
  );
});
</script>

<template>
  <div
    class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-l-[4px] p-3.5 sm:p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
    :class="statusConfig(attendance.status).borderCls"
  >
    <!-- Top Row: Date & Status Badge -->
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
        {{ formatDateLabel(attendance.attendanceDate) }}
      </h3>
      <span
        :class="[
          'text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0',
          statusConfig(attendance.status).badgeCls,
        ]"
      >
        {{ statusConfig(attendance.status).label }}
      </span>
    </div>

    <!-- Middle Row: Check-in & Check-out -->
    <div class="grid grid-cols-2 gap-3 py-0.5 text-xs">
      <!-- Check-in column -->
      <div class="space-y-0.5">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Check-in</span>
        <div class="flex items-center gap-1.5">
          <i
            class="mdi mdi-login text-base font-bold"
            :class="attendance.checkinTime ? statusConfig(attendance.status).iconCls : 'text-slate-300 dark:text-slate-700'"
          ></i>
          <span class="text-base sm:text-lg font-extrabold font-mono tracking-tight text-slate-800 dark:text-slate-100">
            {{ formatTimeShort(attendance.checkinTime) }}
          </span>
        </div>
      </div>

      <!-- Check-out column -->
      <div class="space-y-0.5 pl-3 border-l border-slate-100 dark:border-slate-800">
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Check-out</span>
        <div class="flex items-center gap-1.5">
          <i
            class="mdi mdi-logout text-base font-bold"
            :class="attendance.checkoutTime ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'"
          ></i>
          <span class="text-base sm:text-lg font-extrabold font-mono tracking-tight text-slate-800 dark:text-slate-100">
            {{ formatTimeShort(attendance.checkoutTime) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Location & Time Offsets (Terlambat & Pulang Cepat) -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium truncate flex-1 min-w-[120px]">
        <i class="mdi mdi-map-marker text-slate-400 dark:text-slate-500 text-sm shrink-0"></i>
        <span class="truncate text-[11px] sm:text-xs">{{ locationName }}</span>
      </div>

      <!-- Terlambat & Pulang Cepat Badges -->
      <div v-if="attendance.lateMinutes || attendance.earlyLeaveMinutes" class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="attendance.lateMinutes && attendance.lateMinutes > 0"
          class="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-full"
        >
          <i class="mdi mdi-clock-alert-outline"></i>
          Terlambat {{ attendance.lateMinutes }}m
        </span>

        <span
          v-if="attendance.earlyLeaveMinutes && attendance.earlyLeaveMinutes > 0"
          class="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 px-2 py-0.5 rounded-full"
        >
          <i class="mdi mdi-exit-run"></i>
          Pulang cepat {{ attendance.earlyLeaveMinutes }}m
        </span>
      </div>
    </div>
  </div>
</template>

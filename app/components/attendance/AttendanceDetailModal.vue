<script setup lang="ts">
import type { AttendanceRecord } from '~/types/attendance';

interface Props {
  modelValue: boolean;
  attendance: AttendanceRecord | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const { formatDate } = useFormat();
const { getFileUrl } = useFileUrl();

const formatDateFull = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return formatDate(iso, 'dddd, D MMMM YYYY', true);
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return formatDate(iso, 'HH:mm:ss', true);
};

const statusConfig = (status: string | null) => {
  const map: Record<string, { label: string; badgeCls: string }> = {
    present: {
      label: 'Hadir Tepat Waktu',
      badgeCls: 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
    },
    late: {
      label: 'Terlambat',
      badgeCls: 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
    },
    incomplete: {
      label: 'Belum Lengkap',
      badgeCls: 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700/50',
    },
    absent: {
      label: 'Tidak Hadir',
      badgeCls: 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700/50',
    },
    leave: {
      label: 'Izin / Cuti',
      badgeCls: 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50',
    },
  };
  return (
    map[status || ''] ?? {
      label: status || '—',
      badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    }
  );
};
</script>

<template>
  <UiModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :size="size"
  >
    <!-- Custom Header Slot -->
    <template #header>
      <div v-if="attendance" class="flex items-center justify-between w-full">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white capitalize leading-tight">
            {{ formatDateFull(attendance.attendanceDate) }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">Rincian Lengkap Presensi Harian</p>
        </div>

        <span :class="['text-xs font-semibold px-2.5 py-0.5 rounded-full border mr-2 shrink-0', statusConfig(attendance.status).badgeCls]">
          {{ statusConfig(attendance.status).label }}
        </span>
      </div>
    </template>

    <!-- Modal Content Body -->
    <div v-if="attendance" class="space-y-4">
      <!-- Photos Card Section -->
      <div v-if="attendance.checkinPhoto || attendance.checkoutPhoto" class="grid grid-cols-2 gap-3">
        <!-- Checkin Photo -->
        <div v-if="attendance.checkinPhoto" class="space-y-1">
          <div class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-100 dark:bg-slate-800 shadow-xs">
            <img :src="getFileUrl(attendance.checkinPhoto)" alt="Presensi Masuk" class="w-full h-full object-cover" />
            <div class="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
              <span class="flex items-center gap-1">
                <i class="mdi mdi-login text-emerald-400"></i> Masuk
              </span>
              <span class="font-mono">{{ formatTime(attendance.checkinTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Checkout Photo -->
        <div v-if="attendance.checkoutPhoto" class="space-y-1">
          <div class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-100 dark:bg-slate-800 shadow-xs">
            <img :src="getFileUrl(attendance.checkoutPhoto)" alt="Presensi Pulang" class="w-full h-full object-cover" />
            <div class="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
              <span class="flex items-center gap-1">
                <i class="mdi mdi-logout text-blue-400"></i> Pulang
              </span>
              <span class="font-mono">{{ formatTime(attendance.checkoutTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Time & Radius Info Grid -->
      <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
        <div class="space-y-1">
          <span class="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">PRESENSI MASUK</span>
          <p class="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
            {{ formatTime(attendance.checkinTime) }}
            <span class="text-[11px] font-normal text-slate-500">WIB</span>
          </p>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
            <p v-if="attendance.checkinDistanceMeter !== null" class="flex items-center gap-1 truncate">
              <i class="mdi mdi-map-marker-distance text-emerald-500"></i> Jarak: {{ attendance.checkinDistanceMeter }}m
            </p>
            <p v-if="attendance.checkinLatitude" class="font-mono text-[10px] text-slate-400 truncate">
              {{ attendance.checkinLatitude }}, {{ attendance.checkinLongitude }}
            </p>
          </div>
        </div>

        <div class="space-y-1 pl-3 border-l border-slate-200 dark:border-slate-700/60">
          <span class="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">PRESENSI PULANG</span>
          <p class="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
            {{ formatTime(attendance.checkoutTime) }}
            <span class="text-[11px] font-normal text-slate-500">WIB</span>
          </p>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
            <p v-if="attendance.checkoutDistanceMeter !== null" class="flex items-center gap-1 truncate">
              <i class="mdi mdi-map-marker-distance text-blue-500"></i> Jarak: {{ attendance.checkoutDistanceMeter }}m
            </p>
            <p v-if="attendance.checkoutLatitude" class="font-mono text-[10px] text-slate-400 truncate">
              {{ attendance.checkoutLatitude }}, {{ attendance.checkoutLongitude }}
            </p>
          </div>
        </div>
      </div>

      <!-- Detail Specs List -->
      <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 text-xs">
        <!-- Location Name -->
        <div v-if="(attendance as any).locationName || (attendance as any).checkinLocationName" class="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Lokasi Presensi</span>
          <span class="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
            <i class="mdi mdi-map-marker text-blue-500"></i>
            {{ (attendance as any).locationName || (attendance as any).checkinLocationName }}
          </span>
        </div>

        <!-- Late Duration -->
        <div v-if="attendance.lateMinutes" class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Keterlambatan</span>
          <span class="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
            {{ attendance.lateMinutes }} Menit
          </span>
        </div>

        <!-- Early Leave Duration -->
        <div v-if="attendance.earlyLeaveMinutes" class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400 font-medium">Pulang Cepat</span>
          <span class="text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
            {{ attendance.earlyLeaveMinutes }} Menit
          </span>
        </div>

        <!-- Notes -->
        <div v-if="attendance.note" class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <span class="text-slate-500 dark:text-slate-400 font-medium block">Catatan</span>
          <p class="text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            "{{ attendance.note }}"
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Footer Actions -->
    <template #actions>
      <button
        type="button"
        @click="emit('update:modelValue', false)"
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        Tutup
      </button>
    </template>
  </UiModal>
</template>

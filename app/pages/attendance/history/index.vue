<script setup lang="ts">
import { attendanceService } from '~/services/attendance.service';
import { useToast } from '~/composables/useToast';
import type { AttendanceRecord, AttendancePaginatedMeta } from '~/types/attendance';

definePageMeta({ layout: 'attendance' });
useHead({ title: 'Riwayat Presensi' });

const toast = useToast();
const router = useRouter();

// ==================== Filters ====================
const selectedMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
const selectedStatus = ref('');
const page = ref(1);
const limit = ref(15);

// ==================== State ====================
const historyData = ref<AttendanceRecord[]>([]);
const meta = ref<AttendancePaginatedMeta | null>(null);
const loading = ref(false);
const selectedAttendance = ref<AttendanceRecord | null>(null);
const cardVariant = ref<'v1' | 'v2'>('v2'); // Default to Model 2 accent border style
const showDetail = ref(false);

// ==================== Fetch ====================
const fetchHistory = async () => {
  loading.value = true;
  try {
    const [year, month] = selectedMonth.value.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const res = await attendanceService.getHistory({
      page: page.value,
      limit: limit.value,
      start_date: startDate,
      end_date: endDate,
      status: selectedStatus.value || undefined,
    });

    historyData.value = res.data;
    meta.value = res.meta;
  } catch (err: any) {
    toast.error('Gagal memuat riwayat', err?.message || 'Terjadi kesalahan');
  } finally {
    loading.value = false;
  }
};

const openDetail = (att: AttendanceRecord) => {
  selectedAttendance.value = att;
  showDetail.value = true;
};

const { formatDate } = useFormat();

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return formatDate(iso, 'HH:mm', true);
};

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return formatDate(iso, 'DD MMM YYYY, HH:mm', true);
};

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - i);
  return {
    value: d.toISOString().slice(0, 7),
    label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  };
});

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'present', label: 'Hadir' },
  { value: 'late', label: 'Terlambat' },
  { value: 'incomplete', label: 'Belum Lengkap' },
  { value: 'absent', label: 'Tidak Hadir' },
];

watch([selectedMonth, selectedStatus], () => {
  page.value = 1;
  fetchHistory();
});

onMounted(fetchHistory);
</script>

<template>
  <div class="flex flex-col min-h-screen max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-8 transition-colors duration-200">
    <!-- Sticky header -->
    <div class="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs px-4 pt-5 pb-3 space-y-3 max-w-full">
      <!-- Row 1: Back & Title -->
      <div class="flex items-center justify-between min-w-0">
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="router.back()"
            class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <i class="mdi mdi-arrow-left text-slate-700 dark:text-slate-200 text-lg"></i>
          </button>
          <div class="min-w-0">
            <h1 class="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">Riwayat Presensi</h1>
            <p v-if="meta" class="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{{ meta.total }} data kehadiran</p>
          </div>
        </div>
      </div>

      <!-- Row 2: Filter Card with UiSelect -->
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex-1 min-w-0">
          <UiSelect
            v-model="selectedMonth"
            :options="months"
            size="sm"
            item-value="value"
            item-title="label"
            placeholder="Pilih Bulan"
          />
        </div>

        <div class="flex-1 min-w-0">
          <UiSelect
            v-model="selectedStatus"
            :options="statusOptions"
            size="sm"
            item-value="value"
            item-title="label"
            placeholder="Filter Status"
          />
        </div>
      </div>
    </div>

    <!-- Content Container with clear boundary -->
      <div class="flex-1 bg-slate-100/80 dark:bg-slate-900/40 border-t border-slate-200/90 dark:border-slate-800 px-4 pt-4 pb-8 space-y-3">
      <!-- Loading skeleton -->
      <template v-if="loading">
        <div v-for="i in 6" :key="i" class="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 animate-pulse space-y-3">
          <div class="flex justify-between">
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
          <div class="flex gap-3">
            <div class="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1"></div>
            <div class="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1"></div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="historyData.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i class="mdi mdi-calendar-blank-outline text-3xl text-slate-400 dark:text-slate-600"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-1">Tidak ada data presensi</p>
        <p class="text-xs text-slate-500 dark:text-slate-600">Coba ubah filter bulan atau status</p>
      </div>

      <!-- List -->
      <template v-else>
        <div
          v-for="att in historyData"
          :key="att.id"
          @click="openDetail(att)"
          class="cursor-pointer"
        >
          <AttendanceHistoryCardVariant2 :attendance="att" />
        </div>
      </template>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-center gap-3 pt-4">
        <button
          :disabled="page === 1"
          @click="page--; fetchHistory()"
          class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <i class="mdi mdi-chevron-left text-slate-800 dark:text-white"></i>
        </button>
        <span class="text-sm text-slate-600 dark:text-slate-400">{{ page }} / {{ meta.totalPages }}</span>
        <button
          :disabled="page === meta.totalPages"
          @click="page++; fetchHistory()"
          class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <i class="mdi mdi-chevron-right text-slate-800 dark:text-white"></i>
        </button>
      </div>
    </div>

    <!-- Attendance Detail Modal Component -->
    <AttendanceDetailModal
      v-model="showDetail"
      size="lg"
      :attendance="selectedAttendance"
    />
  </div>
</template>

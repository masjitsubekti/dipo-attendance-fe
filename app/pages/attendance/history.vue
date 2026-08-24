<script setup lang="ts">
import { attendanceService } from '~/services/attendance.service';
import { useToast } from '~/composables/useToast';
import type { AttendanceRecord, AttendancePaginatedMeta } from '~/types/attendance';

definePageMeta({ layout: 'admin' });
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
  <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-8 transition-colors duration-200">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60 shadow-sm">
      <div class="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          @click="router.back()"
          class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <i class="mdi mdi-arrow-left text-slate-800 dark:text-white"></i>
        </button>
        <div>
          <h1 class="text-base font-bold text-slate-900 dark:text-white leading-tight">Riwayat Presensi</h1>
          <p v-if="meta" class="text-xs text-slate-500 dark:text-slate-400">{{ meta.total }} data ditemukan</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="px-4 pb-4 flex gap-2">
        <select
          v-model="selectedMonth"
          class="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white appearance-none focus:outline-none focus:border-blue-500"
        >
          <option v-for="m in months" :key="m.value" :value="m.value" class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{{ m.label }}</option>
        </select>

        <select
          v-model="selectedStatus"
          class="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white appearance-none focus:outline-none focus:border-blue-500"
        >
          <option v-for="s in statusOptions" :key="s.value" :value="s.value" class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{{ s.label }}</option>
        </select>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 mt-4 space-y-3">
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
          <AttendanceHistoryCard :attendance="att" />
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

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-4" leave-active-class="transition duration-150" leave-to-class="opacity-0 translate-y-4">
        <div v-if="showDetail && selectedAttendance" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" @click.self="showDetail = false">
          <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto shadow-xl">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Detail Presensi</h3>
              <button @click="showDetail = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <i class="mdi mdi-close text-slate-700 dark:text-white"></i>
              </button>
            </div>

            <div class="p-5 space-y-5">
              <!-- Photos -->
              <div v-if="selectedAttendance.checkinPhoto || selectedAttendance.checkoutPhoto" class="grid grid-cols-2 gap-3">
                <div v-if="selectedAttendance.checkinPhoto">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><i class="mdi mdi-login text-emerald-600 dark:text-emerald-400"></i> Foto Check In</p>
                  <img :src="selectedAttendance.checkinPhoto" alt="Check In" class="w-full aspect-[4/3] object-cover rounded-xl" />
                </div>
                <div v-if="selectedAttendance.checkoutPhoto">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><i class="mdi mdi-logout text-blue-600 dark:text-blue-400"></i> Foto Check Out</p>
                  <img :src="selectedAttendance.checkoutPhoto" alt="Check Out" class="w-full aspect-[4/3] object-cover rounded-xl" />
                </div>
              </div>

              <!-- Details table -->
              <div class="space-y-3">
                <div v-for="row in [
                  { label: 'Check In', value: formatDateTime(selectedAttendance.checkinTime) },
                  { label: 'Check Out', value: formatDateTime(selectedAttendance.checkoutTime) },
                  { label: 'Lokasi Masuk', value: selectedAttendance.checkinDistanceMeter !== null ? `${selectedAttendance.checkinDistanceMeter} m dari lokasi` : '—' },
                  { label: 'Lokasi Keluar', value: selectedAttendance.checkoutDistanceMeter !== null ? `${selectedAttendance.checkoutDistanceMeter} m dari lokasi` : '—' },
                  { label: 'Terlambat', value: selectedAttendance.lateMinutes ? `${selectedAttendance.lateMinutes} menit` : '—' },
                  { label: 'Pulang cepat', value: selectedAttendance.earlyLeaveMinutes ? `${selectedAttendance.earlyLeaveMinutes} menit` : '—' },
                  { label: 'Lembur', value: selectedAttendance.overtimeMinutes ? `${selectedAttendance.overtimeMinutes} menit` : '—' },
                ]" :key="row.label" class="flex justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ row.label }}</span>
                  <span class="text-slate-900 dark:text-white font-medium text-right">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

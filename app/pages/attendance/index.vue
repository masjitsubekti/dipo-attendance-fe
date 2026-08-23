<script setup lang="ts">
import { attendanceService } from '~/services/attendance.service';
import { useGeolocation } from '~/composables/useGeolocation';
import { useAuthStore } from '~/stores/auth';
import { useSwal } from '~/composables/useSwal';
import { useToast } from '~/composables/useToast';
import type { AttendanceTodayResponse, AttendanceLocation, AttendanceRecord } from '~/types/attendance';

// ==================== Layout ====================
definePageMeta({ layout: 'attendance' });
useHead({ title: 'Presensi Pegawai' });

// ==================== State ====================
const authStore = useAuthStore();
const swal = useSwal();
const toast = useToast();
const {
  latitude, longitude, loading: gpsLoading, error: gpsError,
  permissionStatus, requestPosition, startWatching,
} = useGeolocation();

const todayData = ref<AttendanceTodayResponse | null>(null);
const activeLocations = ref<AttendanceLocation[]>([]);
const pageLoading = ref(true);
const submitting = ref(false);
const submitStage = ref('');

const capturedPhoto = ref<File | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const showCameraModal = ref(false);

// ==================== Computed ====================
const attendance = computed(() => todayData.value?.attendance ?? null);
const canCheckin = computed(() => todayData.value?.can_checkin ?? false);
const canCheckout = computed(() => todayData.value?.can_checkout ?? false);
const hasCheckedIn = computed(() => !!attendance.value?.checkinTime);
const hasCheckedOut = computed(() => !!attendance.value?.checkoutTime);
const shift = computed(() => todayData.value?.shift ?? null);
const primaryLocation = computed(() => todayData.value?.location ?? activeLocations.value[0] ?? null);
const hasPhoto = computed(() => !!capturedPhoto.value);
const hasLocation = computed(() => latitude.value !== null && longitude.value !== null);

const currentTimeFormatted = ref('');
const updateClock = () => {
  currentTimeFormatted.value = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Jakarta',
  });
};

// ==================== Load data ====================
const loadTodayData = async () => {
  try {
    pageLoading.value = true;
    const [todayRes, locRes] = await Promise.all([
      attendanceService.getToday(),
      attendanceService.getLocations(),
    ]);
    todayData.value = todayRes;
    activeLocations.value = locRes;
  } catch (err: any) {
    toast.error('Gagal memuat data', err?.message || 'Terjadi kesalahan');
  } finally {
    pageLoading.value = false;
  }
};

// ==================== Camera ====================
const onPhotoCaptured = (file: File) => {
  capturedPhoto.value = file;
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value);
  photoPreviewUrl.value = URL.createObjectURL(file);
  showCameraModal.value = false;
};

const clearPhoto = () => {
  capturedPhoto.value = null;
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value);
    photoPreviewUrl.value = null;
  }
};

// ==================== Submit ====================
const doSubmit = async (action: 'checkin' | 'checkout') => {
  const requirePhoto = todayData.value?.config?.require_attendance_photo ?? true;
  if (requirePhoto && !capturedPhoto.value) {
    swal.toast('Foto selfie wajib diambil terlebih dahulu', 'warning');
    return;
  }
  if (!latitude.value || !longitude.value) {
    swal.toast('GPS belum terdeteksi. Tunggu sebentar atau aktifkan lokasi.', 'warning');
    return;
  }

  const locationId = primaryLocation.value?.id ?? null;

  submitting.value = true;
  try {
    submitStage.value = 'Memvalidasi lokasi...';
    await new Promise((r) => setTimeout(r, 300));

    submitStage.value = 'Memproses foto...';
    await new Promise((r) => setTimeout(r, 300));

    submitStage.value = 'Menyimpan presensi...';

    const payload = {
      photo: capturedPhoto.value,
      latitude: latitude.value,
      longitude: longitude.value,
      attendance_location_id: locationId,
    };

    const res = action === 'checkin'
      ? await attendanceService.checkIn(payload)
      : await attendanceService.checkOut(payload);

    clearPhoto();
    await loadTodayData();

    const label = action === 'checkin' ? 'Check In' : 'Check Out';
    swal.toast(`${label} berhasil! 🎉`, 'success');
  } catch (err: any) {
    const data = err?.data || (err as any)?._data;
    const code = data?.code;
    const message = data?.message || err?.message || 'Terjadi kesalahan saat presensi';
    swal.toast(message, 'error');
  } finally {
    submitting.value = false;
    submitStage.value = '';
  }
};

// ==================== Lifecycle ====================
onMounted(async () => {
  updateClock();
  setInterval(updateClock, 1000);
  await loadTodayData();
  await requestPosition().catch(() => {});
  startWatching();
});

onUnmounted(() => {
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value);
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors duration-200">
    <!-- Header -->
    <AttendanceHeader :institution-name="primaryLocation?.name" />

    <!-- Current time -->
    <div class="text-center mt-2 mb-1">
      <p class="text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{{ currentTimeFormatted }}</p>
    </div>

    <!-- Status -->
    <AttendanceStatus
      :attendance="attendance"
      :can-checkin="canCheckin"
      :can-checkout="canCheckout"
      :loading="pageLoading"
    />

    <!-- Map -->
    <AttendanceMap
      v-if="primaryLocation"
      :institution-lat="primaryLocation.latitude"
      :institution-lon="primaryLocation.longitude"
      :radius-meter="primaryLocation.radiusMeter"
      :location-name="primaryLocation.name"
      :user-lat="latitude"
      :user-lon="longitude"
      :loading="pageLoading"
    />
    <div v-else-if="!pageLoading" class="mx-4 mt-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
      <i class="mdi mdi-map-marker-off text-3xl text-slate-400 dark:text-slate-600 mb-2 block"></i>
      <p class="text-sm text-slate-500 dark:text-slate-400">Tidak ada lokasi presensi aktif</p>
    </div>

    <!-- Shift Info -->
    <div v-if="shift?.workTime && shift?.isWorkingDay" class="mx-4 mt-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        <i class="mdi mdi-clock-outline text-blue-600 dark:text-blue-400"></i> Jadwal Kerja — {{ shift.shiftName }}
      </p>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
        <div>
          <span class="text-slate-500 dark:text-slate-400">Masuk</span>
          <p class="font-bold text-slate-900 dark:text-white">{{ shift.workTime.workStartTime }}</p>
        </div>
        <div>
          <span class="text-slate-500 dark:text-slate-400">Pulang</span>
          <p class="font-bold text-slate-900 dark:text-white">{{ shift.workTime.workEndTime }}</p>
        </div>
        <div>
          <span class="text-slate-500 dark:text-slate-400">Check-in diterima</span>
          <p class="font-medium">{{ shift.workTime.checkinStart }} – {{ shift.workTime.checkinEnd }}</p>
        </div>
        <div v-if="shift.workTime.checkoutStart">
          <span class="text-slate-500 dark:text-slate-400">Check-out diterima</span>
          <p class="font-medium">{{ shift.workTime.checkoutStart }} – {{ shift.workTime.checkoutEnd }}</p>
        </div>
      </div>
    </div>

    <!-- Non-Working Day / Sunday Info Banner (Only when holiday attendance is allowed) -->
    <div v-else-if="!pageLoading && (todayData?.config?.allow_holiday_attendance ?? true)" class="mx-4 mt-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
        <i class="mdi mdi-beach text-blue-600 dark:text-blue-400 text-xl"></i>
      </div>
      <div>
        <p class="text-xs font-semibold text-slate-800 dark:text-white">Hari Libur / Non-Shift Kerja</p>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Hari ini bebas jam kerja. Anda tetap bisa presensi dan akan dicatat dengan status Hadir.</p>
      </div>
    </div>

    <!-- Action -->
    <AttendanceAction
      :can-checkin="canCheckin"
      :can-checkout="canCheckout"
      :has-checked-in="hasCheckedIn"
      :has-checked-out="hasCheckedOut"
      :require-photo="todayData?.config?.require_attendance_photo ?? true"
      :time-window-message="todayData?.time_window_message"
      :loading="pageLoading"
      :submitting="submitting"
      :has-photo="hasPhoto"
      :has-location="hasLocation"
      :location-error="gpsError"
      @open-camera="showCameraModal = true"
      @submit-checkin="doSubmit('checkin')"
      @submit-checkout="doSubmit('checkout')"
    >
      <template #photo-preview>
        <div v-if="photoPreviewUrl" class="relative">
          <img :src="photoPreviewUrl" alt="Foto presensi" class="w-full h-40 object-cover" />
          <button
            @click.stop="clearPhoto"
            class="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <i class="mdi mdi-close text-sm"></i>
          </button>
        </div>
      </template>
    </AttendanceAction>

    <!-- Submitting overlay stage -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
        <div v-if="submitting" class="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div class="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          <p class="text-sm text-white font-medium">{{ submitStage }}</p>
        </div>
      </Transition>
    </Teleport>

    <!-- Recent history link -->
    <div class="mx-4 mt-6">
      <NuxtLink
        to="/attendance/history"
        class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-all duration-200 group"
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <i class="mdi mdi-history text-blue-600 dark:text-blue-400 text-lg"></i>
          </div>
          <span class="text-sm font-medium text-slate-800 dark:text-slate-300">Riwayat Presensi</span>
        </div>
        <i class="mdi mdi-chevron-right text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors"></i>
      </NuxtLink>
    </div>
  </div>

  <!-- Camera Modal (menggunakan UiCameraModal existing) -->
  <UiCameraModal
    v-model="showCameraModal"
    title="Foto Presensi"
    @capture="onPhotoCaptured"
  />
</template>

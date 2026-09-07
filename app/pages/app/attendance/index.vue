<script setup lang="ts">
import { attendanceService } from '~/services/attendance.service';
import { useGeolocation } from '~/composables/useGeolocation';
import { useAuthStore } from '~/stores/auth';
import { useSwal } from '~/composables/useSwal';
import { useToast } from '~/composables/useToast';
import type { AttendanceTodayResponse, AttendanceLocation } from '~/types/attendance';

// ==================== Layout ====================
definePageMeta({ layout: 'attendance' });
useHead({ title: 'Presensi Pegawai' });

// ==================== State ====================
const router = useRouter();
const authStore = useAuthStore();
const swal = useSwal();
const toast = useToast();
const {
  latitude, longitude, error: gpsError,
  requestPosition, startWatching,
} = useGeolocation();

const mapComponentRef = ref<any>(null);
const todayData = ref<AttendanceTodayResponse | null>(null);
const activeLocations = ref<AttendanceLocation[]>([]);
const selectedLocationId = ref<number | null>(null);
const pageLoading = ref(true);
const submitting = ref(false);
const submitStage = ref('');

const capturedPhoto = ref<File | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const showCameraModal = ref(false);

const currentAddressString = ref<string>('');
const addressLoading = ref(false);

// ==================== Computed ====================
const attendance = computed(() => todayData.value?.attendance ?? null);
const canCheckin = computed(() => todayData.value?.can_checkin ?? false);
const canCheckout = computed(() => todayData.value?.can_checkout ?? false);
const hasCheckedIn = computed(() => !!attendance.value?.checkinTime);
const hasCheckedOut = computed(() => !!attendance.value?.checkoutTime);
const shift = computed(() => todayData.value?.shift ?? null);

// Haversine distance calculation
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const estimatedDistance = computed(() => {
  if (latitude.value === null || longitude.value === null || !primaryLocation.value) return null;
  const lat1 = Number(primaryLocation.value.latitude);
  const lon1 = Number(primaryLocation.value.longitude);
  const lat2 = Number(latitude.value);
  const lon2 = Number(longitude.value);
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;
  return haversineDistance(lat1, lon1, lat2, lon2);
});

const isNoRadiusLimit = computed(() => !primaryLocation.value?.radiusMeter || Number(primaryLocation.value.radiusMeter) === 0);

const isWithinRadius = computed(() => {
  if (isNoRadiusLimit.value) return true;
  if (estimatedDistance.value === null) return null;
  return estimatedDistance.value <= Number(primaryLocation.value!.radiusMeter);
});

const primaryLocation = computed(() => {
  if (selectedLocationId.value && activeLocations.value.length > 0) {
    const found = activeLocations.value.find((l) => l.id === selectedLocationId.value);
    if (found) return found;
  }
  return todayData.value?.location ?? activeLocations.value[0] ?? null;
});

const locationOptions = computed(() => {
  return activeLocations.value.map((loc) => ({
    value: loc.id,
    label: `${loc.name}`,
  }));
});

const hasPhoto = computed(() => !!capturedPhoto.value);
const hasLocation = computed(() => latitude.value !== null && longitude.value !== null);

const currentTimeFormatted = ref('');
const updateClock = () => {
  currentTimeFormatted.value = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Jakarta',
  });
};

// ==================== Geocoding Helper ====================
const focusLocation = () => {
  if (mapComponentRef.value?.focusUserLocation) {
    mapComponentRef.value.focusUserLocation();
  } else if (mapComponentRef.value?.fitMapBounds) {
    mapComponentRef.value.fitMapBounds();
  }
  requestPosition().catch(() => {});
};

// ==================== Load Data ====================
const loadTodayData = async () => {
  try {
    pageLoading.value = true;
    const [todayRes, locRes] = await Promise.all([
      attendanceService.getToday(),
      attendanceService.getLocations(),
    ]);
    todayData.value = todayRes;
    activeLocations.value = locRes;
    if (locRes.length > 0 && !selectedLocationId.value) {
      selectedLocationId.value = todayRes?.location?.id ?? locRes[0].id;
    }
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
    // submitStage.value = 'Memvalidasi lokasi...';
    // await new Promise((r) => setTimeout(r, 250));

    // submitStage.value = 'Memproses foto...';
    // await new Promise((r) => setTimeout(r, 250));

    submitStage.value = 'Menyimpan presensi...';
    await new Promise((r) => setTimeout(r, 1000));

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

    const label = action === 'checkin' ? 'Presensi Masuk' : 'Presensi Pulang';
    swal.toast(`${label} berhasil!`, 'success');
  } catch (err: any) {
    const data = err?.data || (err as any)?._data;
    const message = data?.message || err?.message || 'Terjadi kesalahan saat presensi';
    swal.toast(message, 'error');
  } finally {
    submitting.value = false;
    submitStage.value = '';
  }
};

// Handle location select change to auto-focus map
const onLocationChange = (_val?: any) => {
  nextTick(() => {
    if (mapComponentRef.value?.fitMapBounds) {
      mapComponentRef.value.fitMapBounds();
    }
  });
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
  <div class="relative min-h-screen bg-slate-100 dark:bg-slate-900">
    <!-- Top Header Bar (Floating over map) -->
    <div class="relative z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
      <!-- Left section: Back button & Title (Left aligned) -->
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="router.back()"
          class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <i class="mdi mdi-arrow-left text-xl"></i>
        </button>
        <h1 class="text-base font-bold text-slate-900 dark:text-white tracking-wide truncate">Presensi</h1>
      </div>

      <!-- Right section: Riwayat Presensi Button with Text -->
      <button
        @click="router.push('/attendance/history')"
        title="Riwayat Presensi"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold transition-all active:scale-95 border border-blue-200/50 dark:border-blue-800/40 shrink-0"
      >
        <i class="mdi mdi-history text-sm"></i>
        <span>Riwayat Presensi</span>
      </button>
    </div>

    <!-- Map Header Backdrop -->
    <div class="relative h-48 w-full overflow-hidden z-0">
      <AttendanceMap
        v-if="primaryLocation"
        ref="mapComponentRef"
        :institution-lat="primaryLocation.latitude"
        :institution-lon="primaryLocation.longitude"
        :radius-meter="primaryLocation.radiusMeter"
        :location-name="primaryLocation.name"
        :user-lat="latitude"
        :user-lon="longitude"
        :loading="pageLoading"
      />
      <div v-else-if="!pageLoading" class="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
        <p class="text-xs text-slate-500 dark:text-slate-400">Peta lokasi belum tersedia</p>
      </div>
    </div>

    <!-- Main Card Container (Mockup Sheet Design) -->
    <div class="relative z-10 -mt-6 rounded-t-[2.2rem] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-5 pt-6 pb-8 space-y-6">

      <!-- Unified Compact Location Card Header with Focus GPS Button on Right -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <i class="mdi mdi-map-marker text-blue-500 text-lg"></i>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white">Lokasi Presensi</h2>
        </div>

        <!-- Focus GPS Location Button -->
        <button
          @click="focusLocation"
          title="Fokuskan Lokasi Saya"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold transition-all active:scale-95 border border-blue-200/50 dark:border-blue-800/40"
        >
          <i class="mdi mdi-crosshairs-gps text-sm"></i>
          <span>Fokuskan Lokasi</span>
        </button>
      </div>
      <div v-if="primaryLocation" class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 space-y-3">
        <!-- Top: Location Dropdown -->
        <div>
          <UiSelect
            v-model="selectedLocationId"
            placeholder="Pilih lokasi presensi..."
            :options="locationOptions"
            item-value="value"
            item-title="label"
            @change="onLocationChange"
          />
        </div>

        <!-- Bottom Row: Distance & Radius Status Badge -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div class="space-y-0.5">
            <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">JARAK ANDA</span>
            <p class="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {{ estimatedDistance !== null ? `${estimatedDistance} m` : 'Mendeteksi...' }}
              <span class="text-xs font-normal text-slate-600 dark:text-slate-500 ml-1">
                ({{ isNoRadiusLimit ? 'Bebas Radius' : `Radius ${primaryLocation.radiusMeter}m` }})
              </span>
            </p>
          </div>

          <div>
            <span
              v-if="isNoRadiusLimit"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
            >
              <i class="mdi mdi-earth"></i> Bebas Area
            </span>
            <span
              v-else-if="isWithinRadius"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/40"
            >
              <i class="mdi mdi-check-circle"></i> Dalam area
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700/40"
            >
              <i class="mdi mdi-close-circle"></i> Di luar area
            </span>
          </div>
        </div>
      </div>
      
      <!-- Section 3: Jadwal Kerja -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 mb-2">
          <i class="mdi mdi-clock-outline text-blue-500 text-lg"></i>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white">Jadwal Kerja</h2>
        </div>

        <!-- Shift Card -->
        <div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-slate-900 dark:text-white">
              {{ shift?.shiftName || 'Shift Reguler' }}
            </span>
            <span
              v-if="shift?.isWorkingDay"
              class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            >
              Aktif
            </span>
            <span
              v-else
              class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              Non-Shift / Libur
            </span>
          </div>

          <div v-if="shift?.isWorkingDay" class="grid grid-cols-2 gap-4 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            <div>
              <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-0.5">MASUK</span>
              <p class="text-base font-extrabold text-slate-900 dark:text-white">
                {{ shift?.workTime?.workStartTime || '08:00' }}
              </p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Checkin: <strong class="font-semibold text-slate-700 dark:text-slate-300">{{ (shift?.workTime?.checkinStart && shift?.workTime?.checkinEnd) ? `${shift.workTime.checkinStart} – ${shift.workTime.checkinEnd}` : (shift?.workTime?.workStartTime ? `Buka sebelum ${shift.workTime.workStartTime}` : '06:00 – 08:30') }}</strong>
              </p>
            </div>
            <div class="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-0.5">PULANG</span>
              <p class="text-base font-extrabold text-slate-900 dark:text-white">
                {{ shift?.workTime?.workEndTime || '16:00' }}
              </p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Checkout: <strong class="font-semibold text-slate-700 dark:text-slate-300">{{ shift?.workTime?.checkoutStart ? `${shift.workTime.checkoutStart} – ${shift.workTime.checkoutEnd || 'Selesai'}` : (shift?.workTime?.workEndTime ? `Mulai ${shift.workTime.workEndTime}` : '16:00 – Selesai') }}</strong>
              </p>
            </div>
          </div>
          <div v-else class="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center py-2">
            <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <i class="mdi mdi-calendar-blank-outline text-amber-500 text-base"></i>
              <span>Hari ini Libur / Tidak ada jam kerja wajib</span>
            </p>
          </div>
        </div>

        <!-- Attendance Status Summary -->
        <!-- <AttendanceStatus
          :attendance="attendance"
          :can-checkin="canCheckin"
          :can-checkout="canCheckout"
          :loading="pageLoading"
        /> -->
      </div>

      <!-- Section 4 & 5: Verifikasi Wajah & Main CTA -->
      <div class="space-y-4">
        <div v-if="todayData?.config?.require_attendance_photo ?? true" class="flex items-center gap-2">
          <i class="mdi mdi-camera text-blue-500 text-lg"></i>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white">Verifikasi Wajah</h2>
        </div>

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
            <div v-if="photoPreviewUrl" class="relative w-full h-44 rounded-xl overflow-hidden">
              <img :src="photoPreviewUrl" alt="Foto presensi" class="w-full h-full object-cover" />
              <button
                @click.stop="clearPhoto"
                class="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <i class="mdi mdi-close text-sm"></i>
              </button>
            </div>
          </template>
        </AttendanceAction>
      </div>
    </div>

    <!-- Submitting overlay stage -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
        <div v-if="submitting" class="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div class="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          <p class="text-sm text-white font-medium">{{ submitStage }}</p>
        </div>
      </Transition>
    </Teleport>

    <!-- Camera Modal -->
    <UiCameraModal
      v-model="showCameraModal"
      title="Foto Presensi"
      default-facing-mode="user"
      @capture="onPhotoCaptured"
    />
  </div>
</template>

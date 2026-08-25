<script setup lang="ts">
interface Props {
  canCheckin: boolean;
  canCheckout: boolean;
  hasCheckedIn?: boolean;
  hasCheckedOut?: boolean;
  requirePhoto?: boolean;
  timeWindowMessage?: string;
  checkinEnd?: string | null;
  checkoutEnd?: string | null;
  loading?: boolean;
  submitting?: boolean;
  hasPhoto: boolean;
  hasLocation: boolean;
  locationError?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  hasCheckedIn: false,
  hasCheckedOut: false,
  requirePhoto: true,
  timeWindowMessage: '',
  checkinEnd: null,
  checkoutEnd: null,
  loading: false,
  submitting: false,
  locationError: null,
});

const emit = defineEmits<{
  openCamera: [];
  submitCheckin: [];
  submitCheckout: [];
}>();

// Real-time client clock tracking (every 2 seconds)
const clientTimeStr = ref('');
let clockTimer: any = null;

onMounted(() => {
  const updateClock = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clientTimeStr.value = `${hh}:${mm}`;
  };
  updateClock();
  clockTimer = setInterval(updateClock, 2000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

const isLiveCheckinExpired = computed(() => {
  if (!props.canCheckin || !props.checkinEnd || !clientTimeStr.value) return false;
  return clientTimeStr.value > props.checkinEnd;
});

const isLiveCheckoutExpired = computed(() => {
  if (!props.canCheckout || !props.checkoutEnd || !clientTimeStr.value) return false;
  return clientTimeStr.value > props.checkoutEnd;
});

const effectiveCanCheckin = computed(() => props.canCheckin && !isLiveCheckinExpired.value);
const effectiveCanCheckout = computed(() => props.canCheckout && !isLiveCheckoutExpired.value);

const effectiveTimeWindowMessage = computed(() => {
  if (isLiveCheckinExpired.value && props.checkinEnd) {
    return `Batas waktu presensi masuk telah berakhir (${props.checkinEnd})`;
  }
  if (isLiveCheckoutExpired.value && props.checkoutEnd) {
    return `Batas waktu presensi pulang telah berakhir (${props.checkoutEnd})`;
  }
  return props.timeWindowMessage;
});

const buttonConfig = computed(() => {
  if (effectiveCanCheckin.value) {
    return {
      label: props.hasCheckedIn ? 'Presensi Masuk' : 'Presensi Masuk',
      subLabel: props.hasCheckedIn
        ? 'Jam masuk pertama kali (terawal) tetap dipertahankan sebagai acuan kehadiran'
        : 'Presensi masuk terawal yang akan diakui',
      icon: 'mdi-login',
      gradient: props.hasCheckedIn ? 'from-teal-600 to-emerald-700' : 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      action: () => emit('submitCheckin'),
    };
  }
  if (effectiveCanCheckout.value) {
    return {
      label: props.hasCheckedOut ? 'Perbarui Presensi Pulang' : 'Presensi Pulang',
      subLabel: props.hasCheckedOut ? 'Jam pulang Anda akan diperbarui ke waktu yang terbaru' : '',
      icon: 'mdi-logout',
      gradient: props.hasCheckedOut ? 'from-amber-500 to-orange-600' : 'from-blue-500 to-indigo-600',
      shadow: props.hasCheckedOut ? 'shadow-amber-500/20' : 'shadow-blue-500/25',
      action: () => emit('submitCheckout'),
    };
  }
  return null;
});

const canSubmit = computed(() => (props.hasPhoto || !props.requirePhoto) && props.hasLocation && !props.locationError);
</script>

<template>
  <div class="space-y-3">
    <!-- Time window alert banner (if attendance is currently disabled due to shift window) -->
    <div
      v-if="effectiveTimeWindowMessage && !effectiveCanCheckin && !effectiveCanCheckout && !loading"
      class="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 p-4 text-center space-y-1.5"
    >
      <div class="w-10 h-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <i class="mdi mdi-clock-alert-outline text-2xl text-amber-600 dark:text-amber-400"></i>
      </div>
      <p class="text-xs font-semibold text-amber-800 dark:text-amber-300">{{ effectiveTimeWindowMessage }}</p>
      <p class="text-[11px] text-amber-600 dark:text-amber-400">Silakan presensi pada rentang waktu yang telah ditentukan.</p>
    </div>

    <!-- Done state (Both checkin and checkout are completed) -->
    <div
      v-else-if="!effectiveCanCheckin && !effectiveCanCheckout && !loading"
      class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 text-center"
    >
      <div class="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
        <i class="mdi mdi-check-circle text-3xl text-emerald-600 dark:text-emerald-400"></i>
      </div>
      <p class="text-sm font-semibold text-slate-800 dark:text-white mb-1">Presensi Hari Ini Selesai</p>
      <p class="text-xs text-slate-500 dark:text-slate-400">Terima kasih! Sampai jumpa besok 👋</p>
    </div>

    <template v-else-if="buttonConfig">
      <!-- Photo preview / camera trigger -->
      <div v-if="requirePhoto" class="space-y-2">
        <button
          type="button"
          @click="$emit('openCamera')"
          class="w-full rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden bg-sky-50/40 dark:bg-slate-900"
          :class="hasPhoto ? 'border-emerald-500' : 'border-sky-200 dark:border-sky-900/60 hover:border-sky-400'"
        >
          <!-- Placeholder when no photo -->
          <div
            v-if="!hasPhoto"
            class="flex flex-col items-center justify-center gap-2 py-8 text-sky-500 dark:text-sky-400 hover:text-sky-600 transition-colors"
          >
            <i class="mdi mdi-camera-plus-outline text-3xl"></i>
            <span class="text-xs font-semibold">Ambil Foto Selfie</span>
          </div>

          <!-- Preview slot -->
          <slot name="photo-preview" />
        </button>
      </div>

      <!-- Validation hints -->
      <div class="space-y-1.5 pt-1">
        <div v-if="requirePhoto" class="flex items-center gap-2 text-xs" :class="hasPhoto ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
          <i :class="hasPhoto ? 'mdi mdi-check-circle' : 'mdi mdi-circle-outline'"></i>
          <span>{{ hasPhoto ? 'Foto selfie tersedia' : 'Foto selfie wajib diambil' }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs" :class="hasLocation ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
          <i :class="hasLocation ? 'mdi mdi-check-circle' : 'mdi mdi-circle-outline'"></i>
          <span>{{ hasLocation ? 'GPS terdeteksi' : 'Mendeteksi GPS...' }}</span>
        </div>
        <div v-if="locationError" class="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/30 rounded-xl p-3 mt-2">
          <i class="mdi mdi-alert-circle shrink-0 mt-0.5"></i>
          <span>{{ locationError }}</span>
        </div>
      </div>

      <!-- Submit button -->
      <button
        type="button"
        :disabled="!canSubmit || submitting"
        @click="buttonConfig.action()"
        :class="[
          'w-full py-4 rounded-2xl font-extrabold text-base text-white transition-all duration-300',
          'flex items-center justify-center gap-3',
          'bg-gradient-to-r shadow-lg',
          buttonConfig.gradient,
          buttonConfig.shadow,
          canSubmit && !submitting
            ? 'opacity-100 scale-100 active:scale-95'
            : 'opacity-40 cursor-not-allowed',
        ]"
      >
        <span v-if="submitting" class="flex items-center gap-2">
          <i class="mdi mdi-loading animate-spin text-xl"></i>
          Memproses...
        </span>
        <span v-else class="flex items-center gap-2">
          <i :class="['mdi text-xl', buttonConfig.icon]"></i>
          {{ buttonConfig.label }}
        </span>
      </button>

      <!-- SubLabel hint -->
      <!-- <p v-if="buttonConfig.subLabel" class="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">
        <i class="mdi mdi-information-outline mr-1"></i>{{ buttonConfig.subLabel }}
      </p> -->
    </template>
  </div>
</template>

<template>
  <div class="w-full max-w-full overflow-x-hidden space-y-4 pb-8 animate-fade-in">
    
    <!-- 1. TOP PROFILE & WELCOME CARD (Integrated with Ringkasan Kehadiran & Sisa Cuti) -->
    <UiCard class="!p-3.5 sm:!p-4 !rounded-2xl !bg-gradient-to-r !from-slate-50 !via-white !to-primary-50/40 dark:!from-slate-900 dark:!via-slate-800 dark:!to-primary-950/20 border border-slate-200/80 dark:border-slate-700/80">
      <UiRow align="center" justify="between" :mb="0" :gap="3">
        <!-- Left: Profile Info -->
        <UiCol cols="12" md="7" lg="8">
          <div class="flex items-center gap-3 min-w-0">
            <UiAvatar :src="userPhoto" :name="userName" size="md" class="shrink-0 shadow-xs" />

            <div class="space-y-1 min-w-0">
              <h1 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                <span class="bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">Hallo,</span> {{ userName }}
              </h1>

              <!-- Instansi & Departemen -->
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                <div class="flex items-center gap-1 min-w-0">
                  <UiIcon name="mdi-domain" size="13" class="shrink-0 text-slate-400" />
                  <span class="truncate font-semibold text-slate-700 dark:text-slate-200" :title="schoolName">{{ schoolName }}</span>
                </div>
                <span class="text-slate-300 dark:text-slate-600 font-bold">&bull;</span>
                <div class="flex items-center gap-1 min-w-0">
                  <UiIcon name="mdi-account-group-outline" size="13" class="shrink-0 text-slate-400" />
                  <span class="truncate font-medium text-slate-600 dark:text-slate-400" :title="departmentName">{{ departmentName }}</span>
                </div>
              </div>
            </div>
          </div>
        </UiCol>

        <!-- Right: Summary Stat (Kehadiran Bulan Ini) -->
        <UiCol cols="12" md="5" lg="4">
          <div class="space-y-1 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xs">
            <div class="flex items-center justify-between text-[11px] gap-2">
              <span class="font-bold text-slate-700 dark:text-slate-300 truncate">Kehadiran Bulan Ini</span>
              <span class="font-extrabold text-emerald-600 dark:text-emerald-400 text-[10px] shrink-0">
                {{ monthlyAttendanceCount !== null ? `${monthlyAttendanceCount} Hari Hadir` : '-' }}
              </span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                :style="{ width: monthlyAttendanceProgress + '%' }"
              ></div>
            </div>
          </div>
        </UiCol>
      </UiRow>
    </UiCard>

    <!-- 2. HERO WIDGET PRESENSI MANDIRI HARIAN -->
    <UiCard class="!p-3.5 sm:!p-4 !rounded-2xl space-y-3.5 !bg-gradient-to-br !from-white !via-slate-50/50 !to-sky-50/30 dark:!from-slate-800 dark:!via-slate-800/90 dark:!to-sky-950/20 border border-slate-200/80 dark:border-slate-700/80">
      <!-- Title & Dynamic Status Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div>
          <h2 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {{ attendanceStatusTitle }}
          </h2>
        </div>

        <!-- Dynamic Status Badges -->
        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          <!-- Badge Terlambat -->
          <UiBadge 
            v-if="isLate"
            variant="danger"
            class="!px-2.5 !py-1 !rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0"
          >
            <UiIcon name="mdi-clock-alert-outline" size="13" />
            <span>Terlambat{{ lateMinutes > 0 ? ` (${lateMinutes} mnt)` : '' }}</span>
          </UiBadge>

          <!-- Badge Pulang Cepat -->
          <UiBadge 
            v-if="isEarlyLeave"
            variant="warning"
            class="!px-2.5 !py-1 !rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0"
          >
            <UiIcon name="mdi-clock-fast" size="13" />
            <span>Pulang Cepat{{ earlyLeaveMinutes > 0 ? ` (${earlyLeaveMinutes} mnt)` : '' }}</span>
          </UiBadge>

          <!-- Main Status Badge -->
          <UiBadge 
            :variant="attendanceStatus === 'checked_in' ? (isLate ? 'warning' : 'success') : attendanceStatus === 'checked_out' ? 'info' : 'warning'"
            class="!px-3 !py-1 !rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit shrink-0"
          >
            {{ attendanceStatusText }}
          </UiBadge>
        </div>
      </div>

      <!-- Action Panel & Details using UiRow & UiCol -->
      <UiRow :gap="3" :mb="0">
        <!-- Left: Action Button, Shift & Location Info -->
        <UiCol cols="12" md="6">
          <div class="h-full p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <!-- Shift Badge -->
              <span class="inline-block px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-[10px] font-extrabold uppercase tracking-wide">
                {{ shiftDisplayText }}
              </span>

              <!-- Location Info -->
              <div class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 min-w-0">
                <UiIcon name="mdi-map-marker-outline" size="15" class="text-primary-600 dark:text-primary-400 shrink-0" />
                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">Lokasi Penugasan:</span>
                <span class="font-extrabold text-xs truncate">{{ assignmentLocation }}</span>
              </div>
            </div>

            <UiButton
              color="primary"
              variant="filled"
              size="sm"
              class="!font-extrabold justify-center shrink-0 shadow-xs cursor-pointer text-xs py-2 px-3.5"
              @click="goToAttendance"
            >
              <UiIcon name="mdi-camera-outline" size="16" class="mr-1.5" />
              {{ attendanceButtonText }}
            </UiButton>
          </div>
        </UiCol>

        <!-- Right: Time Tracker Cards -->
        <UiCol cols="12" md="6">
          <UiRow :gap="2.5" :mb="0">
            <!-- Jam Masuk -->
            <UiCol cols="4">
              <div class="h-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                <div class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UiIcon name="mdi-login-variant" size="16" />
                </div>
                <div class="mt-2">
                  <div class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Jam Masuk</div>
                  <div class="font-mono font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                    {{ checkInTimeDisplay }}
                  </div>
                </div>
              </div>
            </UiCol>

            <!-- Jam Pulang -->
            <UiCol cols="4">
              <div class="h-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                <div class="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <UiIcon name="mdi-logout-variant" size="16" />
                </div>
                <div class="mt-2">
                  <div class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Jam Pulang</div>
                  <div class="font-mono font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                    {{ checkOutTimeDisplay }}
                  </div>
                </div>
              </div>
            </UiCol>

            <!-- Durasi Kerja -->
            <UiCol cols="4">
              <div class="h-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
                <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <UiIcon name="mdi-timer-outline" size="16" />
                </div>
                <div class="mt-2">
                  <div class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Durasi</div>
                  <div class="font-mono font-extrabold text-slate-900 dark:text-white text-[11px] sm:text-xs mt-0.5 truncate">
                    {{ workDurationDisplay }}
                  </div>
                </div>
              </div>
            </UiCol>
          </UiRow>
        </UiCol>
      </UiRow>
    </UiCard>

    <!-- 3. AKSES CEPAT PRESENSI & IZIN -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-500 flex items-center gap-1.5">
          Akses Cepat
        </h2>
      </div>

      <UiRow :gap="2.5" :mb="0">
        <!-- 1. Absen Masuk / Pulang -->
        <UiCol cols="6" sm="3">
          <UiCard 
            :hover="true" 
            class="!p-3 h-full flex flex-col justify-between gap-2.5 group cursor-pointer !rounded-xl"
            @click="goToAttendance"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 group-hover:scale-105 transition-transform">
              <UiIcon name="mdi-camera-outline" size="18" />
            </div>
            <div>
              <div class="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                Presensi Mandiri
              </div>
              <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Kamera & GPS Sekolah
              </div>
            </div>
          </UiCard>
        </UiCol>

        <!-- 2. Form Pengajuan Izin Baru -->
        <UiCol cols="6" sm="3">
          <UiCard
            :hover="true" 
            class="!p-3 h-full flex flex-col justify-between gap-2.5 group cursor-pointer !rounded-xl"
            @click="goToLeaveForm"
          >
            <div class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-105 transition-transform">
              <UiIcon name="mdi-file-document-edit-outline" size="18" />
            </div>
            <div>
              <div class="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                Buat Pengajuan Izin
              </div>
              <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Form Izin / Sakit / Cuti
              </div>
            </div>
          </UiCard>
        </UiCol>

        <!-- 3. Status Pengajuan Cuti / Izin -->
        <UiCol cols="6" sm="3">
          <UiCard 
            :hover="true" 
            class="!p-3 h-full flex flex-col justify-between gap-2.5 group cursor-pointer !rounded-xl"
            @click="goToLeaveRequests"
          >
            <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 transition-transform">
              <UiIcon name="mdi-clipboard-text-clock-outline" size="18" />
            </div>
            <div>
              <div class="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Daftar Izin Saya
              </div>
              <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Cek persetujuan atasan
              </div>
            </div>
          </UiCard>
        </UiCol>

        <!-- 4. Riwayat Presensi Saya -->
        <UiCol cols="6" sm="3">
          <UiCard 
            :hover="true" 
            class="!p-3 h-full flex flex-col justify-between gap-2.5 group cursor-pointer !rounded-xl"
            @click="goToAttendanceHistory"
          >
            <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/50 group-hover:scale-105 transition-transform">
              <UiIcon name="mdi-history" size="18" />
            </div>
            <div>
              <div class="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                Riwayat Absensi
              </div>
              <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Rekap bulanan & jam masuk
              </div>
            </div>
          </UiCard>
        </UiCol>
      </UiRow>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";
import { attendanceService } from "~/services/attendance.service";
import type { AttendanceTodayResponse } from "~/types/attendance";
import { useFormat } from "~/composables/useFormat";

const authStore = useAuthStore();
const router = useRouter();
const { formatDate, formatDateTemplate } = useFormat();
const { getFileUrl } = useFileUrl();

// User & School Info from Session
const userName = computed(() => authStore.user?.name || "Pegawai");
const userPhoto = computed(() => {
  const foto = authStore.user?.foto || (authStore.user as any)?.avatar;
  return getFileUrl(foto) || undefined;
});
const userInitials = computed(() => {
  const name = userName.value;
  if (!name || name === "Pegawai") return "PG";
  const parts = name.replace(/^(Bpk\.|Ibu|Dr\.|Drs\.)\s*/i, "").trim().split(" ");
  const p0 = parts[0];
  const p1 = parts[1];
  if (p0 && p1 && p0.length > 0 && p1.length > 0) {
    return (p0.charAt(0) + p1.charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const schoolName = computed(() => {
  return (
    authStore.user?.institutionName ||
    (authStore.user as any)?.institution?.name ||
    (authStore.user as any)?.organization?.name ||
    "-"
  );
});

const departmentName = computed(() => {
  return (
    authStore.user?.departmentName ||
    (authStore.user as any)?.department?.name ||
    authStore.user?.positionName ||
    (authStore.user as any)?.position?.name ||
    "-"
  );
});

// Dynamic Date
const currentDate = ref("");
function updateDate() {
  currentDate.value = formatDateTemplate(new Date(), "long");
}

// Attendance Today Data State
const todayData = ref<AttendanceTodayResponse | null>(null);
const isLoadingToday = ref(true);

const fetchTodayData = async () => {
  try {
    isLoadingToday.value = true;
    const res = await attendanceService.getToday();
    todayData.value = res;
  } catch (err) {
    console.error("Gagal memuat data presensi hari ini:", err);
  } finally {
    isLoadingToday.value = false;
  }
};

// Monthly Summary State
const monthlyAttendanceCount = ref<number | null>(null);
const monthlyAttendanceProgress = computed(() => {
  if (monthlyAttendanceCount.value === null) return 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.min(100, Math.round((monthlyAttendanceCount.value / daysInMonth) * 100));
});

const fetchMonthlySummary = async () => {
  try {
    const now = new Date();
    const startOfMonth = formatDate(new Date(now.getFullYear(), now.getMonth(), 1), "YYYY-MM-DD");
    const todayStr = formatDate(now, "YYYY-MM-DD");
    const historyRes = await attendanceService.getHistory({
      start_date: startOfMonth,
      end_date: todayStr,
      limit: 1,
    });
    monthlyAttendanceCount.value = historyRes?.meta?.total ?? 0;
  } catch (err) {
    console.error("Gagal memuat rekap bulanan:", err);
  }
};

onMounted(() => {
  updateDate();
  fetchTodayData();
  fetchMonthlySummary();
});

// Shift & Location Info
const shiftDisplayText = computed(() => {
  if (!todayData.value?.shift) return "Shift : -";
  const s = todayData.value.shift;
  const startTime = s.workTime?.workStartTime || "-";
  const endTime = s.workTime?.workEndTime || "-";
  return `Shift : ${s.shiftName || "Reguler"} (${startTime} - ${endTime} WIB)`;
});

const assignmentLocation = computed(() => {
  if (todayData.value?.location?.name) {
    return todayData.value.location.name;
  }
  return schoolName.value;
});

// Check-in & Check-out Display Times using useFormat
const checkInTimeDisplay = computed(() => {
  const ci = todayData.value?.attendance?.checkinTime;
  if (!ci) return "--:--";
  const formatted = formatDate(ci, "HH:mm", true);
  return formatted !== "-" ? formatted : "--:--";
});

const checkOutTimeDisplay = computed(() => {
  const co = todayData.value?.attendance?.checkoutTime;
  if (!co) return "--:--";
  const formatted = formatDate(co, "HH:mm", true);
  return formatted !== "-" ? formatted : "--:--";
});

// Work Duration Display
const workDurationDisplay = computed(() => {
  const ci = todayData.value?.attendance?.checkinTime;
  if (!ci) return "--";

  let startMs: number;
  if (ci.includes("T")) {
    startMs = new Date(ci).getTime();
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    startMs = new Date(`${todayStr}T${ci.length === 5 ? ci + ":00" : ci}`).getTime();
  }

  if (isNaN(startMs)) return "--";

  const co = todayData.value?.attendance?.checkoutTime;
  let endMs: number;
  if (co) {
    if (co.includes("T")) {
      endMs = new Date(co).getTime();
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      endMs = new Date(`${todayStr}T${co.length === 5 ? co + ":00" : co}`).getTime();
    }
  } else {
    endMs = Date.now();
  }

  if (isNaN(endMs) || endMs < startMs) return "--";

  const diffMinutes = Math.floor((endMs - startMs) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}j ${mins}m`;
});

// Dynamic Attendance Status & Badges
const lateMinutes = computed(() => todayData.value?.attendance?.lateMinutes ?? 0);
const isLate = computed(() => lateMinutes.value > 0 || todayData.value?.attendance?.status === "late");

const earlyLeaveMinutes = computed(() => todayData.value?.attendance?.earlyLeaveMinutes ?? 0);
const isEarlyLeave = computed(() => earlyLeaveMinutes.value > 0);

const attendanceStatus = computed<'not_checked_in' | 'checked_in' | 'checked_out'>(() => {
  if (todayData.value?.attendance?.checkoutTime) return "checked_out";
  if (todayData.value?.attendance?.checkinTime) return "checked_in";
  return "not_checked_in";
});

const attendanceStatusTitle = computed(() => {
  if (attendanceStatus.value === "checked_in") return "Sudah Presensi Masuk Hari Ini";
  if (attendanceStatus.value === "checked_out") return "Sudah Presensi Pulang Hari Ini";
  return "Belum Absen Masuk Hari Ini";
});

const attendanceStatusText = computed(() => {
  const att = todayData.value?.attendance;
  if (att?.checkoutTime) return "Sudah Presensi Pulang";
  if (att?.checkinTime) {
    if (isLate.value) return "Hadir (Terlambat)";
    return "Hadir Tepat Waktu";
  }
  return "Belum Absen";
});

const attendanceButtonText = computed(() => {
  if (todayData.value?.can_checkin) {
    return "Presensi Masuk";
  }
  if (todayData.value?.can_checkout) {
    return todayData.value?.attendance?.checkoutTime
      ? "Perbarui Presensi Pulang"
      : "Presensi Pulang";
  }
  if (attendanceStatus.value === "checked_out") {
    return "Presensi Hari Ini Selesai";
  }
  return "Presensi";
});

// Navigation & Actions
function goToAttendance() {
  router.push("/attendance");
}

function goToLeaveForm() {
  router.push("/attendance-request/form");
}

function goToLeaveRequests() {
  router.push("/attendance-request/employee");
}

function goToAttendanceHistory() {
  router.push("/attendance-history");
}
</script>

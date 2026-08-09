<template>
  <div class="w-full space-y-6 pb-12 animate-fade-in">
    <!-- Header Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard Sistem Manajemen Sekolah
          </h1>
          <UiBadge variant="success" class="px-2.5 py-0.5 text-xs font-semibold">
            Tahun Ajaran 2025/2026
          </UiBadge>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Pantau presensi pegawai, pengajar, absensi siswa, dan jurnal mengajar secara real-time.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Live Clock & Date -->
        <div class="text-left md:text-right px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200/60 dark:border-slate-600/60">
          <div class="text-base font-bold text-slate-800 dark:text-white font-mono leading-tight">
            {{ currentTime }}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {{ currentDate }}
          </div>
        </div>

        <!-- Period Select Filter -->
        <select
          v-model="selectedPeriod"
          class="px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="today">Hari Ini</option>
          <option value="this_week">Minggu Ini</option>
          <option value="this_month">Bulan Ini</option>
        </select>

        <UiButton color="primary" variant="filled" @click="openJurnalModal">
          <UiIcon name="mdi-book-edit-outline" class="mr-1.5" />
          Isi Jurnal Mengajar
        </UiButton>
      </div>
    </div>

    <!-- KPI Metric Cards (4 Utama) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Presensi Pegawai -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UiIcon name="mdi-account-group-outline" size="26" />
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <i class="mdi mdi-trending-up"></i> 95.6%
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">Presensi Pegawai</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">43</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">/ 45 Pegawai</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 dark:text-emerald-400 font-medium">Hadir: 43</span>
          <span>Izin: 1</span>
          <span>Sakit: 1</span>
          <span class="text-rose-500">Alpha: 0</span>
        </div>
      </div>

      <!-- 2. Presensi Pengajar -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UiIcon name="mdi-account-school-outline" size="26" />
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <i class="mdi mdi-check-circle-outline"></i> 96.8%
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">Presensi Pengajar</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">30</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">/ 31 Guru</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 dark:text-emerald-400 font-medium">Masuk: 30</span>
          <span class="text-amber-600">Telat: 1</span>
          <span>Izin: 1</span>
          <span class="text-rose-500">Alpha: 0</span>
        </div>
      </div>

      <!-- 3. Absensi Siswa -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <UiIcon name="mdi-school-outline" size="26" />
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
            <i class="mdi mdi-percent-outline"></i> 97.2%
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">Absensi Siswa</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">845</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">/ 869 Siswa</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Hadir: 845</span>
          <span>Sakit: 12</span>
          <span>Izin: 8</span>
          <span class="text-rose-500 font-medium">Alpha: 4</span>
        </div>
      </div>

      <!-- 4. Jurnal Mengajar -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UiIcon name="mdi-notebook-check-outline" size="26" />
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
            90.4% Selesai
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">Jurnal Mengajar Hari Ini</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">38</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">/ 42 Sesi Kelas</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Terisi: 38</span>
          <span class="text-blue-600 font-medium">Berlangsung: 4</span>
          <span class="text-rose-500 font-medium">Pending: 0</span>
        </div>
      </div>
    </div>

    <!-- Main Content Section: Schedule & Class Attendance Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Jadwal Pelajaran & Jurnal Mengajar Hari Ini (2 Cols) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                Jadwal & Status Jurnal Mengajar Hari Ini
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Pantau pengisian jurnal pengajar per jam pelajaran
              </p>
            </div>
            <UiBadge variant="primary" class="text-xs">
              {{ scheduleList.length }} Sesi Terjadwal
            </UiBadge>
          </div>

          <!-- Schedule Timeline List -->
          <div class="space-y-3">
            <div
              v-for="item in scheduleList"
              :key="item.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors gap-4"
            >
              <div class="flex items-start gap-3.5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                  :class="item.status === 'completed' ? 'bg-emerald-500' : item.status === 'ongoing' ? 'bg-blue-500' : 'bg-slate-400'"
                >
                  Jam {{ item.period }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-semibold text-slate-900 dark:text-white text-sm">
                      {{ item.subject }} - Kelas {{ item.className }}
                    </h4>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Guru: <span class="font-medium text-slate-700 dark:text-slate-300">{{ item.teacher }}</span> • {{ item.time }}
                  </p>
                  <p v-if="item.topic" class="text-xs text-slate-600 dark:text-slate-300 italic mt-1 bg-white dark:bg-slate-900/40 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                    "{{ item.topic }}"
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="
                    item.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : item.status === 'ongoing'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  "
                >
                  {{ item.status === 'completed' ? 'Jurnal Terisi' : item.status === 'ongoing' ? 'Sedang Berlangsung' : 'Belum Diisi' }}
                </span>

                <button
                  @click="openJurnalModal(item)"
                  class="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  {{ item.status === 'completed' ? 'Ubah Jurnal' : 'Isi Jurnal' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Rekapitulasi Kehadiran Siswa Per Kelas -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                Kehadiran Siswa per Tingkat & Kelas
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Persentase dan rincian siswa hadir hari ini
              </p>
            </div>
            
            <div class="flex gap-2">
              <button
                v-for="grade in ['X', 'XI', 'XII']"
                :key="grade"
                @click="activeGrade = grade"
                class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                :class="activeGrade === grade ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
              >
                Kelas {{ grade }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="cls in filteredClassList"
              :key="cls.name"
              class="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 dark:text-white text-sm">
                  Kelas {{ cls.name }}
                </span>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {{ cls.percentage }}% Hadir
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: cls.percentage + '%' }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Hadir: <strong class="text-slate-800 dark:text-slate-200">{{ cls.present }}</strong>/{{ cls.total }}</span>
                <span>Sakit: <strong class="text-amber-600">{{ cls.sick }}</strong></span>
                <span>Izin: <strong class="text-blue-600">{{ cls.permission }}</strong></span>
                <span>Alpha: <strong class="text-rose-500">{{ cls.alpha }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Quick Actions & Realtime Activity Feed (1 Col) -->
      <div class="space-y-6">
        <!-- Quick Action Panel -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">
            Aksi Cepat
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="openPresensiPegawaiModal"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors"
            >
              <UiIcon name="mdi-account-clock" size="24" class="mb-1" />
              <span class="text-xs font-semibold text-center">Presensi Pegawai</span>
            </button>

            <button
              @click="openPresensiGuruModal"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors"
            >
              <UiIcon name="mdi-account-school" size="24" class="mb-1" />
              <span class="text-xs font-semibold text-center">Presensi Pengajar</span>
            </button>

            <button
              @click="openAbsensiSiswaModal"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-violet-50/50 hover:bg-violet-100/60 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 transition-colors"
            >
              <UiIcon name="mdi-checkbox-marked-circle-outline" size="24" class="mb-1" />
              <span class="text-xs font-semibold text-center">Absensi Siswa</span>
            </button>

            <button
              @click="openJurnalModal()"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition-colors"
            >
              <UiIcon name="mdi-book-plus-outline" size="24" class="mb-1" />
              <span class="text-xs font-semibold text-center">Jurnal Mengajar</span>
            </button>
          </div>
        </div>

        <!-- Realtime Activity Log / Feed -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Aktivitas Terkini
            </h3>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div class="space-y-4">
            <div
              v-for="act in activityLogs"
              :key="act.id"
              class="flex items-start gap-3 text-xs"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px]"
                :class="act.type === 'journal' ? 'bg-amber-500' : act.type === 'teacher' ? 'bg-emerald-500' : 'bg-blue-500'"
              >
                <UiIcon :name="act.icon" size="14" />
              </div>
              <div class="space-y-0.5 flex-1 min-w-0">
                <p class="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                  {{ act.message }}
                </p>
                <span class="text-[11px] text-slate-400 dark:text-slate-500">
                  {{ act.time }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form: Isi Jurnal Mengajar -->
    <UiModal v-model="showJurnalModal" title="Isi Jurnal Mengajar" size="lg" persistent>
      <UiForm ref="jurnalFormRef">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.className"
                label="Kelas"
                placeholder="Contoh: X-IPA 1"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.subject"
                label="Mata Pelajaran"
                placeholder="Contoh: Matematika"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.teacher"
                label="Nama Pengajar"
                placeholder="Masukkan nama pengajar"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.period"
                label="Jam Ke-"
                placeholder="Contoh: 1 - 2"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiTextarea
            v-model="jurnalForm.topic"
            label="Materi Pembelajaran / Topik"
            placeholder="Tuliskan topik atau pembahasan materi hari ini..."
            required
            :rules="[(v) => !!v || 'Wajib diisi']"
            :rows="3"
          />

          <UiTextarea
            v-model="jurnalForm.notes"
            label="Catatan Perkembangan Siswa / Evaluasi"
            placeholder="Tuliskan catatan kejadian atau evaluasi pembelajaran jika ada..."
            :rows="2"
          />
        </div>
      </UiForm>

      <template #footer>
        <UiButton color="secondary" @click="showJurnalModal = false">
          Batal
        </UiButton>
        <UiButton color="primary" :loading="isSubmittingJurnal" @click="saveJurnal">
          Simpan Jurnal
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { useSwal } from "~/composables/useSwal";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Dashboard Manajemen Sekolah",
});

const swal = useSwal();
const selectedPeriod = ref("today");
const activeGrade = ref("X");

// Live Time & Date
const currentTime = ref("");
const currentDate = ref("");

function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + " WIB";

  currentDate.value = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

let clockInterval: any = null;

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});

// Dummy Schedule & Jurnal Data
const scheduleList = ref([
  {
    id: 1,
    period: "1 - 2",
    time: "07:30 - 09:00 WIB",
    subject: "Matematika",
    className: "X-IPA 1",
    teacher: "Dr. Budi Santoso, M.Pd",
    topic: "Sistem Persamaan Linear Tiga Variabel dan Pembahasannya",
    status: "completed",
  },
  {
    id: 2,
    period: "1 - 2",
    time: "07:30 - 09:00 WIB",
    subject: "Fisika",
    className: "XI-IPA 2",
    teacher: "Ibu Siti Nurhaliza, S.Pd",
    topic: "Hukum Newton tentang Gerak dan Aplikasinya",
    status: "completed",
  },
  {
    id: 3,
    period: "3 - 4",
    time: "09:15 - 10:45 WIB",
    subject: "Bahasa Indonesia",
    className: "X-IPS 1",
    teacher: "Bpk. Ahmad Sujiwo, M.Hum",
    topic: "Struktur dan Kebahasaan Teks Laporan Hasil Observasi",
    status: "ongoing",
  },
  {
    id: 4,
    period: "3 - 4",
    time: "09:15 - 10:45 WIB",
    subject: "Kimia",
    className: "XII-IPA 1",
    teacher: "Drs. Hendra Wijaya",
    topic: "Reaksi Redoks dan Elektrokimia",
    status: "ongoing",
  },
  {
    id: 5,
    period: "5 - 6",
    time: "11:00 - 12:30 WIB",
    subject: "Sejarah Indonesia",
    className: "XI-IPS 2",
    teacher: "Ibu Ratna Pertiwi, S.Pd",
    topic: "Perkembangan Kolonialisme dan Imperialisme",
    status: "pending",
  },
]);

// Dummy Class Attendance Data
const classList = ref([
  { grade: "X", name: "X-IPA 1", total: 32, present: 31, sick: 1, permission: 0, alpha: 0, percentage: 96.8 },
  { grade: "X", name: "X-IPA 2", total: 30, present: 30, sick: 0, permission: 0, alpha: 0, percentage: 100 },
  { grade: "X", name: "X-IPS 1", total: 31, present: 29, sick: 1, permission: 1, alpha: 0, percentage: 93.5 },
  { grade: "X", name: "X-IPS 2", total: 29, present: 27, sick: 1, permission: 0, alpha: 1, percentage: 93.1 },

  { grade: "XI", name: "XI-IPA 1", total: 30, present: 30, sick: 0, permission: 0, alpha: 0, percentage: 100 },
  { grade: "XI", name: "XI-IPA 2", total: 32, present: 31, sick: 1, permission: 0, alpha: 0, percentage: 96.8 },
  { grade: "XI", name: "XI-IPS 1", total: 28, present: 27, sick: 0, permission: 1, alpha: 0, percentage: 96.4 },
  { grade: "XI", name: "XI-IPS 2", total: 30, present: 28, sick: 1, permission: 0, alpha: 1, percentage: 93.3 },

  { grade: "XII", name: "XII-IPA 1", total: 31, present: 30, sick: 1, permission: 0, alpha: 0, percentage: 96.7 },
  { grade: "XII", name: "XII-IPA 2", total: 30, present: 29, sick: 0, permission: 1, alpha: 0, percentage: 96.7 },
  { grade: "XII", name: "XII-IPS 1", total: 29, present: 28, sick: 1, permission: 0, alpha: 0, percentage: 96.5 },
  { grade: "XII", name: "XII-IPS 2", total: 30, present: 27, sick: 1, permission: 1, alpha: 1, percentage: 90 },
]);

const filteredClassList = computed(() => {
  return classList.value.filter((cls) => cls.grade === activeGrade.value);
});

// Dummy Realtime Activity Logs
const activityLogs = ref([
  {
    id: 1,
    type: "journal",
    icon: "mdi-notebook-check",
    message: "Dr. Budi Santoso, M.Pd mengisi Jurnal Mengajar Matematika (X-IPA 1)",
    time: "5 menit lalu",
  },
  {
    id: 2,
    type: "teacher",
    icon: "mdi-account-check",
    message: "Ibu Siti Nurhaliza, S.Pd melakukan presensi masuk mengajar (07:22 WIB)",
    time: "15 menit lalu",
  },
  {
    id: 3,
    type: "student",
    icon: "mdi-checkbox-marked-circle",
    message: "Absensi siswa Kelas XII-IPA 1 diverifikasi oleh Wali Kelas: 30 Hadir",
    time: "28 menit lalu",
  },
  {
    id: 4,
    type: "staff",
    icon: "mdi-clock-check-outline",
    message: "Bpk. Bambang Subagyo (Staf TU) mencatat presensi hadir",
    time: "42 menit lalu",
  },
]);

// Modal State & Handlers
const showJurnalModal = ref(false);
const isSubmittingJurnal = ref(false);
const jurnalFormRef = ref<any>(null);

const jurnalForm = ref({
  id: null as number | null,
  className: "",
  subject: "",
  teacher: "",
  period: "",
  topic: "",
  notes: "",
});

function openJurnalModal(item?: any) {
  if (item) {
    jurnalForm.value = {
      id: item.id,
      className: item.className,
      subject: item.subject,
      teacher: item.teacher,
      period: item.period,
      topic: item.topic || "",
      notes: "",
    };
  } else {
    jurnalForm.value = {
      id: null,
      className: "",
      subject: "",
      teacher: "",
      period: "",
      topic: "",
      notes: "",
    };
  }
  showJurnalModal.value = true;
}

async function saveJurnal() {
  const isValid = await jurnalFormRef.value?.validate();
  if (!isValid) return;

  isSubmittingJurnal.value = true;

  setTimeout(() => {
    isSubmittingJurnal.value = false;
    showJurnalModal.value = false;

    if (jurnalForm.value.id) {
      const idx = scheduleList.value.findIndex((s) => s.id === jurnalForm.value.id);
      if (idx !== -1) {
        scheduleList.value[idx].topic = jurnalForm.value.topic;
        scheduleList.value[idx].status = "completed";
      }
    }

    swal.toast("Jurnal mengajar berhasil disimpan", "success");
  }, 600);
}

function openPresensiPegawaiModal() {
  swal.toast("Halaman Presensi Pegawai diproses", "info");
}

function openPresensiGuruModal() {
  swal.toast("Halaman Presensi Pengajar diproses", "info");
}

function openAbsensiSiswaModal() {
  swal.toast("Halaman Absensi Siswa diproses", "info");
}
</script>

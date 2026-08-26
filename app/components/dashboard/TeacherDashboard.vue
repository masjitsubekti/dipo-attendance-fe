<template>
  <div class="w-full max-w-full overflow-x-hidden space-y-5 pb-12 animate-fade-in">
    <!-- 1. Header Profile Welcome Card -->
    <UiCard class="relative z-20" :padding="true">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Profile Info -->
        <div class="flex items-center gap-3">
          <div class="relative shrink-0">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
              {{ userInitials }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
              <UiIcon name="mdi-check" size="10" class="text-white" />
            </div>
          </div>

          <div class="space-y-0.5 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <UiBadge variant="primary" class="px-2 py-0.2 text-[10px] font-semibold">
                <UiIcon name="mdi-school-outline" size="12" class="mr-1" />
                Pengajar / Guru
              </UiBadge>
              <UiBadge variant="default" class="px-2 py-0.2 text-[10px] font-semibold">
                Wali Kelas XI-IPA 1
              </UiBadge>
            </div>
            <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Selamat Datang, {{ userName }}! 👋
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Guru Mata Pelajaran: <span class="font-semibold text-slate-700 dark:text-slate-300">Matematika</span> &bull; NIP: <span class="font-mono text-slate-700 dark:text-slate-300">19880721 201201 1 002</span>
            </p>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- 2. STANDALONE HERO WIDGET: Akses Cepat Presensi Mandiri (Dynamic Multi-tone Primary Blue Gradient) -->
    <div class="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 dark:from-primary-600 dark:via-primary-700 dark:to-indigo-800 text-white shadow-lg relative overflow-hidden">
      <!-- Decorative Multi-tone Glows inside Widget -->
      <div class="absolute -right-10 -top-10 w-72 h-72 bg-sky-300/25 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <!-- Left Info: Shift & Status Presensi Hari Ini -->
        <div class="space-y-2.5 flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-white/20 text-white text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1 backdrop-blur-xs">
              <UiIcon name="mdi-calendar-clock" size="13" />
              Shift Reguler (07:00 - 15:30 WIB)
            </span>
            
            <!-- Status Badge Dynamic -->
            <span 
              class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xs border"
              :class="attendanceStatus === 'checked_in' ? 'bg-emerald-500/30 text-white border-emerald-300/40' : attendanceStatus === 'checked_out' ? 'bg-sky-400/30 text-white border-sky-200/40' : 'bg-amber-400/30 text-white border-amber-200/40'"
            >
              <span class="w-2 h-2 rounded-full animate-ping" :class="attendanceStatus === 'checked_in' ? 'bg-emerald-300' : attendanceStatus === 'checked_out' ? 'bg-sky-300' : 'bg-amber-300'"></span>
              {{ attendanceStatusText }}
            </span>
          </div>

          <div>
            <h2 class="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              <UiIcon name="mdi-account-clock-outline" size="22" class="text-primary-100" />
              Akses Cepat Presensi Mandiri
            </h2>
            <p class="text-xs text-primary-50/95 leading-relaxed mt-0.5">
              Lakukan absensi masuk/pulang presensi harian secara langsung dari dashboard.
            </p>
          </div>

          <!-- Location & Radius Info -->
          <div class="flex flex-wrap items-center gap-2 text-xs text-white pt-0.5">
            <div class="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg border border-white/25 backdrop-blur-xs">
              <UiIcon name="mdi-map-marker-radius" size="14" class="text-primary-100" />
              <span>SMA Negeri 1</span>
            </div>
            <div class="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg border border-white/25 backdrop-blur-xs">
              <UiIcon name="mdi-crosshairs-gps" size="14" class="text-emerald-300" />
              <span>12m (Dalam Radius)</span>
            </div>
            <div v-if="lastCheckInTime" class="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg border border-white/25 backdrop-blur-xs">
              <UiIcon name="mdi-login" size="14" class="text-primary-100" />
              <span>Masuk: <strong>{{ lastCheckInTime }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Right Quick Actions -->
        <div class="flex flex-col sm:flex-row lg:flex-col shrink-0 gap-2.5">
          <!-- Primary Attendance Button -->
          <UiButton
            color="primary"
            variant="filled"
            size="md"
            class="!bg-white hover:!bg-primary-50 !text-primary-700 !font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 transition-all text-xs"
            @click="goToAttendance"
          >
            <UiIcon name="mdi-camera-outline" size="18" class="text-primary-600" />
            <span>{{ attendanceButtonText }}</span>
          </UiButton>

          <div class="flex items-center gap-2">
            <!-- Secondary: Pengajuan Izin -->
            <UiButton
              color="secondary"
              variant="outline"
              size="sm"
              class="!border-white/30 !text-white hover:!bg-white/20 backdrop-blur-xs flex-1 justify-center text-xs font-semibold"
              @click="goToLeaveForm"
            >
              <UiIcon name="mdi-file-document-edit-outline" size="14" class="mr-1" />
              Pengajuan Izin
            </UiButton>

            <!-- Secondary: Isi Jurnal -->
            <UiButton
              color="secondary"
              variant="outline"
              size="sm"
              class="!border-white/30 !text-white hover:!bg-white/20 backdrop-blur-xs flex-1 justify-center text-xs font-semibold"
              @click="openJurnalModal()"
            >
              <UiIcon name="mdi-notebook-edit-outline" size="14" class="mr-1" />
              Isi Jurnal
            </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Personal Stat Cards (4 Stat Cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Kehadiran Saya Bulan Ini -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UiIcon name="mdi-calendar-check-outline" size="22" />
          </div>
          <UiBadge variant="success" class="px-2 py-0.2 text-[10px] font-semibold">
            <UiIcon name="mdi-check-all" size="11" class="mr-1" /> 100% Tepat Waktu
          </UiBadge>
        </div>
        <div class="mt-3">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kehadiran Bulan Ini</h3>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="text-xl font-bold text-slate-900 dark:text-white">22 Hari</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 22 Hari Kerja</span>
          </div>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Hadir: 22</span>
          <span class="text-amber-600">Telat: 0</span>
          <span>Izin: 0</span>
          <span class="text-rose-500">Alpha: 0</span>
        </div>
      </UiCard>

      <!-- 2. Sesi Kelas Hari Ini -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UiIcon name="mdi-human-male-board" size="22" />
          </div>
          <UiBadge variant="primary" class="px-2 py-0.2 text-[10px] font-semibold">
            4 Sesi Kelas
          </UiBadge>
        </div>
        <div class="mt-3">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jadwal Mengajar Hari Ini</h3>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="text-xl font-bold text-slate-900 dark:text-white">4 Sesi</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">(8 Jam Pelajaran)</span>
          </div>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Selesai: 2</span>
          <span class="text-blue-600 font-medium">Berlangsung: 1</span>
          <span class="text-slate-500 font-medium">Mendatang: 1</span>
        </div>
      </UiCard>

      <!-- 3. Kelengkapan Jurnal KBM -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UiIcon name="mdi-notebook-check-outline" size="22" />
          </div>
          <UiBadge variant="warning" class="px-2 py-0.2 text-[10px] font-semibold">
            95% Terisi
          </UiBadge>
        </div>
        <div class="mt-3">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jurnal Mengajar KBM</h3>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="text-xl font-bold text-slate-900 dark:text-white">38</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 40 Jurnal Bulan Ini</span>
          </div>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Terverifikasi: 38</span>
          <span class="text-rose-500 font-medium">Pending: 2</span>
        </div>
      </UiCard>

      <!-- 4. Hak Sisa Cuti Tahunan -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <UiIcon name="mdi-beach" size="22" />
          </div>
          <UiBadge variant="default" class="px-2 py-0.2 text-[10px] font-semibold">
            Kuota 12 Hari
          </UiBadge>
        </div>
        <div class="mt-3">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sisa Hak Cuti Tahunan</h3>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="text-xl font-bold text-slate-900 dark:text-white">8 Hari</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Tersedia</span>
          </div>
        </div>
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Terpakai: 4 Hari</span>
          <span class="text-emerald-600 font-medium">Sisa: 8 Hari</span>
        </div>
      </UiCard>
    </div>

    <!-- Main Content Section: Teaching Schedule & Recent Attendance -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Jadwal Mengajar Hari Ini (2 Cols) -->
      <UiCard class="lg:col-span-2 space-y-4" :padding="true">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                Jadwal Mengajar & Status Jurnal Hari Ini
              </h2>
              <UiBadge variant="primary" class="text-xs font-semibold">
                {{ currentDate }}
              </UiBadge>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Daftar jam tatap muka kelas mengajar dan status pengisian jurnal KBM harian
            </p>
          </div>

          <UiButton color="primary" variant="filled" size="sm" @click="openJurnalModal()">
            <UiIcon name="mdi-plus" size="16" class="mr-1" />
            Tambah Jurnal KBM
          </UiButton>
        </div>

        <!-- Schedule Items List -->
        <div class="space-y-3">
          <div
            v-for="session in teachingSchedule"
            :key="session.id"
            class="p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            :class="
              session.status === 'ongoing'
                ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/60 shadow-xs'
                : session.status === 'completed'
                ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                : 'bg-white dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-700/60'
            "
          >
            <div class="flex items-start gap-3.5">
              <!-- Session Time Badge -->
              <div
                class="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-xs font-bold"
                :class="
                  session.status === 'ongoing'
                    ? 'bg-primary-600 text-white'
                    : session.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                "
              >
                <span>Jam</span>
                <span class="text-base font-extrabold leading-none">{{ session.period }}</span>
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-extrabold text-slate-900 dark:text-white text-base">
                    Kelas {{ session.className }}
                  </span>
                  <UiBadge
                    :variant="
                      session.status === 'completed'
                        ? 'success'
                        : session.status === 'ongoing'
                        ? 'primary'
                        : 'default'
                    "
                    class="text-[10px] font-bold"
                  >
                    {{
                      session.status === 'completed'
                        ? 'Selesai'
                        : session.status === 'ongoing'
                        ? 'Berlangsung'
                        : 'Mendatang'
                    }}
                  </UiBadge>
                </div>

                <div class="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                  <span class="flex items-center gap-1 font-medium">
                    <UiIcon name="mdi-book-open-variant" size="14" class="text-primary-500" />
                    {{ session.subject }}
                  </span>
                  <span class="flex items-center gap-1 text-slate-400">
                    <UiIcon name="mdi-clock-outline" size="14" />
                    {{ session.timeSlot }}
                  </span>
                  <span class="flex items-center gap-1 text-slate-400">
                    <UiIcon name="mdi-door" size="14" />
                    Ruang {{ session.room }}
                  </span>
                </div>

                <p v-if="session.topic" class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
                  Topik: "{{ session.topic }}"
                </p>
              </div>
            </div>

            <!-- Action Button per Session -->
            <div class="shrink-0 flex items-center gap-2">
              <UiButton
                v-if="session.status === 'completed'"
                color="secondary"
                variant="outline"
                size="sm"
                @click="openJurnalModal(session)"
              >
                <UiIcon name="mdi-pencil-outline" size="14" class="mr-1" />
                Edit Jurnal
              </UiButton>

              <UiButton
                v-else
                color="primary"
                variant="filled"
                size="sm"
                :class="session.status === 'ongoing' ? '!bg-emerald-600 hover:!bg-emerald-700' : ''"
                @click="openJurnalModal(session)"
              >
                <UiIcon name="mdi-notebook-plus" size="14" class="mr-1" />
                Isi Jurnal KBM
              </UiButton>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Right Column: Quick Utilities & Info Card (1 Col) -->
      <div class="space-y-6">
        <!-- Quick Action Shortcuts -->
        <UiCard :padding="true" class="space-y-3">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Aksi Cepat Pengajar
          </h3>

          <div class="grid grid-cols-2 gap-2.5">
            <button
              @click="goToAttendance"
              class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 transition-all text-left group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UiIcon name="mdi-camera-outline" size="18" />
              </div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Presensi Mandiri</div>
              <div class="text-[10px] text-slate-400">Absen masuk & pulang</div>
            </button>

            <button
              @click="goToLeaveForm"
              class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 transition-all text-left group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UiIcon name="mdi-file-document-edit-outline" size="18" />
              </div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Pengajuan Izin</div>
              <div class="text-[10px] text-slate-400">Form sakit / izin / cuti</div>
            </button>

            <button
              @click="openJurnalModal()"
              class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-200 transition-all text-left group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UiIcon name="mdi-notebook-edit-outline" size="18" />
              </div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Jurnal KBM</div>
              <div class="text-[10px] text-slate-400">Catatan mengajar kelas</div>
            </button>

            <button
              @click="showScheduleToast"
              class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-200 transition-all text-left group cursor-pointer"
            >
              <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UiIcon name="mdi-calendar-month-outline" size="18" />
              </div>
              <div class="font-bold text-xs text-slate-800 dark:text-white">Jadwal Mengajar</div>
              <div class="text-[10px] text-slate-400">Lihat seluruh mingguan</div>
            </button>
          </div>
        </UiCard>

        <!-- Information Card: Pengumuman Sekolah -->
        <UiCard :padding="true" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UiIcon name="mdi-bullhorn-outline" size="18" class="text-amber-500" />
              Pengumuman Sekolah
            </h3>
            <UiBadge variant="warning" class="text-[10px]">Penting</UiBadge>
          </div>

          <div class="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
            <div class="font-bold text-xs text-amber-900 dark:text-amber-200">
              Rapat Evaluasi Pembelajaran Tengah Semester
            </div>
            <p class="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              Dihimbau kepada seluruh Bapak/Ibu guru pengajar untuk menyelesaikan pengisian Jurnal KBM sebelum tanggal 28 bulan ini.
            </p>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Personal Attendance History Table (Riwayat Presensi Mandiri Saya) -->
    <!-- <UiCard :padding="true" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Riwayat Presensi Mandiri Saya (7 Hari Terakhir)
            </h2>
            <UiBadge variant="success" class="text-xs font-semibold">
              <UiIcon name="mdi-history" size="14" class="mr-1" />
              Log Presensi
            </UiBadge>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Rekap histori absensi masuk & pulang serta durasi kerja mandiri
          </p>
        </div>

        <UiButton color="secondary" variant="outline" size="sm" @click="goToAttendanceHistory">
          <UiIcon name="mdi-open-in-new" size="14" class="mr-1" />
          Lihat Riwayat Lengkap
        </UiButton>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
              <th class="py-3 px-4">Hari & Tanggal</th>
              <th class="py-3 px-4">Shift Kerja</th>
              <th class="py-3 px-4">Jam Masuk</th>
              <th class="py-3 px-4">Jam Keluar</th>
              <th class="py-3 px-4">Durasi Kerja</th>
              <th class="py-3 px-4">Lokasi Absen</th>
              <th class="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="item in personalHistory"
              :key="item.date"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
            >
              <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                {{ item.date }}
              </td>
              <td class="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                {{ item.shift }}
              </td>
              <td class="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {{ item.checkIn }}
              </td>
              <td class="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                {{ item.checkOut || '-' }}
              </td>
              <td class="py-3 px-4 font-medium">
                {{ item.duration }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <UiIcon name="mdi-map-marker" size="14" class="text-rose-500 shrink-0" />
                <span>{{ item.location }}</span>
              </td>
              <td class="py-3 px-4 text-center">
                <UiBadge
                  :variant="
                    item.status === 'hadir'
                      ? 'success'
                      : item.status === 'telat'
                      ? 'warning'
                      : 'default'
                  "
                  class="text-[10px] font-bold"
                >
                  {{ item.statusText }}
                </UiBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard> -->

    <!-- Modal Form: Isi Jurnal KBM -->
    <UiModal v-model="showJurnalModal" title="Isi Jurnal Mengajar KBM" size="lg" persistent>
      <UiForm ref="jurnalFormRef">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.className"
                label="Kelas Target"
                placeholder="Contoh: XI-IPA 1"
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
                v-model="jurnalForm.period"
                label="Jam Pelajaran Ke-"
                placeholder="Contoh: 1 - 2"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="jurnalForm.timeSlot"
                label="Waktu Sesi"
                placeholder="Contoh: 07:30 - 09:00 WIB"
              />
            </UiCol>
          </UiRow>

          <UiTextarea
            v-model="jurnalForm.topic"
            label="Materi / Pembahasan Pembelajaran"
            placeholder="Tuliskan materi pembelajaran yang diajarkan di kelas hari ini..."
            required
            :rules="[(v) => !!v || 'Wajib diisi']"
            :rows="3"
          />

          <UiTextarea
            v-model="jurnalForm.notes"
            label="Catatan Kehadiran Siswa & Kendala KBM"
            placeholder="Contoh: Siswa hadir 30 dari 32, 2 siswa izin. KBM berjalan kondusif."
            :rows="2"
          />
        </div>
      </UiForm>

      <template #footer>
        <UiButton color="secondary" @click="showJurnalModal = false">
          Batal
        </UiButton>
        <UiButton color="primary" :loading="isSubmittingJurnal" @click="saveJurnal">
          Simpan Jurnal KBM
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useSwal } from "~/composables/useSwal";

const authStore = useAuthStore();
const swal = useSwal();
const router = useRouter();

// User info from store
const userName = computed(() => authStore.user?.name || "Bpk. Budi Santoso, S.Pd");
const userInitials = computed(() => {
  const name = userName.value;
  const parts = name.replace(/^(Bpk\.|Ibu|Dr\.|Drs\.)\s*/i, "").trim().split(" ");
  const p0 = parts[0];
  const p1 = parts[1];
  if (p0 && p1 && p0.length > 0 && p1.length > 0) {
    return (p0.charAt(0) + p1.charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

// Live Clock & Date
const currentTime = ref("");
const currentDate = ref("");

function updateClock() {
  const now = new Date();
  currentTime.value =
    now.toLocaleTimeString("id-ID", {
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

// Attendance Status State (Mocked realtime state)
const attendanceStatus = ref<'not_checked_in' | 'checked_in' | 'checked_out'>('checked_in');
const lastCheckInTime = ref('07:12 WIB');

const attendanceStatusText = computed(() => {
  if (attendanceStatus.value === 'checked_in') return 'Hadir Tepat Waktu (07:12 WIB)';
  if (attendanceStatus.value === 'checked_out') return 'Sudah Presensi Pulang (15:30 WIB)';
  return 'Belum Absen Masuk Hari Ini';
});

const attendanceButtonText = computed(() => {
  if (attendanceStatus.value === 'not_checked_in') return 'Absen Masuk Sekarang';
  if (attendanceStatus.value === 'checked_in') return 'Absen Pulang Sekarang';
  return 'Lihat Detail Presensi';
});

// Navigation actions
function goToAttendance() {
  router.push('/attendance');
}

function goToLeaveForm() {
  router.push('/person-leave/form');
}

function goToAttendanceHistory() {
  router.push('/attendance');
}

function showScheduleToast() {
  swal.toast("Menampilkan seluruh jadwal mengajar minggu ini", "info");
}

// Today's Teaching Schedule Data
const teachingSchedule = ref([
  {
    id: 1,
    period: "1-2",
    className: "X IPA 1",
    subject: "Matematika Wajib",
    timeSlot: "07:30 - 09:00 WIB",
    room: "101",
    topic: "Persamaan dan Pertidaksamaan Nilai Mutlak",
    status: "completed",
  },
  {
    id: 2,
    period: "3-4",
    className: "XI IPA 2",
    subject: "Matematika Minat",
    timeSlot: "09:15 - 10:45 WIB",
    room: "204",
    topic: "Polinomial dan Suku Banyak",
    status: "ongoing",
  },
  {
    id: 3,
    period: "5-6",
    className: "XII IPS 1",
    subject: "Matematika Terapan",
    timeSlot: "11:00 - 12:30 WIB",
    room: "302",
    topic: "Statistika & Distribusi Peluang",
    status: "upcoming",
  },
  {
    id: 4,
    period: "7-8",
    className: "X IPS 2",
    subject: "Matematika Wajib",
    timeSlot: "13:15 - 14:45 WIB",
    room: "104",
    topic: "Fungsi Komposisi & Invers",
    status: "upcoming",
  },
]);

// Personal Attendance Log History
const personalHistory = ref([
  { date: "Selasa, 25 Agt 2026", shift: "Reguler Pagi", checkIn: "07:12 WIB", checkOut: "15:32 WIB", duration: "8 jam 20 mnt", location: "SMA Negeri 1", status: "hadir", statusText: "Hadir Tepat Waktu" },
  { date: "Senin, 24 Agt 2026", shift: "Reguler Pagi", checkIn: "07:05 WIB", checkOut: "15:35 WIB", duration: "8 jam 30 mnt", location: "SMA Negeri 1", status: "hadir", statusText: "Hadir Tepat Waktu" },
  { date: "Sabtu, 22 Agt 2026", shift: "Reguler Sabtu", checkIn: "07:15 WIB", checkOut: "13:00 WIB", duration: "5 jam 45 mnt", location: "SMA Negeri 1", status: "hadir", statusText: "Hadir Tepat Waktu" },
  { date: "Jumat, 21 Agt 2026", shift: "Reguler Pagi", checkIn: "07:08 WIB", checkOut: "15:40 WIB", duration: "8 jam 32 mnt", location: "SMA Negeri 1", status: "hadir", statusText: "Hadir Tepat Waktu" },
  { date: "Kamis, 20 Agt 2026", shift: "Reguler Pagi", checkIn: "07:10 WIB", checkOut: "15:30 WIB", duration: "8 jam 20 mnt", location: "SMA Negeri 1", status: "hadir", statusText: "Hadir Tepat Waktu" },
]);

// Modal State & Handlers for Jurnal
const showJurnalModal = ref(false);
const isSubmittingJurnal = ref(false);
const jurnalFormRef = ref<any>(null);

const jurnalForm = ref({
  className: "",
  subject: "",
  period: "",
  timeSlot: "",
  topic: "",
  notes: "",
});

function openJurnalModal(session?: any) {
  if (session) {
    jurnalForm.value.className = session.className || "";
    jurnalForm.value.subject = session.subject || "";
    jurnalForm.value.period = String(session.period || "");
    jurnalForm.value.timeSlot = session.timeSlot || "";
    jurnalForm.value.topic = session.topic || "";
  } else {
    jurnalForm.value.className = "XI IPA 1";
    jurnalForm.value.subject = "Matematika";
    jurnalForm.value.period = "1-2";
    jurnalForm.value.timeSlot = "07:30 - 09:00 WIB";
    jurnalForm.value.topic = "";
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
    swal.toast("Jurnal KBM berhasil disimpan dan diverifikasi", "success");
  }, 500);
}
</script>

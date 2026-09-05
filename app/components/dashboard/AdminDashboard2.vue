<template>
  <div class="w-full max-w-full overflow-x-hidden space-y-6 pb-12 animate-fade-in">
    <!-- Header Dashboard Superadmin (Using UiCard & UiSelect UI Components) -->
    <UiCard class="relative z-20" :padding="true">
      <!-- Decorative Gradient Glow (Scoped to background container to prevent horizontal scroll) -->
      <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
        <div class="absolute -right-16 -top-16 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col gap-5">
        <!-- Top Row: Welcome Info & Live Clock -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <UiBadge variant="success" class="px-2.5 py-0.5 text-xs font-semibold">
                <UiIcon name="mdi-calendar-school" size="14" class="mr-1" />
                {{ currentAcademicYearLabel }}
              </UiBadge>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard Manajemen Sekolah
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pusat pemantauan & analisis terpadu presensi pegawai, pengajar, absensi siswa, dan jurnal mengajar.
            </p>
          </div>

          <!-- Live Clock Card -->
          <div class="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-700/50 px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-600/60 shrink-0 shadow-xs">
            <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold">
              <UiIcon name="mdi-clock-outline" size="22" />
            </div>
            <div>
              <div class="text-base font-bold text-slate-900 dark:text-white font-mono leading-tight">
                {{ currentTime }}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {{ currentDate }}
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: Filter Controls & Actions Toolbar -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <!-- Filter Unit Sekolah (UiSelect) -->
            <div class="w-full sm:w-48 relative z-30">
              <UiSelect
                v-model="selectedUnit"
                :options="unitOptions"
                item-value="value"
                item-title="label"
                size="sm"
                placeholder="Pilih Unit Sekolah"
              />
            </div>

            <!-- Filter Tahun Ajaran & Semester (UiSelect) -->
            <div class="w-full sm:w-60 relative z-30">
              <UiSelect
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                item-value="value"
                item-title="label"
                size="sm"
                placeholder="Pilih Tahun Ajaran & Semester"
              />
            </div>

            <!-- Filter Periode (UiSelect) -->
            <div class="w-full sm:w-40 relative z-30">
              <UiSelect
                v-model="selectedPeriod"
                :options="periodOptions"
                item-value="value"
                item-title="label"
                size="sm"
                placeholder="Pilih Periode"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UiButton color="secondary" variant="outline" size="sm" @click="refreshData">
              <UiIcon name="mdi-refresh" size="16" class="mr-1" />
              Refresh
            </UiButton>

            <UiButton color="primary" variant="filled" size="sm" @click="exportReport">
              <UiIcon name="mdi-file-excel-outline" size="16" class="mr-1.5" />
              Export Laporan
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- Top Metric Cards (4 Cards Using UiCard) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Presensi Pegawai -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UiIcon name="mdi-account-group-outline" size="26" />
          </div>
          <UiBadge variant="success" class="px-2 py-0.5 text-xs font-semibold">
            <UiIcon name="mdi-trending-up" size="12" class="mr-1" /> 95.6%
          </UiBadge>
        </div>
        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Presensi Pegawai</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">43</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 45 Pegawai</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 dark:text-emerald-400 font-medium">Hadir: 43</span>
          <span>Izin: 1</span>
          <span>Sakit: 1</span>
          <span class="text-rose-500 font-medium">Alpha: 0</span>
        </div>
      </UiCard>

      <!-- 2. Presensi Pengajar -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UiIcon name="mdi-account-school-outline" size="26" />
          </div>
          <UiBadge variant="success" class="px-2 py-0.5 text-xs font-semibold">
            <UiIcon name="mdi-check-circle-outline" size="12" class="mr-1" /> 96.8%
          </UiBadge>
        </div>
        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Presensi Pengajar</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">30</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 31 Guru</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Masuk: 30</span>
          <span class="text-amber-600 font-medium">Telat: 1</span>
          <span>Izin: 1</span>
          <span class="text-rose-500 font-medium">Alpha: 0</span>
        </div>
      </UiCard>

      <!-- 3. Absensi Siswa -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <UiIcon name="mdi-school-outline" size="26" />
          </div>
          <UiBadge variant="primary" class="px-2 py-0.5 text-xs font-semibold">
            <UiIcon name="mdi-percent-outline" size="12" class="mr-1" /> 97.2%
          </UiBadge>
        </div>
        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Absensi Siswa</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">845</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 869 Siswa</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Hadir: 845</span>
          <span>Sakit: 12</span>
          <span>Izin: 8</span>
          <span class="text-rose-500 font-medium">Alpha: 4</span>
        </div>
      </UiCard>

      <!-- 4. Jurnal Mengajar -->
      <UiCard :hover="true" :padding="true" class="relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UiIcon name="mdi-notebook-check-outline" size="26" />
          </div>
          <UiBadge variant="warning" class="px-2 py-0.5 text-xs font-semibold">
            90.4% Selesai
          </UiBadge>
        </div>
        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jurnal Mengajar Hari Ini</h3>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">38</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">/ 42 Sesi Kelas</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span class="text-emerald-600 font-medium">Terisi: 38</span>
          <span class="text-blue-600 font-medium">Berlangsung: 4</span>
          <span class="text-rose-500 font-medium">Pending: 0</span>
        </div>
      </UiCard>
    </div>

    <!-- Charts Section (UiCard & UiChart Components) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Grafik 1: Tren Kehadiran Mingguan (Area Chart - 2 Cols) -->
      <UiCard class="lg:col-span-2" :padding="true">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Tren Kehadiran Minggu Ini
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Perbandingan persentase kehadiran Pegawai, Pengajar, dan Siswa (Senin - Sabtu)
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-for="chartTab in ['Kehadiran', 'Kepatuhan Jam']"
              :key="chartTab"
              @click="activeChartTab = chartTab"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              :class="activeChartTab === chartTab ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
            >
              {{ chartTab }}
            </button>
          </div>
        </div>

        <div class="h-[320px] w-full">
          <UiChart
            type="area"
            height="320"
            :series="trendChartSeries"
            :options="trendChartOptions"
          />
        </div>
      </UiCard>

      <!-- Grafik 2: Distribusi Status Kehadiran Siswa (Donut Chart - 1 Col) -->
      <UiCard class="flex flex-col justify-between" :padding="true">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Proporsi Absensi Siswa
            </h2>
            <UiBadge variant="default" class="text-xs">Hari Ini</UiBadge>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Rincian status kehadiran total 869 siswa
          </p>

          <div class="h-[240px] w-full flex items-center justify-center">
            <UiChart
              type="donut"
              height="240"
              :series="pieChartSeries"
              :options="pieChartOptions"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div class="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30">
            <span class="text-slate-500 dark:text-slate-400 block">Hadir</span>
            <strong class="text-emerald-700 dark:text-emerald-400 text-base">845 Siswa</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30">
            <span class="text-slate-500 dark:text-slate-400 block">Sakit</span>
            <strong class="text-amber-700 dark:text-amber-400 text-base">12 Siswa</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
            <span class="text-slate-500 dark:text-slate-400 block">Izin</span>
            <strong class="text-blue-700 dark:text-blue-400 text-base">8 Siswa</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30">
            <span class="text-slate-500 dark:text-slate-400 block">Alpha</span>
            <strong class="text-rose-700 dark:text-rose-400 text-base">4 Siswa</strong>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Secondary Charts & Detailed Analytics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Grafik 3: Kelengkapan Jurnal Mengajar Per Mapel (UiCard + UiChart) -->
      <UiCard class="lg:col-span-2" :padding="true">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Capaian Jurnal Mengajar per Mata Pelajaran
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Persentase kelengkapan pengisian jurnal oleh guru mata pelajaran
            </p>
          </div>
          <UiBadge variant="success" class="text-xs">Target: 100%</UiBadge>
        </div>

        <div class="h-[280px] w-full">
          <UiChart
            type="bar"
            height="280"
            :series="subjectChartSeries"
            :options="subjectChartOptions"
          />
        </div>
      </UiCard>

      <!-- Live Audit Log Stream (UiCard Component) -->
      <UiCard class="flex flex-col justify-between" :padding="true">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Log Audit & Aktivitas Realtime
            </h2>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div class="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="log in auditLogs"
              :key="log.id"
              class="p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors flex items-start gap-3"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs"
                :class="
                  log.category === 'journal'
                    ? 'bg-amber-500'
                    : log.category === 'teacher'
                    ? 'bg-emerald-500'
                    : log.category === 'system'
                    ? 'bg-violet-500'
                    : 'bg-blue-500'
                "
              >
                <UiIcon :name="log.icon" size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-slate-800 dark:text-white text-xs truncate">
                    {{ log.user }}
                  </span>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                    {{ log.time }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  {{ log.action }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <button @click="openAuditModal" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
            Lihat Seluruh Log Aktivitas System &rarr;
          </button>
        </div>
      </UiCard>
    </div>

    <!-- Pemantauan Top 10 Keterlambatan (Superadmin Attendance Monitoring) -->
    <UiCard :padding="true" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Top 10 Pemantauan Keterlambatan
            </h2>
            <UiBadge variant="warning" class="text-xs font-semibold">
              <UiIcon name="mdi-clock-alert-outline" size="14" class="mr-1" />
              Monitoring Presensi
            </UiBadge>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Daftar nama dengan durasi dan akumulasi frekuensi keterlambatan tertinggi
          </p>
        </div>

        <!-- Filter Tab Kategori: Pengajar & Pegawai -->
        <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
          <button
            v-for="cat in [
              { id: 'pengajar', label: 'Pengajar / Guru' },
              { id: 'pegawai', label: 'Staf Pegawai' },
            ]"
            :key="cat.id"
            @click="activeLateCategory = cat.id"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            :class="
              activeLateCategory === cat.id
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            "
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- List Top 10 Table View -->
      <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
              <th class="py-3 px-4 w-12 text-center">Peringkat</th>
              <th class="py-3 px-4">Nama & ID</th>
              <th class="py-3 px-4">Role / Kelas / Dept</th>
              <th class="py-3 px-4">Waktu Jam Masuk</th>
              <th class="py-3 px-4">Durasi Terlambat</th>
              <th class="py-3 px-4">Total Bulan Ini</th>
              <th class="py-3 px-4 text-center">Status Evaluasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="(person, index) in filteredLateList"
              :key="person.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
            >
              <td class="py-3 px-4 text-center font-extrabold">
                <span
                  class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                  :class="
                    index === 0
                      ? 'bg-rose-100 text-rose-700 font-bold'
                      : index === 1
                      ? 'bg-amber-100 text-amber-700 font-bold'
                      : index === 2
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  "
                >
                  #{{ index + 1 }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {{ person.initials }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white block">
                      {{ person.name }}
                    </span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {{ person.code }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                {{ person.subDetail }}
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                {{ person.checkInTime }}
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                  +{{ person.lateDuration }} mnt
                </span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                {{ person.monthlyCount }} Kali
              </td>
              <td class="py-3 px-4 text-center">
                <UiBadge
                  :variant="
                    person.monthlyCount >= 5
                      ? 'danger'
                      : person.monthlyCount >= 3
                      ? 'warning'
                      : 'default'
                  "
                  class="text-[10px] font-bold"
                >
                  {{ person.statusText }}
                </UiBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Pemantauan Kehadiran & Jurnal Per Kelas (UiCard Component) -->
    <UiCard :padding="true" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Pemantauan Kehadiran Siswa & Jurnal Mengajar Per Kelas
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Superadmin Live Monitoring seluruh kelas dan wali kelas
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="w-56">
            <UiInput
              v-model="searchQuery"
              placeholder="Cari kelas / guru..."
              size="sm"
              clearable
            />
          </div>

          <div class="flex gap-1.5">
            <button
              v-for="grade in ['ALL', 'X', 'XI', 'XII']"
              :key="grade"
              @click="tableGradeFilter = grade"
              class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              :class="tableGradeFilter === grade ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
            >
              {{ grade === 'ALL' ? 'Semua Kelas' : 'Kelas ' + grade }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
              <th class="py-3 px-4">Kelas</th>
              <th class="py-3 px-4">Wali Kelas</th>
              <th class="py-3 px-4">Total Siswa</th>
              <th class="py-3 px-4">Hadir</th>
              <th class="py-3 px-4">Sakit</th>
              <th class="py-3 px-4">Izin</th>
              <th class="py-3 px-4">Alpha</th>
              <th class="py-3 px-4">Persentase</th>
              <th class="py-3 px-4">Jurnal Jam Ini</th>
              <th class="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="row in filteredTableData"
              :key="row.name"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
            >
              <td class="py-3 px-4 font-bold text-primary-600 dark:text-primary-400">
                Kelas {{ row.name }}
              </td>
              <td class="py-3 px-4 font-medium">
                {{ row.homeroom }}
              </td>
              <td class="py-3 px-4 font-semibold">
                {{ row.total }}
              </td>
              <td class="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                {{ row.present }}
              </td>
              <td class="py-3 px-4 text-amber-600">
                {{ row.sick }}
              </td>
              <td class="py-3 px-4 text-blue-600">
                {{ row.permission }}
              </td>
              <td class="py-3 px-4 text-rose-500 font-bold">
                {{ row.alpha }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      class="bg-emerald-500 h-full rounded-full"
                      :style="{ width: row.percentage + '%' }"
                    ></div>
                  </div>
                  <span class="font-bold text-[11px]">{{ row.percentage }}%</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <UiBadge
                  :variant="
                    row.journalStatus === 'completed'
                      ? 'success'
                      : row.journalStatus === 'ongoing'
                      ? 'primary'
                      : 'warning'
                  "
                  class="text-[10px] font-bold uppercase"
                >
                  {{ row.journalStatus === 'completed' ? 'Terisi' : row.journalStatus === 'ongoing' ? 'Berlangsung' : 'Belum Diisi' }}
                </UiBadge>
              </td>
              <td class="py-3 px-4 text-center">
                <UiIconButton
                  icon="mdi-eye-outline"
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  title="Detail Kehadiran & Jurnal"
                  @click="openClassDetail(row)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Modal Form: Isi Jurnal Mengajar (UiModal, UiForm, UiInput, UiTextarea, UiRow, UiCol) -->
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSwal } from "~/composables/useSwal";
import dashboardService from "~/services/dashboard.service";

const swal = useSwal();
const dashboardSvc = dashboardService();
const selectedUnit = ref("all");
const selectedPeriod = ref("today");
const selectedAcademicYear = ref("2025_2026_genap");
const activeChartTab = ref("Kehadiran");

// Dropdown Options for UiSelect / UiAutocomplete
const unitOptions = ref([
  { value: "all", label: "Semua Unit Sekolah" },
  { value: "sma1", label: "SMA Negeri 1" },
  { value: "smp1", label: "SMP Negeri 1" },
  { value: "sd1", label: "SD Negeri 1" },
]);

const academicYearOptions = ref([
  { value: "2025_2026_genap", label: "TA 2025/2026 - Semester Genap" },
  { value: "2025_2026_ganjil", label: "TA 2025/2026 - Semester Ganjil" },
  { value: "2024_2025_genap", label: "TA 2024/2025 - Semester Genap" },
  { value: "2024_2025_ganjil", label: "TA 2024/2025 - Semester Ganjil" },
]);

const currentAcademicYearLabel = computed(() => {
  const found = academicYearOptions.value.find(
    (opt) => opt.value === selectedAcademicYear.value
  );
  return found ? found.label : "TA 2025/2026 - Semester Genap";
});

const periodOptions = ref([
  { value: "today", label: "Hari Ini" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "this_month", label: "Bulan Ini" },
]);

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

// ApexCharts 1: Tren Kehadiran Mingguan (Area Chart)
const trendChartSeries = ref([
  {
    name: "Absensi Siswa (%)",
    data: [96.5, 97.0, 96.8, 97.2, 98.0, 96.2],
  },
  {
    name: "Presensi Pengajar (%)",
    data: [98.0, 96.8, 97.5, 96.8, 99.0, 97.0],
  },
  {
    name: "Presensi Pegawai (%)",
    data: [95.0, 94.5, 96.0, 95.6, 97.2, 95.0],
  },
]);

const trendChartOptions = ref({
  chart: {
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  colors: ["#8b5cf6", "#10b981", "#3b82f6"],
  stroke: { curve: "smooth", width: 3 },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  xaxis: {
    categories: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    labels: {
      style: { colors: "#64748b", fontSize: "12px" },
    },
  },
  yaxis: {
    min: 90,
    max: 100,
    labels: {
      formatter: (val: number) => val + "%",
      style: { colors: "#64748b", fontSize: "11px" },
    },
  },
  legend: {
    position: "top",
    horizontalAlign: "right",
    fontSize: "12px",
    labels: { colors: "#64748b" },
  },
  tooltip: {
    y: {
      formatter: (val: number) => val + "% Hadir",
    },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 4,
  },
});

// ApexCharts 2: Pie / Donut Chart Status Absensi Siswa
const pieChartSeries = ref([845, 12, 8, 4]);

const pieChartOptions = ref({
  chart: {
    fontFamily: "Inter, sans-serif",
  },
  labels: ["Hadir", "Sakit", "Izin", "Alpha"],
  colors: ["#10b981", "#f59e0b", "#3b82f6", "#f43f5e"],
  legend: {
    position: "bottom",
    fontSize: "12px",
    labels: { colors: "#64748b" },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val.toFixed(1) + "%",
  },
  stroke: { width: 0 },
});

// ApexCharts 3: Capaian Jurnal Mengajar Per Mapel (Bar Chart)
const subjectChartSeries = ref([
  {
    name: "Kelengkapan Jurnal (%)",
    data: [100, 100, 95, 92, 90, 88, 94],
  },
]);

const subjectChartOptions = ref({
  chart: {
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
  },
  colors: ["#3b82f6"],
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: "45%",
      distributed: false,
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val + "%",
    style: { fontSize: "11px", colors: ["#fff"] },
  },
  xaxis: {
    categories: [
      "Matematika",
      "Fisika",
      "Biologi",
      "B. Indonesia",
      "Sejarah",
      "B. Inggris",
      "Kimia",
    ],
    labels: { style: { colors: "#64748b", fontSize: "11px" } },
  },
  yaxis: {
    max: 100,
    labels: {
      formatter: (val: number) => val + "%",
      style: { colors: "#64748b", fontSize: "11px" },
    },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 4,
  },
});

// Audit Log & Activity Stream
const auditLogs = ref([
  {
    id: 1,
    user: "Dr. Budi Santoso, M.Pd",
    action: "Mengisi Jurnal Mengajar Matematika (X-IPA 1)",
    time: "5m yang lalu",
    category: "journal",
    icon: "mdi-notebook-check",
  },
  {
    id: 2,
    user: "Ibu Siti Nurhaliza, S.Pd",
    action: "Presensi masuk mengajar (07:22 WIB - Tepat Waktu)",
    time: "15m yang lalu",
    category: "teacher",
    icon: "mdi-account-check",
  },
  {
    id: 3,
    user: "Wali Kelas XII-IPA 1",
    action: "Verifikasi absensi harian kelas (30 Hadir, 1 Sakit)",
    time: "28m yang lalu",
    category: "student",
    icon: "mdi-checkbox-marked-circle",
  },
  {
    id: 4,
    user: "Bpk. Bambang Subagyo",
    action: "Presensi pegawai staf TU (07:05 WIB)",
    time: "42m yang lalu",
    category: "staff",
    icon: "mdi-clock-check-outline",
  },
  {
    id: 5,
    user: "System Administrator",
    action: "Sinkronisasi otomatis jadwal mengajar berhasil",
    time: "1j yang lalu",
    category: "system",
    icon: "mdi-cog-outline",
  },
]);

// Table Data Superadmin Monitoring
const searchQuery = ref("");
const tableGradeFilter = ref("ALL");

const masterTableData = ref([
  { grade: "X", name: "X-IPA 1", homeroom: "Ibu Dra. Ani Maryani", total: 32, present: 31, sick: 1, permission: 0, alpha: 0, percentage: 96.8, journalStatus: "completed" },
  { grade: "X", name: "X-IPA 2", homeroom: "Bpk. Drs. Herman", total: 30, present: 30, sick: 0, permission: 0, alpha: 0, percentage: 100, journalStatus: "completed" },
  { grade: "X", name: "X-IPS 1", homeroom: "Ibu Ratna S.Pd", total: 31, present: 29, sick: 1, permission: 1, alpha: 0, percentage: 93.5, journalStatus: "ongoing" },
  { grade: "X", name: "X-IPS 2", homeroom: "Bpk. Suherman S.Pd", total: 29, present: 27, sick: 1, permission: 0, alpha: 1, percentage: 93.1, journalStatus: "pending" },

  { grade: "XI", name: "XI-IPA 1", homeroom: "Dr. Budi Santoso", total: 30, present: 30, sick: 0, permission: 0, alpha: 0, percentage: 100, journalStatus: "completed" },
  { grade: "XI", name: "XI-IPA 2", homeroom: "Ibu Siti Nurhaliza", total: 32, present: 31, sick: 1, permission: 0, alpha: 0, percentage: 96.8, journalStatus: "completed" },
  { grade: "XI", name: "XI-IPS 1", homeroom: "Bpk. Ahmad Sujiwo", total: 28, present: 27, sick: 0, permission: 1, alpha: 0, percentage: 96.4, journalStatus: "ongoing" },
  { grade: "XI", name: "XI-IPS 2", homeroom: "Ibu Rahmawati S.Pd", total: 30, present: 28, sick: 1, permission: 0, alpha: 1, percentage: 93.3, journalStatus: "pending" },

  { grade: "XII", name: "XII-IPA 1", homeroom: "Drs. Hendra Wijaya", total: 31, present: 30, sick: 1, permission: 0, alpha: 0, percentage: 96.7, journalStatus: "completed" },
  { grade: "XII", name: "XII-IPA 2", homeroom: "Ibu Kartika M.Pd", total: 30, present: 29, sick: 0, permission: 1, alpha: 0, percentage: 96.7, journalStatus: "completed" },
  { grade: "XII", name: "XII-IPS 1", homeroom: "Bpk. Agung Prasetyo", total: 29, present: 28, sick: 1, permission: 0, alpha: 0, percentage: 96.5, journalStatus: "completed" },
  { grade: "XII", name: "XII-IPS 2", homeroom: "Ibu Wulandari S.Pd", total: 30, present: 27, sick: 1, permission: 1, alpha: 1, percentage: 90.0, journalStatus: "ongoing" },
]);

const filteredTableData = computed(() => {
  return masterTableData.value.filter((row) => {
    const matchGrade =
      tableGradeFilter.value === "ALL" || row.grade === tableGradeFilter.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.homeroom.toLowerCase().includes(q);
    return matchGrade && matchSearch;
  });
});

// Modal State & Handlers
const showJurnalModal = ref(false);
const isSubmittingJurnal = ref(false);
const jurnalFormRef = ref<any>(null);

// Top 10 Terlambat Data & Filtering (Pengajar & Staf Pegawai)
const activeLateCategory = ref("pengajar");

const lateListData = ref({
  pengajar: [
    { id: 101, name: "Bpk. Suherman, S.Pd", code: "NIP 19850312", initials: "SH", subDetail: "Guru PJOK / Olahraga", checkInTime: "07:35 WIB", lateDuration: 35, monthlyCount: 4, statusText: "Peringatan Waspada" },
    { id: 102, name: "Ibu Rahmawati, S.Pd", code: "NIP 19880721", initials: "RW", subDetail: "Guru Bahasa Inggris", checkInTime: "07:25 WIB", lateDuration: 25, monthlyCount: 3, statusText: "Peringatan Waspada" },
    { id: 103, name: "Drs. Hendra Wijaya", code: "NIP 19791104", initials: "HW", subDetail: "Guru Kimia", checkInTime: "07:18 WIB", lateDuration: 18, monthlyCount: 2, statusText: "Keterlambatan Ringan" },
    { id: 104, name: "Ibu Kartika, M.Pd", code: "NIP 19910215", initials: "KT", subDetail: "Guru Biologi", checkInTime: "07:15 WIB", lateDuration: 15, monthlyCount: 2, statusText: "Keterlambatan Ringan" },
    { id: 105, name: "Bpk. Agung Prasetyo", code: "NIP 19860930", initials: "AP", subDetail: "Guru Sosiologi", checkInTime: "07:10 WIB", lateDuration: 10, monthlyCount: 1, statusText: "Keterlambatan Ringan" },
  ],
  pegawai: [
    { id: 201, name: "Bpk. Bambang Subagyo", code: "NIP 19780514", initials: "BS", subDetail: "Staf Tata Usaha (TU)", checkInTime: "07:40 WIB", lateDuration: 40, monthlyCount: 5, statusText: "Perhatian Khusus" },
    { id: 202, name: "Ibu Wulandari", code: "NIP 19920408", initials: "WL", subDetail: "Keuangan / Bendahara", checkInTime: "07:25 WIB", lateDuration: 25, monthlyCount: 3, statusText: "Peringatan Waspada" },
    { id: 203, name: "Bpk. Agus Setiawan", code: "NIP 19941019", initials: "AS", subDetail: "Teknisi IT / Admin", checkInTime: "07:20 WIB", lateDuration: 20, monthlyCount: 2, statusText: "Keterlambatan Ringan" },
    { id: 204, name: "Ibu Tri Utami", code: "NIP 19890623", initials: "TU", subDetail: "Petugas Perpustakaan", checkInTime: "07:15 WIB", lateDuration: 15, monthlyCount: 2, statusText: "Keterlambatan Ringan" },
    { id: 205, name: "Bpk. Doni Kusuma", code: "NIP 19951201", initials: "DK", subDetail: "Facility / Kebersihan", checkInTime: "07:12 WIB", lateDuration: 12, monthlyCount: 1, statusText: "Keterlambatan Ringan" },
  ],
});

const filteredLateList = computed(() => {
  const cat = activeLateCategory.value as 'pengajar' | 'pegawai';
  return lateListData.value[cat] || [];
});

const jurnalForm = ref({
  id: null as number | null,
  className: "",
  subject: "",
  teacher: "",
  period: "",
  topic: "",
  notes: "",
});

async function saveJurnal() {
  const isValid = await jurnalFormRef.value?.validate();
  if (!isValid) return;

  isSubmittingJurnal.value = true;
  setTimeout(() => {
    isSubmittingJurnal.value = false;
    showJurnalModal.value = false;
    swal.toast("Jurnal mengajar berhasil disimpan", "success");
  }, 600);
}

function exportReport() {
  swal.toast("Laporan Rekapitulasi Eksekutif diexport ke Excel", "success");
}

function refreshData() {
  updateClock();
  swal.toast("Data dashboard berhasil diperbarui", "success");
}

function openClassDetail(row: any) {
  swal.toast(`Detail Kelas ${row.name} - Wali Kelas: ${row.homeroom}`, "info");
}

function openAuditModal() {
  swal.toast("Membuka seluruh Log Audit Sistem", "info");
}
</script>

<template>
  <div class="w-full space-y-4 pb-8 animate-fade-in sm:space-y-6 sm:pb-12">
    <!-- Header: Title, Time, Period, and Filter Trigger (Cargo MKN FE Layout Model) -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard Executive
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pemantauan &amp; analisis presensi pegawai secara real-time.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end">
        <div class="text-left sm:text-right">
          <h2 class="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
            {{ currentTime }}
          </h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
            {{ currentDate }}
          </p>
        </div>

        <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <!-- Active Filter Pill Badges -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {{ currentInstitutionLabel }}
            </span>
            <span
              v-if="selectedDepartment !== 'all'"
              class="inline-flex max-w-[220px] items-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
              :title="`Dept: ${currentDepartmentLabel}`"
            >
              <i class="mdi mdi-domain mr-1 shrink-0"></i>
              <span class="truncate">Dept: {{ currentDepartmentLabel }}</span>
            </span>
            <span
              class="inline-flex max-w-[260px] items-center rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
              :title="`Periode: ${dailyPeriodLabel}`"
            >
              <i class="mdi mdi-calendar-range mr-1 shrink-0"></i>
              <span class="truncate">{{ dailyPeriodLabel }}</span>
            </span>
            <span
              v-if="selectedMonthLabel"
              class="inline-flex max-w-[220px] items-center rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
              :title="`Bulan Grafik: ${selectedMonthLabel}`"
            >
              <i class="mdi mdi-calendar-month-outline mr-1 shrink-0"></i>
              <span class="truncate">Bulan: {{ selectedMonthLabel }}</span>
            </span>
          </div>

          <UiButton
            variant="outline"
            color="secondary"
            size="sm"
            class="flex w-full items-center justify-center gap-2 sm:w-auto cursor-pointer"
            :aria-expanded="showFilters"
            @click="toggleFilters"
          >
            <i class="mdi mdi-filter-variant text-base"></i>
            Filter
            <i
              class="mdi text-base transition-transform"
              :class="showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            ></i>
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Filter Card with Vue Transition -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div v-show="showFilters">
        <UiCard class="sm:p-5">
          <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <UiSelect
              v-model="selectedInstitution"
              :options="institutionOptions"
              item-value="value"
              item-title="label"
              size="sm"
              label="Instansi / Unit Kerja"
              placeholder="Pilih Instansi / Unit"
              @update:modelValue="handleFilterChange"
            />
          </div>
          <div>
            <UiSelect
              v-model="selectedDepartment"
              :options="departmentOptions"
              item-value="value"
              item-title="label"
              size="sm"
              label="Departemen / Divisi"
              placeholder="Pilih Departemen"
              @update:modelValue="handleFilterChange"
            />
          </div>
          <div>
            <UiDatePicker
              v-model="startDate"
              label="Tanggal Mulai"
              placeholder="Pilih tanggal mulai"
              size="sm"
              :clearable="false"
              @update:model-value="handleFilterChange"
            />
          </div>
          <div>
            <UiDatePicker
              v-model="endDate"
              label="Tanggal Selesai"
              placeholder="Pilih tanggal selesai"
              size="sm"
              :clearable="false"
              @update:model-value="handleFilterChange"
            />
          </div>
          <div>
            <UiInput
              v-model="selectedMonth"
              type="month"
              label="Bulan Grafik"
              size="sm"
              @update:model-value="handleFilterChange"
              @change="handleFilterChange"
            />
          </div>
          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              class="h-10 w-10 p-0 flex items-center justify-center"
              :disabled="isLoadingData"
              title="Reset Filter"
              @click="resetFilters"
            >
              <i class="mdi mdi-refresh text-base"></i>
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </Transition>

    <!-- Executive KPI Summary Cards (4 Cards with Cargo MKN FE Split Metric Layout Model & Enhanced Information Capacity) -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Card 1: Presensi Pegawai Summary -->
      <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex h-full flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Summary Presensi Pegawai
                </p>
                <p class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                  {{ dailyPeriodLabel }}
                </p>
              </div>
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/40 dark:text-emerald-400">
                <i class="mdi mdi-account-group-outline text-2xl"></i>
              </div>
            </div>

            <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
              <div class="min-w-0 pr-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.totalPresent }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Hadir</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">+2.4%</span>
                  <span>{{ comparisonLabel }}</span>
                </div>
              </div>

              <div class="min-w-0 pl-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.onTimeCount }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Pegawai</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span class="font-semibold text-slate-600 dark:text-slate-300">Tepat Waktu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Card 2: Keterlambatan & Pulang Cepat (Disiplin Jam Kerja) -->
      <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex h-full flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Terlambat &amp; Pulang Cepat
                </p>
                <p class="text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                  {{ dailyPeriodLabel }}
                </p>
              </div>
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-400">
                <i class="mdi mdi-clock-alert-outline text-2xl"></i>
              </div>
            </div>

            <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
              <div class="min-w-0 pr-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.lateCount }}
                  <span class="text-xs font-bold text-amber-600 dark:text-amber-400">Telat</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span class="font-semibold text-amber-600">{{ metrics.totalLateHours }}j ({{ metrics.totalLateMinutes }}m)</span>
                </div>
              </div>

              <div class="min-w-0 pl-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.earlyLeaveCount }}
                  <span class="text-xs font-bold text-orange-600 dark:text-orange-400">Plg Cepat</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span class="font-semibold text-orange-600">{{ metrics.totalEarlyLeaveHours }}j ({{ metrics.totalEarlyLeaveMinutes }}m)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Card 3: Izin, Cuti & Dinas Luar -->
      <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex h-full flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Izin, Cuti &amp; Dinas Luar
                </p>
                <p class="text-[10px] font-semibold text-blue-600 dark:text-blue-300">
                  {{ dailyPeriodLabel }}
                </p>
              </div>
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/40 dark:text-blue-400">
                <i class="mdi mdi-account-clock-outline text-2xl"></i>
              </div>
            </div>

            <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
              <div class="min-w-0 pr-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.sickCount + metrics.leaveCount + metrics.permitCount }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Izin/Cuti</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Sakit: {{ metrics.sickCount }} | Cuti: {{ metrics.leaveCount }}</span>
                </div>
              </div>

              <div class="min-w-0 pl-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.dutyCount }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Dinas</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-blue-600 dark:text-blue-400">
                  <span class="font-semibold">Penugasan Luar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Card 4: Mangkir & Alpha Alert -->
      <UiCard class="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex h-full flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Mangkir &amp; Alpha
                </p>
                <p class="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  {{ dailyPeriodLabel }}
                </p>
              </div>
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-400">
                <i class="mdi mdi-alert-octagon-outline text-2xl"></i>
              </div>
            </div>

            <div class="mt-3.5 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
              <div class="min-w-0 pr-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.mangkirCount }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Mangkir</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-amber-600 dark:text-amber-400">
                  <span class="font-semibold">Checkout Hilang</span>
                </div>
              </div>

              <div class="min-w-0 pl-3 text-left">
                <h3 class="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white 2xl:text-3xl">
                  {{ metrics.alphaCount }}
                  <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Alpha</span>
                </h3>
                <div class="mt-1 flex items-center gap-x-1 text-[10px] text-rose-600 dark:text-rose-400">
                  <span class="font-bold">Tanpa Keterangan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Main Analytics Charts Section: Chart 1 Full Width 1 Month Trend -->
    <div class="w-full">
      <!-- Chart 1: Tren Kehadiran Pegawai Bulanan (Full Width - 1 Bulan Harian) -->
      <UiCard :padding="true" class="w-full">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Tren Kehadiran Pegawai Harian
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Grafik jumlah Hadir Tepat Waktu, Terlambat, dan Absen/Izin secara harian
            </p>
          </div>

          <div>
            <UiBadge variant="success" class="text-xs font-semibold">
              <i class="mdi mdi-calendar-month-outline mr-1"></i>
              {{ selectedMonthLabel }}
            </UiBadge>
          </div>
        </div>

        <div class="h-[340px] w-full">
          <UiChart
            type="line"
            height="340"
            :series="activeTrendSeries"
            :options="trendChartOptions"
          />
        </div>
      </UiCard>
    </div>

    <!-- Secondary Charts & Department Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chart 3: Capaian Kehadiran per Departemen / Divisi (Bar Chart - 2 Cols) -->
      <UiCard class="lg:col-span-2" :padding="true">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Jumlah Pegawai Hadir per Departemen
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Analisis jumlah pegawai hadir antar unit &amp; departemen bulan {{ selectedMonthLabel }}
            </p>
          </div>
          <UiBadge variant="success" class="text-xs font-semibold">{{ selectedMonthLabel }}</UiBadge>
        </div>

        <div class="h-[280px] w-full">
          <UiChart
            type="bar"
            height="280"
            :series="departmentChartSeries"
            :options="departmentChartOptions"
          />
        </div>
      </UiCard>

      <!-- Chart 2: Distribusi Status Presensi Pegawai Bulanan (Donut Chart - 1 Col) -->
      <UiCard class="flex flex-col justify-between" :padding="true">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Proporsi Status Presensi
            </h2>
            <UiBadge variant="primary" class="text-xs font-semibold">{{ selectedMonthLabel }}</UiBadge>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Komposisi akumulasi status kehadiran pegawai bulan {{ selectedMonthLabel }}
          </p>

          <div class="h-[240px] w-full flex items-center justify-center">
            <UiChart
              type="donut"
              height="240"
              :series="statusDonutSeries"
              :options="statusDonutOptions"
            />
          </div>
        </div>

        <!-- <div class="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div class="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30">
            <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Tepat Waktu</span>
            <strong class="text-emerald-700 dark:text-emerald-400 text-base font-bold">{{ metrics.onTimeCount }} Pegawai</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30">
            <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Terlambat</span>
            <strong class="text-amber-700 dark:text-amber-400 text-base font-bold">{{ metrics.lateCount }} Pegawai</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30">
            <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Izin / Cuti / Sakit</span>
            <strong class="text-blue-700 dark:text-blue-400 text-base font-bold">{{ metrics.totalPermits }} Pegawai</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30">
            <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Mangkir / Alpha</span>
            <strong class="text-rose-700 dark:text-rose-400 text-base font-bold">{{ metrics.totalAbsenceAlert }} Pegawai</strong>
          </div>
        </div> -->
      </UiCard>
    </div>

    <!-- Top 10 Pemantauan Keterlambatan Pegawai (Ranking Terlambat) -->
    <UiCard :padding="true" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Top 10 Pemantauan Keterlambatan Pegawai
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Daftar pegawai dengan akumulasi durasi &amp; frekuensi keterlambatan tertinggi
          </p>
        </div>

        <div>
          <UiBadge variant="warning" class="text-xs font-semibold">
            <UiIcon name="mdi-clock-alert-outline" size="14" class="mr-1" />
            {{ selectedMonthLabel }}
          </UiBadge>
        </div>
      </div>

      <!-- List Top 10 Table View -->
      <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
              <th class="py-3 px-4 w-12 text-center">Rank</th>
              <th class="py-3 px-4">Nama Pegawai &amp; NIP</th>
              <th class="py-3 px-4">Departemen &amp; Jabatan</th>
              <th class="py-3 px-4">Durasi Terlambat</th>
              <th class="py-3 px-4">Total</th>
              <th class="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr v-if="filteredLateEmployees.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                Tidak ada data keterlambatan pegawai pada periode ini
              </td>
            </tr>
            <tr
              v-else
              v-for="(person, index) in filteredLateEmployees"
              :key="person.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
            >
              <td class="py-3 px-4 text-center font-extrabold">
                <span
                  class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                  :class="
                    index === 0
                      ? 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/80 dark:text-rose-300'
                      : index === 1
                      ? 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/80 dark:text-amber-300'
                      : index === 2
                      ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-950/80 dark:text-blue-300'
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
                      NIP. {{ person.nip }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                <div>{{ person.department }}</div>
                <div class="text-[10px] text-slate-400">{{ person.position }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import reportService from "~/services/report.service";
import institutionService from "~/services/institution.service";
import departmentService from "~/services/department.service";
import dashboardService from "~/services/dashboard.service";

const swal = useSwal();
const { exportToExcel, isExporting } = useExcelExport();

const reportSvc = reportService();
const institutionSvc = institutionService();
const deptSvc = departmentService();
const dashboardSvc = dashboardService();

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const today = getLocalDate();

// State Filters
const showFilters = ref(false);
const selectedInstitution = ref("all");
const selectedDepartment = ref("all");
const startDate = ref<string>(today);
const endDate = ref<string>(today);
const selectedMonth = ref<string>(today.slice(0, 7));
const activeTrendTab = ref("Jumlah Kehadiran (Orang)");
const activeLateFilter = ref("all");
const searchDepartmentQuery = ref("");
const isLoadingData = ref(false);

// Filter Options (Loaded strictly from API)
const institutionOptions = ref([
  { value: "all", label: "Semua Instansi / Unit" },
]);

const departmentOptions = ref([
  { value: "all", label: "Semua Departemen" },
]);

const currentInstitutionLabel = computed(() => {
  const opt = institutionOptions.value.find((i: any) => i.value === selectedInstitution.value);
  return opt ? opt.label : "Semua Instansi";
});

const currentDepartmentLabel = computed(() => {
  const opt = departmentOptions.value.find((d: any) => d.value === selectedDepartment.value);
  return opt ? opt.label : "Semua Departemen";
});

const selectedMonthLabel = computed(() => {
  if (!selectedMonth.value) return "";
  const [yearStr, monthStr] = selectedMonth.value.split("-");
  const year = Number(yearStr) || 2026;
  const month = Number(monthStr) || 9;
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${months[month - 1] || "Bulan"} ${year}`;
});

const monthCategories = computed(() => {
  if (!selectedMonth.value) return [];
  const [yearStr, monthStr] = selectedMonth.value.split("-");
  const year = Number(yearStr) || 2026;
  const month = Number(monthStr) || 9;
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const cats: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    cats.push(String(d));
  }
  return cats;
});

// Realtime / API Monthly Trend Arrays
const apiDailyOnTime = ref<number[]>([]);
const apiDailyLate = ref<number[]>([]);
const apiDailyAbsent = ref<number[]>([]);
const apiDailyLateMinutes = ref<number[]>([]);

const monthlyTrendSeriesCounts = computed(() => {
  if (apiDailyOnTime.value.length > 0) {
    return [
      { name: "Hadir Tepat Waktu (Orang)", data: apiDailyOnTime.value },
      { name: "Keterlambatan (Orang)", data: apiDailyLate.value },
      { name: "Izin & Alpha (Orang)", data: apiDailyAbsent.value },
    ];
  }
  const count = monthCategories.value.length || 30;
  return [
    { name: "Hadir Tepat Waktu (Orang)", data: new Array(count).fill(0) },
    { name: "Keterlambatan (Orang)", data: new Array(count).fill(0) },
    { name: "Izin & Alpha (Orang)", data: new Array(count).fill(0) },
  ];
});

const monthlyTrendSeriesMinutes = computed(() => {
  if (apiDailyLateMinutes.value.length > 0) {
    return [
      { name: "Akumulasi Menit Terlambat", data: apiDailyLateMinutes.value },
    ];
  }
  const count = monthCategories.value.length || 30;
  return [
    { name: "Akumulasi Menit Terlambat", data: new Array(count).fill(0) },
  ];
});

const activeTrendSeries = computed(() => {
  return activeTrendTab.value === "Jumlah Kehadiran (Orang)"
    ? monthlyTrendSeriesCounts.value
    : monthlyTrendSeriesMinutes.value;
});

const trendChartOptions = computed(() => ({
  chart: {
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  colors: activeTrendTab.value === "Jumlah Kehadiran (Orang)" ? ["#10b981", "#f59e0b", "#f43f5e"] : ["#f59e0b"],
  stroke: { curve: "smooth", width: 3 },
  markers: {
    size: 3,
    strokeWidth: 2,
    hover: { size: 6 },
  },
  xaxis: {
    categories: monthCategories.value,
    labels: {
      style: { colors: "#64748b", fontSize: "11px" },
    },
    tickAmount: monthCategories.value.length,
  },
  yaxis: {
    labels: {
      formatter: (val: number) => activeTrendTab.value === "Jumlah Kehadiran (Orang)" ? val + " org" : val + " mnt",
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
    x: {
      formatter: (val: number) => `Tgl ${val} ${selectedMonthLabel.value}`,
    },
    y: {
      formatter: (val: number) => activeTrendTab.value === "Jumlah Kehadiran (Orang)" ? val + " Orang" : val + " Menit",
    },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 4,
  },
}));

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    return `${String(day).padStart(2, "0")} ${months[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

const dailyPeriodLabel = computed(() => {
  const start = startDate.value;
  const end = endDate.value;
  if (!start || !end) return "-";
  if (start === end) return formatDateLabel(start);
  return `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
});

const comparisonLabel = computed(() => {
  return startDate.value === endDate.value ? "vs kemarin" : "vs periode sebelumnya";
});

// Live Clock & Date
const currentTime = ref("");
const currentDate = ref("");
let clockInterval: any = null;

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

// Key Executive KPI Metrics Data
const metrics = ref({
  totalEmployees: 0,
  totalPresent: 0,
  attendancePercentage: 0,
  onTimeCount: 0,
  lateCount: 0,
  pendingCheckinCount: 0,
  totalLateMinutes: 0,
  totalLateHours: 0,
  totalEarlyLeaveMinutes: 0,
  totalEarlyLeaveHours: 0,
  earlyLeaveCount: 0,
  avgLateMins: 0,
  severeLateCount: 0,
  totalPermits: 0,
  sickCount: 0,
  leaveCount: 0,
  permitCount: 0,
  dutyCount: 0,
  totalAbsenceAlert: 0,
  mangkirCount: 0,
  alphaCount: 0,
});

// Load Options from API
async function loadFilterOptions() {
  try {
    const instRes: any = await institutionSvc.retrieveAll();
    const instList = instRes?.data?.data || instRes?.data || instRes || [];
    if (Array.isArray(instList)) {
      institutionOptions.value = [
        { value: "all", label: "Semua Instansi / Unit" },
        ...instList.map((i: any) => ({ value: String(i.id), label: i.name || i.title })),
      ];
    }

    const deptRes: any = await deptSvc.retrieveAll({ ignorePaging: true });
    const deptList = deptRes?.data?.data || deptRes?.data || deptRes || [];
    if (Array.isArray(deptList)) {
      departmentOptions.value = [
        { value: "all", label: "Semua Departemen" },
        ...deptList.map((d: any) => ({ value: String(d.id), label: d.name || d.title })),
      ];
    }
  } catch (err) {
    console.warn("[AdminDashboard] Gagal memuat opsi filter instansi/departemen:", err);
  }
}

// Fetch Executive Summary Data from Backend Dashboard Service
async function loadExecutiveSummary() {
  isLoadingData.value = true;
  try {
    const res: any = await dashboardSvc.retrieveExecutiveSummary({
      institutionId: selectedInstitution.value !== "all" ? selectedInstitution.value : undefined,
      departmentId: selectedDepartment.value !== "all" ? selectedDepartment.value : undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      month: selectedMonth.value || undefined,
    });

    if (res && res.status && res.data) {
      const { summary, monthlyTrend, departmentSummary, topLateEmployees } = res.data;

      if (summary) {
        metrics.value = {
          totalEmployees: summary.totalEmployees ?? 0,
          totalPresent: summary.totalPresent ?? 0,
          attendancePercentage: summary.attendancePercentage ?? 0,
          onTimeCount: summary.onTimeCount ?? 0,
          lateCount: summary.lateCount ?? 0,
          pendingCheckinCount: summary.pendingCheckinCount ?? 0,
          totalLateMinutes: summary.totalLateMinutes ?? 0,
          totalLateHours: summary.totalLateHours ?? 0,
          totalEarlyLeaveMinutes: summary.totalEarlyLeaveMinutes ?? 0,
          totalEarlyLeaveHours: summary.totalEarlyLeaveHours ?? 0,
          earlyLeaveCount: summary.earlyLeaveCount ?? 0,
          avgLateMins: summary.avgLateMins ?? 0,
          severeLateCount: summary.severeLateCount ?? 0,
          totalPermits: summary.totalPermits ?? 0,
          sickCount: summary.sickCount ?? 0,
          leaveCount: summary.leaveCount ?? 0,
          permitCount: summary.permitCount ?? 0,
          dutyCount: summary.dutyCount ?? 0,
          totalAbsenceAlert: summary.totalAbsenceAlert ?? 0,
          mangkirCount: summary.mangkirCount ?? 0,
          alphaCount: summary.alphaCount ?? 0,
        };
      }

      if (monthlyTrend) {
        apiDailyOnTime.value = monthlyTrend.dailyOnTime || [];
        apiDailyLate.value = monthlyTrend.dailyLate || [];
        apiDailyAbsent.value = monthlyTrend.dailyAbsent || [];
        apiDailyLateMinutes.value = monthlyTrend.dailyLateMinutes || [];
      }

      if (Array.isArray(departmentSummary) && departmentSummary.length > 0) {
        departmentChartSeries.value = [{
          name: "Jumlah Pegawai Hadir",
          data: departmentSummary.map((d: any) => d.presentCount),
        }];
        departmentChartOptions.value = {
          ...departmentChartOptions.value,
          xaxis: {
            ...departmentChartOptions.value.xaxis,
            categories: departmentSummary.map((d: any) => d.name),
          },
        };
      }

      if (Array.isArray(topLateEmployees) && topLateEmployees.length > 0) {
        lateEmployeeList.value = topLateEmployees;
      }
    }
  } catch (err) {
    console.warn("[AdminDashboard] Menggunakan data fallback executive summary:", err);
  } finally {
    isLoadingData.value = false;
  }
}



// Chart 2: Donut Chart Status Presensi
const statusDonutSeries = computed(() => [
  metrics.value.onTimeCount,
  metrics.value.lateCount,
  metrics.value.sickCount + metrics.value.leaveCount + metrics.value.permitCount,
  metrics.value.dutyCount,
  metrics.value.mangkirCount,
  metrics.value.alphaCount,
]);

const statusDonutOptions = ref({
  chart: { fontFamily: "Inter, sans-serif" },
  labels: ["Tepat Waktu", "Terlambat", "Izin & Cuti", "Dinas Luar", "Mangkir", "Alpha"],
  colors: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#d97706", "#f43f5e"],
  legend: {
    position: "bottom",
    fontSize: "11px",
    labels: { colors: "#64748b" },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number, opts: any) => {
      const rawCount = opts.w.globals.series[opts.seriesIndex];
      return rawCount + " Org";
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => val + " Pegawai",
    },
  },
  stroke: { width: 0 },
});

// Chart 3: Capaian Kehadiran per Departemen
const departmentChartSeries = ref<any[]>([]);

const departmentChartOptions = ref({
  chart: {
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
  },
  colors: ["#3b82f6"],
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: "42%",
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val + " org",
    style: { fontSize: "11px", colors: ["#fff"] },
  },
  xaxis: {
    categories: [],
    labels: { style: { colors: "#64748b", fontSize: "11px" } },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => val + " org",
      style: { colors: "#64748b", fontSize: "11px" },
    },
  },
  grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
});

// Chart 4: Sebaran Jam Masuk Check-In
const arrivalTimeSeries = ref<any[]>([]);

const arrivalTimeOptions = ref({
  chart: { fontFamily: "Inter, sans-serif", toolbar: { show: false } },
  plotOptions: {
    bar: { borderRadius: 6, columnWidth: "50%", distributed: true },
  },
  colors: ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e"],
  dataLabels: { enabled: true, style: { fontSize: "11px" } },
  xaxis: {
    categories: ["< 07:00", "07:00 - 07:30", "07:31 - 08:00", "> 08:00"],
    labels: { style: { colors: "#64748b", fontSize: "10px" } },
  },
  legend: { show: false },
  grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
});

// Top 10 Terlambat Data & Filtering (Loaded from API)
const lateEmployeeList = ref<any[]>([]);

const filteredLateEmployees = computed(() => {
  if (activeLateFilter.value === "severe") {
    return lateEmployeeList.value.filter(e => e.monthlyCount >= 3);
  }
  return lateEmployeeList.value;
});

// Rekapitulasi Departemen Table Data (Loaded from API)
const departmentSummaryList = ref<any[]>([]);

const filteredDepartmentTableData = computed(() => {
  const q = searchDepartmentQuery.value.toLowerCase().trim();
  if (!q) return departmentSummaryList.value;
  return departmentSummaryList.value.filter(
    d => d.name.toLowerCase().includes(q) || (d.head && d.head.toLowerCase().includes(q))
  );
});

// Audit Activity Feed Realtime
const auditLogs = ref<any[]>([]);

// Modal State
const showDetailModal = ref(false);
const detailModalTitle = ref("Detail Presensi Pegawai");
const selectedModalItem = ref<any>(null);

function openPersonDetail(person: any) {
  detailModalTitle.value = `Detail Presensi - ${person.name}`;
  selectedModalItem.value = person;
  showDetailModal.value = true;
}

function openDepartmentDetail(dept: any) {
  detailModalTitle.value = `Detail Presensi Departemen - ${dept.name}`;
  selectedModalItem.value = dept;
  showDetailModal.value = true;
}

function openAuditModal() {
  swal.toast("Seluruh Log Presensi Realtime ditampilkan", "info");
}

// Fetch Dedicated Top 10 Late Employees Monitoring Data
async function loadTopLateEmployees() {
  try {
    const res: any = await dashboardSvc.retrieveTopLateEmployees({
      institutionId: selectedInstitution.value !== "all" ? selectedInstitution.value : undefined,
      departmentId: selectedDepartment.value !== "all" ? selectedDepartment.value : undefined,
      month: selectedMonth.value || undefined,
    });

    const list = res?.data?.data || res?.data || res;
    if (Array.isArray(list) && list.length > 0) {
      lateEmployeeList.value = list;
    }
  } catch (err) {
    console.warn("[AdminDashboard] Menggunakan fallback data top late employees:", err);
  }
}

function handleFilterChange() {
  loadExecutiveSummary();
  loadTopLateEmployees();
}

function resetFilters() {
  selectedInstitution.value = "all";
  selectedDepartment.value = "all";
  startDate.value = today;
  endDate.value = today;
  selectedMonth.value = today.slice(0, 7);
  searchDepartmentQuery.value = "";
  loadExecutiveSummary();
  loadTopLateEmployees();
  swal.toast("Filter berhasil di-reset", "info");
}

function refreshData() {
  updateClock();
  loadExecutiveSummary();
  loadTopLateEmployees();
  swal.toast("Data dashboard presensi pegawai berhasil diperbarui", "success");
}

async function exportExecutiveReport() {
  try {
    const exportData = departmentSummaryList.value.map(d => ({
      departemen: d.name,
      kepala: d.head,
      totalPegawai: d.total,
      hadir: d.present,
      terlambat: d.late,
      izinCuti: d.permit,
      alpha: d.alpha,
      persentase: `${d.percentage}%`,
    }));

    await exportToExcel({
      data: exportData,
      filename: `Rekap_Presensi_Pegawai_${startDate.value}_${endDate.value}`,
      sheetName: "Presensi Pegawai",
      headerOptions: {
        title: "LAPORAN EXECUTIVE PRESENSI PEGAWAI (PHASE 1)",
        subtitle: `INSTANSI: ${currentInstitutionLabel.value.toUpperCase()} - PERIODE: ${dailyPeriodLabel.value}`,
      },
      columns: [
        { header: "DEPARTEMEN", key: "departemen", width: 25 },
        { header: "KEPALA DEPARTEMEN", key: "kepala", width: 25 },
        { header: "TOTAL PEGAWAI", key: "totalPegawai", width: 15 },
        { header: "HADIR", key: "hadir", width: 10 },
        { header: "TERLAMBAT", key: "terlambat", width: 12 },
        { header: "IZIN / CUTI", key: "izinCuti", width: 12 },
        { header: "ALPHA", key: "alpha", width: 10 },
        { header: "PERSENTASE (%)", key: "persentase", width: 15 },
      ],
    });
    swal.toast("Rekapitulasi Presensi Pegawai diexport ke Excel", "success");
  } catch (err) {
    console.error("Gagal export laporan:", err);
    swal.toast("Gagal mengeksport data ke Excel", "error");
  }
}

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  loadFilterOptions();
  loadExecutiveSummary();
  loadTopLateEmployees();
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>


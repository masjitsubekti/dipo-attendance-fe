<template>
  <div class="w-full space-y-6 animate-fade-in print:p-0 print:space-y-0">
    <!-- Breadcrumb (Hide when printing) -->
    <div class="print:hidden">
      <LayoutBreadcrumb :items="breadcrumbs" />
    </div>

    <!-- Filter Card (Hide when printing) -->
    <div class="bg-white dark:bg-slate-800 rounded-sm card print:hidden">
      <!-- Header Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-1 bg-primary-500 rounded-t-sm">
        <h2 class="text-lg font-semibold text-white">Laporan Rekap Presensi</h2>
        <div class="flex items-center gap-1">
          <UiIconButton
            icon="mdi-refresh"
            tooltip="Muat Ulang"
            color="white"
            variant="ghost"
            size="lg"
            @click="handleResetFilter"
          />
        </div>
      </div>

      <!-- Filter Controls Body -->
      <div class="p-6">
        <UiRow :gap="4" :mb="4">
          <!-- Institution Select -->
          <UiCol cols="12" md="6" lg="3">
            <UiAutocomplete
              v-model="filter.institutionId"
              label="Institusi / Sekolah"
              :options="institutionOptions"
              placeholder="Pilih Institusi"
              clearable
              @update:modelValue="onInstitutionChange"
            />
          </UiCol>

          <!-- Person Select -->
          <UiCol cols="12" md="6" lg="3">
            <UiAutocomplete
              v-model="filter.personId"
              label="Pegawai / Karyawan"
              required
              :options="personOptions"
              placeholder="Pilih Pegawai"
              :disabled="isLoadingPerson"
            />
          </UiCol>

          <!-- Month Select -->
          <UiCol cols="12" md="6" lg="3">
            <UiSelect
              v-model="filter.month"
              label="Bulan"
              :options="monthOptions"
              placeholder="Pilih Bulan"
            />
          </UiCol>

          <!-- Year Select -->
          <UiCol cols="12" md="6" lg="3">
            <UiSelect
              v-model="filter.year"
              label="Tahun"
              :options="yearOptions"
              placeholder="Pilih Tahun"
            />
          </UiCol>
        </UiRow>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <UiButton
            color="primary"
            :loading="isLoading"
            :disabled="!filter.personId"
            @click="fetchReport"
          >
            <UiIcon name="mdi-magnify" class="mr-1.5" />
            Tampilkan Report
          </UiButton>

          <UiButton
            v-if="reportData"
            color="error"
            @click="handlePrint"
          >
            <UiIcon name="mdi-printer" class="mr-1.5" />
            Cetak / PDF
          </UiButton>

          <UiButton
            v-if="reportData"
            color="success"
            :loading="isExporting"
            @click="handleExportExcel"
          >
            <UiIcon name="mdi-file-excel" class="mr-1.5" />
            Export Excel
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Empty State Prompt -->
    <!-- <UiCard v-if="!reportData && !isLoading" class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-primary-50 dark:bg-slate-700/60 flex items-center justify-center mx-auto mb-4 text-primary-500 dark:text-primary-400">
        <UiIcon name="mdi-file-document" size="xl" />
      </div>
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
        Rekap Presensi Pegawai
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        Silakan pilih Institusi, Pegawai, Bulan, dan Tahun pada form filter di atas untuk menampilkan laporan rekapitulasi kehadiran.
      </p>
    </UiCard> -->

    <!-- Loading Spinner State -->
    <UiCard v-if="isLoading" class="print:hidden text-center py-16" variant="outlined">
      <UiSpinner class="w-10 h-10 mx-auto text-primary-600 mb-3" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
        Memuat data rekap presensi...
      </p>
    </UiCard>

    <!-- Report Document Printable Container -->
    <UiCard
      v-if="reportData && !isLoading"
      id="report-print-container"
      variant="elevated"
      class="bg-white text-gray-900 print:shadow-none print:p-0 print:border-none print:m-0 print:w-full"
    >
      <!-- Report Header -->
      <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <h1 class="text-base md:text-lg font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          {{ reportData.employee.institution }}
        </h1>
        <h2 class="text-sm md:text-base font-semibold uppercase mt-0.5 text-slate-700 dark:text-slate-300">
          {{ reportData.company.title }}
        </h2>
        <h3 class="text-xs md:text-sm font-medium uppercase mt-0.5 text-slate-500 dark:text-slate-400">
          {{ reportData.company.periodText }}
        </h3>
      </div>

      <!-- Employee Info Grid -->
      <UiRow :gap="3" :mb="3" class="text-xs">
        <UiCol cols="12" md="6">
          <div class="space-y-1">
            <div class="flex">
              <span class="w-24 font-semibold text-slate-600 dark:text-slate-400">Nama</span>
              <span class="w-3 text-slate-400">:</span>
              <span class="flex-1 font-bold text-slate-800 dark:text-slate-200 uppercase">{{ reportData.employee.name }}</span>
            </div>
            <div class="flex">
              <span class="w-24 font-semibold text-slate-600 dark:text-slate-400">NIP</span>
              <span class="w-3 text-slate-400">:</span>
              <span class="flex-1 font-medium text-slate-800 dark:text-slate-200">{{ reportData.employee.nip }}</span>
            </div>
          </div>
        </UiCol>
        <UiCol cols="12" md="6">
          <div class="space-y-1">
            <div class="flex">
              <span class="w-24 font-semibold text-slate-600 dark:text-slate-400">Departement</span>
              <span class="w-3 text-slate-400">:</span>
              <span class="flex-1 font-bold text-slate-800 dark:text-slate-200 uppercase">{{ reportData.employee.department }}</span>
            </div>
            <div class="flex">
              <span class="w-24 font-semibold text-slate-600 dark:text-slate-400">Jabatan</span>
              <span class="w-3 text-slate-400">:</span>
              <span class="flex-1 font-bold text-slate-800 dark:text-slate-200 uppercase">{{ reportData.employee.position }}</span>
            </div>
          </div>
        </UiCol>
      </UiRow>

      <!-- Daily Attendance Table Grid -->
      <div class="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <table class="w-full table-fixed border-collapse text-xs text-center">
          <colgroup>
            <col class="w-24" />
            <col class="w-20" />
            <col class="w-16" />
            <col class="w-12" />
            <col class="w-12" />
            <col class="w-16" />
            <col class="w-12" />
            <col class="w-12" />
            <col class="w-16" />
            <col class="w-16" />
            <col class="w-24" />
            <col class="w-48" />
          </colgroup>
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <th rowspan="3" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2.5 align-middle">TANGGAL</th>
              <th rowspan="3" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2.5 align-middle">HARI</th>
              <th colspan="6" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 align-middle">REGULAR</th>
              <th colspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 align-middle">NON REGULAR</th>
              <th rowspan="3" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2.5 align-middle">KETERANGAN</th>
              <th rowspan="3" class="border-b border-slate-200 dark:border-slate-700 px-2 py-2.5 align-middle">KETERANGAN REGULAR / NON</th>
            </tr>
            <tr class="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <th rowspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 w-16 align-middle">MASUK</th>
              <th colspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 align-middle">TELAT MASUK</th>
              <th rowspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 w-16 align-middle">PULANG</th>
              <th colspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 align-middle">PULANG CEPAT</th>
              <th rowspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 w-16 align-middle">MASUK</th>
              <th rowspan="2" class="border-r border-b border-slate-200 dark:border-slate-700 px-2 py-2 w-16 align-middle">PULANG</th>
            </tr>
            <tr class="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <th class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 w-10 align-middle">JAM</th>
              <th class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 w-10 align-middle">MENIT</th>
              <th class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 w-10 align-middle">JAM</th>
              <th class="border-r border-b border-slate-200 dark:border-slate-700 px-1 py-1.5 w-10 align-middle">MENIT</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="row in reportData.days"
              :key="row.dateKey"
              class="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200"
            >
              <td class="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 font-mono font-medium">{{ row.date }}</td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 font-semibold uppercase">{{ row.dayName }}</td>
              
              <!-- Regular Masuk -->
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 font-mono">{{ row.regularMasuk }}</td>
              <!-- Telat Jam & Menit -->
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono w-10">{{ row.telatJam }}</td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono w-10">{{ row.telatMenit }}</td>
              <!-- Regular Pulang -->
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 font-mono">{{ row.regularPulang }}</td>
              <!-- Pulang Cepat Jam & Menit -->
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono w-10">{{ row.pulangCepatJam }}</td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono w-10">{{ row.pulangCepatMenit }}</td>

              <!-- Non Regular Masuk & Pulang -->
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 font-mono">{{ row.nonRegularMasuk }}</td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 font-mono">{{ row.nonRegularPulang }}</td>

              <!-- Keterangan (Color background applied exclusively to this column) -->
              <td
                class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 font-extrabold align-middle"
                :style="getKeteranganStyle(row)"
              >
                {{ row.keterangan }}
              </td>
              <!-- Keterangan Detail -->
              <td class="px-2 py-2.5 text-left font-medium uppercase truncate" :title="row.keteranganDetail">{{ row.keteranganDetail }}</td>
            </tr>
          </tbody>

          <!-- Summary Total Footer Row -->
          <tfoot>
            <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
              <td colspan="2" class="border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-left font-extrabold">TOTAL</td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5"></td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono font-bold">
                {{ reportData.summary.totalLateHours > 0 ? reportData.summary.totalLateHours : '-' }}
              </td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono font-bold">
                {{ reportData.summary.totalLateRemainingMinutes > 0 ? reportData.summary.totalLateRemainingMinutes : '-' }}
              </td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-2 py-2.5"></td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono font-bold">
                {{ reportData.summary.totalEarlyLeaveHours > 0 ? reportData.summary.totalEarlyLeaveHours : '-' }}
              </td>
              <td class="border-r border-slate-200 dark:border-slate-700 px-1 py-2.5 font-mono font-bold">
                {{ reportData.summary.totalEarlyLeaveRemainingMinutes > 0 ? reportData.summary.totalEarlyLeaveRemainingMinutes : '-' }}
              </td>
              <td colspan="4" class="px-3 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Legend / Keterangan Section -->
      <div class="mt-6 pt-4 text-xs text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700">
        <h4 class="font-bold text-sm mb-3">Keterangan</h4>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-2 font-medium text-xs">
          <!-- Column 1: Color Boxes 1-4 -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #800080;"></span>
              <span>: LIBUR</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #00b050;"></span>
              <span>: IJIN/CUTI</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #92d050;"></span>
              <span>: SAKIT</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #0070c0;"></span>
              <span>: DINAS LUAR</span>
            </div>
          </div>

          <!-- Column 2: Color Boxes 5-9 -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #ffc000;"></span>
              <span>: PERINGATAN</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #ff0000;"></span>
              <span>: TERLAMBAT</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #a6a6a6;"></span>
              <span>: PULANG CEPAT</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #ff66cc;"></span>
              <span>: MANGKIR</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 h-5 inline-block" style="background-color: #ed7d31;"></span>
              <span>: ALPHA</span>
            </div>
          </div>

          <!-- Column 3: Abbreviations H, A, WFH, M -->
          <div class="space-y-1.5">
            <div class="flex"><span class="w-12 font-bold">H</span><span>: HADIR</span></div>
            <div class="flex"><span class="w-12 font-bold">A</span><span>: ALPHA</span></div>
            <div class="flex"><span class="w-12 font-bold">WFH</span><span>: Work From Home</span></div>
            <div class="flex"><span class="w-12 font-bold">M</span><span>: MANGKIR</span></div>
          </div>

          <!-- Column 4: Abbreviations DLK, DDS, DDK, LBN -->
          <div class="space-y-1.5">
            <div class="flex"><span class="w-12 font-bold">DLK</span><span>: DINAS LUAR KOTA</span></div>
            <div class="flex"><span class="w-12 font-bold">DDS</span><span>: DINAS DALAM SURABAYA</span></div>
            <div class="flex"><span class="w-12 font-bold">DDK</span><span>: DINAS AGLOMERASI</span></div>
            <div class="flex"><span class="w-12 font-bold">LBN</span><span>: LIBNAS</span></div>
          </div>

          <!-- Column 5: Abbreviations CBR, CTH, SK -->
          <div class="space-y-1.5">
            <div class="flex"><span class="w-12 font-bold">CBR</span><span>: CUTI BERSALIN</span></div>
            <div class="flex"><span class="w-12 font-bold">CTH</span><span>: CUTI TAHUNAN</span></div>
            <div class="flex"><span class="w-12 font-bold">SK</span><span>: SAKIT</span></div>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import reportService from "@/services/report.service";
import institutionService from "@/services/institution.service";
import personService from "@/services/person.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "ATTENDANCE.VIEW",
});

const pageTitle = "Rekap Presensi Pegawai";
useHead({
  title: pageTitle,
});

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Report", to: "#" },
  { label: pageTitle, active: true },
];

const swal = useSwal();
const reportSvc = reportService();
const institutionSvc = institutionService();
const personSvc = personService();
const { exportToExcel, isExporting } = useExcelExport();

const isLoading = ref(false);
const isLoadingPerson = ref(false);
const reportData = ref<any>(null);

const institutionOptions = ref<any[]>([]);
const personOptions = ref<any[]>([]);

const currentDate = new Date();
const filter = reactive({
  institutionId: undefined as number | string | undefined,
  personId: undefined as number | string | undefined,
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
});

const monthOptions = [
  { label: "Januari", value: 1 },
  { label: "Februari", value: 2 },
  { label: "Maret", value: 3 },
  { label: "April", value: 4 },
  { label: "Mei", value: 5 },
  { label: "Juni", value: 6 },
  { label: "Juli", value: 7 },
  { label: "Agustus", value: 8 },
  { label: "September", value: 9 },
  { label: "Oktober", value: 10 },
  { label: "November", value: 11 },
  { label: "Desember", value: 12 },
];

const yearOptions = computed(() => {
  const currentY = new Date().getFullYear();
  const years = [];
  for (let y = currentY - 5; y <= currentY + 1; y++) {
    years.push({ label: String(y), value: y });
  }
  return years;
});

onMounted(() => {
  loadInstitutions();
  loadPersons();
});

function handleResetFilter() {
  filter.institutionId = undefined;
  filter.personId = undefined;
  filter.month = new Date().getMonth() + 1;
  filter.year = new Date().getFullYear();
  loadPersons();
  reportData.value = null;
}

async function loadInstitutions() {
  try {
    const res: any = await institutionSvc.retrieveAll();
    const items = res.data || [];
    institutionOptions.value = items.map((item: any) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (err) {
    console.error("Failed to load institutions", err);
  }
}

async function loadPersons(institutionId?: any) {
  isLoadingPerson.value = true;
  try {
    const res: any = await personSvc.retrieveAll({
      institutionId: institutionId || undefined,
      ignorePaging: true,
    });
    const items = res.data || [];
    personOptions.value = items.map((item: any) => ({
      label: `${item.nip ? item.nip + ' - ' : ''}${item.name}`,
      value: item.id,
    }));
  } catch (err) {
    console.error("Failed to load persons", err);
  } finally {
    isLoadingPerson.value = false;
  }
}

function onInstitutionChange(val: any) {
  filter.personId = undefined;
  loadPersons(val);
}

async function fetchReport() {
  if (!filter.personId) {
    swal.toast("Silakan pilih pegawai terlebih dahulu", "warning");
    return;
  }

  isLoading.value = true;
  reportData.value = null;

  try {
    const res: any = await reportSvc.getEmployeeRecap({
      personId: filter.personId,
      month: filter.month,
      year: filter.year,
      institutionId: filter.institutionId,
    });

    if (res.status && res.data) {
      reportData.value = res.data;
    } else {
      swal.toast(res.message || "Gagal memuat rekap presensi", "error");
    }
  } catch (err: any) {
    console.error("Failed to fetch report", err);
    swal.toast(err.response?._data?.message || err.message || "Gagal memuat rekap presensi", "error");
  } finally {
    isLoading.value = false;
  }
}

function getKeteranganStyle(row: any) {
  const styleMap: Record<string, { bg: string; text: string }> = {
    libur: { bg: '#800080', text: '#ffffff' },        // Purple
    izin: { bg: '#00b050', text: '#ffffff' },         // Green
    sakit: { bg: '#92d050', text: '#000000' },        // Light Green
    dinas: { bg: '#0070c0', text: '#ffffff' },        // Blue
    peringatan: { bg: '#ffc000', text: '#000000' },   // Yellow
    terlambat: { bg: '#ff0000', text: '#ffffff' },    // Red
    pulang_cepat: { bg: '#a6a6a6', text: '#ffffff' }, // Grey
    mangkir: { bg: '#ff66cc', text: '#000000' },      // Pink
    alpha: { bg: '#ed7d31', text: '#ffffff' },        // Orange
  };

  const style = styleMap[row.categoryClass];
  if (!style) return {};

  return {
    backgroundColor: style.bg,
    color: style.text,
  };
}

function handlePrint() {
  window.print();
}

async function handleExportExcel() {
  if (!reportData.value) return;

  const monthObj = monthOptions.find((m) => m.value === Number(filter.month));
  const monthName = monthObj ? monthObj.label : "";
  const periodStr = `${monthName}_${filter.year}`;
  const empName = (reportData.value.employee.name || "Pegawai").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Rekap_Presensi_${empName}_${periodStr}`;

  const exportData = reportData.value.days.map((d: any) => ({
    tanggal: d.date,
    hari: d.dayName,
    regularMasuk: d.regularMasuk,
    telatJam: d.telatJam,
    telatMenit: d.telatMenit,
    regularPulang: d.regularPulang,
    pulangCepatJam: d.pulangCepatJam,
    pulangCepatMenit: d.pulangCepatMenit,
    nonRegularMasuk: d.nonRegularMasuk,
    nonRegularPulang: d.nonRegularPulang,
    keterangan: d.keterangan,
    keteranganDetail: d.keteranganDetail,
  }));

  await exportToExcel({
    data: exportData,
    filename: fileName,
    sheetName: "Rekap Presensi",
    headerOptions: {
      title: reportData.value.company.name,
      subtitle: `LAPORAN PER PERIODE KEHADIRAN PEGAWAI - ${periodStr.replace('_', ' ')}`,
    },
    mergeHeaders: [
      { cellFrom: "A1", cellTo: "A3", value: "NO" },
      { cellFrom: "B1", cellTo: "B3", value: "TANGGAL" },
      { cellFrom: "C1", cellTo: "C3", value: "HARI" },
      { cellFrom: "D1", cellTo: "I1", value: "REGULAR" },
      { cellFrom: "D2", cellTo: "D3", value: "MASUK" },
      { cellFrom: "E2", cellTo: "F2", value: "TELAT MASUK" },
      { cellFrom: "E3", cellTo: "E3", value: "JAM" },
      { cellFrom: "F3", cellTo: "F3", value: "MENIT" },
      { cellFrom: "G2", cellTo: "G3", value: "PULANG" },
      { cellFrom: "H2", cellTo: "I2", value: "PULANG CEPAT" },
      { cellFrom: "H3", cellTo: "H3", value: "JAM" },
      { cellFrom: "I3", cellTo: "I3", value: "MENIT" },
      { cellFrom: "J1", cellTo: "K1", value: "NON REGULAR" },
      { cellFrom: "J2", cellTo: "J3", value: "MASUK" },
      { cellFrom: "K2", cellTo: "K3", value: "PULANG" },
      { cellFrom: "L1", cellTo: "L3", value: "KETERANGAN" },
      { cellFrom: "M1", cellTo: "M3", value: "KETERANGAN REGULAR / NON" },
    ],
    columns: [
      { header: "TANGGAL", key: "tanggal", width: 14 },
      { header: "HARI", key: "hari", width: 14 },
      { header: "MASUK", key: "regularMasuk", width: 14 },
      { header: "JAM", key: "telatJam", width: 10 },
      { header: "MENIT", key: "telatMenit", width: 10 },
      { header: "PULANG", key: "regularPulang", width: 14 },
      { header: "JAM", key: "pulangCepatJam", width: 10 },
      { header: "MENIT", key: "pulangCepatMenit", width: 10 },
      { header: "MASUK", key: "nonRegularMasuk", width: 14 },
      { header: "PULANG", key: "nonRegularPulang", width: 14 },
      { header: "KETERANGAN", key: "keterangan", width: 15 },
      { header: "KETERANGAN DETAIL", key: "keteranganDetail", width: 35 },
    ],
  });
}
</script>

<style scoped>
@media print {
  body {
    background-color: white !important;
    color: black !important;
  }
}
</style>

<template>
  <div class="w-full space-y-4 animate-fade-in">
    <!-- Breadcrumb -->
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Main Table List Modal Filter -->
    <TableListModalFilter
      title="Laporan Rekapitulasi Presensi"
      defaultSortBy="name"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listInstitution, listDepartment }"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportExcel: isExporting, printPdf: isPrinting }"
      @fetchData="loadAll"
      @exportExcel="handleExportExcel"
      @printPdf="handlePrint"
      :fitTable="false"
    >
      <!-- Custom render for NIP -->
      <template #item.nip="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Nama Pegawai -->
      <template #item.name="{ value }">
        <span>{{ value }}</span>
      </template>

      <!-- Custom render for Institusi -->
      <template #item.institutionName="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Hadir -->
      <template #item.countHadir="{ value }">
        <span>{{ value }}</span>
      </template>

      <!-- Custom render for Terlambat (Frekuensi) -->
      <template #item.countTerlambat="{ value }">
        <span>{{ value > 0 ? `${value}` : '-' }}</span>
      </template>

      <!-- Custom render for Durasi Terlambat -->
      <template #item.totalLateMinutes="{ item }">
        <span>{{ item.totalLateMinutes > 0 ? `${item.totalLateHours}j ${item.totalLateRemainingMinutes}m` : '-' }}</span>
      </template>

      <!-- Custom render for Pulang Cepat (Frekuensi) -->
      <template #item.countPulangCepat="{ value }">
        <span>{{ value > 0 ? `${value}` : '-' }}</span>
      </template>

      <!-- Custom render for Durasi Pulang Cepat -->
      <template #item.totalEarlyLeaveMinutes="{ item }">
        <span>{{ item.totalEarlyLeaveMinutes > 0 ? `${item.totalEarlyLeaveHours}j ${item.totalEarlyLeaveRemainingMinutes}m` : '-' }}</span>
      </template>

      <!-- Custom render for Izin -->
      <template #item.countIzin="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Cuti -->
      <template #item.countCuti="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Sakit -->
      <template #item.countSakit="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Dinas -->
      <template #item.countDinas="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Mangkir -->
      <template #item.countMangkir="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Alpha -->
      <template #item.countAlpha="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Custom render for Libur -->
      <template #item.countLibur="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <!-- Table Summary Footer Row -->
      <template #tfoot>
        <tr v-if="summaryData" class="border-t border-slate-200 dark:border-slate-700 font-semibold text-sm">
          <td colspan="4" class="px-3.5 py-2 text-left">
            TOTAL ({{ summaryData.totalEmployee }} PEGAWAI)
          </td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalHadir }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalTerlambat }}</td>
          <td class="px-3.5 py-2 text-center">
            {{ summaryData.totalLateMinutes > 0 ? `${summaryData.totalLateHours}j ${summaryData.totalLateRemainingMinutes}m` : '-' }}
          </td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalPulangCepat }}</td>
          <td class="px-3.5 py-2 text-center">
            {{ summaryData.totalEarlyLeaveMinutes > 0 ? `${summaryData.totalEarlyLeaveHours}j ${summaryData.totalEarlyLeaveRemainingMinutes}m` : '-' }}
          </td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalIzin }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalCuti }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalSakit }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalDinas }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalMangkir }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalAlpha }}</td>
          <td class="px-3.5 py-2 text-center">{{ summaryData.totalLibur }}</td>
        </tr>
      </template>
    </TableListModalFilter>

    <!-- Hidden Print Template Component -->
    <div style="position: absolute; left: -9999px; top: -9999px; opacity: 0; pointer-events: none;">
      <ReportEmployeeSummaryTemplate
        v-if="printableData"
        ref="printTemplateRef"
        :data="printableData"
        :institutionName="selectedInstitutionName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import reportService from "@/services/report.service";
import institutionService from "@/services/institution.service";
import departmentService from "@/services/department.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useHTMLPrint } from "~/composables/useHTMLPrint";

definePageMeta({
  layout: "admin",
  permission: "ATTENDANCE.VIEW",
});

const pageTitle = "Laporan Rekapitulasi Total Presensi";
useHead({
  title: pageTitle,
});

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Report", to: "#" },
  { label: pageTitle, active: true },
];

const route = useRoute();
const swal = useSwal();
const reportSvc = reportService();
const institutionSvc = institutionService();
const deptSvc = departmentService();
const { exportToExcel, isExporting } = useExcelExport();
const { printHTML } = useHTMLPrint();

const printTemplateRef = ref();
const isLoading = ref(false);
const isPrinting = ref(false);
const itemPerPage = ref(10);
const tableData = ref<any>({ items: [], meta: { totalItems: 0 } });
const summaryData = ref<any>(null);
const printableData = ref<any>(null);

const listInstitution = ref<any[]>([]);
const listDepartment = ref<any[]>([]);

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getFirstDayOfMonthString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const headers = ref<any[]>([
  { key: "nip", title: "NIP", sortable: true, align: "center" },
  { key: "name", title: "Nama Pegawai", sortable: true, align: "left" },
  { key: "institutionName", title: "Institusi", sortable: true, align: "left" },
  { key: "countHadir", title: "Hadir", sortable: true, align: "center" },
  { key: "countTerlambat", title: "Jumlah Telat", sortable: true, align: "center" },
  { key: "totalLateMinutes", title: "Durasi Telat", sortable: true, align: "center" },
  { key: "countPulangCepat", title: "Jumlah Plg Cepat", sortable: true, align: "center" },
  { key: "totalEarlyLeaveMinutes", title: "Durasi Plg Cepat", sortable: true, align: "center" },
  { key: "countIzin", title: "Izin", sortable: true, align: "center" },
  { key: "countCuti", title: "Cuti", sortable: true, align: "center" },
  { key: "countSakit", title: "Sakit", sortable: true, align: "center" },
  { key: "countDinas", title: "Dinas", sortable: true, align: "center" },
  { key: "countMangkir", title: "Mangkir", sortable: true, align: "center" },
  { key: "countAlpha", title: "Alpha", sortable: true, align: "center" },
  { key: "countLibur", title: "Libur", sortable: true, align: "center" },
]);

const selectedInstitutionName = computed(() => {
  const instId = route.query.institutionId;
  if (!instId) return "";
  const found = listInstitution.value.find((i: any) => String(i.id) === String(instId));
  return found?.name || "";
});

const filterSchema = computed(() => [
  {
    name: "startDate",
    modalLabel: "Tanggal Awal",
    type: "date" as const,
    placeholder: "Tanggal Awal",
    default: getFirstDayOfMonthString(),
    colModalMd: 6,
    showInModal: true,
    showAboveTable: true,
    clearable: false,
  },
  {
    name: "endDate",
    modalLabel: "Tanggal Akhir",
    type: "date" as const,
    placeholder: "Tanggal Akhir",
    default: getTodayDateString(),
    colModalMd: 6,
    showInModal: true,
    showAboveTable: true,
    clearable: false,
  },
  { name: "", type: "text" as const, colMd: 4 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "cari (Tekan Enter)",
    colMd: 4,
    showAboveTable: true,
  },
  {
    name: "institutionId",
    modalLabel: "Institusi",
    type: "autocomplete" as const,
    items: "listInstitution",
    placeholder: "Pilih Institusi",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
  {
    name: "departmentId",
    modalLabel: "Departemen",
    type: "autocomplete" as const,
    items: "listDepartment",
    placeholder: "Pilih Departemen",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
]);

const actionToolbars = computed(() => [
  {
    key: "exportExcel",
    icon: "mdi-file-excel",
    color: "#ffffff",
    tooltip: "Export Excel",
    emit: "exportExcel",
  },
  {
    key: "printPdf",
    icon: "mdi-file-pdf-box",
    color: "#ffffff",
    tooltip: "Cetak PDF",
    emit: "printPdf",
  },
]);

const loadOptions = async () => {
  try {
    const instRes: any = await institutionSvc.retrieveAll();
    listInstitution.value = instRes.data || instRes || [];

    const deptRes: any = await deptSvc.retrieveAll({ ignorePaging: true });
    listDepartment.value = deptRes.data || deptRes || [];
  } catch (err) {
    console.error("[EmployeeSummary] Failed to load filter options:", err);
  }
};

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId, departmentId, startDate, endDate } = route.query;
  isLoading.value = true;

  await reportSvc
    .getEmployeeSummary({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
      departmentId: departmentId,
      startDate: startDate ? startDate : getFirstDayOfMonthString(),
      endDate: endDate ? endDate : getTodayDateString(),
    })
    .then((res: any) => {
      isLoading.value = false;
      if (res.status && res.data) {
        summaryData.value = res.data.summary || null;
        tableData.value = {
          items: res.data.items != null ? res.data.items : [],
          meta: res.data?.meta || { totalItems: 0 },
        };
      } else {
        summaryData.value = null;
        tableData.value = { items: [], meta: { totalItems: 0 } };
      }
    })
    .catch(() => {
      isLoading.value = false;
      summaryData.value = null;
      tableData.value = { items: [], meta: { totalItems: 0 } };
    });
}

async function fetchFullDataForExportOrPrint() {
  const { q, sortBy, sortType, institutionId, departmentId, startDate, endDate } = route.query;
  
  const res: any = await reportSvc.getEmployeeSummary({
    q: q,
    sortBy: sortBy,
    sortType: sortType,
    institutionId: institutionId,
    departmentId: departmentId,
    startDate: startDate ? startDate : getFirstDayOfMonthString(),
    endDate: endDate ? endDate : getTodayDateString(),
    ignorePaging: true,
  });

  if (res.status && res.data) {
    const data = res.data;
    data.employees = data.items || data.employees || [];
    return data;
  }
  throw new Error(res.message || "Gagal memuat data lengkap");
}

async function handlePrint() {
  if (isPrinting.value) return;
  isPrinting.value = true;
  try {
    const fullData = await fetchFullDataForExportOrPrint();
    printableData.value = fullData;

    await nextTick();
    const componentRef = printTemplateRef.value;
    const htmlContent = componentRef?.$el?.outerHTML || "";
    const { customStyles, customPrintStyles } = componentRef?.getPrintStyles?.() || {};

    const periodText = fullData.periodText || "";

    printHTML(htmlContent, {
      title: `Rekapitulasi Presensi - (${periodText})`,
      margin: {
        top: "0.8cm",
        bottom: "0.5cm",
        left: "0.8cm",
        right: "0.8cm",
      },
      orientation: "landscape",
      paperSize: "A4",
      customStyles,
      customPrintStyles,
      fontFamily: "'Arial', sans-serif",
    });
  } catch (err: any) {
    console.error("Failed to print report:", err);
    swal.toast("Gagal menyiapkan data cetak", "error");
  } finally {
    isPrinting.value = false;
  }
}

async function handleExportExcel() {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    const fullData = await fetchFullDataForExportOrPrint();
    const empList = fullData.items || fullData.employees || [];
    if (!empList.length) return;

    const periodStr = (fullData.periodText || "Summary").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Rekapitulasi_Presensi_${periodStr}`;

    const exportData = empList.map((e: any) => ({
      nip: e.nip,
      nama: e.name,
      institusi: e.institutionName || "-",
      hadir: e.countHadir,
      terlambat: e.countTerlambat > 0 ? `${e.countTerlambat}` : "-",
      durasiTerlambat: e.totalLateMinutes > 0 ? `${e.totalLateHours}j ${e.totalLateRemainingMinutes}m` : "-",
      pulangCepat: e.countPulangCepat > 0 ? `${e.countPulangCepat}` : "-",
      durasiPulangCepat: e.totalEarlyLeaveMinutes > 0 ? `${e.totalEarlyLeaveHours}j ${e.totalEarlyLeaveRemainingMinutes}m` : "-",
      izin: e.countIzin || "-",
      cuti: e.countCuti || "-",
      sakit: e.countSakit || "-",
      dinas: e.countDinas || "-",
      mangkir: e.countMangkir || "-",
      alpha: e.countAlpha || "-",
      libur: e.countLibur || "-",
    }));

    await exportToExcel({
      data: exportData,
      filename: fileName,
      sheetName: "Rekap Presensi",
      headerOptions: {
        title: "LAPORAN REKAPITULASI PRESENSI PEGAWAI",
        subtitle: selectedInstitutionName.value
          ? `${selectedInstitutionName.value} - PERIODE: ${fullData.periodText || ""}`
          : `PERIODE: ${fullData.periodText || ""}`,
      },
      summaryData: {
        label: `TOTAL (${fullData.summary?.totalEmployee || 0} PEGAWAI)`,
        labelColspan: 3,
        data: {
          hadir: fullData.summary?.totalHadir || 0,
          terlambat: `${fullData.summary?.totalTerlambat || 0}`,
          durasiTerlambat: fullData.summary?.totalLateMinutes > 0 ? `${fullData.summary.totalLateHours}j ${fullData.summary.totalLateRemainingMinutes}m` : "-",
          pulangCepat: `${fullData.summary?.totalPulangCepat || 0}`,
          durasiPulangCepat: fullData.summary?.totalEarlyLeaveMinutes > 0 ? `${fullData.summary.totalEarlyLeaveHours}j ${fullData.summary.totalEarlyLeaveRemainingMinutes}m` : "-",
          izin: fullData.summary?.totalIzin || 0,
          cuti: fullData.summary?.totalCuti || 0,
          sakit: fullData.summary?.totalSakit || 0,
          dinas: fullData.summary?.totalDinas || 0,
          mangkir: fullData.summary?.totalMangkir || 0,
          alpha: fullData.summary?.totalAlpha || 0,
          libur: fullData.summary?.totalLibur || 0,
        },
      },
      columns: [
        { header: "NIP", key: "nip", width: 16 },
        { header: "NAMA PEGAWAI", key: "nama", width: 25 },
        { header: "INSTITUSI", key: "institusi", width: 28 },
        { header: "HADIR", key: "hadir", width: 10 },
        { header: "JML TELAT", key: "terlambat", width: 12 },
        { header: "DURASI TELAT", key: "durasiTerlambat", width: 16 },
        { header: "JML PLG CEPAT", key: "pulangCepat", width: 14 },
        { header: "DURASI PLG CEPAT", key: "durasiPulangCepat", width: 16 },
        { header: "IZIN", key: "izin", width: 10 },
        { header: "CUTI", key: "cuti", width: 10 },
        { header: "SAKIT", key: "sakit", width: 10 },
        { header: "DINAS", key: "dinas", width: 10 },
        { header: "MANGKIR", key: "mangkir", width: 10 },
        { header: "ALPHA", key: "alpha", width: 10 },
        { header: "LIBUR", key: "libur", width: 10 },
      ],
    });
  } catch (err: any) {
    console.error("Failed to export summary report to excel", err);
    swal.toast("Gagal mengunduh file Excel", "error");
  } finally {
    isExporting.value = false;
  }
}

onMounted(() => {
  loadOptions();
});
</script>

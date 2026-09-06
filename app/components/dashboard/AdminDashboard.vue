<template>
  <div class="w-full space-y-4 pb-8 animate-fade-in sm:space-y-6 sm:pb-12">
    <!-- Header -->
    <AdminDashboardHeader
      :current-time="currentTime"
      :current-date="currentDate"
      :current-institution-label="currentInstitutionLabel"
      :current-department-label="currentDepartmentLabel"
      :selected-department="selectedDepartment"
      :daily-period-label="dailyPeriodLabel"
      :selected-month-label="selectedMonthLabel"
      :show-filters="showFilters"
      @toggle-filters="toggleFilters"
    />

    <!-- Filter Card -->
    <AdminDashboardFilterCard
      v-model:institution="selectedInstitution"
      v-model:department="selectedDepartment"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      v-model:selected-month="selectedMonth"
      :show-filters="showFilters"
      :institution-options="institutionOptions"
      :department-options="departmentOptions"
      :is-loading-data="isLoadingData"
      @filter-change="handleFilterChange"
      @reset="resetFilters"
    />

    <!-- Executive KPI Summary Cards -->
    <AdminDashboardKpiCards
      :metrics="metrics"
      :daily-period-label="dailyPeriodLabel"
      :comparison-label="comparisonLabel"
    />

    <!-- Main Analytics Charts Section: Monthly Line Trend -->
    <AdminDashboardMonthlyTrendChart
      :selected-month-label="selectedMonthLabel"
      :series="activeTrendSeries"
      :options="trendChartOptions"
    />

    <!-- Secondary Charts (Department Bar & Status Donut) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AdminDashboardDepartmentChart
        :selected-month-label="selectedMonthLabel"
        :series="departmentChartSeries"
        :options="departmentChartOptions"
      />
      <AdminDashboardStatusDonutChart
        :selected-month-label="selectedMonthLabel"
        :series="statusDonutSeries"
        :options="statusDonutOptions"
      />
    </div>

    <!-- Top 10 Pemantauan Keterlambatan Pegawai -->
    <AdminDashboardTopLateTable
      :employees="filteredLateEmployees"
      :selected-month-label="selectedMonthLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSwal } from "~/composables/useSwal";
import institutionService from "~/services/institution.service";
import departmentService from "~/services/department.service";
import dashboardService from "~/services/dashboard.service";

import AdminDashboardHeader from "./admin/AdminDashboardHeader.vue";
import AdminDashboardFilterCard from "./admin/AdminDashboardFilterCard.vue";
import AdminDashboardKpiCards from "./admin/AdminDashboardKpiCards.vue";
import AdminDashboardMonthlyTrendChart from "./admin/AdminDashboardMonthlyTrendChart.vue";
import AdminDashboardDepartmentChart from "./admin/AdminDashboardDepartmentChart.vue";
import AdminDashboardStatusDonutChart from "./admin/AdminDashboardStatusDonutChart.vue";
import AdminDashboardTopLateTable from "./admin/AdminDashboardTopLateTable.vue";

const swal = useSwal();
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
const activeLateFilter = ref("all");
const searchDepartmentQuery = ref("");
const isLoadingData = ref(false);

// Filter Options (Loaded strictly from API)
const institutionOptions = ref<Array<{ value: string; label: string }>>([
  { value: "all", label: "Semua Sekolah" },
]);

const departmentOptions = ref<Array<{ value: string; label: string }>>([
  { value: "all", label: "Semua Departemen" },
]);

const currentInstitutionLabel = computed(() => {
  const opt = institutionOptions.value.find((i: any) => i.value === selectedInstitution.value);
  return opt ? opt.label : "Semua Sekolah";
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
const apiDailyEarlyLeave = ref<number[]>([]);
const apiDailyPermit = ref<number[]>([]);
const apiDailyDuty = ref<number[]>([]);
const apiDailyMangkir = ref<number[]>([]);
const apiDailyAlpha = ref<number[]>([]);
const apiDailyLateMinutes = ref<number[]>([]);

const monthlyTrendSeriesCounts = computed(() => {
  const count = monthCategories.value.length || 30;

  const onTimeData = apiDailyOnTime.value.length === count ? apiDailyOnTime.value : new Array(count).fill(0);
  const lateData = apiDailyLate.value.length === count ? apiDailyLate.value : new Array(count).fill(0);
  const earlyLeaveData = apiDailyEarlyLeave.value.length === count ? apiDailyEarlyLeave.value : new Array(count).fill(0);
  const permitData = apiDailyPermit.value.length === count ? apiDailyPermit.value : new Array(count).fill(0);
  const dutyData = apiDailyDuty.value.length === count ? apiDailyDuty.value : new Array(count).fill(0);
  const mangkirData = apiDailyMangkir.value.length === count ? apiDailyMangkir.value : new Array(count).fill(0);
  const alphaData = apiDailyAlpha.value.length === count ? apiDailyAlpha.value : new Array(count).fill(0);

  return [
    { name: "Tepat Waktu", data: onTimeData },
    { name: "Terlambat", data: lateData },
    { name: "Pulang Cepat", data: earlyLeaveData },
    { name: "Izin & Cuti", data: permitData },
    { name: "Dinas Luar", data: dutyData },
    { name: "Mangkir", data: mangkirData },
    { name: "Alpha", data: alphaData },
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

const activeTrendSeries = monthlyTrendSeriesCounts;

const trendChartOptions = computed(() => ({
  chart: {
    type: "line",
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  colors: ["#10b981", "#f59e0b", "#f97316", "#3b82f6", "#8b5cf6", "#d97706", "#f43f5e"],
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
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      formatter: (val: number) => {
        if (!Number.isInteger(val)) return "";
        return val;
      },
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
    shared: true,
    intersect: false,
    x: {
      formatter: (val: number) => `Tgl ${val} ${selectedMonthLabel.value}`,
    },
    y: {
      formatter: (val: number) => val + " Pegawai",
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
        { value: "all", label: "Semua Sekolah" },
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
    console.warn("[AdminDashboard] Gagal memuat opsi filter Sekolah dan Departemen:", err);
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
        apiDailyEarlyLeave.value = monthlyTrend.dailyEarlyLeave || [];
        apiDailyPermit.value = monthlyTrend.dailyPermit || [];
        apiDailyDuty.value = monthlyTrend.dailyDuty || [];
        apiDailyMangkir.value = monthlyTrend.dailyMangkir || [];
        apiDailyAlpha.value = monthlyTrend.dailyAlpha || [];
        apiDailyLateMinutes.value = monthlyTrend.dailyLateMinutes || [];
      }

      if (Array.isArray(departmentSummary)) {
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

// Chart 2: Donut Chart Status Presensi (Akurat Akumulasi Bulanan)
const statusDonutSeries = computed(() => {
  const onTime = apiDailyOnTime.value.reduce((a, b) => a + b, 0);
  const late = apiDailyLate.value.reduce((a, b) => a + b, 0);
  const early = apiDailyEarlyLeave.value.reduce((a, b) => a + b, 0);
  const permit = apiDailyPermit.value.reduce((a, b) => a + b, 0);
  const duty = apiDailyDuty.value.reduce((a, b) => a + b, 0);
  const mangkir = apiDailyMangkir.value.reduce((a, b) => a + b, 0);
  const alpha = apiDailyAlpha.value.reduce((a, b) => a + b, 0);

  const totalMonthly = onTime + late + early + permit + duty + mangkir + alpha;

  if (totalMonthly > 0) {
    return [onTime, late, early, permit, duty, mangkir, alpha];
  }

  return [
    metrics.value.onTimeCount,
    metrics.value.lateCount,
    metrics.value.earlyLeaveCount,
    metrics.value.sickCount + metrics.value.leaveCount + metrics.value.permitCount,
    metrics.value.dutyCount,
    metrics.value.mangkirCount,
    metrics.value.alphaCount,
  ];
});

const statusDonutOptions = computed(() => ({
  chart: { fontFamily: "Inter, sans-serif" },
  labels: ["Tepat Waktu", "Terlambat", "Pulang Cepat", "Izin & Cuti", "Dinas Luar", "Mangkir", "Alpha"],
  colors: ["#10b981", "#f59e0b", "#f97316", "#3b82f6", "#8b5cf6", "#d97706", "#f43f5e"],
  legend: {
    position: "bottom",
    fontSize: "11px",
    labels: { colors: "#64748b" },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number, opts: any) => {
      const rawCount = opts.w.globals.series[opts.seriesIndex];
      return rawCount > 0 ? rawCount : "";
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => val + " Pegawai",
    },
  },
  stroke: { width: 0 },
}));

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
    formatter: (val: number) => val + " Pegawai",
    style: { fontSize: "11px", colors: ["#fff"] },
  },
  xaxis: {
    categories: [],
    labels: { style: { colors: "#64748b", fontSize: "11px" } },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      formatter: (val: number) => {
        if (!Number.isInteger(val)) return "";
        return val;
      },
      style: { colors: "#64748b", fontSize: "11px" },
    },
  },
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

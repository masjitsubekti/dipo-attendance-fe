<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Employee Attendance Log List with Table (Web) & Card (Mobile) -->
    <TableListCardModalFilter
      title="Riwayat Presensi"
      headerTheme="primary"
      defaultSortBy="attendanceDate"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listAttendanceType, listStatus }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @detailItem="openMapsModal"
      @exportItem="exportItem"
    >
      <!-- Date Column (DD-MM-YYYY) -->
      <template v-slot:[`item.attendanceDate`]="{ value }">
        <span class="font-semibold text-slate-900 dark:text-white">
          {{ formatDateOnly(value) }}
        </span>
      </template>

      <!-- Checkin Time Column (HH:mm) -->
      <template v-slot:[`item.checkinTime`]="{ value }">
        <span class="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
          {{ formatTimeOnly(value) }}
        </span>
      </template>

      <!-- Checkout Time Column (HH:mm) -->
      <template v-slot:[`item.checkoutTime`]="{ value }">
        <span class="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
          {{ formatTimeOnly(value) }}
        </span>
      </template>

      <!-- Attendance Type Column -->
      <template v-slot:[`item.attendanceType`]="{ value }">
        <span class="font-medium text-slate-700 dark:text-slate-300 uppercase text-[11px]">
          {{ parseAttendanceType(value) }}
        </span>
      </template>

      <!-- Late Minutes Column -->
      <template v-slot:[`item.lateMinutes`]="{ value }">
        <span v-if="value > 0" class="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md" :title="`${value} menit`">
          +{{ formatMinutes(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Early Leave Minutes Column -->
      <template v-slot:[`item.earlyLeaveMinutes`]="{ value }">
        <span v-if="value > 0" class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md" :title="`${value} menit`">
          +{{ formatMinutes(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Status Column -->
      <template v-slot:[`item.status`]="{ item }">
        <UiBadge :variant="getStatusBadgeVariant(item.status, item.checkoutTime)" class="font-bold text-[11px]">
          {{ parseStatus(item.status, item.checkoutTime) }}
        </UiBadge>
      </template>
    </TableListCardModalFilter>

    <!-- Maps Presensi Modal Component -->
    <AttendanceLogMapModal
      v-model="showMapsModal"
      :item="selectedItem"
      :hide-map-tab="true"
    />
  </div>
</template>

<script setup lang="ts">
import attendanceLogService from "@/services/attendance-log.service";
import { useAuthStore } from "~/stores/auth";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
});

const pageTitle = "Riwayat Presensi";

useHead({
  title: pageTitle,
});

const route = useRoute();
const authStore = useAuthStore();
const logSvc = attendanceLogService();
const { formatDate } = useFormat();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);

const listAttendanceType = ref([
  { id: "regular", name: "REGULAR" },
  { id: "teaching", name: "TEACHING" },
]);

const listStatus = ref([
  { id: "present", name: "Hadir" },
  { id: "late", name: "Terlambat" },
  { id: "absent", name: "Alpa" },
  { id: "leave", name: "Izin / Cuti" },
  { id: "holiday", name: "Hari Libur" },
  { id: "incomplete", name: "Belum Pulang" },
]);

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getFirstDayOfMonthString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Riwayat Presensi" },
]);

const headers = computed(() => [
  { key: "attendanceDate", title: "Tanggal", sortable: true },
  { key: "checkinTime", title: "Jam Masuk", sortable: true, align: "center" as const },
  { key: "checkoutTime", title: "Jam Pulang", sortable: true, align: "center" as const },
  // { key: "attendanceType", title: "Jenis Kehadiran", sortable: true },
  { key: "lateMinutes", title: "Terlambat", sortable: true, align: "center" as const },
  { key: "earlyLeaveMinutes", title: "Pulang Cepat", sortable: true, align: "center" as const },
  { key: "status", title: "Status", sortable: true, align: "center" as const },
  { key: "actions", title: "Aksi", align: "center" as const, width: "8%" },
]);

const filterSchema = computed(() => [
  {
    name: "startDate",
    modalLabel: "Tanggal Awal",
    type: "date" as const,
    placeholder: "Tanggal Awal",
    colModalMd: 6,
    showInModal: true,
    showAboveTable: true,
    clearable: false,
    default: getFirstDayOfMonthString(),
  },
  {
    name: "endDate",
    modalLabel: "Tanggal Akhir",
    type: "date" as const,
    placeholder: "Tanggal Akhir",
    colModalMd: 6,
    showInModal: true,
    showAboveTable: true,
    clearable: false,
    default: getTodayDateString(),
  },
  { name: "", type: "text" as const, colMd: 4 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "Cari (Tekan Enter)",
    colMd: 4,
    showAboveTable: true,
  },
  {
    name: "attendanceType",
    modalLabel: "Jenis Kehadiran",
    type: "autocomplete" as const,
    items: "listAttendanceType",
    placeholder: "Pilih Kehadiran",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
  {
    name: "status",
    modalLabel: "Status",
    type: "autocomplete" as const,
    items: "listStatus",
    placeholder: "Pilih Status",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
]);

const actions = computed(() => [
  {
    key: "detail",
    icon: "mdi-eye",
    color: "#0284c7",
    tooltip: "Detail",
    emit: "detailItem",
  },
]);

const actionToolbars = computed(() => []);

const formatDateOnly = (val: any) => {
  if (!val) return "—";
  return formatDate(val, "DD/MM/YYYY", true);
};

const formatTimeOnly = (val: any) => {
  if (!val) return "—";
  return formatDate(val, "HH:mm", true);
};

const formatMinutes = (val: number | null | undefined) => {
  if (!val || val <= 0) return "—";
  if (val >= 60) {
    const hours = Math.floor(val / 60);
    const mins = val % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
  }
  return `${val}m`;
};

const parseAttendanceType = (typeStr: string | null) => {
  if (!typeStr) return "REGULAR";
  return typeStr.toUpperCase();
};

const parseStatus = (status: string | null, checkoutTime?: any) => {
  if (!status && checkoutTime) return "Hadir";
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "present") return "Hadir";
  if (s === "late") return "Terlambat";
  if (s === "absent") return "Alpa";
  if (s === "leave") return "Izin / Cuti";
  if (s === "holiday") return "Hari Libur";
  if (s === "incomplete") return "Belum Pulang";
  return status;
};

const getStatusBadgeVariant = (status: string | null, checkoutTime?: any): "success" | "warning" | "danger" | "info" | "default" | "primary" => {
  if (!status && checkoutTime) return "success";
  if (!status) return "default";
  const s = status.toLowerCase();
  if (s === "present") return "success";
  if (s === "late") return "warning";
  if (s === "absent") return "danger";
  if (s === "leave") return "primary";
  if (s === "holiday") return "default";
  if (s === "incomplete") return "warning";
  return "default";
};

const getPersonId = () => {
  return authStore.user?.personId || (authStore.user as any)?.person?.id || undefined;
};

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, attendanceType, status, startDate, endDate } = route.query;
  isLoading.value = true;

  const personId = getPersonId();

  await logSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      personId: personId,
      attendanceType: attendanceType,
      status: status,
      startDate: startDate ? startDate : getFirstDayOfMonthString(),
      endDate: endDate ? endDate : getTodayDateString(),
    })
    .then((res: any) => {
      isLoading.value = false;
      tableData.value = {
        items: res.data != null ? res.data.items : [],
        meta: res.data?.meta || { totalItems: 0 },
      };
    })
    .catch(() => {
      isLoading.value = false;
    });
}

async function exportItem() {
  const { q, sortBy, sortType, attendanceType, status, startDate, endDate } = route.query;
  const personId = getPersonId();

  const response: any = await logSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    personId: personId,
    attendanceType: attendanceType,
    status: status,
    startDate: startDate ? startDate : getFirstDayOfMonthString(),
    endDate: endDate ? endDate : getTodayDateString(),
    ignorePaging: true,
  });

  const items = response.data?.items || response.data || [];

  const data = items.map((item: any) => ({
    attendanceDate: formatDateOnly(item.attendanceDate),
    checkinTime: formatTimeOnly(item.checkinTime),
    checkoutTime: formatTimeOnly(item.checkoutTime),
    attendanceType: parseAttendanceType(item.attendanceType),
    lateMinutes: formatMinutes(item.lateMinutes),
    earlyLeaveMinutes: formatMinutes(item.earlyLeaveMinutes),
    status: parseStatus(item.status, item.checkoutTime),
  }));

  await exportToExcel({
    data,
    filename: pageTitle,
    sheetName: pageTitle,
    headerOptions: {
      subtitle: pageTitle,
    },
    columns: [
      { header: "Tanggal", key: "attendanceDate", width: 15 },
      { header: "Masuk", key: "checkinTime", width: 12 },
      { header: "Pulang", key: "checkoutTime", width: 12 },
      { header: "Jenis Kehadiran", key: "attendanceType", width: 20 },
      { header: "Terlambat", key: "lateMinutes", width: 15 },
      { header: "Pulang Cepat", key: "earlyLeaveMinutes", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ],
  });
}

// Maps Presensi Modal Component Logic
const showMapsModal = ref(false);
const selectedItem = ref<any>(null);

const openMapsModal = (item: any) => {
  selectedItem.value = item;
  showMapsModal.value = true;
};
</script>

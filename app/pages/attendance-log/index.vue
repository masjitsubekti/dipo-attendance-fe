<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Main Table List Modal Filter -->
    <TableListModalFilter
      title="Data Log Presensi"
      headerClass="bg-red-600 dark:bg-red-700 text-white"
      defaultSortBy="attendanceDate"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listInstitution, listPosition, listDepartment, listAttendanceType, listStatus }"
      :actions="actions"
      @fetchData="loadAll"
      @detailItem="openMapsModal"
    >
      <!-- Date Column (DD-MM-YYYY) -->
      <template v-slot:[`item.attendanceDate`]="{ value }">
        <span>
          {{ formatDateOnly(value) }}
        </span>
      </template>

      <!-- Checkin Time Column (HH:mm) -->
      <template v-slot:[`item.checkinTime`]="{ value }">
        <span class="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {{ formatTimeOnly(value) }}
        </span>
      </template>

      <!-- Checkout Time Column (HH:mm) -->
      <template v-slot:[`item.checkoutTime`]="{ value }">
        <span class="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
          {{ formatTimeOnly(value) }}
        </span>
      </template>

      <!-- Attendance Type Column -->
      <template v-slot:[`item.attendanceType`]="{ value }">
        <span>
          {{ parseAttendanceType(value) }}
        </span>
      </template>

      <!-- Late Minutes Column -->
      <template v-slot:[`item.lateMinutes`]="{ value }">
        <span v-if="value > 0" class="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400" :title="`${value} menit`">
          {{ formatMinutes(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Early Leave Minutes Column -->
      <template v-slot:[`item.earlyLeaveMinutes`]="{ value }">
        <span v-if="value > 0" class="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400" :title="`${value} menit`">
          {{ formatMinutes(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Overtime Minutes Column -->
      <template v-slot:[`item.overtimeMinutes`]="{ value }">
        <span v-if="value > 0" class="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400" :title="`${value} menit`">
          {{ formatMinutes(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Status Column -->
      <template v-slot:[`item.status`]="{ item }">
        <UiBadge :variant="getStatusBadgeVariant(item.status, item.checkoutTime)">
          {{ parseStatus(item.status, item.checkoutTime) }}
        </UiBadge>
      </template>
    </TableListModalFilter>

    <!-- Maps Presensi Modal Component -->
    <AttendanceLogMapModal
      v-model="showMapsModal"
      :item="selectedItem"
    />
  </div>
</template>

<script setup lang="ts">
import attendanceLogService from "@/services/attendance-log.service";
import institutionService from "@/services/institution.service";
import positionService from "@/services/position.service";
import departmentService from "@/services/department.service";

definePageMeta({
  layout: "admin",
  permission: "ATTENDANCE_LOG.VIEW",
});

const pageTitle = "Data Log Presensi";

useHead({
  title: pageTitle,
});

const route = useRoute();
const logSvc = attendanceLogService();
const institutionSvc = institutionService();
const positionSvc = positionService();
const deptSvc = departmentService();
const { formatDate } = useFormat();

const isLoading = ref(false);
const itemPerPage = ref(10);

const listInstitution: any = ref([]);
const listPosition: any = ref([]);
const listDepartment: any = ref([]);

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

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Log Presensi" },
]);

const headers = computed(() => [
  { key: "attendanceDate", title: "Tanggal", sortable: true },
  { key: "personNip", title: "NIP", sortable: true },
  { key: "personName", title: "Nama", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "checkinTime", title: "Masuk", sortable: true, align: "center" },
  { key: "checkoutTime", title: "Pulang", sortable: true, align: "center" },
  { key: "attendanceType", title: "Jenis Kehadiran", sortable: true },
  { key: "lateMinutes", title: "Terlambat", sortable: true, align: "center" },
  { key: "earlyLeaveMinutes", title: "Pulang Cepat", sortable: true, align: "center" },
  { key: "status", title: "Status", sortable: true, align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "6%" },
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
  {
    name: "positionId",
    modalLabel: "Jabatan",
    type: "autocomplete" as const,
    items: "listPosition",
    placeholder: "Pilih Jabatan",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
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
    tooltip: "Detail Presensi",
    emit: "detailItem",
  },
]);

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

const loadOptions = async () => {
  try {
    const instRes: any = await institutionSvc.retrieveAll();
    listInstitution.value = instRes.data || instRes || [];

    const posRes: any = await positionSvc.retrieveAll();
    listPosition.value = posRes.data || posRes || [];

    const deptRes: any = await deptSvc.retrieveAll();
    listDepartment.value = deptRes.data || deptRes || [];
  } catch (err) {
    console.error("[AttendanceLog] Failed to load filter options:", err);
  }
};

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId, positionId, departmentId, attendanceType, status, startDate, endDate } = route.query;
  isLoading.value = true;
  await logSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
      positionId: positionId,
      departmentId: departmentId,
      attendanceType: attendanceType,
      status: status,
      startDate: startDate,
      endDate: endDate,
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

// Maps Presensi Modal Component Logic
const showMapsModal = ref(false);
const selectedItem = ref<any>(null);

const openMapsModal = (item: any) => {
  selectedItem.value = item;
  showMapsModal.value = true;
};

onMounted(() => {
  loadOptions();
});
</script>

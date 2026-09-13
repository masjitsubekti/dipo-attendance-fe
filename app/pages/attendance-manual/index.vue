<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Main Table List Modal Filter -->
    <TableListModalFilter
      :title="tableTitle"
      headerClass="bg-primary-600 dark:bg-primary-700 text-white"
      defaultSortBy="createdAt"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listInstitution, listPosition, listDepartment, listAttendanceType, listStatus }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
      @showLogs="openLogsModal"
    >
      <!-- Date Column (DD/MM/YYYY) -->
      <template v-slot:[`item.attendanceDate`]="{ value }">
        <span class="font-medium text-slate-900 dark:text-slate-100">
          {{ formatDateOnly(value) }}
        </span>
      </template>

      <!-- Person Name Column -->
      <template v-slot:[`item.personName`]="{ item }">
        <div class="space-y-0.5">
          <p class="text-slate-900 dark:text-white">
            {{ item?.personName || '—' }}
          </p>
        </div>
      </template>

      <!-- Checkin Time Column (HH:mm) -->
      <template v-slot:[`item.checkinTime`]="{ value }">
        <span v-if="value" class="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {{ formatTimeOnly(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Checkout Time Column (HH:mm) -->
      <template v-slot:[`item.checkoutTime`]="{ value }">
        <span v-if="value" class="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
          {{ formatTimeOnly(value) }}
        </span>
        <span v-else class="text-slate-400 font-mono text-xs">—</span>
      </template>

      <!-- Status Column -->
      <template v-slot:[`item.status`]="{ item }">
        <UiBadge :variant="getStatusBadgeVariant(item?.status)">
          {{ parseStatus(item?.status) }}
        </UiBadge>
      </template>

      <!-- Note / Reason Column -->
      <template v-slot:[`item.note`]="{ value }">
        <span class="text-xs" :title="value">
          {{ value || '—' }}
        </span>
      </template>
    </TableListModalFilter>

    <!-- Audit Trail / Logs Modal -->
    <UiModal
      v-model="showLogsDialog"
      title="Riwayat Log Presensi"
      size="lg"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <i class="mdi mdi-history text-xl"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Riwayat Log Presensi
            </h3>
            <p v-if="selectedAttendance" class="text-xs text-slate-500 dark:text-slate-400">
              {{ selectedAttendance.personName }} ({{ selectedAttendance.personNip || '—' }}) • {{ formatDateOnly(selectedAttendance.attendanceDate) }}
            </p>
          </div>
        </div>
      </template>

      <div class="py-2 min-h-[160px]">
        <div v-if="isLoadingLogs" class="flex flex-col items-center justify-center py-10 space-y-2">
          <i class="mdi mdi-loading mdi-spin text-3xl text-primary-600"></i>
          <span class="text-xs text-slate-500">Memuat riwayat log presensi...</span>
        </div>

        <div v-else-if="logsList.length === 0" class="py-10 text-center text-slate-500 text-xs">
          <i class="mdi mdi-information-outline text-2xl text-slate-400 block mb-1"></i>
          Belum ada data riwayat log presensi tercatat.
        </div>

        <div v-else class="relative pl-6 space-y-4 my-2 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          <div
            v-for="(log, idx) in logsList"
            :key="log.id || idx"
            class="relative flex items-start gap-3 text-xs"
          >
            <!-- Dot Badge -->
            <div
              class="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
              :class="log.action?.toLowerCase() === 'checkin' ? 'bg-emerald-500' : 'bg-blue-500'"
            >
              <i :class="log.action?.toLowerCase() === 'checkin' ? 'mdi mdi-login' : 'mdi mdi-logout'"></i>
            </div>

            <!-- Content Card -->
            <div class="flex-1 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UiBadge
                    :variant="log.action?.toLowerCase() === 'checkin' ? 'success' : 'info'"
                    size="sm"
                  >
                    {{ log.action?.toUpperCase() === 'CHECKIN' ? 'PRESENSI MASUK' : 'PRESENSI PULANG' }}
                  </UiBadge>
                  <span class="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {{ formatDate(log.dateTime, "HH:mm:ss", true) }}
                  </span>
                </div>
                <span class="text-[11px] text-slate-400 font-mono">
                  {{ formatDate(log.dateTime, "DD/MM/YYYY", true) }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-slate-600 dark:text-slate-400 text-[11px] border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span class="text-slate-400">Metode / Sumber:</span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ formatDeviceName(log.device) }}
                  </p>
                </div>
                <div>
                  <span class="text-slate-400">Operator / Disimpan Oleh:</span>
                  <p class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ log.creatorName || 'Sistem / Mandiri' }}
                  </p>
                </div>
                <div>
                  <span class="text-slate-400">Waktu Input:</span>
                  <p class="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {{ log.createdAt ? formatDate(log.createdAt, "DD/MM/YYYY HH:mm", true) : '—' }}
                  </p>
                </div>
              </div>

              <div v-if="log.note" class="pt-1.5 text-[11px] border-t border-slate-200/60 dark:border-slate-700/60">
                <span class="text-slate-400">Catatan / Alasan:</span>
                <p class="italic text-slate-700 dark:text-slate-300 font-medium">
                  "{{ log.note }}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import attendanceManualService from "@/services/attendance-manual.service";
import attendanceTypeService from "@/services/attendance-type.service";
import institutionService from "@/services/institution.service";
import positionService from "@/services/position.service";
import departmentService from "@/services/department.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: ["ATTENDANCE_MANUAL.VIEW"],
});

const pageTitle = "Dispensasi Presensi";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const { formatDate } = useFormat();
const manualSvc = attendanceManualService();
const attendanceTypeSvc = attendanceTypeService();
const institutionSvc = institutionService();
const positionSvc = positionService();
const deptSvc = departmentService();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);

const listInstitution: any = ref([]);
const listPosition: any = ref([]);
const listDepartment: any = ref([]);
const listAttendanceType: any = ref([]);

const listStatus = ref([
  { id: "present", name: "Hadir" },
  { id: "late", name: "Terlambat" },
]);

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Dispensasi Presensi");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "attendanceDate", title: "Tanggal", sortable: true },
  { key: "personNip", title: "NIP", sortable: true },
  { key: "personName", title: "Pegawai", sortable: true },
    // { key: "institutionName", title: "Institusi", sortable: true },
    // { key: "departmentName", title: "Departemen", sortable: true },
  { key: "attendanceTypeName", title: "Jenis Kehadiran", sortable: true },
  { key: "checkinTime", title: "Masuk", sortable: true, align: "center" },
  { key: "checkoutTime", title: "Pulang", sortable: true, align: "center" },
  { key: "status", title: "Status", sortable: true, align: "center" },
  { key: "note", title: "Keterangan", sortable: false },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
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
    default: getTodayDateString(),
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
    name: "attendanceTypeId",
    modalLabel: "Jenis Presensi / Izin",
    type: "autocomplete" as const,
    items: "listAttendanceType",
    placeholder: "Pilih Jenis Presensi",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
  {
    name: "status",
    modalLabel: "Status Kehadiran",
    type: "autocomplete" as const,
    items: "listStatus",
    placeholder: "Pilih Status",
    valueKey: "id",
    textKey: "name",
    colModalMd: 6,
    showInModal: true,
  },
]);

const showLogsDialog = ref(false);
const isLoadingLogs = ref(false);
const selectedAttendance = ref<any>(null);
const logsList = ref<any[]>([]);

const actions = computed(() => [
  {
    key: "logs",
    icon: "mdi-history",
    color: "#3b82f6",
    tooltip: "Riwayat Log / Audit Trail",
    emit: "showLogs",
  },
  {
    key: "edit",
    icon: "mdi-pencil",
    color: "#f59e0b",
    tooltip: "Ubah",
    emit: "editItem",
  },
  {
    key: "delete",
    icon: "mdi-delete",
    color: "#ef4444",
    tooltip: "Hapus",
    emit: "deleteItem",
  },
]);

const actionToolbars = computed(() => [
  {
    key: "addItem",
    icon: "mdi-plus-circle-outline",
    color: "primary",
    tooltip: "Input Presensi Manual",
    emit: "addItem",
    type: "default" as const,
  },
  {
    key: "exportItem",
    icon: "mdi-file-excel",
    color: "white",
    tooltip: "Export Excel",
    emit: "exportItem",
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

const parseStatus = (st: string | null) => {
  if (!st) return "—";
  const s = st.toLowerCase();
  const map: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    leave: "Izin / Cuti",
    duty: "Dinas Luar",
    sick: "Sakit",
    absent: "Alpa",
    holiday: "Hari Libur",
    incomplete: "Belum Pulang",
  };
  return map[s] || st;
};

const getStatusBadgeVariant = (st: string | null): "success" | "warning" | "danger" | "info" | "default" | "primary" => {
  if (!st) return "default";
  const s = st.toLowerCase();
  if (s === "present") return "success";
  if (s === "late") return "warning";
  if (s === "absent") return "danger";
  if (s === "leave" || s === "duty" || s === "sick") return "primary";
  if (s === "holiday") return "default";
  return "default";
};

const getAttendanceTypeBadgeVariant = (cat: string | null): "primary" | "info" | "warning" | "success" | "default" => {
  if (!cat) return "primary";
  if (cat === "leave" || cat === "time_off") return "warning";
  if (cat === "duty") return "info";
  if (cat === "present") return "success";
  return "primary";
};

const formatDeviceName = (device?: string) => {
  if (!device) return "Aplikasi Presensi";
  if (device === "manual_dispensation" || device === "manual") return "Input Manual (Dispensasi)";
  if (device.includes("mobile") || device.includes("Android") || device.includes("iPhone")) return "Aplikasi Mobile";
  return device;
};

async function openLogsModal(item: any) {
  selectedAttendance.value = item;
  showLogsDialog.value = true;
  isLoadingLogs.value = true;
  logsList.value = [];
  try {
    const res: any = await manualSvc.retrieveLogs(item.id);
    logsList.value = res.data || res || [];
  } catch (err) {
    console.error("Failed to load attendance logs", err);
  } finally {
    isLoadingLogs.value = false;
  }
}

onMounted(() => {
  loadOptions();
});

async function loadOptions() {
  try {
    const [instRes, posRes, deptRes, attTypeRes]: any = await Promise.all([
      institutionSvc.retrieveAll().catch(() => []),
      positionSvc.retrieveAll().catch(() => []),
      deptSvc.retrieveAll().catch(() => []),
      attendanceTypeSvc.retrieveAll({
        category: 'attendance'
      }).catch(() => []),
    ]);

    listInstitution.value = instRes.data || instRes || [];
    listPosition.value = posRes.data || posRes || [];
    listDepartment.value = deptRes.data || deptRes || [];
    listAttendanceType.value = attTypeRes.data || attTypeRes || [];
  } catch (err) {
    console.error("Failed to load filter options", err);
  }
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId, positionId, departmentId, attendanceTypeId, status, mode, startDate, endDate } = route.query;

  isLoading.value = true;
  await manualSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
      positionId: positionId,
      departmentId: departmentId,
      attendanceTypeId: attendanceTypeId,
      status: status,
      mode: mode || "manual",
      startDate: startDate ? startDate : getTodayDateString(),
      endDate: endDate ? endDate : getTodayDateString(),
    })
    .then((res: any) => {
      tableData.value = {
        items: res.data != null ? res.data.items : [],
        meta: res.data?.meta || { totalItems: 0 },
      };
    })
    .catch((err: any) => {
      console.error("Failed to load manual attendance data", err);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

function addItem() {
  router.push("/attendance-manual/form");
}

function editItem(row: any) {
  router.push(`/attendance-manual/form?id=${row.id}`);
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.personName || "Presensi Manual", {
    title: "Hapus Data Presensi",
    text: `Apakah Anda yakin ingin menghapus data presensi manual untuk ${row.personName || "pegawai ini"}?`,
    confirmText: "Ya, Hapus",
    cancelText: "Batal",
    preConfirm: async () => {
      await manualSvc.destroy(row.id);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data presensi berhasil dihapus", "success");
    loadAll();
  }
}

async function exportItem() {
  const { q, sortBy, sortType, institutionId, positionId, departmentId, attendanceTypeId, status, mode, startDate, endDate } = route.query;

  const response: any = await manualSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    institutionId: institutionId,
    positionId: positionId,
    departmentId: departmentId,
    attendanceTypeId: attendanceTypeId,
    status: status,
    mode: mode || "manual",
    startDate: startDate ? startDate : getTodayDateString(),
    endDate: endDate ? endDate : getTodayDateString(),
    ignorePaging: true,
  });

  const data = (response.data?.items || []).map((item: any) => ({
    attendanceDate: formatDateOnly(item.attendanceDate),
    personNip: item.personNip || "—",
    personName: item.personName || "—",
    institutionName: item.institutionName || "—",
    departmentName: item.departmentName || "—",
    attendanceTypeName: item.attendanceTypeName || item.attendanceType || "REGULAR",
    checkinTime: formatTimeOnly(item.checkinTime),
    checkoutTime: formatTimeOnly(item.checkoutTime),
    status: parseStatus(item.status),
    note: item.note || "—",
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
      { header: "NIP", key: "personNip", width: 20 },
      { header: "Pegawai", key: "personName", width: 30 },
      { header: "Institusi", key: "institutionName", width: 25 },
      { header: "Departemen", key: "departmentName", width: 25 },
      { header: "Jenis Kehadiran", key: "attendanceTypeName", width: 25 },
      { header: "Masuk", key: "checkinTime", width: 12 },
      { header: "Pulang", key: "checkoutTime", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Keterangan", key: "note", width: 35 },
    ],
  });
}
</script>

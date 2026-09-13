<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Employee Attendance Request List with Table (Web) & Card (Mobile) -->
    <TableListCardModalFilter
      title="Daftar Pengajuan Izin"
      subtitle=""
      defaultSortBy="createdAt"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listAttendanceType, listStatus }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      showMobileDateRangeText
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <!-- Custom render for startDate & endDate -->
      <template #item.startDate="{ value }">
        <span class="font-semibold text-slate-800 dark:text-slate-200">
          {{ formatDateOnly(value) }}
        </span>
      </template>
      <template #item.endDate="{ value }">
        <span class="font-semibold text-slate-800 dark:text-slate-200">
          {{ formatDateOnly(value) }}
        </span>
      </template>

      <!-- Custom render for status badge -->
      <template #item.status="{ value }">
        <UiBadge :variant="statusVariant(value)" class="font-bold text-[11px]">
          {{ statusLabel(value) }}
        </UiBadge>
      </template>

      <!-- Custom render for approvalNote / reason -->
      <template #item.reason="{ item }">
        <div class="space-y-1">
          <p class="text-xs text-slate-800 dark:text-slate-200 font-medium">{{ item.reason || '—' }}</p>
          <div v-if="item.filePath" class="flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 hover:underline cursor-pointer" @click="openDocumentPreview(item.filePath)">
            <i class="mdi mdi-paperclip"></i>
            <span>Lihat Lampiran</span>
          </div>
        </div>
      </template>

      <template #item.approvalNote="{ value }">
        <span class="text-xs text-slate-600 dark:text-slate-400 italic">
          {{ value || "—" }}
        </span>
      </template>
    </TableListCardModalFilter>

    <!-- Document Preview Modal Component -->
    <DocumentPreview
      v-model="showDocPreviewModal"
      :filePath="previewFilePath"
      :fileName="getFileName(previewFilePath)"
      :fileType="getFileType(previewFilePath)"
    />
  </div>
</template>

<script setup lang="ts">
import attendanceRequestService from "@/services/attendance-request.service";
import attendanceTypeService from "@/services/attendance-type.service";
import DocumentPreview from "@/components/dialog/DocumentPreview.vue";
import { useAuthStore } from "~/stores/auth";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: "ATTENDANCE_REQUEST.VIEW",
});

const pageTitle = "Daftar Pengajuan Izin";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const authStore = useAuthStore();
const { formatDate } = useFormat();
const attendanceRequestSvc = attendanceRequestService();
const attendanceTypeSvc = attendanceTypeService();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);
const listAttendanceType: any = ref([]);

const listStatus = ref([
  { id: "pending", name: "Menunggu" },
  { id: "approved", name: "Disetujui" },
  { id: "rejected", name: "Ditolak" },
  { id: "cancelled", name: "Dibatalkan" },
]);

const statusLabel = (st: string) => {
  const map: Record<string, string> = {
    pending: "Pending / Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
  };
  return map[st] || st || "—";
};

const statusVariant = (st: string): "warning" | "success" | "danger" | "default" => {
  const map: Record<string, "warning" | "success" | "danger" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "default",
  };
  return map[st] || "default";
};

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
  { label: "Pengajuan Izin" },
]);

const headers = computed(() => [
  { key: "attendanceTypeName", title: "Jenis Izin", sortable: true },
  { key: "startDate", title: "Mulai", sortable: true },
  { key: "endDate", title: "Selesai", sortable: true },
  { key: "reason", title: "Keterangan & Lampiran", sortable: false },
  { key: "status", title: "Status", align: "center" as const, sortable: true },
  { key: "approvalNote", title: "Catatan", sortable: false },
  { key: "actions", title: "Aksi", align: "center" as const, width: "10%" },
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
    hideAboveTableMobile: true,
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
    hideAboveTableMobile: true,
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
    name: "attendanceTypeId",
    modalLabel: "Jenis Pengajuan",
    type: "autocomplete" as const,
    items: "listAttendanceType",
    placeholder: "Pilih Jenis Pengajuan",
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
    key: "edit",
    label: "Ubah",
    icon: "mdi-pencil",
    color: "#f59e0b",
    tooltip: "Ubah",
    emit: "editItem",
    disabled: (item: any) => !!item.status && String(item.status).toLowerCase() !== "pending",
  },
  {
    key: "delete",
    label: "Hapus",
    icon: "mdi-delete",
    color: "#ef4444",
    tooltip: "Hapus",
    emit: "deleteItem",
    disabled: (item: any) => !!item.status && String(item.status).toLowerCase() !== "pending",
  },
]);

const actionToolbars = computed(() => [
  {
    key: "addItem",
    icon: "mdi-plus-circle-outline",
    color: "primary",
    tooltip: "Buat Pengajuan Baru",
    emit: "addItem",
    type: "default" as const,
  },
  // {
  //   key: "exportItem",
  //   icon: "mdi-file-excel",
  //   color: "white",
  //   tooltip: "Export Excel",
  //   emit: "exportItem",
  // },
]);

// Document Preview State
const showDocPreviewModal = ref(false);
const previewFilePath = ref<string | null>(null);

const getFileName = (path: string | null) => {
  if (!path) return "Berkas Lampiran";
  return path.split("/").pop() || path;
};

const isImageFile = (path: string | null) => {
  if (!path) return false;
  const ext = path.split(".").pop()?.toLowerCase();
  return ext && ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
};

const getFileType = (path: string | null) => {
  if (!path) return "";
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (isImageFile(path)) return `image/${ext}`;
  return "";
};

const openDocumentPreview = (path: string | null) => {
  if (!path) return;
  previewFilePath.value = path;
  showDocPreviewModal.value = true;
};

const getPersonId = () => {
  return authStore.user?.personId || (authStore.user as any)?.person?.id || '-';
};

onMounted(() => {
  loadOptions();
});

async function loadOptions() {
  try {
    const attTypeRes: any = await attendanceTypeSvc.retrieveAll({ category: 'leave,time_off,duty,absence' }).catch(() => []);
    listAttendanceType.value = attTypeRes.data || attTypeRes || [];
  } catch (err) {
    console.error("Failed to load filter options", err);
  }
}

function formatDateOnly(value: any) {
  if (!value) return "—";
  return formatDate(value, "DD/MM/YYYY", true);
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, attendanceTypeId, status, startDate, endDate } = route.query;
  const personId = getPersonId();

  isLoading.value = true;
  await attendanceRequestSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      personId: personId,
      attendanceTypeId: attendanceTypeId,
      status: status,
      startDate: startDate ? startDate : getFirstDayOfMonthString(),
      endDate: endDate ? endDate : getTodayDateString(),
    })
    .then((res: any) => {
      tableData.value = {
        items: res.data != null ? res.data.items : [],
        meta: res.data?.meta || { totalItems: 0 },
      };
    })
    .catch((err: any) => {
      console.error("Failed to load data", err);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

function addItem() {
  router.push('/app/attendance-request/form');
}

async function editItem(row: any) {
  router.push(`/app/attendance-request/form?id=${row.id}`);
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.attendanceTypeName || "Pengajuan Izin", {
    title: "Hapus Pengajuan",
    text: `Apakah Anda yakin ingin menghapus pengajuan ini?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await attendanceRequestSvc.destroy(row.id);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data berhasil dihapus", "success");
    loadAll();
  }
}

async function exportItem() {
  const { q, sortBy, sortType, attendanceTypeId, status, startDate, endDate } = route.query;
  const personId = getPersonId();

  const response: any = await attendanceRequestSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    personId: personId,
    attendanceTypeId: attendanceTypeId,
    status: status,
    startDate: startDate ? startDate : getFirstDayOfMonthString(),
    endDate: endDate ? endDate : getTodayDateString(),
    ignorePaging: true,
  });

  const data = response.data?.items || [];

  await exportToExcel({
    data,
    filename: pageTitle,
    sheetName: pageTitle,
    headerOptions: {
      subtitle: pageTitle,
    },
    columns: [
      { header: "Jenis Pengajuan", key: "attendanceTypeName", width: 25 },
      { header: "Tanggal Mulai", key: "startDate", width: 20 },
      { header: "Tanggal Selesai", key: "endDate", width: 20 },
      { header: "Tipe Durasi", key: "durationType", width: 20 },
      { header: "Alasan", key: "reason", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Catatan", key: "approvalNote", width: 30 },
    ],
  });
}
</script>

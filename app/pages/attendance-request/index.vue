<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Main Table List Modal Filter -->
    <TableListModalFilter
      :title="tableTitle"
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
      @changeStatusItem="openStatusModal"
    >
      <!-- Custom render for startDate & endDate -->
      <template #item.startDate="{ value }">
        {{ formatDateOnly(value) }}
      </template>
      <template #item.endDate="{ value }">
        {{ formatDateOnly(value) }}
      </template>

      <!-- Custom render for status badge -->
      <template #item.status="{ value }">
        <UiBadge :variant="statusVariant(value)">
          {{ statusLabel(value) }}
        </UiBadge>
      </template>

      <!-- Custom render for approvalNote -->
      <template #item.approvalNote="{ value }">
        <span>
          {{ value || "—" }}
        </span>
      </template>
    </TableListModalFilter>

    <!-- Modal Change Status / Approval -->
    <UiModal v-model="showStatusModal" title="Update Status Pengajuan Izin" persistent size="md">
      <UiForm ref="statusFormRef">
        <div class="space-y-4">
          <!-- Request Information & Attachment Preview -->
          <div v-if="selectedRequest" class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs space-y-2.5 border border-slate-200 dark:border-slate-700">
            <div class="space-y-1">
              <p><strong class="text-slate-700 dark:text-slate-300">Pegawai:</strong> {{ selectedRequest.personName || "—" }} <span v-if="selectedRequest.personNip">({{ selectedRequest.personNip }})</span></p>
              <p><strong class="text-slate-700 dark:text-slate-300">Jenis Izin:</strong> {{ selectedRequest.attendanceTypeName || "—" }}</p>
              <p><strong class="text-slate-700 dark:text-slate-300">Tanggal:</strong> {{ formatDateOnly(selectedRequest.startDate) }} s/d {{ formatDateOnly(selectedRequest.endDate) }}</p>
              <p v-if="selectedRequest.reason"><strong class="text-slate-700 dark:text-slate-300">Keterangan:</strong> {{ selectedRequest.reason }}</p>
            </div>

            <!-- Lampiran Berkas / File Upload Button -->
            <div v-if="selectedRequest.filePath" class="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <i class="mdi mdi-paperclip text-base text-blue-600 dark:text-blue-400"></i>
                <span>Lampiran Berkas:</span>
              </div>
              <UiButton size="xs" color="primary" variant="outline" @click="openDocumentPreview(selectedRequest.filePath)">
                <i class="mdi mdi-eye mr-1"></i> Lihat Berkas
              </UiButton>
            </div>
            <div v-else class="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 italic">
              (Tidak ada lampiran berkas)
            </div>
          </div>

          <UiAutocomplete
            v-model="statusForm.status"
            label="Status Pengajuan"
            placeholder="Pilih Status"
            :options="listStatus"
            item-value="id"
            item-title="name"
            required
            :rules="[(v: any) => !!v || 'Status wajib dipilih']"
          />

          <UiTextarea
            v-model="statusForm.approvalNote"
            label="Catatan Approval"
            placeholder="Masukkan catatan / alasan approval (opsional)..."
            :rows="3"
          />
        </div>
      </UiForm>

      <template #footer>
        <UiButton color="secondary" @click="showStatusModal = false">
          Batal
        </UiButton>
        <UiButton color="primary" :loading="isLoadingStatusSave" @click="submitStatusUpdate">
          Simpan Status
        </UiButton>
      </template>
    </UiModal>

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
import institutionService from "@/services/institution.service";
import positionService from "@/services/position.service";
import departmentService from "@/services/department.service";
import DocumentPreview from "@/components/dialog/DocumentPreview.vue";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: "PERSON_LEAVE.VIEW",
});

const pageTitle = "Pengajuan Izin & Cuti";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const { formatDate } = useFormat();
const attendanceRequestSvc = attendanceRequestService();
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
  { id: "pending", name: "Menunggu" },
  { id: "approved", name: "Disetujui" },
  { id: "rejected", name: "Ditolak" },
  { id: "cancelled", name: "Dibatalkan" },
]);

const statusLabel = (st: string) => {
  const map: Record<string, string> = {
    pending: "Pending",
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

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Pengajuan Izin & Cuti");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Kehadiran & Izin" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "personNip", title: "NIP", sortable: true },
  { key: "personName", title: "Nama Pegawai", sortable: true },
  { key: "attendanceTypeName", title: "Jenis Izin", sortable: true },
  { key: "startDate", title: "Mulai", sortable: true },
  { key: "endDate", title: "Selesai", sortable: true },
  { key: "reason", title: "Keterangan", sortable: false },
  { key: "status", title: "Status", align: "center", sortable: true },
  { key: "approvalNote", title: "Catatan Approval", sortable: false },
  { key: "actions", title: "Aksi", align: "center", width: "12%" },
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
    key: "changeStatus",
    icon: "mdi-check-circle",
    color: "#10b981",
    tooltip: "Update Status / Approval",
    emit: "changeStatusItem",
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
    tooltip: "Tambah",
    emit: "addItem",
    type: "default" as const,
  },
  {
    key: "exportItem",
    icon: "mdi-file-excel",
    color: "white",
    tooltip: "Export",
    emit: "exportItem",
  },
]);

// Status Modal State
const showStatusModal = ref(false);
const isLoadingStatusSave = ref(false);
const selectedRequest = ref<any>(null);
const statusFormRef = ref<any>(null);
const statusForm = ref({
  status: "approved",
  approvalNote: "",
});

// Document Preview State
const showDocPreviewModal = ref(false);
const previewFilePath = ref<string | null>(null);

const getFileUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) return path;
  return `/api/files?path=${path}`;
};

const getFileName = (path: string | null) => {
  if (!path) return "Berkas Lampiran";
  return path.split("/").pop() || path;
};

const isImageFile = (path: string | null) => {
  if (!path) return false;
  const ext = path.split(".").pop()?.toLowerCase();
  return ext && ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
};

const getFileIcon = (path: string | null) => {
  if (!path) return "mdi mdi-file-document-outline";
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "mdi mdi-file-pdf-box text-red-500";
  if (["doc", "docx"].includes(ext || "")) return "mdi mdi-file-word-box text-blue-500";
  return "mdi mdi-file-document-outline text-slate-500";
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

onMounted(() => {
  loadOptions();
});

async function loadOptions() {
  try {
    const [instRes, posRes, deptRes, attTypeRes]: any = await Promise.all([
      institutionSvc.retrieveAll().catch(() => []),
      positionSvc.retrieveAll().catch(() => []),
      deptSvc.retrieveAll().catch(() => []),
      attendanceTypeSvc.retrieveAll({ category: 'leave,time_off,duty,absence' }).catch(() => []),
    ]);

    listInstitution.value = instRes.data || instRes || [];
    listPosition.value = posRes.data || posRes || [];
    listDepartment.value = deptRes.data || deptRes || [];
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
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId, positionId, departmentId, attendanceTypeId, status, startDate, endDate } = route.query;

  isLoading.value = true;
  await attendanceRequestSvc
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
      console.error("Failed to load data", err);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

function addItem() {
  router.push('/attendance-request/form');
}

async function editItem(row: any) {
  router.push(`/attendance-request/form?id=${row.id}`);
}

function openStatusModal(row: any) {
  selectedRequest.value = row;
  statusForm.value = {
    status: row.status === "pending" ? "approved" : (row.status || "approved"),
    approvalNote: row.approvalNote || "",
  };
  showStatusModal.value = true;
}

async function submitStatusUpdate() {
  const isValid = await statusFormRef.value?.validate();
  if (!isValid || !selectedRequest.value) return;

  isLoadingStatusSave.value = true;
  attendanceRequestSvc
    .updateStatus(selectedRequest.value.id, statusForm.value.status, statusForm.value.approvalNote)
    .then(() => {
      swal.toast("Status pengajuan berhasil diperbarui", "success");
      showStatusModal.value = false;
      loadAll();
    })
    .catch((err: any) => {
      console.error("Failed to update status", err);
    })
    .finally(() => {
      isLoadingStatusSave.value = false;
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.personName || "Pengajuan Izin", {
    title: "Hapus Data",
    text: `Apakah Anda yakin ingin menghapus pengajuan ini?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        attendanceRequestSvc.destroy(row.id),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data berhasil dihapus", "success");
    loadAll();
  }
}

async function exportItem() {
  const { q, sortBy, sortType, institutionId, positionId, departmentId, attendanceTypeId, status, startDate, endDate } = route.query;

  const response: any = await attendanceRequestSvc.retrieve({
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
    startDate: startDate ? startDate : getTodayDateString(),
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
      { header: "Nama Pegawai", key: "personName", width: 30 },
      { header: "NIP", key: "personNip", width: 20 },
      { header: "Jenis Pengajuan", key: "attendanceTypeName", width: 25 },
      { header: "Tanggal Mulai", key: "startDate", width: 20 },
      { header: "Tanggal Selesai", key: "endDate", width: 20 },
      { header: "Tipe Durasi", key: "durationType", width: 20 },
      { header: "Alasan", key: "reason", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Catatan Approval", key: "approvalNote", width: 30 },
    ],
  });
}
</script>

<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <!-- Approval Attendance Request List with Table (Web) & Card (Mobile) -->
    <TableListCardModalFilter
      title="Approval Pengajuan Izin"
      defaultSortBy="createdAt"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listAttendanceType, listStatus, listDepartment }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      showMobileDateRangeText
      @fetchData="loadAll"
      @processApproval="openApprovalModal"
      @exportItem="exportItem"
    >
      <!-- Custom render for Employee Name & NIP -->
      <template #item.personName="{ item }">
        <div class="flex flex-col">
          <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {{ item.personName || "—" }}
          </span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            NIP: {{ item.personNip || "—" }}
          </span>
        </div>
      </template>

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
          <div v-if="item.filePath" class="flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 hover:underline cursor-pointer font-medium" @click.stop="openDocumentPreview(item.filePath)">
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

    <!-- Modal Change Status / Approval Kepsek -->
    <UiModal 
      v-model="showApprovalModal" 
      title="Approval Pengajuan Izin" 
      persistent size="lg"
    >
      <UiForm ref="approvalFormRef">
        <div v-if="selectedRequest" class="space-y-4 mt-[-15px]">
          <UiTabs v-model="activeModalTab" :tabs="modalTabs" variant="underline">
            <!-- TAB 1: Detail Pengajuan -->
            <template #info>
              <div class="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs space-y-3.5 border border-slate-200/80 dark:border-slate-700/80 mt-3">
                <!-- Header: Employee Name, Status Badge -->
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/70 pb-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-base">
                      <i class="mdi mdi-account-outline"></i>
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-900 dark:text-white text-sm leading-tight">{{ selectedRequest.personName || "—" }}</h4>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">NIP: {{ selectedRequest.personNip || "—" }}</p>
                    </div>
                  </div>
                  <UiBadge :variant="statusVariant(selectedRequest.status)" class="font-bold text-xs px-2.5 py-1">
                    {{ statusLabel(selectedRequest.status) }}
                  </UiBadge>
                </div>

                <!-- Clean Label-Value Grid using UiRow & UiCol -->
                <UiRow class="text-xs">
                  <UiCol cols="12" sm="6" md="4">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Jenis Izin:</span>
                    <p class="font-semibold text-primary-600 dark:text-primary-400 mt-0.5">{{ selectedRequest.attendanceTypeName || "—" }}</p>
                  </UiCol>

                  <UiCol cols="12" sm="6" md="8">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Periode Tanggal:</span>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      <i class="mdi mdi-calendar-range text-slate-400 mr-1"></i>
                      {{ formatDateOnly(selectedRequest.startDate) }} &nbsp;&mdash;&nbsp; {{ formatDateOnly(selectedRequest.endDate) }}
                    </p>
                  </UiCol>

                  <UiCol cols="12" sm="6" md="4">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Tipe Durasi:</span>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{{ parseDurationType(selectedRequest.durationType) }}</p>
                  </UiCol>

                  <UiCol cols="12" sm="6" md="4">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Departemen:</span>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{{ selectedRequest.departmentName || "—" }}</p>
                  </UiCol>

                  <UiCol cols="12" sm="6" md="4">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Jabatan:</span>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{{ selectedRequest.positionName || "—" }}</p>
                  </UiCol>
                </UiRow>

                <!-- Keterangan / Alasan -->
                <div class="pt-2.5 border-t border-slate-200 dark:border-slate-700/70">
                  <span class="text-slate-500 dark:text-slate-400 font-medium">Keterangan / Alasan:</span>
                  <p class="text-slate-800 dark:text-slate-200 font-normal mt-0.5 whitespace-pre-line">{{ selectedRequest.reason || "—" }}</p>
                </div>

                <!-- Lampiran Berkas Preview -->
                <div v-if="selectedRequest.filePath" class="pt-2 border-t border-slate-200 dark:border-slate-700/70 flex items-center justify-between">
                  <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <i class="mdi mdi-paperclip text-base text-primary-600 dark:text-primary-400"></i>
                    <span>Lampiran Berkas:</span>
                  </div>
                  <UiButton size="xs" color="primary" variant="outline" @click="openDocumentPreview(selectedRequest.filePath)">
                    <i class="mdi mdi-eye mr-1"></i> Lihat Berkas
                  </UiButton>
                </div>
                <div v-else class="pt-2 border-t border-slate-200 dark:border-slate-700/70 text-slate-400 dark:text-slate-500 italic">
                  (Tidak ada lampiran berkas)
                </div>
              </div>

              <!-- Catatan Approval Textarea -->
              <div class="mt-4">
                <UiTextarea
                  v-model="approvalForm.approvalNote"
                  label="Catatan Approval"
                  placeholder="Masukkan catatan / alasan (opsional untuk disetujui, disarankan jika ditolak)..."
                  :rows="3"
                />
              </div>
            </template>

            <!-- TAB 2: Timeline Riwayat Approval -->
            <template #timeline>
              <div class="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm space-y-4 border border-slate-200/80 dark:border-slate-700/80 mt-3">
                <h5 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center gap-2">
                  <i class="mdi mdi-timeline-text-outline text-primary-600 dark:text-primary-400 text-base"></i>
                  <span>Riwayat Status Pengajuan (Timeline)</span>
                </h5>

                <div class="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  <!-- Item 1: Diajukan -->
                  <div class="relative">
                    <div class="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm ring-4 ring-slate-50 dark:ring-slate-800">
                      <i class="mdi mdi-file-document-edit-outline"></i>
                    </div>
                    <div class="text-sm">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 dark:text-slate-100">Pengajuan Diajukan</span>
                        <span class="text-xs text-slate-500 font-mono">{{ formatDateTime(selectedRequest.createdAt) }}</span>
                      </div>
                      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Oleh: <strong class="text-slate-800 dark:text-slate-200">{{ selectedRequest.personName || "Pegawai" }}</strong>
                      </p>
                    </div>
                  </div>

                  <!-- Item 2: Status Approval -->
                  <div class="relative">
                    <!-- Status Pending -->
                    <template v-if="selectedRequest.status === 'pending'">
                      <div class="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm ring-4 ring-slate-50 dark:ring-slate-800 animate-pulse">
                        <i class="mdi mdi-clock-outline"></i>
                      </div>
                      <div class="text-sm">
                        <span class="font-bold text-amber-600 dark:text-amber-400">Menunggu Persetujuan</span>
                        <p class="text-xs text-slate-500 italic mt-1">Pengajuan belum diproses oleh Kepsek / Atasan</p>
                      </div>
                    </template>

                    <!-- Status Approved -->
                    <template v-else-if="selectedRequest.status === 'approved'">
                      <div class="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm ring-4 ring-slate-50 dark:ring-slate-800">
                        <i class="mdi mdi-check-circle"></i>
                      </div>
                      <div class="text-sm space-y-1">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-emerald-600 dark:text-emerald-400">Disetujui</span>
                          <span class="text-xs text-slate-500 font-mono">{{ formatDateTime(selectedRequest.approvedAt) }}</span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-400">
                          Oleh: <strong class="text-slate-800 dark:text-slate-200">{{ selectedRequest.approverName || "Kepsek / Atasan" }}</strong>
                        </p>
                        <p v-if="selectedRequest.approvalNote" class="text-xs text-slate-700 dark:text-slate-300 mt-1.5 italic pl-2.5 border-l-2 border-emerald-500">
                          Catatan: "{{ selectedRequest.approvalNote }}"
                        </p>
                      </div>
                    </template>

                    <!-- Status Rejected -->
                    <template v-else-if="selectedRequest.status === 'rejected'">
                      <div class="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm ring-4 ring-slate-50 dark:ring-slate-800">
                        <i class="mdi mdi-close-circle"></i>
                      </div>
                      <div class="text-sm space-y-1">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-rose-600 dark:text-rose-400">Ditolak</span>
                          <span class="text-xs text-slate-500 font-mono">{{ formatDateTime(selectedRequest.approvedAt) }}</span>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-400">
                          Oleh: <strong class="text-slate-800 dark:text-slate-200">{{ selectedRequest.approverName || "Kepsek / Atasan" }}</strong>
                        </p>
                        <p v-if="selectedRequest.approvalNote" class="text-xs text-rose-700 dark:text-rose-300 mt-1.5 italic pl-2.5 border-l-2 border-rose-500">
                          Catatan: "{{ selectedRequest.approvalNote }}"
                        </p>
                      </div>
                    </template>

                    <!-- Status Cancelled -->
                    <template v-else-if="selectedRequest.status === 'cancelled'">
                      <div class="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm ring-4 ring-slate-50 dark:ring-slate-800">
                        <i class="mdi mdi-cancel"></i>
                      </div>
                      <div class="text-sm">
                        <span class="font-bold text-slate-600 dark:text-slate-400">Dibatalkan</span>
                        <p class="text-xs text-slate-500 italic mt-1">Pengajuan telah dibatalkan</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </UiTabs>
        </div>
      </UiForm>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <UiButton color="secondary" @click="showApprovalModal = false">
            Batal
          </UiButton>
          <div class="flex items-center gap-2">
            <UiButton
              v-if="selectedRequest?.status !== 'rejected'"
              color="danger"
              :loading="isLoadingSave"
              @click="submitQuickStatus('rejected')"
            >
              <i class="mdi mdi-close-circle mr-1"></i> Tolak
            </UiButton>
            <UiButton
              v-if="selectedRequest?.status !== 'approved'"
              color="success"
              :loading="isLoadingSave"
              @click="submitQuickStatus('approved')"
            >
              <i class="mdi mdi-check-circle mr-1"></i> Setuju
            </UiButton>
          </div>
        </div>
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
import departmentService from "@/services/department.service";
import DocumentPreview from "@/components/dialog/DocumentPreview.vue";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: ["APPROVAL_REQUEST.VIEW"],
});

const pageTitle = "Approval Pengajuan Izin";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const { formatDate } = useFormat();
const attendanceRequestSvc = attendanceRequestService();
const attendanceTypeSvc = attendanceTypeService();
const departmentSvc = departmentService();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);
const listAttendanceType: any = ref([]);
const listDepartment: any = ref([]);

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

const parseDurationType = (type: string | null) => {
  if (!type) return "Penuh (Full Day)";
  if (type === "full_day") return "Penuh (Full Day)";
  if (type === "half_day") return "Setengah Hari";
  if (type === "hourly") return "Per Jam";
  return type;
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
  { label: "Approval Pengajuan Izin" },
]);

const headers = computed(() => [
  { key: "personName", title: "Nama Pegawai", sortable: true },
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
    key: "processApproval",
    label: "Approval",
    icon: "mdi-check-circle",
    color: "#10b981",
    tooltip: "Approval",
    emit: "processApproval",
  },
]);

const actionToolbars = computed(() => [
  // {
  //   key: "exportItem",
  //   icon: "mdi-file-excel",
  //   color: "white",
  //   tooltip: "Export Excel",
  //   emit: "exportItem",
  // },
]);

// Approval Modal State
const showApprovalModal = ref(false);
const isLoadingSave = ref(false);
const selectedRequest = ref<any>(null);
const approvalFormRef = ref<any>(null);
const activeModalTab = ref("info");
const modalTabs = ref([
  { id: "info", name: "Pengajuan", icon: "mdi-text-box-search-outline" },
  { id: "timeline", name: "Riwayat", icon: "mdi-timeline-text-outline" },
]);
const approvalForm = ref({
  status: "approved",
  approvalNote: "",
});

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

onMounted(() => {
  loadOptions();
});

async function loadOptions() {
  try {
    const [attTypeRes, deptRes]: any = await Promise.all([
      attendanceTypeSvc.retrieveAll({ category: 'leave,time_off,duty,absence' }).catch(() => []),
      departmentSvc.retrieveAll().catch(() => []),
    ]);

    listAttendanceType.value = attTypeRes.data || attTypeRes || [];
    listDepartment.value = deptRes.data || deptRes || [];
  } catch (err) {
    console.error("Failed to load filter options", err);
  }
}

function formatDateOnly(value: any) {
  if (!value) return "—";
  return formatDate(value, "DD/MM/YYYY", true);
}

function formatDateTime(value: any) {
  if (!value) return "—";
  return formatDate(value, "DD/MM/YYYY HH:mm", true);
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, attendanceTypeId, departmentId, status, startDate, endDate } = route.query;

  isLoading.value = true;
  await attendanceRequestSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      attendanceTypeId: attendanceTypeId,
      departmentId: departmentId,
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

function openApprovalModal(row: any) {
  selectedRequest.value = row;
  activeModalTab.value = "info";
  approvalForm.value = {
    status: row.status === "pending" ? "approved" : (row.status || "approved"),
    approvalNote: row.approvalNote || "",
  };
  showApprovalModal.value = true;
}

async function submitQuickStatus(targetStatus: string) {
  if (!selectedRequest.value) return;

  if (selectedRequest.value.status === targetStatus) {
    const statusTxt = targetStatus === "approved" ? "disetujui" : targetStatus === "rejected" ? "ditolak" : "diperbarui";
    swal.toast(`Pengajuan izin ini sudah ${statusTxt}`, "warning");
    return;
  }

  const actionText = targetStatus === "approved" ? "MENYETUJUI" : "MENOLAK";
  const actionColor = targetStatus === "approved" ? "#10b981" : "#ef4444";
  const personName = selectedRequest.value.personName || "Pegawai";

  const confirmResult = await swal.fire({
    icon: targetStatus === "approved" ? "question" : "warning",
    title: "Konfirmasi Approval",
    text: `Apakah Anda yakin ingin ${actionText} pengajuan izin dari "${personName}"?`,
    showCancelButton: true,
    confirmButtonColor: actionColor,
    cancelButtonColor: "#64748b",
    confirmButtonText: targetStatus === "approved" ? "Ya, Setujui" : "Ya, Tolak",
    cancelButtonText: "Batal",
    reverseButtons: true,
  });

  if (!confirmResult.isConfirmed) return;

  approvalForm.value.status = targetStatus;

  isLoadingSave.value = true;
  attendanceRequestSvc
    .updateStatus(selectedRequest.value.id, targetStatus, approvalForm.value.approvalNote)
    .then(() => {
      const statusTxt = targetStatus === "approved" ? "disetujui" : targetStatus === "rejected" ? "ditolak" : "diperbarui";
      swal.toast(`Pengajuan izin berhasil ${statusTxt}`, "success");
      showApprovalModal.value = false;
      loadAll();
    })
    .catch((err: any) => {
      console.error("Failed to update status", err);
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}

async function exportItem() {
  const { q, sortBy, sortType, attendanceTypeId, departmentId, status, startDate, endDate } = route.query;

  const response: any = await attendanceRequestSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    attendanceTypeId: attendanceTypeId,
    departmentId: departmentId,
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
      { header: "Nama Pegawai", key: "personName", width: 25 },
      { header: "NIP", key: "personNip", width: 20 },
      { header: "Departemen", key: "departmentName", width: 20 },
      { header: "Jenis Pengajuan", key: "attendanceTypeName", width: 25 },
      { header: "Tanggal Mulai", key: "startDate", width: 20 },
      { header: "Tanggal Selesai", key: "endDate", width: 20 },
      { header: "Keterangan", key: "reason", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Catatan", key: "approvalNote", width: 30 },
    ],
  });
}
</script>

<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <TableList
      :title="tableTitle"
      defaultSortBy="createdAt"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listInstitution }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <template v-slot:['item.isActive']="{ value }">
        <UiBadge :variant="value || value === 1 ? 'success' : 'danger'">
          {{ value || value === 1 ? 'Aktif' : 'Nonaktif' }}
        </UiBadge>
      </template>
    </TableList>
  </div>
</template>

<script setup lang="ts">
import workShiftService from "@/services/work-shift.service";
import institutionService from "@/services/institution.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "WORK_SHIFT.VIEW",
});

const pageTitle = "Master Jam Kerja / Shift";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const workShiftSvc = workShiftService();
const institutionSvc = institutionService();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);

const listInstitution: any = ref([]);

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Daftar Master Jam Kerja / Shift");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama Shift", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "lateTolerance", title: "Toleransi Telat (m)", sortable: true, align: "center" },
  { key: "earlyLeaveTolerance", title: "Toleransi Pulang Cepat (m)", sortable: true, align: "center" },
  { key: "isActive", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "institutionId",
    type: "autocomplete" as const,
    items: "listInstitution",
    placeholder: "Pilih Institusi",
    colMd: 3,
    valueKey: "id",
    textKey: "name",
  },
  { name: "", type: "text" as const, colMd: 5 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "Cari Kode / Nama Shift...",
    colMd: 4,
  },
]);

const actions = computed(() => [
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

onMounted(() => {
  loadOptions();
});

async function loadOptions() {
  await institutionSvc
    .retrieveAll()
    .then((res: any) => {
      if (res.data) listInstitution.value = res.data;
    })
    .catch(() => {});
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId } = route.query;

  isLoading.value = true;

  await workShiftSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
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
  router.push('/master/work-shift/form');
}

async function editItem(row: any) {
  router.push('/master/work-shift/form?id=' + row.id);
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: 'Apakah Anda yakin ingin menghapus shift "' + row.name + '"?',
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        workShiftSvc.destroy(row.id),
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
  const { q, sortBy, sortType, institutionId } = route.query;

  const response: any = await workShiftSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    institutionId: institutionId,
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
      { header: "Kode Shift", key: "code", width: 20 },
      { header: "Nama Shift", key: "name", width: 35 },
      { header: "Institusi", key: "institutionName", width: 30 },
      { header: "Toleransi Telat (Menit)", key: "lateTolerance", width: 25 },
      { header: "Toleransi Pulang Cepat (Menit)", key: "earlyLeaveTolerance", width: 25 },
      { header: "Status", key: "isActive", width: 15 },
    ],
  });
}
</script>

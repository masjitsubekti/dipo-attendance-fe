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
      :filterList="{ listJobPosition, listStatus }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @importItem="importItem"
      @exportItem="exportItem"
    >
      <template v-slot:[`item.tmt`]="{ value }">
        {{ formatDate(value) }}
      </template>

      <template v-slot:[`item.isActive`]="{ value }">
        <UiBadge :variant="value ? 'success' : 'danger'">
          {{ value ? "Aktif" : "Nonaktif" }}
        </UiBadge>
      </template>
    </TableList>
  </div>
</template>

<script setup lang="ts">
import personService from "@/services/person.service";
import { PERSON_GENDER, PERSONNEL_TYPES } from "~/constants/data";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "PERSON.VIEW",
});

const pageTitle = "Employee";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const personSvc = personService();
const { isExporting, exportToExcel } = useExcelExport();

const showImportDialog = ref(false);

const isLoading = ref(false);
const itemPerPage = ref(10);

const listJobPosition: any = ref([]);
const listRegulatedAgent: any = ref([]);

const listStatus = ref([
  { id: "true", name: "Aktif" },
  { id: "false", name: "Nonaktif" },
]);

const genderOptions = PERSON_GENDER;
const personnelTypeOptions = PERSONNEL_TYPES;

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Employee");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "personNumber", title: "Nomor", sortable: true },
  { key: "name", title: "Nama", sortable: true },
  { key: "personType", title: "Person Type", sortable: true, align: "center" },
  { key: "tmt", title: "TMT", sortable: true },
  { key: "jobPositionName", title: "Job Position", sortable: true },
  { key: "gender", title: "Gender", sortable: true, align: "center" },
  { key: "phone", title: "Telepon", sortable: false },
  { key: "email", title: "Email", sortable: true },
  { key: "isActive", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "jobPositionId",
    type: "autocomplete" as const,
    items: "listJobPosition",
    placeholder: "Pilih Job Position",
    colMd: 3,
    valueKey: "id",
    textKey: "name",
  },
  {
    name: "isActive",
    type: "autocomplete" as const,
    items: "listStatus",
    placeholder: "Pilih Status",
    colMd: 3,
    valueKey: "id",
    textKey: "name",
  },
  { name: "", type: "text" as const, colMd: 2 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "Cari (Tekan Enter)",
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
    key: "importItem",
    icon: "mdi-file-import",
    color: "white",
    tooltip: "Import",
    emit: "importItem",
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
  loadJobPositions();
  loadRegulatedAgents();
});

function formatDate(value: any) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function loadJobPositions() {
  
}

function loadRegulatedAgents() {
  
}

async function loadAll() {
  const {
    pageNumber,
    pageSize,
    q,
    sortBy,
    sortType,
    jobPositionId,
    isActive,
  } = route.query;

  isLoading.value = true;

  await personSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      jobPositionId: jobPositionId,
      isActive: isActive,
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
  router.push('/master/person/forms');
}

async function editItem(row: any) {
  router.push(`/master/person/forms?id=${row.id}`);
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: `Apakah Anda yakin ingin menghapus data "${row.name}"?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        personSvc.destroy(row.id),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data berhasil dihapus", "success");
    loadAll();
  }
}

function importItem() {
  showImportDialog.value = true;
}

async function exportItem() {
  const { q, sortBy, sortType, jobPositionId, isActive } = route.query;

  const response: any = await personSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    jobPositionId: jobPositionId,
    isActive: isActive,
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
      { header: "Nomor Person", key: "personNumber", width: 20 },
      { header: "Nama", key: "name", width: 40 },
      { header: "Person Type", key: "personType", width: 20 },
      { header: "TMT", key: "tmt", width: 20 },
      { header: "Job Position Code", key: "jobPositionCode", width: 20 },
      { header: "Job Position", key: "jobPositionName", width: 30 },
      { header: "Regulated Agent Code", key: "raCode", width: 20 },
      { header: "Regulated Agent", key: "raName", width: 30 },
      { header: "Gender", key: "gender", width: 15 },
      { header: "Telepon", key: "phone", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Address", key: "address", width: 40 },
      {
        header: "Status",
        key: "isActive",
        width: 15,
        formatter: (val: any) => (val ? "Aktif" : "Nonaktif"),
      },
    ],
  });
}
</script>
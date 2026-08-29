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
      :filterList="{ listInstitution, listPosition, listDepartment, listStatus }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <template v-slot:[`item.tmt`]="{ value }">
        {{ formatDate(value) }}
      </template>

      <template v-slot:[`item.status`]="{ value }">
        <UiBadge :variant="value === 'aktif' || value === 'Aktif' ? 'success' : 'danger'">
          {{ value || 'Aktif' }}
        </UiBadge>
      </template>
    </TableList>
  </div>
</template>

<script setup lang="ts">
import personService from "@/services/person.service";
import institutionService from "@/services/institution.service";
import positionService from "@/services/position.service";
import departmentService from "@/services/department.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "PERSON.VIEW",
});

const pageTitle = "Pegawai";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const personSvc = personService();
const institutionSvc = institutionService();
const positionSvc = positionService();
const departmentSvc = departmentService();
const { isExporting, exportToExcel } = useExcelExport();

const isLoading = ref(false);
const itemPerPage = ref(10);

const listInstitution: any = ref([]);
const listPosition: any = ref([]);
const listDepartment: any = ref([]);

const listStatus = ref([
  { id: "aktif", name: "Aktif" },
  { id: "nonaktif", name: "Nonaktif" },
  { id: "cuti", name: "Cuti" },
  { id: "pensiun", name: "Pensiun" },
]);

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Pegawai & Pengajar");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "nip", title: "NIP / ID", sortable: true },
  { key: "name", title: "Nama Pegawai", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "positionName", title: "Jabatan", sortable: true },
  { key: "departmentName", title: "Departemen", sortable: true },
  { key: "gender", title: "L/P", sortable: true, align: "center" },
  { key: "tmt", title: "TMT", sortable: true },
  { key: "phone", title: "Telepon", sortable: false },
  { key: "status", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "institutionId",
    type: "autocomplete" as const,
    items: "listInstitution",
    placeholder: "Pilih Institusi",
    colMd: 2,
    valueKey: "id",
    textKey: "name",
  },
  {
    name: "positionId",
    type: "autocomplete" as const,
    items: "listPosition",
    placeholder: "Pilih Jabatan",
    colMd: 2,
    valueKey: "id",
    textKey: "name",
  },
  {
    name: "departmentId",
    type: "autocomplete" as const,
    items: "listDepartment",
    placeholder: "Pilih Departemen",
    colMd: 2,
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
  await Promise.all([
    institutionSvc.retrieveAll().then((res: any) => {
      if (res.data) listInstitution.value = res.data;
    }).catch(() => {}),
    positionSvc.retrieveAll().then((res: any) => {
      if (res.data) listPosition.value = res.data;
    }).catch(() => {}),
    departmentSvc.retrieveAll().then((res: any) => {
      if (res.data) listDepartment.value = res.data;
    }).catch(() => {}),
  ]);
}

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

async function loadAll() {
  const {
    pageNumber,
    pageSize,
    q,
    sortBy,
    sortType,
    institutionId,
    positionId,
    departmentId,
    status,
  } = route.query;

  isLoading.value = true;

  await personSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
      positionId: positionId,
      departmentId: departmentId,
      status: status,
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
  router.push('/master/person/form');
}

async function editItem(row: any) {
  router.push(`/master/person/form?id=${row.id}`);
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

async function exportItem() {
  const { q, sortBy, sortType, institutionId, positionId, departmentId, status } = route.query;

  const response: any = await personSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    institutionId: institutionId,
    positionId: positionId,
    departmentId: departmentId,
    status: status,
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
      { header: "NIP", key: "nip", width: 20 },
      { header: "Nama", key: "name", width: 40 },
      { header: "Jenis Kelamin", key: "gender", width: 15 },
      { header: "Institusi", key: "institutionName", width: 30 },
      { header: "Jabatan", key: "positionName", width: 30 },
      { header: "Departemen", key: "departmentName", width: 30 },
      { header: "TMT", key: "tmt", width: 20 },
      { header: "Telepon", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
    ],
  });
}
</script>
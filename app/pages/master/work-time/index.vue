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
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <template v-slot:['item.workHours']="{ item }">
        <span class="font-medium text-slate-800 dark:text-slate-200">
          {{ item.workStartTime }} - {{ item.workEndTime }}
        </span>
      </template>

      <template v-slot:['item.checkinRange']="{ item }">
        {{ item.checkinStart }} s/d {{ item.checkinEnd }}
      </template>

      <template v-slot:['item.checkoutRange']="{ item }">
        {{ item.checkoutStart || '-' }} s/d {{ item.checkoutEnd || '-' }}
      </template>

      <template v-slot:['item.isActive']="{ value }">
        <UiBadge :variant="value || value === 1 ? 'success' : 'danger'">
          {{ value || value === 1 ? 'Aktif' : 'Nonaktif' }}
        </UiBadge>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="lg">
      <UiForm ref="formRef">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.code"
                label="Kode Jam Kerja"
                placeholder="Contoh: JAM-PAGI"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.name"
                label="Nama Jam Kerja"
                placeholder="Contoh: Jam Pagi Normal"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.workStartTime"
                label="Jam Wajib Masuk"
                placeholder="08:00"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.workEndTime"
                label="Jam Wajib Pulang"
                placeholder="16:00"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.checkinStart"
                label="Awal Rentang Presensi Masuk"
                placeholder="07:00"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.checkinEnd"
                label="Akhir Rentang Presensi Masuk"
                placeholder="09:00"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.checkoutStart"
                label="Awal Rentang Presensi Pulang"
                placeholder="15:30"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.checkoutEnd"
                label="Akhir Rentang Presensi Pulang"
                placeholder="18:00"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model.number="editedItem.lateTolerance"
                type="number"
                label="Toleransi Telat (Menit)"
                placeholder="0"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model.number="editedItem.earlyLeaveTolerance"
                type="number"
                label="Toleransi Pulang Cepat (Menit)"
                placeholder="0"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiSwitch
                v-model="editedItem.isActive"
                label="Status Preset Jam Kerja"
                layout="stacked"
                :value-text="editedItem.isActive ? 'Aktif' : 'Nonaktif'"
              />
            </UiCol>
          </UiRow>
        </div>
      </UiForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton color="secondary" @click="showDialog = false">
            Batal
          </UiButton>
          <UiButton color="primary" :loading="isLoadingSave" @click="saveItem">
            Simpan
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import workTimeService from "@/services/work-time.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "WORK_SHIFT.VIEW",
});

const pageTitle = "Preset Jam Kerja / Work Time";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const workTimeSvc = workTimeService();
const { isExporting, exportToExcel } = useExcelExport();

const tableTitle = computed(() => "Daftar Preset Jam Kerja");

const isLoading = ref(false);
const isLoadingSave = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const itemPerPage = ref(10);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const statusOptions = [
  { id: true, name: "Aktif" },
  { id: false, name: "Nonaktif" },
];

const defaultItem = {
  id: null as number | null,
  code: "",
  name: "",
  workStartTime: "08:00",
  workEndTime: "16:00",
  checkinStart: "07:00",
  checkinEnd: "09:00",
  checkoutStart: "15:30",
  checkoutEnd: "18:00",
  lateTolerance: 0,
  earlyLeaveTolerance: 0,
  isActive: true,
};

const editedItem: any = ref({ ...defaultItem });

const dialogTitle = computed(() =>
  isEditing.value ? "Ubah Preset Jam Kerja" : "Tambah Preset Jam Kerja"
);

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama", sortable: true },
  { key: "workHours", title: "Jam Kerja", align: "center" },
  { key: "checkinRange", title: "Rentang Presensi Masuk" },
  { key: "checkoutRange", title: "Rentang Presensi Pulang" },
  { key: "lateTolerance", title: "Toleransi Telat (m)", align: "center" },
  { key: "earlyLeaveTolerance", title: "Toleransi Pulang Cepat (m)", align: "center" },
  { key: "isActive", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  { name: "", type: "text" as const, colMd: 8 },
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
  loadAll();
});

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType } = route.query;

  isLoading.value = true;

  await workTimeSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
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
  isEditing.value = false;
  editedItem.value = { ...defaultItem };
  showDialog.value = true;
}

async function editItem(row: any) {
  await workTimeSvc
    .retrieveById(row.id)
    .then((res: any) => {
      if (res.data) {
        editedItem.value = {
          ...res.data,
          isActive: res.data.isActive ?? res.data.is_active ?? true,
        };
        isEditing.value = true;
        showDialog.value = true;
      }
    })
    .catch(() => {});
}

async function saveItem() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;

  workTimeSvc
    .save(editedItem.value)
    .then(() => {
      swal.toast(
        isEditing.value ? "Preset Jam Kerja diperbarui" : "Preset Jam Kerja disimpan",
        "success"
      );
      showDialog.value = false;
      loadAll();
    })
    .catch((err: any) => {
      swal.toast(err.response?._data?.error || "Gagal menyimpan jam kerja", "error");
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: 'Apakah Anda yakin ingin menghapus preset jam kerja "' + row.name + '"?',
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        workTimeSvc.destroy(row.id),
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
  const { q, sortBy, sortType } = route.query;

  const response: any = await workTimeSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
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
      { header: "Kode", key: "code", width: 20 },
      { header: "Nama Preset Jam Kerja", key: "name", width: 35 },
      { header: "Jam Masuk", key: "workStartTime", width: 15 },
      { header: "Jam Pulang", key: "workEndTime", width: 15 },
      { header: "Awal Presensi Masuk", key: "checkinStart", width: 20 },
      { header: "Akhir Presensi Masuk", key: "checkinEnd", width: 20 },
      { header: "Toleransi Telat (Menit)", key: "lateTolerance", width: 25 },
      { header: "Toleransi Pulang Cepat (Menit)", key: "earlyLeaveTolerance", width: 25 },
      { header: "Status", key: "isActive", width: 15 },
    ],
  });
}
</script>

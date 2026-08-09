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
      :filterList="{ listCity }"
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
      <template v-slot:[`item.isActive`]="{ value }">
        <UiBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Aktif' : 'Nonaktif' }}
        </UiBadge>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent>
      <UiForm ref="formRef">
        <div class="space-y-3">
          <UiRow>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.code"
                label="Kode"
                placeholder="Masukkan Kode"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.name"
                label="Nama"
                placeholder="Masukkan Nama"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>
          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.cityId"
                label="Kota"
                placeholder="Pilih Kota"
                :options="listCity"
                item-value="id"
                :item-title="(item) => `${item.code} - ${item.name}`"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
                clearable
              />
            </UiCol>
          </UiRow>
          <UiRow>
            <UiCol cols="12" md="12">
              <UiTextarea
                v-model="editedItem.description"
                label="Deskripsi"
                placeholder="Masukkan Deskripsi"
                :rows="2"
              />
            </UiCol>
          </UiRow>
          <UiRow>
              <UiCol cols="12" md="12">
                <UiSwitch 
                  v-model="editedItem.isActive"
                  label="Status"
                  layout="stacked"
                  :valueText="editedItem.isActive ? 'Aktif' : 'Nonaktif'"
                />
              </UiCol>
            </UiRow>     
        </div>
      </UiForm>
      <template #footer>
        <UiButton color="secondary" @click="showDialog = false">
          Batal
        </UiButton>
        <UiButton color="primary" :loading="isLoadingSave" @click="onSubmit">
          Simpan
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import airportService from "@/services/airport.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "AIRPORT.VIEW",
});

const pageTitle = "Bandara";

useHead({
  title: pageTitle,
});

const authStore = useAuthStore();
const route = useRoute();
const swal = useSwal();
const airportSvc = airportService();
const { isExporting, exportToExcel } = useExcelExport();

const showDialog = ref(false);
const showImportDialog = ref(false);
const isEditing = ref(false);

const isLoading = ref(false);
const isLoadingSave = ref(false);
const itemPerPage = ref(10);
const formRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const listCity: any = ref([]);

const defaultItem = {
  id: null as number | null,
  cityId: null as number | null,
  name: "",
  code: "",
  description: null as string | null,
  isActive: true,
};

const editedItem: any = ref({ ...defaultItem });

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Bandara");

const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data Bandara" : "Tambah Data Bandara";
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  {
    key: "code",
    title: "Kode",
    sortable: true,
  },
  { key: "name", title: "Nama", sortable: true },
  { key: "cityName", title: "Kota", sortable: true },
  { key: 'isActive', title: 'Status', align: 'center' },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: 'cityId',
    type: 'autocomplete' as const,
    items: 'listCity',
    placeholder: 'Pilih Kota',
    colMd: 3,
    valueKey: 'id',
    textKey: 'name',
  },
  { name: "", type: "text" as const, colMd: 5 },
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
  loadAllCity();
});

function loadAllCity() {
  
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, cityId } = route.query;
  isLoading.value = true;
  await airportSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      cityId: cityId,
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

function addItem() {
  isEditing.value = false;
  editedItem.value = {
    ...defaultItem,
  };
  formRef.value?.reset();
  showDialog.value = true;
}

async function editItem(row: any) {
  formRef.value?.resetValidation();
  await airportSvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = res.data;
      isEditing.value = true;
      showDialog.value = true;
    }
  });
}

function handleClose() {
  isLoadingSave.value = false;
  isEditing.value = false;
  formRef.value?.reset();
  editedItem.value = { ...defaultItem };
  showDialog.value = false;
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;
  airportSvc
    .save(editedItem.value)
    .then(() => {
      swal.toast(
        isEditing.value
          ? "Data berhasil diperbarui"
          : "Data berhasil disimpan",
        "success",
      );
      handleClose();
      loadAll();
    })
    .catch((err: any) => {
      isLoadingSave.value = false;
      console.error("Failed to save data", err);
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: `Apakah Anda yakin ingin menghapus data "${row.name}"?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        airportSvc.destroy(row.id),
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
  const { q, sortBy, sortType, cityId } = route.query;
  const response: any = await airportSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    cityId: cityId,
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
      {
        header: "Kode",
        key: "code",
        width: 20,
      },
      { header: "Nama", key: "name", width: 50 },
      { header: "Kota", key: "cityName", width: 30 },
      { header: "Deskripsi", key: "description", width: 40 },
      { 
        header: 'Status', 
        key: 'isActive', 
        width: 20,
        formatter: (val: any) => val ? 'Aktif' : 'Nonaktif',
      },
    ],
  });
}
</script>

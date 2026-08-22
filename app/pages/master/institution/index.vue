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
      :filterList="{ listLevel }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <template v-slot:[`item.isActive`]="{ value }">
        <UiBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Aktif' : 'Nonaktif' }}
        </UiBadge>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="lg">
      <UiForm ref="formRef">
        <div class="space-y-3">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.code"
                label="Kode Institusi"
                placeholder="Masukkan Kode Institusi"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.name"
                label="Nama Institusi / Sekolah"
                placeholder="Masukkan Nama Institusi"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="editedItem.levelId"
                label="Jenjang"
                placeholder="Pilih Jenjang"
                :options="listLevel"
                item-value="id"
                item-title="name"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
                clearable
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.npsn"
                label="NPSN"
                placeholder="Masukkan NPSN"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.phone"
                label="Telepon"
                placeholder="Masukkan Nomor Telepon"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.email"
                label="Email"
                placeholder="Masukkan Alamat Email"
                type="email"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiTextarea
                v-model="editedItem.address"
                label="Alamat"
                placeholder="Masukkan Alamat Lengkap"
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
import institutionService from "@/services/institution.service";
import levelService from "@/services/level.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "INSTITUTION.VIEW",
});

const pageTitle = "Institusi";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const institutionSvc = institutionService();
const levelSvc = levelService();
const { isExporting, exportToExcel } = useExcelExport();

const showDialog = ref(false);
const isEditing = ref(false);

const isLoading = ref(false);
const isLoadingSave = ref(false);
const itemPerPage = ref(10);
const formRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const listLevel = ref([]);

const defaultItem = {
  id: null as number | null,
  code: "",
  name: "",
  levelId: null as number | null,
  npsn: "",
  address: "",
  phone: "",
  email: "",
  isActive: true,
};

const editedItem: any = ref({ ...defaultItem });

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Institusi");

const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data Institusi" : "Tambah Data Institusi";
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama Institusi", sortable: true },
  { key: "levelName", title: "Jenjang", sortable: true },
  { key: "npsn", title: "NPSN", sortable: true },
  { key: "phone", title: "Telepon", sortable: false },
  { key: "email", title: "Email", sortable: true },
  { key: "isActive", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "levelId",
    type: "autocomplete" as const,
    items: "listLevel",
    placeholder: "Pilih Jenjang",
    colMd: 3,
    valueKey: "id",
    textKey: "name",
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
    key: "exportItem",
    icon: "mdi-file-excel",
    color: "white",
    tooltip: "Export",
    emit: "exportItem",
  },
]);

onMounted(() => {
  loadAllLevel();
});

async function loadAllLevel() {
  await levelSvc
    .retrieveAll()
    .then((res: any) => {
      if (res.data) {
        listLevel.value = res.data;
      }
    })
    .catch((err: any) => {
      console.error("Failed to load institution levels", err);
    });
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, levelId } = route.query;
  isLoading.value = true;
  await institutionSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      levelId: levelId,
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
  await institutionSvc.retrieveById(row.id).then((res: any) => {
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
  institutionSvc
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
        institutionSvc.destroy(row.id),
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
  const { q, sortBy, sortType, levelId } = route.query;
  const response: any = await institutionSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    levelId: levelId,
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
      { header: "Nama Institusi", key: "name", width: 40 },
      { header: "Jenjang", key: "levelName", width: 20 },
      { header: "NPSN", key: "npsn", width: 20 },
      { header: "Telepon", key: "phone", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Alamat", key: "address", width: 40 },
      { 
        header: "Status", 
        key: "isActive", 
        width: 15,
        formatter: (val: any) => val ? "Aktif" : "Nonaktif",
      },
    ],
  });
}
</script>

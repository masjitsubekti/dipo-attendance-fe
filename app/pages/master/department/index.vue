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
    />

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="md">
      <UiForm ref="formRef">
        <div class="space-y-3">
          <UiRow>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.code"
                label="Kode Departemen"
                placeholder="Masukkan Kode Departemen"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.name"
                label="Nama Departemen / Divisi"
                placeholder="Masukkan Nama Departemen"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.institutionId"
                label="Institusi / Sekolah"
                placeholder="Pilih Institusi (Opsional)"
                :options="listInstitution"
                item-value="id"
                item-title="name"
                clearable
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
import departmentService from "@/services/department.service";
import institutionService from "@/services/institution.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "DEPARTMENT.VIEW",
});

const pageTitle = "Departemen";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const departmentSvc = departmentService();
const institutionSvc = institutionService();
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

const listInstitution = ref([]);

const defaultItem = {
  id: null as number | null,
  code: "",
  name: "",
  institutionId: null as number | null,
};

const editedItem: any = ref({ ...defaultItem });

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Departemen");

const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data Departemen" : "Tambah Data Departemen";
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama Departemen", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "institutionId",
    type: "autocomplete" as const,
    items: "listInstitution",
    placeholder: "Pilih Institusi",
    colMd: 4,
    valueKey: "id",
    textKey: "name",
  },
  { name: "", type: "text" as const, colMd: 4 },
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
  loadInstitutions();
});

async function loadInstitutions() {
  await institutionSvc
    .retrieveAll()
    .then((res: any) => {
      if (res.data) {
        listInstitution.value = res.data;
      }
    })
    .catch((err: any) => {
      console.error("Failed to load institutions", err);
    });
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId } = route.query;
  isLoading.value = true;
  await departmentSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      institutionId: institutionId,
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
  await departmentSvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = {
        ...res.data,
        institutionId: res.data.institutionId ?? null,
      };
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
  departmentSvc
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
        departmentSvc.destroy(row.id),
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
  const response: any = await departmentSvc.retrieve({
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
      { header: "Kode", key: "code", width: 20 },
      { header: "Nama Departemen", key: "name", width: 40 },
      { header: "Institusi", key: "institutionName", width: 40 },
    ],
  });
}
</script>

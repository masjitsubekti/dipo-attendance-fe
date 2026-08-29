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
      :filterList="{ listInstitution, isNationalOptions }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <!-- Custom render for date -->
      <template v-slot:[`item.date`]="{ value }">
        <span class="font-medium text-slate-700 dark:text-slate-200">
          {{ formatDate(value, "DD/MM/YYYY") }}
        </span>
      </template>

      <!-- Custom render for isNational -->
      <template v-slot:[`item.isNational`]="{ value }">
        <UiBadge :variant="value ? 'primary' : 'info'">
          {{ value ? 'Nasional' : 'Lokal / Khusus' }}
        </UiBadge>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="md">
      <UiForm ref="formRef">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="12">
              <UiDatePicker
                v-model="editedItem.date"
                mode="date"
                label="Tanggal"
                placeholder="Pilih Tanggal Libur"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
                :clearable="false"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.title"
                label="Nama Hari Libur"
                placeholder="Masukkan Nama Hari Libur"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.institutionId"
                label="Institusi / Sekolah"
                placeholder="Pilih Institusi (Kosongkan jika Libur Nasional)"
                :options="listInstitution"
                item-value="id"
                item-title="name"
                clearable
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.type"
                label="Jenis / Kategori Libur"
                placeholder="Contoh: Nasional, Cuti Bersama"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiSwitch
                v-model="editedItem.isNational"
                label="Libur Nasional"
                layout="stacked"
                :valueText="editedItem.isNational ? 'Ya' : 'Tidak'"
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
import holidayService from "@/services/holiday.service";
import institutionService from "@/services/institution.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: "HOLIDAY.VIEW",
});

const pageTitle = "Hari Libur";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const holidaySvc = holidayService();
const institutionSvc = institutionService();
const { isExporting, exportToExcel } = useExcelExport();
const { formatDate } = useFormat();

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

const isNationalOptions = [
  { id: "true", name: "Libur Nasional" },
  { id: "false", name: "Libur Lokal / Khusus" },
];

const defaultItem = {
  id: null as number | null,
  institutionId: null as number | null,
  date: "",
  title: "",
  type: "",
  isNational: true,
};

const editedItem: any = ref({ ...defaultItem });

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Hari Libur");

const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data Hari Libur" : "Tambah Data Hari Libur";
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "date", title: "Tanggal Libur", sortable: true },
  { key: "title", title: "Nama Hari Libur", sortable: true },
  { key: "type", title: "Jenis / Kategori", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "isNational", title: "Status", align: "center", sortable: true },
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
  {
    name: "isNational",
    type: "autocomplete" as const,
    items: "isNationalOptions",
    placeholder: "Pilih Status Libur",
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
  const { pageNumber, pageSize, q, sortBy, sortType, isNational, institutionId } = route.query;
  isLoading.value = true;
  await holidaySvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      isNational: isNational || undefined,
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
    date: new Date().toISOString().substring(0, 10),
  };
  formRef.value?.reset();
  showDialog.value = true;
}

async function editItem(row: any) {
  formRef.value?.resetValidation();
  await holidaySvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = {
        ...res.data,
        institutionId: res.data.institutionId ?? null,
        date: res.data.date ? formatDate(res.data.date, 'YYYY-MM-DD') : '',
        isNational: Boolean(res.data.isNational),
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
  holidaySvc
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
  const titleText = row.title || formatDateTemplate(row.date, 'short');
  const result = await swal.confirmDelete(titleText, {
    title: "Hapus Data Hari Libur",
    text: `Apakah Anda yakin ingin menghapus data "${titleText}"?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        holidaySvc.destroy(row.id),
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
  const { q, sortBy, sortType, isNational, institutionId } = route.query;
  const response: any = await holidaySvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    isNational: isNational || undefined,
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
      {
        header: "Tanggal Libur",
        key: "date",
        width: 20,
        formatter: (val: any) => formatDate(val, "DD/MM/YYYY"),
      },
      { header: "Nama Hari Libur", key: "title", width: 40 },
      { header: "Jenis / Kategori", key: "type", width: 25 },
      {
        header: "Institusi",
        key: "institutionName",
        width: 30,
      },
      {
        header: "Status Libur",
        key: "isNational",
        width: 20,
        formatter: (val: any) => (val ? "Nasional" : "Lokal / Khusus"),
      },
    ],
  });
}
</script>

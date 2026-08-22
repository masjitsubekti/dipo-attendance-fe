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
      :filterList="{ listPersonnel, listShift }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <template v-slot:['item.effectiveFrom']="{ value }">
        {{ formatDate(value) }}
      </template>

      <template v-slot:['item.effectiveUntil']="{ value }">
        {{ value ? formatDate(value) : '-' }}
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="md">
      <UiForm ref="formRef">
        <div class="space-y-3">
          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.personnelId"
                label="Pegawai / Karyawan"
                placeholder="Pilih Pegawai"
                :options="listPersonnel"
                item-value="id"
                item-title="name"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.shiftId"
                label="Shift / Jam Kerja"
                placeholder="Pilih Shift"
                :options="listShift"
                item-value="id"
                item-title="name"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiDatePicker
                v-model="editedItem.effectiveFrom"
                mode="date"
                label="Tanggal Efektif Mulai"
                placeholder="Pilih Tanggal Mulai"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiDatePicker
                v-model="editedItem.effectiveUntil"
                mode="date"
                label="Tanggal Efektif Selesai"
                placeholder="Pilih Tanggal Selesai (Opsional)"
                clearable
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
import workShiftPatternService from "@/services/work-shift-pattern.service";
import workShiftService from "@/services/work-shift.service";
import personService from "@/services/person.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "WORK_SHIFT.VIEW",
});

const pageTitle = "Penugasan Shift Pegawai";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const { formatDate: formatCustomDate } = useFormat();
const patternSvc = workShiftPatternService();
const shiftSvc = workShiftService();
const personSvc = personService();
const { isExporting, exportToExcel } = useExcelExport();

const tableTitle = computed(() => "Daftar Penugasan Shift Pegawai");

const listPersonnel: any = ref([]);
const listShift: any = ref([]);
const isLoading = ref(false);
const isLoadingSave = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const itemPerPage = ref(10);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const defaultItem = {
  id: null as string | null,
  personnelId: null as number | null,
  shiftId: null as string | null,
  effectiveFrom: null as string | null,
  effectiveUntil: null as string | null,
};

const editedItem: any = ref({ ...defaultItem });

const dialogTitle = computed(() =>
  isEditing.value ? "Ubah Penugasan Shift" : "Tambah Penugasan Shift"
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
  { key: "personnelNip", title: "NIP", sortable: true },
  { key: "personnelName", title: "Nama Pegawai", sortable: true },
  { key: "shiftName", title: "Shift / Jam Kerja", sortable: true },
  { key: "effectiveFrom", title: "Berlaku Mulai", sortable: true },
  { key: "effectiveUntil", title: "Berlaku Selesai", sortable: true },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "personnelId",
    type: "autocomplete" as const,
    items: "listPersonnel",
    placeholder: "Pilih Pegawai",
    colMd: 3,
    valueKey: "id",
    textKey: "name",
  },
  {
    name: "shiftId",
    type: "autocomplete" as const,
    items: "listShift",
    placeholder: "Pilih Shift",
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
  loadOptions();
});

async function loadOptions() {
  await Promise.all([
    personSvc.retrieveAll().then((res: any) => {
      if (res.data) listPersonnel.value = res.data;
    }).catch(() => {}),
    shiftSvc.retrieveAll().then((res: any) => {
      if (res.data) listShift.value = res.data;
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
  const { pageNumber, pageSize, q, sortBy, sortType, personnelId, shiftId } = route.query;

  isLoading.value = true;

  await patternSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      personnelId: personnelId,
      shiftId: shiftId,
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
  await patternSvc
    .retrieveById(row.id)
    .then((res: any) => {
      if (res.data) {
        editedItem.value = {
          ...res.data,
          personnelId: res.data.personnelId ?? res.data.personnel_id ?? null,
          shiftId: res.data.shiftId ?? res.data.shift_id ?? null,
          effectiveFrom: res.data.effectiveFrom ? formatCustomDate(res.data.effectiveFrom, 'YYYY-MM-DD') : null,
          effectiveUntil: res.data.effectiveUntil ? formatCustomDate(res.data.effectiveUntil, 'YYYY-MM-DD') : null,
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

  patternSvc
    .save(editedItem.value)
    .then(() => {
      swal.toast(
        isEditing.value ? "Penugasan shift diperbarui" : "Penugasan shift disimpan",
        "success"
      );
      showDialog.value = false;
      loadAll();
    })
    .catch((err: any) => {
      swal.toast(err.response?._data?.error || "Gagal menyimpan penugasan shift", "error");
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.personnelName, {
    title: "Hapus Data",
    text: 'Apakah Anda yakin ingin menghapus penugasan shift untuk "' + row.personnelName + '"?',
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        patternSvc.destroy(row.id),
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
  const { q, sortBy, sortType, personnelId, shiftId } = route.query;

  const response: any = await patternSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    personnelId: personnelId,
    shiftId: shiftId,
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
      { header: "NIP", key: "personnelNip", width: 20 },
      { header: "Nama Pegawai", key: "personnelName", width: 35 },
      { header: "Shift / Jam Kerja", key: "shiftName", width: 35 },
      { header: "Tanggal Efektif Mulai", key: "effectiveFrom", width: 25 },
      { header: "Tanggal Efektif Selesai", key: "effectiveUntil", width: 25 },
    ],
  });
}
</script>

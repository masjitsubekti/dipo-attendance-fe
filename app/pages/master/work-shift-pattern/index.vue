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
      :filterList="{ listPerson, listShift }"
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

    <!-- Modal Form (Bulk / Single Assign) -->
    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="lg">
      <UiForm ref="formRef">
        <div class="space-y-4">
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

          <!-- Mode Edit (Single Person) -->
          <UiRow v-if="isEditing">
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.personId"
                label="Pegawai / Karyawan"
                placeholder="Pilih Pegawai"
                :options="listPerson"
                item-value="id"
                item-title="name"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <!-- Mode Bulk Add (Person Lookup Table) -->
          <div v-else class="space-y-3 pt-2">
            <div class="flex items-center justify-between pb-2">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Daftar Pegawai Terpilih ({{ selectedPersons.length }})
              </label>
              <UiButton
                color="primary"
                variant="outline"
                size="sm"
                @click="showPersonLookup = true"
              >
                <i class="mdi mdi-account-search mr-1"></i>
                Pilih Pegawai (Lookup)
              </UiButton>
            </div>

            <UiTable
              :columns="selectedPersonsHeaders"
              :data="selectedPersons"
              item-key="id"
            >
              <template #cell-no="{ row: item, index }">
                {{ index + 1 }}
              </template>

              <template #cell-nip="{ row: item }">
                <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {{ item.nip || '-' }}
                </span>
              </template>

              <template #cell-name="{ row: item }">
                <span class="font-medium text-slate-900 dark:text-white">
                  {{ item.name }}
                </span>
              </template>

              <template #cell-actions="{ row: item }">
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Hapus dari daftar"
                  @click="removeSelectedPerson(item.id)"
                >
                  <i class="mdi mdi-delete text-base"></i>
                </button>
              </template>

              <template #empty>
                <div class="p-4 text-center text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  Belum ada pegawai dipilih. Klik tombol "Pilih Pegawai (Lookup)" di atas.
                </div>
              </template>
            </UiTable>
          </div>
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

    <!-- Person Lookup Modal Component -->
    <DialogPersonLookup
      v-model="showPersonLookup"
      :multiple="true"
      title="Pilih Pegawai untuk Penugasan Shift"
      :exclude-ids="selectedPersons.map(p => p.id)"
      @add-to-queue="handleSelectedPersonsFromLookup"
    />
  </div>
</template>

<script setup lang="ts">
import workShiftPatternService from "@/services/work-shift-pattern.service";
import workShiftService from "@/services/work-shift.service";
import personService from "@/services/person.service";
import DialogPersonLookup from "@/components/dialog/PersonLookup.vue";
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

const listPerson: any = ref([]);
const listShift: any = ref([]);
const selectedPersons: any = ref([]);

const isLoading = ref(false);
const isLoadingSave = ref(false);
const showDialog = ref(false);
const showPersonLookup = ref(false);
const isEditing = ref(false);
const itemPerPage = ref(10);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const defaultItem = {
  id: null as string | null,
  personId: null as number | null,
  shiftId: null as string | null,
  effectiveFrom: null as string | null,
  effectiveUntil: null as string | null,
};

const editedItem: any = ref({ ...defaultItem });

const dialogTitle = computed(() =>
  isEditing.value ? "Ubah Penugasan Shift" : "Tambah / Bulk Assign Penugasan Shift"
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

const selectedPersonsHeaders = computed(() => [
  { key: "no", label: "No", sortable: false },
  { key: "nip", label: "NIP", sortable: false },
  { key: "name", label: "Nama Pegawai", sortable: false },
  { key: "actions", label: "Aksi", align: "center", width: "10%" },
]);

const headers = computed(() => [
  { key: "personNip", title: "NIP", sortable: true },
  { key: "personName", title: "Nama Pegawai", sortable: true },
  { key: "shiftName", title: "Shift / Jam Kerja", sortable: true },
  { key: "effectiveFrom", title: "Berlaku Mulai", sortable: true },
  { key: "effectiveUntil", title: "Berlaku Selesai", sortable: true },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "personId",
    type: "autocomplete" as const,
    items: "listPerson",
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
    tooltip: "Tambah Bulk",
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
      if (res.data) listPerson.value = res.data;
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
  const { pageNumber, pageSize, q, sortBy, sortType, personId, shiftId } = route.query;

  isLoading.value = true;

  await patternSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      personId: personId,
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
  selectedPersons.value = [];
  showDialog.value = true;
}

function handleSelectedPersonsFromLookup(persons: any[]) {
  persons.forEach((person) => {
    if (!selectedPersons.value.some((p: any) => p.id === person.id)) {
      selectedPersons.value.push(person);
    }
  });
}

function removeSelectedPerson(id: number) {
  selectedPersons.value = selectedPersons.value.filter((p: any) => p.id !== id);
}

async function editItem(row: any) {
  await patternSvc
    .retrieveById(row.id)
    .then((res: any) => {
      if (res.data) {
        editedItem.value = {
          ...res.data,
          personId: res.data.personId ?? res.data.person_id ?? null,
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

  if (!isEditing.value && selectedPersons.value.length === 0) {
    swal.toast("Silakan pilih setidaknya satu pegawai untuk penugasan shift", "warning");
    return;
  }

  isLoadingSave.value = true;

  const payload = isEditing.value
    ? editedItem.value
    : {
        shiftId: editedItem.value.shiftId,
        effectiveFrom: editedItem.value.effectiveFrom,
        effectiveUntil: editedItem.value.effectiveUntil,
        personIds: selectedPersons.value.map((p: any) => p.id),
      };

  patternSvc
    .save(payload)
    .then(() => {
      swal.toast(
        isEditing.value ? "Penugasan shift diperbarui" : "Bulk penugasan shift disimpan",
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
  const result = await swal.confirmDelete(row.personName || row.personName, {
    title: "Hapus Data",
    text: 'Apakah Anda yakin ingin menghapus penugasan shift untuk "' + row.personName || row.personName + '"?',
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
  const { q, sortBy, sortType, personId, shiftId } = route.query;

  const response: any = await patternSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    personId: personId,
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
      { header: "NIP", key: "personNip", width: 20 },
      { header: "Nama Pegawai", key: "personName", width: 35 },
      { header: "Shift / Jam Kerja", key: "shiftName", width: 35 },
      { header: "Tanggal Efektif Mulai", key: "effectiveFrom", width: 25 },
      { header: "Tanggal Efektif Selesai", key: "effectiveUntil", width: 25 },
    ],
  });
}
</script>

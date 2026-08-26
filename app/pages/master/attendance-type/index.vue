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
      :filterList="{ categoryOptions }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      :actionLoading="{ exportItem: isExporting }"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @exportItem="exportItem"
    >
      <!-- Custom render for category -->
      <template #item.category="{ item }">
        <UiBadge :variant="categoryVariant(item.category)">
          {{ categoryLabel(item.category) }}
        </UiBadge>
      </template>

      <!-- Custom render for flags -->
      <template #item.flags="{ item }">
        <div class="flex flex-wrap gap-1">
          <UiBadge v-if="item.countsAsPresent" variant="success" size="sm">
            Hadir
          </UiBadge>
          <UiBadge v-if="item.requiresApproval" variant="warning" size="sm">
            Persetujuan
          </UiBadge>
          <UiBadge v-if="item.requiresAttendance" variant="info" size="sm">
            Presensi
          </UiBadge>
        </div>
      </template>

      <!-- Custom render for colorLabel -->
      <template #item.colorLabel="{ item }">
        <div v-if="item.colorLabel" class="flex items-center gap-2">
          <span
            class="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0"
            :style="{ backgroundColor: item.colorLabel }"
          ></span>
          <span class="text-xs font-mono text-slate-600 dark:text-slate-400">{{ item.colorLabel }}</span>
        </div>
        <span v-else class="text-slate-400">—</span>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="md">
      <UiForm ref="formRef">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.code"
                label="Kode Presensi"
                placeholder="Contoh: HADIR, SAKIT, CUTI"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="editedItem.category"
                label="Kategori"
                placeholder="Pilih Kategori"
                :options="categoryOptions"
                item-value="id"
                item-title="name"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiInput
                v-model="editedItem.name"
                label="Nama Jenis Presensi"
                placeholder="Contoh: Hadir Normal, Cuti Tahunan"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <!-- Checkboxes for flags -->
          <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Pengaturan Tambahan</span>
            
            <label class="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                v-model="editedItem.countsAsPresent"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Dihitung Sebagai Kehadiran</span>
            </label>

            <label class="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                v-model="editedItem.requiresApproval"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Memerlukan Persetujuan</span>
            </label>

            <label class="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                v-model="editedItem.requiresAttendance"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Memerlukan Absen / Foto / Geolocation</span>
            </label>
          </div>

          <UiRow>
            <UiCol cols="12" md="12">
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Label (Opsional)
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="editedItem.colorLabel"
                    class="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                  />
                  <UiInput
                    v-model="editedItem.colorLabel"
                    placeholder="Contoh: #3b82f6"
                    class="flex-1"
                  />
                </div>
              </div>
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
import attendanceTypeService from "@/services/attendance-type.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";
import { ATTENDANCE_TYPE_CATEGORIES } from "~/constants/data";

definePageMeta({
  layout: "admin",
  permission: "ATTENDANCE_TYPE.VIEW",
});

const pageTitle = "Jenis Presensi & Izin";

useHead({
  title: pageTitle,
});

const route = useRoute();
const swal = useSwal();
const attendanceTypeSvc = attendanceTypeService();
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

const categoryOptions = ATTENDANCE_TYPE_CATEGORIES;

const categoryLabel = (cat: string) => {
  const found = ATTENDANCE_TYPE_CATEGORIES.find((item) => item.id === cat);
  return found ? found.name : cat || "—";
};

const categoryVariant = (cat: string): "success" | "warning" | "danger" | "info" | "default" | "primary" => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "primary"> = {
    attendance: "success",
    leave: "primary",
    time_off: "warning",
    duty: "info",
  };
  return map[cat] || "default";
};

const defaultItem = {
  id: null as number | null,
  code: "",
  name: "",
  category: "attendance",
  countsAsPresent: false,
  requiresApproval: false,
  requiresAttendance: false,
  colorLabel: "#3b82f6",
};

const editedItem: any = ref({ ...defaultItem });

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const tableTitle = computed(() => "Data Jenis Presensi & Izin");

const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data Jenis Presensi" : "Tambah Data Jenis Presensi";
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama Jenis Presensi", sortable: true },
  { key: "category", title: "Kategori", sortable: true },
  { key: "flags", title: "Aturan & Status", sortable: false },
  { key: "colorLabel", title: "Warna Label", sortable: false },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "category",
    type: "autocomplete" as const,
    items: "categoryOptions",
    placeholder: "Pilih Kategori",
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

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, category } = route.query;
  isLoading.value = true;
  await attendanceTypeSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      category: category,
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
  await attendanceTypeSvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = {
        ...res.data,
        countsAsPresent: Boolean(res.data.countsAsPresent),
        requiresApproval: Boolean(res.data.requiresApproval),
        requiresAttendance: Boolean(res.data.requiresAttendance),
        colorLabel: res.data.colorLabel ?? "#3b82f6",
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
  attendanceTypeSvc
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
        attendanceTypeSvc.destroy(row.id),
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
  const { q, sortBy, sortType, category } = route.query;
  const response: any = await attendanceTypeSvc.retrieve({
    q: q,
    pageSize: 1,
    pageNumber: 1,
    sortBy: sortBy,
    sortType: sortType,
    category: category,
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
      { header: "Nama Jenis Presensi", key: "name", width: 40 },
      { header: "Kategori", key: "category", width: 25 },
    ],
  });
}
</script>

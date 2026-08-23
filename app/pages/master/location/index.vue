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
    >
      <template v-slot:[`item.isActive`]="{ value }">
        <UiBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Aktif' : 'Nonaktif' }}
        </UiBadge>
      </template>
      <template v-slot:[`item.radiusMeter`]="{ value }">
        <span class="font-medium">{{ value }} m</span>
      </template>
      <template v-slot:[`item.coordinates`]="{ item }">
        <span v-if="item && item.latitude != null && item.longitude != null" class="text-xs text-slate-500 font-mono">
          {{ Number(item.latitude).toFixed(6) }}, {{ Number(item.longitude).toFixed(6) }}
        </span>
        <span v-else class="text-xs text-slate-400">—</span>
      </template>
    </TableList>

    <!-- Form Modal -->
    <UiModal v-model="showDialog" :title="dialogTitle" persistent size="xl">
      <UiForm ref="formRef">
        <div class="space-y-3">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.code"
                label="Kode Lokasi"
                placeholder="Masukkan Kode Lokasi"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.name"
                label="Nama Lokasi"
                placeholder="Masukkan Nama Lokasi"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiAutocomplete
                v-model="editedItem.institutionId"
                label="Institusi"
                placeholder="Pilih Institusi"
                :options="listInstitution"
                item-value="id"
                item-title="name"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
                clearable
              />
            </UiCol>
          </UiRow>

          <!-- Map picker -->
          <UiRow>
            <UiCol cols="12" md="12">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pilih Koordinat Lokasi
                <span class="text-xs font-normal text-slate-400 ml-1">
                  (Klik pada peta untuk menentukan titik lokasi)
                </span>
              </label>
              <div class="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style="height: 260px;">
                <UiMap
                  ref="mapPickerRef"
                  :center="mapCenter"
                  :zoom="15"
                  default-tile="street"
                  :show-layer-control="false"
                  :fit-bounds-on-data="false"
                  @ready="onMapReady"
                  class="w-full h-full"
                />
                <button
                  type="button"
                  @click="useCurrentLocation"
                  :disabled="isLocating"
                  class="absolute bottom-3 right-3 z-[400] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  title="Set Lokasi Saat Ini"
                >
                  <i class="mdi" :class="isLocating ? 'mdi-loading animate-spin text-blue-500' : 'mdi-crosshairs-gps text-blue-500'"></i>
                  <span>{{ isLocating ? 'Mendeteksi...' : 'Set Lokasi Saat Ini' }}</span>
                </button>
              </div>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <i class="mdi mdi-information-outline"></i>
                Klik peta untuk memindahkan marker lokasi
              </p>
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="4">
              <UiInput
                v-model="editedItem.latitude"
                label="Latitude"
                placeholder="-7.1234567"
                required
                type="number"
                step="0.0000001"
                :rules="[(v) => !!v || 'Wajib diisi']"
                @update:modelValue="onCoordinateInput"
              />
            </UiCol>
            <UiCol cols="12" md="4">
              <UiInput
                v-model="editedItem.longitude"
                label="Longitude"
                placeholder="112.1234567"
                required
                type="number"
                step="0.0000001"
                :rules="[(v) => !!v || 'Wajib diisi']"
                @update:modelValue="onCoordinateInput"
              />
            </UiCol>
            <UiCol cols="12" md="4">
              <UiInput
                v-model="editedItem.radiusMeter"
                label="Radius (meter)"
                placeholder="100"
                required
                type="number"
                :rules="[(v) => !!v || 'Wajib diisi', (v) => v > 0 || 'Harus lebih dari 0']"
                @update:modelValue="updateRadiusCircle"
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
        <UiButton color="secondary" @click="showDialog = false">Batal</UiButton>
        <UiButton color="primary" :loading="isLoadingSave" @click="onSubmit">Simpan</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import locationService from "@/services/location.service";
import institutionService from "@/services/institution.service";
import { useSwal } from "~/composables/useSwal";
import { useExcelExport } from "~/composables/useExcelExport";

definePageMeta({
  layout: "admin",
  permission: "LOCATION.VIEW",
});

const pageTitle = "Lokasi Presensi";
useHead({ title: pageTitle });

const route = useRoute();
const swal = useSwal();
const locationSvc = locationService();
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

const listInstitution = ref<any[]>([]);

// ==================== Map picker ====================
const mapPickerRef = ref<any>(null);
const isLocating = ref(false);
let mapInstance: any = null;
let LInstance: any = null;
let pickerMarker: any = null;
let radiusCircle: any = null;

const mapCenter = computed<[number, number]>(() => {
  const lat = parseFloat(editedItem.value?.latitude);
  const lng = parseFloat(editedItem.value?.longitude);
  if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  return [-7.433604, 112.433989]; // default center
});

const onMapReady = ({ map, L }: { map: any; L: any }) => {
  mapInstance = map;
  LInstance = L;

  // Place initial marker if coordinates exist
  if (editedItem.value.latitude && editedItem.value.longitude) {
    placeMarker(Number(editedItem.value.latitude), Number(editedItem.value.longitude));
  }

  // Click to pick location
  map.on('click', (e: any) => {
    const { lat, lng } = e.latlng;
    editedItem.value.latitude = lat.toFixed(7);
    editedItem.value.longitude = lng.toFixed(7);
    placeMarker(lat, lng);
  });
};

const placeMarker = (lat: number, lng: number) => {
  if (!mapInstance || !LInstance) return;

  if (pickerMarker) {
    pickerMarker.setLatLng([lat, lng]);
  } else {
    const icon = LInstance.divIcon({
      html: `<div style="width:20px;height:20px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      className: '',
    });
    pickerMarker = LInstance.marker([lat, lng], { icon, draggable: true }).addTo(mapInstance);
    pickerMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      editedItem.value.latitude = pos.lat.toFixed(7);
      editedItem.value.longitude = pos.lng.toFixed(7);
      updateRadiusCircle();
    });
  }

  updateRadiusCircle(lat, lng);
  mapInstance.setView([lat, lng], mapInstance.getZoom() < 15 ? 15 : mapInstance.getZoom());
};

const updateRadiusCircle = (lat?: number, lng?: number) => {
  if (!mapInstance || !LInstance) return;
  const cLat = lat ?? Number(editedItem.value.latitude);
  const cLng = lng ?? Number(editedItem.value.longitude);
  const radius = Number(editedItem.value.radiusMeter) || 100;
  if (isNaN(cLat) || isNaN(cLng)) return;

  if (radiusCircle) {
    radiusCircle.setLatLng([cLat, cLng]).setRadius(radius);
  } else {
    radiusCircle = LInstance.circle([cLat, cLng], {
      radius,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '6 4',
    }).addTo(mapInstance);
  }
};

const onCoordinateInput = () => {
  const lat = parseFloat(editedItem.value.latitude);
  const lng = parseFloat(editedItem.value.longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    placeMarker(lat, lng);
  }
};

const useCurrentLocation = () => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    swal.toast("Browser Anda tidak mendukung deteksi lokasi (Geolocation)", "error");
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      editedItem.value.latitude = lat.toFixed(7);
      editedItem.value.longitude = lng.toFixed(7);
      placeMarker(lat, lng);
      isLocating.value = false;
      swal.toast("Lokasi saat ini berhasil ditentukan", "success");
    },
    (err) => {
      isLocating.value = false;
      let msg = "Gagal mengambil lokasi saat ini.";
      if (err.code === err.PERMISSION_DENIED) {
        msg = "Izin lokasi ditolak. Silakan aktifkan izin GPS / lokasi pada browser Anda.";
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        msg = "Informasi lokasi tidak tersedia pada perangkat Anda.";
      } else if (err.code === err.TIMEOUT) {
        msg = "Waktu permintaan lokasi habis. Silakan coba lagi.";
      }
      swal.toast(msg, "error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
  );
};

const resetMapLayers = () => {
  pickerMarker?.remove();
  radiusCircle?.remove();
  pickerMarker = null;
  radiusCircle = null;
  mapInstance = null;
  LInstance = null;
};

// ==================== Data ====================
const defaultItem = {
  id: null as number | null,
  code: "",
  name: "",
  institutionId: null as number | null,
  latitude: "" as string | number,
  longitude: "" as string | number,
  radiusMeter: 100 as number,
  isActive: true,
};

const editedItem = ref<any>({ ...defaultItem });

const tableData = ref<any>({
  items: [],
  meta: { totalItems: 0 },
});

const tableTitle = computed(() => "Data Lokasi Presensi");
const dialogTitle = computed(() => isEditing.value ? "Ubah Lokasi Presensi" : "Tambah Lokasi Presensi");

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "code", title: "Kode", sortable: true },
  { key: "name", title: "Nama Lokasi", sortable: true },
  { key: "institutionName", title: "Institusi", sortable: true },
  { key: "coordinates", title: "Koordinat", sortable: false },
  { key: "radiusMeter", title: "Radius", sortable: true, align: "center" },
  { key: "isActive", title: "Status", align: "center" },
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
  { name: "", type: "text" as const, colMd: 5 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "Cari (Tekan Enter)",
    colMd: 4,
  },
]);

const actions = computed(() => [
  { key: "edit", icon: "mdi-pencil", color: "#f59e0b", tooltip: "Ubah", emit: "editItem" },
  { key: "delete", icon: "mdi-delete", color: "#ef4444", tooltip: "Hapus", emit: "deleteItem" },
]);

const actionToolbars = computed(() => [
  { key: "addItem", icon: "mdi-plus-circle-outline", color: "primary", tooltip: "Tambah", emit: "addItem", type: "default" as const },
  { key: "exportItem", icon: "mdi-file-excel", color: "white", tooltip: "Export", emit: "exportItem" },
]);

// ==================== Lifecycle ====================
onMounted(() => {
  loadAllInstitution();
});

async function loadAllInstitution() {
  await institutionSvc.retrieveAll()
    .then((res: any) => { if (res.data) listInstitution.value = res.data; })
    .catch((err: any) => console.error("Failed to load institutions", err));
}

async function loadAll() {
  const { pageNumber, pageSize, q, sortBy, sortType, institutionId } = route.query;
  isLoading.value = true;
  await locationSvc
    .retrieve({ q, pageSize: pageSize || itemPerPage.value, pageNumber: pageNumber || 1, sortBy, sortType, institutionId })
    .then((res: any) => {
      tableData.value = {
        items: res.data?.items ?? [],
        meta: res.data?.meta ?? { totalItems: 0 },
      };
    })
    .catch(() => {})
    .finally(() => { isLoading.value = false; });
}

function addItem() {
  isEditing.value = false;
  editedItem.value = { ...defaultItem };
  formRef.value?.reset();
  resetMapLayers();
  showDialog.value = true;
}

async function editItem(row: any) {
  formRef.value?.resetValidation();
  resetMapLayers();
  await locationSvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = {
        ...res.data,
        latitude: Number(res.data.latitude),
        longitude: Number(res.data.longitude),
        radiusMeter: Number(res.data.radiusMeter),
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
  resetMapLayers();
  showDialog.value = false;
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;
  locationSvc
    .save({
      ...editedItem.value,
      latitude: Number(editedItem.value.latitude),
      longitude: Number(editedItem.value.longitude),
      radiusMeter: Number(editedItem.value.radiusMeter),
    })
    .then(() => {
      swal.toast(isEditing.value ? "Data berhasil diperbarui" : "Data berhasil disimpan", "success");
      handleClose();
      loadAll();
    })
    .catch((err: any) => {
      isLoadingSave.value = false;
      console.error("Failed to save location", err);
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: `Apakah Anda yakin ingin menghapus lokasi "${row.name}"?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        locationSvc.destroy(row.id),
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
  const response: any = await locationSvc.retrieve({
    q, pageSize: 1, pageNumber: 1, sortBy, sortType, institutionId, ignorePaging: true,
  });
  const data = response.data?.items || [];

  await exportToExcel({
    data,
    filename: pageTitle,
    sheetName: pageTitle,
    headerOptions: { subtitle: pageTitle },
    columns: [
      { header: "Kode", key: "code", width: 20 },
      { header: "Nama Lokasi", key: "name", width: 35 },
      { header: "Institusi", key: "institutionName", width: 30 },
      { header: "Latitude", key: "latitude", width: 20 },
      { header: "Longitude", key: "longitude", width: 20 },
      { header: "Radius (m)", key: "radiusMeter", width: 15 },
      { header: "Status", key: "isActive", width: 15, formatter: (val: any) => val ? "Aktif" : "Nonaktif" },
    ],
  });
}
</script>

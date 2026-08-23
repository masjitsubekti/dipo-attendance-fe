<template>
  <UiModal
    :model-value="modelValue"
    :title="activeTab === 'detail' ? 'Detail Presensi Pegawai' : 'Maps Presensi'"
    size="2xl"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <!-- Modal Header Nav Tabs -->
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            @click="activeTab = 'detail'"
            :class="[
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'detail'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <i class="mdi mdi-account-details-outline text-base"></i>
            <span>Detail & Foto Presensi</span>
          </button>

          <button
            type="button"
            @click="switchToMapTab"
            :class="[
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <i class="mdi mdi-map-marker-radius text-base"></i>
            <span>Peta Lokasi</span>
          </button>
        </div>

        <div v-if="item" class="hidden sm:flex items-center gap-2">
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-xs border',
              getStatusBadgeClass(item.status, item.checkoutTime)
            ]"
          >
            {{ parseStatus(item.status, item.checkoutTime) }}
          </span>
        </div>
      </div>

      <!-- TAB 1: Detail & Foto Presensi -->
      <div v-if="activeTab === 'detail' && item" class="space-y-5 animate-fade-in">
        <!-- Photo Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Checkin Photo Card -->
          <div class="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <i class="mdi mdi-login text-base"></i> Presensi Masuk (IN)
              </span>
            </div>

            <div class="relative w-full max-w-[260px] h-48 mx-auto bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-2xs">
              <img
                v-if="item.checkinPhoto"
                :src="getPhotoUrl(item.checkinPhoto)"
                alt="Foto Masuk"
                class="w-full h-full object-cover"
              />
              <div v-else class="flex flex-col items-center text-slate-400 text-xs gap-1.5 p-4 text-center">
                <i class="mdi mdi-camera-off text-3xl text-slate-300 dark:text-slate-600"></i>
                <span>Tidak ada foto masuk</span>
              </div>
            </div>

            <div class="space-y-1.5 text-xs">
              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-clock-check-outline text-emerald-600"></i> Waktu Masuk:
                </span>
                <span class="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {{ formatTimeOnly(item.checkinTime) }}
                </span>
              </div>

              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-map-marker-outline text-blue-600"></i> Lokasi:
                </span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ item.checkinLocationName || 'Kantor' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-ruler-square text-amber-600"></i> Jarak GPS:
                </span>
                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {{ item.checkinDistanceMeter !== null && item.checkinDistanceMeter !== undefined ? Number(item.checkinDistanceMeter).toFixed(2) + ' m' : '—' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Checkout Photo Card -->
          <div class="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span class="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <i class="mdi mdi-logout text-base"></i> Presensi Pulang (OUT)
              </span>
            </div>

            <div class="relative w-full max-w-[260px] h-48 mx-auto bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-2xs">
              <img
                v-if="item.checkoutPhoto"
                :src="getPhotoUrl(item.checkoutPhoto)"
                alt="Foto Pulang"
                class="w-full h-full object-cover"
              />
              <div v-else class="flex flex-col items-center text-slate-400 text-xs gap-1.5 p-4 text-center">
                <i class="mdi mdi-camera-off text-3xl text-slate-300 dark:text-slate-600"></i>
                <span>Tidak ada foto pulang</span>
              </div>
            </div>

            <div class="space-y-1.5 text-xs">
              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-clock-check-outline text-blue-600"></i> Waktu Pulang:
                </span>
                <span :class="['font-mono font-bold text-sm', item.checkoutTime ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400']">
                  {{ item.checkoutTime ? formatTimeOnly(item.checkoutTime) : 'Belum Pulang' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-map-marker-outline text-blue-600"></i> Lokasi:
                </span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ item.checkoutLocationName || 'Kantor' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <i class="mdi mdi-ruler-square text-amber-600"></i> Jarak GPS:
                </span>
                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {{ item.checkoutDistanceMeter !== null && item.checkoutDistanceMeter !== undefined ? Number(item.checkoutDistanceMeter).toFixed(2) + ' m' : '—' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Information Table -->
        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <i class="mdi mdi-card-account-details-outline text-blue-600"></i> Informasi Presensi
          </h4>

          <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            <table class="w-full text-xs text-left border-collapse bg-white dark:bg-slate-800">
              <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80 w-1/4">NIP : </td>
                  <td class="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 w-1/4">{{ item.personNip || '—' }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80 w-1/4">Nama Pegawai : </td>
                  <td class="py-2.5 px-4 font-bold text-slate-900 dark:text-white w-1/4">{{ item.personName || '—' }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Jabatan : </td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{{ item.positionName || '—' }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Departemen : </td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{{ item.departmentName || '—' }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Institusi : </td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{{ item.institutionName || '—' }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Tanggal : </td>
                  <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{{ formatDateOnly(item.attendanceDate) }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Jenis Kehadiran : </td>
                  <td class="py-2.5 px-4 font-semibold text-blue-600 dark:text-blue-400">{{ parseAttendanceType(item.attendanceType) }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Lembur : </td>
                  <td colspan="3" class="py-2.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{{ formatMinutes(item.overtimeMinutes) }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Terlambat : </td>
                  <td class="py-2.5 px-4 font-semibold text-rose-600 dark:text-rose-400">{{ formatMinutes(item.lateMinutes) }}</td>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Pulang Cepat : </td>
                  <td class="py-2.5 px-4 font-semibold text-amber-600 dark:text-amber-400">{{ formatMinutes(item.earlyLeaveMinutes) }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">Status Presensi : </td>
                  <td class="py-2.5 px-4">
                    <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border', getStatusBadgeClass(item.status, item.checkoutTime)]">
                      {{ parseStatus(item.status, item.checkoutTime) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Action Button -->
        <div class="flex justify-end pt-2">
          <button
            type="button"
            @click="switchToMapTab"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <i class="mdi mdi-map-marker-radius text-base"></i>
            <span>Lihat Peta Presensi</span>
          </button>
        </div>
      </div>

      <!-- TAB 2: Peta Lokasi -->
      <div v-else-if="activeTab === 'map'" class="relative w-full h-[550px] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <UiMap
          v-if="isMapVisible && item"
          ref="mapRef"
          :center="mapCenter"
          :zoom="16"
          :show-layer-control="true"
          :fit-bounds-on-data="false"
          default-tile="street"
          style="height: 550px; width: 100%; min-height: 550px;"
          class="w-full h-[550px]"
          @ready="onMapReady"
        />

        <div v-else class="w-full h-[550px] flex items-center justify-center text-slate-400 text-sm">
          <i class="mdi mdi-map-outline text-3xl mr-2 animate-pulse text-blue-500"></i>
          <span>Memuat Peta Presensi...</span>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  item: any;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

const { formatDate } = useFormat();
const mapRef = ref<any>(null);
const activeTab = ref<"detail" | "map">("detail");
const isMapVisible = ref(false);

let mapInstance: any = null;
let LInstance: any = null;
let checkinMarker: any = null;
let checkoutMarker: any = null;

const mapCenter = computed<[number, number]>(() => {
  if (!props.item) return [-7.2980824, 112.779594];
  const lat = props.item.checkinLatitude || props.item.checkoutLatitude || -7.2980824;
  const lng = props.item.checkinLongitude || props.item.checkoutLongitude || 112.779594;
  return [Number(lat), Number(lng)];
});

const getPhotoUrl = (url: string | null | undefined) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const cleanPath = url.replace(/^\//, "");
  return `http://localhost:3333/${cleanPath}`;
};

const formatDateOnly = (val: any) => (val ? formatDate(val, "DD-MM-YYYY", true) : "—");
const formatTimeOnly = (val: any) => (val ? formatDate(val, "HH:mm", true) : "—");
const parseAttendanceType = (t: string | null) => (t ? t.toUpperCase() : "REGULAR");

const parseStatus = (status: string | null, checkoutTime?: any) => {
  if (!status && checkoutTime) return "Hadir";
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "present") return "Hadir";
  if (s === "late") return "Terlambat";
  if (s === "absent") return "Alpa";
  if (s === "leave") return "Izin / Cuti";
  if (s === "holiday") return "Hari Libur";
  if (s === "incomplete") return "Belum Pulang";
  return status;
};

const getStatusBadgeClass = (status: string | null, checkoutTime?: any) => {
  if (!status && checkoutTime) return "bg-emerald-600 text-white border-emerald-700";
  if (!status) return "bg-slate-500 text-white border-slate-600";
  const s = status.toLowerCase();
  if (s === "present") return "bg-emerald-600 text-white border-emerald-700";
  if (s === "late") return "bg-amber-500 text-white border-amber-600";
  if (s === "absent") return "bg-rose-600 text-white border-rose-700";
  if (s === "leave") return "bg-purple-600 text-white border-purple-700";
  if (s === "holiday") return "bg-slate-500 text-white border-slate-600";
  if (s === "incomplete") return "bg-orange-500 text-white border-orange-600";
  return "bg-slate-600 text-white border-slate-700";
};

const formatMinutes = (val: number | null | undefined) => {
  if (!val || val <= 0) return "—";
  if (val >= 60) {
    const hours = Math.floor(val / 60);
    const mins = val % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
  }
  return `${val}m`;
};

const switchToMapTab = () => {
  activeTab.value = "map";
  nextTick(() => {
    setTimeout(() => {
      isMapVisible.value = true;
    }, 150);
  });
};

const buildPopupHtml = (type: "checkin" | "checkout", photoUrl: string | null, lat: number, lng: number, locName: string) => {
  const item = props.item;
  if (!item) return "";
  const timeStr = type === "checkin" ? formatTimeOnly(item.checkinTime) : formatTimeOnly(item.checkoutTime);
  const dateStr = formatDateOnly(item.attendanceDate);
  const dist = type === "checkin" ? item.checkinDistanceMeter : item.checkoutDistanceMeter;

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; gap: 12px; padding: 4px; width: 440px; text-align: left; color: #1e293b;">
      <div style="width: 130px; flex-shrink: 0;">
        ${
          photoUrl
            ? `<img src="${photoUrl}" style="width: 130px; height: 170px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" />`
            : `<div style="width: 130px; height: 170px; background: #f1f5f9; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; text-align: center; padding: 6px;"><i class="mdi mdi-camera-off" style="font-size: 24px;"></i><span>Tidak ada foto ${type === 'checkin' ? 'masuk' : 'pulang'}</span></div>`
        }
      </div>
      <div style="flex: 1; font-size: 11px; line-height: 1.5; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="font-weight: 600; width: 85px; color: #64748b; white-space: nowrap; padding-bottom: 2px;">NIP</td><td style="width: 8px; padding-bottom: 2px;">:</td><td style="font-family: monospace; font-weight: 700; color: #0f172a; padding-bottom: 2px;">${item.personNip || '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Nama</td><td style="padding-bottom: 2px;">:</td><td style="font-weight: 700; color: #0f172a; padding-bottom: 2px;">${item.personName || '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Jabatan</td><td style="padding-bottom: 2px;">:</td><td style="color: #334155; padding-bottom: 2px;">${item.positionName || '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Departemen</td><td style="padding-bottom: 2px;">:</td><td style="color: #334155; padding-bottom: 2px;">${item.departmentName || '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Institusi</td><td style="padding-bottom: 2px;">:</td><td style="color: #334155; padding-bottom: 2px;">${item.institutionName || '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Jenis</td><td style="padding-bottom: 2px;">:</td><td style="font-weight: 600; color: #2563eb; padding-bottom: 2px;">${parseAttendanceType(item.attendanceType)}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Attendance</td><td style="padding-bottom: 2px;">:</td><td style="font-weight: 600; color: #0f172a; padding-bottom: 2px;">${dateStr} ${timeStr}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Status</td><td style="padding-bottom: 2px;">:</td><td style="font-weight: 700; color: #0284c7; padding-bottom: 2px;">${type === 'checkin' ? 'MASUK' : 'PULANG'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Jarak GPS</td><td style="padding-bottom: 2px;">:</td><td style="padding-bottom: 2px;">${dist !== null && dist !== undefined ? Number(dist).toFixed(1) + ' m' : '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Latitude</td><td style="padding-bottom: 2px;">:</td><td style="font-family: monospace; padding-bottom: 2px;">${lat ? Number(lat).toFixed(7) : '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; padding-bottom: 2px;">Longitude</td><td style="padding-bottom: 2px;">:</td><td style="font-family: monospace; padding-bottom: 2px;">${lng ? Number(lng).toFixed(7) : '—'}</td></tr>
          <tr><td style="font-weight: 600; color: #64748b; white-space: nowrap; vertical-align: top;">Lokasi</td><td style="vertical-align: top;">:</td><td style="font-weight: 600; color: #0f172a;">${locName || 'Kantor'}</td></tr>
        </table>
      </div>
    </div>
  `;
};

const renderMarkers = () => {
  if (!mapInstance || !LInstance || !props.item) return;

  if (checkinMarker) { mapInstance.removeLayer(checkinMarker); checkinMarker = null; }
  if (checkoutMarker) { mapInstance.removeLayer(checkoutMarker); checkoutMarker = null; }

  const item = props.item;
  const bounds: [number, number][] = [];
  const popupOptions = {
    maxWidth: 500,
    minWidth: 440,
    autoPan: true,
    autoPanPadding: [60, 60],
  };

  const defaultIcon = LInstance.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (item.checkinLatitude && item.checkinLongitude) {
    const coords: [number, number] = [Number(item.checkinLatitude), Number(item.checkinLongitude)];
    bounds.push(coords);

    checkinMarker = LInstance.marker(coords, { icon: defaultIcon }).addTo(mapInstance);
    checkinMarker.bindTooltip(`Masuk (IN): ${formatTimeOnly(item.checkinTime)}`, { permanent: false, direction: 'top' });
    checkinMarker.bindPopup(buildPopupHtml("checkin", item.checkinPhoto, item.checkinLatitude, item.checkinLongitude, item.checkinLocationName), popupOptions);
  }

  if (item.checkoutLatitude && item.checkoutLongitude) {
    const coords: [number, number] = [Number(item.checkoutLatitude), Number(item.checkoutLongitude)];
    bounds.push(coords);

    checkoutMarker = LInstance.marker(coords, { icon: defaultIcon }).addTo(mapInstance);
    checkoutMarker.bindTooltip(`Pulang (OUT): ${formatTimeOnly(item.checkoutTime)}`, { permanent: false, direction: 'top' });
    checkoutMarker.bindPopup(buildPopupHtml("checkout", item.checkoutPhoto, item.checkoutLatitude, item.checkoutLongitude, item.checkoutLocationName), popupOptions);
  }

  if (bounds.length > 1) {
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
  } else if (bounds.length === 1) {
    mapInstance.setView(bounds[0], 17);
  }

  [100, 300, 600, 1000].forEach((d) => {
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, d);
  });
};

const onMapReady = ({ map, L }: { map: any; L: any }) => {
  mapInstance = map;
  LInstance = L;
  renderMarkers();
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      activeTab.value = "detail";
      isMapVisible.value = false;
    } else {
      activeTab.value = "detail";
      isMapVisible.value = false;
      mapInstance = null;
      LInstance = null;
    }
  },
  { immediate: true }
);

watch(
  () => props.item,
  () => {
    if (mapInstance && LInstance) {
      renderMarkers();
    }
  },
  { deep: true }
);
</script>

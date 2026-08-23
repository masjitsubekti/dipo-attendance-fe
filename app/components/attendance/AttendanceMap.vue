<script setup lang="ts">
/**
 * AttendanceMap.vue
 * Interactive Leaflet map with attendance markers & real-time user position:
 * - Institution location marker + radius circle (blue)
 * - User position marker (pulsing green if within radius, pulsing red if out of radius)
 * - Auto-fit bounds & re-center action button
 * - Info card with live distance + inside/outside radius indicator
 */

interface Props {
  institutionLat: number;
  institutionLon: number;
  radiusMeter: number;
  locationName: string;
  userLat: number | null;
  userLon: number | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { loading: false });

// ==================== Distance calculation ====================
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const estimatedDistance = computed(() => {
  if (props.userLat === null || props.userLon === null) return null;
  return haversineDistance(props.institutionLat, props.institutionLon, props.userLat, props.userLon);
});

const isNoRadiusLimit = computed(() => !props.radiusMeter || Number(props.radiusMeter) === 0);

const isWithinRadius = computed(() => {
  if (isNoRadiusLimit.value) return true;
  if (estimatedDistance.value === null) return null;
  return estimatedDistance.value <= props.radiusMeter;
});

// ==================== Map ready & markers ====================
const mapRef = ref<any>(null);
let mapInstance: any = null;
let LInstance: any = null;
let userMarker: any = null;
let institutionMarker: any = null;
let radiusCircle: any = null;

const onMapReady = ({ map, L }: { map: any; L: any }) => {
  if (!map || !L) return;
  mapInstance = map;
  LInstance = L;

  // Institution marker (custom pin)
  const instIcon = L.divIcon({
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 0;
      background:linear-gradient(135deg,#3b82f6,#6366f1);
      border:3px solid white;transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:10px;height:10px;background:white;border-radius:50%;"></div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    className: '',
  });

  institutionMarker = L.marker([props.institutionLat, props.institutionLon], { icon: instIcon })
    .addTo(map)
    .bindTooltip(props.locationName, { permanent: false, direction: 'top' });

  // Radius circle
  radiusCircle = L.circle([props.institutionLat, props.institutionLon], {
    radius: props.radiusMeter,
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '6 4',
  }).addTo(map);

  // Initial user marker render
  updateUserMarker();
  fitMapBounds();
};

const updateUserMarker = () => {
  if (!mapInstance || !LInstance) return;
  if (props.userLat === null || props.userLon === null) return;

  const lat = props.userLat;
  const lon = props.userLon;
  const inside = isWithinRadius.value ?? true;

  const mainColor = inside ? '#10b981' : '#ef4444'; // green if inside, red if outside
  const pulseRgba = inside ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';

  const userIcon = LInstance.divIcon({
    html: `<div style="position:relative;width:28px;height:28px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${pulseRgba};
        animation:userPulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>
      <div style="
        position:absolute;inset:5px;border-radius:50%;
        background:${mainColor};border:2.5px solid white;
        box-shadow:0 2px 8px ${inside ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)'};
      "></div>
    </div>
    <style>@keyframes userPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.7)}}</style>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: '',
  });

  const tooltipText = inside
    ? `📍 Posisi Anda (${estimatedDistance.value ?? 0}m - Dalam Radius)`
    : `⚠️ Posisi Anda (${estimatedDistance.value ?? 0}m - Di luar Radius)`;

  if (userMarker) {
    userMarker.setLatLng([lat, lon]);
    userMarker.setIcon(userIcon);
    userMarker.setTooltipContent(tooltipText);
  } else {
    userMarker = LInstance.marker([lat, lon], { icon: userIcon })
      .addTo(mapInstance)
      .bindTooltip(tooltipText, { direction: 'top' });
  }
};

const fitMapBounds = () => {
  if (!mapInstance || !LInstance) return;
  const points: [number, number][] = [[props.institutionLat, props.institutionLon]];
  if (props.userLat !== null && props.userLon !== null) {
    points.push([props.userLat, props.userLon]);
  }

  if (points.length === 1) {
    mapInstance.setView(points[0], 17);
  } else {
    const bounds = LInstance.latLngBounds(points);
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
  }
};

// Watch for GPS position changes
watch([() => props.userLat, () => props.userLon], () => {
  updateUserMarker();
}, { immediate: true });

// Watch for institution location changes (e.g. after updating master location or fetching new today data)
watch([() => props.institutionLat, () => props.institutionLon, () => props.radiusMeter, () => props.locationName], () => {
  if (!mapInstance || !LInstance) return;
  if (institutionMarker) {
    institutionMarker.setLatLng([props.institutionLat, props.institutionLon]);
    institutionMarker.setTooltipContent(props.locationName);
  }
  if (radiusCircle) {
    radiusCircle.setLatLng([props.institutionLat, props.institutionLon]);
    radiusCircle.setRadius(props.radiusMeter);
  }
  updateUserMarker();
});

onUnmounted(() => {
  userMarker?.remove();
  institutionMarker?.remove();
  radiusCircle?.remove();
  mapInstance = null;
  LInstance = null;
});
</script>

<template>
  <div class="mx-4 mt-4">
    <!-- Map container -->
    <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <!-- Map -->
      <div class="relative h-56">
        <div v-if="loading" class="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <i class="mdi mdi-map-outline text-4xl text-slate-400 dark:text-slate-600"></i>
        </div>
        <UiMap
          v-else
          ref="mapRef"
          :center="[institutionLat, institutionLon]"
          :zoom="17"
          :show-layer-control="false"
          :fit-bounds-on-data="false"
          default-tile="street"
          @ready="onMapReady"
          class="w-full h-full"
        />

        <!-- Recenter button -->
        <button
          v-if="userLat !== null"
          type="button"
          @click="fitMapBounds"
          class="absolute bottom-3 right-3 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all active:scale-95"
          title="Fokuskan Lokasi"
        >
          <i class="mdi mdi-crosshairs-gps text-blue-500"></i>
          <span>Fokus Lokasi</span>
        </button>
      </div>

      <!-- Info card -->
      <div class="p-4 space-y-2">
        <!-- Location name -->
        <div class="flex items-center gap-2">
          <i class="mdi mdi-map-marker text-blue-600 dark:text-blue-400 text-base"></i>
          <span class="text-sm font-semibold text-slate-800 dark:text-white">{{ locationName }}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400 ml-auto">
            {{ isNoRadiusLimit ? 'Tanpa Radius (Bebas)' : `Radius ${radiusMeter}m` }}
          </span>
        </div>

        <!-- Distance + Status -->
        <div v-if="userLat !== null" class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Jarak Anda</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">
              {{ estimatedDistance !== null ? `${estimatedDistance} m` : '—' }}
            </p>
          </div>

          <!-- Status pill -->
          <div>
            <div
              v-if="isNoRadiusLimit"
              class="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700/40 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <i class="mdi mdi-earth text-sm"></i>
              <span>Bebas Radius</span>
            </div>
            <div
              v-else-if="isWithinRadius"
              class="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <i class="mdi mdi-check-circle text-sm"></i>
              <span>Dalam area</span>
            </div>
            <div
              v-else
              class="flex items-center gap-1.5 bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700/40 text-rose-700 dark:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <i class="mdi mdi-close-circle text-sm"></i>
              <span>Di luar area</span>
            </div>
          </div>
        </div>

        <!-- GPS loading -->
        <div v-else class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <i class="mdi mdi-crosshairs-gps text-sm animate-pulse text-blue-500"></i>
          <span class="text-xs">Mendeteksi lokasi Anda...</span>
        </div>
      </div>
    </div>
  </div>
</template>

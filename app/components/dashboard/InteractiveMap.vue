<template>
  <div 
    ref="containerRef" 
    class="relative w-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group"
    :class="mode === 'web' ? 'h-[calc(100vh-178px)] rounded-xl' : 'h-screen'"
  >
    <div id="interactive-map" class="w-full h-full z-0"></div>

    <Transition name="imap-fade">
      <div v-if="isMapLoading" class="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div class="imap-loader"></div>
        <p class="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">Loading Map...</p>
      </div>
    </Transition>

    <!-- Fullscreen Header -->
    <div 
      v-if="isFullscreen || mode === 'fullmap'"
      class="absolute top-0 left-15 right-0 z-[900] p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"
    >
      <h1 class="text-white text-2xl font-bold drop-shadow-md">Dashboard Map Monitoring</h1>
      <p class="text-white/80 text-md drop-shadow-sm">{{ mode == 'web' ? 'Real-time interactive map monitoring' :  'PT. Ajinomoto Indonesia'}}</p>
    </div>

    <!-- Left Controls -->
    <div class="absolute z-1000 flex flex-col gap-2 top-21 left-3">
      <button
        @click="toggleFullscreen"
        class="py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
      >
        <i
          class="text-slate-600 dark:text-slate-300 mdi"
          :class="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
        ></i>
      </button>

      <!-- Auto-rotate toggle -->
      <button
        @click="toggleAutoRotate"
        class="py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        :class="{ 'ring-2 ring-blue-400': autoRotateEnabled }"
        :title="autoRotateEnabled ? 'Pause Auto Rotate' : 'Start Auto Rotate'"
      >
        <i
          class="text-slate-600 dark:text-slate-300 mdi"
          :class="autoRotateEnabled ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"
        ></i>
      </button>
    </div>

    <!-- Top Right Controls -->
    <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button 
        v-if="!showStatsCard"
        @click="showStatsCard = true"
        class="py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="Show Statistics"
      >
        <i class="mdi mdi-menu text-slate-600 dark:text-slate-300"></i>
      </button>
    </div>

    <!-- Floating Stats Card (Top Right) with Auto-scroll -->
    <DashboardMapStatsCard
      ref="statsCardRef"
      v-model:show="showStatsCard"
      v-model:searchQuery="searchQuery"
      :totalEmployees="totalEmployees"
      :filteredAreas="filteredAreas"
      :mapPieData="mapPieData"
      :listMaxHeightClass="listMaxHeightClass"
      :setAreaItemRef="setAreaItemRef"
      @pause-scroll="pauseAutoScrollOnInteraction"
      @resume-scroll="resumeAutoScrollAfterInteraction"
      @focus-area="focusArea"
    />

    <!-- Scroll Progress Bar -->
    <!-- <div 
      v-if="autoRotateEnabled" 
      class="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] items-center gap-3 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 dark:border-slate-700"
    >
      <i class="mdi mdi-format-list-text text-slate-500 dark:text-slate-400 text-sm"></i>
      <div class="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          class="h-full bg-blue-500 rounded-full imap-progress-bar"
          :style="{ width: `${scrollProgress}%` }"
        ></div>
      </div>
      <span class="text-[10px] text-slate-400 tabular-nums">{{ visibleWorkAreaIds.size }} area</span>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import { useTheme } from "~/composables/useTheme";

interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  permanentCount: number;
  outsourceCount: number;
  contractorCount: number;
  visitorCount: number;
  totalCount: number;
}

interface AreaData {
  id: string;
  workAreaId?: number;
  name: string;
  regular: number;
  outsourcing: number;
  contractor: number;
  visitor: number;
  total: number;
  coordinates: [number, number][];
  rawGeoJson?: any;
  departments: Department[];
  centroid?: [number, number] | null;
  lat?: number;
  lng?: number;
  groupArea?: string;
  popupSeq?: number;
}

interface WorkAreaStat {
  id: number;
  name: string;
  regular: number;
  outsourcing: number;
  contractor: number;
  visitor: number;
  total: number;
  groupArea?: string;
  popupSeq?: number;
}

interface PersonnelTypeStat {
  label: string;
  count: number;
  percentage?: number;
}

interface Props {
  mapAreaData?: any[];
  workAreaData?: any[];
  personnelTypeData?: any[];
  scrollSpeed?: number;
  mode?: 'web' | 'fullmap';
}

const props = withDefaults(defineProps<Props>(), {
  mapAreaData: () => [],
  workAreaData: () => [],
  personnelTypeData: () => [],
  scrollSpeed: 30,
  mode: 'web',
});

const { isDark } = useTheme();

const containerRef = ref<HTMLElement | null>(null);
const statsCardRef = ref<any>(null);
const statsListRef = computed<HTMLElement | null>(() => statsCardRef.value?.statsListRef || null);
const map = ref<L.Map | null>(null);
const areaLayers: any[] = [];
let labelLayerGroup: any = null;
const labelMarkers: any[] = [];

const showStatsCard = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
const searchQuery = ref('');
const areas = ref<AreaData[]>([]);
const workAreaStats = ref<WorkAreaStat[]>([]);
const personnelTypeStats = ref<PersonnelTypeStat[]>([]);
const CENTER: [number, number] = [-7.433604, 112.433989];
const isInitialLoad = ref(true);
const isMapLoading = ref(true);
const isFullscreen = ref(false);

const autoRotateEnabled = ref(true);
const scrollProgress = ref(0);
const visibleLabelIds = ref<Set<string>>(new Set());
const visibleWorkAreaIds = ref<Set<number>>(new Set());
const areaItemRefs: Record<number, HTMLElement | null> = {};
const userInteracting = ref(false);

let scrollAnimFrame: number | null = null;
let scrollObserver: IntersectionObserver | null = null;
let scrollPauseTimeout: ReturnType<typeof setTimeout> | null = null;
let isScrollPaused = false;

let labelReapplyTimer: ReturnType<typeof setTimeout> | null = null;
let labelTransitionInTimer: ReturnType<typeof setTimeout> | null = null;
const isLabelTransitioning = ref(false);
const labelCycleTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const currentCycleIndex = ref(0);

// Focus area state: prevents zoom/move handlers from interfering
let isFocusingArea = false;
let focusResetTimer: ReturnType<typeof setTimeout> | null = null;
let focusedLayerAreaIds: string[] = [];

const listMaxHeightClass = computed(() => {
  if (isFullscreen.value) return 'max-h-[calc(100vh-372px)]';
  return props.mode === 'web' ? 'max-h-[calc(100vh-550px)]' : 'max-h-[calc(100vh-372px)]';
});

const mapPieData = computed(() => {
  const totalRegular = personnelTypeStats.value.find(s => s.label === 'PERMANENT')?.count || 0;
  const totalOutsourcing = personnelTypeStats.value.find(s => s.label === 'OUTSOURCING')?.count || 0;
  const totalContractor = personnelTypeStats.value.find(s => s.label === 'CONTRACTOR')?.count || 0;
  const totalVisitor = personnelTypeStats.value.find(s => s.label === 'VISITOR')?.count || 0;

  return [
    { label: 'Regular', count: totalRegular },
    { label: 'Outsourcing', count: totalOutsourcing },
    { label: 'Contractor', count: totalContractor },
    { label: 'Visitor', count: totalVisitor }
  ];
});

const totalEmployees = computed(() => {
  return personnelTypeStats.value.reduce((sum, stat) => sum + stat.count, 0);
});

const sortedAreas = computed(() => {
  return [...workAreaStats.value].sort((a, b) => b.total - a.total);
});

const filteredAreas = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return sortedAreas.value;
  return sortedAreas.value.filter(area => area.name.toLowerCase().includes(q));
});

const workAreaToAreaIds = computed(() => {
  const map = new Map<number, string[]>();
  areas.value.forEach(a => {
    if (a.workAreaId) {
      const existing = map.get(a.workAreaId) || [];
      existing.push(a.id);
      map.set(a.workAreaId, existing);
    }
  });
  return map;
});

function setAreaItemRef(el: any, index: number) {
  areaItemRefs[index] = el as HTMLElement;
}

function isAreaHighlighted(area: WorkAreaStat): boolean {
  return visibleWorkAreaIds.value.has(area.id);
}

function getDensityColor(total: number): string {
  // if (total > 100) return "#2563EB"; 
  // if (total > 50) return "#F97316";
  return "#FACC15";
}

function getDensityColorText(total: number): string {
  if (total > 100) return "text-blue-600 dark:text-blue-400";
  if (total > 50) return "text-orange-500";
  return "text-yellow-500";
}

function getPolygonCentroid(geometry: any, lat?: number, lng?: number): [number, number] | null {
  if (lat && lng) return [lat, lng];
  if (!geometry || !geometry.coordinates) return null;
  const type = geometry.type;
  let ring: any[] = [];

  if (type === 'Polygon') {
    ring = geometry.coordinates[0];
  } else if (type === 'MultiPolygon') {
    ring = geometry.coordinates[0][0];
  } else {
    return null;
  }

  if (!ring || ring.length === 0) return null;

  let sumLat = 0, sumLng = 0;
  for (const coord of ring) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  return [sumLat / ring.length, sumLng / ring.length];
}

function getFeatureBBoxArea(feature: any): number {
  if (!feature.geometry) return 0;
  const type = feature.geometry.type;
  const coords: any = feature.geometry.coordinates;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  const updateBounds = (pt: any) => {
    if (!Array.isArray(pt) || pt.length < 2) return;
    const x = pt[0];
    const y = pt[1];
    if (typeof x === 'number' && typeof y === 'number') {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };

  const processRing = (ring: any[]) => {
    if (!ring) return;
    ring.forEach(pt => updateBounds(pt));
  };

  if (type === 'Polygon') {
    processRing(coords[0]);
  } else if (type === 'MultiPolygon') {
    coords.forEach((poly: any[]) => processRing(poly[0]));
  } else {
    return 0;
  }

  if (minX === Infinity || minY === Infinity) return 0;
  return (maxX - minX) * (maxY - minY);
}

// ==================== Map Initialization ====================
let L: any = null;
const geoJsonLayer = ref<L.GeoJSON | null>(null);

async function initMap() {
  if (typeof window === 'undefined') return;
  L = (await import('leaflet')).default;

  map.value = L.map('interactive-map', {
    center: CENTER,
    zoom: 18,
    minZoom: 16,
    zoomControl: true,
    attributionControl: true
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});
  
  if (map.value) {
    satelliteLayer.addTo(map.value);
    map.value.on('zoomend', onZoomEnd);
    map.value.on('moveend', debouncedReapplyLabels);
    map.value.on('zoomstart', onZoomStart);
    map.value.on('movestart', onMoveStart);

    renderAreas();
  }
}

// ==================== Data Processing ====================

/**
 * Track whether polygons have been rendered at least once.
 * After the first render, subsequent data updates only refresh counts in-place.
 */
let polygonsRendered = false;

function processData(mapData: any[], statsData: any[], personnelTypeData: any[]) {
  if (statsData.length > 0) {
    workAreaStats.value = statsData.map((item: any) => ({
      id: item.workAreaId,
      name: item.workAreaName,
      regular: item.permanentCount || 0,
      outsourcing: item.outsourceCount || 0,
      contractor: item.contractorCount || 0,
      visitor: item.visitorCount || 0,
      total: item.totalCount || 0,
      groupArea: item.groupArea || item.group_area || "",
      popupSeq: item.popupSeq || item.popup_seq || 0
    }));
  }

  if (personnelTypeData.length > 0) {
    personnelTypeStats.value = personnelTypeData.map((item: any) => ({
      label: item.label,
      count: item.count || 0,
      percentage: item.percentage || 0,
    }));
  }

  if (mapData.length > 0) {
    if (!polygonsRendered) {
      // First time: full parse including geojson
      areas.value = mapData.map((item: any) => {
        let geojson = item.geojson;
        try {
          if (typeof geojson === 'string') {
            geojson = JSON.parse(geojson);
          }
        } catch (e) {
          console.error("Error parsing geojson for item", item.id, e);
          geojson = null;
        }

        let coords: [number, number][] = [];
        const geometry = geojson?.geometry || geojson;

        if (geometry?.coordinates) {
          const type = geometry.type;
          let rawCoords: any[] = [];

          if (type === 'MultiPolygon') {
            rawCoords = geometry.coordinates[0][0];
          } else if (type === 'Polygon') {
            rawCoords = geometry.coordinates[0];
          } else if (type === 'Point') {
            if (Array.isArray(geometry.coordinates)) {
              coords = [[geometry.coordinates[1], geometry.coordinates[0]]];
            }
          }

          if (type !== 'Point' && Array.isArray(rawCoords)) {
            coords = rawCoords.map((c: any) => [c[1], c[0]]);
          }
        }

        // Pre-compute and cache centroid
        const lat = item.lat || item.latitude;
        const lng = item.lng || item.longitude;
        const centroid = geometry ? getPolygonCentroid(geometry, lat, lng) : null;

        return {
          id: item.id?.toString(),
          workAreaId: item.workAreaId,
          name: item.name,
          regular: item.permanentCount || 0,
          outsourcing: item.outsourceCount || 0,
          contractor: item.contractorCount || 0,
          visitor: item.visitorCount || 0,
          total: item.totalCount || 0,
          coordinates: coords,
          rawGeoJson: geometry,
          departments: item.departments || [],
          centroid,
          lat,
          lng,
          groupArea: item.groupArea || item.group_area || "",
          popupSeq: item.popupSeq || item.popup_seq || 0,
          isVisible: geojson?.properties?.isVisible ?? true
        };
      }).filter((a: any) => a.rawGeoJson && a.isVisible);

      renderAreas();
      polygonsRendered = true;
    } else {
      // Subsequent refreshes: only update count fields (skip geojson re-parsing)
      const incomingLookup = new Map<string, any>();
      mapData.forEach(item => incomingLookup.set(item.id?.toString(), item));

      let needsFullRerender = false;
      
      areas.value.forEach((area:any) => {
        const item = incomingLookup.get(area.id);
        if (item) {
          area.regular = item.permanentCount || 0;
          area.outsourcing = item.outsourceCount || 0;
          area.contractor = item.contractorCount || 0;
          area.visitor = item.visitorCount || 0;
          area.total = item.totalCount || 0;
          area.departments = item.departments || [];
          area.groupArea = item.groupArea || item.group_area || "";
          area.popupSeq = item.popupSeq || item.popup_seq || 0;

          // Check if visibility changed
          let geojson = item.geojson;
          try {
            if (typeof geojson === 'string') geojson = JSON.parse(geojson);
            const nextVisible = geojson?.properties?.isVisible ?? true;
            if (area.isVisible !== nextVisible) {
              area.isVisible = nextVisible;
              needsFullRerender = true;
            }
          } catch (e) {}
        }
      });

      if (needsFullRerender) {
        // Filter ulang area yang visible saja
        areas.value = areas.value.filter((a:any) => a.isVisible);
        renderAreas();
      } else {
        updateCountsInPlace();
      }
    }
  }
}

/**
 * Build tooltip HTML for a given area data.
 * Extracted to avoid code duplication between renderAreas and updateCountsInPlace.
 */
function buildTooltipContent(area: AreaData): string {
  const dark = isDark.value;
  const bgColor = dark ? '#1e293b' : '#ffffff';
  const textPrimary = dark ? '#e2e8f0' : '#334155';
  const textSecondary = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? '#334155' : '#e2e8f0';
  const densityColor = getDensityColor(area.total);

  const departments = area.departments || [];
  const deptRows = departments.length > 0
    ? departments.map((dept: any) => `
        <div style="padding: 6px 0; border-top: 1px solid ${borderColor};">
          <div style="margin-bottom: 2px;">
            <span style="font-size: 13px; font-weight: 600; color: ${textSecondary};">${dept.departmentName}</span>
            <p style="font-size: 13px; font-weight: 700; color: ${textSecondary};">Total: ${dept.totalCount}</p>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; color: ${textSecondary};">
            <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #3B82F6; font-size: 14px;"></i> ${dept.permanentCount}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #22C55E; font-size: 14px;"></i> ${dept.outsourceCount}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #F97316; font-size: 14px;"></i> ${dept.contractorCount}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #EF4444; font-size: 14px;"></i> ${dept.visitorCount}</span>
          </div>
        </div>
      `).join('')
    : `<div style="padding: 8px 0; border-top: 1px solid ${borderColor}; text-align: center;">
          <i class="mdi mdi-information-outline" style="color: ${textSecondary}; font-size: 16px;"></i>
          <p style="font-size: 12px; color: ${textSecondary}; margin-top: 2px;">Tidak ada data department</p>
        </div>`;

  return `
    <div style="padding: 5px 10px; min-width: 240px; background: ${bgColor}; border-radius: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 13px; font-weight: 600; color: ${textPrimary};">${area.name}</span>
        <span style="font-size: 20px; font-weight: 700; color: ${textPrimary}">${area.total}</span>
      </div>
      <div>
        ${deptRows}
      </div>
    </div>
  `;
}

/**
 * Update counts in-place without rebuilding polygons.
 * - Updates polygon density color & style
 * - Rebinds tooltip content with fresh data
 * - Rebuilds label markers (lightweight, labels only)
 */
function updateCountsInPlace() {
  if (!map.value || !L) return;

  const areaLookup = new Map<string, AreaData>();
  areas.value.forEach(a => areaLookup.set(a.id, a));

  areaLayers.forEach((layer: any) => {
    const areaId = layer._areaId;
    const area = areaLookup.get(areaId);
    if (!area) return;

    const isFactory = area.name?.toUpperCase() === 'PT. AJINOMOTO';
    if (isFactory) return;

    const newColor = getDensityColor(area.total);
    layer.setStyle({
      color: newColor,
      fillColor: newColor,
    });

    if (layer.feature?.properties) {
      layer.feature.properties.total = area.total;
      layer.feature.properties.regular = area.regular;
      layer.feature.properties.outsourcing = area.outsourcing;
      layer.feature.properties.contractor = area.contractor;
      layer.feature.properties.visitor = area.visitor;
      layer.feature.properties.departments = area.departments;
      layer.feature.properties.densityColor = newColor;
    }

    const tooltipContent = buildTooltipContent(area);
    layer.unbindTooltip();
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: "top",
      className: "imap-heatmap-tooltip",
      opacity: 0.95,
    });
  });

  rebuildLabelMarkers(true);
}

// ==================== Rendering ====================

let pendingRender = false;

/**
 * Safely remove a layer from the map, handling cases where
 * zoom animations are still referencing the layer.
 */
function safeRemoveLayer(layerToRemove: any) {
  if (!layerToRemove || !map.value) return;
  try {
    layerToRemove.off();
    if (typeof layerToRemove.clearLayers === 'function') {
      layerToRemove.clearLayers();
    }
    if (map.value.hasLayer(layerToRemove)) {
      map.value.removeLayer(layerToRemove);
    }
  } catch (e) {
    // Silently ignore removal errors during animation
  }
}

function renderAreas() {
  if (!map.value || !L) return;

  if ((map.value as any)._animatingZoom) {
    pendingRender = true;
    return;
  }

  safeRemoveLayer(geoJsonLayer.value);
  geoJsonLayer.value = null;
  areaLayers.length = 0;

  safeRemoveLayer(labelLayerGroup);
  labelLayerGroup = null;
  labelMarkers.length = 0;

  const features = areas.value.map(area => ({
    type: 'Feature',
    properties: {
      id: area.id,
      workAreaId: area.workAreaId,
      name: area.name,
      regular: area.regular,
      outsourcing: area.outsourcing,
      contractor: area.contractor,
      visitor: area.visitor,
      total: area.total,
      departments: area.departments,
      densityColor: getDensityColor(area.total)
    },
    geometry: area.rawGeoJson || {
      type: 'Polygon',
      coordinates: area.coordinates
    }
  })).filter((f: any) => f.geometry?.type === 'Polygon');

  features.sort((a, b) => getFeatureBBoxArea(b) - getFeatureBBoxArea(a));

  const layer = L.geoJSON(features as any, {
    pointToLayer: (_feature: any, latlng: any) => {
      return L.circleMarker(latlng, {
        radius: 0, opacity: 0, fillOpacity: 0
      });
    },
    style: (feature: any) => {
      const p = feature.properties;
      const isFactory = p.name.toUpperCase() === 'PT. AJINOMOTO';
      return {
        color: p.densityColor,
        fillColor: isFactory ? 'transparent' : p.densityColor,
        fillOpacity: isFactory ? 0 : 0.6,
        weight: 2,
        opacity: 1
      };
    },
    onEachFeature: (feature: any, layer: any) => {
      const p = feature.properties;
      const isFactory = p.name?.toUpperCase() === 'PT. AJINOMOTO';
      if (isFactory) return;

      const dark = isDark.value;
      const bgColor = dark ? '#1e293b' : '#ffffff';
      const textPrimary = dark ? '#e2e8f0' : '#334155';
      const textSecondary = dark ? '#94a3b8' : '#64748b';
      const borderColor = dark ? '#334155' : '#e2e8f0';

      const departments = p.departments || [];
      const deptRows = departments.length > 0
        ? departments.map((dept: any) => `
          <div style="padding: 6px 0; border-top: 1px solid ${borderColor};">
            <div style="margin-bottom: 2px;">
              <span style="font-size: 13px; font-weight: 600; color: ${textSecondary};">${dept.departmentName}</span>
              <p style="font-size: 13px; font-weight: 700; color: ${textSecondary};">Total: ${dept.totalCount}</p>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; color: ${textSecondary};">
              <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #3B82F6; font-size: 14px;"></i> ${dept.permanentCount}</span>
              <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #22C55E; font-size: 14px;"></i> ${dept.outsourceCount}</span>
              <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #F97316; font-size: 14px;"></i> ${dept.contractorCount}</span>
              <span style="display: flex; align-items: center; gap: 3px;"><i class="mdi mdi-account" style="color: #EF4444; font-size: 14px;"></i> ${dept.visitorCount}</span>
            </div>
          </div>
        `).join('')
        : `<div style="padding: 8px 0; border-top: 1px solid ${borderColor}; text-align: center;">
            <i class="mdi mdi-information-outline" style="color: ${textSecondary}; font-size: 16px;"></i>
            <p style="font-size: 12px; color: ${textSecondary}; margin-top: 2px;">Tidak ada data department</p>
          </div>`;

      const popupContent = `
        <div style="padding: 5px 10px; min-width: 240px; background: ${bgColor}; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; font-weight: 600; color: ${textPrimary};">${p.name}</span>
            <span style="font-size: 20px; font-weight: 700; color: ${textPrimary}">${p.total}</span>
          </div>
          <div>
            ${deptRows}
          </div>
        </div>
      `;

      layer.bindTooltip(popupContent, {
        permanent: false,
        direction: "top",
        className: "imap-heatmap-tooltip",
        opacity: 0.95,
      });

      layer.on("mouseover", function (this: any) {
        this.setStyle({ fillOpacity: 0.3, weight: 3 });
        const areaId = this._areaId;
        const labelMarker = labelMarkers.find((m: any) => m._labelAreaId === areaId);
        if (labelMarker) {
          labelMarker.getElement()?.style.setProperty('opacity', '0');
        }
      });

      layer.on("mouseout", function (this: any) {
        this.setStyle({ fillOpacity: 0.6, weight: 2 });
        const areaId = this._areaId;
        const labelMarker = labelMarkers.find((m: any) => m._labelAreaId === areaId);
        if (labelMarker && visibleLabelIds.value.has(areaId)) {
          labelMarker.getElement()?.style.setProperty('opacity', '1');
        }
      });

      // @ts-ignore
      layer._areaId = p.id;
      // @ts-ignore
      layer._workAreaId = p.workAreaId;
      areaLayers.push(layer);
    }
  });

  layer.addTo(map.value);
  geoJsonLayer.value = layer as any;

  rebuildLabelMarkers();

  if (isInitialLoad.value && features.length > 0 && geoJsonLayer.value) {
    const bounds = geoJsonLayer.value.getBounds();
    if (bounds.isValid()) {
      map.value.fitBounds(bounds, { padding: [50, 50] });
    }
    isInitialLoad.value = false;
  }

  nextTick(() => {
    setupIntersectionObserver();
    startLabelCycling();
    if (autoRotateEnabled.value) {
      startAutoScroll();
    }
  });
}

/**
 * Build (or rebuild) all label markers from scratch.
 * Removes old label layer group, creates fresh markers with current data,
 * and adds them to the map. Labels start hidden and are faded in by
 * applyLabelVisibilityToDOM.
 * @param animate - if true, fade-in visible labels after adding to map
 */
function rebuildLabelMarkers(animate = false) {
  if (!map.value || !L) return;

  const previousVisibleIds = new Set(visibleLabelIds.value);

  safeRemoveLayer(labelLayerGroup);
  labelLayerGroup = null;
  labelMarkers.length = 0;

  const dark = isDark.value;

  areas.value.forEach(area => {
    const isFactory = area.name?.toUpperCase() === 'PT. AJINOMOTO';
    if (isFactory || !area.rawGeoJson) return;

    // Use cached centroid (computed once during initial processData)
    const center = area.centroid;
    if (!center) return;

    const labelHtml = `
      <div class="imap-label-content" style="
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%) scale(0.85);
        display: flex; 
        align-items: center; 
        gap: 6px; 
        background: ${dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)'}; 
        backdrop-filter: blur(4px);
        padding: 4px 7px; 
        border-radius: 8px; 
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        border: 1px solid ${dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'};
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
      ">
        <i class="mdi mdi-account" style="
          font-size: 20px; 
          color: ${dark ? '#60a5fa' : '#3b82f6'};
          line-height: 1;
        "></i>
        <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;">
          <div style="
            font-size: 9px; 
            font-weight: 700; 
            color: ${dark ? '#94a3b8' : '#64748b'}; 
            line-height: 1; 
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          ">${area.name}</div>
          <div style="
            font-size: 13px; 
            font-weight: 800; 
            color: ${dark ? '#f8fafc' : '#0f172a'}; 
            line-height: 1;
          ">${area.total}</div>
        </div>
      </div>
    `;

    const labelIcon = L.divIcon({
      className: 'imap-area-label-icon',
      html: labelHtml,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker(center, {
      icon: labelIcon,
      interactive: false,
      zIndexOffset: 1000,
    });
    // @ts-ignore
    marker._labelAreaId = area.id;
    labelMarkers.push(marker);
  });

  if (labelMarkers.length > 0) {
    labelLayerGroup = L.layerGroup(labelMarkers);
    labelLayerGroup.addTo(map.value);
  }

  if (animate) {
    nextTick(() => {
      const targetIds = autoRotateEnabled.value
        ? previousVisibleIds
        : new Set(areas.value.map(a => a.id));
      applyLabelVisibilityToDOM(targetIds, true);
    });
  }
}

// ==================== Running Text Scroll System ====================

/**
 * Immediately fade-out all labels when zoom/move starts.
 * This prevents ugly mis-positioned labels while Leaflet animates.
 */
function onZoomStart() {
  if (isFocusingArea) return;
  fadeOutAllLabels();
}

function onMoveStart() {
  if (isFocusingArea) return;
  fadeOutAllLabels();
}

/**
 * Fade out all label contents instantly (using a fast transition).
 */
function fadeOutAllLabels() {
  isLabelTransitioning.value = true;
  labelMarkers.forEach((marker: any) => {
    const el = marker.getElement();
    if (!el) return;
    const contentEl = el.querySelector('.imap-label-content');
    if (!contentEl) return;

    contentEl.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
    contentEl.style.opacity = '0';
    contentEl.style.transform = 'translate(-50%, -50%) scale(0.85)';
  });
}

/**
 * Re-apply the current label visibility state to DOM elements.
 * Called after zoom/move events because Leaflet may recreate divIcon DOM elements,
 * which resets our inline styles.
 */
function onZoomEnd() {
  if (pendingRender) {
    pendingRender = false;
    renderAreas();
    return;
  }
  if (isFocusingArea) return;
  debouncedReapplyLabels();
}

/**
 * Debounced version of reapplyLabelVisibility to prevent rapid successive calls
 * during continuous zoom/move operations.
 */
function debouncedReapplyLabels() {
  if (labelReapplyTimer) {
    clearTimeout(labelReapplyTimer);
  }
  labelReapplyTimer = setTimeout(() => {
    labelReapplyTimer = null;
    reapplyLabelVisibility();
  }, 80);
}

/**
 * Re-apply labels by fully rebuilding them with fresh data and smooth fade-in.
 * This ensures label HTML always reflects current data after zoom/move.
 */
function reapplyLabelVisibility() {
  if (labelTransitionInTimer) {
    clearTimeout(labelTransitionInTimer);
  }

  labelTransitionInTimer = setTimeout(() => {
    labelTransitionInTimer = null;
    if (!map.value) return;

    rebuildLabelMarkers(true);
    isLabelTransitioning.value = false;
  }, 60);
}

/**
 * Apply label visibility to DOM elements.
 * @param visibleIds - set of area IDs that should be visible
 * @param animate - if true, use smooth fade-in transition
 */
function applyLabelVisibilityToDOM(visibleIds: Set<string>, animate = false) {
  labelMarkers.forEach((marker: any) => {
    const el = marker.getElement();
    if (!el) return;
    const contentEl = el.querySelector('.imap-label-content');
    if (!contentEl) return;

    if (animate) {
      contentEl.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    const areaId = marker._labelAreaId;
    if (visibleIds.has(areaId)) {
      contentEl.style.opacity = '1';
      contentEl.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
      contentEl.style.opacity = '0';
      contentEl.style.transform = 'translate(-50%, -50%) scale(0.85)';
    }
  });
}

/**
 * Set up IntersectionObserver to track which stats items are visible.
 * When an item enters the viewport, its map labels are shown.
 * When it exits, they are hidden.
 */
function setupIntersectionObserver() {
  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }

  const container = statsListRef.value;
  if (!container) return;

  const visibleIndices = new Set<number>();

  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = Number((entry.target as HTMLElement).dataset.areaIdx);
        if (isNaN(idx)) return;

        if (entry.isIntersecting) {
          visibleIndices.add(idx);
        } else {
          visibleIndices.delete(idx);
        }
      });

      // updateLabelsFromVisibleItems(visibleIndices); // Decoupled: scroll no longer affects map labels
    },
    {
      root: container,
      threshold: 0.3,
    }
  );

  nextTick(() => {
    Object.entries(areaItemRefs).forEach(([, el]) => {
      if (el && scrollObserver) {
        scrollObserver.observe(el);
      }
    });
  });
}



/**
 * Cycle map labels every 5 seconds per group and popup sequence.
 */
function startLabelCycling() {
  stopLabelCycling();

  function cycle() {
    if (isFocusingArea) {
      labelCycleTimer.value = setTimeout(cycle, 1000);
      return;
    }

    const permanentAreaIds = areas.value
      .filter(a => !a.groupArea || !a.popupSeq)
      .map(a => a.id);

    const cyclableGroups = new Map<string, number[]>();
    areas.value.forEach(a => {
      if (a.groupArea && a.popupSeq) {
        if (!cyclableGroups.has(a.groupArea)) {
          cyclableGroups.set(a.groupArea, []);
        }
        const seqs = cyclableGroups.get(a.groupArea)!;
        if (!seqs.includes(a.popupSeq)) {
          seqs.push(a.popupSeq);
        }
      }
    });

    const sequence: { group: string; seq: number }[] = [];
    cyclableGroups.forEach((seqs, group) => {
      seqs.sort((a, b) => a - b).forEach(seq => {
        sequence.push({ group, seq });
      });
    });

    if (sequence.length === 0) {
      const allIds = new Set(areas.value.map(a => a.id));
      const allWorkAreaIds = new Set(workAreaStats.value.map(w => w.id));
      visibleLabelIds.value = allIds;
      visibleWorkAreaIds.value = allWorkAreaIds;
      applyLabelVisibilityToDOM(allIds, true);
      return;
    }

    currentCycleIndex.value = (currentCycleIndex.value) % sequence.length;
    const current = sequence[currentCycleIndex.value];

    if (!current) {
      currentCycleIndex.value = 0;
      labelCycleTimer.value = setTimeout(cycle, 1000);
      return;
    }

    const currentCycleAreaIds = areas.value
      .filter(a => a.groupArea === current.group && a.popupSeq === current.seq)
      .map(a => a.id);

    const currentWorkAreaIds = areas.value
      .filter(a => a.groupArea === current.group && a.popupSeq === current.seq)
      .map(a => a.workAreaId)
      .filter((id): id is number => id !== undefined);

    const targetIds = new Set([...permanentAreaIds, ...currentCycleAreaIds]);
    visibleLabelIds.value = targetIds;
    visibleWorkAreaIds.value = new Set(currentWorkAreaIds);
    applyLabelVisibilityToDOM(targetIds, true);
    currentCycleIndex.value = (currentCycleIndex.value + 1) % sequence.length;

    labelCycleTimer.value = setTimeout(cycle, 5000);
  }

  cycle();
}

function stopLabelCycling() {
  if (labelCycleTimer.value) {
    clearTimeout(labelCycleTimer.value);
    labelCycleTimer.value = null;
  }
}

/**
 * Continuous smooth auto-scroll like a running text / news ticker.
 */
function startAutoScroll() {
  stopAutoScroll();

  const el = statsListRef.value!;
  if (!statsListRef.value) return;

  let lastTime = 0;
  let accumulatedPx = 0;
  isScrollPaused = false;

  function step(timestamp: number) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (autoRotateEnabled.value && !isScrollPaused && !userInteracting.value) {
      accumulatedPx += (props.scrollSpeed / 1000) * dt;

      if (accumulatedPx >= 1) {
        const toApply = Math.floor(accumulatedPx);
        el.scrollTop += toApply;
        accumulatedPx -= toApply;
      }

      const maxScroll = el.scrollHeight - el.clientHeight;
      scrollProgress.value = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0;

      // When reaching the bottom, pause 2s then wrap to top
      if (maxScroll > 0 && el.scrollTop >= maxScroll - 1) {
        isScrollPaused = true;
        accumulatedPx = 0;
        scrollPauseTimeout = setTimeout(() => {
          el.scrollTop = 0;
          scrollProgress.value = 0;
          isScrollPaused = false;
        }, 2000);
      }
    }

    scrollAnimFrame = requestAnimationFrame(step);
  }

  scrollAnimFrame = requestAnimationFrame(step);
}

function stopAutoScroll() {
  if (scrollAnimFrame) {
    cancelAnimationFrame(scrollAnimFrame);
    scrollAnimFrame = null;
  }
  if (scrollPauseTimeout) {
    clearTimeout(scrollPauseTimeout);
    scrollPauseTimeout = null;
  }
  isScrollPaused = false;
}

function toggleAutoRotate() {
  autoRotateEnabled.value = !autoRotateEnabled.value;
  if (autoRotateEnabled.value) {
    startAutoScroll();
  } else {
    stopAutoScroll();
    // No longer showing all labels here, as it's now controlled by cycling
  }
}

function showAllLabels() {
  labelMarkers.forEach((marker: any) => {
    const el = marker.getElement();
    if (!el) return;
    const contentEl = el.querySelector('.imap-label-content');
    if (contentEl) {
      contentEl.style.opacity = '1';
      contentEl.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  visibleLabelIds.value = new Set(areas.value.map(a => a.id));
  visibleWorkAreaIds.value = new Set(workAreaStats.value.map(w => w.id));
}

function pauseAutoScrollOnInteraction() {
  userInteracting.value = true;
}

function resumeAutoScrollAfterInteraction() {
  userInteracting.value = false;
}

function focusArea(area: WorkAreaStat) {
  if (!map.value) return;
  const layers = areaLayers.filter((l: any) => l._workAreaId === area.id);
  if (layers.length === 0) return;

  isFocusingArea = true;

  if (labelReapplyTimer) {
    clearTimeout(labelReapplyTimer);
    labelReapplyTimer = null;
  }
  if (labelTransitionInTimer) {
    clearTimeout(labelTransitionInTimer);
    labelTransitionInTimer = null;
  }
  if (focusResetTimer) {
    clearTimeout(focusResetTimer);
    focusResetTimer = null;
  }

  focusedLayerAreaIds = layers.map((l: any) => l._areaId).filter(Boolean);

  fadeOutAllLabels();

  areaLayers.forEach((l: any) => {
    l.closeTooltip();
    const lp = l.feature?.properties;
    const isF = lp?.name?.toUpperCase() === 'PT. AJINOMOTO';
    l.setStyle({ fillOpacity: isF ? 0 : 0.6, weight: 2 });
  });

  const group = L.featureGroup(layers);
  const bounds = group.getBounds();

  const onFocusZoomComplete = () => {
    map.value?.off('moveend', onFocusZoomComplete);

    const targetIds = autoRotateEnabled.value
      ? new Set(visibleLabelIds.value)
      : new Set(areas.value.map(a => a.id));

    focusedLayerAreaIds.forEach(id => targetIds.delete(id));
    applyLabelVisibilityToDOM(targetIds, true);

    layers.forEach((layer: any) => {
      layer.openTooltip();
      const p = layer.feature.properties;
      const isFactory = p.name.toUpperCase() === 'PT. AJINOMOTO';
      layer.setStyle({
        fillOpacity: isFactory ? 0 : 0.8,
        weight: 4
      });
    });

    // After 2s reset highlight and restore labels
    focusResetTimer = setTimeout(() => {
      layers.forEach((layer: any) => {
        const p = layer.feature.properties;
        const isFactory = p.name.toUpperCase() === 'PT. AJINOMOTO';
        layer.setStyle({
          fillOpacity: isFactory ? 0 : 0.6,
          weight: 2
        });
      });

      const restoreIds = autoRotateEnabled.value
        ? visibleLabelIds.value
        : new Set(areas.value.map(a => a.id));
      applyLabelVisibilityToDOM(restoreIds, true);

      isFocusingArea = false;
      focusedLayerAreaIds = [];
      focusResetTimer = null;
    }, 2000);
  };

  if (bounds.isValid()) {
    map.value.once('moveend', onFocusZoomComplete);
    map.value.fitBounds(bounds, { padding: [50, 50] });
  } else {
    onFocusZoomComplete();
  }
}

function toggleFullscreen() {
  if (!containerRef.value) return;
  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  setTimeout(() => {
    map.value?.invalidateSize();
  }, 100);
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  await initMap();
  processData(props.mapAreaData, props.workAreaData, props.personnelTypeData || []);
  setTimeout(() => {
    map.value?.invalidateSize();
    isMapLoading.value = false;
  }, 500);
});

watch(() => [props.mapAreaData, props.workAreaData, props.personnelTypeData], ([newMap, newStats, newPersonnel]) => {
  processData(newMap || [], newStats || [], newPersonnel || []);
}, { deep: true });

watch(isDark, () => {
  if (map.value && areas.value.length > 0) {
    renderAreas();
  }
});

let savedScrollTop = 0;

watch(showStatsCard, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (statsListRef.value) {
        statsListRef.value.scrollTop = savedScrollTop;
      }
      setupIntersectionObserver();
      if (autoRotateEnabled.value) {
        startAutoScroll();
      }
    });
  } else {
    if (statsListRef.value) {
      savedScrollTop = statsListRef.value.scrollTop;
    }
    stopAutoScroll();
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  stopAutoScroll();
  stopLabelCycling();

  if (labelReapplyTimer) {
    clearTimeout(labelReapplyTimer);
    labelReapplyTimer = null;
  }
  if (labelTransitionInTimer) {
    clearTimeout(labelTransitionInTimer);
    labelTransitionInTimer = null;
  }
  if (focusResetTimer) {
    clearTimeout(focusResetTimer);
    focusResetTimer = null;
  }

  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }

  if (map.value) {
    map.value.off('zoomend', onZoomEnd);
    map.value.off('moveend', debouncedReapplyLabels);
    map.value.off('zoomstart', onZoomStart);
    map.value.off('movestart', onMoveStart);

    try {
      (map.value as any).stop?.();
    } catch (e) { /* ignore */ }

    safeRemoveLayer(labelLayerGroup);
    labelLayerGroup = null;

    safeRemoveLayer(geoJsonLayer.value);
    geoJsonLayer.value = null;

    try {
      map.value.remove();
    } catch (e) { /* ignore */ }
    map.value = null;
  }
});
</script>

<style>
.imap-heatmap-tooltip {
  background-color: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  padding: 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
}

:root.dark .imap-heatmap-tooltip {
  background-color: #1e293b !important;
  border-color: #334155 !important;
}

.imap-heatmap-tooltip .leaflet-tooltip-content {
  margin: 0 !important;
}

.imap-area-label-icon {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.imap-label-content {
  will-change: opacity, transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.imap-progress-bar {
  transition: width 0.3s ease;
}

.imap-smooth-scroll::-webkit-scrollbar {
  width: 4px;
}

.imap-smooth-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.imap-smooth-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}

.imap-loader {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  animation: imap-spin 0.8s linear infinite;
}

:root.dark .imap-loader {
  border-color: #334155;
  border-top-color: #60a5fa;
}

@keyframes imap-spin {
  to { transform: rotate(360deg); }
}

.imap-fade-enter-active,
.imap-fade-leave-active {
  transition: opacity 0.4s ease;
}
.imap-fade-enter-from,
.imap-fade-leave-to {
  opacity: 0;
}

.imap-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.imap-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.imap-slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.imap-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

#interactive-map .leaflet-control-container .leaflet-top.leaflet-right {
  display: none;
}
</style>

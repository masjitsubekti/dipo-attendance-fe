<template>
  <div
    ref="containerRef"
    class="relative w-full h-[calc(100vh-178px)] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group"
  >
    <div id="heatmap-map" class="w-full h-full z-0"></div>

    <Transition name="fade">
      <div
        v-if="isMapLoading"
        class="absolute inset-0 z-999 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
      >
        <div class="map-loader"></div>
        <p
          class="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse"
        >
          Loading Map...
        </p>
      </div>
    </Transition>

    <div
      v-if="isFullscreen"
      class="absolute top-0 left-15 right-0 z-900 p-4 bg-linear-to-b from-black/50 to-transparent pointer-events-none"
    >
      <h1 class="text-white text-2xl font-bold drop-shadow-md">
        Dashboard Map Monitoring
      </h1>
      <p class="text-white/80 text-sm drop-shadow-sm">
        Real-time map area monitoring
      </p>
    </div>

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
    </div>

    <div
      class="absolute top-4 right-4 z-999 flex flex-col gap-2"
      v-if="!showStatsCard"
    >
      <button
        @click="showStatsCard = true"
        class="py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="Show Statistics"
      >
        <i class="mdi mdi-menu text-slate-600 dark:text-slate-300"></i>
      </button>
    </div>

    <DashboardMapStatsCard
      ref="statsCardRef"
      v-model:show="showStatsCard"
      v-model:searchQuery="searchQuery"
      :totalEmployees="totalEmployees"
      :filteredAreas="filteredAreas"
      :mapPieData="mapPieData"
      :listMaxHeightClass="listMaxHeightClass"
      @pause-scroll="pauseAutoScrollOnInteraction"
      @resume-scroll="resumeAutoScrollAfterInteraction"
      @focus-area="focusArea"
    />
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
}

interface WorkAreaStat {
  id: number;
  name: string;
  regular: number;
  outsourcing: number;
  contractor: number;
  visitor: number;
  total: number;
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
  type?: "map-area" | "work-area";
  scrollSpeed?: number;
}

const props = withDefaults(defineProps<Props>(), {
  mapAreaData: () => [],
  workAreaData: () => [],
  personnelTypeData: () => [],
  type: "map-area",
  scrollSpeed: 30,
});

const { isDark } = useTheme();
const map = ref<L.Map | null>(null);
const areaLayers: any[] = [];
let labelLayerGroup: any = null;
const labelMarkers: any[] = [];
const showStatsCard = ref(true);
const searchQuery = ref("");
const areas = ref<AreaData[]>([]);
const workAreaStats = ref<WorkAreaStat[]>([]);
const personnelTypeStats = ref<PersonnelTypeStat[]>([]);
const CENTER: [number, number] = [-7.433604, 112.433989];
const isInitialLoad = ref(true);
const isMapLoading = ref(true);

const autoRotateEnabled = ref(true);
const scrollProgress = ref(0);
const userInteracting = ref(false);
const statsCardRef = ref<any>(null);
const statsListRef = computed<HTMLElement | null>(() => statsCardRef.value?.statsListRef || null);

let scrollAnimFrame: number | null = null;
let scrollPauseTimeout: ReturnType<typeof setTimeout> | null = null;
let isScrollPaused = false;

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
const containerRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

function toggleFullscreen() {
  if (!containerRef.value) return;

  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen().catch((err) => {
      console.error(
        `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`,
      );
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

const listMaxHeightClass = computed(() => {
  return !isFullscreen.value ? 'max-h-[calc(100vh-550px)]' : 'max-h-[calc(100vh-372px)]';
});

onMounted(async () => {
  document.addEventListener("fullscreenchange", onFullscreenChange);
  await initMap();
  processData(props.mapAreaData, props.workAreaData, props.personnelTypeData || []);
  
  if (autoRotateEnabled.value) {
    startAutoScroll();
  }

  setTimeout(() => {
    map.value?.invalidateSize();
    isMapLoading.value = false;
  }, 500);
});

watch(
  () => [props.mapAreaData, props.workAreaData, props.personnelTypeData],
  ([newMap, newStats, newPersonnel]) => {
    processData(newMap || [], newStats || [], newPersonnel || []);
  },
  { deep: true },
);

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  stopAutoScroll();
  
  if (labelLayerGroup && map.value) {
    map.value.removeLayer(labelLayerGroup);
    labelLayerGroup = null;
  }
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

watch(isDark, () => {
  if (map.value && areas.value.length > 0) {
    renderAreas();
  }
});

function startAutoScroll() {
  stopAutoScroll();

  const el = statsListRef.value;
  if (!el) return;

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

function pauseAutoScrollOnInteraction() {
  userInteracting.value = true;
}

function resumeAutoScrollAfterInteraction() {
  userInteracting.value = false;
}

let L: any = null;
let backgroundRectangle: any = null;
let maskLayerGroup: any = null;

async function initMap() {
  if (typeof window === "undefined") return;
  L = (await import("leaflet")).default;

  map.value = L.map("heatmap-map", {
    center: CENTER,
    zoom: 18,
    zoomControl: true,
    attributionControl: true,
  });

  const streetLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
    },
  );

  const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      // attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  );

  if (props.type === "map-area") {
    satelliteLayer.addTo(map.value);
    const baseLayers = {
      Satellite: satelliteLayer,
      Street: streetLayer,
    };
    L.control
      .layers(baseLayers, null, { position: "topleft" })
      .addTo(map.value);
  } else {
    streetLayer.addTo(map.value);
  }

  renderAreas();
}

function processData(mapData: any[], statsData: any[], personnelTypeData: any[]) {
  if (mapData.length > 0) {
    areas.value = mapData
      .map((item: any) => {
        let geojson = item.geojson;
        try {
          if (typeof geojson === "string") {
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

          if (type === "MultiPolygon") {
            rawCoords = geometry.coordinates[0][0];
          } else if (type === "Polygon") {
            rawCoords = geometry.coordinates[0];
          } else if (type === "Point") {
            if (Array.isArray(geometry.coordinates)) {
              coords = [[geometry.coordinates[1], geometry.coordinates[0]]];
            }
          }

          if (type !== "Point" && Array.isArray(rawCoords)) {
            coords = rawCoords.map((c: any) => [c[1], c[0]]);
          }
        }

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
          isVisible: geojson?.properties?.isVisible ?? true
        };
      })
      .filter((a: any) => a.rawGeoJson && a.isVisible);

    renderAreas();
  }

  if (statsData.length > 0) {
    workAreaStats.value = statsData.map((item: any) => ({
      id: item.workAreaId,
      name: item.workAreaName,
      regular: item.permanentCount || 0,
      outsourcing: item.outsourceCount || 0,
      contractor: item.contractorCount || 0,
      visitor: item.visitorCount || 0,
      total: item.totalCount || 0,
    }));
  }

  if (personnelTypeData && personnelTypeData.length > 0) {
    personnelTypeStats.value = personnelTypeData.map((item: any) => ({
      label: item.label,
      count: item.count || 0,
      percentage: item.percentage || 0,
    }));
  }
}

const totalEmployees = computed(() => {
  return personnelTypeStats.value.reduce((sum, stat) => sum + stat.count, 0);
});

const sortedAreas = computed(() => {
  return [...workAreaStats.value].sort((a, b) => b.total - a.total);
});

const filteredAreas = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return sortedAreas.value;
  return sortedAreas.value.filter((area) =>
    area.name.toLowerCase().includes(q),
  );
});

function getDensityColor(total: number): string {
  if (total > 1000) return "#2563EB";
  if (total > 500) return "#F97316";
  return "#FACC15";
}

function getDensityColorText(total: number): string {
  if (total > 1000) return "text-blue-600 dark:text-blue-400";
  if (total > 500) return "text-orange-500";
  return "text-yellow-500";
}

const geoJsonLayer = ref<L.GeoJSON | null>(null);

function getPolygonCentroid(geometry: any): [number, number] | null {
  if (!geometry || !geometry.coordinates) return null;
  const type = geometry.type;
  let ring: any[] = [];

  if (type === "Polygon") {
    ring = geometry.coordinates[0];
  } else if (type === "MultiPolygon") {
    ring = geometry.coordinates[0][0];
  } else {
    return null;
  }

  if (!ring || ring.length === 0) return null;

  let sumLat = 0,
    sumLng = 0;
  for (const coord of ring) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  return [sumLat / ring.length, sumLng / ring.length];
}

function renderAreas() {
  if (!map.value || !L) return;

  if ((map.value as any)._animatingZoom) return;

  if (geoJsonLayer.value) {
    map.value.removeLayer(geoJsonLayer.value as any);
    geoJsonLayer.value = null;
  }
  areaLayers.length = 0;

  if (labelLayerGroup) {
    map.value.removeLayer(labelLayerGroup);
    labelLayerGroup = null;
  }
  labelMarkers.length = 0;

  if (backgroundRectangle) {
    map.value.removeLayer(backgroundRectangle);
    backgroundRectangle = null;
  }

  const features = areas.value
    .map((area) => {
      return {
        type: "Feature",
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
          densityColor: getDensityColor(area.total),
          isOutermost: false,
        },
        geometry: area.rawGeoJson || {
          type: "Polygon",
          coordinates: area.coordinates,
        },
      };
    })
    .filter((f: any) => f.geometry?.type === "Polygon");

  features.sort((a, b) => {
    const areaA = getFeatureBBoxArea(a);
    const areaB = getFeatureBBoxArea(b);
    return areaB - areaA;
  });

  if (features.length > 0) {
    features[0]!.properties.isOutermost = true;
  }

  if (features.length > 0) {
    const worldBounds: [number, number][] = [
      [-90, -180],
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ];

    const holes = features.map((feature: any) => {
      const coords = feature.geometry.coordinates[0];
      return coords.map((coord: any) => [coord[1], coord[0]]);
    });

    const inverseMaskCoordinates = [worldBounds, ...holes];

    backgroundRectangle = L.polygon(inverseMaskCoordinates as any, {
      color: "transparent",
      weight: 0,
      fillColor: "#000000",
      fillOpacity: 0.3,
      interactive: false,
    });
    backgroundRectangle.addTo(map.value);
    backgroundRectangle.bringToBack();
  }

  const layer = L.geoJSON(features as any, {
    pointToLayer: (_feature: any, latlng: any) => {
      return L.circleMarker(latlng, {
        radius: 0,
        opacity: 0,
        fillOpacity: 0,
      });
    },
    style: (feature: any) => {
      const p = feature.properties;
      const isFactory = p.name.toUpperCase() === "PT. AJINOMOTO";
      const isOutermost = p.isOutermost === true;
      return {
        color: isOutermost ? "#404040" : p.densityColor,
        fillColor: isFactory ? "transparent" : p.densityColor,
        fillOpacity: isFactory ? 0 : 0.6,
        weight: isOutermost ? 3 : 2,
        opacity: 1,
      };
    },
    onEachFeature: (feature: any, layer: any) => {
      const p = feature.properties;
      const isFactory = p.name?.toUpperCase() === "PT. AJINOMOTO";

      if (isFactory) return;

      const dark = isDark.value;
      const bgColor = dark ? "#1e293b" : "#ffffff";
      const textPrimary = dark ? "#e2e8f0" : "#334155";
      const textSecondary = dark ? "#94a3b8" : "#64748b";
      const borderColor = dark ? "#334155" : "#e2e8f0";

      const departments = p.departments || [];
      const deptRows =
        departments.length > 0
          ? departments
              .map(
                (dept: any) => `
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
        `,
              )
              .join("")
          : `<div style="padding: 8px 0; border-top: 1px solid ${borderColor}; text-align: center;">
            <i class="mdi mdi-information-outline" style="color: ${textSecondary}; font-size: 16px;"></i>
            <p style="font-size: 12px; color: ${textSecondary}; margin-top: 2px;">Tidak ada data department</p>
          </div>`;

      const popupContent = `
        <div style="padding: 5px 10px; min-width: 240px; background: ${bgColor}; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; font-weight: 600; color: ${textPrimary};">${p.name}</span>
            <span style="font-size: 20px; font-weight: 700; color: ${p.densityColor}">${p.total}</span>
          </div>
          <div>
            ${deptRows}
          </div>
        </div>
      `;

      layer.bindTooltip(popupContent, {
        permanent: props.type === "map-area",
        direction: "top",
        className: "heatmap-tooltip",
        opacity: 0.95,
      });

      layer.on("mouseover", function (this: any) {
        this.setStyle({ fillOpacity: 0.3, weight: 3 });
        const areaId = this._areaId;
        const labelMarker = labelMarkers.find(
          (m: any) => m._labelAreaId === areaId,
        );
        if (labelMarker) {
          labelMarker.getElement()?.style.setProperty("opacity", "0");
        }
      });

      layer.on("mouseout", function (this: any) {
        this.setStyle({ fillOpacity: 0.6, weight: 2 });
        const areaId = this._areaId;
        const labelMarker = labelMarkers.find(
          (m: any) => m._labelAreaId === areaId,
        );
        if (labelMarker) {
          labelMarker.getElement()?.style.setProperty("opacity", "1");
        }
      });

      layer._areaId = p.id;
      layer._workAreaId = p.workAreaId;
      areaLayers.push(layer);
    },
  });

  layer.addTo(map.value);
  geoJsonLayer.value = layer as any;

  areas.value.forEach((area) => {
    const isFactory = area.name?.toUpperCase() === "PT. AJINOMOTO";
    if (isFactory || !area.rawGeoJson) return;

    if (props.type === "work-area") return;

    const center = getPolygonCentroid(area.rawGeoJson);
    if (!center) return;

    const dark = isDark.value;
    const labelHtml = `
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
        display: flex; 
        align-items: center; 
        gap: 6px; 
        background: ${dark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)"}; 
        backdrop-filter: blur(4px);
        padding: 4px 7px; 
        border-radius: 8px; 
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        border: 1px solid ${dark ? "rgba(51, 65, 85, 0.5)" : "rgba(226, 232, 240, 0.8)"};
        pointer-events: none;
        white-space: nowrap;
      ">
        <i class="mdi mdi-account" style="
          font-size: 20px; 
          color: ${dark ? "#60a5fa" : "#3b82f6"};
          line-height: 1;
        "></i>
        <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;">
          <div style="
            font-size: 9px; 
            font-weight: 700; 
            color: ${dark ? "#94a3b8" : "#64748b"}; 
            line-height: 1; 
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          ">${area.name}</div>
          <div style="
            font-size: 13px; 
            font-weight: 800; 
            color: ${dark ? "#f8fafc" : "#0f172a"}; 
            line-height: 1;
          ">${area.total}</div>
        </div>
      </div>
    `;

    const labelIcon = L.divIcon({
      className: "area-label-icon",
      html: labelHtml,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker(center, {
      icon: labelIcon,
      interactive: false,
      zIndexOffset: 1000,
    });
    marker._labelAreaId = area.id;
    labelMarkers.push(marker);
  });

  if (labelMarkers.length > 0) {
    labelLayerGroup = L.layerGroup(labelMarkers);
    labelLayerGroup.addTo(map.value);
  }

  if (isInitialLoad.value && features.length > 0 && geoJsonLayer.value) {
    const bounds = geoJsonLayer.value.getBounds();
    if (bounds.isValid()) {
      map.value.fitBounds(bounds, { padding: [50, 50] });
    }
    isInitialLoad.value = false;
  }
}

function focusArea(area: WorkAreaStat) {
  if (!map.value) return;
  const layers = areaLayers.filter((l: any) => l._workAreaId === area.id);

  if (layers.length > 0) {
    const group = L.featureGroup(layers);
    const bounds = group.getBounds();

    if (bounds.isValid()) {
      map.value.fitBounds(bounds, { padding: [50, 50] });
    }

    areaLayers.forEach((l: any) => {
      l.closeTooltip();
      const lp = l.feature?.properties;
      const isF = lp?.name?.toUpperCase() === "PT. AJINOMOTO";
      l.setStyle({ fillOpacity: isF ? 0 : 0.6, weight: 2 });
    });
    labelMarkers.forEach((m: any) => {
      m.getElement()?.style.setProperty("opacity", "1");
    });

    layers.forEach((layer: any) => {
      layer.openTooltip();
      const p = layer.feature.properties;
      const isFactory = p.name.toUpperCase() === "PT. AJINOMOTO";

      layer.setStyle({
        fillOpacity: isFactory ? 0 : 0.8,
        weight: 4,
      });

      const areaId = layer._areaId;
      const labelMarker = labelMarkers.find(
        (m: any) => m._labelAreaId === areaId,
      );
      if (labelMarker) {
        labelMarker.getElement()?.style.setProperty("opacity", "0");
      }

      setTimeout(() => {
        layer.setStyle({
          fillOpacity: isFactory ? 0 : 0.6,
          weight: 2,
        });
        if (labelMarker) {
          labelMarker.getElement()?.style.setProperty("opacity", "1");
        }
      }, 2000);
    });
  }
}

function getFeatureBBoxArea(feature: any): number {
  if (!feature.geometry) return 0;
  const type = feature.geometry.type;
  const coords: any = feature.geometry.coordinates;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const updateBounds = (pt: any) => {
    if (!Array.isArray(pt) || pt.length < 2) return;
    const x = pt[0];
    const y = pt[1];

    if (typeof x === "number" && typeof y === "number") {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };

  const processRing = (ring: any[]) => {
    if (!ring) return;
    ring.forEach((pt) => {
      updateBounds(pt);
    });
  };

  if (type === "Polygon") {
    processRing(coords[0]);
  } else if (type === "MultiPolygon") {
    coords.forEach((poly: any[]) => processRing(poly[0]));
  } else {
    return 0;
  }

  if (minX === Infinity || minY === Infinity) return 0;
  return (maxX - minX) * (maxY - minY);
}
</script>

<style>
.heatmap-tooltip {
  background-color: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.5rem !important;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  padding: 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
}

:root.dark .heatmap-tooltip {
  background-color: #1e293b !important;
  border-color: #334155 !important;
}

.heatmap-tooltip .leaflet-tooltip-content {
  margin: 0 !important;
}

#interactive-map .leaflet-control-container .leaflet-top.leaflet-right {
  display: none;
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

.area-label-icon {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
  transition: opacity 0.2s ease !important;
}

.map-loader {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  animation: spin 0.8s linear infinite;
}

:root.dark .map-loader {
  border-color: #334155;
  border-top-color: #60a5fa;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

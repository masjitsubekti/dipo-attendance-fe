<template>
  <div 
    ref="containerRef"
    class="relative w-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    :class="mode === 'web' ? 'h-[calc(100vh-178px)] rounded-xl' : 'h-screen'"
  >
    <div id="map-preview-container" class="w-full h-full z-0 bg-slate-900"></div>

    <!-- Fullscreen Header -->
    <div 
      class="absolute top-0 left-15 right-0 z-900 p-3 bg-linear-to-b from-black/50 to-transparent pointer-events-none"
    >
      <h1 class="text-white text-xl font-bold drop-shadow-md">Dashboard Map Area</h1>
      <p class="text-white/80 text-sm drop-shadow-sm">PT. Ajinomoto Indonesia</p>
    </div>

    <!-- Left Controls -->
    <div class="absolute z-1000 flex flex-col gap-2 top-4 left-3">
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

    <!-- Top Right Controls -->
    <div class="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      <button 
        v-if="!showStatsCard"
        @click="showStatsCard = true"
        class="py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="Show Statistics"
      >
        <i class="mdi mdi-menu text-slate-600 dark:text-slate-300"></i>
      </button>
    </div>

    <!-- Floating Stats Card (Top Right) -->
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
    />

    <Transition name="imap-fade">
      <div v-if="isLoading" class="absolute inset-0 z-999 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-sm font-medium text-slate-300 animate-pulse">Memuat Peta...</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import "leaflet/dist/leaflet.css";

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

const isLoading = ref(true);

let L: any = null;
let map: any = null;
let mapContainer: HTMLElement | null = null;
const containerRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const features = ref<any[]>([]);
const labelLayers = new Map<string, any>();

const showStatsCard = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
const searchQuery = ref('');
const workAreaStats = ref<WorkAreaStat[]>([]);
const personnelTypeStats = ref<PersonnelTypeStat[]>([]);

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

const listMaxHeightClass = computed(() => {
  if (isFullscreen.value) return 'max-h-[calc(100vh-372px)]';
  return props.mode === 'web' ? 'max-h-[calc(100vh-550px)]' : 'max-h-[calc(100vh-372px)]';
});

const statsCardRef = ref<any>(null);
const statsListRef = computed<HTMLElement | null>(() => statsCardRef.value?.statsListRef || null);
const userInteracting = ref(false);
let scrollAnimFrame: number | null = null;
let scrollPauseTimeout: ReturnType<typeof setTimeout> | null = null;
let isScrollPaused = false;
let polygonsRendered = false;

function updateCountsInPlace() {
    if (!map || !L || features.value.length === 0) return;

    features.value.forEach(feature => {
        let newCount = feature.totalCount || 0;
        if (feature.workAreaId) {
            const wStat = workAreaStats.value.find(w => w.id === feature.workAreaId);
            if (wStat) newCount = wStat.total;
        }

        if (feature.totalCount !== newCount || !labelLayers.has(feature.id)) {
            feature.totalCount = newCount;
            // hapus label lama di map instance
            if (labelLayers.has(feature.id)) {
                map.removeLayer(labelLayers.get(feature.id));
                labelLayers.delete(feature.id);
            }
            // gambar label baru dengan HTML baru tanpa ubah vector map
            updatePermanentLabel(feature);
        }
    });
}

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

    if (!isScrollPaused && !userInteracting.value && el) {
      accumulatedPx += (props.scrollSpeed / 1000) * dt;

      if (accumulatedPx >= 1) {
        const toApply = Math.floor(accumulatedPx);
        el.scrollTop += toApply;
        accumulatedPx -= toApply;
      }

      const maxScroll = el.scrollHeight - el.clientHeight;

      if (maxScroll > 0 && el.scrollTop >= maxScroll - 1) {
        isScrollPaused = true;
        accumulatedPx = 0;
        scrollPauseTimeout = setTimeout(() => {
          if (el) el.scrollTop = 0;
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


const toggleFullscreen = () => {
    if (!containerRef.value) return;
    if (!document.fullscreenElement) {
        containerRef.value.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
};

const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
    setTimeout(() => { 
        if (map) {
            map.invalidateSize();
            fitMapToFeatures();
        }
    }, 300);
};

onMounted(async () => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    mapContainer = document.getElementById('map-preview-container');
    if (!mapContainer || typeof window === 'undefined') return;

    L = (await import('leaflet')).default;
    
    map = L.map(mapContainer, { 
        zoomControl: false, 
        maxZoom: 20, 
        minZoom: 15,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        attributionControl: false
    }).setView([-7.433604, 112.433989], 17);

    const blueprintLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
    });
    blueprintLayer.addTo(map);

    watch(() => props.mapAreaData, (newData) => {
        if (newData && newData.length > 0) {
            processData(newData);
        } else {
            isLoading.value = false;
        }
    }, { deep: true, immediate: true });

    watch(() => props.workAreaData, (newData) => {
        if (!newData) return;
        let statsData: any[] = [];
        if (Array.isArray(newData)) {
            statsData = newData;
        } else if (newData && Array.isArray((newData as any).data)) {
            statsData = (newData as any).data;
        } else if (newData && (newData as any).data && Array.isArray((newData as any).data.data)) {
            statsData = (newData as any).data.data;
        }

        workAreaStats.value = statsData.map((item: any) => ({
        id: item.workAreaId || item.id,
        name: item.workAreaName || item.name || '',
        regular: item.permanentCount || 0,
        outsourcing: item.outsourceCount || 0,
        contractor: item.contractorCount || 0,
        visitor: item.visitorCount || 0,
        total: item.totalCount || 0,
        groupArea: item.groupArea || item.group_area || "",
        popupSeq: item.popupSeq || item.popup_seq || 0
    }));

    setTimeout(() => { startAutoScroll(); }, 500);

    if (polygonsRendered) {
        updateCountsInPlace();
    }
}, { deep: true, immediate: true });

    watch(() => props.personnelTypeData, (newData) => {
        if (!newData) return;
        let statsData: any[] = [];
        if (Array.isArray(newData)) {
            statsData = newData;
        } else if (newData && Array.isArray((newData as any).data)) {
            statsData = (newData as any).data;
        } else if (newData && (newData as any).data && Array.isArray((newData as any).data.data)) {
            statsData = (newData as any).data.data;
        }

        personnelTypeStats.value = statsData.map((item: any) => ({
            label: item.label,
            count: item.count || 0,
            percentage: item.percentage || 0,
        }));
    }, { deep: true, immediate: true });

    watch(showStatsCard, () => {
        setTimeout(() => {
            fitMapToFeatures();
        }, 300);
    });
});

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    stopAutoScroll();
    if (map) {
        map.remove();
        map = null;
    }
});

function getFeatureBBoxArea(feature: any): number {
  const geojson = feature.geojson;
  if (!geojson || !geojson.geometry) return 0;
  const coords: any = geojson.geometry.coordinates;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const updateBounds = (pt: any) => {
    if (Array.isArray(pt) && pt.length >= 2) {
        if (pt[0] < minX) minX = pt[0]; if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1]; if (pt[1] > maxY) maxY = pt[1];
    }
  };
  const processRing = (ring: any[]) => { if (ring) ring.forEach(pt => updateBounds(pt)); };
  if (geojson.geometry.type === 'Polygon') processRing(coords[0]);
  else if (geojson.geometry.type === 'MultiPolygon') coords.forEach((poly: any[]) => processRing(poly[0]));
  else return 0;
  if (minX === Infinity) return 0;
  return (maxX - minX) * (maxY - minY);
}

function updatePermanentLabel(feature: any) {
    if (!map || !L) return;
    
    const id = feature.id;
    
    if (feature.properties?.showLabel !== true) return;

    if (feature.geometryType === 'LineString') return;

    let center: any;
    if (feature._layer.getBounds) {
        center = feature._layer.getBounds().getCenter();
    } else if (feature._layer.getLatLng) {
        center = feature._layer.getLatLng();
    }
    
    if (!center) return;

    const borderColor = feature.properties.stroke || '#cbd5e1';

    const labelIcon = L.divIcon({
        className: 'custom-map-label-preview',
        html: `
            <div class="flex flex-col items-center pointer-events-none drop-shadow-md">
                <div style="border-color: ${borderColor}; border-width: 2px;" class="px-2 py-0.5 bg-[#fdfdfc] dark:bg-slate-800/95 rounded flex items-center gap-1.5 w-[110px]">
                    <div class="text-[#4285F4] dark:text-blue-400 text-[18px] leading-none flex items-center justify-center shrink-0">
                        <i class="mdi mdi-account"></i>
                    </div>
                    <div class="flex flex-col justify-center w-full">
                        <span class="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-tight leading-tight uppercase whitespace-normal break-words">${feature.name}</span>
                        <span class="text-slate-900 dark:text-white text-[14px] font-extrabold leading-tight mt-0.5">${feature.totalCount || 0}</span>
                    </div>
                </div>
            </div>
        `,
        iconSize: [110, 50],
        iconAnchor: [55, 25]
    });

    const labelMarker = L.marker(center, { icon: labelIcon, interactive: true, zIndexOffset: 2000 });
    
    labelMarker.on('mouseover', () => {
        const id = feature.id?.toString();
        // Glow label
        const el = labelMarker.getElement();
        if (el) el.classList.add('imap-label-active');

        // Glow connected LineStrings
        features.value.forEach(f => {
            if (f.geometryType === 'LineString' && f._layer) {
                const source = f.geojson?.properties?.sourceMarkerId?.toString();
                const target = f.geojson?.properties?.targetMarkerId?.toString();
                if (source === id || target === id) {
                    f._layer.setStyle({ 
                        color: f.properties.stroke || '#3b82f6', 
                        weight: 5,
                        opacity: 1
                    });
                }
            }
        });
    });

    labelMarker.on('mouseout', () => {
        const id = feature.id?.toString();
        // Remove glow label
        const el = labelMarker.getElement();
        if (el) el.classList.remove('imap-label-active');

        // Reset connected LineStrings
        features.value.forEach(f => {
            if (f.geometryType === 'LineString' && f._layer) {
                const source = f.geojson?.properties?.sourceMarkerId?.toString();
                const target = f.geojson?.properties?.targetMarkerId?.toString();
                if (source === id || target === id) {
                    f._layer.setStyle({ 
                        color: f.properties.stroke || '#3b82f6', 
                        weight: f.properties['stroke-width'] || 3,
                        opacity: f.properties['stroke-opacity'] || 0.8
                    });
                }
            }
        });
    });

    labelMarker.addTo(map);
    labelLayers.set(id, labelMarker);
}

function processData(rawData: any) {
  if (!map || !L) return;
  isLoading.value = true;
  
  try {
    let dataArray: any[] = [];
    if (Array.isArray(rawData)) {
        dataArray = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
        dataArray = rawData.data;
    } else if (rawData && rawData.data && Array.isArray(rawData.data.data)) {
        dataArray = rawData.data.data;
    }

    if (dataArray.length === 0) {
        isLoading.value = false;
        return;
    }

    if (polygonsRendered) {
        const incomingLookup = new Map<string, any>();
        dataArray.forEach(d => incomingLookup.set(d.id?.toString(), d));
        
        features.value.forEach(feature => {
            const item = incomingLookup.get(feature.id?.toString());
            let newCount = item?.totalCount || feature.totalCount || 0;
            if (feature.workAreaId) {
                const wStat = workAreaStats.value.find(w => w.id === feature.workAreaId);
                if (wStat) newCount = wStat.total;
            }
            if (feature.totalCount !== newCount) {
                feature.totalCount = newCount;
                if (labelLayers.has(feature.id)) {
                    map.removeLayer(labelLayers.get(feature.id));
                    labelLayers.delete(feature.id);
                }
                updatePermanentLabel(feature);
            }
        });
        isLoading.value = false;
        return;
    }

    features.value.forEach(f => {
        if (f._layer && map) map.removeLayer(f._layer);
    });
    labelLayers.forEach(l => {
        if (map) map.removeLayer(l);
    });
    labelLayers.clear();

    const dataCopy = JSON.parse(JSON.stringify(dataArray));
    
    dataCopy.sort((a: any, b: any) => {
        let geoA = typeof a.geojson === 'string' ? JSON.parse(a.geojson) : a.geojson;
        let geoB = typeof b.geojson === 'string' ? JSON.parse(b.geojson) : b.geojson;
        return getFeatureBBoxArea({ geojson: geoB }) - getFeatureBBoxArea({ geojson: geoA });
    });

    features.value = [];
    
    dataCopy.forEach((item: any) => {
      let geojson = item.geojson;
      if (typeof geojson === 'string') geojson = JSON.parse(geojson);
      
      let totalCount = item.totalCount || 0;
      if (item.workAreaId) {
          const wStat = workAreaStats.value.find(w => w.id === item.workAreaId);
          if (wStat) totalCount = wStat.total;
      }

      const feature = {
        id: item.featureId || item.id,
        workAreaId: item.workAreaId,
        name: item.name || 'Unnamed Feature',
        geometryType: item.geometryType,
        totalCount: totalCount,
        geojson: geojson,
        properties: {
          ...(geojson.properties || { fill: '#3b82f6', stroke: '#3b82f6' }),
          showLabel: geojson.properties?.showLabel ?? false
        },
        _layer: null as any,
      };

      if (map && L) {
        const layerGroup = L.geoJSON(geojson, {
            pointToLayer: (_f: any, latlng: any) => {
                return L.circleMarker(latlng, { radius: 0, opacity: 0, fillOpacity: 0 });
            },
            style: (f: any) => {
                const props = f.properties || {};
                const isLine = feature.geometryType === 'LineString';
                const isMainArea = feature.name === 'PT. Ajinomoto';
                return {
                    color: props.stroke || props.color || '#3b82f6',
                    fillColor: props.fill || props.color || '#3b82f6',
                    fillOpacity: isMainArea ? 0 : (isLine ? 0 : (props['fill-opacity'] || 0.3)),
                    opacity: props['stroke-opacity'] || 0.8,
                    weight: props['stroke-width'] || (isLine ? 3 : 2)
                };
            }
        });
        
        layerGroup.eachLayer((l: any) => {
            l.addTo(map);
            feature._layer = l;
            
            // Tambahkan tooltip hover
            const isMainArea = feature.name === 'PT. Ajinomoto';
            if (feature.geometryType !== 'Point' && feature.geometryType !== 'LineString' && feature.geometryType !== 'Polygon' && !isMainArea) {
                const hoverContent = `
                    <div class="px-3 py-1.5 bg-white border border-slate-200 shadow-xl rounded-lg text-sm min-w-32 pointer-events-none">
                        <div class="font-bold text-slate-800 border-b border-slate-100 mb-1.5 pb-1">${feature.name}</div>
                        <div class="text-xs text-slate-500 font-semibold tracking-tight">Total: <span class="text-blue-600 font-extrabold text-sm">${feature.totalCount || 0}</span></div>
                    </div>
                `;
                l.bindTooltip(hoverContent, { 
                    sticky: true, 
                    direction: 'top', 
                    offset: [0, -10],
                    className: 'imap-hover-tooltip' 
                });

                l.on('mouseover', function(this: any) {
                    if (feature.geometryType === 'LineString') {
                        this.setStyle({ weight: (feature.properties['stroke-width'] || 3) + 2 });
                    } else {
                        this.setStyle({ fillOpacity: 0.5 });
                    }
                });
                
                l.on('mouseout', function(this: any) {
                    if (feature.geometryType === 'LineString') {
                        this.setStyle({ weight: (feature.properties['stroke-width'] || 3) });
                    } else {
                        this.setStyle({ fillOpacity: (feature.properties['fill-opacity'] || 0.3) });
                    }
                });
            }
            
            updatePermanentLabel(feature);
        });
      }
      features.value.push(feature);
    });

    if (features.value.length && map) {
        fitMapToFeatures();
    }
    
    polygonsRendered = true;
    isLoading.value = false;
  } catch (error) {
    console.error('Failed to load features', error);
  } finally {
    isLoading.value = false;
  }
}

function fitMapToFeatures() {
    if (!map || !L || !features.value.length) return;
    
    const activeLayers = features.value.map(f => f._layer).filter(l => l);
    if (activeLayers.length === 0) return;
    
    const group = L.featureGroup(activeLayers);
    map.invalidateSize();
    
    const isSidebarVisible = showStatsCard.value;
    const isFull = isFullscreen.value;

    // Tentukan padding dinamis berdasarkan layar (Fullscreen vs Web) dan Sidebar
    const paddingTop = isFull ? 100 : 80;
    const paddingLeft = isFull ? 50 : 0;
    const paddingRight = isSidebarVisible ? (isFull ? 350 : 310) : (isFull ? 60 : 40);
    const paddingBottom = isFull ? 40 : 30;

    map.fitBounds(group.getBounds(), {
        paddingTopLeft: [paddingLeft, paddingTop], 
        paddingBottomRight: [paddingRight, paddingBottom], 
        animate: true 
    });
}
</script>

<style>
.imap-hover-tooltip {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.custom-map-label-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-map-label-preview > div {
  transition: all 0.2s ease;
}

.imap-label-active {
  z-index: 3000 !important;
}

.imap-label-active > div {
  transform: scale(1.15);
  filter: drop-shadow(0 0 8px rgba(66, 133, 244, 0.6));
  border-color: #4285F4 !important;
  background-color: white !important;
}

.imap-fade-enter-active,
.imap-fade-leave-active {
  transition: opacity 0.3s ease;
}
.imap-fade-enter-from,
.imap-fade-leave-to {
  opacity: 0;
}

.imap-slide-enter-active,
.imap-slide-leave-active {
  transition: all 0.3s ease;
}
.imap-slide-enter-from,
.imap-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.imap-smooth-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.dark .imap-smooth-scroll {
  scrollbar-color: #475569 transparent;
}
.imap-smooth-scroll::-webkit-scrollbar {
  width: 4px;
}
.imap-smooth-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.imap-smooth-scroll::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.dark .imap-smooth-scroll::-webkit-scrollbar-thumb {
  background-color: #475569;
}
</style>

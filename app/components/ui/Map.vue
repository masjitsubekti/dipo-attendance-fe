<template>
  <div ref="containerRef" class="relative w-full h-full">
    <div ref="mapEl" class="w-full h-full z-0"></div>
    <slot name="controls" :map="map" :L="L" />
  </div>
</template>

<script setup lang="ts">
import "leaflet/dist/leaflet.css";

interface Props {
  center?: [number, number];
  zoom?: number;
  geoJsonData?: any[] | null;
  geoJsonStyle?: Function | Record<string, any> | null;
  onEachFeature?: Function | null;
  pointToLayer?: Function | null;
  defaultTile?: 'satellite' | 'street';
  showLayerControl?: boolean;
  fitBoundsOnData?: boolean;
  fitBoundsPadding?: [number, number];
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [-7.433604, 112.433989],
  zoom: 18,
  geoJsonData: null,
  geoJsonStyle: null,
  onEachFeature: null,
  pointToLayer: null,
  defaultTile: 'satellite',
  showLayerControl: true,
  fitBoundsOnData: true,
  fitBoundsPadding: () => [50, 50],
});

const emit = defineEmits<{
  ready: [payload: { map: any; L: any }];
  featureClick: [payload: { feature: any; layer: any }];
  featureMouseover: [payload: { feature: any; layer: any }];
  featureMouseout: [payload: { feature: any; layer: any }];
}>();

const mapEl = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const map = ref<any>(null);
const geoJsonLayer = ref<any>(null);
const areaLayers: any[] = [];
let L: any = null;
let isInitialLoad = true;

async function initMap() {
  if (typeof window === 'undefined' || !mapEl.value) return;

  L = (await import('leaflet')).default;

  map.value = L.map(mapEl.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: true,
    attributionControl: false,
  });

  const streetLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '' }
  );

  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {}
  );

  if (props.defaultTile === 'street') {
    streetLayer.addTo(map.value);
  } else {
    satelliteLayer.addTo(map.value);
  }

  if (props.showLayerControl) {
    const baseLayers = {
      Satellite: satelliteLayer,
      Street: streetLayer,
    };
    L.control.layers(baseLayers, null, { position: 'topleft' }).addTo(map.value);
  }

  emit('ready', { map: map.value, L });

  if (props.geoJsonData && props.geoJsonData.length > 0) {
    renderGeoJson(props.geoJsonData);
  }
}

function renderGeoJson(features: any[]) {
  if (!map.value || !L) return;

  // Cleanup old layer
  if (geoJsonLayer.value) {
    geoJsonLayer.value.eachLayer((l: any) => {
      if (l.getTooltip()) {
        l.closeTooltip();
        l.unbindTooltip();
      }
      if (l.getPopup()) {
        l.closePopup();
        l.unbindPopup();
      }
      l.off();
    });
    map.value.removeLayer(geoJsonLayer.value);
    geoJsonLayer.value = null;
  }
  areaLayers.length = 0;

  if (!features || features.length === 0) return;

  const geoJsonOptions: any = {};

  if (props.pointToLayer) {
    geoJsonOptions.pointToLayer = props.pointToLayer;
  } else {
    geoJsonOptions.pointToLayer = (_feature: any, latlng: any) => {
      return L.circleMarker(latlng, {
        radius: 0,
        opacity: 0,
        fillOpacity: 0,
      });
    };
  }

  if (props.geoJsonStyle) {
    geoJsonOptions.style = props.geoJsonStyle;
  }

  if (props.onEachFeature) {
    geoJsonOptions.onEachFeature = (feature: any, layer: any) => {
      props.onEachFeature!(feature, layer, L);
      areaLayers.push(layer);
    };
  } else {
    geoJsonOptions.onEachFeature = (feature: any, layer: any) => {
      layer.on('click', () => emit('featureClick', { feature, layer }));
      layer.on('mouseover', () => emit('featureMouseover', { feature, layer }));
      layer.on('mouseout', () => emit('featureMouseout', { feature, layer }));
      areaLayers.push(layer);
    };
  }

  const layer = L.geoJSON(features as any, geoJsonOptions);
  layer.addTo(map.value);
  geoJsonLayer.value = layer;

  if (props.fitBoundsOnData && isInitialLoad && features.length > 0) {
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.value.fitBounds(bounds, { padding: props.fitBoundsPadding });
    }
    isInitialLoad = false;
  }
}

watch(
  () => props.geoJsonData,
  (newData) => {
    if (newData) {
      renderGeoJson(newData);
    }
  },
  { deep: true }
);

onMounted(async () => {
  await initMap();
  await nextTick();
  setTimeout(() => {
    map.value?.invalidateSize();
  }, 200);
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

defineExpose({
  getMap: () => map.value,
  getL: () => L,
  fitBounds: (bounds: any, options?: any) => {
    map.value?.fitBounds(bounds, options || { padding: props.fitBoundsPadding });
  },
  invalidateSize: () => {
    map.value?.invalidateSize();
  },
  getGeoJsonLayer: () => geoJsonLayer.value,
  getLayers: () => areaLayers,
  renderGeoJson,
});
</script>

<style>
.leaflet-control-container .leaflet-top.leaflet-right {
  display: none;
}
.leaflet-control-attribution {
  display: none !important;
}
</style>

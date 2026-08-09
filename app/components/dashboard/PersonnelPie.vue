<template>
  <UiChart
    type="pie"
    :series="chartSeries"
    :options="chartOptions"
    class="w-full h-full"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  data: { label: string; count: number }[];
  colors?: string[];
  fontSize?: string;
  showLegend?: boolean;
}>(), {
  colors: () => ["#2563eb", "#16a34a", "#d97706", "#7c3aed"],
  fontSize: "12px",
  showLegend: true
});

const chartSeries = computed(() => {
  if (!props.data) return [];
  return props.data.map(item => item.count);
});

const chartOptions = computed(() => ({
  chart: { type: "pie" },
  labels: props.data ? props.data.map(item => item.label) : [],
  colors: props.colors,
  legend: {
    show: props.showLegend,
    position: "bottom",
    labels: { colors: "#64748b" },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: false,
        },
      },
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number, { seriesIndex, w }: any) => {
      // const label = w.config.labels[seriesIndex];
      const value = w.config.series[seriesIndex];
      return `${value}`;
    },
    style: {
      fontSize: props.fontSize,
      fontWeight: "bold",
      colors: ["#ffffff"],
    },
  },
}));
</script>

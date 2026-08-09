<template>
  <UiCard class="lg:col-span-2">
    <template #header>
      <div class="flex flex-row gap-3">
        <div class="py-1 rounded-xl px-2 bg-blue-100 dark:bg-blue-900/30">
          <UiIcon
            name="mdi-chart-timeline-variant"
            type="mdi"
            size="2xl"
            class="text-blue-400 dark:text-blue-900/90"
          />
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">
            {{ $t("Peak Hours Monitoring") }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t("Last 12 Hours Activity") }}
          </p>
        </div>
      </div>
    </template>
    <UiChart
      type="line"
      height="100%"
      :series="chartSeries"
      :options="chartOptions"
    />
  </UiCard>
</template>

<script setup lang="ts">
interface PeakHourItem {
  time: string;
  in: number;
  out: number;
  active: number;
}

const props = defineProps<{
  data: PeakHourItem[];
}>();

const chartSeries = ref<any[]>([
  { name: "In", data: [] },
  { name: "Out", data: [] },
  { name: "Active", data: [] },
]);

const chartOptions = ref<any>({
  chart: {
    type: "line",
    toolbar: { show: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  markers: {
    size: 4,
    colors: ["#16a34a", "#b91c1c", "#f59e0b"],
    strokeColors: "#fff",
    strokeWidth: 1,
    hover: { size: 7 },
  },
  xaxis: {
    categories: [],
    labels: { style: { colors: "#64748b" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: "#64748b" } },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 4,
  },
  colors: ["#16a34a", "#b91c1c", "#f59e0b"],
  fill: {
    type: "fill",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
  },
});

watch(
  () => props.data,
  (data) => {
    if (!data || data.length === 0) return;

    const seriesIn: number[] = [];
    const seriesOut: number[] = [];
    const seriesActive: number[] = [];
    const labels: string[] = [];

    data.forEach((item) => {
      seriesIn.push(item.in);
      seriesOut.push(item.out);
      seriesActive.push(item.active);
      labels.push(item.time);
    });

    chartSeries.value = [
      { name: "In", data: seriesIn },
      { name: "Out", data: seriesOut },
      { name: "Active", data: seriesActive },
    ];

    chartOptions.value = {
      ...chartOptions.value,
      xaxis: {
        ...chartOptions.value.xaxis,
        categories: labels,
      },
    };
  },
  { immediate: true },
);
</script>

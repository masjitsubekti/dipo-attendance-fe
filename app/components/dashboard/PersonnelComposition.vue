<template>
  <UiCard>
    <template #header>
      <div class="flex flex-row gap-3">
        <div class="py-1 rounded-xl px-2 bg-red-100 dark:bg-red-900/30">
          <UiIcon
            name="mdi-chart-pie"
            type="mdi"
            size="2xl"
            class="text-red-400 dark:text-red-900/90"
          />
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">
            {{ $t("Personnel Composition") }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t("Total count by Personnel Category") }}
          </p>
        </div>
      </div>
    </template>
    <div class="flex flex-col items-center">
      <UiChart
        type="pie"
        :series="chartSeries"
        :options="chartOptions"
        class="min-h-70"
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
interface CompositionItem {
  count: number;
  label: string;
}

const props = defineProps<{
  data: CompositionItem[];
}>();

const chartSeries = ref<number[]>([0, 0, 0, 0]);
const chartOptions = ref<any>({
  chart: { type: "pie" },
  labels: ["Regular", "Outsourcing", "Contractor", "Visitor"],
  colors: ["#2563eb", "#16a34a", "#d97706", "#7c3aed"],
  legend: {
    show: true,
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
      fontSize: "15px",
      fontWeight: "bold",
      colors: ["#ffffff"],
    },
  },
});

watch(
  () => props.data,
  (data) => {
    if (!data || data.length === 0) return;

    const series: number[] = [];
    const labels: string[] = [];

    data.forEach((item) => {
      series.push(item.count);
      labels.push(item.label);
    });

    chartSeries.value = series;
    chartOptions.value = {
      ...chartOptions.value,
      labels,
    };
  },
  { immediate: true },
);
</script>

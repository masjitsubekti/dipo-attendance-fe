<template>
  <UiCard class="lg:col-span-2">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <button
            v-if="isDrilldownActive"
            @click="handleDrilldownBack"
            class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <i class="mdi mdi-arrow-left text-lg text-slate-600 dark:text-slate-300"></i>
          </button>
          <div class="py-1 rounded-xl px-2 bg-amber-100 dark:bg-amber-900/30">
            <UiIcon
              name="mdi-chart-timeline-variant"
              type="mdi"
              size="2xl"
              class="text-amber-400 dark:text-amber-900/90"
            />
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">
              {{ isDrilldownActive ? drilldownTitle : $t("Person Active in Department") }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ isDrilldownActive ? $t('Click back to return') : $t("Active Activity by Department Overview") }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UiAutocomplete
            v-if="!isDrilldownActive"
            v-model="chartFilterDeptId"
            :options="deptList"
            item-value="id"
            item-title="name"
            :placeholder="getPlaceholder('select', 'Departemen')"
            clearable
            @update:model-value="handleChartDeptFilter"
          />
          <UiAutocomplete
            v-if="isDrilldownActive"
            v-model="chartFilterSectionId"
            :options="sectionList"
            item-value="id"
            item-title="name"
            :placeholder="getPlaceholder('select', 'Seksi')"
            clearable
            @update:model-value="handleChartSectionFilter"
          />
        </div>
      </div>
    </template>

    <UiChart
      v-if="!isDrilldownActive"
      type="bar"
      height="100%"
      :series="mainSeries"
      :options="mainOptions"
      class="min-h-100"
    />
    <UiChart
      v-else
      type="bar"
      height="100%"
      :series="drilldownSeries"
      :options="drilldownOptions"
      class="min-h-100"
    />
  </UiCard>
</template>

<script setup lang="ts">
import { useFormText } from '~/composables/useFormText';


interface DeptItem {
  deptId: number;
  deptName: string;
  deptCode: string;
  activeCount: number;
}

interface SectionItem {
  sectionId: number;
  sectionName: string;
  sectionCode: string;
  activeCount: number;
}

const props = defineProps<{
  deptData: DeptItem[];
  deptList: any[];
  sectionFetch: (departmentId: number) => Promise<SectionItem[]>;
  sectionListFetch: (departmentId: number) => Promise<any[]>;
}>();

const { getPlaceholder } = useFormText();
const sectionList = ref<any[]>([]);
const chartFilterDeptId = ref<number | null>(null);
const chartFilterSectionId = ref<number | null>(null);

const generateColors = (count: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137.508) % 360;
    colors.push(`hsl(${Math.round(hue)}, 65%, 55%)`);
  }
  return colors;
};
const deptColorMap = ref<Record<number, string>>({});
const sectionColorMap = ref<Record<number, string>>({});

const mainSeries = ref<any[]>([{ name: "Personnel", data: [] }]);
const mainOptions = ref<any>({
  chart: {
    type: "bar",
    toolbar: { show: false },
    events: {
      dataPointSelection: (event: any, chartContext: any, config: any) => {
        handleDepartmentClick(event, chartContext, config);
      },
    },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      vertical: true,
      barHeight: "50%",
    },
  },
  dataLabels: { enabled: true },
  xaxis: { categories: [], labels: {} },
  yaxis: { labels: {} },
  grid: { show: false },
  legend: { show: false },
});

const isDrilldownActive = ref(false);
const drilldownTitle = ref("");
const drilldownSeries = ref<any[]>([]);
const drilldownOptions = ref<any>({
  chart: {
    type: "bar",
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      vertical: true,
      barHeight: "50%",
    },
  },
  dataLabels: { enabled: true },
  xaxis: { categories: [], labels: { style: { colors: "#64748b" } } },
  yaxis: { labels: { style: { colors: "#64748b" } } },
  grid: { show: false },
  colors: ["#f59e0b"],
  legend: { show: false },
});

const deptCache = ref<DeptItem[]>([]);
const sectionDataCache = ref<SectionItem[]>([]);

watch(
  () => props.deptData,
  (data) => {
    if (!data || data.length === 0) return;
    deptCache.value = data;

    const names: string[] = [];
    const counts: number[] = [];

    data.forEach((item) => {
      names.push(item.deptName || item.deptCode || "-");
      counts.push(item.activeCount || 0);
    });

    const colors = generateColors(counts.length);
    data.forEach((item, idx) => {
      deptColorMap.value[item.deptId] = colors[idx] || "#f59e0b";
    });

    mainSeries.value = [{ name: "Personnel", data: counts }];
    mainOptions.value = {
      ...mainOptions.value,
      colors,
      plotOptions: {
        ...mainOptions.value.plotOptions,
        bar: {
          ...mainOptions.value.plotOptions.bar,
          distributed: true,
        },
      },
      legend: { show: false },
      xaxis: {
        ...mainOptions.value.xaxis,
        categories: names,
      },
    };
  },
  { immediate: true },
);

const loadSectionListInternal = async (departmentId: number) => {
  try {
    sectionList.value = await props.sectionListFetch(departmentId);
  } catch (error) {
    console.error("Error loading section list:", error);
  }
};

const loadSectionDrilldown = async (departmentId: number) => {
  try {
    const dept = deptCache.value.find((d) => d.deptId === departmentId);
    drilldownTitle.value = `Detail - ${dept?.deptName || "Department"}`;

    const data = await props.sectionFetch(departmentId);
    sectionDataCache.value = data;

    const sectionNames: string[] = [];
    const sectionCounts: number[] = [];

    data.forEach((item) => {
      sectionNames.push(item.sectionName || item.sectionCode || "-");
      sectionCounts.push(item.activeCount || 0);
    });

    const colors = generateColors(sectionCounts.length);
    data.forEach((item, idx) => {
      sectionColorMap.value[item.sectionId] = colors[idx] || "#f59e0b";
    });

    drilldownSeries.value = [
      { name: "Active Personnel", data: sectionCounts },
    ];

    drilldownOptions.value = {
      ...drilldownOptions.value,
      colors,
      plotOptions: {
        ...drilldownOptions.value.plotOptions,
        bar: {
          ...drilldownOptions.value.plotOptions.bar,
          distributed: true,
        },
      },
      legend: { show: false },
      xaxis: {
        ...drilldownOptions.value.xaxis,
        categories: sectionNames,
      },
    };

    isDrilldownActive.value = true;
  } catch (error) {
    console.error("Error loading section drill-down:", error);
  }
};

const handleDepartmentClick = async (
  _event: any,
  _chartContext: any,
  config: any,
) => {
  const dataPointIndex = config.dataPointIndex;
  if (dataPointIndex === undefined || dataPointIndex < 0) return;
  
  const dept = deptCache.value[dataPointIndex];
  if (!dept) return;
  
  chartFilterDeptId.value = dept.deptId;
  loadSectionListInternal(dept.deptId);
  await loadSectionDrilldown(dept.deptId);
};

const handleDrilldownBack = () => {
  isDrilldownActive.value = false;
  chartFilterSectionId.value = null;
  chartFilterDeptId.value = null;

  if (deptCache.value.length > 0) {
    const names = deptCache.value.map(
      (d) => d.deptName || d.deptCode || "-",
    );
    const counts = deptCache.value.map((d) => d.activeCount || 0);
    const colors = deptCache.value.map(
      (d) => deptColorMap.value[d.deptId] || "#f59e0b",
    );

    mainSeries.value = [{ name: "Personnel", data: counts }];
    mainOptions.value = {
      ...mainOptions.value,
      colors,
      xaxis: { ...mainOptions.value.xaxis, categories: names },
    };
  }
};

const handleChartDeptFilter = (val: any) => {
  chartFilterDeptId.value = val;
  chartFilterSectionId.value = null;
  sectionList.value = [];

  if (isDrilldownActive.value) {
    if (val) {
      loadSectionListInternal(val);
      loadSectionDrilldown(val);
    } else {
      isDrilldownActive.value = false;
      handleDrilldownBack();
    }
  } else {
    if (val) {
      const dept = deptCache.value.find((d) => d.deptId === val);
      if (dept) {
        const color = deptColorMap.value[dept.deptId] || "#f59e0b";
        mainSeries.value = [
          { name: "Personnel", data: [dept.activeCount || 0] },
        ];
        mainOptions.value = {
          ...mainOptions.value,
          colors: [color],
          xaxis: {
            ...mainOptions.value.xaxis,
            categories: [dept.deptName || dept.deptCode || "-"],
          },
        };
      }
    } else {
      handleDrilldownBack();
    }
  }
};

const handleChartSectionFilter = (val: any) => {
  chartFilterSectionId.value = val;

  if (val && sectionDataCache.value.length > 0) {
    const section = sectionDataCache.value.find(
      (s) => s.sectionId === val,
    );
    if (section) {
      const color =
        sectionColorMap.value[section.sectionId] || "#f59e0b";
      drilldownSeries.value = [
        { name: "Active Personnel", data: [section.activeCount || 0] },
      ];
      drilldownOptions.value = {
        ...drilldownOptions.value,
        colors: [color],
        xaxis: {
          ...drilldownOptions.value.xaxis,
          categories: [
            section.sectionName || section.sectionCode || "-",
          ],
        },
      };
    }
  } else if (!val && chartFilterDeptId.value) {
    loadSectionDrilldown(chartFilterDeptId.value);
  }
};
</script>

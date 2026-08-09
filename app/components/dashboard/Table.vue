<template>
  <div
    :class="['bg-white dark:bg-slate-800 rounded-sm w-full', elevationClass]"
  >
    <div :class="contentPadding">
      <div
        class="border border-slate-200 dark:border-slate-700 rounded-sm overflow-x-auto"
      >
        <table :class="['w-full', !fitTable && 'min-w-max']">
          <thead>
            <tr
              class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
            >
              <th
                v-if="showNumber"
                class="px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wider border-r border-slate-200 dark:border-slate-700"
                :style="getColumnStyle(64)"
              >
                No.
              </th>

              <th
                v-for="header in headers"
                :key="header.key"
                :style="getColumnStyle(header.width)"
                :class="[
                  'px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wider border-r border-slate-200 dark:border-slate-700',
                  header.sortable
                    ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 select-none'
                    : '',
                  (header.alignHeader || header.align) === 'center'
                    ? 'text-center'
                    : (header.alignHeader || header.align) === 'right'
                      ? 'text-right'
                      : 'text-left',
                ]"
                @click="
                  header.sortable &&
                  handleDataTableSort({
                    key: header.key,
                    order: sortBy[0]?.order === 'asc' ? 'desc' : 'asc',
                  })
                "
              >
                <div
                  :class="[
                    'flex items-center gap-1',
                    (header.alignHeader || header.align) === 'center'
                      ? 'justify-center'
                      : (header.alignHeader || header.align) === 'right'
                        ? 'justify-end'
                        : '',
                  ]"
                >
                  {{ header.title }}
                  <template v-if="header.sortable">
                    <UiIcon
                      v-if="sortBy[0]?.key === header.key"
                      :name="
                        sortBy[0]?.order === 'asc'
                          ? 'mdi-chevron-up'
                          : 'mdi-chevron-down'
                      "
                      size="md"
                      class="opacity-70"
                    />
                    <UiIcon
                      v-else
                      name="mdi-unfold-more-horizontal"
                      size="md"
                      class="opacity-70"
                    />
                  </template>
                </div>
              </th>
            </tr>

            <tr
              v-if="hasSearchableColumns"
              class="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 relative z-10"
            >
              <td
                v-if="showNumber"
                class="px-4 py-2 border-r border-slate-200 dark:border-slate-700"
                :style="getColumnStyle(64)"
              ></td>
              <td
                v-for="header in headers"
                :key="`filter-${header.key}`"
                :style="getColumnStyle(header.width)"
                :class="[
                  'px-4 py-2 border-r border-slate-200 dark:border-slate-700 relative z-20',
                  header.isHidden ? 'hidden' : '',
                  (header.align || 'left') === 'center'
                    ? 'text-center'
                    : (header.align || 'left') === 'right'
                      ? 'text-right'
                      : 'text-left',
                ]"
              >
                <template v-if="header.searchable && !header.isHidden">
                  <div
                    v-if="header.filterType === 'text'"
                    class="flex gap-1 relative z-20"
                  >
                    <UiInput
                      v-model="columnFilters[header.key]"
                      :placeholder="`${header.title}`"
                      size="sm"
                      @input="debounceFilter(header.key)"
                      @clear="applyFilter(header.key)"
                      class="flex-1 max-w-xs"
                      clearable
                    />
                  </div>

                  <div
                    v-else-if="header.filterType === 'autocomplete'"
                    class="flex gap-1 relative z-30"
                  >
                    <UiAutocomplete
                      v-model="columnFilters[header.key]"
                      :options="header.filterOptions || []"
                      :item-value="header.filterValueKey || 'value'"
                      :item-title="header.filterLabelKey || 'label'"
                      :placeholder="`${header.title}`"
                      size="sm"
                      clearable
                      @change="applyFilter(header.key)"
                      class="flex-1 max-w-xs"
                    />
                  </div>

                  <div
                    v-else-if="
                      header.filterType === 'date' ||
                      header.filterType === 'datetime'
                    "
                    class="flex flex-row gap-1 justify-center items-center relative z-30"
                  >
                    <UiDatePicker
                      v-model="columnFilters[header.key]"
                      :mode="header.filterType === 'date' ? 'date' : 'datetime'"
                      :placeholder="`Start ${header.title}`"
                      :error="getDateError(header.key)"
                      size="sm"
                      @update:model-value="applyFilter(header.key)"
                      class="w-full"
                    />
                    -<UiDatePicker
                      v-model="columnFilters[`${header.key}End`]"
                      :mode="header.filterType === 'date' ? 'date' : 'datetime'"
                      :placeholder="`End ${header.title}`"
                      :error="getDateError(`${header.key}End`)"
                      size="sm"
                      @update:model-value="applyFilter(`${header.key}End`)"
                      class="w-full"
                    />
                  </div>
                </template>
              </td>
            </tr>
          </thead>

          <tbody
            class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800"
          >
            <template v-if="loading">
              <tr v-for="i in 5" :key="`loading-${i}`">
                <td
                  v-if="showNumber"
                  class="px-4 py-4 border-r border-slate-200 dark:border-slate-700"
                  :style="getColumnStyle(64)"
                >
                  <div
                    class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-8"
                  />
                </td>
                <td
                  v-for="header in headers"
                  :key="header.key"
                  class="px-4 py-4 border-r border-slate-200 dark:border-slate-700"
                  :style="getColumnStyle(header.width)"
                >
                  <div
                    class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                  />
                </td>
              </tr>
            </template>

            <tr v-else-if="tableData.items.length === 0">
              <td
                :colspan="headers.length + (showNumber ? 1 : 0)"
                class="px-4 py-4 text-center text-slate-500 dark:text-slate-400"
              >
                <div class="flex justify-center items-center gap-2">
                  <UiIcon
                    name="mdi-database-off"
                    size="2xl"
                    class="opacity-50"
                  />
                  <span>No data available</span>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="(item, index) in tableData.items"
              :key="item[rowKey] || index"
              :class="[
                'transition-colors',
                getRowClass ? getRowClass({ item, index }) : '',
              ]"
              @click="handleRowClick(item)"
            >
              <td
                v-if="showNumber"
                class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 text-center"
                :style="getColumnStyle(64)"
              >
                {{ numberInc + index + 1 }}.
              </td>

              <td
                v-for="header in headers"
                :key="header.key"
                :style="getColumnStyle(header.width)"
                :class="[
                  'px-4 py-3 text-sm border-r border-slate-200 dark:border-slate-700',
                  hasCustomTextColor(item, index)
                    ? getTextColorClass(item, index)
                    : 'text-slate-800 dark:text-slate-200',
                  header.align === 'center'
                    ? 'text-center'
                    : header.align === 'right'
                      ? 'text-right'
                      : 'text-left',
                ]"
              >
                <slot
                  :name="`item.${header.key}`"
                  :value="item[header.key]"
                  :item="item"
                >
                  {{ item[header.key] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        :class="[
          'flex flex-wrap items-center gap-2 sm:gap-4 mt-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-2',
          showPaginationInfo ? 'justify-between' : 'justify-end',
        ]"
      >
        <div
          v-if="showPaginationInfo"
          class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 flex-wrap"
        >
          <span class="whitespace-nowrap">{{ $t("Tampilkan") }}</span>
          <select
            :value="currentFilter.pageSize"
            @change="getItemPerPage(Number(($event.target as HTMLSelectElement).value))"
            class="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option
              v-for="opt in itemsPerPageOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.title }}
            </option>
          </select>
          <span
            >{{ $t("Dari") }} {{ tableData.meta.totalItems }}
            {{ $t("data") }}</span
          >
        </div>
        <UiPagination
          :current-page="Number(currentFilter.pageNumber) || 1"
          :total-items="tableData.meta.totalItems"
          :items-per-page="itemsPerPage"
          @update:current-page="handlePageChanged"
          class="flex-wrap justify-center sm:justify-end"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

interface TableMeta {
  totalItems: number;
  currentPage?: number;
  pageSize?: number;
}

interface TableData {
  items: any[];
  meta: TableMeta;
}

interface Props {
  title?: string;
  loading?: boolean;
  showHeader?: boolean;
  showNumber?: boolean;
  rowKey?: string;
  headers?: any[];
  tableData: TableData;
  actionLoading?: Record<string, boolean>;
  rowClass?: (row: {
    item: any;
    index: number;
  }) => string | Record<string, any>;
  rowClick?: (item: any) => void;
  defaultSortBy?: string;
  defaultSortType?: "asc" | "desc";
  headerTheme?:
    | "red"
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "slate"
    | "primary";
  elevated?: "none" | "sm" | "md" | "lg" | "xl";
  contentPadding?: string;
  useLocalPagination?: boolean;
  showPaginationInfo?: boolean;
  fitTable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  loading: false,
  showHeader: true,
  showNumber: true,
  rowKey: "id",
  headers: () => [],
  tableData: () => ({ items: [], meta: { totalItems: 0 } }),
  actionLoading: () => ({}),
  defaultSortBy: "",
  defaultSortType: "desc",
  headerTheme: "primary",
  elevated: "sm",
  contentPadding: "p-0",
  useLocalPagination: false,
  showPaginationInfo: true,
  fitTable: true,
});

const elevationClasses: Record<string, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

const elevationClass = computed(() => {
  return elevationClasses[props.elevated] || "";
});

const emit = defineEmits<{
  (e: "fetchData"): void;
  (e: "addItem"): void;
  (e: "editItem", item: any): void;
  (e: "deleteItem", item: any): void;
  (e: string, ...args: any[]): void;
}>();

const route = useRoute();
const router = useRouter();
const slots = useSlots();
const attrs = useAttrs();

const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { value: 10, title: "10" },
  { value: 20, title: "20" },
  { value: 40, title: "40" },
  { value: 50, title: "50" },
];
const sortBy = ref<{ key: string; order: "asc" | "desc" }[]>([
  { key: props.defaultSortBy, order: props.defaultSortType },
]);
const filterLocal = ref<Record<string, any>>({});
const localFilterLocal = ref<Record<string, any>>({
  pageNumber: 1,
  pageSize: 10,
});
const columnFilters = ref<Record<string, any>>({});
const dateRangeValidation = ref<Record<string, string>>({});

const createDebounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const debouncedFunctions = new Map<string, Function>();

const debounceFilter = (columnKey: string) => {
  if (!debouncedFunctions.has(columnKey)) {
    const fn = createDebounce(() => {
      applyFilter(columnKey);
    }, 1000);
    debouncedFunctions.set(columnKey, fn);
  }
  (debouncedFunctions.get(columnKey) as Function)();
};

const getColumnStyle = (width?: string | number) => {
  if (!width) return {};
  const w = typeof width === "number" ? `${width}px` : width;
  return {
    width: w,
    minWidth: w,
  };
};

const numberInc = computed(() => {
  const currentFilter = props.useLocalPagination
    ? localFilterLocal.value
    : filterLocal.value;
  const pageNumber = parseInt(String(currentFilter.pageNumber)) || 1;
  const pageSize =
    parseInt(String(currentFilter.pageSize)) || itemsPerPage.value;
  const number = (pageNumber - 1) * pageSize;
  return isNaN(number) ? 0 : number;
});

const hasSearchableColumns = computed(() => {
  return props.headers.some((h: any) => h.searchable && !h.isHidden);
});

const currentFilter = computed(() => {
  return props.useLocalPagination ? localFilterLocal.value : filterLocal.value;
});

const formatDateWithTime = (date: any, isEnd: boolean = false) => {
  if (!date) return null;
  
  if (typeof date === 'string' && (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/) || date.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/))) {
    return date.replace(' ', 'T');
  }

  let d: Date;
  if (typeof date === 'string') {
    const isoString = date.replace(' ', 'T');
    d = new Date(isoString);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return null;
  }

  if (isNaN(d.getTime())) {
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const getDateError = (columnKey: string): string => {
  return dateRangeValidation.value[columnKey] || "";
};

const applyFilter = (columnKey: string) => {
  dateRangeValidation.value[columnKey] = "";

  const baseKey = columnKey.endsWith("End")
    ? columnKey.slice(0, -3)
    : columnKey;

  const header = props.headers.find((h: any) => h.key === baseKey);
  if (!header) return;

  if (header.filterType === "date" || header.filterType === "datetime") {
    const startValue = columnFilters.value[header.key];
    const endValue = columnFilters.value[`${header.key}End`];

    if (startValue && endValue) {
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      if (startDate > endDate) {
        dateRangeValidation.value[columnKey] =
          "End date must be after start date";
        return;
      }
    }
  }

  const newQuery: Record<string, any> = { ...route.query, ...filterLocal.value, pageNumber: 1 };

  props.headers.forEach((h: any) => {
    if (h.searchable) {
      if (h.filterType === "date" || h.filterType === "datetime") {
        const startValue = columnFilters.value[h.key];
        const endValue = columnFilters.value[`${h.key}End`];
        if (startValue || endValue) {
          if (startValue) {
            newQuery[`search_start_${h.key}`] = formatDateWithTime(
              startValue,
              false,
            );
          } else {
            delete newQuery[`search_start_${h.key}`];
          }
          if (endValue) {
            newQuery[`search_end_${h.key}`] = formatDateWithTime(
              endValue,
              true,
            );
          } else {
            delete newQuery[`search_end_${h.key}`];
          }
        } else {
          delete newQuery[`search_start_${h.key}`];
          delete newQuery[`search_end_${h.key}`];
        }
      } else {
        const value = columnFilters.value[h.key];
        if (value) {
          newQuery[`search_${h.key}`] = value;
        } else {
          delete newQuery[`search_${h.key}`];
        }
      }
    }
  });

  router.replace({ path: route.path, query: newQuery });
};

const clearFilter = (columnKey: string) => {
  columnFilters.value[columnKey] = null;
  dateRangeValidation.value[columnKey] = "";

  const header = props.headers.find((h: any) => h.key === columnKey);
  if (
    header &&
    (header.filterType === "date" || header.filterType === "datetime")
  ) {
    columnFilters.value[`${header.key}End`] = null;
  }

  applyFilter(columnKey);
};

const handlePageChanged = (page: number) => {
  if (props.useLocalPagination) {
    localFilterLocal.value.pageNumber = page;
  } else {
    const newQuery = { ...route.query, ...filterLocal.value, pageNumber: page };
    router.replace({ path: route.path, query: newQuery });
  }
};

const getItemPerPage = (val: number) => {
  itemsPerPage.value = +val;
  if (props.useLocalPagination) {
    localFilterLocal.value.pageSize = itemsPerPage.value;
  } else {
    filterLocal.value.pageSize = itemsPerPage.value;
    const newQuery = { ...route.query, ...filterLocal.value };
    router.replace({ path: route.path, query: newQuery });
  }
};

const handleDataTableSort = (payload: {
  key: string;
  order: "asc" | "desc";
}) => {
  sortBy.value = [{ key: payload.key, order: payload.order }];
  filterLocal.value.sortBy = payload.key;
  filterLocal.value.sortType = payload.order;
  const newQuery = { ...route.query, ...filterLocal.value };
  router.replace({ path: route.path, query: newQuery });
};

const getTextColorClass = (item: any, index: number): string => {
  const rowClassStr = props.rowClass ? props.rowClass({ item, index }) : "";
  if (!rowClassStr) return "";

  const textColorRegex = /(?:dark:)?text-[^\s]+/g;
  const matches = rowClassStr.match(textColorRegex) || [];
  return matches.join(" ");
};

const hasCustomTextColor = (item: any, index: number): boolean => {
  return getTextColorClass(item, index).length > 0;
};

const getRowClass = (context: { item: any; index: number }): string => {
  const classes: string[] = [];
  const isClickable = typeof props.rowClick === "function";

  let customClass: any = "";
  if (props.rowClass) {
    customClass = props.rowClass(context);
    if (typeof customClass === "string") {
      classes.push(customClass);
    }
  }

  if (!customClass.includes("hover:")) {
    classes.push(
      "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
    );
  }

  if (isClickable) {
    classes.push("cursor-pointer");
  }

  return classes.join(" ");
};

const handleRowClick = (item: any) => {
  if (typeof props.rowClick === "function") {
    props.rowClick(item);
  }
};

const syncFilterLocalFromRoute = () => {
  filterLocal.value = {
    q: (route.query.q as string) || "",
    pageSize: parseInt(route.query.pageSize as string) || itemsPerPage.value,
    pageNumber: parseInt(route.query.pageNumber as string) || 1,
    sortBy: (route.query.sortBy as string) || props.defaultSortBy,
    sortType: ((route.query.sortType as "asc" | "desc") ||
      props.defaultSortType) as "asc" | "desc",
  };

  columnFilters.value = {};
  props.headers.forEach((header: any) => {
    if (header.filterType === "date" || header.filterType === "datetime") {
      const startKey = `search_start_${header.key}`;
      const endKey = `search_end_${header.key}`;
      
      if (route.query[startKey]) {
        let fullValue = route.query[startKey] as string;
        fullValue = fullValue.replace('T', ' ');
        const dateValue = header.filterType === 'datetime' ? fullValue : fullValue.split(' ')[0];
        columnFilters.value[header.key] = dateValue;
      }
      
      if (route.query[endKey]) {
        let fullValue = route.query[endKey] as string;
        fullValue = fullValue.replace('T', ' ');
        const dateValue = header.filterType === 'datetime' ? fullValue : fullValue.split(' ')[0];
        columnFilters.value[`${header.key}End`] = dateValue;
      }
    } else {
      const searchKey = `search_${header.key}`;
      if (route.query[searchKey]) {
        columnFilters.value[header.key] = route.query[searchKey];
      }
    }
  });
};

watch(
  () => route.query,
  () => {
    syncFilterLocalFromRoute();
    emit("fetchData");
  },
  { immediate: true },
);

watch(sortBy, () => {
  const sort = sortBy.value[0];
  if (sort) {
    filterLocal.value.sortBy = sort.key;
    filterLocal.value.sortType = sort.order;
    router.replace({ path: route.path, query: filterLocal.value });
  }
});

onMounted(() => {
  syncFilterLocalFromRoute();
});
</script>

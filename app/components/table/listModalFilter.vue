<template>
  <div :class="['bg-white dark:bg-slate-800 rounded-sm overflow-hidden', elevationClass]">
    <!-- Header Bar -->
    <div v-if="showHeader" :class="['flex flex-wrap items-center justify-between gap-3 px-5 py-1', headerClass]">
      <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
      <div class="flex items-center gap-1">
        <ClientOnly>
          <template v-for="action in validActions(actionToolbars, {})" :key="action.key || action.emit">
            <UiIconButton
              :icon="action.icon || 'mdi-help'"
              :tooltip="action.tooltip"
              :color="action.color"
              :to="resolveActionTo(action, {})"
              :href="resolveActionHref(action, {})"
              :target="resolveActionTarget(action)"
              :loading="action.key ? actionLoading?.[action.key] : false"
              variant="ghost"
              size="lg"
              @click="(e) => handleToolbarClick(action, e)"
            />
          </template>
        </ClientOnly>
        <!-- Filter Button with active count badge -->
        <button
          v-if="hasModalFilters"
          type="button"
          class="relative w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors text-white"
          :title="$t('Filter Data')"
          @click="openModal"
        >
          <i class="mdi mdi-filter text-xl"></i>
          <span
            v-if="activeFiltersCount > 0"
            class="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-primary-500"
          >
            {{ activeFiltersCount }}
          </span>
        </button>

        <UiIconButton
          icon="mdi-refresh"
          :tooltip="$t('Muat Ulang')"
          color="white"
          variant="ghost"
          size="lg"
          @click="handleRefreshItems"
        />
      </div>
    </div>

    <div :class="contentPadding">
      <!-- Filters (wrapped in ClientOnly to avoid SSR hydration mismatch) -->
      <ClientOnly>
        <div v-if="aboveTableFilterSchema.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 mb-5 auto-rows-max">
          <template v-for="f in aboveTableFilterSchema" :key="f.name">
            <div 
              :class="getFilterColClasses(f)"
            > 
              <div class="flex items-center gap-2 w-full">
                <component
                  :is="componentResolver(f.type)"
                  :model-value="filterLocal[f.name]"
                  :field="f"
                  :disabled="isDisabled(f)"
                  :items="getList(f.items)"
                  class="flex-1"
                  @apply="handleApplyFilterField(f)"
                  @update:model-value="(val: any) => handleFilterUpdate(f, val)"
                >
                  <template v-if="f.type === 'search' && addAction" #append>  
                    <UiIconButton
                      :icon="addAction.icon || 'mdi-plus'"
                      :tooltip="addAction.tooltip"
                      :color="addAction.color || 'primary'"
                      :to="resolveActionTo(addAction, {})"
                      :href="resolveActionHref(addAction, {})"
                      :target="resolveActionTarget(addAction)"
                      variant="ghost"
                      rounded="full"
                      size="xl"
                      @click="(e) => handleToolbarClick(addAction, e)"
                    />
                  </template>

                  <template v-if="f.type === 'custom' && f.slotKey" #default>
                    <slot :name="f.slotKey" />
                  </template>
                </component>
              </div>
            </div>
          </template>
        </div>

        <!-- Active Filters Chips -->
        <div v-if="activeChips.length > 0" class="flex flex-wrap items-center gap-2 mb-5">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-400">
            {{ $t('Filter Data') }}:
          </span>
          <UiChip
            v-for="chip in activeChips"
            :key="chip.name"
            color="primary"
            variant="outline"
            size="lg"
            clearable
            @close="removeFilter(chip.field)"
          >
            <span class="font-semibold">{{ $t(chip.label) }}:</span> {{ chip.displayValue }}
          </UiChip>
        </div>
        <template #fallback>
          <div class="grid grid-cols-12 gap-4 mb-5">
            <div class="col-span-12 md:col-span-8"></div>
            <div class="col-span-12 md:col-span-4">
              <div class="h-10 bg-gray-100 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Table -->
      <UiDataTable
        v-if="showTable"
        :headers="headers"
        :items="tableData.items"
        :loading="loading"
        :show-actions="actions.length > 0"
        :start-number="numberInc"
        :sort-key="sortBy[0]?.key"
        :sort-order="sortBy[0]?.order"
        :get-row-class="getRowClass"
        :row-clickable="!!$attrs.onRowClick"
        :fit-table="fitTable"
        @sort="handleDataTableSort"
        @row-click="handleRowClick"
      >
        <template v-if="$slots.header" #header>
          <slot
            name="header"
            :sort-key="sortBy[0]?.key || ''"
            :sort-order="sortBy[0]?.order || 'desc'"
            :on-sort="handleDataTableSort"
          />
        </template>

        <!-- Pass through all item.* slots (except actions) -->
        <template v-for="header in headers.filter(h => h.key !== undefined && h.key !== 'actions')" :key="header.key" #[`item.${header.key}`]="slotProps">
          <slot :name="`item.${header.key}`" v-bind="slotProps">
            {{ header.formatter ? header.formatter(slotProps.value) : slotProps.value }}
          </slot>
        </template>

        <!-- Actions column -->
        <template #item.actions="{ item }">
          <slot name="item.actions" :item="item">
            <div v-if="actions.length > 0" class="flex items-center justify-center gap-1.5">
              <ClientOnly>
                <template v-if="actionType === 'dropdown'">
                  <UiDropdown
                    v-if="validActions(actions, item).length > 0"
                    :items="getDropdownActions(actions, item)"
                    @select="(opt) => handleDropdownSelect(opt, item)"
                    align="left"
                  >
                    <template #trigger>
                      <UiButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                      >
                        <span>{{ actionDropdownLabel }}</span>
                        <i class="mdi mdi-chevron-down text-base ml-1" />
                      </UiButton>
                    </template>
                    <template #item="{ item: opt }">
                      <div class="flex items-center gap-2">
                        <i v-if="opt.icon" :class="['mdi', opt.icon, 'text-lg', opt.color]" />
                        <span>{{ opt.label }}</span>
                      </div>
                    </template>
                  </UiDropdown>
                </template>
                <template v-else>
                  <template v-for="action in validActions(actions, item)" :key="action.key || action.emit">
                    <UiIconButton
                      :icon="action.icon || 'mdi-help'"
                      :tooltip="action.tooltip"
                      :color="action.color"
                      :to="resolveActionTo(action, item)"
                      :href="resolveActionHref(action, item)"
                      :target="resolveActionTarget(action)"
                      size="sm"
                      rounded="md"
                      @click="(e) => handleActionClick(action, item, e)"
                    />
                  </template>
                </template>
              </ClientOnly>
            </div>
          </slot>
        </template>

        <!-- Summary / Tfoot Slot -->
        <template v-if="$slots.tfoot || $slots.summary" #tfoot="slotProps">
          <slot name="tfoot" v-bind="slotProps">
            <slot name="summary" v-bind="slotProps" />
          </slot>
        </template>
      </UiDataTable>

      <!-- Below Table / Summary Section Slot -->
      <slot name="belowTable" />

      <!-- Pagination -->
      <div
        v-if="showPagination"
        class="flex flex-wrap items-center justify-between gap-4 mt-4"
      >
        <div class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
          <span>{{ $t('Tampilkan') }}</span>
          <select
            v-model="filterLocal.pageSize"
            @change="getItemPerPage(filterLocal.pageSize)"
            class="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option v-for="opt in itemsPerPageOptions" :key="opt.value" :value="opt.value">
              {{ opt.title }}
            </option>
          </select>
          <span>{{ $t('Dari') }} {{ tableData.meta.totalItems }} {{ $t('data') }}</span>
        </div>
        <UiPagination
          :current-page="Number(filterLocal.pageNumber) || 1"
          :total-items="tableData.meta.totalItems"
          :items-per-page="itemsPerPage"
          @update:current-page="handlePageChanged"
        />
      </div>
    </div>

    <!-- Modal Filter Dialog -->
    <UiModal v-model="showFilterModal" :title="$t('Filter Data') || 'Filter Data'" size="lg">
      <div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 auto-rows-max">
          <template v-for="f in modalFilterSchema" :key="f.name">
            <div :class="getFilterColClasses(f, true)">
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {{ $t(f.modalLabel || f.label || f.name) }}
              </label>
              <component
                :is="componentResolver(f.type)"
                v-model="tempFilterLocal[f.name]"
                :field="f"
                :disabled="isDisabled(f)"
                :items="getList(f.items)"
              >
                <template v-slot:default v-if="f.type === 'custom' && f.slotKey">
                  <slot :name="f.slotKey" />
                </template>
              </component>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <UiButton
          color="secondary"
          variant="outline"
          @click="resetModalFilters"
        >
          {{ $t('Reset') }}
        </UiButton>
        <div class="flex items-center gap-2 ml-auto">
          <UiButton
            color="secondary"
            @click="showFilterModal = false"
          >
            {{ $t('Batal') }}
          </UiButton>
          <UiButton
            color="primary"
            @click="applyModalFilters"
          >
            {{ $t('Terapkan') }}
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'
import type { DropdownItem } from '~/components/ui/Dropdown.vue'

defineOptions({
  inheritAttrs: false
})

const { hasPermission, hasAnyPermission } = usePermission()

// Types
interface Header {
  key?: string
  title: string
  width?: string
  sortable?: boolean
  translate?: boolean
  formatter?: (value: any) => string
  rowspan?: number
  colspan?: number
  row?: number
}

interface FilterField {
  name: string
  label?: string
  modalLabel?: string
  type: 'date' | 'autocomplete' | 'search' | 'select' | 'number' | 'text' | 'custom'
  items?: string
  valueKey?: string
  textKey?: string | ((item: any) => string)
  emits?: string
  colMd?: number
  colModalMd?: number
  disabled?: boolean | ((item: any) => boolean)
  default?: any
  resetOnSelect?: Record<string, any>
  slotKey?: string
  placeholder?: string
  showInModal?: boolean
  showAboveTable?: boolean
  showChip?: boolean
  debounce?: boolean | number
}

interface Action {
  key?: string
  label?: string
  value?: string
  icon?: string
  color?: string
  tooltip?: string
  show?: (item: any) => boolean
  permission?: string | string[]
  emit?: string
  type?: 'default'
  to?: string | ((item: any) => string)
  href?: string | ((item: any) => string)
  target?: '_blank' | '_self' | string
  openInNewTab?: boolean
}

interface TableMeta {
  totalItems: number
  currentPage?: number
  pageSize?: number
}

interface TableData {
  items: any[]
  meta: TableMeta
}

interface Props {
  title?: string
  loading?: boolean
  showHeader?: boolean
  headers: Header[]
  tableData: TableData
  filterSchema?: FilterField[]
  actions?: Action[]
  actionType?: 'button' | 'dropdown'
  actionDropdownLabel?: string
  actionToolbars?: Action[]
  filterList?: Record<string, any[]>
  actionLoading?: Record<string, boolean>
  rowClass?: (row: { item: any }) => string | Record<string, any>
  rowClick?: (item: any) => void
  defaultSortBy?: string
  defaultSortType?: 'asc' | 'desc'
  headerTheme?: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'slate' | 'primary'
  elevated?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  permissionTag?: string
  contentPadding?: string
  fitTable?: boolean
  showTable?: boolean
  showPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  loading: false,
  showHeader: true,
  headers: () => [],
  tableData: () => ({ items: [], meta: { totalItems: 0 } }),
  filterSchema: () => [],
  actions: () => [],
  actionType: 'button',
  actionDropdownLabel: 'Tools',
  actionToolbars: () => [],
  filterList: () => ({}),
  actionLoading: () => ({}),
  defaultSortBy: '',
  defaultSortType: 'desc',
  headerTheme: 'primary',
  elevated: 'sm',
  contentPadding: 'p-6',
  fitTable: true,
  showTable: true,
  showPagination: true,
})

// Header theme classes
const headerThemeClasses: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  slate: 'bg-slate-500',
  primary: 'bg-primary-500',
}

const headerClass = computed(() => {
  return headerThemeClasses[props.headerTheme] || headerThemeClasses.primary
})

// Elevation (shadow) classes
const elevationClasses: Record<string, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
}

const elevationClass = computed(() => {
  return elevationClasses[props.elevated] || ''
})

const emit = defineEmits<{
  (e: 'fetchData'): void
  (e: 'addItem'): void
  (e: 'editItem', item: any): void
  (e: 'deleteItem', item: any): void
  (e: string, ...args: any[]): void
}>()

const route = useRoute()
const router = useRouter()
const slots = useSlots()
const attrs = useAttrs()

const emitDynamic = (eventName?: string, ...args: any[]) => {
  if (!eventName) return
  const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
  const handler = attrs[handlerName] as ((...args: any[]) => void) | undefined
  if (handler) {
    handler(...args)
  } else {
    emit(eventName as any, ...args)
  }
}

// State
const itemsPerPage = ref(10)
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 40, title: '40' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]
const initialSortOrder =
  String(route.query.sortType || props.defaultSortType).toLowerCase() === 'asc'
    ? 'asc'
    : 'desc'
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
  {
    key: String(route.query.sortBy || props.defaultSortBy),
    order: initialSortOrder,
  },
])
const filterLocal = ref<Record<string, any>>({})
const tempFilterLocal = ref<Record<string, any>>({})
const showFilterModal = ref(false)

// Computed for dynamic filter schema subsets
const aboveTableFilterSchema = computed(() => {
  return props.filterSchema.filter((f) => {
    if (f.showAboveTable !== undefined) return f.showAboveTable
    return !f.showInModal
  })
})

const modalFilterSchema = computed(() => {
  return props.filterSchema.filter((f) => f.showInModal)
})

const hasModalFilters = computed(() => {
  return modalFilterSchema.value.length > 0
})

const activeFiltersCount = computed(() => {
  return modalFilterSchema.value.filter((f) => {
    const val = filterLocal.value[f.name]
    return val !== null && val !== undefined && val !== ""
  }).length
})

const getFieldLabel = (f: FilterField) => {
  if (f.label) return f.label
  if (f.modalLabel) return f.modalLabel
  
  if (f.placeholder) {
    const cleanPlaceholder = f.placeholder.replace(/^(Pilih|Cari|Select|Search)\s+/i, '')
    if (cleanPlaceholder) {
      return cleanPlaceholder
    }
  }
  
  const name = f.name || ''
  const cleanName = name.replace(/Id(s)?$/i, '')
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
}

const activeChips = computed(() => {
  return modalFilterSchema.value
    .filter((f) => {
      if (f.showChip) {
        return false
      }
      
      // Exclude if it is also displayed above the table
      const isShownAbove = f.showAboveTable !== undefined ? f.showAboveTable : !f.showInModal
      if (isShownAbove) {
        return false
      }
      
      if (!f.name || f.name === 'q' || f.name === 'pageSize' || f.name === 'pageNumber' || f.name === 'sortBy' || f.name === 'sortType' || f.name === 't') {
        return false
      }
      const val = filterLocal.value[f.name]
      return val !== null && val !== undefined && val !== ''
    })
    .map((f) => {
      const val = filterLocal.value[f.name]
      let displayValue = val
      
      if (f.type === 'select' || f.type === 'autocomplete') {
        const items = getList(f.items)
        const valKey = f.valueKey || 'value'
        const titleKey = f.textKey || 'label'
        
        const selectedItem = items.find((item) => {
          const itemVal = item[valKey]
          return itemVal !== undefined && itemVal !== null && String(itemVal) === String(val)
        })
        
        if (selectedItem) {
          if (typeof titleKey === 'function') {
            displayValue = titleKey(selectedItem)
          } else {
            displayValue = selectedItem[titleKey]
          }
        }
      }
      
      return {
        name: f.name,
        label: getFieldLabel(f),
        value: val,
        displayValue: displayValue,
        field: f
      }
    })
})

const removeFilter = (field: FilterField) => {
  filterLocal.value[field.name] = null
  
  if (tempFilterLocal.value && field.name in tempFilterLocal.value) {
    tempFilterLocal.value[field.name] = null
  }

  handleApplyFilterField(field)
}

const numberInc = computed(() => {
  const number = parseInt(String(filterLocal.value.pageNumber - 1)) * itemsPerPage.value || 0
  return number
})

const resolvePermission = (perm: string): string => {
  if (!props.permissionTag) return perm
  if (perm.includes('.')) return perm
  return `${props.permissionTag}.${perm}`
}

const checkPermissionRule = (permission?: string | string[]) => {
  if (!permission) return true
  if (Array.isArray(permission)) {
    return hasAnyPermission(permission.map(resolvePermission))
  }
  return hasPermission(resolvePermission(permission))
}

const addAction = computed(() => {
  return props.actionToolbars?.find((a) => {
    if (a.type !== 'default') return false
    if (!checkPermissionRule(a.permission)) return false
    return a.show?.({}) !== false
  })
})

// Methods
const validActions = (arr: Action[], item: any) => {
  return arr.filter((a) => {
    if (a.type === 'default') return false
    if (!checkPermissionRule(a.permission)) return false
    if (typeof a.show === 'function') return a.show(item)
    return true
  })
}

const resolveActionTo = (action: Action, item: any): string | undefined => {
  if (typeof action.to === 'function') {
    return action.to(item)
  }
  return action.to
}

const resolveActionHref = (action: Action, item: any): string | undefined => {
  const hrefVal = typeof action.href === 'function' ? action.href(item) : action.href
  if (hrefVal) return hrefVal
  const toVal = typeof action.to === 'function' ? action.to(item) : action.to
  if (typeof toVal === 'string') return toVal
  if (toVal && typeof toVal === 'object' && (toVal as any).path) {
    let url = (toVal as any).path
    if ((toVal as any).query) {
      const params = new URLSearchParams((toVal as any).query).toString()
      if (params) url += '?' + params
    }
    return url
  }
  return undefined
}

const resolveActionTarget = (action: Action): string | undefined => {
  if (action.target) return action.target
  if (action.openInNewTab) return '_blank'
  return undefined
}

const getDropdownActions = (arr: Action[], item: any): DropdownItem[] => {
  return validActions(arr, item).map((a) => ({
    label: a.label || a.tooltip || a.key || '',
    value: a.value || a.key || a.emit || '',
    icon: a.icon,
    color: a.color,
    emit: a.emit,
    to: resolveActionTo(a, item),
    href: resolveActionHref(a, item),
    target: resolveActionTarget(a),
    openInNewTab: a.openInNewTab,
  }))
}

const handleToolbarClick = (action: Action, event?: MouseEvent) => {
  const href = resolveActionHref(action, {})
  const target = resolveActionTarget(action)
  if (href) {
    if (target === '_blank') {
      window.open(href, '_blank')
    } else if (event && (event.ctrlKey || event.metaKey)) {
      window.open(href, '_blank')
    } else {
      navigateTo(href)
    }
  } else if (action.emit) {
    emit(action.emit as any)
  }
}

const handleActionClick = (action: Action, item: any, event?: MouseEvent) => {
  const href = resolveActionHref(action, item)
  const target = resolveActionTarget(action)
  if (href) {
    if (target === '_blank') {
      window.open(href, '_blank')
    } else if (event && (event.ctrlKey || event.metaKey)) {
      window.open(href, '_blank')
    } else {
      navigateTo(href)
    }
  } else if (action.emit) {
    emitDynamic(action.emit, item)
  }
}

const handleDropdownSelect = (opt: DropdownItem, item: any, event?: MouseEvent) => {
  const href = opt.href || opt.to
  const target = opt.target || (opt.openInNewTab ? '_blank' : undefined)
  if (href) {
    if (target === '_blank') {
      window.open(href, '_blank')
    } else if (event && (event.ctrlKey || event.metaKey)) {
      window.open(href, '_blank')
    } else {
      navigateTo(href)
    }
  } else if (opt.emit) {
    emitDynamic(opt.emit, item)
  }
}

const resetFilterFromSchema = () => {
  const base: Record<string, any> = {
    q: '',
    pageSize: itemsPerPage.value,
    pageNumber: 1,
    sortBy: props.defaultSortBy,
    sortType: props.defaultSortType,
    t: Date.now(),
  }
  
  props.filterSchema.forEach((f) => {
    if (!f?.name) return
    base[f.name] = f.hasOwnProperty('default')
      ? f.default
      : f.type === 'date'
        ? new Date().toISOString().substring(0, 10)
        : null
  })
  
  filterLocal.value = base
}

const componentResolver = (type: string) => {
  switch (type) {
    case 'date':
      return resolveComponent('TableFilterDate')
    case 'autocomplete':
      return resolveComponent('TableFilterAutocomplete')
    case 'search':
      return resolveComponent('TableFilterSearch')
    case 'select':
      return resolveComponent('TableFilterSelect')
    case 'number':
      return resolveComponent('TableFilterNumber')
    case 'text':
    default:
      return resolveComponent('TableFilterText')
  }
}

const isDisabled = (field: FilterField) => {
  if (typeof field.disabled === 'function') {
    return field.disabled(filterLocal.value)
  }
  return !!field.disabled
}

const colSpanMap: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
}

const getFilterColClasses = (field: FilterField, isModal = false) => {
  const colMd = isModal ? (field.colModalMd || field.colMd || 6) : (field.colMd || 2)
  const lgClass = colSpanMap[colMd] || 'lg:col-span-2'
  
  return `col-span-1 sm:col-span-1 ${lgClass}`
}

const debounceTimers = ref<Record<string, any>>({})

const clearDebounceTimer = (fieldName?: string) => {
  if (fieldName) {
    if (debounceTimers.value[fieldName]) {
      clearTimeout(debounceTimers.value[fieldName])
      delete debounceTimers.value[fieldName]
    }
  } else {
    Object.keys(debounceTimers.value).forEach((key) => {
      clearTimeout(debounceTimers.value[key])
    })
    debounceTimers.value = {}
  }
}

const handleFilterUpdate = (field: FilterField, val: any) => {
  filterLocal.value[field.name] = val
  handleFilterInput(field)
}

const handleFilterInput = (field: FilterField) => {
  if (field.type === 'select' || field.type === 'autocomplete' || field.type === 'date') {
    return
  }

  if (field.debounce === false) {
    return
  }

  const isSearchField = field.type === 'search' || field.name === 'q' || !!field.debounce
  if (!isSearchField) {
    return
  }

  clearDebounceTimer(field.name)
  const delay = typeof field.debounce === 'number' ? field.debounce : 500
  debounceTimers.value[field.name] = setTimeout(() => {
    handleApplyFilterField(field)
  }, delay)
}

const handleApplyFilterField = (field: FilterField) => {
  clearDebounceTimer(field.name)

  if (field.resetOnSelect && typeof field.resetOnSelect === 'object') {
    Object.keys(field.resetOnSelect).forEach((k) => {
      filterLocal.value[k] = field.resetOnSelect![k]
    })
  }

  if (field.emits) {
    emit(field.emits as any, { [field.name]: filterLocal.value[field.name] })
  }

  filterLocal.value.pageNumber = 1
  filterLocal.value.t = Date.now()
  router.replace({ path: route.path, query: filterLocal.value })
}

onUnmounted(() => {
  clearDebounceTimer()
})

const openModal = () => {
  tempFilterLocal.value = { ...filterLocal.value }
  showFilterModal.value = true
}

const applyModalFilters = () => {
  Object.keys(tempFilterLocal.value).forEach((k) => {
    filterLocal.value[k] = tempFilterLocal.value[k]
  })
  
  filterLocal.value.pageNumber = 1
  filterLocal.value.t = Date.now()
  router.replace({ path: route.path, query: filterLocal.value })
  showFilterModal.value = false
}

const resetModalFilters = () => {
  modalFilterSchema.value.forEach((f) => {
    tempFilterLocal.value[f.name] = f.hasOwnProperty('default')
      ? f.default
      : f.type === 'date'
        ? new Date().toISOString().substring(0, 10)
        : null
  })
}

const handleRefreshItems = () => {
  filterLocal.value.q = ''
  filterLocal.value.pageNumber = 1
  filterLocal.value.t = Date.now()
  
  // Clear modal filters too
  modalFilterSchema.value.forEach((f) => {
    filterLocal.value[f.name] = f.hasOwnProperty('default') ? f.default : null
  })
  
  router.replace({ path: route.path, query: filterLocal.value })
}

const handlePageChanged = (page: number) => {
  filterLocal.value.pageNumber = page
  router.replace({ path: route.path, query: filterLocal.value })
}

const getItemPerPage = (val: number) => {
  itemsPerPage.value = +val
  filterLocal.value.pageSize = itemsPerPage.value
  filterLocal.value.pageNumber = 1
  router.replace({ path: route.path, query: filterLocal.value })
}

// Handle sort from UiDataTable component
const handleDataTableSort = (payload: { key: string; order: 'asc' | 'desc' }) => {
  sortBy.value = [{ key: payload.key, order: payload.order }]
  filterLocal.value.sortBy = payload.key
  filterLocal.value.sortType = payload.order
  filterLocal.value.pageNumber = 1
  router.replace({ path: route.path, query: filterLocal.value })
}

const getList = (name?: string) => {
  if (!name) return []
  const listRef = props.filterList[name]
  return Array.isArray(listRef) ? listRef : []
}

const getRowClass = (context: { item: any; index: number }): string => {
  const classes: string[] = []
  const isClickable = typeof props.rowClick === 'function'
  
  // Add hover styles
  classes.push('hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors')
  
  // Add clickable cursor
  if (isClickable) {
    classes.push('cursor-pointer')
  }
  
  // Add custom row classes from props
  if (props.rowClass) {
    const customClass = props.rowClass(context)
    if (typeof customClass === 'string') {
      classes.push(customClass)
    }
  }
  
  return classes.join(' ')
}

const handleRowClick = (item: any) => {
  if (typeof props.rowClick === 'function') {
    props.rowClick(item)
  }
}

// Watchers
watch(() => route.query, () => {
  emit('fetchData')
}, { immediate: true })

watch(sortBy, () => {
  const sort = sortBy.value[0]
  if (sort) {
    filterLocal.value.sortBy = sort.key
    filterLocal.value.sortType = sort.order
    router.replace({ path: route.path, query: filterLocal.value })
  }
})

watch(() => props.filterSchema, () => {
  resetFilterFromSchema()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  resetFilterFromSchema()
  
  if (route.query && Object.keys(route.query).length) {
    const q = route.query
    Object.keys(q).forEach((k) => {
      if (k in filterLocal.value) {
        const schemaField = props.filterSchema.find((f) => f.name === k)
        const value = q[k]
        
        // Convert to number for number type, autocomplete, and select if value is numeric
        if (schemaField?.type === 'number') {
          filterLocal.value[k] = Number(value)
        } else if ((schemaField?.type === 'autocomplete' || schemaField?.type === 'select') && value) {
          // Check if value is numeric string - convert to number to match option ids
          filterLocal.value[k] = !isNaN(Number(value)) ? Number(value) : value
        } else {
          filterLocal.value[k] = value
        }
      }
    })
  }

  const restoredPageSize = Number(filterLocal.value.pageSize)
  if (Number.isFinite(restoredPageSize) && restoredPageSize > 0) {
    itemsPerPage.value = restoredPageSize
    filterLocal.value.pageSize = restoredPageSize
  }
})

watch(
  () => props.tableData?.meta?.totalItems,
  (total) => {
    const totalItems = Number(total) || 0
    if (totalItems <= 0) return

    const lastPage = Math.max(1, Math.ceil(totalItems / (itemsPerPage.value || 1)))
    if ((Number(filterLocal.value.pageNumber) || 1) > lastPage) {
      handlePageChanged(lastPage)
    }
  },
)
</script>

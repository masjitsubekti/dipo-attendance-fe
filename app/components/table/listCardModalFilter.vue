<template>
  <div :class="['bg-transparent md:bg-white dark:md:bg-slate-800 rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-none md:shadow-xs', elevationClass]">
    <!-- Header Bar -->
    <div
      v-if="showHeader"
      :class="[
        'flex items-center justify-between gap-2 sm:gap-4 transition-colors',
        'bg-transparent text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-3 px-1 md:px-5 md:py-3.5 md:border-b-0 md:mb-0 md:text-white',
        desktopHeaderClass
      ]"
    >
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h2 class="text-base sm:text-lg font-bold tracking-tight truncate md:text-white">
            {{ title }}
          </h2>
          <slot name="titleBadge" />
        </div>
        <p v-if="subtitle" class="text-xs text-slate-500 dark:text-slate-400 md:text-white/80 mt-0.5 truncate">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <ClientOnly>
          <template v-for="action in validActions(actionToolbars, {})" :key="action.key || action.emit">
            <UiButton
              v-if="action.label"
              size="sm"
              :color="action.color || 'primary'"
              variant="filled"
              :to="resolveActionTo(action, {})"
              :href="resolveActionHref(action, {})"
              :target="resolveActionTarget(action)"
              :loading="action.key ? actionLoading?.[action.key] : false"
              class="!font-semibold cursor-pointer"
              @click="(e) => handleToolbarClick(action, e)"
            >
              <i v-if="action.icon" :class="['mdi', action.icon, 'mr-1.5']"></i>
              <span>{{ action.label }}</span>
            </UiButton>
            <UiIconButton
              v-else
              :icon="action.icon || 'mdi-help'"
              :tooltip="action.tooltip"
              :color="action.color || 'inherit'"
              :to="resolveActionTo(action, {})"
              :href="resolveActionHref(action, {})"
              :target="resolveActionTarget(action)"
              :loading="action.key ? actionLoading?.[action.key] : false"
              variant="ghost"
              size="md"
              class="text-slate-600 dark:text-slate-300 md:text-white hover:bg-black/10 md:hover:bg-white/20"
              @click="(e) => handleToolbarClick(action, e)"
            />
          </template>
        </ClientOnly>

        <!-- Filter Button with active count badge -->
        <button
          v-if="hasModalFilters"
          type="button"
          class="relative px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 md:border-white/30 bg-white dark:bg-slate-800 md:bg-white/15 hover:bg-slate-50 dark:hover:bg-slate-700/60 md:hover:bg-white/25 text-slate-700 dark:text-slate-200 md:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          :title="$t('Filter Data')"
          @click="openModal"
        >
          <i class="mdi mdi-filter-variant text-sm text-primary-600 dark:text-primary-400 md:text-white"></i>
          <span
            v-if="activeFiltersCount > 0"
            class="min-w-4 h-4 px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
          >
            {{ activeFiltersCount }}
          </span>
        </button>

        <UiIconButton
          icon="mdi-refresh"
          :tooltip="$t('Muat Ulang')"
          color="inherit"
          variant="ghost"
          size="md"
          class="text-slate-600 dark:text-slate-300 md:text-white hover:bg-black/10 md:hover:bg-white/20"
          @click="handleRefreshItems"
        />
      </div>
    </div>

    <div class="p-0 md:p-5 space-y-4">
      <!-- Filters (wrapped in ClientOnly to avoid SSR hydration mismatch) -->
      <ClientOnly>
        <div v-if="aboveTableFilterSchema.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 mb-5 auto-rows-max">
          <template v-for="f in aboveTableFilterSchema" :key="f.name">
            <div :class="getFilterColClasses(f)">
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
                      :to="resolveActionTo(addAction!, {})"
                      :href="resolveActionHref(addAction!, {})"
                      :target="resolveActionTarget(addAction!)"
                      variant="ghost"
                      rounded="full"
                      size="xl"
                      @click="(e) => handleToolbarClick(addAction!, e)"
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
        <div v-if="activeChips.length > 0" class="flex flex-wrap items-center gap-2 mb-4">
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {{ $t('Filter Data') }}:
          </span>
          <UiChip
            v-for="chip in activeChips"
            :key="chip.name"
            color="primary"
            variant="outline"
            size="md"
            clearable
            @close="removeFilter(chip.field)"
          >
            <span class="font-semibold">{{ $t(chip.label) }}:</span> {{ chip.displayValue }}
          </UiChip>
        </div>
        <template #fallback>
          <div class="grid grid-cols-12 gap-4 mb-4">
            <div class="col-span-12 md:col-span-8"></div>
            <div class="col-span-12 md:col-span-4">
              <div class="h-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Content Area: Dual Mode (Desktop Table + Mobile Cards) -->
      <div v-if="showTable">
        <!-- 1. DESKTOP TABLE VIEW (md and up) - Styled like AdminDashboard2.vue -->
        <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
          <table class="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
                <th v-if="showNumber" class="py-3 px-4 w-12 text-center">No.</th>
                <th
                  v-for="header in bodyHeaders"
                  :key="header.key"
                  :style="{ width: header.width }"
                  :class="[
                    'py-3 px-4 font-bold tracking-tight',
                    header.sortable ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 select-none' : '',
                    header.align === 'center' ? 'text-center' : header.align === 'right' ? 'text-right' : 'text-left'
                  ]"
                  @click="header.sortable && header.key && handleDataTableSort({ key: header.key, order: sortBy[0]?.key === header.key && sortBy[0]?.order === 'asc' ? 'desc' : 'asc' })"
                >
                  <div :class="['flex items-center gap-1', header.align === 'center' ? 'justify-center' : header.align === 'right' ? 'justify-end' : '']">
                    <span>{{ header.title }}</span>
                    <i
                      v-if="header.sortable && header.key"
                      :class="[
                        'mdi text-sm opacity-70',
                        sortBy[0]?.key === header.key
                          ? (sortBy[0]?.order === 'asc' ? 'mdi-chevron-up text-primary-600' : 'mdi-chevron-down text-primary-600')
                          : 'mdi-unfold-more-horizontal'
                      ]"
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
              <!-- Table Loading Skeleton -->
              <template v-if="showSkeletonLoader">
                <tr v-for="i in 5" :key="`loading-${i}`" class="animate-pulse">
                  <td v-if="showNumber" class="py-3 px-4 text-center">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-6 mx-auto"></div>
                  </td>
                  <td v-for="header in bodyHeaders" :key="header.key" class="py-3 px-4">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </td>
                </tr>
              </template>

              <!-- Table Empty State -->
              <tr v-else-if="tableData.items.length === 0">
                <td :colspan="bodyHeaders.length + (showNumber ? 1 : 0)" class="py-8 text-center text-slate-400 dark:text-slate-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <i class="mdi mdi-database-off text-3xl opacity-60"></i>
                    <span class="text-xs font-semibold">Data tidak ditemukan</span>
                  </div>
                </td>
              </tr>

              <!-- Table Data Rows -->
              <tr
                v-else
                v-for="(item, index) in tableData.items"
                :key="item.id || index"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
                :class="[getRowClass({ item, index }), loading && !showSkeletonLoader ? 'opacity-50 transition-opacity duration-150 pointer-events-none' : '']"
                @click="handleRowClick(item)"
              >
                <!-- Row Number -->
                <td v-if="showNumber" class="py-3 px-4 text-center font-extrabold text-slate-500 text-xs">
                  {{ numberInc + index + 1 }}
                </td>

                <!-- Data Cells -->
                <td
                  v-for="header in bodyHeaders"
                  :key="header.key"
                  :class="[
                    'py-3 px-4 text-xs font-medium',
                    header.align === 'center' ? 'text-center' : header.align === 'right' ? 'text-right' : 'text-left'
                  ]"
                >
                  <slot :name="`item.${header.key}`" :item="item" :value="item[header.key]" :index="index">
                    <!-- Actions special handling -->
                    <template v-if="header.key === 'actions'">
                      <div v-if="actions.length > 0" class="flex items-center justify-center gap-1.5">
                        <ClientOnly>
                          <template v-if="actionType === 'dropdown'">
                            <div v-if="validActions(actions, item).length > 0" @click.stop>
                              <UiDropdown
                                :items="getDropdownActions(actions, item)"
                                align="right"
                                @select="(opt) => handleDropdownSelect(opt, item)"
                              >
                                <template #trigger>
                                  <UiButton color="secondary" variant="outline" size="xs">
                                    <span>{{ actionDropdownLabel }}</span>
                                    <i class="mdi mdi-chevron-down ml-1" />
                                  </UiButton>
                                </template>
                              </UiDropdown>
                            </div>
                          </template>
                          <template v-else>
                            <template v-for="action in validActions(actions, item)" :key="action.key || action.emit">
                              <UiIconButton
                                :icon="action.icon || 'mdi-help'"
                                :tooltip="action.tooltip"
                                :color="action.color"
                                :disabled="resolveActionDisabled(action, item)"
                                :to="resolveActionTo(action, item)"
                                :href="resolveActionHref(action, item)"
                                :target="resolveActionTarget(action)"
                                size="xs"
                                rounded="md"
                                @click="(e) => handleActionClick(action, item, e)"
                              />
                            </template>
                          </template>
                        </ClientOnly>
                      </div>
                    </template>
                    <template v-else>
                      {{ header.formatter ? header.formatter(item[header.key]) : item[header.key] }}
                    </template>
                  </slot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. MOBILE CARD VIEW (down to md) -->
        <div class="block md:hidden space-y-3">
          <!-- Mobile Loading State -->
          <template v-if="showSkeletonLoader">
            <div v-for="i in 3" :key="`mob-loading-${i}`" class="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-xs space-y-3 animate-pulse">
              <div class="flex justify-between items-center">
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              </div>
              <div class="space-y-2">
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </template>

          <!-- Mobile Empty State -->
          <div v-else-if="tableData.items.length === 0" class="p-8 text-center rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            <i class="mdi mdi-database-off text-3xl opacity-60 mb-2 block"></i>
            <span class="text-xs font-semibold">Data tidak ditemukan</span>
          </div>

          <!-- Mobile Cards -->
          <template v-else>
            <div
              v-for="(item, index) in tableData.items"
              :key="item.id || index"
              class="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-xs hover:shadow-md transition-all space-y-3"
              :class="loading && !showSkeletonLoader ? 'opacity-50 transition-opacity duration-150 pointer-events-none' : ''"
              @click="handleRowClick(item)"
            >
              <!-- Slot Override for full Card -->
              <slot name="card" :item="item" :index="index">
                <!-- Default Mobile Card Template -->
                <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      {{ numberInc + index + 1 }}
                    </span>
                    <div class="min-w-0 font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      <!-- Render primary column slot or title -->
                      <slot :name="`item.${primaryHeaderKey}`" :item="item" :value="item[primaryHeaderKey]" :index="index">
                        {{ item[primaryHeaderKey] || item.name || item.personName || 'Detail Data' }}
                      </slot>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <!-- Render Status badge slot if exists -->
                    <div v-if="hasHeaderKey('status')">
                      <slot name="item.status" :item="item" :value="item.status" :index="index">
                        <UiBadge variant="default" class="text-[10px]">
                          {{ item.status }}
                        </UiBadge>
                      </slot>
                    </div>

                    <!-- 3-Dots Action Dropdown Menu for Mobile -->
                    <ClientOnly v-if="actions.length > 0 && validActions(actions, item).length > 0">
                      <div @click.stop>
                        <UiDropdown
                          :items="getDropdownActions(actions, item)"
                          align="right"
                          @select="(opt) => handleDropdownSelect(opt, item)"
                        >
                          <template #trigger>
                            <button
                              type="button"
                              class="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                              title="Aksi"
                            >
                              <i class="mdi mdi-dots-vertical text-lg" />
                            </button>
                          </template>
                          <template #item="{ item: opt }">
                            <div class="flex items-center gap-2 text-xs font-semibold py-0.5">
                              <i v-if="opt.icon" :class="['mdi', opt.icon, 'text-base']" :style="{ color: opt.color }" />
                              <span>{{ opt.label }}</span>
                            </div>
                          </template>
                        </UiDropdown>
                      </div>
                    </ClientOnly>
                  </div>
                </div>

                <!-- Card Key-Value Details Grid -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <template v-for="header in mobileDetailHeaders" :key="header.key">
                    <div class="space-y-0.5">
                      <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                        {{ header.title }}
                      </span>
                      <div class="font-medium text-slate-800 dark:text-slate-200 break-words">
                        <slot :name="`item.${header.key}`" :item="item" :value="item[header.key!]" :index="index">
                          {{ header.formatter ? header.formatter(item[header.key!]) : (item[header.key!] ?? '—') }}
                        </slot>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Card Footer Actions (renders if custom item.actions slot is supplied by parent) -->
                <div v-if="$slots['item.actions']" class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                  <slot name="item.actions" :item="item" />
                </div>
              </slot>
            </div>
          </template>
        </div>
      </div>

      <!-- Below Table / Summary Section Slot -->
      <slot name="belowTable" />

      <!-- Pagination -->
      <div
        v-if="showPagination"
        class="flex flex-wrap items-center justify-between gap-4 mt-4 pt-2"
      >
        <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <span>{{ $t('Tampilkan') }}</span>
          <select
            v-model="filterLocal.pageSize"
            @change="getItemPerPage(filterLocal.pageSize)"
            class="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option v-for="opt in itemsPerPageOptions" :key="opt.value" :value="opt.value">
              {{ opt.title }}
            </option>
          </select>
          <span>{{ $t('Dari') }} {{ tableData.meta?.totalItems || 0 }} {{ $t('data') }}</span>
        </div>
        <UiPagination
          :current-page="Number(filterLocal.pageNumber) || 1"
          :total-items="tableData.meta?.totalItems || 0"
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
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
        <UiButton color="secondary" variant="outline" size="sm" @click="resetModalFilters">
          {{ $t('Reset') }}
        </UiButton>
        <div class="flex items-center gap-2 ml-auto">
          <UiButton color="secondary" size="sm" @click="showFilterModal = false">
            {{ $t('Batal') }}
          </UiButton>
          <UiButton color="primary" size="sm" @click="applyModalFilters">
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
  align?: 'left' | 'center' | 'right'
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
  disabled?: boolean | ((item: any) => boolean)
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
  subtitle?: string
  loading?: boolean
  showHeader?: boolean
  showNumber?: boolean
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
  headerClass?: string
  elevated?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  permissionTag?: string
  contentPadding?: string
  showTable?: boolean
  showPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  loading: false,
  showHeader: true,
  showNumber: true,
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
  contentPadding: '',
  showTable: true,
  showPagination: true,
})

// Header theme classes for desktop view
const desktopThemeClasses: Record<string, string> = {
  red: 'md:bg-red-500',
  blue: 'md:bg-blue-500',
  green: 'md:bg-green-500',
  purple: 'md:bg-purple-500',
  orange: 'md:bg-orange-500',
  slate: 'md:bg-slate-500',
  primary: 'md:bg-primary-500',
}

const desktopHeaderClass = computed(() => {
  if (props.headerClass) {
    return props.headerClass
      .split(' ')
      .filter(Boolean)
      .map((c) => (c.startsWith('md:') ? c : `md:${c}`))
      .join(' ')
  }
  const theme = props.headerTheme || 'primary'
  return desktopThemeClasses[theme] || desktopThemeClasses.primary
})

// Elevation classes
const elevationClasses: Record<string, string> = {
  none: '',
  sm: 'shadow-xs',
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
const attrs = useAttrs()

// Delayed loading skeleton state to prevent flickering on fast data loads (< 250ms)
const showSkeletonLoader = ref(false)
let loadingTimer: any = null
const SKELETON_DELAY = 250 // ms threshold

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      if (loadingTimer) clearTimeout(loadingTimer)
      loadingTimer = setTimeout(() => {
        if (props.loading) {
          showSkeletonLoader.value = true
        }
      }, SKELETON_DELAY)
    } else {
      if (loadingTimer) {
        clearTimeout(loadingTimer)
        loadingTimer = null
      }
      showSkeletonLoader.value = false
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
})

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

// Body headers computed (must have key)
const bodyHeaders = computed(() => {
  return props.headers.filter((h) => h.key !== undefined) as (Header & { key: string })[]
})

const primaryHeaderKey = computed(() => {
  const first = bodyHeaders.value.find((h) => h.key !== 'actions' && h.key !== 'status')
  return first?.key || 'id'
})

const mobileDetailHeaders = computed(() => {
  return bodyHeaders.value.filter((h) => h.key !== 'actions' && h.key !== 'status' && h.key !== primaryHeaderKey.value)
})

const hasHeaderKey = (k: string) => {
  return props.headers.some((h) => h.key === k)
}

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
    return val !== null && val !== undefined && val !== ''
  }).length
})

const getFieldLabel = (f: FilterField) => {
  if (f.label) return f.label
  if (f.modalLabel) return f.modalLabel
  if (f.placeholder) {
    const cleanPlaceholder = f.placeholder.replace(/^(Pilih|Cari|Select|Search)\s+/i, '')
    if (cleanPlaceholder) return cleanPlaceholder
  }
  const name = f.name || ''
  const cleanName = name.replace(/Id(s)?$/i, '')
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
}

const activeChips = computed(() => {
  return modalFilterSchema.value
    .filter((f) => {
      if (f.showChip) return false
      const isShownAbove = f.showAboveTable !== undefined ? f.showAboveTable : !f.showInModal
      if (isShownAbove) return false
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
        field: f,
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
  const number = parseInt(String((filterLocal.value.pageNumber || 1) - 1)) * itemsPerPage.value || 0
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
  if (typeof action.to === 'function') return action.to(item)
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

const resolveActionDisabled = (action: Action, item: any): boolean => {
  if (typeof action.disabled === 'function') return action.disabled(item)
  return !!action.disabled
}

const getDropdownActions = (arr: Action[], item: any): DropdownItem[] => {
  return validActions(arr, item).map((a) => ({
    label: a.label || a.tooltip || a.key || '',
    value: a.value || a.key || a.emit || '',
    icon: a.icon,
    color: a.color,
    emit: a.emit,
    disabled: resolveActionDisabled(a, item),
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
  if (isClickable) {
    classes.push('cursor-pointer')
  }
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
watch(
  () => route.query,
  () => {
    emit('fetchData')
  },
  { immediate: true },
)

watch(sortBy, () => {
  const sort = sortBy.value[0]
  if (sort) {
    filterLocal.value.sortBy = sort.key
    filterLocal.value.sortType = sort.order
    router.replace({ path: route.path, query: filterLocal.value })
  }
})

watch(
  () => props.filterSchema,
  () => {
    resetFilterFromSchema()
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  resetFilterFromSchema()

  if (route.query && Object.keys(route.query).length) {
    const q = route.query
    Object.keys(q).forEach((k) => {
      if (k in filterLocal.value) {
        const schemaField = props.filterSchema.find((f) => f.name === k)
        const value = q[k]
        if (schemaField?.type === 'number') {
          filterLocal.value[k] = Number(value)
        } else if ((schemaField?.type === 'autocomplete' || schemaField?.type === 'select') && value) {
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

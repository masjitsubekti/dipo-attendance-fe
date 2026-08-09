<template>
  <div
    class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
  >
    <div v-if="title" class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <h3 class="font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
    </div>

    <div class="overflow-x-auto">
      <table
        class="w-full min-w-[720px] border-collapse text-slate-800 dark:text-slate-100"
      >
        <thead>
          <tr class="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <th class="summary-header w-16 text-center">{{ t('No.') }}</th>
            <th
              v-for="header in headers"
              :key="header.key"
              class="summary-header"
              :class="[
                header.numeric ? 'text-right' : 'text-left',
                header.sortable
                  ? 'cursor-pointer select-none transition-colors hover:text-primary-600 dark:hover:text-primary-400'
                  : '',
              ]"
              @click="header.sortable && handleSort(header.key)"
            >
              <span
                class="flex items-center gap-1.5"
                :class="header.numeric ? 'justify-end' : 'justify-start'"
              >
                <span>{{ header.title }}</span>
                <i
                  v-if="header.sortable"
                  class="mdi text-base opacity-70"
                  :class="
                    sortKey === header.key
                      ? sortOrder === 'asc'
                        ? 'mdi-chevron-up'
                        : 'mdi-chevron-down'
                      : 'mdi-unfold-more-horizontal'
                  "
                ></i>
              </span>
            </th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr>
            <td :colspan="headers.length + 1" class="px-4 py-14 text-center">
              <UiSpinner size="lg" />
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="items.length">
          <tr
            v-for="(item, index) in items"
            :key="item.id ?? index"
            class="border-t border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
          >
            <td class="summary-cell text-center text-slate-500 dark:text-slate-400">
              {{ index + 1 }}
            </td>
            <td
              v-for="header in headers"
              :key="header.key"
              class="summary-cell"
              :class="[
                header.numeric ? 'text-right tabular-nums' : 'text-left',
                !header.numeric && header.key === 'name'
                  ? 'font-medium text-slate-900 dark:text-white'
                  : '',
              ]"
            >
              {{
                header.numeric
                  ? formatNumber(item[header.key])
                  : item[header.key] || '-'
              }}
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td
              :colspan="headers.length + 1"
              class="px-4 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              {{ t('Data tidak ditemukan') }}
            </td>
          </tr>
        </tbody>

        <tfoot
          v-if="!loading && items.length"
          class="border-t-2 border-slate-300 dark:border-slate-600"
        >
          <tr
            class="bg-slate-100 text-sm font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
          >
            <td class="summary-total-cell"></td>
            <td
              v-for="header in headers"
              :key="header.key"
              class="summary-total-cell"
              :class="header.numeric ? 'text-right tabular-nums' : 'text-left'"
            >
              {{
                header.numeric
                  ? formatNumber(summary[header.key])
                  : header.key === 'name'
                    ? totalLabel
                    : ''
              }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SummaryHeader {
  key: string
  title: string
  numeric?: boolean
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    title?: string
    headers: SummaryHeader[]
    items: Record<string, any>[]
    summary: Record<string, any>
    loading?: boolean
    totalLabel?: string
    sortKey?: string
    sortOrder?: 'asc' | 'desc'
  }>(),
  {
    title: '',
    loading: false,
    totalLabel: 'GRAND TOTAL',
    sortKey: '',
    sortOrder: 'asc',
  }
)

const emit = defineEmits<{
  sort: [payload: { key: string; order: 'asc' | 'desc' }]
}>()

const { t } = useTranslation()

function handleSort(key: string) {
  const order =
    props.sortKey === key && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort', { key, order })
}

function formatNumber(value: unknown) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return '0'
  return numericValue.toLocaleString('id-ID', {
    maximumFractionDigits: 2,
  })
}
</script>

<style scoped>
.summary-header {
  border-right: 1px solid rgb(203 213 225);
  padding: 0.8rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.summary-cell,
.summary-total-cell {
  border-right: 1px solid rgb(226 232 240);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

:global(.dark .summary-header),
:global(.dark .summary-cell),
:global(.dark .summary-total-cell) {
  border-color: rgb(51 65 85) !important;
}
</style>

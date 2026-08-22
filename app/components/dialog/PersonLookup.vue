<template>
  <UiModal
    v-model="isOpen"
    :title="dialogTitle"
    size="2xl"
  >
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {{ dialogTitle }}
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <UiRow>
        <UiCol :cols="12" md="3">
          <UiAutocomplete
            v-model="filterLocal.institutionId"
            :options="listInstitution"
            item-value="id"
            item-title="name"
            placeholder="Pilih Institusi"
            clearable
            @update:model-value="handleRefreshItems"
          />
        </UiCol>

        <UiCol :cols="12" md="3">
          <UiAutocomplete
            v-model="filterLocal.departmentId"
            :options="listDepartment"
            item-value="id"
            item-title="name"
            placeholder="Pilih Departemen"
            clearable
            @update:model-value="handleRefreshItems"
          />
        </UiCol>

        <UiCol :cols="12" md="3">
          <UiAutocomplete
            v-model="filterLocal.positionId"
            :options="listPosition"
            item-value="id"
            item-title="name"
            placeholder="Pilih Jabatan"
            clearable
            @update:model-value="handleRefreshItems"
          />
        </UiCol>

        <UiCol :cols="12" md="3">
          <UiInput
            v-model="filterLocal.q"
            placeholder="Cari NIP / Nama (Enter)"
            @keydown.enter="handleRefreshItems"
          >
            <template #prefix>
              <UiIcon name="mdi mdi-magnify" class="text-slate-400" />
            </template>
          </UiInput>
        </UiCol>
      </UiRow>

      <UiTable
        :columns="headers"
        :data="tableData.items"
        :loading="isLoading"
        :selectable="true"
        v-model="selectedIds"
        item-key="id"
        :disabled-keys="props.excludeIds"
        :sort-key="filterLocal.sortBy"
        :sort-order="filterLocal.sortType"
        @sort="handleSort"
        @row-click="handleRowClick"
        clickable
      >
        <template #cell-nip="{ row: item }">
          <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ item.nip || '-' }}
          </span>
        </template>

        <template #cell-name="{ row: item }">
          <p class="font-medium text-slate-900 dark:text-white">
            {{ item.name }}
          </p>
        </template>

        <template #cell-institutionName="{ row: item }">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ item.institutionName || '-' }}
          </span>
        </template>

        <template #cell-departmentName="{ row: item }">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ item.departmentName || '-' }}
          </span>
        </template>

        <template #cell-positionName="{ row: item }">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ item.positionName || '-' }}
          </span>
        </template>

        <template #cell-status="{ row: item }">
          <UiBadge
            :variant="item.status === 'aktif' || item.status === 'ACTIVE' ? 'success' : 'secondary'"
            size="sm"
          >
            {{ item.status || 'aktif' }}
          </UiBadge>
        </template>
      </UiTable>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
          <span>{{ $t('Tampilkan') }}</span>
          <select
            v-model="filterLocal.pageSize"
            @change="getItemPerPage(filterLocal.pageSize)"
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
          <span>{{ $t('Dari') }} {{ tableData.meta.totalItems }} {{ $t('data') }}</span>
        </div>

        <UiPagination
          :current-page="Number(filterLocal.pageNumber) || 1"
          :total-items="tableData.meta.totalItems"
          :items-per-page="filterLocal.pageSize"
          @update:current-page="handlePageChanged"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-sm text-slate-600 dark:text-slate-400">
          <span v-if="multiple && selectedIds.length > 0" class="font-medium text-primary-600">
            {{ selectedIds.length }} {{ $t('dipilih') }}
          </span>
        </div>

        <div class="flex gap-2">
          <UiButton color="secondary" @click="handleClose">
            {{ $t('Batal') }}
          </UiButton>

          <UiButton color="primary" @click="handleAddToQueue">
            <i class="mdi mdi-plus mr-1"></i>
            {{ $t('Tambahkan') }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import personService from '@/services/person.service'
import institutionService from '@/services/institution.service'
import departmentService from '@/services/department.service'
import positionService from '@/services/position.service'

interface Props {
  modelValue: boolean
  multiple?: boolean
  title?: string
  excludeIds?: any[]
  search?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  multiple: true,
  excludeIds: () => [],
  search: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', items: any[] | any): void
  (e: 'add-to-queue', items: any[]): void
}>()

const personSvc = personService()
const instSvc = institutionService()
const deptSvc = departmentService()
const posSvc = positionService()

const isLoading = ref(false)
const selectedIds = ref<number[]>([])
const listInstitution = ref<any[]>([])
const listDepartment = ref<any[]>([])
const listPosition = ref<any[]>([])

const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]

const filterLocal = ref({
  q: '',
  pageNumber: 1,
  pageSize: 10,
  institutionId: null as number | null,
  departmentId: null as number | null,
  positionId: null as number | null,
  sortBy: 'name',
  sortType: 'asc' as 'asc' | 'desc',
})

const tableData = ref<{
  items: any[]
  meta: { totalItems: number }
}>({
  items: [],
  meta: { totalItems: 0 },
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const dialogTitle = computed(() => {
  return props.title || 'Pilih Pegawai'
})

const headers = computed(() => [
  { key: 'nip', label: 'NIP', sortable: true },
  { key: 'name', label: 'Nama', sortable: true },
  { key: 'institutionName', label: 'Institusi', sortable: true },
  { key: 'departmentName', label: 'Departemen', sortable: true },
  { key: 'positionName', label: 'Jabatan', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
])

const handleSort = ({ key, order }: { key: string; order: 'asc' | 'desc' }) => {
  filterLocal.value.sortBy = key
  filterLocal.value.sortType = order
  loadData()
}

const handleRowClick = (row: any) => {
  const id = row.id
  if (props.excludeIds.includes(id)) return

  const index = selectedIds.value.indexOf(id)

  if (index === -1) {
    if (!props.multiple) {
      selectedIds.value = [id]
    } else {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value.splice(index, 1)
  }
}

function initFilter() {
  filterLocal.value.q = props.search || ''
  filterLocal.value.pageNumber = 1
  filterLocal.value.pageSize = 10
  filterLocal.value.institutionId = null
  filterLocal.value.departmentId = null
  filterLocal.value.positionId = null
  filterLocal.value.sortBy = 'name'
  filterLocal.value.sortType = 'asc'
  selectedIds.value = []

  loadDropdowns()
}

async function loadDropdowns() {
  instSvc.all().then((res: any) => {
    listInstitution.value = res.data || []
  })
  deptSvc.all().then((res: any) => {
    listDepartment.value = res.data || []
  })
  posSvc.all().then((res: any) => {
    listPosition.value = res.data || []
  })
}

function loadData() {
  isLoading.value = true

  personSvc
    .retrieve({
      q: filterLocal.value.q,
      pageSize: filterLocal.value.pageSize,
      pageNumber: filterLocal.value.pageNumber,
      sortBy: filterLocal.value.sortBy,
      sortType: filterLocal.value.sortType,
      institutionId: filterLocal.value.institutionId,
      departmentId: filterLocal.value.departmentId,
      positionId: filterLocal.value.positionId,
    })
    .then((res: any) => {
      tableData.value = {
        items: res.data?.items || [],
        meta: res.data?.meta || { totalItems: 0 },
      }
    })
    .catch((error: any) => {
      console.error('Failed to load person data', error)
      tableData.value = {
        items: [],
        meta: { totalItems: 0 },
      }
    })
    .finally(() => {
      isLoading.value = false
    })
}

const handleRefreshItems = () => {
  filterLocal.value.pageNumber = 1
  loadData()
}

const handlePageChanged = (page: number) => {
  filterLocal.value.pageNumber = page
  loadData()
}

const getItemPerPage = (val: number) => {
  filterLocal.value.pageSize = Number(val)
  handleRefreshItems()
}

function handleAddToQueue() {
  const result: any[] = []

  selectedIds.value.forEach((id) => {
    const person = tableData.value.items.find((v: any) => v.id === id)
    if (person && !props.excludeIds.includes(id)) {
      result.push(person)
    }
  })

  if (result.length === 0) return

  emit('add-to-queue', result)
  handleClose()
}

function handleClose() {
  isOpen.value = false
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initFilter()
      loadData()
    }
  },
)
</script>

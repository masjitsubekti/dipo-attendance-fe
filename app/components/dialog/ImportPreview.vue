<template>
  <UiModal 
    :model-value="modelValue" 
    @update:model-value="(val: boolean) => emit('update:modelValue', val)"
    :title="title"
    size="2xl"
    persistent
  >
    <UiStepper v-model="currentStep" :steps="steps" linear>
      <!-- Step 1: Upload File -->
      <template #step-1>
        <div class="mt-6">
          <!-- File Upload Area -->
          <UiFileUpload
            v-model="selectedFile"
            accept=".xlsx,.xls,.csv"
            :max-size="10"
            @error="handleFileError"
          />
          
          <!-- Download Template Link -->
          <div v-if="domain" class="mt-3 text-sm">
            <a 
              href="#" 
              class="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              @click.prevent="handleDownloadTemplate"
            >
              <span class="mdi mdi-download text-lg"></span>
              Download Template
            </a>
          </div>
        </div>
      </template>

      <!-- Step 2: Preview & Validate -->
      <template #step-2>
        <div class="space-y-4">
          <!-- Summary Stats -->
          <UiRow>
            <UiCol cols="6" md="3">
              <div class="rounded-lg bg-slate-100 dark:bg-slate-700 text-center py-3">
                <p class="text-lg font-bold text-slate-800 dark:text-white">{{ previewData?.totalRows || 0 }}</p>
                <p class="text-xs text-slate-500">{{ $t('import.total_rows') }}</p>
              </div>
            </UiCol>
            <UiCol cols="6" md="3">
              <div class="rounded-lg bg-green-100 dark:bg-green-900/30 text-center py-3">
                <p class="text-lg font-bold text-green-600">{{ previewData?.validCount || 0 }}</p>
                <p class="text-xs text-green-600">{{ $t('import.valid') }}</p>
              </div>
            </UiCol>
            <UiCol cols="6" md="3">
              <div class="rounded-lg bg-red-100 dark:bg-red-900/30 text-center py-3">
                <p class="text-lg font-bold text-red-600">{{ previewData?.errorCount || 0 }}</p>
                <p class="text-xs text-red-600">{{ $t('import.errors') }}</p>
              </div>
            </UiCol>
            <UiCol cols="6" md="3">
              <div class="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-center py-3">
                <p class="text-lg font-bold text-yellow-600">{{ existingCount }}</p>
                <p class="text-xs text-yellow-600">{{ $t('import.existing') }}</p>
              </div>
            </UiCol>
          </UiRow>

          <!-- Import Mode -->
          <UiRadioGroup
            v-model="importMode"
            :label="$t('import.mode') + ' :'"
            :options="importModeOptions"
            inline
          />

          <!-- Preview Table -->
          <UiTable
            :columns="previewColumns"
            :data="previewTableItems"
            size="md"
            striped
            fixed-header
            max-height="400px"
          >
            <template #cell-isActive="{ value }">
              <UiBadge v-if="value" variant="success" size="sm">{{ $t('Aktif') }}</UiBadge>
              <UiBadge v-else variant="danger" size="sm">{{ $t('Nonaktif') }}</UiBadge>
            </template>
            <template #cell-info="{ row }">
              <template v-if="row.isError || row.errorMessage">
                <span class="text-red-600 text-xs text-left inline-block">
                  <i class="mdi mdi-alert-circle mr-1" />
                  {{ row.errorMessage }}
                </span>
              </template>
              <template v-else>
                <UiBadge v-if="row.exist" variant="warning" size="sm">
                  {{ $t('import.already_exists') }}
                </UiBadge>
                <UiBadge v-else variant="success" size="sm">
                  {{ $t('import.new_data') }}
                </UiBadge>
              </template>
            </template>
          </UiTable>
        </div>
      </template>

      <!-- Step 3: Complete -->
      <template #step-3>
        <div class="py-6">
          <div v-if="isLoadingSave" class="text-center space-y-4">
            <div class="relative inline-block">
              <div class="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto animate-pulse">
                <i class="mdi mdi-loading mdi-spin text-4xl text-primary-500" />
              </div>
            </div>
            <p class="text-slate-600 dark:text-slate-400 font-medium">{{ $t('import.processing') }}</p>
            <p class="text-sm text-slate-400">{{ $t('Mohon Tunggu') }}...</p>
          </div>

          <div v-else-if="importComplete" class="space-y-6">
            <!-- Header with dynamic icon -->
            <div class="text-center space-y-3">
              <!-- Success Icon with animation -->
              <div class="relative inline-block">
                <div 
                  class="w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300"
                  :class="hasIssues ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'"
                >
                  <i 
                    class="text-5xl"
                    :class="hasIssues ? 'mdi mdi-alert-circle text-yellow-500' : 'mdi mdi-check-circle text-green-500'"
                  />
                </div>
                <!-- Small badge for issues count -->
                <div 
                  v-if="hasIssues" 
                  class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
                >
                  {{ (resultData?.skipCount || 0) + (resultData?.errorCount || 0) }}
                </div>
              </div>
              
              <div>
                <p class="text-xl font-semibold text-slate-800 dark:text-white">
                  {{ hasIssues ? $t('import.complete_with_issues') : $t('import.complete') }}
                </p>
                <p class="text-slate-500 mt-1">{{ $t('import.complete_message', { count: importedCount }) }}</p>
              </div>
            </div>

            <!-- Error/Skipped Details Table -->
            <div v-if="resultData && resultData.errors && resultData.errors.length > 0" class="w-full">
              <UiTable
                :columns="resultErrorColumns"
                :data="resultData.errors"
                size="md"
                striped
                fixed-header
                max-height="300px"
              >
                <template #cell-row="{ value }">
                  <span class="font-mono text-slate-600 dark:text-slate-400">{{ value }}</span>
                </template>
                <template #cell-status="{ row }">
                  <UiBadge 
                    :variant="(row as any).message?.toLowerCase().includes('skipped') ? 'warning' : 'danger'" 
                    size="sm"
                  >
                    {{ (row as any).message?.toLowerCase().includes('skipped') ? $t('import.skipped') : $t('import.errors') }}
                  </UiBadge>
                </template>
                <template #cell-message="{ value }">
                  <span class="text-slate-700 dark:text-slate-300">{{ value }}</span>
                </template>
              </UiTable>
            </div>

          </div>
        </div>
      </template>
    </UiStepper>

    <template #footer>
      <div class="flex justify-between w-full">
        <div>
          <UiButton 
            v-if="currentStep > 1 && !importComplete" 
            color="secondary" 
            variant="outline"
            @click="goBack"
          >
            <i class="mdi mdi-arrow-left mr-1" />
            {{ $t('Kembali') }}
          </UiButton>
        </div>
        <div class="flex gap-2">
          <UiButton color="secondary" @click="handleClose">
            {{ importComplete ? $t('Tutup') : $t('Batal') }}
          </UiButton>
          
          <!-- Step 1: Preview Button -->
          <UiButton 
            v-if="currentStep === 1"
            color="primary" 
            :loading="isLoadingPreview" 
            :disabled="!canPreview"
            @click="handlePreview"
          >
            {{ $t('import.preview') }}
            <i class="mdi mdi-arrow-right ml-1" />
          </UiButton>

          <!-- Step 2: Process Button -->
          <UiButton 
            v-if="currentStep === 2"
            color="primary" 
            :loading="isLoadingSave" 
            :disabled="!previewData || previewData.validCount === 0"
            @click="handleSave"
          >
            <i class="mdi mdi-check mr-1" />
            {{ $t('import.process') }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useSwal } from '~/composables/useSwal';
import { useTranslation } from '~/composables/useTranslation';
import importTemplateService from '~/services/import-template.service';

interface PreviewError {
  row: number;
  message: string;
}

interface PreviewData {
  totalRows: number;
  validCount?: number; // kept for compatibility with preview data
  successCount?: number;
  updateCount?: number;
  skipCount?: number;
  errorCount: number;
  data: any[];
  errors: PreviewError[];
}

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface Props {
  modelValue: boolean;
  title?: string;
  domain?: string;
  columns?: ColumnDef[];
  previewFn: (...args: any[]) => Promise<any>;
  saveFn: (data: any) => Promise<any>;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Import Data',
  domain: '',
  columns: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useTranslation();
const swal = useSwal();
const templateSvc = importTemplateService();

// Download template handler
function handleDownloadTemplate() {
  if (props.domain) {
    templateSvc.downloadTemplate(props.domain);
  }
}

// Stepper
const currentStep = ref(1);
const steps = computed(() => [
  { title: t('import.step_upload'), icon: 'mdi-upload', complete: currentStep.value > 1 },
  { title: t('import.step_preview'), icon: 'mdi-eye', complete: currentStep.value > 2 },
  { title: t('import.step_complete'), icon: 'mdi-check' },
]);

// Refs
const selectedFile: any = ref(null);
const previewData = ref<PreviewData | null>(null);
const resultData = ref<PreviewData | null>(null);
const importMode = ref<'upsert' | 'insert'>('insert');
const isLoadingPreview = ref(false);
const isLoadingSave = ref(false);
const importComplete = ref(false);
const importedCount = ref(0);

// Computed
const canPreview = computed(() => {
  return selectedFile.value;
});

const existingCount = computed(() => {
  return previewData.value?.data?.filter(d => d.exist).length || 0;
});

const hasIssues = computed(() => {
  return (resultData.value?.skipCount || 0) + (resultData.value?.errorCount || 0) > 0;
});

const importModeOptions = computed(() => [
  { label: t('import.mode_insert'), value: 'insert' },
  { label: t('import.mode_upsert'), value: 'upsert' },
]);

// Table columns for preview - use prop or auto-detect from data
const previewColumns = computed(() => {
  // Always start with row number column
  const baseColumns: ColumnDef[] = [
    { key: 'row', label: t('Row'), width: '50px' },
  ];
  
  // Use provided columns or auto-detect from first data item
  if (props.columns && props.columns.length > 0) {
    return [...baseColumns, ...props.columns, { key: 'info', label: t('import.info') }];
  }
  
  // Auto-detect columns from data (exclude internal fields)
  if (previewData.value?.data?.length) {
    const firstItem = previewData.value.data[0];
    const excludeKeys = ['row', 'exist', 'isError', 'errorMessage'];
    const detectedColumns = Object.keys(firstItem)
      .filter(key => !excludeKeys.includes(key))
      .map(key => ({ key, label: key }));
    return [...baseColumns, ...detectedColumns, { key: 'info', label: t('import.info') }];
  }
  
  return baseColumns;
});

// Table columns for result errors
const resultErrorColumns = computed(() => [
  { key: 'row', label: t('Row'), width: '60px' },
  { key: 'message', label: t('Keterangan') },
  { key: 'status', label: t('Status'), width: '100px' },
]);

// Combine valid data and errors into single table items
const previewTableItems = computed(() => {
  if (!previewData.value) return [];
  
  const data = previewData.value.data || [];
  const errors = previewData.value.errors || [];
  
  // Track which rows already have data
  const dataRowNumbers = new Set(data.map(item => item.row));
  
  const validItems = data.map(item => ({
    ...item,
    isError: false,
    errorMessage: item.error || '',
  }));
  
  // Only add error rows that DON'T already exist in data
  const errorItems = errors
    .filter(err => !dataRowNumbers.has(err.row))
    .map(err => ({
      row: err.row,
      exist: false,
      isError: true,
      errorMessage: err.message,
    }));
  
  return [...validItems, ...errorItems].sort((a, b) => a.row - b.row);
});

// Methods
const handleFileError = (message: string) => {
  swal.error(t('Gagal'), message);
};

const handlePreview = async () => {
  if (!selectedFile.value) return;

  isLoadingPreview.value = true;
  try {
    const res = await props.previewFn(selectedFile.value);
    previewData.value = res.data;
    currentStep.value = 2; // Move to preview step
  } catch (err: any) {
    console.log(err);
  } finally {
    isLoadingPreview.value = false;
  }
};

const handleSave = async () => {
  if (!previewData.value || previewData.value.validCount === 0) return;
  isLoadingSave.value = true;
  currentStep.value = 3; // Move to complete step
  
  try {
    // Add 1 second delay for better UX
    const [res] = await Promise.all([
      props.saveFn({
        mode: importMode.value,
        data: previewData.value.data,
      }),
      new Promise(resolve => setTimeout(resolve, 1000))
    ]);
    
    resultData.value = res.data;
    importComplete.value = true;
    importedCount.value = (resultData.value?.successCount || 0) + (resultData.value?.updateCount || 0);

    // Only toast if fully successful or partial success
    if (importedCount.value > 0) {
        swal.toast(t('messages.success.imported'), 'success');
    }
    emit('success');
  } catch (err: any) {
    currentStep.value = 2; // Go back to preview
  } finally {
    isLoadingSave.value = false;
  }
};

const goBack = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1;
    previewData.value = null;
  }
};

const handleClose = () => {
  selectedFile.value = null;
  previewData.value = null;
  importMode.value = 'insert';
  isLoadingPreview.value = false;
  isLoadingSave.value = false;
  importComplete.value = false;
  importedCount.value = 0;
  currentStep.value = 1;
  emit('update:modelValue', false);
};

// Reset when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    currentStep.value = 1;
    importComplete.value = false;
    resultData.value = null;
  }
});
</script>

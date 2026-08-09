<script setup lang="ts">
/**
 * UiAutocompleteFreeText - Autocomplete with free text option creation support
 */
import { useField } from 'vee-validate';

export type ValidationRule = (value: any) => boolean | string;

interface Props {
  modelValue?: string | number | null;
  name?: string;
  options?: any[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  itemValue?: string;
  itemTitle?: string | ((item: any) => string);
  rules?: ValidationRule[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  options: () => [],
  placeholder: "Cari...",
  disabled: false,
  required: false,
  size: 'md',
  clearable: false,
  itemValue: 'value',
  itemTitle: 'label',
  rules: () => [],
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  "change": [option: any | null];
  "search": [query: string];
  "create-new": [query: string];
}>();

const isOpen = ref(false);
const searchQuery = ref("");
const wrapperRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Stable field name
const generatedId = useId();
const autocompleteId = computed(() => props.id || `autocomplete-${generatedId}`);
const fieldName = props.name || `autocomplete-${generatedId}`;

// Local temporary options list
const tempOptions = ref<any[]>([]);

// Combined options
const combinedOptions = computed(() => {
  return [...props.options, ...tempOptions.value];
});

// Validation function
const validateWithRules = (value: any): boolean | string => {
  for (const rule of props.rules) {
    const result = rule(value);
    if (result !== true) {
      return typeof result === 'string' ? result : 'Invalid value';
    }
  }
  return true;
};

// Use vee-validate
const { 
  value: fieldValue, 
  errorMessage, 
  handleBlur: veeHandleBlur,
  resetField,
  validate: validateField,
  meta,
} = useField<string | number | null>(fieldName, validateWithRules, {
  initialValue: props.modelValue,
  validateOnValueUpdate: true,
  validateOnMount: false,
});

// Sync modelValue -> fieldValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== fieldValue.value) {
    fieldValue.value = newVal;
  }
}, { immediate: true });

// Sync fieldValue -> modelValue & cleanup temporary options on change
watch(fieldValue, (newVal, oldVal) => {
  if (oldVal && oldVal !== newVal) {
    const idx = tempOptions.value.findIndex(opt => getItemValue(opt) === oldVal);
    if (idx > -1) {
      tempOptions.value.splice(idx, 1);
    }
  }
  if (newVal !== props.modelValue) {
    emit('update:modelValue', newVal);
  }
});

// Click outside - close and validate
const handleClickOutside = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    if (isOpen.value) {
      isOpen.value = false;
      veeHandleBlur(new Event('blur'));
    }
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside, true);
});

// Helpers
const getItemValue = (option: any) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.itemValue];
  }
  return option;
};

const getItemTitle = (option: any) => {
  if (typeof option === 'object' && option !== null) {
    if (typeof props.itemTitle === 'function') {
      return props.itemTitle(option);
    }
    return option[props.itemTitle];
  }
  return String(option);
};

// Filtered options
const filteredOptions = computed(() => {
  if (!searchQuery.value) return combinedOptions.value;
  
  if (selectedOption.value && searchQuery.value === getItemTitle(selectedOption.value)) {
    return combinedOptions.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return combinedOptions.value.filter((option) =>
    getItemTitle(option).toLowerCase().includes(query)
  );
});

// Scroll to selected on open
watch(isOpen, async (val) => {
  if (val && fieldValue.value) {
    await nextTick();
    const selectedButton = wrapperRef.value?.querySelector('button[data-selected="true"]');
    selectedButton?.scrollIntoView({ block: 'nearest' });
  }
});

// Selected option
const selectedOption = computed(() => {
  return combinedOptions.value.find((opt) => getItemValue(opt) === fieldValue.value) || null;
});

// Computed properties to check exact match and show create option
const hasExactMatch = computed(() => {
  if (!searchQuery.value) return true;
  const query = searchQuery.value.toLowerCase().trim();
  return combinedOptions.value.some((option) =>
    getItemTitle(option).toLowerCase().trim() === query
  );
});

const showCreateOption = computed(() => {
  return !!searchQuery.value.trim() && !hasExactMatch.value;
});

// Sync search query with selected value - watch both fieldValue and combinedOptions
watch([() => fieldValue.value, combinedOptions], ([newVal]) => {
  if (newVal) {
    const selected = combinedOptions.value.find((opt: any) => getItemValue(opt) === newVal);
    if (selected) {
      searchQuery.value = getItemTitle(selected);
    } else if (typeof newVal === 'string') {
      // Auto-create a temporary option when selected externally (e.g. from AWB Scan)
      const tempItem = {
        [props.itemValue]: newVal,
        [props.itemTitle]: newVal,
        isTemp: true,
      };
      tempOptions.value.push(tempItem);
      searchQuery.value = newVal;
    }
  } else {
    searchQuery.value = "";
  }
}, { immediate: true });

const handleInput = (event: Event) => {
  const query = (event.target as HTMLInputElement).value;
  searchQuery.value = query;
  isOpen.value = true;
  emit("search", query);
  
  if (query === '' && fieldValue.value) {
    fieldValue.value = null;
    emit("update:modelValue", null);
    nextTick(() => {
      emit("change", null);
    });
  }
};

const handleSelect = (option: any) => {
  const value = getItemValue(option);
  fieldValue.value = value;
  emit("update:modelValue", value);
  nextTick(() => {
    emit("change", option);
  });
  isOpen.value = false;
  searchQuery.value = getItemTitle(option);
};

const handleCreateItem = () => {
  const query = searchQuery.value.trim();
  if (query) {
    const matched = combinedOptions.value.find(
      (opt: any) => getItemTitle(opt).toLowerCase().trim() === query.toLowerCase()
    );
    if (matched) {
      handleSelect(matched);
    } else {
      const tempItem = {
        [props.itemValue]: query,
        [props.itemTitle]: query,
        isTemp: true,
      };
      tempOptions.value.push(tempItem);
      handleSelect(tempItem);
      emit("create-new", query);
    }
  }
};

const handleEnter = (event: KeyboardEvent) => {
  if (isOpen.value && showCreateOption.value) {
    event.preventDefault();
    handleCreateItem();
  }
};

const handleClear = () => {
  fieldValue.value = null;
  emit("update:modelValue", null);
  nextTick(() => {
    emit("change", null);
  });
  searchQuery.value = "";
};

const handleFocus = () => {
  if (!isDisabled.value) {
    isOpen.value = true;
  }
};

// Size classes
const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  return sizes[props.size] || sizes.md;
});

// Form context
const formContext = inject<{
  disabled: ComputedRef<boolean>;
} | null>('uiFormContext', null);

const isDisabled = computed(() => props.disabled || props.loading || formContext?.disabled.value);

defineExpose({ validate: validateField, reset: resetField, meta });
</script>

<template>
  <div ref="wrapperRef" class="space-y-2 relative">
    <label v-if="label" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <div class="relative">
        <input
          ref="inputRef"
          type="text"
          :value="searchQuery"
          :placeholder="placeholder"
          :disabled="isDisabled"
          :class="[
            'w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses,
            errorMessage 
              ? 'border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-slate-300 dark:border-slate-600 focus:border-primary-500 focus:ring-primary-500/20',
            clearable && fieldValue ? 'pr-16' : 'pr-10'
          ]"
          @input="handleInput"
          @focus="handleFocus"
          @keydown.enter="handleEnter"
        />
        
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <svg
            v-if="loading"
            class="animate-spin h-5 w-5 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>

          <button
            v-if="clearable && fieldValue && !isDisabled"
            type="button"
            class="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            @click="handleClear"
          >
            <i class="mdi mdi-close text-lg" />
          </button>
          
          <svg
            v-if="!loading"
            class="w-5 h-5 text-slate-400 transition-transform duration-200 pointer-events-none"
            :class="{ 'rotate-180': isOpen }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
             <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen && (filteredOptions.length > 0 || showCreateOption)"
          class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto"
        >
          <ul class="py-1">
            <li v-for="(option, index) in filteredOptions" :key="getItemValue(option) || index">
              <button
                type="button"
                :data-selected="fieldValue === getItemValue(option)"
                @click="handleSelect(option)"
                :class="[
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left',
                  fieldValue === getItemValue(option)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                ]"
              >
                <span>{{ getItemTitle(option) }}</span>
                <i v-if="fieldValue === getItemValue(option)" class="mdi mdi-check text-primary-500" />
              </button>
            </li>
            
            <li v-if="showCreateOption" class="border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                @click="handleCreateItem"
                class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left font-medium"
              >
                <i class="mdi mdi-plus text-lg text-primary-500" />
                <span>Add "{{ searchQuery }}"</span>
              </button>
            </li>
          </ul>
        </div>
      </Transition>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
  </div>
</template>

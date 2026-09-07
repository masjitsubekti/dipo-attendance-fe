<script setup lang="ts">
/**
 * UiAutocompleteLazy - Hybrid Vuetify-style + vee-validate autocomplete with FE Lazy Scroll Pagination
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
  pageSize?: number;
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
  pageSize: 20,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  "change": [option: any | null];
  "search": [query: string];
}>();

const isOpen = ref(false);
const searchQuery = ref("");
const wrapperRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownListRef = ref<HTMLElement | null>(null);
const displayedCount = ref(props.pageSize);

// Stable field name
const generatedId = useId();
const autocompleteId = computed(() => props.id || `autocomplete-lazy-${generatedId}`);
const fieldName = props.name || `autocomplete-lazy-${generatedId}`;

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

// Sync fieldValue -> modelValue
watch(fieldValue, (newVal) => {
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
  return String(option || "");
};

// Selected option
const selectedOption = computed(() => {
  return props.options.find((opt) => getItemValue(opt) === fieldValue.value) || null;
});

// Filtered options
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  
  if (selectedOption.value && searchQuery.value === getItemTitle(selectedOption.value)) {
    return props.options;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return props.options.filter((option) =>
    getItemTitle(option).toLowerCase().includes(query)
  );
});

// Displayed options (sliced for lazy loading)
const displayedOptions = computed(() => {
  return filteredOptions.value.slice(0, displayedCount.value);
});

// Sync search query with selected value - watch both fieldValue and options
watch([() => fieldValue.value, () => props.options], ([newVal, options]) => {
  if (newVal && options.length > 0) {
    const selected = options.find((opt: any) => getItemValue(opt) === newVal);
    if (selected) {
      searchQuery.value = getItemTitle(selected);
    }
  } else if (!newVal) {
    searchQuery.value = "";
  }
}, { immediate: true });

// Reset display count and scroll position on query change
watch(searchQuery, () => {
  if (dropdownListRef.value) {
    dropdownListRef.value.scrollTop = 0;
  }
  displayedCount.value = props.pageSize;
  activeIndex.value = 0;
});

// Selected index in filteredOptions
const selectedIndex = computed(() => {
  if (!fieldValue.value || filteredOptions.value.length === 0) return -1;
  return filteredOptions.value.findIndex((opt) => getItemValue(opt) === fieldValue.value);
});

// Scroll to selected on open
watch(isOpen, async (val) => {
  if (val) {
    if (selectedIndex.value >= 0) {
      displayedCount.value = Math.max(props.pageSize, selectedIndex.value + 1);
      activeIndex.value = selectedIndex.value;
      await nextTick();
      const selectedButton = wrapperRef.value?.querySelector('button[data-selected="true"]');
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest' });
      }
    } else {
      displayedCount.value = props.pageSize;
      activeIndex.value = 0;
    }
  }
});

const handleInput = (event: Event) => {
  const query = (event.target as HTMLInputElement).value;
  if (dropdownListRef.value) {
    dropdownListRef.value.scrollTop = 0;
  }
  searchQuery.value = query;
  isOpen.value = true;
  hasKeyboardNavigation.value = true;
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

const handleClear = () => {
  fieldValue.value = null;
  emit("update:modelValue", null);
  nextTick(() => {
    emit("change", null);
  });
  searchQuery.value = "";
  displayedCount.value = props.pageSize;
  if (dropdownListRef.value) {
    dropdownListRef.value.scrollTop = 0;
  }
};

const handleFocus = () => {
  if (!props.disabled) {
    isOpen.value = true;
  }
};

const handleBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as Node | null;
  if (wrapperRef.value && relatedTarget && wrapperRef.value.contains(relatedTarget)) {
    return;
  }
  
  isOpen.value = false;
  veeHandleBlur(event);
  
  if (fieldValue.value) {
    const selected = props.options.find((opt: any) => getItemValue(opt) === fieldValue.value);
    if (selected) {
      searchQuery.value = getItemTitle(selected);
    } else {
      searchQuery.value = "";
    }
  } else {
    searchQuery.value = "";
  }
};

// Scroll listener for lazy loading
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target) return;

  const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
  if (isNearBottom && displayedCount.value < filteredOptions.value.length) {
    displayedCount.value += props.pageSize;
  }
};

const activeIndex = ref(-1);
const hasKeyboardNavigation = ref(false);

watch(isOpen, (val) => {
  if (!val) {
    hasKeyboardNavigation.value = false;
  }
});

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isOpen.value && event.key !== 'Enter' && event.key !== 'Tab') {
    isOpen.value = true;
  }

  if (isOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      hasKeyboardNavigation.value = true;
      const maxIndex = filteredOptions.value.length - 1;
      activeIndex.value = Math.min(activeIndex.value + 1, maxIndex);
      if (activeIndex.value >= displayedCount.value) {
        displayedCount.value = Math.min(activeIndex.value + 10, filteredOptions.value.length);
      }
      scrollToActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      hasKeyboardNavigation.value = true;
      activeIndex.value = Math.max(activeIndex.value - 1, 0);
      scrollToActive();
    } else if (event.key === 'Enter') {
      if (displayedOptions.value.length > 0 && activeIndex.value >= 0 && activeIndex.value < displayedOptions.value.length) {
        event.preventDefault();
        event.stopPropagation();
        handleSelect(displayedOptions.value[activeIndex.value]);
      } else {
        event.preventDefault();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      isOpen.value = false;
    } else if (event.key === 'Tab') {
      if (hasKeyboardNavigation.value && displayedOptions.value.length > 0 && activeIndex.value >= 0 && activeIndex.value < displayedOptions.value.length) {
        handleSelect(displayedOptions.value[activeIndex.value]);
      }
      isOpen.value = false;
    }
  }
};

const scrollToActive = () => {
  nextTick(() => {
    const activeEl = wrapperRef.value?.querySelector(`li:nth-child(${activeIndex.value + 1}) button`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  });
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

const isDisabled = computed(() => props.disabled || formContext?.disabled.value);

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
          @blur="handleBlur"
          @keydown="handleKeyDown"
        />
        
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            v-if="clearable && fieldValue && !isDisabled"
            type="button"
            tabindex="-1"
            class="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            @click="handleClear"
          >
            <i class="mdi mdi-close text-lg" />
          </button>
          
          <svg
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
          v-if="isOpen && filteredOptions.length > 0"
          ref="dropdownListRef"
          tabindex="-1"
          class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto"
          @scroll="handleScroll"
        >
          <ul class="py-1">
            <li v-for="(option, index) in displayedOptions" :key="getItemValue(option) || index">
              <button
                type="button"
                tabindex="-1"
                :data-selected="fieldValue === getItemValue(option)"
                @click="handleSelect(option)"
                :class="[
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left',
                  fieldValue === getItemValue(option)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                    : index === activeIndex
                    ? 'bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                ]"
              >
                <span>{{ getItemTitle(option) }}</span>
                <i v-if="fieldValue === getItemValue(option)" class="mdi mdi-check text-primary-500" />
              </button>
            </li>
            
            <li v-if="displayedCount < filteredOptions.length" class="p-2 text-center text-[11px] text-slate-400">
              Scroll untuk melihat lebih banyak...
            </li>
          </ul>
        </div>
      </Transition>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
  </div>
</template>

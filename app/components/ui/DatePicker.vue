<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

interface Props {
  modelValue?: any;
  mode?: 'date' | 'datetime' | 'time' | 'month' | 'year';
  range?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  mode: 'date',
  range: false,
  placeholder: "Select Date",
  required: false,
  size: 'md',
  disabled: false,
  clearable: true,
});

// Size classes to match Input.vue
const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'dp-size-sm',
    md: 'dp-size-md',
    lg: 'dp-size-lg',
  };
  return sizes[props.size] || sizes.md;
});

const emit = defineEmits<{
  "update:modelValue": [value: any];
}>();

const injectCurrentTime = (selectedValue: any): any => {
  if (!selectedValue || props.mode !== 'datetime') {
    return selectedValue;
  }

  let dateOnly = '';

  if (selectedValue instanceof Date) {
    const year = selectedValue.getFullYear();
    const month = String(selectedValue.getMonth() + 1).padStart(2, '0');
    const day = String(selectedValue.getDate()).padStart(2, '0');
    dateOnly = `${year}-${month}-${day}`;
  } else if (typeof selectedValue === 'string') {
    const match = selectedValue.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
      dateOnly = match[0];
    }
  }

  if (dateOnly && dateOnly.length === 10) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${dateOnly} ${hours}:${minutes}:${seconds}`;
  }

  return selectedValue;
};

const date = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", injectCurrentTime(val)),
});

// Sync dark mode
const isDark = ref(false);

onMounted(() => {
    if (typeof window !== 'undefined') {
        isDark.value = document.documentElement.classList.contains('dark');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    isDark.value = document.documentElement.classList.contains('dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
    }
});

const dpTheme = computed(() => {
    return isDark.value ? 'dark' : 'light';
});

const formats = computed(() => {
    const isDate = props.mode === 'date';
    const isDatetime = props.mode === 'datetime';
    const isTime = props.mode === 'time';
    const isMonth = props.mode === 'month';
    const isYear = props.mode === 'year';

    const formatStr = isDate ? 'yyyy-MM-dd' : (isDatetime ? 'yyyy-MM-dd HH:mm' : (isTime ? 'HH:mm' : (isMonth ? 'MM/yyyy' : 'yyyy')));

    return {
        input: formatStr,
    };
});

const flow = computed<any>(() => {
    if (props.mode === 'date') return ['calendar'];
    if (props.mode === 'month') return ['month', 'year'];
    if (props.mode === 'year') return ['year'];
    if (props.mode === 'time') return ['time'];
    return ['calendar', 'time'];
});
</script>

<template>
  <div class="space-y-2">
    <label
      v-if="label"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div :class="['dp-size-wrapper', sizeClass, { 'has-error': error, 'hide-clear-button': !props.clearable }]">
        <VueDatePicker
            v-model="date"
            :teleport="true"
            :enable-time-picker="mode === 'datetime' || mode === 'time'"
            :time-picker="mode === 'time'"
            :month-picker="mode === 'month'"
            :year-picker="mode === 'year'"
            :range="range"
            :placeholder="placeholder"
            :dark="dpTheme === 'dark'"
            :formats="formats"
            :flow="flow"
            :model-type="mode === 'date' ? 'yyyy-MM-dd' : (mode === 'datetime' ? 'yyyy-MM-dd HH:mm:ss' : (mode === 'time' ? 'HH:mm' : undefined))"
            auto-apply
            class="dp-custom"
            :class="{ 'hide-time-icon': mode === 'date' }"
            :input-class-name="error ? 'dp-input-error' : ''"
            :disabled="disabled"
            :clearable="props.clearable"
        >
        </VueDatePicker>
    </div>

    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>

<style>
/* Custom overrides to match theme better if needed */
.hide-clear-button .dp__clear_icon,
.hide-clear-button .dp--clear-btn {
    display: none !important;
}

.dp-custom {
    --dp-border-radius: 0.5rem; /* rounded-lg */
    --dp-font-family: inherit;
}

.dp-input-error {
    border-color: #ef4444 !important; /* red-500 */
}

/* Size variants - matches Input.vue sizing */
/* Note: padding-left needs extra space for calendar icon */
.dp-size-sm .dp__input {
    padding: 6px 30px 6px 12px;
    font-size: 0.875rem; /* text-sm */
    height: auto;
    line-height: 1.5;
    min-height: 2rem;
}

.dp-size-sm .dp__input_icon_pad {
    padding-left: 37px;
}

.dp-size-md .dp__input {
    padding: 10px 30px 10px 16px;
    font-size: 0.875rem; /* text-sm */
    height: auto;
    line-height: 1.5;
    min-height: 2.5rem;
}

.dp-size-md .dp__input_icon_pad {
    padding-left: 37px;
}

.dp-size-lg .dp__input {
    padding: 12px 30px 12px 16px;
    font-size: 1rem; /* text-base */
    height: auto;
    line-height: 1.5;
    min-height: 2.75rem;
}

.dp-size-lg .dp__input_icon_pad {
    padding-left: 44px;
}

/* Default input styles */
.dp__input {
    background-color: transparent;
}

/* Force hide time icon in date mode if it appears */
.hide-time-icon .dp__action_row svg {
    display: none !important;
}

/* Adjust icon position based on wrapper size */
.dp-size-sm .dp__input_icon {
    width: 16px;
    height: 16px;
    left: 4px;
}

.dp-size-md .dp__input_icon {
    width: 18px;
    height: 18px;
    left: 1px;
}

.dp-size-lg .dp__input_icon {
    width: 20px;
    height: 20px;
    left: 4px;
}
</style>

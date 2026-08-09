<script setup lang="ts">
/**
 * UiNumberInput - Formatted Number / Price Input component with vee-validate integration
 *
 * Features:
 * - Formats numbers with thousand separators (e.g. 10000 -> 10.000)
 * - Emits numeric modelValue (number | null)
 * - Real-time formatting as the user types
 * - Vee-validate support via useField
 * - Custom prefix & suffix support (e.g. Rp)
 */
import { useField } from 'vee-validate';

export type ValidationRule = (value: any) => boolean | string;

interface Props {
  modelValue?: number | string | null;
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  rules?: ValidationRule[];
  min?: number;
  max?: number;
  allowNegative?: boolean;
  prefixText?: string;
  suffixText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
  required: false,
  size: 'md',
  clearable: false,
  rules: () => [],
  allowNegative: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'clear': [];
  'blur': [event: FocusEvent];
}>();

const generatedId = useId();
const inputId = computed(() => props.id || `number-input-${generatedId}`);
const fieldName = props.name || `field-${generatedId}`;

const validateWithRules = (value: any): boolean | string => {
  for (const rule of props.rules) {
    const result = rule(value);
    if (result !== true) {
      return typeof result === 'string' ? result : 'Invalid value';
    }
  }
  return true;
};

const {
  value: fieldValue,
  errorMessage,
  handleBlur: veeHandleBlur,
  handleChange: veeHandleChange,
  resetField,
  validate: validateField,
  meta,
} = useField<number | null>(fieldName, validateWithRules, {
  initialValue: props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '' ? Number(props.modelValue) : null,
  validateOnValueUpdate: true,
  validateOnMount: false,
});

const formatNumberString = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const numStr = String(val);
  const isNeg = props.allowNegative && numStr.startsWith('-');
  const cleanDigits = numStr.replace(/[^0-9]/g, '');
  if (!cleanDigits) return isNeg ? '-' : '';
  const formatted = cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNeg ? `-${formatted}` : formatted;
};

const parseFormattedString = (str: string): number | null => {
  if (!str) return null;
  const isNeg = props.allowNegative && str.startsWith('-');
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) return null;
  const val = Number(cleanDigits) * (isNeg ? -1 : 1);
  return isNaN(val) ? null : val;
};

const displayValue = ref<string>(formatNumberString(props.modelValue));

watch(
  () => props.modelValue,
  (newVal) => {
    const numVal = newVal !== null && newVal !== undefined && newVal !== '' ? Number(newVal) : null;
    if (numVal !== fieldValue.value) {
      fieldValue.value = numVal;
    }
    const expectedDisplay = formatNumberString(numVal);
    if (displayValue.value !== expectedDisplay) {
      displayValue.value = expectedDisplay;
    }
  },
  { immediate: true }
);

watch(fieldValue, (newVal) => {
  const numVal = newVal !== null && newVal !== undefined ? Number(newVal) : null;
  if (numVal !== props.modelValue) {
    emit('update:modelValue', numVal);
  }
});

const onInput = (event: Event) => {
  const inputEl = event.target as HTMLInputElement;
  const rawInput = inputEl.value;
  const numericVal = parseFormattedString(rawInput);
  
  const formatted = formatNumberString(rawInput);
  displayValue.value = formatted;
  inputEl.value = formatted;
  
  fieldValue.value = numericVal;
  veeHandleChange(numericVal, true);
};

const onBlur = (event: FocusEvent) => {
  veeHandleBlur(event, true);
  emit('blur', event);
};

const handleClear = () => {
  displayValue.value = '';
  fieldValue.value = null;
  emit('update:modelValue', null);
  emit('clear');
};

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  return sizes[props.size] || sizes.md;
});

const hasValue = computed(() => {
  return fieldValue.value !== null && fieldValue.value !== undefined;
});

const formContext = inject<{
  disabled: ComputedRef<boolean>;
} | null>('uiFormContext', null);

const isDisabled = computed(() => props.disabled || formContext?.disabled.value);

defineExpose({
  validate: validateField,
  reset: resetField,
  meta,
});
</script>

<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <div v-if="$slots.prefix || prefixText" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
        <slot name="prefix">{{ prefixText }}</slot>
      </div>
      <input
        :id="inputId"
        :name="fieldName"
        type="text"
        inputmode="numeric"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :required="required"
        :class="[
          'w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses,
          { 'pl-11': $slots.prefix || prefixText },
          { 'pr-11': ($slots.suffix || suffixText) && !(clearable && hasValue) },
          { 'pr-20': ($slots.suffix || suffixText) && clearable && hasValue },
          { 'pr-10': clearable && hasValue && !($slots.suffix || suffixText) },
          errorMessage 
            ? 'border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-300 dark:border-slate-600 focus:border-primary-500 focus:ring-primary-500/20',
        ]"
        @input="onInput"
        @blur="onBlur"
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          v-if="clearable && hasValue && !isDisabled"
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          @click="handleClear"
        >
          <i class="mdi mdi-close text-lg" />
        </button>
        <div v-if="$slots.suffix || suffixText" class="text-slate-400 text-sm">
          <slot name="suffix">{{ suffixText }}</slot>
        </div>
      </div>
    </div>
    <p v-if="errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>

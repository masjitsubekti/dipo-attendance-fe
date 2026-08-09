<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

interface Props {
  modelValue?: any;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: "Select Date & Time",
  required: false,
  size: "sm",
});

const emit = defineEmits<{
  "update:modelValue": [value: any];
}>();

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: "dp-size-sm",
    md: "dp-size-md",
    lg: "dp-size-lg",
  };
  return sizes[props.size] || sizes.sm;
});

const parseToDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(String(val).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
};

const formatToString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const internalDate = ref<Date | null>(parseToDate(props.modelValue));

watch(
  () => props.modelValue,
  (newVal) => {
    const parsed = parseToDate(newVal);
    if (parsed?.getTime() !== internalDate.value?.getTime()) {
      internalDate.value = parsed;
    }
  },
);

watch(
  internalDate,
  (val) => {
    if (!val) {
      emit("update:modelValue", null);
      return;
    }
    const formatted = formatToString(val);
    if (formatted !== props.modelValue) {
      emit("update:modelValue", formatted);
    }
  },
  { deep: true, immediate: false },
);

const handleTimeUpdate = (time: any) => {
  if (internalDate.value && time) {
    const newDate = new Date(internalDate.value);
    newDate.setHours(time.hours || 0, time.minutes || 0, time.seconds || 0);
    internalDate.value = newDate;
  }
};

const isDark = ref(false);
onMounted(() => {
  if (typeof window !== "undefined") {
    isDark.value = document.documentElement.classList.contains("dark");
    const observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributes: true });
  }
});

const formatVisual = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};
</script>

<template>
  <div class="space-y-1">
    <label
      v-if="label"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div :class="['dp-size-wrapper', sizeClass, { 'has-error': error }]">
      <VueDatePicker
        v-model="internalDate"
        :teleport="true"
        :dark="isDark"
        :placeholder="placeholder"
        :format="formatVisual"
        enable-time-picker
        :time-config="{ timePickerInline: true }"
        auto-apply
        class="dp-custom-dtp"
        :input-class-name="error ? 'dp-input-error' : ''"
        @update-time="handleTimeUpdate"
      />
    </div>

    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
  </div>
</template>

<style>
.dp-custom-dtp {
  --dp-border-radius: 0.5rem;
  --dp-font-family: inherit;
}
.dp-custom-dtp .dp-input-error {
  border-color: #ef4444 !important;
}
.dp-size-sm .dp-custom-dtp .dp__input {
  padding: 5px 30px 5px 12px;
  font-size: 0.875rem;
  min-height: 2rem;
}
.dp-size-sm .dp-custom-dtp .dp__input_icon_pad {
  padding-left: 37px;
}
.dp-size-md .dp-custom-dtp .dp__input {
  padding: 9px 30px 9px 16px;
  font-size: 0.875rem;
  min-height: 2.5rem;
}
.dp-size-md .dp-custom-dtp .dp__input_icon_pad {
  padding-left: 37px;
}
.dp-size-lg .dp-custom-dtp .dp__input {
  padding: 11px 30px 11px 16px;
  font-size: 1rem;
  min-height: 2.75rem;
}
.dp-size-lg .dp-custom-dtp .dp__input_icon_pad {
  padding-left: 44px;
}
.dp-custom-dtp .dp__input {
  background-color: transparent;
}
</style>

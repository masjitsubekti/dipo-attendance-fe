<script setup lang="ts">
interface FilterField {
  name: string
  label?: string
  placeholder?: string
  clearable?: boolean
}

interface Props {
  modelValue?: string | null
  field: FilterField
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'apply': []
}>()

const handleChange = (value: string | null) => {
  emit('update:modelValue', value)
  emit('apply')
}
</script>

<template>
  <div class="space-y-1">
    <label 
      v-if="props.field.label" 
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ props.field.label }}
    </label>
    <UiDatePicker
      :model-value="props.modelValue"
      :placeholder="props.field.placeholder || 'Pilih tanggal'"
      :disabled="props.disabled"
      :clearable="props.field.clearable !== undefined ? props.field.clearable : true"
      @update:model-value="handleChange"
    />
  </div>
</template>

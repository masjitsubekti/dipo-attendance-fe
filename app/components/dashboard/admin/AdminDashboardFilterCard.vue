<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="-translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-2 opacity-0"
  >
    <div v-show="showFilters">
      <UiCard class="sm:p-5">
        <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <UiAutocomplete
              :model-value="institution"
              :options="institutionOptions"
              item-value="value"
              item-title="label"
              size="sm"
              label="Sekolah"
              placeholder="Pilih Sekolah"
              @update:model-value="onInstitutionChange"
            />
          </div>
          <div>
            <UiAutocomplete
              :model-value="department"
              :options="departmentOptions"
              item-value="value"
              item-title="label"
              size="sm"
              label="Departemen"
              placeholder="Pilih Departemen"
              @update:model-value="onDepartmentChange"
            />
          </div>
          <div>
            <UiDatePicker
              :model-value="startDate"
              label="Tanggal Mulai"
              placeholder="Pilih tanggal mulai"
              size="sm"
              :clearable="false"
              @update:model-value="onStartDateChange"
            />
          </div>
          <div>
            <UiDatePicker
              :model-value="endDate"
              label="Tanggal Selesai"
              placeholder="Pilih tanggal selesai"
              size="sm"
              :clearable="false"
              @update:model-value="onEndDateChange"
            />
          </div>
          <div>
            <UiInput
              :model-value="selectedMonth"
              type="month"
              label="Bulan Grafik"
              size="sm"
              @update:model-value="onSelectedMonthChange"
            />
          </div>
          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              class="h-10 w-10 p-0 flex items-center justify-center cursor-pointer"
              :disabled="isLoadingData"
              title="Reset Filter"
              @click="$emit('reset')"
            >
              <i class="mdi mdi-refresh text-base"></i>
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  showFilters: boolean;
  institution: string;
  department: string;
  startDate: string;
  endDate: string;
  selectedMonth: string;
  institutionOptions: Array<{ value: string; label: string }>;
  departmentOptions: Array<{ value: string; label: string }>;
  isLoadingData: boolean;
}>();

const emit = defineEmits<{
  (e: "update:institution", val: string): void;
  (e: "update:department", val: string): void;
  (e: "update:startDate", val: string): void;
  (e: "update:endDate", val: string): void;
  (e: "update:selectedMonth", val: string): void;
  (e: "filter-change"): void;
  (e: "reset"): void;
}>();

function onInstitutionChange(val: any) {
  const value = typeof val === "object" && val?.target ? val.target.value : (val ?? "all");
  emit("update:institution", String(value));
  emit("filter-change");
}

function onDepartmentChange(val: any) {
  const value = typeof val === "object" && val?.target ? val.target.value : (val ?? "all");
  emit("update:department", String(value));
  emit("filter-change");
}

function onStartDateChange(val: any) {
  const value = typeof val === "object" && val?.target ? val.target.value : val;
  emit("update:startDate", value);
  emit("filter-change");
}

function onEndDateChange(val: any) {
  const value = typeof val === "object" && val?.target ? val.target.value : val;
  emit("update:endDate", value);
  emit("filter-change");
}

function onSelectedMonthChange(val: any) {
  const value = typeof val === "object" && val?.target ? val.target.value : val;
  emit("update:selectedMonth", value);
  emit("filter-change");
}
</script>

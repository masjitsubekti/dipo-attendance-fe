<template>
  <UiModal v-model="isOpen" title="Pilih Icon" size="md">
    <div class="space-y-4">
      <UiInput
        v-model="searchQuery"
        placeholder="Cari icon..."
        prepend-icon="mdi-magnify"
        autofocus
      />

      <div class="flex flex-wrap gap-1 max-h-[400px] overflow-y-auto p-2">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          class="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
          :class="{ 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500': modelValue === icon }"
          @click="selectIcon(icon)"
          :title="icon"
        >
          <i :class="[
            'mdi', 
            icon, 
            'text-xl group-hover:scale-110 transition-transform',
            modelValue === icon ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
          ]"></i>
        </button>
      </div>
      
      <div v-if="filteredIcons.length === 0" class="text-center py-8 text-slate-500">
        Icon tidak ditemukan
      </div>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="isOpen = false">Batal</UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: string;
  show: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:show': [value: boolean];
  'close': [];
}>();

const isOpen = computed({
  get: () => props.show,
  set: (val) => {
    emit('update:show', val);
    if (!val) emit('close');
  },
});

const searchQuery = ref('');
const selectIcon = (icon: string) => {
  emit('update:modelValue', icon);
  isOpen.value = false;
};

// Curated list of common MDI icons for an admin/gate system
const icons = [
  // General
  'mdi-account', 'mdi-account-group', 'mdi-account-tie', 'mdi-account-hard-hat', 'mdi-account-check',
  'mdi-domain', 'mdi-office-building', 'mdi-factory', 'mdi-store', 'mdi-home',
  'mdi-clipboard-check', 'mdi-clipboard-text', 'mdi-file-document', 'mdi-folder',
  'mdi-calendar', 'mdi-calendar-clock', 'mdi-clock', 'mdi-timer',
  
  // Actions
  'mdi-check', 'mdi-close', 'mdi-plus', 'mdi-pencil', 'mdi-delete', 'mdi-magnify',
  'mdi-eye', 'mdi-eye-off', 'mdi-lock', 'mdi-lock-open', 'mdi-key',
  'mdi-login', 'mdi-logout', 'mdi-import', 'mdi-export',
  
  // Objects/Vehicles
  'mdi-car', 'mdi-truck', 'mdi-truck-delivery', 'mdi-motorbike', 'mdi-bicycle', 'mdi-bus',
  'mdi-package', 'mdi-package-variant', 'mdi-cart', 'mdi-dolly',
  
  // Technology/Devices
  'mdi-monitor', 'mdi-laptop', 'mdi-cellphone', 'mdi-tablet', 'mdi-printer',
  'mdi-camera', 'mdi-cctv', 'mdi-id-card', 'mdi-card-account-details', 'mdi-qrcode',
  
  // Settings/System
  'mdi-cog', 'mdi-tune', 'mdi-wrench', 'mdi-tools', 'mdi-shield-check',
  'mdi-bell', 'mdi-alert', 'mdi-information', 'mdi-help-circle',
  
  // Transport/Gate
  'mdi-gate', 'mdi-boom-gate', 'mdi-door', 'mdi-door-open',
  'mdi-map-marker', 'mdi-navigation', 'mdi-crosshairs-gps',
  
  // Business
  'mdi-briefcase', 'mdi-briefcase-check', 'mdi-presentation', 'mdi-chart-bar',
  'mdi-currency-usd', 'mdi-credit-card', 'mdi-cash',
  
  // Misc
  'mdi-star', 'mdi-heart', 'mdi-tag', 'mdi-label', 'mdi-flag',
  'mdi-email', 'mdi-phone', 'mdi-message',
  'mdi-food', 'mdi-coffee', 'mdi-medical-bag'
];

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons;
  const q = searchQuery.value.toLowerCase();
  return icons.filter(icon => icon.toLowerCase().includes(q));
});
</script>

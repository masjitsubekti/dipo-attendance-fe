<template>
  <Transition name="imap-slide">
    <div
      v-if="show"
      class="absolute top-3 right-3 z-[1000] w-70 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <button 
        @click="$emit('update:show', false)"
        class="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 cursor-pointer"
      >
        <i class="mdi mdi-close"></i>
      </button>

      <div class="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-slate-600 dark:text-slate-400">
          <i class="mdi mdi-account text-xl"></i> 
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase font-medium dark:text-slate-300">Total Person</p>
          <h3 class="text-xl font-bold text-slate-800 dark:text-white">
            {{ totalEmployees.toLocaleString() }}
          </h3>
        </div>
      </div>

      <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <div class="relative">
          <i class="mdi mdi-magnify absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Search work area..."
            class="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            @focus="$emit('pause-scroll')"
            @blur="$emit('resume-scroll')"
          />
        </div>
      </div>

      <!-- Area Breakdown List (Auto-scrollable) -->
      <div 
        ref="statsListRef" 
        class="overflow-y-auto imap-smooth-scroll"
        :class="listMaxHeightClass"
        @mouseenter="$emit('pause-scroll')"
        @mouseleave="$emit('resume-scroll')"
      >
        <div
          v-for="(area, index) in filteredAreas"
          :key="area.name || index"
          :ref="(el) => handleSetAreaItemRef(el, index)"
          :data-area-idx="index"
          class="p-3 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all duration-300 cursor-pointer"
          @click="$emit('focus-area', area)"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ area.name }}</span>
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {{ area.total }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-2 text-[14px] text-slate-500 overflow-x-auto">
            <div class="flex items-center gap-1 shrink-0" title="Regular">
              <i class="mdi mdi-account text-blue-500"></i> <span class="text-slate-700 dark:text-slate-300">{{ area.regular || 0 }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" title="Outsourcing">
              <i class="mdi mdi-account text-green-500"></i> <span class="text-slate-700 dark:text-slate-300">{{ area.outsourcing || 0 }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" title="Contractor">
              <i class="mdi mdi-account text-orange-500"></i> <span class="text-slate-700 dark:text-slate-300">{{ area.contractor || 0 }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0" title="Visitor">
              <i class="mdi mdi-account text-red-500"></i> <span class="text-slate-700 dark:text-slate-300">{{ area.visitor || 0 }}</span>
            </div>
          </div>
        </div>
        <div v-if="filteredAreas.length === 0" class="p-4 text-center text-sm text-slate-400">
          No work area found
        </div>
      </div>

      <!-- Pie Chart -->
      <div class="border-t border-slate-200 dark:border-slate-700 p-2">
        <h4 class="text-xs text-slate-500 uppercase font-medium px-1 mt-1 dark:text-slate-300">TOTAL TYPE</h4>
        <div class="h-35">
          <DashboardPersonnelPie
            :data="mapPieData"
            :showLegend="false"
            :fontSize="'13px'"
            :colors="['#3B82F6', '#22C55E', '#F97316', '#EF4444']"
          />
        </div>
      </div>

      <div class="p-2 bg-slate-50 dark:bg-slate-900/50 text-[12px] text-slate-500 flex flex-wrap justify-center gap-2">
        <span class="flex items-center gap-1 dark:text-slate-300"><i class="mdi mdi-circle text-[10px] text-blue-500"></i> Regular</span>
        <span class="flex items-center gap-1 dark:text-slate-300"><i class="mdi mdi-circle text-[10px] text-green-500"></i> Outsourcing</span>
        <span class="flex items-center gap-1 dark:text-slate-300"><i class="mdi mdi-circle text-[10px] text-orange-500"></i> Contractor</span>
        <span class="flex items-center gap-1 dark:text-slate-300"><i class="mdi mdi-circle text-[10px] text-red-500"></i> Visitor</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  show: boolean;
  totalEmployees: number;
  searchQuery: string;
  filteredAreas: any[];
  mapPieData: any[];
  listMaxHeightClass: string;
  setAreaItemRef?: (el: any, index: number) => void;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'pause-scroll'): void;
  (e: 'resume-scroll'): void;
  (e: 'focus-area', area: any): void;
}>();

const statsListRef = ref<HTMLElement | null>(null);

const handleSetAreaItemRef = (el: any, index: number) => {
  if (props.setAreaItemRef) {
    props.setAreaItemRef(el, index);
  }
};

defineExpose({
  statsListRef
});
</script>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useConfigStore } from '~/stores/config';

interface Props {
  institutionName?: string;
}
withDefaults(defineProps<Props>(), { institutionName: '' });

const authStore = useAuthStore();
const configStore = useConfigStore();

const user = computed(() => authStore.user);
const appName = computed(() => configStore.appName || 'Presensi Pegawai');
const avatarUrl = computed(() => user.value?.avatar || (user.value as any)?.foto || null);

const initials = computed(() => {
  const name = user.value?.name || '';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
});
</script>

<template>
  <div class="attendance-header">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 pt-5 pb-3">
      <!-- Left: App name + Institution -->
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-0.5">{{ appName }}</p>
        <h1 v-if="institutionName" class="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
          {{ institutionName }}
        </h1>
      </div>

      <!-- Right: Avatar + Name -->
      <div class="flex items-center gap-3 ml-4">
        <div class="text-right min-w-0">
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-tight">Halo 👋</p>
          <p class="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[120px]">{{ user?.name || '—' }}</p>
        </div>
        <!-- Avatar -->
        <div class="relative shrink-0">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="user?.name"
            class="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50"
          />
          <div
            v-else
            class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-blue-500/30"
          >
            {{ initials }}
          </div>
          <!-- Online dot -->
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </div>
      </div>
    </div>

    <!-- Decorative gradient line -->
    <div class="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mx-5"></div>
  </div>
</template>

<template>
  <div class="w-full max-w-full overflow-x-hidden space-y-4">
    <!-- Active Role Dashboard View (Wrapped in ClientOnly to prevent SSR Hydration Node Mismatch) -->
    <ClientOnly>
      <KeepAlive>
        <TeacherDashboard v-if="activeDashboard === 'teacher'" />
        <AdminDashboard v-else-if="activeDashboard === 'admin'" />
      </KeepAlive>
      <template #fallback>
        <div class="w-full h-96 flex items-center justify-center bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl animate-pulse">
          <div class="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
            <UiSpinner size="lg" color="primary" />
            <span class="text-xs font-semibold">Memuat Dashboard...</span>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import AdminDashboard from "~/components/dashboard/AdminDashboard.vue";
import TeacherDashboard from "~/components/dashboard/TeacherDashboard.vue";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "Dashboard Presensi Sekolah",
});

const authStore = useAuthStore();

// Selected View Mode ('auto' | 'teacher' | 'admin')
const selectedRoleView = ref<string>('auto');

// Determine whether role is Admin (HA01, HA02) or Teacher/Other (HA03, HA04, etc.)
const isAdminRole = computed(() => {
  const user = authStore.user;
  if (!user) return false;

  // Extract role string/code (e.g. HA01, HA02)
  const roleData = JSON.stringify(user.role || "").toUpperCase() + String(user.roleId || "").toUpperCase();
  const userRoleName = String(authStore.getUserRole || "").toUpperCase();

  // If role matches HA01 or HA02 -> Admin / Superadmin
  if (
    roleData.includes("HA01") ||
    roleData.includes("HA02") ||
    userRoleName.includes("ADMIN") ||
    userRoleName.includes("SUPERADMIN") ||
    userRoleName.includes("MANAGEMENT")
  ) {
    return true;
  }

  // Else: HA03, HA04, and all others -> Teacher / Guru Dashboard
  return false;
});

const activeDashboard = computed(() => {
  if (selectedRoleView.value === 'admin') return 'admin';
  if (selectedRoleView.value === 'teacher') return 'teacher';
  return isAdminRole.value ? 'admin' : 'teacher';
});
</script>

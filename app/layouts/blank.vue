<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <slot />
  </div>
</template>
<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useConfigStore } from "~/stores/config";

const authStore = useAuthStore();
const configStore = useConfigStore();
const runtimeConfig = useRuntimeConfig();
const isReady = ref(false);
const sidebarLayout = ref<"vertical" | "horizontal">("vertical");
const sidebarCollapsed = ref(false);
const contentLayout = ref<"full" | "box">("full");

onMounted(() => {
  // Always init config for theme/layout settings
  configStore.initConfig();
  configStore.setSidebarLayout("vertical");

  const tokenCookie = useCookie(runtimeConfig.public.tokenKey);
  if (!tokenCookie.value && !authStore.isAuthenticated) {
    // Not authenticated - let middleware handle redirect
    // Still keep isReady false so loading shows
    return;
  }

  sidebarLayout.value = configStore.sidebarLayout;
  sidebarCollapsed.value = configStore.sidebarCollapsed;
  contentLayout.value = configStore.contentLayout;

  watch(
    () => configStore.sidebarLayout,
    (val) => {
      sidebarLayout.value = val;
    }
  );
  watch(
    () => configStore.sidebarCollapsed,
    (val) => {
      sidebarCollapsed.value = val;
    }
  );
  watch(
    () => configStore.contentLayout,
    (val) => {
      contentLayout.value = val;
    }
  );

  nextTick(() => {
    isReady.value = true;
  });
});
</script>
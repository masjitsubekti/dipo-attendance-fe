<script setup lang="ts">
import { useSidebar } from "~/composables/useSidebar";
import { useAuthStore } from "~/stores/auth";
import { useConfigStore } from "~/stores/config";

const authStore = useAuthStore();
const configStore = useConfigStore();
const runtimeConfig = useRuntimeConfig();
const { isCollapsed, isMobileOpen, closeMobile, toggle } = useSidebar();
const isReady = ref(false);
const sidebarLayout = ref<"vertical" | "horizontal">("vertical");
const sidebarCollapsed = ref(false);
const contentLayout = ref<"full" | "box">("full");

onMounted(() => {
  configStore.initConfig();
  configStore.setSidebarLayout("vertical");

  const tokenCookie = useCookie(runtimeConfig.public.tokenKey);
  if (!tokenCookie.value && !authStore.isAuthenticated) {
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

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Loading overlay -->
    <UiPageLoading v-if="!isReady" class="fixed inset-0 z-[100]" />

    <!-- Sidebar & Header -->
    <LayoutSidebar v-if="isReady" />
    <LayoutHeader v-if="isReady" />
    <UiToast />

    <!-- Main content with compact attendance padding -->
    <main
      :class="[
        'pt-14 sm:pt-16 min-h-screen transition-all duration-300 w-full',
        sidebarLayout === 'vertical'
          ? sidebarCollapsed
            ? 'lg:pl-20'
            : 'lg:pl-64'
          : '',
      ]"
    >
      <div class="max-w-4xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

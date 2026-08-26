<script setup lang="ts">
import { useConfigStore } from "~/stores/config";
import { useAuthStore } from "~/stores/auth";
import { useSwal } from "~/composables/useSwal";
import { useSidebar } from "~/composables/useSidebar";

const { isMobileOpen, closeMobile } = useSidebar();
const configStore = useConfigStore();
const authStore = useAuthStore();
const route = useRoute();

// Use local refs that sync with store after mount to avoid hydration issues
const sidebarLayout = ref<"vertical" | "horizontal">("vertical");
const sidebarCollapsed = ref(false);

// Hover state for auto-expand when collapsed
const isHovered = ref(false);

// Check if we're on mobile (screen < lg breakpoint)
const isOnMobile = ref(false);

onMounted(() => {
  const checkMobile = () => {
    isOnMobile.value = window.innerWidth < 1024;
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  onUnmounted(() => window.removeEventListener('resize', checkMobile));
});

// Computed: sidebar should show as expanded when hovered while collapsed
// On mobile, always show as expanded (not collapsed)
const isEffectivelyCollapsed = computed(() => {
  // Never collapse on mobile
  if (isOnMobile.value || isMobileOpen.value) return false;
  return sidebarCollapsed.value && showOnDesktop.value && !isHovered.value;
});

onMounted(() => {
  sidebarLayout.value = configStore.sidebarLayout;
  sidebarCollapsed.value = configStore.sidebarCollapsed;
  
  watch(() => configStore.sidebarLayout, (val) => {
    sidebarLayout.value = val;
  });
  watch(() => configStore.sidebarCollapsed, (val) => {
    sidebarCollapsed.value = val;
  });
});

// Track which dropdowns are open
const openDropdowns = ref<Set<string>>(new Set());

const toggleDropdown = (label: string) => {
  if (openDropdowns.value.has(label)) {
    openDropdowns.value.delete(label);
  } else {
    openDropdowns.value.add(label);
  }
};

const isDropdownOpen = (label: string) => openDropdowns.value.has(label);

// Get menus from auth store
const menus = computed(() => authStore.getMenus || []);

const isActive = (path?: string) => {
  if (!path) return false;
  if (path === "/") {
    return route.path === "/";
  }
  
  // Special case: Dashboard should be exact match to avoid conflict with Dashboard Map (/dashboard/map-area)
  if (path === "/dashboard") {
    return route.path === "/dashboard";
  }

  // Ensure strict path boundary for other routes (e.g. /user shouldn't match /users)
  if (route.path === path) return true;
  return route.path.startsWith(path + "/");
};

const isParentActive = (item: any) => {
  if (item.children && item.children.length > 0) {
    return item.children.some((child: any) => isActive(child.link || child.path));
  }
  return isActive(item.link || item.path);
};

// Check if should show sidebar on desktop based on layout
const showOnDesktop = computed(() => sidebarLayout.value === "vertical");

// Handle logout
const handleLogout = async () => {
  const swal = useSwal();
  const result = await swal.confirm(
    'Logout',
    'Apakah Anda yakin ingin keluar dari akun ini?'
  );
  
  if (result.isConfirmed) {
    authStore.logout();
    closeMobile();
    navigateTo("/login");
  }
};
</script>

<template>
  <!-- Mobile overlay - shows for both layouts on mobile -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
      @click="closeMobile"
    />
  </Transition>

  <aside
    :class="[
      'fixed top-0 left-0 z-50 h-full sidebar-custom transition-all duration-300 flex flex-col',
      isEffectivelyCollapsed ? 'w-20 sidebar-collapsed' : 'w-64',
      // Mobile: show when isMobileOpen is true (for both layouts)
      isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      // Desktop: always show for vertical, always hide for horizontal
      showOnDesktop ? 'lg:translate-x-0' : 'lg:-translate-x-full',
    ]"
    style="box-shadow: rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px;"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Logo -->
    <div 
      class="flex items-center gap-3 px-4 transition-all duration-300 mt-1 mb-1 shrink-0"
      :class="{ 'justify-center px-4': isEffectivelyCollapsed }"
    >
      <img 
        src="/images/app-logo.png" 
        alt="MKN Logo" 
        :class="isEffectivelyCollapsed ? 'w-12 h-12' : 'w-17 h-17'" 
        class="object-contain bg-transparent rounded-full"
      />
      <div v-if="!isEffectivelyCollapsed" class="flex flex-col">
        <span class="text-[15px] text-base font-bold text-white tracking-[1px]">MITRA KARGO</span>
        <span class="text-[12px] text-slate-300/80 tracking-[1px] uppercase font-semibold leading-none mt-0.5">NUSANTARA</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav 
      class="py-4 flex-1 overflow-y-auto transition-all duration-300"
      :class="isEffectivelyCollapsed ? 'px-2' : 'px-3'"
    >
      <div class="space-y-2.5">
        <template v-for="item in menus" :key="item.id || item.name">
          <!-- Item with children (dropdown) -->
          <div v-if="item.children && item.children.length > 0">
            <button
              :class="[
                isParentActive(item) ? 'nav-item-active' : 'nav-item',
                isEffectivelyCollapsed ? 'justify-center px-3' : '',
                'w-full'
              ]"
              @click="toggleDropdown(item.name)"
            >
              <UiIcon 
                :name="item.icon || 'IconFolder'" 
                type="tabler" 
                size="md" 
                class="shrink-0"
              />
              <span v-if="!isEffectivelyCollapsed" class="truncate flex-1 text-left">{{ item.name }}</span>
              <UiIcon 
                v-if="!isEffectivelyCollapsed"
                name="IconChevronDown" 
                type="tabler" 
                size="sm"
                :class="[
                  'transition-transform duration-200',
                  isDropdownOpen(item.name) ? 'rotate-180' : ''
                ]"
              />
            </button>
            
            <!-- Dropdown children -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-96"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-96"
              leave-to-class="opacity-0 max-h-0"
            >
              <div 
                v-if="isDropdownOpen(item.name) && !isEffectivelyCollapsed" 
                class="mt-1 ml-4 pl-2 border-l-2 space-y-2 overflow-hidden dropdown-container"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.id || child.name"
                  :to="child.link || child.path || '#'"
                  :class="isActive(child.link || child.path) ? 'nav-sub-item-active' : 'nav-sub-item'"
                  @click="closeMobile"
                >
                  <UiIcon 
                    :name="child.icon || 'IconPoint'" 
                    type="tabler" 
                    size="sm"
                    class="shrink-0"
                  />
                  <span class="truncate">{{ child.name }}</span>
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <!-- Single item (no children) -->
          <NuxtLink
            v-else
            :to="item.link || item.path || '#'"
            :class="[
              isActive(item.link || item.path) ? 'nav-item-active' : 'nav-item',
              isEffectivelyCollapsed ? 'justify-center px-3' : '',
            ]"
            @click="closeMobile"
          >
            <UiIcon 
              :name="item.icon || 'IconCircle'" 
              type="tabler" 
              size="md"
              class="shrink-0"
            />
            <span v-if="!isEffectivelyCollapsed" class="truncate">{{ item.name }}</span>
          </NuxtLink>
        </template>
      </div>
    </nav>

    <!-- User Profile Section -->
    <div class="p-4 shrink-0">
      <div 
        class="user-profile-box rounded-xl p-3"
        :class="{ 'p-2': isEffectivelyCollapsed }"
      >
        <div class="flex items-center gap-3" :class="{ 'justify-center': isEffectivelyCollapsed }">
          <!-- Avatar -->
          <UiAvatar :name="authStore.user?.name || 'User'" size="md" />
          
          <!-- User Info (hidden when collapsed) -->
          <div v-if="!isEffectivelyCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">
              {{ authStore.user?.name || 'User' }}
            </p>
            <p class="text-xs text-slate-300/80 truncate">
              {{ typeof authStore.user?.role === 'object' ? authStore.user?.role?.name : authStore.user?.role || 'Guest' }}
            </p>
          </div>
          
          <!-- Logout Button -->
          <button
            v-if="!isEffectivelyCollapsed"
            class="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            title="Logout"
            @click="handleLogout"
          >
            <UiIcon name="IconPower" type="tabler" size="md" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-custom {
  background-color: #002444 !important;
}

.dropdown-container {
  border-left-color: rgba(255, 255, 255, 0.15) !important;
}

/* Expanded state navigation items styling */
aside:not(.sidebar-collapsed) :deep(.nav-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px !important;
  color: #dddddd !important;
  border-radius: 10px !important;
  border-left: none !important;
  margin: 4px 0 !important;
  transition: all 0.2s ease;
}
aside:not(.sidebar-collapsed) :deep(.nav-item:hover) {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

/* Active navigation item when expanded */
aside:not(.sidebar-collapsed) :deep(.nav-item-active) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px !important;
  background-color: #006ee6 !important; /* Vibrant brand blue matching the user image */
  color: #ffffff !important;
  font-weight: 600;
  border-left: none !important;
  border-radius: 10px !important;
  margin: 4px 0 !important;
  box-shadow: 0 4px 12px rgba(0, 110, 230, 0.25);
  transition: all 0.2s ease;
}
aside:not(.sidebar-collapsed) :deep(.nav-item-active:hover) {
  background-color: #005ec5 !important;
  box-shadow: 0 4px 14px rgba(0, 110, 230, 0.35);
}


/* Collapsed state navigation items styling */
aside.sidebar-collapsed :deep(.nav-item) {
  color: #dddddd !important;
  display: flex;
  justify-content: center !important;
  align-items: center !important;
  width: 44px !important;
  height: 44px !important;
  padding: 0px !important;
  margin: 6px auto !important;
  border-radius: 10px !important;
  border-left: none !important;
  transition: all 0.2s ease;
}
aside.sidebar-collapsed :deep(.nav-item:hover) {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}
aside.sidebar-collapsed :deep(.nav-item-active) {
  color: #ffffff !important;
  background-color: #006ee6 !important;
  display: flex;
  justify-content: center !important;
  align-items: center !important;
  width: 44px !important;
  height: 44px !important;
  padding: 0px !important;
  margin: 6px auto !important;
  border-radius: 10px !important;
  border-left: none !important;
  box-shadow: 0 4px 12px rgba(0, 110, 230, 0.25);
  transition: all 0.2s ease;
}
aside.sidebar-collapsed :deep(.nav-item-active:hover) {
  background-color: #005ec5 !important;
}

/* Sub-navigation items styling */
aside:not(.sidebar-collapsed) :deep(.nav-sub-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 16px !important;
  color: #bebebe !important;
  border-radius: 8px !important;
  margin: 4px 0 !important;
  transition: all 0.2s ease;
}
aside:not(.sidebar-collapsed) :deep(.nav-sub-item:hover) {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}
aside:not(.sidebar-collapsed) :deep(.nav-sub-item-active) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 16px !important;
  color: #ffffff !important;
  font-weight: 600;
  background-color: #006ee6 !important;
  border-radius: 8px !important;
  margin: 4px 0 !important;
  box-shadow: 0 2px 8px rgba(0, 110, 230, 0.2);
}

/* Profile section container */
.user-profile-box {
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Custom scrollbar for sidebar navigation */
nav::-webkit-scrollbar {
  width: 12px;
}
nav::-webkit-scrollbar-track {
  background: transparent !important;
}
nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 9999px !important;
}
nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}
</style>


<script setup lang="ts">
export interface DropdownItem {
  label: string;
  value?: string;
  icon?: string;
  divider?: boolean;
  danger?: boolean;
  color?: string;
  emit?: string;
  to?: string;
  href?: string;
  target?: string;
  openInNewTab?: boolean;
  [key: string]: any;
}

interface Props {
  items: DropdownItem[];
  align?: "left" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  align: "right",
});

const emit = defineEmits<{
  select: [item: DropdownItem];
}>();

const getItemHref = (item: DropdownItem) => {
  if (item.href) return item.href;
  if (item.to) {
    if (typeof item.to === 'string') return item.to;
    if (typeof item.to === 'object' && (item.to as any).path) {
      let url = (item.to as any).path;
      if ((item.to as any).query) {
        const params = new URLSearchParams((item.to as any).query).toString();
        if (params) url += '?' + params;
      }
      return url;
    }
  }
  return undefined;
};

const getItemComponent = (item: DropdownItem) => {
  if (getItemHref(item)) return 'a';
  return 'button';
};

const getItemTarget = (item: DropdownItem) => {
  if (item.target) return item.target;
  if (item.openInNewTab) return '_blank';
  return undefined;
};

const handleItemClick = (item: DropdownItem, event: MouseEvent) => {
  if (item.divider) return;
  const href = getItemHref(item);
  const target = getItemTarget(item);

  if (href && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !target) {
    event.preventDefault();
  }

  selectItem(item);
};

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement>();
const menuRef = ref<HTMLElement>();
const menuStyle = ref<Record<string, string>>({});

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const selectItem = (item: DropdownItem) => {
  if (item.divider) return;
  emit("select", item);
  close();
};

const isPositioned = ref(false);

const updatePosition = () => {
  if (!dropdownRef.value || !isOpen.value) return;
  
  const rect = dropdownRef.value.getBoundingClientRect();
  const menuWidth = menuRef.value ? menuRef.value.offsetWidth : 180;
  
  // Calculate left alignment
  let left = rect.left;
  if (props.align === "right") {
    left = rect.right - menuWidth;
  }
  
  // Boundary checks
  if (left < 0) left = 8;
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 8;
  }
  
  const spaceBelow = window.innerHeight - rect.bottom;
  const menuHeight = menuRef.value ? menuRef.value.offsetHeight : 100;
  const renderAbove = spaceBelow < menuHeight + 10 && rect.top > menuHeight + 10;
  
  let top = rect.bottom + 8;
  if (renderAbove) {
    top = rect.top - menuHeight - 8;
  }
  
  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '9999',
  };
};

const handleScroll = () => {
  close();
};

watch(isOpen, async (val) => {
  if (val) {
    isPositioned.value = false;
    await nextTick();
    // First pass: menu is rendered but invisible, measure real size
    updatePosition();
    isPositioned.value = true;
    await nextTick();
    // Second pass: re-measure with actual rendered dimensions
    updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
  } else {
    isPositioned.value = false;
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', updatePosition);
  }
});

// Close on click outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    const clickedInsideTrigger = dropdownRef.value && dropdownRef.value.contains(target);
    const clickedInsideMenu = menuRef.value && menuRef.value.contains(target);
    
    if (!clickedInsideTrigger && !clickedInsideMenu) {
      close();
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', updatePosition);
  });
});
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <div @click="toggle">
      <slot name="trigger" />
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="{ ...menuStyle, visibility: isPositioned ? 'visible' : 'hidden' }"
          class="min-w-[180px] py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <template v-for="(item, index) in items" :key="index">
            <div v-if="item.divider" class="my-2 border-t border-slate-200 dark:border-slate-700" />
            <component
              :is="getItemComponent(item)"
              v-else
              :href="getItemHref(item)"
              :target="getItemTarget(item)"
              :class="[
                'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
              ]"
              @click="(e) => handleItemClick(item, e)"
            >
              <slot name="item" :item="item">
                {{ item.label }}
              </slot>
            </component>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

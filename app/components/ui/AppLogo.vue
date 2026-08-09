<template>
  <div :class="containerClass">
    <img v-if="image" :src="image" alt="App Logo" :style="logoStyle" class="object-contain max-w-full" onerror="this.style.display='none'" />
    <template v-else>
      <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/30 text-white shrink-0">
        <UiIcon name="mdi-school" size="24" />
      </div>
      <div v-if="!collapsed" class="flex flex-col min-w-0">
        <span class="text-[14px] font-bold text-slate-900 dark:text-white tracking-wider leading-tight">SISTEM INFORMASI</span>
        <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider leading-none mt-0.5">MANAJEMEN SEKOLAH</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  position?: 'default' | 'absolute-top-left'
  collapsed?: boolean
  mode?: 'light' | 'dark' | 'auto'
  image?: string
  logoSize?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  position: 'default',
  collapsed: false,
  mode: 'auto',
  image: '',
  logoSize: 40
})

const textClass = computed(() => {
  if (props.mode === 'dark') return 'text-white'
  if (props.mode === 'light') return 'text-slate-900'
  return 'text-slate-900 dark:text-white'
})

const logoStyle = computed(() => {
  const size = props.logoSize
  if (!isNaN(Number(size))) {
    return { height: `${size}px` }
  }
  return { height: size as string }
})

const containerClass = computed(() => {
  const baseClass = 'flex items-center gap-3'
  
  if (props.position === 'absolute-top-left') {
    return `${baseClass} absolute top-6 left-6 lg:top-8 lg:left-8 z-20`
  }
  
  return baseClass
})
</script>

<template>
  <div :class="containerClass">
    <img
      :src="image || '/images/app-logo.png'"
      alt="App Logo"
      :style="logoStyle"
      class="object-contain max-w-full shrink-0"
    />
    <div v-if="!collapsed" class="flex flex-col min-w-0">
      <span :class="['font-bold text-slate-900 dark:text-white', titleTextClass]">SISTEM INFORMASI</span>
      <span :class="['font-medium text-slate-900 dark:text-slate-400', subtitleTextClass]">PRESENSI SEKOLAH</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  image: '/images/app-logo.png',
  logoSize: 40
})

const textClass = computed(() => {
  if (props.mode === 'dark') return 'text-white'
  if (props.mode === 'light') return 'text-slate-900'
  return 'text-slate-900 dark:text-white'
})

const logoStyle = computed(() => {
  const size = props.logoSize || 40
  if (!isNaN(Number(size))) {
    return { height: `${size}px`, width: 'auto' }
  }
  return { height: size as string }
})

const titleTextClass = computed(() => {
  const size = Number(props.logoSize) || 40
  if (size >= 64) return 'text-[20px] tracking-wider leading-tight'
  if (size >= 48) return 'text-[16px] tracking-wider leading-tight'
  return 'text-[14px] tracking-wider leading-tight'
})

const subtitleTextClass = computed(() => {
  const size = Number(props.logoSize) || 40
  if (size >= 64) return 'text-[14px] tracking-wider leading-none mt-1'
  if (size >= 48) return 'text-[12px] tracking-wider leading-none mt-0.5'
  return 'text-[11px] tracking-wider leading-none mt-0.5'
})

const containerClass = computed(() => {
  const baseClass = 'flex items-center gap-3'
  
  if (props.position === 'absolute-top-left') {
    return `${baseClass} absolute top-6 left-6 lg:top-8 lg:left-8 z-20`
  }
  
  return baseClass
})
</script>

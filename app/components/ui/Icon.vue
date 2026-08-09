<template>
  <i 
    v-if="type === 'mdi'"
    :class="['mdi', name, sizeClass]"
    :style="customStyle"
  />
  <component
    v-else-if="type === 'tabler' && tablerComponent"
    :is="tablerComponent"
    :size="iconSize"
    :style="customStyle"
    :stroke-width="strokeWidth"
  />
  <span v-else :class="sizeClass" :style="customStyle">
    {{ name }}
  </span>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef, watch } from 'vue'
import * as TablerIcons from '@tabler/icons-vue'

interface Props {
  name: string           // e.g., "mdi-home" or "IconHome" for tabler
  type?: 'mdi' | 'tabler'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string | number
  color?: string
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'mdi',
  size: 'md',
  strokeWidth: 2,
  color: ''
})

const predefinedSizesMDI: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
}

const predefinedSizesTabler: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
}

// Size mapping for MDI icons (font-based)
const sizeClass = computed(() => {
  if (typeof props.size === 'string' && predefinedSizesMDI[props.size]) {
    return predefinedSizesMDI[props.size]
  }
  return ''
})

// Size mapping for Tabler icons (SVG-based, uses pixels)
const iconSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  if (typeof props.size === 'string') {
    if (predefinedSizesTabler[props.size]) return predefinedSizesTabler[props.size]
    const parsed = parseInt(props.size)
    if (!isNaN(parsed)) return parsed
  }
  return 20
})

// Style for color and custom font size
const customStyle = computed(() => {
  const style: any = {}
  
  if (props.color) {
    // Semantic color mapping
    const colorMap: Record<string, string> = {
      primary: '#3b82f6',
      secondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      danger: '#ef4444',
      info: '#06b6d4',
      white: '#ffffff',
      black: '#000000',
    }
    style.color = colorMap[props.color] || props.color
  }

  // Custom font size for MDI / text-based icons
  if (props.type !== 'tabler' && (typeof props.size === 'number' || (typeof props.size === 'string' && !predefinedSizesMDI[props.size]))) {
    if (typeof props.size === 'number') {
      style.fontSize = `${props.size}px`
    } else if (typeof props.size === 'string') {
      style.fontSize = isNaN(Number(props.size)) ? props.size : `${props.size}px`
    }
  }
  
  return style
})

// Normalize icon name from database format to Tabler format
// e.g., "ChartDotsIcon" -> "IconChartDots", "PointIcon" -> "IconPoint"
const normalizeIconName = (name: string): string => {
  if (!name) return ''
  
  // If already starts with "Icon", return as-is
  if (name.startsWith('Icon')) {
    return name
  }
  
  // If ends with "Icon", convert: "ChartDotsIcon" -> "IconChartDots"
  if (name.endsWith('Icon')) {
    const baseName = name.slice(0, -4) // Remove "Icon" suffix
    return 'Icon' + baseName
  }
  
  // Otherwise, just prepend "Icon": "home" -> "IconHome"
  return 'Icon' + name.charAt(0).toUpperCase() + name.slice(1)
}

// Tabler icon component 
const tablerComponent = computed(() => {
  if (props.type !== 'tabler') return null
  
  const icons = TablerIcons as Record<string, any>
  const normalizedName = normalizeIconName(props.name)
  return icons[normalizedName] || icons[props.name] || null
})
</script>

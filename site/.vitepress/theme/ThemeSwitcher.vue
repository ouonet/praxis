<template>
  <div class="theme-switcher">
    <button
      v-for="mode in modes"
      :key="mode"
      :class="['theme-btn', { active: currentMode === mode }]"
      @click="setTheme(mode)"
      :title="`Theme: ${mode}`"
      :aria-label="`Set theme to ${mode}`"
    >
      <span v-if="mode === 'light'" class="icon">☀️</span>
      <span v-else-if="mode === 'auto'" class="icon">🔄</span>
      <span v-else class="icon">🌙</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const modes: Array<'light' | 'auto' | 'dark'> = ['light', 'auto', 'dark']
const currentMode = ref<'light' | 'auto' | 'dark'>('auto')

onMounted(() => {
  const stored = localStorage.getItem('theme-mode') as 'light' | 'auto' | 'dark' | null
  if (stored && modes.includes(stored)) {
    currentMode.value = stored
    applyTheme(stored)
  }
})

const setTheme = (mode: 'light' | 'auto' | 'dark') => {
  currentMode.value = mode
  localStorage.setItem('theme-mode', mode)
  applyTheme(mode)
}

const applyTheme = (mode: 'light' | 'auto' | 'dark') => {
  const html = document.documentElement
  if (mode === 'auto') {
    html.classList.remove('light', 'dark')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
  } else {
    html.classList.remove('light', 'dark')
    html.classList.add(mode)
    isDark.value = mode === 'dark'
  }
}
</script>

<style scoped>
.theme-switcher {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 2px;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  margin: 0;
}

.theme-btn:hover {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
}

.theme-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.icon {
  font-size: 14px;
  display: block;
  line-height: 1;
}
</style>

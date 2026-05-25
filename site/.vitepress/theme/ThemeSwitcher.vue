<template>
  <div class="theme-switcher">
    <button
      v-for="mode in modes"
      :key="mode"
      :class="['theme-btn', { active: currentMode === mode }]"
      @click="setTheme(mode)"
      :title="`${mode.toUpperCase()} mode`"
    >
      <span v-if="mode === 'light'">☀️</span>
      <span v-else-if="mode === 'auto'">🔄</span>
      <span v-else>🌙</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const modes = ['light', 'auto', 'dark']
const currentMode = ref<'light' | 'auto' | 'dark'>('auto')

onMounted(() => {
  const stored = localStorage.getItem('theme-mode') as 'light' | 'auto' | 'dark' | null
  if (stored) {
    currentMode.value = stored
    applyTheme(stored)
  } else {
    currentMode.value = 'auto'
    applyTheme('auto')
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
  display: flex;
  gap: 4px;
  align-items: center;
}

.theme-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.theme-btn:hover {
  background: var(--vp-c-bg-mute);
}

.theme-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.theme-btn span {
  display: block;
}
</style>

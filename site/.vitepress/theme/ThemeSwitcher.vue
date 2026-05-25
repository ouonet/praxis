<template>
  <div class="theme-toggle">
    <button
      class="toggle-appearance"
      @click="toggleAppearance"
      :title="`Theme: ${currentMode}`"
      :aria-label="`Toggle appearance: currently ${currentMode}`"
    >
      <div class="toggle-track">
        <div class="toggle-thumb" :data-mode="currentMode">
          <span v-if="currentMode === 'light'" class="icon">☀️</span>
          <span v-else-if="currentMode === 'auto'" class="icon">🔄</span>
          <span v-else class="icon">🌙</span>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const modes: Array<'light' | 'auto' | 'dark'> = ['light', 'auto', 'dark']
let currentModeIndex = 0
const currentMode = ref<'light' | 'auto' | 'dark'>('auto')

onMounted(() => {
  const stored = localStorage.getItem('theme-mode') as 'light' | 'auto' | 'dark' | null
  if (stored) {
    currentMode.value = stored
    currentModeIndex = modes.indexOf(stored)
    applyTheme(stored)
  }
})

const toggleAppearance = () => {
  currentModeIndex = (currentModeIndex + 1) % modes.length
  const newMode = modes[currentModeIndex]
  currentMode.value = newMode
  localStorage.setItem('theme-mode', newMode)
  applyTheme(newMode)
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
.theme-toggle {
  display: inline-flex;
  align-items: center;
}

.toggle-appearance {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 24px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
  padding: 0;
  margin: 0;
}

.toggle-appearance:hover {
  border-color: var(--vp-c-brand);
}

.toggle-track {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.toggle-thumb {
  position: absolute;
  width: 18px;
  height: 18px;
  background: var(--vp-c-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s ease;
  left: 2px;
}

.toggle-thumb[data-mode='light'] {
  left: 2px;
}

.toggle-thumb[data-mode='auto'] {
  left: calc(50% - 9px);
}

.toggle-thumb[data-mode='dark'] {
  left: calc(100% - 20px);
}

.icon {
  font-size: 12px;
  display: block;
  line-height: 1;
}
</style>

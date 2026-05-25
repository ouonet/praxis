import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-after': () => h(ThemeSwitcher),
  }),
}

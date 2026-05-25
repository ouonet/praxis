import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Praxis',
  description: 'A discipline framework for AI coding agents.',
  srcDir: '.',
  rewrites: { 'en/:rest*': ':rest*' },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Skills', link: '/skills/' },
          { text: 'GitHub', link: 'https://github.com/ouonet/praxis' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'How It Works', link: '/guide/how-it-works' },
                { text: 'Philosophy', link: '/guide/philosophy' },
              ],
            },
          ],
          '/skills/': [
            {
              text: 'Skills',
              items: [
                { text: 'Overview', link: '/skills/' },
                { text: 'discover', link: '/skills/discover' },
                { text: 'design', link: '/skills/design' },
                { text: 'plan', link: '/skills/plan' },
                { text: 'tdd', link: '/skills/tdd' },
                { text: 'debug', link: '/skills/debug' },
                { text: 'review', link: '/skills/review' },
                { text: 'ship', link: '/skills/ship' },
                { text: 'release', link: '/skills/release' },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: '中文',
      lang: 'zh',
      link: '/zh/',
    },
  },

  themeConfig: {
    logo: 'https://raw.githubusercontent.com/ouonet/praxis/main/assets/logo-mark.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ouonet/praxis' },
    ],
    footer: {
      message: 'Released under the MIT License.',
    },
  },
})

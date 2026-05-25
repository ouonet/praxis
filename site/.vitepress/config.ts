import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Praxis',
  description: 'A discipline framework for AI coding agents.',
  base: '/praxis/',
  srcDir: '.',
  rewrites: {
    'en/:rest*': ':rest*',
    'zh/:rest*': 'zh/:rest*',
  },

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
                { text: 'Best Practices', link: '/guide/best-practices' },
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
                { text: 'worktree', link: '/skills/worktree' },
                { text: 'subagents', link: '/skills/subagents' },
                { text: 'ship', link: '/skills/ship' },
                { text: 'release', link: '/skills/release' },
                { text: 'onboard', link: '/skills/onboard' },
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
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: '技能', link: '/zh/skills/' },
          { text: 'GitHub', link: 'https://github.com/ouonet/praxis' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '开始使用', link: '/zh/guide/getting-started' },
                { text: '工作原理', link: '/zh/guide/how-it-works' },
                { text: '哲学', link: '/zh/guide/philosophy' },
                { text: '最佳实践', link: '/zh/guide/best-practices' },
              ],
            },
          ],
          '/zh/skills/': [
            {
              text: '技能',
              items: [
                { text: '概览', link: '/zh/skills/' },
                { text: 'discover', link: '/zh/skills/discover' },
                { text: 'design', link: '/zh/skills/design' },
                { text: 'plan', link: '/zh/skills/plan' },
                { text: 'tdd', link: '/zh/skills/tdd' },
                { text: 'debug', link: '/zh/skills/debug' },
                { text: 'review', link: '/zh/skills/review' },
                { text: 'worktree', link: '/zh/skills/worktree' },
                { text: 'subagents', link: '/zh/skills/subagents' },
                { text: 'ship', link: '/zh/skills/ship' },
                { text: 'release', link: '/zh/skills/release' },
                { text: 'onboard', link: '/zh/skills/onboard' },
              ],
            },
          ],
        },
      },
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

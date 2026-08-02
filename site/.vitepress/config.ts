import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Praxis',
  description: 'A discipline framework for AI coding agents.',
  base: '/praxis/',
  srcDir: '.',
  rewrites: {
    'en/:rest*': ':rest*',
    'zh/:rest*': 'zh/:rest*',
    'ja/:rest*': 'ja/:rest*',
    'ko/:rest*': 'ko/:rest*',
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
                { text: 'design', link: '/skills/design' },
                { text: 'plan', link: '/skills/plan' },
                { text: 'tdd', link: '/skills/tdd' },
                { text: 'debug', link: '/skills/debug' },
                { text: 'review', link: '/skills/review' },
                { text: 'worktree', link: '/skills/worktree' },
                { text: 'subagents', link: '/skills/subagents' },
                { text: 'ship', link: '/skills/ship' },
                { text: 'archive', link: '/skills/archive' },
                { text: 'release', link: '/skills/release' },
                { text: 'onboard', link: '/skills/onboard' },
                { text: 'discover', link: '/skills/discover' },
              ],
            },
            {
              text: 'References',
              items: [
                { text: 'Quality Standard', link: '/skills/quality' },
                { text: 'Spec Reviewers', link: '/skills/reviewers' },
                { text: 'Multi-Module Protocol', link: '/skills/multi-module' },
              ],
            },
          ],
        },
      },
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
      themeConfig: {
        nav: [
          { text: 'ガイド', link: '/ja/guide/getting-started' },
          { text: 'スキル', link: '/ja/skills/' },
          { text: 'GitHub', link: 'https://github.com/ouonet/praxis' },
        ],
        sidebar: {
          '/ja/guide/': [
            {
              text: 'ガイド',
              items: [
                { text: 'はじめる', link: '/ja/guide/getting-started' },
                { text: '仕組み', link: '/ja/guide/how-it-works' },
                { text: '哲学', link: '/ja/guide/philosophy' },
                { text: 'ベストプラクティス', link: '/ja/guide/best-practices' },
              ],
            },
          ],
          '/ja/skills/': [
            {
              text: 'スキル',
              items: [
                { text: '概要', link: '/ja/skills/' },
                { text: 'design', link: '/ja/skills/design' },
                { text: 'plan', link: '/ja/skills/plan' },
                { text: 'tdd', link: '/ja/skills/tdd' },
                { text: 'debug', link: '/ja/skills/debug' },
                { text: 'review', link: '/ja/skills/review' },
                { text: 'worktree', link: '/ja/skills/worktree' },
                { text: 'subagents', link: '/ja/skills/subagents' },
                { text: 'ship', link: '/ja/skills/ship' },
                { text: 'archive', link: '/ja/skills/archive' },
                { text: 'release', link: '/ja/skills/release' },
                { text: 'onboard', link: '/ja/skills/onboard' },
                { text: 'discover', link: '/ja/skills/discover' },
              ],
            },
            {
              text: 'リファレンス',
              items: [
                { text: '品質標準', link: '/ja/skills/quality' },
                { text: '仕様レビュアー', link: '/ja/skills/reviewers' },
                { text: 'マルチモジュールプロトコル', link: '/ja/skills/multi-module' },
              ],
            },
          ],
        },
      },
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      link: '/ko/',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/getting-started' },
          { text: '스킬', link: '/ko/skills/' },
          { text: 'GitHub', link: 'https://github.com/ouonet/praxis' },
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '가이드',
              items: [
                { text: '시작하기', link: '/ko/guide/getting-started' },
                { text: '작동 방식', link: '/ko/guide/how-it-works' },
                { text: '철학', link: '/ko/guide/philosophy' },
                { text: '모범 사례', link: '/ko/guide/best-practices' },
              ],
            },
          ],
          '/ko/skills/': [
            {
              text: '스킬',
              items: [
                { text: '개요', link: '/ko/skills/' },
                { text: 'design', link: '/ko/skills/design' },
                { text: 'plan', link: '/ko/skills/plan' },
                { text: 'tdd', link: '/ko/skills/tdd' },
                { text: 'debug', link: '/ko/skills/debug' },
                { text: 'review', link: '/ko/skills/review' },
                { text: 'worktree', link: '/ko/skills/worktree' },
                { text: 'subagents', link: '/ko/skills/subagents' },
                { text: 'ship', link: '/ko/skills/ship' },
                { text: 'archive', link: '/ko/skills/archive' },
                { text: 'release', link: '/ko/skills/release' },
                { text: 'onboard', link: '/ko/skills/onboard' },
                { text: 'discover', link: '/ko/skills/discover' },
              ],
            },
            {
              text: '참조',
              items: [
                { text: '품질 표준', link: '/ko/skills/quality' },
                { text: '명세 리뷰어', link: '/ko/skills/reviewers' },
                { text: '멀티 모듈 프로토콜', link: '/ko/skills/multi-module' },
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
                { text: 'design', link: '/zh/skills/design' },
                { text: 'plan', link: '/zh/skills/plan' },
                { text: 'tdd', link: '/zh/skills/tdd' },
                { text: 'debug', link: '/zh/skills/debug' },
                { text: 'review', link: '/zh/skills/review' },
                { text: 'worktree', link: '/zh/skills/worktree' },
                { text: 'subagents', link: '/zh/skills/subagents' },
                { text: 'ship', link: '/zh/skills/ship' },
                { text: 'archive', link: '/zh/skills/archive' },
                { text: 'release', link: '/zh/skills/release' },
                { text: 'onboard', link: '/zh/skills/onboard' },
                { text: 'discover', link: '/zh/skills/discover' },
              ],
            },
            {
              text: '参考规范',
              items: [
                { text: '质量标准', link: '/zh/skills/quality' },
                { text: '规范评审员', link: '/zh/skills/reviewers' },
                { text: '多模块协议', link: '/zh/skills/multi-module' },
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

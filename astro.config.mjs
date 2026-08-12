// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://unhoyeo.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      // 긴 줄은 접지 않고 가로 스크롤한다 — 들여쓰기 정렬이 코드에서는 정보다
      wrap: false,
    },
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { markdownConfig } from './src/markdown.config.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://unhoyeo.github.io',
  integrations: [
    mdx(),
    // 글 쓰는 화면은 검색엔진에 올릴 이유가 없다
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
  markdown: markdownConfig,
});

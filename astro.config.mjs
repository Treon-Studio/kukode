import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: process.argv.includes('dev')
    ? undefined
    : cloudflare({
        imageService: 'passthrough',
      }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['@lexingtonthemes/seo'],
    },
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: 'min-light',
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  site: 'https://kukode.treonstudio.com',
  integrations: [sitemap(), mdx()],
});

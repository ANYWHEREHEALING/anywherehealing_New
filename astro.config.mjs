import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  output: "static", // Para Shopify
  adapter: netlify(),
  experimental: {
    session: true // Esto soluciona el error
  }
});
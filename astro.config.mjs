import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  output: "static", // Para Shopify
  integrations: [react()],
  adapter: netlify(),

});
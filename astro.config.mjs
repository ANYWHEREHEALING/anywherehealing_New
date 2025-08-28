import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'server',          // or 'server' if you use sessions/SSR
  adapter: netlify(),
  // remove any `experimental` block (no longer valid)
})

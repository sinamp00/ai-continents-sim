import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` is set for GitHub Pages: the site is served from
// https://<user>.github.io/ai-continents-sim/
export default defineConfig({
  base: '/ai-continents-sim/',
  plugins: [react(), tailwindcss()],
})

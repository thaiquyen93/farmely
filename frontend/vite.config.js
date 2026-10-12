import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { siteVisitsApiPlugin } from './server/siteVisitsApiPlugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), siteVisitsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl-worker.mjs'],
  },
  server: {
    port: 3000,
    watch: {
      ignored: ['**/public/docs/**', '**/docs/**'],
    },
    proxy: {
      '/api/v1/payments': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

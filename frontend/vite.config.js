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
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  optimizeDeps: {
    // Phải là IMPORT SPECIFIER của package, không phải tên file.
    // 'maplibre-gl-worker.mjs' không khớp specifier nào nên vô tác dụng, và
    // dep optimizer làm hỏng web worker của maplibre -> source GeoJSON không
    // bao giờ parse xong -> toàn bộ layer thửa đất không render (ảnh vệ tinh
    // raster và marker HTML vẫn hiện, nên rất dễ tưởng là lỗi CSS).
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 3000,
    watch: {
      ignored: ['**/public/docs/**', '**/docs/**'],
    },
    proxy: {
      '/api/sensors': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
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

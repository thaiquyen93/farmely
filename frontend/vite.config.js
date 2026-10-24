import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { siteVisitsApiPlugin } from './server/siteVisitsApiPlugin.js'

const serviceTarget = (serviceName, port) =>
  `http://${process.env.DOCKER_ENV === 'true' ? serviceName : 'localhost'}:${port}`

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
        target: serviceTarget('monitoring-service', 8088),
        changeOrigin: true,
      },
      '/api/services': { target: serviceTarget('cultivation-service', 8086), changeOrigin: true },
      '/api/tasks': { target: serviceTarget('cultivation-service', 8086), changeOrigin: true },
      '/api/issues': { target: serviceTarget('cultivation-service', 8086), changeOrigin: true },
      '/api/harvest': { target: serviceTarget('cultivation-service', 8086), changeOrigin: true },
      '/api/plots': { target: serviceTarget('farm-service', 8082), changeOrigin: true },
      '/api/lands': { target: serviceTarget('farm-service', 8082), changeOrigin: true },
      '/api/crops': { target: serviceTarget('knowledge-service', 8083), changeOrigin: true },
      '/api/varieties': { target: serviceTarget('knowledge-service', 8083), changeOrigin: true },
      '/api/templates': { target: serviceTarget('knowledge-service', 8083), changeOrigin: true },
      '/api/knowledge-documents': { target: serviceTarget('knowledge-service', 8083), changeOrigin: true },
      '/api/contracts': { target: serviceTarget('rental-service', 8084), changeOrigin: true },
      '/api/reservations': { target: serviceTarget('rental-service', 8084), changeOrigin: true },
      '/api/cancellations': { target: serviceTarget('rental-service', 8084), changeOrigin: true },
      '/api/rentals': { target: serviceTarget('rental-service', 8084), changeOrigin: true },
      '/api/users': { target: serviceTarget('identity-service', 8081), changeOrigin: true },
      '/api/v1/payments': {
        target: serviceTarget('payment-service', 8085),
        changeOrigin: true,
      },
      '/api': {
        target: serviceTarget('api-gateway', 8080),
        changeOrigin: true,
      },
    },
  },
})

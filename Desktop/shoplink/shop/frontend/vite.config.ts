import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8080,
    host: '0.0.0.0',
    allowedHosts: ['shoplink-frontend-xtp7.onrender.com'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})


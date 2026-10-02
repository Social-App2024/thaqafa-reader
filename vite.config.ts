import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 3000,
    allowedHosts: ['reader.thaqafa.net'],
    proxy: {
      '/api': {
        target: 'http://localhost:9092',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/storage': {
        target: 'http://127.0.0.1:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage/, ''),
      },
      '/frontend': {
        target: 'http://localhost:5173',
        rewrite: (path) => path.replace(/^\/frontend/, ''),
      },
    },
  },
})

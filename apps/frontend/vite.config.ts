import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/settings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/questions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/transcripts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

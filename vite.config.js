import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = { '/api': { target: 'http://localhost:3001', changeOrigin: false } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: api },
  preview: { port: 4173, proxy: api },
  build: { sourcemap: false, chunkSizeWarningLimit: 600 }
});

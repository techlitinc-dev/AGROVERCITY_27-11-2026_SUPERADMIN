import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Serve the shared brand assets (app_logo.png, company_logo.png) from the
  // repo-root assets folder — referenced in-app as /app_logo.png etc.
  publicDir: '../assets',
  server: {
    host: '0.0.0.0',
    port: 5273,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8010', changeOrigin: true },
    },
  },
  build: { outDir: 'dist' },
});

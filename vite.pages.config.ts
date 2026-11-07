import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The same client UI can be hosted as static files, without the Sites Worker.
export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/framecut/',
  plugins: [react()],
  build: { outDir: 'dist-pages' },
  preview: { host: '127.0.0.1', port: 4173 },
});

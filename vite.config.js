import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: Number(process.env.PORT) || 5173, open: false },
  build: { chunkSizeWarningLimit: 2000 },
});

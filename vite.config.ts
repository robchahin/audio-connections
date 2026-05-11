import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Repo is published at https://frewsxcv.github.io/audio-connections/,
  // so built asset URLs need that prefix. Local dev keeps '/'.
  base: process.env.GITHUB_ACTIONS ? '/audio-connections/' : '/',
  server: { port: 5173 },
});

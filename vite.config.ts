import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { checkPuzzles } from './vite-plugins/check-puzzles';

// Opt-in HTTPS for testing PWA install + DOM secure-context APIs from a
// phone on the LAN. Vite 5 dropped the --https CLI flag, so we toggle the
// basic-ssl plugin via env var (`VITE_HTTPS=1 vite --host`). Cert is
// self-signed — browsers will warn; tap through.
const httpsEnabled = process.env.VITE_HTTPS === '1';

export default defineConfig({
  plugins: [react(), checkPuzzles(), ...(httpsEnabled ? [basicSsl()] : [])],
  // Repo is published at https://frewsxcv.github.io/audio-connections/,
  // so built asset URLs need that prefix. Local dev keeps '/'.
  base: process.env.GITHUB_ACTIONS ? '/audio-connections/' : '/',
  server: { port: 5173 },
});

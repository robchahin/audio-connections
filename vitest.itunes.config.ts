import { defineConfig } from 'vitest/config';

// Dedicated config for the network-touching iTunes ID check. Lives apart from
// the default unit config so `npm run test:unit` stays offline and fast.
// `npm run test:itunes` checks changed puzzle files; `npm run test:itunes:all`
// deliberately sweeps the full archive for catalog drift.
export default defineConfig({
  test: {
    include: ['src/**/*.itunes.test.ts'],
    environment: 'node',
  },
});

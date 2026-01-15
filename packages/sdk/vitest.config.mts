import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/__tests__/**',
        'src/**/index.ts',
        'src/types/**',
        'src/styles/**',
        'src/components/**',
        'src/ui/**',
        'src/contexts/**',
        'src/hooks/**',
        'src/services/**',
        'src/providers/**',
        'src/wallet-adapters/**',
        'src/Aurum.ts',
        'src/AurumCore.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
  },
});

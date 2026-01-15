import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/react/**',
        'src/**/*.d.ts',
        'src/**/index.ts', // barrel re-exports
        'src/**/types.ts', // type-only files
      ],
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    {
      name: 'svg-text-loader',
      transform(code, id) {
        if (id.endsWith('.svg')) {
          const svgContent = fs.readFileSync(id, 'utf-8');
          return {
            code: `export default ${JSON.stringify(svgContent)};`,
            map: null,
          };
        }
      },
    },
  ],
});

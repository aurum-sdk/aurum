import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react/jsx-runtime', '@aurum-sdk/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.alias = {
      '@src': path.resolve(__dirname, 'src'),
    };
  },
});

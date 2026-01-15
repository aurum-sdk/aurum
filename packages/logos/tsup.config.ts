import { defineConfig } from 'tsup';

export default defineConfig([
  // Core build (no React dependency)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    treeshake: true,
    clean: true,
    external: ['@aurum-sdk/types'],
    loader: {
      '.svg': 'text',
    },
  },
  // React build
  {
    entry: ['src/react/index.ts'],
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    treeshake: true,
    external: ['react', '@aurum-sdk/types'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);

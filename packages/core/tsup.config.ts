import { defineConfig } from 'tsup';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    widgets: 'src/widgets.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  // Externalize React, viem, wagmi and all sub-paths to prevent duplicate instances
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    /^react\//,
    /^react-dom\//,
    'viem',
    /^viem\//,
    'wagmi',
    /^wagmi\//,
    'pino-pretty',
  ],
  // CSS is pre-bundled via scripts/bundle-css.js and injected into Shadow DOM
  // Individual CSS imports in components are kept for IDE support but ignored at runtime
  injectStyle: false,
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.define = {
      ...options.define,
      global: 'globalThis',
      __SDK_VERSION__: JSON.stringify(pkg.version),
      __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN || ''),
    };
    options.inject = ['./polyfills.js'];
    options.alias = {
      '@src': path.resolve(__dirname, 'src'),
    };
    options.loader = {
      ...options.loader,
      '.svg': 'text',
    };
  },
});

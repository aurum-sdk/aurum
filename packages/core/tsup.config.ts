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
  platform: 'browser',
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
  ],
  // Bundle internal deps inline so consumers don't need to resolve them.
  // These have no shared-instance requirement with the host app (unlike react/viem/wagmi).
  // @reown/appkit and @reown/appkit-adapter-wagmi are kept external — bundling them pulls in
  // the full wagmi/@wagmi/connectors/@walletconnect stack which esbuild can't resolve cleanly.
  noExternal: [
    '@coinbase/cdp-core',
    '@coinbase/wallet-sdk',
    'buffer',
    '@aurum-sdk/logos',
    /^@aurum-sdk\/logos/,
    '@aurum-sdk/types',
    'zustand',
    /^zustand\//,
    'lucide-react',
    'mobile-detect',
    '@liquid-js/qr-code-styling',
    /^@liquid-js\//,
    '@sentry/browser',
    /^@sentry\//,
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
      // Stub Node-only optional deps pulled in transitively by bundled packages
      // (e.g. @coinbase/cdp-core references x402-fetch for a code path Aurum does not expose).
      // Without this, downstream consumers who externalize @aurum-sdk/core fail to resolve these
      // at their own build step.
      'x402-fetch': path.resolve(__dirname, 'scripts/empty-stub.js'),
      'pino-pretty': path.resolve(__dirname, 'scripts/empty-stub.js'),
    };
    options.loader = {
      ...options.loader,
      '.svg': 'text',
    };
    // Defensive: silence warnings from unresolvable dynamic-import globs in transitive deps
    // (e.g. Stencil-generated web components in @metamask/sdk use import(`./${i}.entry.js`)).
    // MetaMask is externalized today so no warning fires on our build — but keep this as a
    // safety net for future deps that ship similar patterns.
    options.logOverride = {
      ...options.logOverride,
      'unsupported-dynamic-import': 'silent',
      'unsupported-require-call': 'silent',
    };
  },
});

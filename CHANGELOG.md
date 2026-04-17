# Changelog

## [0.2.6] - 2026-04-17

- Stub `x402-fetch` and `pino-pretty` in the build so downstream SDKs can externalize `@aurum-sdk/core` without  
  build-time resolution errors (fixes ~40x bundle bloat from the workaround)
- Fix SSR hang: `whenReady()` now resolves instantly on the server instead of waiting forever on store hydration
- Warn (instead of silently ignoring) when `new Aurum()` is called a second time with a different config
- Pin `@reown/*` subtree to exact versions for more deterministic installs

## [0.2.5] - 2026-04-16

- Replace `react-qrcode-logo` with `@liquid-js/qr-code-styling` to fix fatal `require("react")` crash in browser ESM contexts

## [0.2.4] - 2026-04-15

- Bundle @coinbase/cdp-core, @coinbase/wallet-sdk, porto, and other internal deps inline — consumers no longer need to resolve Aurum's transitive wallet connector dependencies at build time. @reown/appkit remains external (installed as a transitive dep) due to its wagmi/@walletconnect dependency chain.

## [0.2.3] - 2026-04-15

- `@coinbase/wallet-sdk` is now lazy-loaded on first use instead of at module import time

## [0.2.2] - 2026-01-23

- consolidate walletconnect & appkit, remove ledger, various other fixes

## [0.2.1] - 2026-01-21

- undo walletconnect and appkit consolidation, needs further testing

## [0.2.0] - 2026-01-21

- consolidate walletconnect and appkit

## [0.1.5] - 2026-01-20

- update READMEs

## [0.1.4] - 2026-01-19

- update wallet grid ui. update link in aurum footer'

## [0.1.3] - 2026-01-18

- update wallet grid ui, update wallet config, update logger

## [0.1.2] - 2026-01-15

- fix brave browser detection on mobile, open to appkit AllWallets page

## [0.1.1] - 2026-01-15

- Fixed workspace dependency resolution for npm installs

All notable changes to Aurum SDK.

## [0.1.0] - 2025-01-15

### Added

- Initial release of Aurum SDK
- Wallet support: MetaMask, Coinbase Wallet, Phantom, Rabby, WalletConnect, AppKit, Brave, Ledger
- Email wallet integration via Coinbase Embedded Wallets
- `@aurum-sdk/core` - Core SDK with connect modal
- `@aurum-sdk/hooks` - React hooks for SDK integration
- `@aurum-sdk/types` - Shared TypeScript types
- `@aurum-sdk/logos` - Wallet and Aurum logos

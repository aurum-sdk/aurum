# Changelog

## [0.3.0] - 2026-05-13

### Added

- **Lazy-loaded wallet adapters.** Each wallet's adapter code (MetaMask, WalletConnect, Coinbase Wallet, Phantom, Rabby, Brave, Email) now ships as its own dynamic-import chunk and is only downloaded the first time the wallet is used. Initial-load gzipped bundle drops from ~370 KB to ~154 KB. The heavy SDKs — `@coinbase/wallet-sdk` (~215 KB gz), `@coinbase/cdp-core` (~45 KB gz), `@reown/appkit*` — now only ship to consumers whose users actually click the corresponding wallet. Tradeoff: a brief one-time chunk download on first click of each wallet, hidden by the existing connecting / QR-code page transition.
- **`AdapterLoadError`.** New typed error (code `'ADAPTER_LOAD_FAILED'`) thrown when a wallet adapter chunk fails to load — e.g. network drop, or a stale chunk hash after a redeploy. Carries `.walletId` and `.cause`. The loader cache evicts on failure so the next call retries. Exported from `@aurum-sdk/core`.

### Changed

- `aurum.walletAdapters` (an `@internal` getter) now returns `WalletAdapterManifest[]` instead of `WalletAdapter[]`. Manifests expose the metadata needed to render a wallet button (`id`, `name`, `icon`, `hide`, `isInstalled()`) plus a `load()` method that resolves to the heavy adapter. Only `ConnectWidget` consumes this getter internally; consumer code that imports it would need to switch from calling adapter methods directly to going through `manifest.load()`.

### Removed

- `@gemini-wallet/core`, `@react-native-async-storage/async-storage`, `@metamask/sdk`, and `porto` dropped from `@aurum-sdk/core` dependencies. None were imported from source; `MetaMaskAdapter` uses EIP-6963 + `window.ethereum` directly. Net effect: ~276 fewer transitive packages in consumers' `node_modules`.

## [0.2.8] - 2026-04-30

- Fix Next.js consumer build failure (`Module not found: Can't resolve 'accounts'` originating from `@wagmi/core@3.4.7/tempo/Connectors.js`).  
  `@reown/appkit-adapter-wagmi@1.8.17` declares `@wagmi/connectors: ">=5.9.9"` as an optional dependency, which let consumer trees resolve `@wagmi/connectors@8.0.8` and  
  pull in `@wagmi/core@3.4.7`'s tempo modules whose runtime peers (`accounts`, etc.) are not auto-installed. Pin `@wagmi/connectors` to `^7.2.1` directly in  
  `@aurum-sdk/core` so consumer trees resolve a connectors version that doesn't pull the broken tempo subtree.

## [0.2.7] - 2026-04-20

### Added

- **Typed error hierarchy.** New `AurumError` base class plus `UserRejectedError`, `ChainSwitchRejectedError`,  
  `WalletNotInstalledError`, `WalletNotConfiguredError`, `WalletExcludedError`, `ChainNotSupportedError`,  
  `InvalidConfigError`, and `ConnectionError` — all exported from `@aurum-sdk/core`. Each has a stable string `code`
  field (e.g. `'USER_REJECTED'`) and preserves the original error as `err.cause`. Consumers can now discriminate  
  failures via `instanceof UserRejectedError` or `err.code === 'USER_REJECTED'` instead of message-sniffing.
- **`aurum.on()` / `aurum.off()` / `aurum.removeListener()`** convenience passthroughs on the `Aurum` instance.
  Previously required `aurum.rpcProvider.on(...)`. Fully typed for EIP-1193 events (`accountsChanged`, `connect`,  
  `disconnect`, `chainChanged`); listeners survive provider swaps.

### Changed

- Public methods (`connect`, `disconnect`, `switchChain`, `emailAuthStart`, `emailAuthVerify`,
  `getWalletConnectSession`, `handleWidgetConnection`) now normalize thrown adapter errors into typed `AurumError`  
  subclasses at the boundary. EIP-1193 `code: 4001`, ethers-style `ACTION_REJECTED`, and common rejection messages are
  mapped to `UserRejectedError` (or `ChainSwitchRejectedError` during `switchChain`). Unclassified errors surface as
  `ConnectionError`.

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

# @aurum-sdk/core

<!-- [Live Demo](https://demo.aurumsdk.com/)
[Aurum Website](https://aurumsdk.com/) -->

Aurum is a frontend JavaScript SDK that makes it easy to add wallets to your dapp.

**Using React? Check out @aurum-sdk/hooks on [github](https://github.com/aurum-sdk/aurum/packages/hooks) or [npm](https://www.npmjs.com/package/@aurum-sdk/hooks)**

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [BrandConfig](#brandconfig)
  - [WalletsConfig](#walletsconfig)
  - [Excluding Wallets](#excluding-wallets)
- [API Reference](#api-reference)
  - [Properties](#properties)
  - [Methods](#methods)
- [Embedded Widgets](#embedded-widgets)
- [Headless API](#headless-api)
  - [Direct Wallet Connection](#direct-wallet-connection)
  - [Email Authentication](#email-authentication)
  - [WalletConnect URI Flow](#walletconnect-uri-flow)
- [Web3 Library Integrations](#web3-library-integrations)
  - [Viem](#viem)
  - [Ethers v5](#ethers-v5)
  - [Ethers v6](#ethers-v6)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
pnpm add @aurum-sdk/core
```

## Quick Start

```typescript
import { Aurum } from '@aurum-sdk/core';

const aurum = new Aurum({
  brand: { appName: 'Your App Name' },
  wallets: {
    email: { projectId: 'cdp-project-id' },
    walletConnect: { projectId: 'reown-project-id' },
  },
});

// Open connect modal
const address = await aurum.connect();
console.log('Connected:', address);
```

---

## Configuration

### `AurumConfig`

```typescript
interface AurumConfig {
  wallets?: WalletsConfig;
  brand?: BrandConfig;
  telemetry?: boolean; // enable/disable error tracking (default: true)
}
```

### `BrandConfig`

Customize the look and feel of the connect modal.

| Property       | Type                  | Default          | Description                                               |
| -------------- | --------------------- | ---------------- | --------------------------------------------------------- |
| `appName`      | `string`              | `'Aurum'`        | Your application name                                     |
| `logo`         | `string`              | -                | URL to your app logo (https or data:image/svg+xml;base64) |
| `theme`        | `'light' \| 'dark'`   | `'dark'`         | Color theme for the modal                                 |
| `primaryColor` | `string`              | `#000` or `#FFF` | Primary accent color (hex)                                |
| `borderRadius` | `string`              | `'md'`           | Corner roundness of UI elements                           |
| `modalZIndex`  | `number`              | `1000`           | z-index for the modal overlay                             |
| `hideFooter`   | `boolean`             | `false`          | Hide the "Powered by Aurum" footer in modal               |
| `font`         | `string`              | Inter            | Custom font family for all modal UI elements              |
| `walletLayout` | `'stacked' \| 'grid'` | `'stacked'`      | Layout for wallet buttons                                 |

### `WalletsConfig`

```typescript
interface WalletsConfig {
  email?: {
    projectId: string; // Coinbase CDP project ID for email wallet
  };
  walletConnect?: {
    projectId: string; // Reown project ID for WalletConnect, AppKit modal, and Ledger
  };
  exclude?: WalletId[]; // Wallets to hide from the connect modal
}
```

**Getting Project IDs:**

- **Coinbase CDP:** Register at [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com/)
- **WalletConnect:** Register at [cloud.walletconnect.com](https://dashboard.reown.com/)

Don't forget to configure the domain allowlist for both project IDs.

### Excluding Wallets

```typescript
import { WalletId } from '@aurum-sdk/types';

const aurum = new Aurum({
  brand: { appName: 'Your App Name' },
  wallets: { ... },
  exclude: [WalletId.MetaMask], // or ['metamask']
});
```

**Notes:**

- If you exclude `WalletId.Email`, you don't need `wallets.email.projectId`
- If you exclude `WalletId.WalletConnect`, `WalletId.AppKit`, and `WalletId.Ledger`, you don't need `wallets.walletConnect.projectId`

---

## API Reference

### Properties

#### `rpcProvider: AurumRpcProvider`

EIP-1193 compatible provider. Works with viem, ethers.js, and other web3 libraries.

```typescript
// Direct RPC request
const accounts = await aurum.rpcProvider.request({ method: 'eth_accounts' });

// Event listeners
aurum.rpcProvider.on?.('accountsChanged', (accounts: string[]) => { ... });
aurum.rpcProvider.on?.('chainChanged', (chainId: string) => { ... });
```

#### `ready: boolean`

Whether the SDK has finished initializing (including connection restoration).

---

### Methods

#### `whenReady(): Promise<void>`

Waits for the SDK to finish initializing, including restoring any previous connection, such as after a page refresh.

```typescript
await aurum.whenReady();
// Safe to use the provider
```

---

#### ``connect(walletId?: WalletId): Promise<`0x${string}`>``

Opens the wallet connection modal or connects directly to a specific wallet.

```typescript
// Show modal
const address = await aurum.connect();

// Connect directly to a specific wallet
import { WalletId } from '@aurum-sdk/types';
const address = await aurum.connect(WalletId.MetaMask);
```

**Available Wallet IDs:**

| WalletId                  | Description                    |
| ------------------------- | ------------------------------ |
| `WalletId.Email`          | Coinbase Embedded email wallet |
| `WalletId.MetaMask`       | MetaMask                       |
| `WalletId.Phantom`        | Phantom wallet                 |
| `WalletId.CoinbaseWallet` | Coinbase Wallet                |
| `WalletId.Rabby`          | Rabby wallet                   |
| `WalletId.Brave`          | Brave Browser wallet           |
| `WalletId.Ledger`         | Ledger Live wallet             |
| `WalletId.WalletConnect`  | WalletConnect protocol         |
| `WalletId.AppKit`         | AppKit (Reown)                 |

**Throws:** Error if user closes the modal without connecting.

---

#### `disconnect(): Promise<void>`

Disconnects the currently connected wallet.

---

#### `isConnected(): Promise<boolean>`

Returns whether a wallet is currently connected.

---

#### `getUserInfo(): Promise<UserInfo | undefined>`

Returns info about the connected user, or `undefined` if not connected.

```typescript
interface UserInfo {
  publicAddress: string;
  walletName: WalletName;
  walletId: WalletId;
  email?: string;
}
```

---

#### `getChainId(): Promise<number>`

Returns the current chain ID.

---

#### `switchChain(chainId, chain?): Promise<void>`

Switches to a different network. If the chain isn't added to the wallet, it will attempt to add it.

```typescript
import { polygon } from 'viem/chains';
await aurum.switchChain(polygon.id, polygon);
```

---

#### `updateBrandConfig(newConfig): void`

Updates the brand configuration (e.g., theme).

```typescript
aurum.updateBrandConfig({ theme: 'light' });
```

---

#### `updateWalletsConfig(newConfig): void`

Updates the wallets configuration (currently supports `exclude`).

```typescript
aurum.updateWalletsConfig({ exclude: [WalletId.MetaMask] });
```

---

## Embedded Widgets

React components for embedded wallet connection UI (instead of modal).

```tsx
import { ConnectWidget } from '@aurum-sdk/core/widgets';

<ConnectWidget
  aurum={aurum}
  onConnect={(result) => {
    console.log('Connected:', result.address, result.walletId);
  }}
/>;
```

| Property    | Type                                              | Description                            |
| ----------- | ------------------------------------------------- | -------------------------------------- |
| `aurum`     | `Aurum`                                           | Your Aurum instance                    |
| `onConnect` | `(result: { address, walletId, email? }) => void` | Called when user successfully connects |

---

## Headless API

Build custom wallet connection UIs while using Aurum's wallet management.

### Direct Wallet Connection

Use `connect(walletId)` to connect directly without showing the modal:

```typescript
const address = await aurum.connect(WalletId.MetaMask);
```

**Note:** `WalletId.Email` and `WalletId.WalletConnect` have dedicated methods below and cannot be used with `connect(walletId)`.

---

### Email Authentication

Two-step flow for Coinbase Embedded Wallet:

#### `emailAuthStart(email): Promise<{ flowId: string }>`

Sends an OTP code to the provided email.

#### `emailAuthVerify(flowId, otp): Promise<{ address: string, email: string, isNewUser: boolean }>`

Verifies the OTP and completes connection.

```typescript
// Step 1: Send OTP
const { flowId } = await aurum.emailAuthStart('user@example.com');

// Step 2: User enters OTP from their email
const otp = await promptUserForOTP();

// Step 3: Verify and connect
const { address, email, isNewUser } = await aurum.emailAuthVerify(flowId, otp);
```

---

### WalletConnect URI Flow

For custom QR code displays:

#### `getWalletConnectSession(): Promise<{ uri: string, waitForConnection: () => Promise<string> }>`

```typescript
const { uri, waitForConnection } = await aurum.getWalletConnectSession();

// Display your own QR code
renderQRCode(uri);

// Wait for user to scan and approve
const address = await waitForConnection();
```

---

## Web3 Library Integrations

### Viem

```typescript
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('YOUR_NODE_URL'),
});

const walletClient = createWalletClient({
  transport: custom(aurum.rpcProvider),
});

// Sign a message
const [address] = await walletClient.getAddresses();
const signature = await walletClient.signMessage({ account: address, message: 'Hello!' });

// Send a transaction
const hash = await walletClient.sendTransaction({
  account: address,
  to: '0x...',
  value: parseEther('0.01'),
});
```

---

### Ethers v5

```typescript
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(aurum.rpcProvider);
const signer = provider.getSigner();

const signature = await signer.signMessage('Hello!');
const tx = await signer.sendTransaction({ to: '0x...', value: ethers.utils.parseEther('0.01') });
```

---

### Ethers v6

```typescript
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(aurum.rpcProvider);
const signer = await provider.getSigner();

const signature = await signer.signMessage('Hello!');
const tx = await signer.sendTransaction({ to: '0x...', value: ethers.parseEther('0.01') });
```

---

## Troubleshooting

### Sourcemap warnings in console

Add to your `.env` file:

```
GENERATE_SOURCEMAP=false
```

### Email wallet fails to send OTP

Ensure your domain is added to the **Coinbase Developer Platform** domain allowlist:
[How to Configure Domains](https://docs.cdp.coinbase.com/embedded-wallets/domains#how-to-configure-domains)

### WalletConnect does not prompt user to connect

Add your domain to the **Reown** dashboard allowlist at [dashboard.reown.com](https://dashboard.reown.com/).

### AppKit modal login methods

Configure available login methods (email, social) in the [Reown dashboard](https://dashboard.reown.com/), not in the SDK.

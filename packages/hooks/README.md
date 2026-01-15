# @aurum-sdk/hooks

React hooks for Aurum SDK

**Looking for the core SDK? Check out @aurum-sdk/core on [github](https://github.com/aurum-sdk/aurum/packages/core) or [npm](https://www.npmjs.com/package/@aurum-sdk/core)**

## Installation

```bash
pnpm add @aurum-sdk/hooks @aurum-sdk/core
```

## Quick Start

### 1. Setup Provider

Wrap your app with `AurumProvider`

```tsx
import { Aurum } from '@aurum-sdk/core';
import { AurumProvider } from '@aurum-sdk/hooks';

const aurum = new Aurum({
  brand: { appName: 'Your App Name' },
  wallets: {
    email: { projectId: 'cdp-project-id' },
    walletConnect: { projectId: 'reown-project-id' },
  },
});

function App() {
  return (
    <AurumProvider aurum={aurum}>
      <YourApp />
    </AurumProvider>
  );
}
```

### 2. Use Hooks

```tsx
import { useAccount, useConnect, useDisconnect } from '@aurum-sdk/hooks';

function WalletButton() {
  const { publicAddress, isConnected, isInitializing } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isInitializing) return <div>Loading...</div>;

  if (!isConnected) {
    return (
      <button onClick={() => connect()} disabled={isPending}>
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div>
      <p>{publicAddress}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## Available Hooks

### `useAurum`

Access the raw Aurum SDK instance.

```tsx
const { aurum, isReady } = useAurum();
```

| Return    | Type      | Description                               |
| --------- | --------- | ----------------------------------------- |
| `aurum`   | `Aurum`   | The Aurum SDK instance                    |
| `isReady` | `boolean` | Whether the SDK has finished initializing |

### `useAccount`

Access connected user information.

```tsx
const { publicAddress, walletName, walletId, email, isConnected, isInitializing } = useAccount();
```

| Return           | Type                      | Description                            |
| ---------------- | ------------------------- | -------------------------------------- |
| `publicAddress`  | `string \| undefined`     | The connected wallet address           |
| `walletName`     | `WalletName \| undefined` | Name of the connected wallet           |
| `walletId`       | `WalletId \| undefined`   | ID of the connected wallet             |
| `email`          | `string \| undefined`     | Email address when logged in via email |
| `isConnected`    | `boolean`                 | Whether a wallet is connected          |
| `isInitializing` | `boolean`                 | Whether the SDK is initializing        |

### `useConnect`

Connect to a wallet via modal, direct connection, or headless flows.

```tsx
const { connect, emailAuthStart, emailAuthVerify, getWalletConnectSession, isPending, error } = useConnect();

// Open wallet selection modal
await connect();

// Or connect directly to a specific wallet (skips modal)
import { WalletId } from '@aurum-sdk/types';
await connect(WalletId.MetaMask);
```

| Return                    | Type                                                                                               | Description                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `connect`                 | `(walletId?: WalletId) => Promise<string>`                                                         | Opens wallet modal, or connects directly if walletId provided |
| `emailAuthStart`          | `(email: string) => Promise<{ flowId: string }>`                                                   | Sends OTP to email for Coinbase Embedded Wallet               |
| `emailAuthVerify`         | `(flowId: string, otp: string) => Promise<{ address: string, email: string, isNewUser: boolean }>` | Verifies OTP and completes connection                         |
| `getWalletConnectSession` | `() => Promise<{ uri: string, waitForConnection: () => Promise<string> }>`                         | Gets WalletConnect URI for custom QR display                  |
| `isPending`               | `boolean`                                                                                          | Whether connection is in progress                             |
| `error`                   | `Error \| null`                                                                                    | Error from last connection attempt                            |

**Note:** `WalletId.Email` and `WalletId.WalletConnect` cannot be used with `connect(walletId)` — use the headless methods below instead.

> **ConnectWidget Compatibility:** Do not use `useConnect()` with `<ConnectWidget>`. Use `useAccount()` to react to connection state changes instead.

#### Headless Email Authentication

Two-step flow for Coinbase Embedded Wallet:

```tsx
const { emailAuthStart, emailAuthVerify, isPending, error } = useConnect();

// Step 1: Send OTP
const { flowId } = await emailAuthStart('user@example.com');

// Step 2: User enters OTP from their email
const otp = await promptUserForOTP();

// Step 3: Verify and connect
const { address, email } = await emailAuthVerify(flowId, otp);
```

#### Headless WalletConnect

For custom QR code displays:

```tsx
const { getWalletConnectSession, isPending, error } = useConnect();

const { uri, waitForConnection } = await getWalletConnectSession();

// Display your own QR code
renderQRCode(uri);

// Wait for user to scan and approve
const address = await waitForConnection();
```

### `useDisconnect`

Disconnect the current wallet.

```tsx
const { disconnect } = useDisconnect();

await disconnect();
```

| Return       | Type                  | Description                    |
| ------------ | --------------------- | ------------------------------ |
| `disconnect` | `() => Promise<void>` | Disconnects the current wallet |

### `useChain`

Access chain information and switch chains.

```tsx
import { sepolia } from 'viem/chains';

const { chainId, switchChain, error } = useChain();

await switchChain(sepolia.id, sepolia);
```

| Return        | Type                                 | Description                    |
| ------------- | ------------------------------------ | ------------------------------ |
| `chainId`     | `number \| null`                     | Current chain ID               |
| `switchChain` | `(chainId, chain?) => Promise<void>` | Switch to a different chain    |
| `error`       | `Error \| null`                      | Error from last switch attempt |

## License

MIT

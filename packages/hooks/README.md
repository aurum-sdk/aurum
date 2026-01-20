# @aurum-sdk/hooks

[Docs](https://docs.aurumsdk.com/)
[Live Demo](https://demo.aurumsdk.com/)
[Website](https://aurumsdk.com/)

React hooks for Aurum SDK.

---

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
    embedded: { projectId: 'cdp-project-id' },
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

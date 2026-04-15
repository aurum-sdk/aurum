# @aurum-sdk/core

- [Docs](https://docs.aurumsdk.com/)
- [Live Demo](https://demo.aurumsdk.com/)
- [Website](https://aurumsdk.com/)

Aurum is an open-source JavaScript SDK that makes it easy to add wallets to your web app.

---

## Installation

```bash
pnpm add @aurum-sdk/core
```

> **pnpm local development (link:)**: `@reown/appkit` and `@reown/appkit-adapter-wagmi` are loaded as dynamic requires at runtime rather than bundled inline. With a normal `pnpm add` install this is transparent — pnpm installs them as transitive deps. But if you're linking Aurum locally via `link:` or a workspace `link:` protocol, pnpm's strict isolation may prevent your app's webpack from resolving them. Fix by adding them explicitly to your app's dependencies:
>
> ```bash
> pnpm add @reown/appkit @reown/appkit-adapter-wagmi
> ```

## Quick Start

```typescript
import { Aurum } from '@aurum-sdk/core';

const aurum = new Aurum({
  brand: { appName: 'Your App Name' },
  wallets: {
    embedded: { projectId: 'cdp-project-id' },
    walletConnect: { projectId: 'reown-project-id' },
  },
});

// Open connect modal
const address = await aurum.connect();
console.log('Connected:', address);
```

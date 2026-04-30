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

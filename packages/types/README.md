# @aurum/types

Shared TypeScript type definitions for the Aurum SDK ecosystem.

## Installation

```bash
pnpm add @aurum/types
```

## Exports

```typescript
import {
  // Enums
  WalletId,
  WalletName,

  // SDK Configuration
  type AurumConfig,
  type BrandConfig,
  type NonNullableBrandConfig,
  type WalletsConfig,
  type EmailConfig,
  type WalletConnectConfig,

  // Theme & Styling
  type Theme,
  type BorderRadiusToken,
  type BorderRadiusSizeSlot,
  type BorderRadiusScale,
  type WalletLayout,
  BORDER_RADIUS_SCALES,

  // Provider & User
  type AurumRpcProvider,
  type UserInfo,

  // Headless Mode
  type EmailAuthStartResult,
  type EmailAuthVerifyResult,
  type WalletConnectSessionResult,
} from '@aurum/types';
```

## License

MIT

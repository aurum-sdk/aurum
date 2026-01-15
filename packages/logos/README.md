# @aurum-sdk/logos

Tree-shakable wallet logos for Aurum SDK. Framework-agnostic + optional React components.

## Installation

```bash
pnpm add @aurum-sdk/logos
```

## Supported Logos

MetaMask, Coinbase Wallet, Phantom, WalletConnect, Rabby, Brave, Ledger, AppKit, and Aurum brand logo.

Each has 4 variants: `icon`, `brand`, `black`, `white`.

> **Note:** `Email` wallet uses Coinbase Wallet logos (email auth is Coinbase-powered).

## Usage

### Core (Vanilla JS)

```typescript
import { getLogoSvg, getLogoDataUri } from '@aurum-sdk/logos';
import { WalletId } from '@aurum-sdk/types';

// Raw SVG string
const svg = getLogoSvg(WalletId.MetaMask, 'brand');

// Data URI for <img src>
const dataUri = getLogoDataUri(WalletId.Phantom, 'icon');

// Aurum logo
import { getAurumLogoSvg } from '@aurum-sdk/logos';
const aurumSvg = getAurumLogoSvg('brand');
```

### React

```tsx
import { WalletLogo, AurumLogo } from '@aurum-sdk/logos/react';
import { WalletId } from '@aurum-sdk/types';

<WalletLogo id={WalletId.MetaMask} variant="brand" size={48} />
<WalletLogo id={WalletId.Rabby} size={80} radius="lg" sizeSlot="md" />
<WalletLogo id={WalletId.Phantom} title="Connect with Phantom" />

<AurumLogo variant="brand" size={48} />
```

### Direct Imports (Smallest Bundle)

```tsx
import { MetamaskIcon, PhantomBrand, AurumBrand } from '@aurum-sdk/logos/react';

<MetamaskIcon width={24} height={24} />;
```

## Props

### `<WalletLogo />` / `<AurumLogo />`

| Prop       | Type                                      | Description                                                 |
| ---------- | ----------------------------------------- | ----------------------------------------------------------- |
| `id`       | `WalletId`                                | Wallet identifier                                           |
| `variant`  | `'icon' \| 'brand' \| 'black' \| 'white'` | Logo variant (default: `'icon'`)                            |
| `size`     | `number`                                  | Width and height in pixels                                  |
| `radius`   | `BorderRadiusToken`                       | Border radius token (`none`, `sm`, `md`, `lg`, `xl`)        |
| `sizeSlot` | `BorderRadiusSizeSlot`                    | Size slot for radius scaling (`xs`, `sm`, `md`, `lg`, `xl`) |
| `title`    | `string`                                  | When provided, makes icon accessible to screen readers      |

## License

MIT

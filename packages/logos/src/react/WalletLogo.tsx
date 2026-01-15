import * as React from 'react';
import type { WalletId, WalletName, BorderRadiusToken, BorderRadiusSizeSlot } from '@aurum-sdk/types';
import type { LogoVariant } from '@src/core/types';
import { WALLET_NAME_TO_ID } from '@src/core/constants';
import { resolveLogoPrefix, getLogoRadius } from '@src/core/utils';

// Explicit imports — bundlers can tree-shake unused ones when not using WalletLogo
import { MetamaskIcon } from '@src/react/icons/MetamaskIcon';
import { MetamaskBrand } from '@src/react/icons/MetamaskBrand';
import { MetamaskBlack } from '@src/react/icons/MetamaskBlack';
import { MetamaskWhite } from '@src/react/icons/MetamaskWhite';
import { CoinbaseWalletIcon } from '@src/react/icons/CoinbaseWalletIcon';
import { CoinbaseWalletBrand } from '@src/react/icons/CoinbaseWalletBrand';
import { CoinbaseWalletBlack } from '@src/react/icons/CoinbaseWalletBlack';
import { CoinbaseWalletWhite } from '@src/react/icons/CoinbaseWalletWhite';
import { PhantomIcon } from '@src/react/icons/PhantomIcon';
import { PhantomBrand } from '@src/react/icons/PhantomBrand';
import { PhantomBlack } from '@src/react/icons/PhantomBlack';
import { PhantomWhite } from '@src/react/icons/PhantomWhite';
import { WalletconnectIcon } from '@src/react/icons/WalletconnectIcon';
import { WalletconnectBrand } from '@src/react/icons/WalletconnectBrand';
import { WalletconnectBlack } from '@src/react/icons/WalletconnectBlack';
import { WalletconnectWhite } from '@src/react/icons/WalletconnectWhite';
import { RabbyIcon } from '@src/react/icons/RabbyIcon';
import { RabbyBrand } from '@src/react/icons/RabbyBrand';
import { RabbyBlack } from '@src/react/icons/RabbyBlack';
import { RabbyWhite } from '@src/react/icons/RabbyWhite';
import { AppkitIcon } from '@src/react/icons/AppkitIcon';
import { AppkitBrand } from '@src/react/icons/AppkitBrand';
import { AppkitBlack } from '@src/react/icons/AppkitBlack';
import { AppkitWhite } from '@src/react/icons/AppkitWhite';
import { BraveIcon } from '@src/react/icons/BraveIcon';
import { BraveBrand } from '@src/react/icons/BraveBrand';
import { BraveBlack } from '@src/react/icons/BraveBlack';
import { BraveWhite } from '@src/react/icons/BraveWhite';
import { LedgerIcon } from '@src/react/icons/LedgerIcon';
import { LedgerBrand } from '@src/react/icons/LedgerBrand';
import { LedgerBlack } from '@src/react/icons/LedgerBlack';
import { LedgerWhite } from '@src/react/icons/LedgerWhite';

// Explicit map — avoids namespace import which defeats tree-shaking
const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'metamask.icon': MetamaskIcon,
  'metamask.brand': MetamaskBrand,
  'metamask.black': MetamaskBlack,
  'metamask.white': MetamaskWhite,
  'coinbase-wallet.icon': CoinbaseWalletIcon,
  'coinbase-wallet.brand': CoinbaseWalletBrand,
  'coinbase-wallet.black': CoinbaseWalletBlack,
  'coinbase-wallet.white': CoinbaseWalletWhite,
  'phantom.icon': PhantomIcon,
  'phantom.brand': PhantomBrand,
  'phantom.black': PhantomBlack,
  'phantom.white': PhantomWhite,
  'walletconnect.icon': WalletconnectIcon,
  'walletconnect.brand': WalletconnectBrand,
  'walletconnect.black': WalletconnectBlack,
  'walletconnect.white': WalletconnectWhite,
  'rabby.icon': RabbyIcon,
  'rabby.brand': RabbyBrand,
  'rabby.black': RabbyBlack,
  'rabby.white': RabbyWhite,
  'appkit.icon': AppkitIcon,
  'appkit.brand': AppkitBrand,
  'appkit.black': AppkitBlack,
  'appkit.white': AppkitWhite,
  'brave.icon': BraveIcon,
  'brave.brand': BraveBrand,
  'brave.black': BraveBlack,
  'brave.white': BraveWhite,
  'ledger.icon': LedgerIcon,
  'ledger.brand': LedgerBrand,
  'ledger.black': LedgerBlack,
  'ledger.white': LedgerWhite,
};

export interface WalletLogoProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  /** Wallet ID */
  id?: WalletId;
  /** Wallet Name (alternative to id) */
  name?: WalletName;
  /** Logo variant - defaults to 'icon' */
  variant?: LogoVariant;
  /** Size in pixels (sets width and height) */
  size?: number;
  /** Border radius config token - defaults to 'md' */
  radius?: BorderRadiusToken;
  /** Size slot for border radius scaling (xs, sm, md, lg, xl) */
  sizeSlot?: BorderRadiusSizeSlot;
  /** Accessible title - when provided, removes aria-hidden and adds accessible label */
  title?: string;
}

export function WalletLogo({
  id,
  name,
  variant = 'icon',
  size,
  width,
  height,
  radius = 'md',
  sizeSlot = 'md',
  title,
  style,
  ...props
}: WalletLogoProps) {
  const walletId = id ?? (name ? WALLET_NAME_TO_ID[name] : undefined);
  if (!walletId) return null;

  const prefix = resolveLogoPrefix(walletId);
  const Icon = ICON_MAP[`${prefix}.${variant}`];
  if (!Icon) return null;

  // When title is provided, make the icon accessible instead of decorative
  const accessibilityProps = title ? { role: 'img' as const, 'aria-label': title, 'aria-hidden': undefined } : {};

  const radiusStyle: React.CSSProperties = {
    borderRadius: getLogoRadius(radius, sizeSlot),
    overflow: 'hidden',
    ...style,
  };

  return <Icon {...props} {...accessibilityProps} width={width ?? size} height={height ?? size} style={radiusStyle} />;
}

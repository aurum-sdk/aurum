import { WalletId, WalletName } from '@aurum/types';
import type { LogoVariant } from './types';
import { WALLET_NAME_TO_ID } from './constants';
import { resolveLogoPrefix } from './utils';
import { SVG_REGISTRY } from './svgRegistry';

export interface GetLogoDataUriOptions {
  id?: WalletId;
  name?: WalletName;
  variant?: LogoVariant;
}

/**
 * Get data URI for a wallet logo.
 * Useful for img.src or CSS background-image.
 *
 * Uses UTF-8 encoding (smaller than base64).
 *
 * @example
 * // Using options object
 * getLogoDataUri({ id: WalletId.MetaMask, variant: 'brand' })
 *
 * // Using WalletId directly
 * getLogoDataUri(WalletId.Phantom, 'icon')
 *
 * // Set as image source
 * img.src = getLogoDataUri(WalletId.Rabby, 'brand')
 */
export function getLogoDataUri(options: GetLogoDataUriOptions): string | null;
export function getLogoDataUri(walletId: WalletId, variant?: LogoVariant): string | null;
export function getLogoDataUri(arg: WalletId | GetLogoDataUriOptions, variant: LogoVariant = 'icon'): string | null {
  let walletId: WalletId | undefined;
  let v: LogoVariant;

  if (typeof arg === 'string') {
    walletId = arg;
    v = variant;
  } else {
    walletId = arg.id ?? (arg.name ? WALLET_NAME_TO_ID[arg.name] : undefined);
    v = arg.variant ?? 'icon';
  }

  if (!walletId) return null;

  const prefix = resolveLogoPrefix(walletId);
  const svg = SVG_REGISTRY[`${prefix}.${v}`];
  if (!svg) return null;

  // UTF-8 encoding is smaller than base64
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

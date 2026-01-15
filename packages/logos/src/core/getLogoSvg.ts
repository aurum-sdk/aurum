import { WalletId, WalletName } from '@aurum-sdk/types';
import type { LogoVariant } from './types';
import { WALLET_NAME_TO_ID } from './constants';
import { resolveLogoPrefix } from './utils';
import { SVG_REGISTRY } from './svgRegistry';

export interface GetLogoOptions {
  id?: WalletId;
  name?: WalletName;
  variant?: LogoVariant;
}

/**
 * Get raw SVG string for a wallet logo
 *
 * @example
 * // Using options object
 * getLogoSvg({ id: WalletId.MetaMask, variant: 'brand' })
 *
 * // Using WalletId directly
 * getLogoSvg(WalletId.Phantom, 'icon')
 */
export function getLogoSvg(options: GetLogoOptions): string | null;
export function getLogoSvg(walletId: WalletId, variant?: LogoVariant): string | null;
export function getLogoSvg(arg: WalletId | GetLogoOptions, variant: LogoVariant = 'icon'): string | null {
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
  return SVG_REGISTRY[`${prefix}.${v}`] ?? null;
}

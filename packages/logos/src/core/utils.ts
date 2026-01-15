import { WalletId, BorderRadiusToken, BorderRadiusSizeSlot, BORDER_RADIUS_SCALES } from '@aurum-sdk/types';
import { WALLET_LOGO_PREFIX_OVERRIDES } from './constants';

/**
 * Gets the border radius in pixels for a given config token and size slot.
 */
function getBorderRadius(token: BorderRadiusToken, slot: BorderRadiusSizeSlot): number {
  return BORDER_RADIUS_SCALES[token][slot];
}

/**
 * Gets the border radius for a logo based on the config token and size slot.
 * Uses the shared scale system to ensure consistency with other UI elements.
 *
 * @param token - The border radius config (none, sm, md, lg, xl) - from brandConfig.borderRadius
 * @param slot - The element size slot (xs, sm, md, lg, xl) - defaults to 'sm'
 * @returns The border radius as a CSS string (e.g., "10px")
 *
 * @example
 * getLogoRadius('xl', 'xs')  // => "10px" (for ~32px logos)
 * getLogoRadius('xl', 'sm')  // => "18px" (for ~54px logos)
 * getLogoRadius('xl', 'md')  // => "26px" (for ~80px logos)
 */
export function getLogoRadius(token: BorderRadiusToken, slot: BorderRadiusSizeSlot = 'sm'): string {
  return `${getBorderRadius(token, slot) / 16}rem`;
}

/** Resolves the logo prefix for a given WalletId */
export function resolveLogoPrefix(walletId: WalletId): string {
  return WALLET_LOGO_PREFIX_OVERRIDES[walletId] ?? walletId;
}

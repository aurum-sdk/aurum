import type { AurumLogoVariant } from '@src/core/types';
import { SVG_REGISTRY } from '@src/core/svgRegistry';

/**
 * Get raw SVG string for the Aurum logo.
 *
 * @example
 * getAurumLogoSvg('brand')
 * getAurumLogoSvg('icon')
 */
export function getAurumLogoSvg(variant: AurumLogoVariant = 'icon'): string | null {
  return SVG_REGISTRY[`aurum.${variant}`] ?? null;
}

import type { AurumLogoVariant } from '@src/core/types';
import { SVG_REGISTRY } from '@src/core/svgRegistry';

/**
 * Get data URI for the Aurum logo.
 * Useful for img.src or CSS background-image.
 *
 * @example
 * getAurumLogoDataUri('brand')
 * img.src = getAurumLogoDataUri('icon')
 */
export function getAurumLogoDataUri(variant: AurumLogoVariant = 'icon'): string | null {
  const svg = SVG_REGISTRY[`aurum.${variant}`];
  if (!svg) return null;

  // UTF-8 encoding is smaller than base64
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

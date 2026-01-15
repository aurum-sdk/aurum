import * as React from 'react';
import type { BorderRadiusToken, BorderRadiusSizeSlot } from '@aurum-sdk/types';
import type { AurumLogoVariant } from '@src/core/types';
import { getLogoRadius } from '@src/core/utils';

import { AurumIcon } from '@src/react/icons/AurumIcon';
import { AurumBrand } from '@src/react/icons/AurumBrand';
import { AurumBlack } from '@src/react/icons/AurumBlack';
import { AurumWhite } from '@src/react/icons/AurumWhite';

export type { AurumLogoVariant };

const AURUM_ICON_MAP: Record<
  AurumLogoVariant,
  React.ComponentType<React.SVGProps<SVGSVGElement> & { color?: string }>
> = {
  icon: AurumIcon,
  brand: AurumBrand,
  black: AurumBlack,
  white: AurumWhite,
};

export interface AurumLogoProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  /** Logo variant - 'icon' | 'brand' | 'black' | 'white' */
  variant?: AurumLogoVariant;
  /** Size in pixels (sets width and height) */
  size?: number;
  /** Border radius config token - defaults to 'md' */
  radius?: BorderRadiusToken;
  /** Size slot for border radius scaling (xs, sm, md, lg, xl) */
  sizeSlot?: BorderRadiusSizeSlot;
  /** Accessible title - when provided, removes aria-hidden and adds accessible label */
  title?: string;
  /** Optional color override for the hood path */
  color?: string;
}

/**
 * Aurum brand logo component.
 *
 * @example
 * <AurumLogo variant="brand" size={48} />
 * <AurumLogo variant="icon" size={24} radius="lg" />
 */
export function AurumLogo({
  variant = 'icon',
  size,
  width,
  height,
  radius = 'md',
  sizeSlot = 'sm',
  title,
  color,
  style,
  ...props
}: AurumLogoProps) {
  const Icon = AURUM_ICON_MAP[variant];
  if (!Icon) return null;

  // When title is provided, make the icon accessible instead of decorative
  const accessibilityProps = title ? { role: 'img' as const, 'aria-label': title, 'aria-hidden': undefined } : {};

  const radiusStyle: React.CSSProperties = {
    borderRadius: getLogoRadius(radius, sizeSlot),
    overflow: 'hidden',
    ...style,
  };

  return (
    <Icon
      {...props}
      {...accessibilityProps}
      width={width ?? size}
      height={height ?? size}
      style={radiusStyle}
      color={color}
    />
  );
}

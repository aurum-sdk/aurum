import { getLogoRadius } from '@aurum-sdk/logos/react';
import { BorderRadiusSizeSlot } from '@aurum-sdk/types';
import { useWidgetContext } from '@src/contexts/WidgetContext';

interface BrandLogoProps {
  size?: number;
  sizeSlot?: BorderRadiusSizeSlot;
}

export const BrandLogo = ({ size = 70, sizeSlot = 'sm' }: BrandLogoProps) => {
  const { brandConfig } = useWidgetContext();

  return brandConfig.logo ? (
    <img
      src={brandConfig.logo}
      alt={`${brandConfig.appName} logo`}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: getLogoRadius(brandConfig.borderRadius, sizeSlot),
      }}
    />
  ) : null;
};

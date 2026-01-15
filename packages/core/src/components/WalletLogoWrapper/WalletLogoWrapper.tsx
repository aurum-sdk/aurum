import { WalletLogo as BaseLogo, WalletLogoProps as BaseLogoProps } from '@aurum-sdk/logos/react';
import { useWidgetContext } from '@src/contexts/WidgetContext';

export const WalletLogoWrapper = ({ radius, variant = 'brand', ...props }: BaseLogoProps) => {
  const { brandConfig } = useWidgetContext();
  return <BaseLogo radius={radius ?? brandConfig.borderRadius} variant={variant} {...props} />;
};

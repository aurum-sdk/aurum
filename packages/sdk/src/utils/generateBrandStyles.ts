import { NonNullableBrandConfig } from '@aurum/types';
import { getBorderRadiusScale, DEFAULT_FONT } from '@src/constants/theme';
import { bundledStyles } from '@src/styles/bundledStyles';

function generateBrandCssVariables(brandConfig: NonNullableBrandConfig): string {
  const r = getBorderRadiusScale(brandConfig.borderRadius);
  const fontFamily = brandConfig.font === DEFAULT_FONT ? brandConfig.font : `${brandConfig.font}, ${DEFAULT_FONT}`;

  return `
    .aurum-sdk {
      --aurum-primary-color: ${brandConfig.primaryColor};
      --aurum-border-radius-xs: ${r.xs}px;
      --aurum-border-radius-sm: ${r.sm}px;
      --aurum-border-radius-md: ${r.md}px;
      --aurum-border-radius-lg: ${r.lg}px;
      --aurum-border-radius-xl: ${r.xl}px;
      --aurum-border-radius: ${r.md}px;
      --aurum-modal-z-index: ${brandConfig.modalZIndex};
      --aurum-font-family: ${fontFamily};
    }
  `;
}

export function generateCompleteStyles(brandConfig: NonNullableBrandConfig): string {
  return `${bundledStyles}\n${generateBrandCssVariables(brandConfig)}`;
}

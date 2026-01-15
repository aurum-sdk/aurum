import {
  NonNullableBrandConfig,
  Theme,
  BorderRadiusToken,
  BorderRadiusScale,
  BorderRadiusSizeSlot,
  BORDER_RADIUS_SCALES,
  WalletLayout,
} from '@aurum/types';

export const DEFAULT_THEME = 'dark';

export const MOBILE_BREAKPOINT = 484;

export const ANIMATION_DURATION = {
  SHAKE: 300,
  MODAL_HEIGHT_TRANSITION: 200,
} as const;

const DEFAULT_BORDER_RADIUS: BorderRadiusToken = 'md';
const DEFAULT_MODAL_Z_INDEX = 1000;
const DEFAULT_APP_NAME = 'Aurum';
export const DEFAULT_FONT = "'Inter', -apple-system, sans-serif";
const DEFAULT_WALLET_LAYOUT: WalletLayout = 'stacked';

/**
 * Gets the full border radius scale for a given token.
 */
export const getBorderRadiusScale = (token: BorderRadiusToken): BorderRadiusScale => {
  return BORDER_RADIUS_SCALES[token];
};

/**
 * Gets the border radius in pixels for a given config token and size slot.
 * NOTE: Keep in sync with @aurum/logos/src/core/utils.ts
 */
export function getBorderRadius(token: BorderRadiusToken, slot: BorderRadiusSizeSlot): number {
  return BORDER_RADIUS_SCALES[token][slot];
}

const defaultLightThemeConfig: NonNullableBrandConfig = {
  logo: '',
  theme: 'light',
  primaryColor: '#000000',
  borderRadius: DEFAULT_BORDER_RADIUS,
  modalZIndex: DEFAULT_MODAL_Z_INDEX,
  appName: DEFAULT_APP_NAME,
  hideFooter: false,
  font: DEFAULT_FONT,
  walletLayout: DEFAULT_WALLET_LAYOUT,
};

const defaultDarkThemeConfig: NonNullableBrandConfig = {
  logo: '',
  theme: 'dark',
  primaryColor: '#ffffff',
  borderRadius: DEFAULT_BORDER_RADIUS,
  modalZIndex: DEFAULT_MODAL_Z_INDEX,
  appName: DEFAULT_APP_NAME,
  hideFooter: false,
  font: DEFAULT_FONT,
  walletLayout: DEFAULT_WALLET_LAYOUT,
};

export const getDefaultThemeConfig = (theme: Theme): NonNullableBrandConfig => {
  return theme === 'dark' ? defaultDarkThemeConfig : defaultLightThemeConfig;
};

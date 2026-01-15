import { WalletId } from './wallet';

export type Theme = 'light' | 'dark';
export type BorderRadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type WalletLayout = 'stacked' | 'grid';

/**
 * Border radius scale for each size slot (xs through xl).
 * Values are in pixels.
 */
export interface BorderRadiusScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Complete border radius scales for each token.
 * Each token provides a consistent scale of pixel values.
 */
export const BORDER_RADIUS_SCALES: Record<BorderRadiusToken, BorderRadiusScale> = {
  none: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
  sm: { xs: 4, sm: 6, md: 8, lg: 10, xl: 12 },
  md: { xs: 6, sm: 10, md: 14, lg: 18, xl: 22 },
  lg: { xs: 8, sm: 14, md: 20, lg: 26, xl: 32 },
  xl: { xs: 10, sm: 18, md: 26, lg: 34, xl: 42 },
};

export type BorderRadiusSizeSlot = keyof BorderRadiusScale;

export interface BrandConfig {
  theme?: Theme;
  logo?: string;
  primaryColor?: string;
  borderRadius?: BorderRadiusToken;
  modalZIndex?: number;
  appName?: string;
  hideFooter?: boolean;
  font?: string;
  walletLayout?: WalletLayout;
}

export interface NonNullableBrandConfig
  extends Omit<
    BrandConfig,
    'theme' | 'primaryColor' | 'borderRadius' | 'modalZIndex' | 'appName' | 'hideFooter' | 'font' | 'walletLayout'
  > {
  theme: Theme;
  primaryColor: string;
  borderRadius: BorderRadiusToken;
  modalZIndex: number;
  appName: string;
  hideFooter: boolean;
  font: string;
  walletLayout: WalletLayout;
}

export interface EmailConfig {
  projectId: string;
}

export interface WalletConnectConfig {
  projectId: string;
}

/**
 * walletConnect projectId is used for WalletConnect, AppKit, and Ledger wallets
 */
export interface WalletsConfig {
  email?: EmailConfig;
  walletConnect?: WalletConnectConfig;
  exclude?: WalletId[] | `${WalletId}`[];
}

export interface AurumConfig {
  brand?: BrandConfig;
  wallets?: WalletsConfig;
  telemetry?: boolean;
}

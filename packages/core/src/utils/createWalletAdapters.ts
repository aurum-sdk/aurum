import { WalletAdapter } from '@src/types/internal';
import { WalletId, WalletsConfig } from '@aurum-sdk/types';
import {
  RabbyAdapter,
  BraveAdapter,
  PhantomAdapter,
  CoinbaseWalletAdapter,
  MetaMaskAdapter,
  WalletConnectAdapter,
  EmailAdapter,
  OAuthAdapter,
} from '@src/wallet-adapters';

interface CreateWalletAdaptersParams {
  walletsConfig?: WalletsConfig;
  appName: string;
  appLogoUrl?: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
  telemetry: boolean;
}

/**
 * Creates all wallet adapters with the provided configuration.
 * Filtering (via `wallets.exclude`) is handled at render time in AurumCore.
 */
export function createWalletAdapters({
  walletsConfig,
  appName,
  appLogoUrl,
  modalZIndex,
  theme,
  telemetry,
}: CreateWalletAdaptersParams): WalletAdapter[] {
  return [
    new EmailAdapter({ projectId: walletsConfig?.embedded?.projectId, telemetry }),
    new OAuthAdapter({ projectId: walletsConfig?.embedded?.projectId, provider: WalletId.Google }),
    new OAuthAdapter({ projectId: walletsConfig?.embedded?.projectId, provider: WalletId.Apple }),
    new OAuthAdapter({ projectId: walletsConfig?.embedded?.projectId, provider: WalletId.X }),
    new MetaMaskAdapter(),
    new WalletConnectAdapter({
      projectId: walletsConfig?.walletConnect?.projectId,
      appName,
      modalZIndex,
      theme,
      telemetry,
    }),
    new CoinbaseWalletAdapter({ appName, appLogoUrl, telemetry }),
    new PhantomAdapter(),
    new RabbyAdapter(),
    new BraveAdapter(),
  ];
}

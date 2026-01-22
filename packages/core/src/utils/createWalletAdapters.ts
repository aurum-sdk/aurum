import { WalletAdapter } from '@src/types/internal';
import { WalletsConfig } from '@aurum-sdk/types';
import {
  RabbyAdapter,
  BraveAdapter,
  LedgerAdapter,
  PhantomAdapter,
  CoinbaseWalletAdapter,
  MetaMaskAdapter,
  WalletConnectAdapter,
  EmailAdapter,
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
    new LedgerAdapter({ walletConnectProjectId: walletsConfig?.walletConnect?.projectId }),
  ];
}

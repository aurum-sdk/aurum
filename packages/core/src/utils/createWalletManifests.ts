import type { WalletAdapterManifest } from '@src/types/internal';
import type { WalletsConfig } from '@aurum-sdk/types';
import { startEIP6963Discovery } from '@src/utils/eip6963Registry';
import {
  createEmailManifest,
  createMetaMaskManifest,
  createWalletConnectManifest,
  createCoinbaseWalletManifest,
  createPhantomManifest,
  createRabbyManifest,
  createBraveManifest,
} from '@src/wallet-adapters/manifests';

interface CreateWalletManifestsParams {
  walletsConfig?: WalletsConfig;
  appName: string;
  appLogoUrl?: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
  telemetry: boolean;
}

/**
 * Builds the eager wallet manifest list used by the modal/widget. The heavy adapter
 * implementations are only pulled in via `manifest.load()` (cached by `walletAdapterCache`)
 * the first time a wallet is actually used.
 *
 * Filtering (via `wallets.exclude`) is still handled at render time in AurumCore.
 */
export function createWalletManifests({
  walletsConfig,
  appName,
  appLogoUrl,
  modalZIndex,
  theme,
  telemetry,
}: CreateWalletManifestsParams): WalletAdapterManifest[] {
  // Start EIP-6963 discovery so manifests can sniff installed wallets without loading adapters.
  startEIP6963Discovery();

  const config = {
    appName,
    appLogoUrl,
    modalZIndex,
    theme,
    telemetry,
    embeddedProjectId: walletsConfig?.embedded?.projectId,
    walletConnectProjectId: walletsConfig?.walletConnect?.projectId,
  };

  return [
    createEmailManifest(config),
    createMetaMaskManifest(),
    createWalletConnectManifest(config),
    createCoinbaseWalletManifest(config),
    createPhantomManifest(),
    createRabbyManifest(),
    createBraveManifest(),
  ];
}

import { getLogoDataUri } from '@aurum-sdk/logos';
import { WalletAdapter } from '@src/types/internal';
import { WalletId } from '@aurum-sdk/types';
import { AppKitAdapter } from '@src/wallet-adapters/AppKitAdapter';

export const generateQrCodeWalletLogo = (walletAdapter?: WalletAdapter): string => {
  // Re-use WalletConnect icon for AppKit modal since it's not using the QR code
  if (walletAdapter && !(walletAdapter instanceof AppKitAdapter) && walletAdapter.icon) {
    return walletAdapter.icon;
  }

  return getLogoDataUri(WalletId.WalletConnect) ?? '';
};

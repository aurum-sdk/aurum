import { getLogoDataUri } from '@aurum-sdk/logos';
import { WalletAdapter } from '@src/types/internal';
import { WalletId } from '@aurum-sdk/types';

export const generateQrCodeWalletLogo = (walletAdapter?: WalletAdapter): string => {
  // Re-use WalletConnect icon for AppKit since it's not using the QR code
  if (walletAdapter && walletAdapter.id !== WalletId.AppKit && walletAdapter.icon) {
    return walletAdapter.icon;
  }

  return getLogoDataUri(WalletId.WalletConnect) ?? '';
};

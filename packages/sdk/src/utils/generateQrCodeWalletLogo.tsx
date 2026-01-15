import { getLogoDataUri } from '@aurum/logos';
import { WalletAdapter } from '@src/types/internal';
import { WalletId } from '@aurum/types';

export const generateQrCodeWalletLogo = (walletAdapter?: WalletAdapter): string => {
  // Re-use WalletConnect icon for AppKit since it's not using the QR code
  if (walletAdapter && walletAdapter.id !== WalletId.AppKit && walletAdapter.icon) {
    return walletAdapter.icon;
  }

  return getLogoDataUri(WalletId.WalletConnect) ?? '';
};

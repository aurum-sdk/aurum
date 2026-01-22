import { getLogoDataUri } from '@aurum-sdk/logos';
import { WalletAdapter } from '@src/types/internal';
import { WalletId } from '@aurum-sdk/types';

export const generateQrCodeWalletLogo = (walletAdapter?: WalletAdapter): string => {
  if (walletAdapter?.icon) {
    return walletAdapter.icon;
  }

  return getLogoDataUri(WalletId.WalletConnect) ?? '';
};

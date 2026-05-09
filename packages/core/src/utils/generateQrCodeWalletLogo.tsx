import { getLogoDataUri } from '@aurum-sdk/logos';
import { WalletAdapterManifest } from '@src/types/internal';
import { WalletId } from '@aurum-sdk/types';

export const generateQrCodeWalletLogo = (wallet?: WalletAdapterManifest): string => {
  if (wallet?.icon) {
    return wallet.icon;
  }

  return getLogoDataUri(WalletId.WalletConnect) ?? '';
};

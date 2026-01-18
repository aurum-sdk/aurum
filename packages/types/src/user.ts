import { WalletId, WalletName } from '@src/wallet';

export interface UserInfo {
  publicAddress: string;
  walletName: WalletName;
  walletId: WalletId;
  email?: string;
  phoneNumber?: string;
}

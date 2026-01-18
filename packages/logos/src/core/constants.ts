import { WalletId, WalletName } from '@aurum-sdk/types';

export const WALLET_NAME_TO_ID: Record<WalletName, WalletId> = {
  [WalletName.MetaMask]: WalletId.MetaMask,
  [WalletName.CoinbaseWallet]: WalletId.CoinbaseWallet,
  [WalletName.Phantom]: WalletId.Phantom,
  [WalletName.WalletConnect]: WalletId.WalletConnect,
  [WalletName.Rabby]: WalletId.Rabby,
  [WalletName.Brave]: WalletId.Brave,
  [WalletName.Ledger]: WalletId.Ledger,
  [WalletName.AppKit]: WalletId.AppKit,
  [WalletName.Email]: WalletId.Email,
  [WalletName.Google]: WalletId.Google,
  [WalletName.Apple]: WalletId.Apple,
  [WalletName.X]: WalletId.X,
};

/**
 * Maps WalletId to the SVG filename prefix.
 * Only includes exceptions where the prefix differs from the WalletId.
 * - Email uses Coinbase Wallet's logos (powered by Coinbase)
 */
export const WALLET_LOGO_PREFIX_OVERRIDES: Partial<Record<WalletId, string>> = {
  [WalletId.Email]: 'coinbase-wallet', // Email auth powered by Coinbase
};

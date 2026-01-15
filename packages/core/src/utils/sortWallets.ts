import { WalletAdapter } from '@src/types/internal';
import { useAurumStore } from '@src/store';
import { WalletId } from '@aurum-sdk/types';

// Wallet display priority order
const WALLET_PRIORITY = [
  WalletId.MetaMask,
  WalletId.Phantom,
  WalletId.WalletConnect,
  WalletId.Brave,
  WalletId.Rabby,
  WalletId.CoinbaseWallet,
  WalletId.Ledger,
];

export interface SortWalletsOptions {
  filterHidden?: boolean;
}

/**
 * Sorting priority:
 * 1. Last used wallet first (if exists)
 * 2. Installed wallets before uninstalled
 * 3. WALLET_PRIORITY order
 */
export function sortWallets(wallets: WalletAdapter[], options: SortWalletsOptions = {}): WalletAdapter[] {
  const { filterHidden = true } = options;
  const lastUsedWalletId = useAurumStore.getState().lastUsedWalletId;

  let result = [...wallets];

  if (filterHidden) {
    result = result.filter((wallet) => !wallet.hide);
  }

  result.sort((a, b) => {
    // 1. Last used wallet first
    if (a.id === lastUsedWalletId) return -1;
    if (b.id === lastUsedWalletId) return 1;

    // 2. Installed wallets first
    const aInstalled = a.isInstalled();
    const bInstalled = b.isInstalled();
    if (aInstalled !== bInstalled) {
      return aInstalled ? -1 : 1;
    }

    // 3. Priority order
    const aIndex = WALLET_PRIORITY.indexOf(a.id);
    const bIndex = WALLET_PRIORITY.indexOf(b.id);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  return result;
}

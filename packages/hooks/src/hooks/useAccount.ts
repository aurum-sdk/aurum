'use client';

import { useSyncExternalStore } from 'react';
import { useAurumContext } from '@src/AurumContext';

/**
 * Access connected user information.
 *
 * @example
 * ```tsx
 * const { publicAddress, walletName, isConnected, isInitializing } = useAccount();
 *
 * if (isInitializing) return <div>Loading...</div>;
 *
 * if (isConnected) {
 *   return <div>Connected: {publicAddress}</div>;
 * }
 * ```
 */
export function useAccount() {
  const { subscribe, getSnapshot, getServerSnapshot } = useAurumContext();

  const account = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    publicAddress: account.publicAddress,
    walletName: account.walletName,
    walletId: account.walletId,
    email: account.email,
    isConnected: account.isConnected,
    isInitializing: account.isInitializing,
  };
}

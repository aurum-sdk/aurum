'use client';

import { createContext, useContext } from 'react';
import type { Aurum } from '@aurum/sdk';
import type { WalletId, WalletName } from '@aurum/types';

export interface AccountState {
  publicAddress: string | undefined;
  walletName: WalletName | undefined;
  walletId: WalletId | undefined;
  email: string | undefined;
  isConnected: boolean;
  isInitializing: boolean;
}

interface AurumContextValue {
  aurum: Aurum;
  isReady: boolean;
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => AccountState;
  getServerSnapshot: () => AccountState;
}

export const initialAccountState: AccountState = {
  publicAddress: undefined,
  walletName: undefined,
  walletId: undefined,
  email: undefined,
  isConnected: false,
  isInitializing: true,
};

export const AurumContext = createContext<AurumContextValue | null>(null);

export function useAurumContext(): AurumContextValue {
  const context = useContext(AurumContext);
  if (!context) {
    throw new Error('useAurumContext must be used within a AurumProvider');
  }
  return context;
}

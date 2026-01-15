'use client';

import { useRef, useEffect, useCallback, useState, useMemo, type ReactNode } from 'react';
import { AurumContext, initialAccountState, type AccountState } from '@src/AurumContext';
import type { Aurum } from '@aurum-sdk/core';

interface AurumProviderProps {
  aurum: Aurum;
  children: ReactNode;
}

export function AurumProvider({ aurum, children }: AurumProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const accountStateRef = useRef<AccountState>(initialAccountState);
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Notify all subscribers of state changes
  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  // Sync state from SDK
  const syncState = useCallback(async () => {
    try {
      const userInfo = await aurum.getUserInfo();
      const isConnected = await aurum.isConnected();

      const newState: AccountState = {
        publicAddress: userInfo?.publicAddress,
        walletName: userInfo?.walletName,
        walletId: userInfo?.walletId,
        email: userInfo?.email,
        isConnected,
        isInitializing: false,
      };

      accountStateRef.current = newState;
      notifyListeners();
    } catch {
      accountStateRef.current = {
        ...initialAccountState,
        isInitializing: false,
      };
      notifyListeners();
    }
  }, [aurum, notifyListeners]);

  // Initialize SDK and set up event listeners
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await aurum.whenReady();
      if (!mounted) return;

      setIsReady(true);
      await syncState();
    };

    initialize();

    // Subscribe to provider events for account changes
    const handleAccountsChanged = () => {
      if (mounted) syncState();
    };

    const handleChainChanged = () => {
      if (mounted) syncState();
    };

    aurum.rpcProvider?.on?.('accountsChanged', handleAccountsChanged);
    aurum.rpcProvider?.on?.('chainChanged', handleChainChanged);

    return () => {
      mounted = false;
      aurum.rpcProvider?.removeListener?.('accountsChanged', handleAccountsChanged);
      aurum.rpcProvider?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [aurum, syncState]);

  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  // Get current snapshot for useSyncExternalStore
  const getSnapshot = useCallback(() => {
    return accountStateRef.current;
  }, []);

  // Server snapshot - always returns initial state
  const getServerSnapshot = useCallback(() => {
    return initialAccountState;
  }, []);

  const contextValue = useMemo(
    () => ({
      aurum,
      isReady,
      subscribe,
      getSnapshot,
      getServerSnapshot,
    }),
    [aurum, isReady, subscribe, getSnapshot, getServerSnapshot],
  );

  return <AurumContext.Provider value={contextValue}>{children}</AurumContext.Provider>;
}

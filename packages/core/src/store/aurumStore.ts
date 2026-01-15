import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { WalletName } from '@aurum-sdk/types';

interface AurumState {
  walletId: string | null;
  address: string | null;
  walletName: WalletName | null;
  email: string | null;
  isConnected: boolean;
  lastUsedWalletId: string | null;

  setConnection: (walletId: string, address: string, walletName: WalletName, email?: string) => void;
  clearConnection: () => void;
}

interface AurumStorePersist {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
}

type AurumStoreType = UseBoundStore<StoreApi<AurumState>> & AurumStorePersist;

// SSR-safe storage that checks for localStorage availability
const getStorage = (): StateStorage => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
});

const storeCreator = persist<AurumState>(
  (set) => ({
    walletId: null,
    address: null,
    walletName: null,
    email: null,
    isConnected: false,
    lastUsedWalletId: null,

    setConnection: (walletId, address, walletName, email) =>
      set({
        walletId,
        address,
        walletName,
        email: email ?? null,
        isConnected: true,
        lastUsedWalletId: walletId,
      }),

    clearConnection: () =>
      set({
        walletId: null,
        address: null,
        walletName: null,
        email: null,
        isConnected: false,
      }),
  }),
  {
    name: '@aurum-sdk/core-store',
    storage: createJSONStorage(getStorage),
    skipHydration: typeof window === 'undefined',
  },
);

export const useAurumStore = create(storeCreator as unknown as StateCreator<AurumState>) as AurumStoreType;

export const waitForStoreHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (useAurumStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    useAurumStore.persist.onFinishHydration(() => resolve());
  });
};

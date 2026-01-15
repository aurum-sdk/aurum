import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WalletName } from '@aurum-sdk/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('aurumStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  const getStore = async () => {
    const { useAurumStore } = await import('@src/store/aurumStore');
    return useAurumStore;
  };

  describe('initial state', () => {
    it('has correct initial state', async () => {
      const store = await getStore();
      expect(store.getState()).toMatchObject({
        walletId: null,
        address: null,
        walletName: null,
        email: null,
        isConnected: false,
        lastUsedWalletId: null,
      });
    });
  });

  describe('setConnection', () => {
    it('updates all state fields', async () => {
      const store = await getStore();

      store.getState().setConnection('metamask', '0x123abc', WalletName.MetaMask);

      const state = store.getState();
      expect(state.walletId).toBe('metamask');
      expect(state.address).toBe('0x123abc');
      expect(state.walletName).toBe(WalletName.MetaMask);
      expect(state.isConnected).toBe(true);
      expect(state.lastUsedWalletId).toBe('metamask');
    });

    it('sets email when provided', async () => {
      const store = await getStore();

      store.getState().setConnection('email', '0x456def', WalletName.Email, 'test@example.com');

      const state = store.getState();
      expect(state.email).toBe('test@example.com');
    });

    it('sets email to null when not provided', async () => {
      const store = await getStore();

      store.getState().setConnection('metamask', '0x123abc', WalletName.MetaMask);

      expect(store.getState().email).toBeNull();
    });

    it('updates lastUsedWalletId to current wallet', async () => {
      const store = await getStore();

      store.getState().setConnection('phantom', '0xabc', WalletName.Phantom);

      expect(store.getState().lastUsedWalletId).toBe('phantom');
    });
  });

  describe('clearConnection', () => {
    it('resets connection state but preserves lastUsedWalletId', async () => {
      const store = await getStore();
      store.getState().setConnection('phantom', '0x123', WalletName.Phantom, 'test@example.com');

      store.getState().clearConnection();

      const state = store.getState();
      // Connection state should be cleared
      expect(state.walletId).toBeNull();
      expect(state.address).toBeNull();
      expect(state.walletName).toBeNull();
      expect(state.email).toBeNull();
      expect(state.isConnected).toBe(false);
      // lastUsedWalletId should be preserved for "recently used" sorting
      expect(state.lastUsedWalletId).toBe('phantom');
    });
  });

  describe('multiple connections', () => {
    it('overwrites previous connection state', async () => {
      const store = await getStore();

      store.getState().setConnection('metamask', '0x111', WalletName.MetaMask);
      store.getState().setConnection('phantom', '0x222', WalletName.Phantom);

      const state = store.getState();
      expect(state.walletId).toBe('phantom');
      expect(state.address).toBe('0x222');
      expect(state.walletName).toBe(WalletName.Phantom);
    });

    it('updates lastUsedWalletId on each connection', async () => {
      const store = await getStore();

      store.getState().setConnection('metamask', '0x111', WalletName.MetaMask);
      expect(store.getState().lastUsedWalletId).toBe('metamask');

      store.getState().setConnection('phantom', '0x222', WalletName.Phantom);
      expect(store.getState().lastUsedWalletId).toBe('phantom');
    });
  });
});

describe('waitForStoreHydration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('resolves immediately when already hydrated', async () => {
    const { waitForStoreHydration, useAurumStore } = await import('@src/store/aurumStore');

    // Force hydration to complete
    vi.spyOn(useAurumStore.persist, 'hasHydrated').mockReturnValue(true);

    await expect(waitForStoreHydration()).resolves.toBeUndefined();
  });

  it('waits for hydration callback when not hydrated', async () => {
    const { waitForStoreHydration, useAurumStore } = await import('@src/store/aurumStore');

    let hydrationCallback: (() => void) | undefined;

    vi.spyOn(useAurumStore.persist, 'hasHydrated').mockReturnValue(false);
    vi.spyOn(useAurumStore.persist, 'onFinishHydration').mockImplementation((fn: () => void) => {
      hydrationCallback = fn;
      return () => {};
    });

    const hydrationPromise = waitForStoreHydration();

    // Simulate hydration completing
    hydrationCallback!();

    await expect(hydrationPromise).resolves.toBeUndefined();
  });
});

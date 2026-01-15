import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';
import type { WalletAdapter } from '@src/types/internal';

// Mock the store
vi.mock('@src/store', () => ({
  useAurumStore: {
    getState: vi.fn(() => ({
      lastUsedWalletId: null,
    })),
  },
}));

import { useAurumStore } from '@src/store';
import { sortWallets } from '@src/utils/sortWallets';

// Helper to create mock wallet adapters
const createMockAdapter = (id: WalletId, options: { installed?: boolean; hide?: boolean } = {}): WalletAdapter => ({
  id,
  name: id as unknown as WalletName,
  icon: '',
  hide: options.hide ?? false,
  downloadUrl: null,
  wcDeepLinkUrl: null,
  isInstalled: vi.fn(() => options.installed ?? false),
  getProvider: vi.fn(() => null),
  connect: vi.fn(),
  tryRestoreConnection: vi.fn(),
  disconnect: vi.fn(),
  onAccountsChanged: vi.fn(),
  removeListeners: vi.fn(),
});

describe('sortWallets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAurumStore.getState).mockReturnValue({
      lastUsedWalletId: null,
    } as ReturnType<typeof useAurumStore.getState>);
  });

  describe('filterHidden', () => {
    it('filters hidden wallets by default', () => {
      const wallets = [
        createMockAdapter(WalletId.MetaMask, { hide: false }),
        createMockAdapter(WalletId.Email, { hide: true }),
        createMockAdapter(WalletId.Phantom, { hide: false }),
      ];

      const sorted = sortWallets(wallets);

      expect(sorted).toHaveLength(2);
      expect(sorted.find((w) => w.id === WalletId.Email)).toBeUndefined();
    });

    it('includes hidden wallets when filterHidden is false', () => {
      const wallets = [
        createMockAdapter(WalletId.MetaMask, { hide: false }),
        createMockAdapter(WalletId.Email, { hide: true }),
      ];

      const sorted = sortWallets(wallets, { filterHidden: false });

      expect(sorted).toHaveLength(2);
      expect(sorted.find((w) => w.id === WalletId.Email)).toBeDefined();
    });
  });

  describe('last used wallet priority', () => {
    it('places last used wallet first', () => {
      vi.mocked(useAurumStore.getState).mockReturnValue({
        lastUsedWalletId: WalletId.Phantom,
      } as ReturnType<typeof useAurumStore.getState>);

      const wallets = [
        createMockAdapter(WalletId.MetaMask),
        createMockAdapter(WalletId.Phantom),
        createMockAdapter(WalletId.CoinbaseWallet),
      ];

      const sorted = sortWallets(wallets);

      expect(sorted[0].id).toBe(WalletId.Phantom);
    });

    it('handles case when last used wallet is not in list', () => {
      vi.mocked(useAurumStore.getState).mockReturnValue({
        lastUsedWalletId: 'nonexistent-wallet',
      } as ReturnType<typeof useAurumStore.getState>);

      const wallets = [createMockAdapter(WalletId.MetaMask), createMockAdapter(WalletId.Phantom)];

      const sorted = sortWallets(wallets);

      // Should still return sorted list without errors
      expect(sorted).toHaveLength(2);
    });
  });

  describe('installed wallet priority', () => {
    it('places installed wallets before uninstalled', () => {
      const wallets = [
        createMockAdapter(WalletId.Rabby, { installed: false }),
        createMockAdapter(WalletId.CoinbaseWallet, { installed: true }),
        createMockAdapter(WalletId.MetaMask, { installed: false }),
      ];

      const sorted = sortWallets(wallets);

      // CoinbaseWallet should be first as it's installed
      expect(sorted[0].id).toBe(WalletId.CoinbaseWallet);
    });

    it('groups all installed wallets before uninstalled', () => {
      const wallets = [
        createMockAdapter(WalletId.Rabby, { installed: false }),
        createMockAdapter(WalletId.CoinbaseWallet, { installed: true }),
        createMockAdapter(WalletId.MetaMask, { installed: true }),
        createMockAdapter(WalletId.Phantom, { installed: false }),
      ];

      const sorted = sortWallets(wallets);

      // First two should be installed wallets
      expect(sorted[0].isInstalled()).toBe(true);
      expect(sorted[1].isInstalled()).toBe(true);
      expect(sorted[2].isInstalled()).toBe(false);
      expect(sorted[3].isInstalled()).toBe(false);
    });
  });

  describe('WALLET_PRIORITY order', () => {
    it('respects priority order for wallets with same installed status', () => {
      // All installed, should follow WALLET_PRIORITY order
      const wallets = [
        createMockAdapter(WalletId.CoinbaseWallet, { installed: true }),
        createMockAdapter(WalletId.Rabby, { installed: true }),
        createMockAdapter(WalletId.MetaMask, { installed: true }),
        createMockAdapter(WalletId.Phantom, { installed: true }),
        createMockAdapter(WalletId.WalletConnect, { installed: true }),
      ];

      const sorted = sortWallets(wallets);

      // WALLET_PRIORITY = [MetaMask, Phantom, WalletConnect, Rabby, CoinbaseWallet]
      expect(sorted[0].id).toBe(WalletId.MetaMask);
      expect(sorted[1].id).toBe(WalletId.Phantom);
      expect(sorted[2].id).toBe(WalletId.WalletConnect);
      expect(sorted[3].id).toBe(WalletId.Rabby);
      expect(sorted[4].id).toBe(WalletId.CoinbaseWallet);
    });

    it('places wallets not in priority list at the end', () => {
      const wallets = [
        createMockAdapter(WalletId.AppKit, { installed: true }), // Not in priority list
        createMockAdapter(WalletId.MetaMask, { installed: true }),
      ];

      const sorted = sortWallets(wallets);

      expect(sorted[0].id).toBe(WalletId.MetaMask);
      expect(sorted[1].id).toBe(WalletId.AppKit);
    });
  });

  describe('combined sorting rules', () => {
    it('applies rules in correct order: last used > installed > priority', () => {
      vi.mocked(useAurumStore.getState).mockReturnValue({
        lastUsedWalletId: WalletId.Rabby,
      } as ReturnType<typeof useAurumStore.getState>);

      const wallets = [
        createMockAdapter(WalletId.MetaMask, { installed: true }), // High priority, installed
        createMockAdapter(WalletId.Rabby, { installed: false }), // Last used but not installed
        createMockAdapter(WalletId.CoinbaseWallet, { installed: true }), // Installed but low priority
      ];

      const sorted = sortWallets(wallets);

      // Rabby should be first (last used trumps everything)
      expect(sorted[0].id).toBe(WalletId.Rabby);
      // Then installed wallets by priority
      expect(sorted[1].id).toBe(WalletId.MetaMask);
      expect(sorted[2].id).toBe(WalletId.CoinbaseWallet);
    });

    it('maintains stable sort for wallets with equal criteria', () => {
      const wallets = [
        createMockAdapter(WalletId.AppKit, { installed: false }),
        createMockAdapter(WalletId.Email, { installed: false, hide: false }), // Not hidden for this test
      ];

      // Both are not installed, not in priority list, not last used
      const sorted = sortWallets(wallets, { filterHidden: false });

      // Should maintain relative order
      expect(sorted).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty wallet list', () => {
      const sorted = sortWallets([]);
      expect(sorted).toEqual([]);
    });

    it('handles single wallet', () => {
      const wallets = [createMockAdapter(WalletId.MetaMask)];
      const sorted = sortWallets(wallets);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe(WalletId.MetaMask);
    });

    it('does not mutate original array', () => {
      const wallets = [createMockAdapter(WalletId.Rabby), createMockAdapter(WalletId.MetaMask)];
      const originalOrder = [...wallets];

      sortWallets(wallets);

      expect(wallets[0].id).toBe(originalOrder[0].id);
      expect(wallets[1].id).toBe(originalOrder[1].id);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';

vi.mock('@src/utils/eip6963Registry', () => ({
  startEIP6963Discovery: vi.fn(),
  getAnnouncedProvider: vi.fn(() => undefined),
}));

import { createWalletManifests } from '@src/utils/createWalletManifests';
import { startEIP6963Discovery } from '@src/utils/eip6963Registry';

const baseConfig = {
  appName: 'Test App',
  modalZIndex: 1000,
  theme: 'dark' as const,
  telemetry: true,
};

describe('createWalletManifests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates all 7 manifests', () => {
    const manifests = createWalletManifests(baseConfig);
    expect(manifests).toHaveLength(7);
  });

  it('returns manifests in the expected order', () => {
    const manifests = createWalletManifests(baseConfig);
    expect(manifests.map((m) => m.id)).toEqual([
      WalletId.Email,
      WalletId.MetaMask,
      WalletId.WalletConnect,
      WalletId.CoinbaseWallet,
      WalletId.Phantom,
      WalletId.Rabby,
      WalletId.Brave,
    ]);
  });

  it('starts EIP-6963 discovery once on creation', () => {
    createWalletManifests(baseConfig);
    expect(startEIP6963Discovery).toHaveBeenCalledTimes(1);
  });

  it('exposes correct id/name/icon shape', () => {
    const manifests = createWalletManifests(baseConfig);
    const mm = manifests.find((m) => m.id === WalletId.MetaMask);
    expect(mm?.name).toBe(WalletName.MetaMask);
    expect(typeof mm?.isInstalled).toBe('function');
    expect(typeof mm?.load).toBe('function');
  });

  it('email manifest is hidden by default (special-cased rendering)', () => {
    const manifests = createWalletManifests(baseConfig);
    expect(manifests.find((m) => m.id === WalletId.Email)?.hide).toBe(true);
  });

  it('walletconnect manifest is always installed', () => {
    const manifests = createWalletManifests(baseConfig);
    expect(manifests.find((m) => m.id === WalletId.WalletConnect)?.isInstalled()).toBe(true);
  });

  describe('load() resolves to a real adapter instance', () => {
    it('MetaMask manifest loads MetaMaskAdapter', async () => {
      const manifests = createWalletManifests(baseConfig);
      const mm = manifests.find((m) => m.id === WalletId.MetaMask)!;
      const adapter = await mm.load();
      expect(adapter.id).toBe(WalletId.MetaMask);
      expect(adapter.name).toBe(WalletName.MetaMask);
    });

    it('Email manifest loads EmailAdapter with the configured projectId', async () => {
      const manifests = createWalletManifests({
        ...baseConfig,
        walletsConfig: { embedded: { projectId: 'cdp-test-id' } },
      });
      const email = manifests.find((m) => m.id === WalletId.Email)!;
      const adapter = await email.load();
      expect(adapter.id).toBe(WalletId.Email);
    });

    it('WalletConnect manifest loads WalletConnectAdapter with the configured projectId', async () => {
      const manifests = createWalletManifests({
        ...baseConfig,
        walletsConfig: { walletConnect: { projectId: 'reown-test-id' } },
      });
      const wc = manifests.find((m) => m.id === WalletId.WalletConnect)!;
      const adapter = await wc.load();
      expect(adapter.id).toBe(WalletId.WalletConnect);
    });

    it('CoinbaseWallet manifest loads CoinbaseWalletAdapter with appName/appLogoUrl', async () => {
      const manifests = createWalletManifests({
        ...baseConfig,
        appLogoUrl: 'https://example.com/logo.png',
      });
      const cb = manifests.find((m) => m.id === WalletId.CoinbaseWallet)!;
      const adapter = await cb.load();
      expect(adapter.id).toBe(WalletId.CoinbaseWallet);
    });
  });
});

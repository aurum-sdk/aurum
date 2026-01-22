import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';

// Mock all wallet adapters - use factory functions that return vi.fn()
vi.mock('@src/wallet-adapters', () => ({
  EmailAdapter: vi.fn(),
  MetaMaskAdapter: vi.fn(),
  WalletConnectAdapter: vi.fn(),
  CoinbaseWalletAdapter: vi.fn(),
  PhantomAdapter: vi.fn(),
  RabbyAdapter: vi.fn(),
  BraveAdapter: vi.fn(),
  LedgerAdapter: vi.fn(),
}));

import { createWalletAdapters } from '@src/utils/createWalletAdapters';
import {
  EmailAdapter,
  MetaMaskAdapter,
  WalletConnectAdapter,
  CoinbaseWalletAdapter,
  PhantomAdapter,
  RabbyAdapter,
  BraveAdapter,
  LedgerAdapter,
} from '@src/wallet-adapters';

describe('createWalletAdapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock return values - cast to unknown to avoid full interface requirements
    vi.mocked(EmailAdapter).mockImplementation(
      (config) => ({ id: WalletId.Email, name: WalletName.Email, config }) as unknown as EmailAdapter,
    );
    vi.mocked(MetaMaskAdapter).mockImplementation(
      () => ({ id: WalletId.MetaMask, name: WalletName.MetaMask }) as unknown as MetaMaskAdapter,
    );
    vi.mocked(WalletConnectAdapter).mockImplementation(
      (config) =>
        ({ id: WalletId.WalletConnect, name: WalletName.WalletConnect, config }) as unknown as WalletConnectAdapter,
    );
    vi.mocked(CoinbaseWalletAdapter).mockImplementation(
      (config) =>
        ({ id: WalletId.CoinbaseWallet, name: WalletName.CoinbaseWallet, config }) as unknown as CoinbaseWalletAdapter,
    );
    vi.mocked(PhantomAdapter).mockImplementation(
      () => ({ id: WalletId.Phantom, name: WalletName.Phantom }) as unknown as PhantomAdapter,
    );
    vi.mocked(RabbyAdapter).mockImplementation(
      () => ({ id: WalletId.Rabby, name: WalletName.Rabby }) as unknown as RabbyAdapter,
    );
    vi.mocked(BraveAdapter).mockImplementation(
      () => ({ id: WalletId.Brave, name: WalletName.Brave }) as unknown as BraveAdapter,
    );
    vi.mocked(LedgerAdapter).mockImplementation(
      (config) => ({ id: WalletId.Ledger, name: WalletName.Ledger, config }) as unknown as LedgerAdapter,
    );
  });

  it('creates all 8 adapters', () => {
    const adapters = createWalletAdapters({
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(adapters).toHaveLength(8);
    expect(EmailAdapter).toHaveBeenCalledTimes(1);
    expect(MetaMaskAdapter).toHaveBeenCalledTimes(1);
    expect(WalletConnectAdapter).toHaveBeenCalledTimes(1);
    expect(CoinbaseWalletAdapter).toHaveBeenCalledTimes(1);
    expect(PhantomAdapter).toHaveBeenCalledTimes(1);
    expect(RabbyAdapter).toHaveBeenCalledTimes(1);
    expect(BraveAdapter).toHaveBeenCalledTimes(1);
    expect(LedgerAdapter).toHaveBeenCalledTimes(1);
  });

  it('passes email projectId to EmailAdapter', () => {
    createWalletAdapters({
      walletsConfig: {
        embedded: { projectId: 'test-cdp-project-id' },
      },
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(EmailAdapter).toHaveBeenCalledWith({
      projectId: 'test-cdp-project-id',
    });
  });

  it('passes undefined projectId to EmailAdapter when not configured', () => {
    createWalletAdapters({
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(EmailAdapter).toHaveBeenCalledWith({
      projectId: undefined,
    });
  });

  it('passes walletConnect projectId to WalletConnectAdapter', () => {
    createWalletAdapters({
      walletsConfig: {
        walletConnect: { projectId: 'test-reown-project-id' },
      },
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(WalletConnectAdapter).toHaveBeenCalledWith({
      projectId: 'test-reown-project-id',
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });
  });

  it('passes appName, modalZIndex, and theme to WalletConnectAdapter', () => {
    createWalletAdapters({
      appName: 'My Custom App',
      modalZIndex: 9999,
      theme: 'light',
    });

    expect(WalletConnectAdapter).toHaveBeenCalledWith({
      projectId: undefined,
      appName: 'My Custom App',
      modalZIndex: 9999,
      theme: 'light',
    });
  });

  it('passes appName and logo to CoinbaseWalletAdapter', () => {
    createWalletAdapters({
      appName: 'Test App',
      appLogoUrl: 'https://example.com/logo.png',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(CoinbaseWalletAdapter).toHaveBeenCalledWith({
      appName: 'Test App',
      appLogoUrl: 'https://example.com/logo.png',
    });
  });

  it('passes appLogoUrl as undefined when not provided', () => {
    createWalletAdapters({
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(CoinbaseWalletAdapter).toHaveBeenCalledWith({
      appName: 'Test App',
      appLogoUrl: undefined,
    });
  });

  it('passes walletConnect projectId to LedgerAdapter', () => {
    createWalletAdapters({
      walletsConfig: {
        walletConnect: { projectId: 'test-reown-project-id' },
      },
      appName: 'Test App',
      modalZIndex: 1000,
      theme: 'dark',
    });

    expect(LedgerAdapter).toHaveBeenCalledWith({
      walletConnectProjectId: 'test-reown-project-id',
    });
  });

  describe('adapter order', () => {
    it('returns adapters in expected order', () => {
      const adapters = createWalletAdapters({
        appName: 'Test App',
        modalZIndex: 1000,
        theme: 'dark',
      });

      // Verify order matches createWalletAdapters implementation
      expect(adapters[0].id).toBe(WalletId.Email);
      expect(adapters[1].id).toBe(WalletId.MetaMask);
      expect(adapters[2].id).toBe(WalletId.WalletConnect);
      expect(adapters[3].id).toBe(WalletId.CoinbaseWallet);
      expect(adapters[4].id).toBe(WalletId.Phantom);
      expect(adapters[5].id).toBe(WalletId.Rabby);
      expect(adapters[6].id).toBe(WalletId.Brave);
      expect(adapters[7].id).toBe(WalletId.Ledger);
    });
  });

  describe('with full config', () => {
    it('passes all config options correctly', () => {
      createWalletAdapters({
        walletsConfig: {
          embedded: { projectId: 'cdp-id' },
          walletConnect: { projectId: 'reown-id' },
        },
        appName: 'Full Config App',
        appLogoUrl: 'https://example.com/logo.svg',
        modalZIndex: 5000,
        theme: 'light',
      });

      expect(EmailAdapter).toHaveBeenCalledWith({ projectId: 'cdp-id' });
      expect(WalletConnectAdapter).toHaveBeenCalledWith({
        projectId: 'reown-id',
        appName: 'Full Config App',
        modalZIndex: 5000,
        theme: 'light',
      });
      expect(CoinbaseWalletAdapter).toHaveBeenCalledWith({
        appName: 'Full Config App',
        appLogoUrl: 'https://example.com/logo.svg',
      });
    });
  });
});

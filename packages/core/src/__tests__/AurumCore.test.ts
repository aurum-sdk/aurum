import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { AurumConfig } from '@aurum-sdk/types';
import { WalletId } from '@aurum-sdk/types';

// Mock dependencies before importing AurumCore
vi.mock('@src/services/sentry', () => ({
  initSentry: vi.fn(),
  sentryLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@src/store', () => ({
  useAurumStore: {
    getState: vi.fn(() => ({
      isConnected: false,
      walletId: null,
      address: null,
      walletName: null,
      email: null,
      setConnection: vi.fn(),
      clearConnection: vi.fn(),
    })),
    persist: {
      hasHydrated: vi.fn(() => true),
      onFinishHydration: vi.fn(),
    },
  },
  waitForStoreHydration: vi.fn(() => Promise.resolve()),
}));

vi.mock('@src/utils/createWalletAdapters', () => ({
  createWalletAdapters: vi.fn(() => []),
}));

vi.mock('@src/components/ConnectModal/renderConnectModal', () => ({
  renderConnectModal: vi.fn(),
}));

import { initSentry } from '@src/services/sentry';
import { createWalletAdapters } from '@src/utils/createWalletAdapters';

describe('AurumCore', () => {
  // Reset singleton before each test
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  const getAurumCore = async () => {
    const { AurumCore } = await import('@src/AurumCore');
    return AurumCore;
  };

  describe('resolveBrandConfig', () => {
    it('uses dark theme defaults when no brand config provided', async () => {
      const AurumCore = await getAurumCore();
      const _core = new AurumCore({});

      // Verify createWalletAdapters was called with dark theme defaults
      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'Aurum',
          theme: 'dark',
          modalZIndex: 1000,
        }),
      );
    });

    it('uses light theme defaults for light theme', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        brand: { theme: 'light' },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'light',
        }),
      );
    });

    it('respects custom modalZIndex', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        brand: { modalZIndex: 9999 },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          modalZIndex: 9999,
        }),
      );
    });

    it('respects custom appName', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        brand: { appName: 'My Custom App' },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'My Custom App',
        }),
      );
    });

    it('respects custom logo', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        brand: { logo: 'https://example.com/logo.png' },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          appLogoUrl: 'https://example.com/logo.png',
        }),
      );
    });

    it('handles partial brand config merging with defaults', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        brand: {
          appName: 'Partial App',
          // Other values should use defaults
        },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'Partial App',
          theme: 'dark', // default
          modalZIndex: 1000, // default
        }),
      );
    });
  });

  describe('telemetry option', () => {
    it('enables Sentry when telemetry is undefined (default)', async () => {
      const AurumCore = await getAurumCore();
      new AurumCore({});

      expect(initSentry).toHaveBeenCalledWith(true);
    });

    it('enables Sentry when telemetry is true', async () => {
      const AurumCore = await getAurumCore();
      new AurumCore({ telemetry: true });

      expect(initSentry).toHaveBeenCalledWith(true);
    });

    it('disables Sentry when telemetry is false', async () => {
      const AurumCore = await getAurumCore();
      new AurumCore({ telemetry: false });

      expect(initSentry).toHaveBeenCalledWith(false);
    });
  });

  describe('wallet exclusion', () => {
    it('accepts various exclude configurations', async () => {
      // Test with WalletId enum values
      let AurumCore = await getAurumCore();
      expect(() => new AurumCore({ wallets: { exclude: [WalletId.Email, WalletId.AppKit] } })).not.toThrow();

      vi.resetModules();
      vi.clearAllMocks();

      // Test with empty array
      AurumCore = await getAurumCore();
      expect(() => new AurumCore({ wallets: { exclude: [] } })).not.toThrow();

      vi.resetModules();
      vi.clearAllMocks();

      // Test with string literals
      AurumCore = await getAurumCore();
      expect(() => new AurumCore({ wallets: { exclude: ['email', 'appkit'] as `${WalletId}`[] } })).not.toThrow();
    });
  });

  describe('wallets config', () => {
    it('passes email projectId to wallet adapters', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        wallets: {
          embedded: { projectId: 'test-cdp-project-id' },
        },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          walletsConfig: expect.objectContaining({
            embedded: { projectId: 'test-cdp-project-id' },
          }),
        }),
      );
    });

    it('passes walletConnect projectId to wallet adapters', async () => {
      const AurumCore = await getAurumCore();
      const config: AurumConfig = {
        wallets: {
          walletConnect: { projectId: 'test-reown-project-id' },
        },
      };
      new AurumCore(config);

      expect(createWalletAdapters).toHaveBeenCalledWith(
        expect.objectContaining({
          walletsConfig: expect.objectContaining({
            walletConnect: { projectId: 'test-reown-project-id' },
          }),
        }),
      );
    });
  });

  describe('updateBrandConfig', () => {
    it('accepts partial brand config updates without throwing', async () => {
      const AurumCore = await getAurumCore();
      const core = new AurumCore({
        brand: { appName: 'Original App', theme: 'dark', primaryColor: '#FF0000' },
      });

      // Should not throw when updating various config options
      expect(() => core.updateBrandConfig({ theme: 'light' })).not.toThrow();
      expect(() => core.updateBrandConfig({ appName: 'Updated App' })).not.toThrow();
      expect(() => core.updateBrandConfig({ modalZIndex: 5000 })).not.toThrow();
    });
  });

  describe('updateWalletsConfig', () => {
    it('accepts wallet config updates without throwing', async () => {
      const AurumCore = await getAurumCore();
      const core = new AurumCore({
        wallets: { exclude: [WalletId.Email, WalletId.AppKit] },
      });

      // Should not throw when updating exclusions
      expect(() => core.updateWalletsConfig({ exclude: [WalletId.Email] })).not.toThrow();
      expect(() => core.updateWalletsConfig({ exclude: [] })).not.toThrow();
      expect(() => core.updateWalletsConfig({})).not.toThrow();
    });
  });

  describe('singleton behavior', () => {
    it('returns same instance when constructed multiple times', async () => {
      const AurumCore = await getAurumCore();
      const core1 = new AurumCore({ brand: { appName: 'First' } });
      const core2 = new AurumCore({ brand: { appName: 'Second' } });

      // Both should be the same instance
      expect(core1).toBe(core2);
    });
  });
});

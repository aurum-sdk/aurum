import type { AppKit } from '@reown/appkit';
import type { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sentryLogger } from '@src/services/sentry';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { createConfigError } from '@src/utils/isConfigError';

interface AppKitConfig {
  projectId?: string;
  appName: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
}

export class AppKitAdapter implements WalletAdapter {
  readonly id = WalletId.AppKit;
  readonly name = WalletName.AppKit;
  readonly icon = getLogoDataUri(WalletId.AppKit, 'brand') ?? '';
  readonly hide = true;
  readonly downloadUrl = null;
  readonly wcDeepLinkUrl = null;

  private modal: AppKit | null = null;
  private wagmiAdapter: WagmiAdapter | null = null;
  private provider: AurumRpcProvider | null = null;
  private address: string | null = null;
  private config: AppKitConfig;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private unsubscribeFunctions: Array<() => void> = [];
  private initPromise: Promise<void> | null = null;

  constructor(config: AppKitConfig) {
    this.config = {
      projectId: config.projectId,
      appName: config.appName,
      modalZIndex: config.modalZIndex,
      theme: config.theme,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.modal) return;
    if (!this.initPromise) {
      this.initPromise = this.initializeAppKit();
    }
    await this.initPromise;
  }

  private async initializeAppKit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const [{ createAppKit }, { WagmiAdapter }, { mainnet }] = await Promise.all([
      import('@reown/appkit'),
      import('@reown/appkit-adapter-wagmi'),
      import('@reown/appkit/networks'),
    ]);

    const networks = [mainnet];

    this.wagmiAdapter = new WagmiAdapter({
      projectId: this.config.projectId!,
      networks,
      ssr: true,
    });

    this.modal = createAppKit({
      adapters: [this.wagmiAdapter],
      networks: networks as [typeof mainnet],
      projectId: this.config.projectId!,
      metadata: {
        name: this.config.appName,
        description: this.config.appName,
        url: window.location.origin,
        icons: [],
      },
      allowUnsupportedChain: true,
      themeMode: this.config.theme,
      themeVariables: {
        '--apkt-z-index': this.config.modalZIndex + 1,
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.modal) return;

    const unsubscribeProviders = this.modal.subscribeProviders((state) => {
      const eip155Provider = (state as Record<string, AurumRpcProvider | undefined>)['eip155'];
      this.provider = eip155Provider || null;
      if (!eip155Provider) {
        this.address = null;
      }
    });
    this.unsubscribeFunctions.push(unsubscribeProviders);
  }

  private syncAddressFromWagmi(): void {
    if (!this.wagmiAdapter?.wagmiConfig) return;

    const { state } = this.wagmiAdapter.wagmiConfig;
    if (state.current && state.connections) {
      const connection = state.connections.get(state.current);
      if (connection?.accounts?.[0]) {
        this.address = connection.accounts[0];
      }
    }
  }

  private async syncProviderFromModal(): Promise<void> {
    if (!this.modal) return;

    try {
      // Try to get providers directly from modal
      const getProvidersFn = (this.modal as unknown as { getProviders?: () => Record<string, AurumRpcProvider> })
        .getProviders;
      if (typeof getProvidersFn === 'function') {
        const providers = getProvidersFn.call(this.modal);
        const eip155Provider = providers?.['eip155'];
        if (eip155Provider) {
          this.provider = eip155Provider;
          return;
        }
      }

      // Fallback: try to get provider from wagmi connector
      if (this.wagmiAdapter?.wagmiConfig) {
        const { state } = this.wagmiAdapter.wagmiConfig;
        if (state.current && state.connections) {
          const connection = state.connections.get(state.current);
          const connector = connection?.connector;
          if (connector && typeof connector.getProvider === 'function') {
            try {
              const provider = await connector.getProvider();
              if (provider) {
                this.provider = provider as AurumRpcProvider;
              }
            } catch (error) {
              sentryLogger.warn('Failed to get provider from wagmi connector', { error });
            }
          }
        }
      }
    } catch (error) {
      sentryLogger.warn('Failed to get provider from AppKit', { error });
    }
  }

  isInstalled(): boolean {
    return true;
  }

  async connect(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) {
      throw createConfigError('AppKit');
    }

    await this.ensureInitialized();

    if (!this.modal) {
      sentryLogger.error('AppKit is not available');
      throw new Error('AppKit is not available');
    }

    // Check if AppKit already has a wallet connected
    const existingAddress = this.modal.getAddress();
    if (this.modal.getIsConnectedState() && existingAddress) {
      await this.syncProviderFromModal();
      if (this.provider) {
        this.address = existingAddress;
        return {
          address: existingAddress,
          provider: this.provider,
          walletId: this.id,
        };
      }
      // If we can't get provider, disconnect and reconnect fresh
      await this.disconnect();
    }

    this.modal.open({ view: 'Connect' });

    return await this.waitForConnection();
  }

  private waitForConnection(timeout = 60000): Promise<WalletConnectionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let unsubscribeState: (() => void) | null = null;
      let isResolved = false;

      const cleanup = () => {
        unsubscribeState?.();
      };

      const checkConnection = async (): Promise<boolean> => {
        if (isResolved) return true;

        this.syncAddressFromWagmi();

        // If we have address but no provider, try to get it directly
        if (this.address && !this.provider) {
          await this.syncProviderFromModal();
        }

        if (this.provider && this.address) {
          try {
            const accounts = (await this.provider.request({ method: 'eth_accounts' })) as string[];
            if (accounts && accounts.length > 0) {
              isResolved = true;
              cleanup();
              // Close the modal after successful connection
              this.modal?.close();
              resolve({
                address: this.address,
                provider: this.provider,
                walletId: this.id,
              });
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }
        return false;
      };

      // Watch for modal state changes
      unsubscribeState = this.modal!.subscribeState(async (state: { open: boolean }) => {
        if (await checkConnection()) return;

        // Modal closed without connection = user rejected
        if (state.open === false && !this.address && !isResolved) {
          cleanup();
          reject(new Error('Connection rejected by user'));
        }
      });

      // Polling fallback for timeout
      const pollTimeout = async () => {
        if (await checkConnection()) return;

        if (Date.now() - startTime > timeout) {
          cleanup();
          reject(new Error('Connection timeout'));
          return;
        }

        setTimeout(pollTimeout, 500);
      };

      pollTimeout();
    });
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    await this.ensureInitialized();

    if (!this.modal || !this.wagmiAdapter) return null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const wagmiConfig = this.wagmiAdapter.wagmiConfig;
      if (wagmiConfig?.state?.current && wagmiConfig.state.connections) {
        const connection = wagmiConfig.state.connections.get(wagmiConfig.state.current);
        if (connection?.accounts?.[0]) {
          this.address = connection.accounts[0];

          if (this.provider && this.address) {
            return {
              address: this.address,
              provider: this.provider,
              walletId: this.id,
            };
          }
        }
      }

      return null;
    } catch {
      // sentryLogger.warn('Failed to restore connection to AppKit', { error });
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.modal) {
      this.address = null;
      this.provider = null;
      return;
    }

    await this.modal.disconnect('eip155' as Parameters<typeof this.modal.disconnect>[0]);

    // Wait for AppKit state to clear (required due to async state updates)
    const timeout = Date.now() + 2000;
    while (Date.now() < timeout && (this.modal.getIsConnectedState() || this.modal.getAddress())) {
      await new Promise((r) => setTimeout(r, 100));
    }
    this.address = null;
    this.provider = null;
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider;
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (!this.provider?.on) return;

    if (this.accountsChangedCallback) {
      this.provider.removeListener?.('accountsChanged', this.accountsChangedCallback);
    }

    this.accountsChangedCallback = (accounts: string[]) => {
      this.address = accounts[0] || null;
      callback(accounts);
    };

    this.provider.on('accountsChanged', this.accountsChangedCallback);
  }

  removeListeners(): void {
    if (this.provider?.removeListener && this.accountsChangedCallback) {
      this.provider.removeListener('accountsChanged', this.accountsChangedCallback);
      this.accountsChangedCallback = null;
    }

    this.unsubscribeFunctions.forEach((unsub) => unsub());
    this.unsubscribeFunctions = [];
  }
}

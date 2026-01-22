import type { AppKit } from '@reown/appkit';
import type { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sentryLogger } from '@src/services/sentry';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { createConfigError } from '@src/utils/isConfigError';
import { WALLETCONNECT_NAMESPACE } from '@src/constants/adapters';

type UniversalProvider = Awaited<ReturnType<AppKit['getUniversalProvider']>>;

interface WalletConnectConfig {
  projectId?: string;
  appName: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
}

export interface WalletConnectSession {
  uri: string;
  waitForConnection: () => Promise<WalletConnectionResult>;
}

export class WalletConnectAdapter implements WalletAdapter {
  readonly id = WalletId.WalletConnect;
  readonly name = WalletName.WalletConnect;
  readonly icon = getLogoDataUri(WalletId.WalletConnect, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = null;
  readonly wcDeepLinkUrl = null;

  private modal: AppKit | null = null;
  private wagmiAdapter: WagmiAdapter | null = null;
  private universalProvider: UniversalProvider | null = null;
  private provider: AurumRpcProvider | null = null;
  private address: string | null = null;
  private config: WalletConnectConfig;
  private connectionUri: string | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private sessionUpdateHandler:
    | ((args: { params: { namespaces: Record<string, { accounts?: string[] }> } }) => void)
    | null = null;
  private unsubscribeFunctions: Array<() => void> = [];
  private initPromise: Promise<void> | null = null;
  private lastKnownAccounts: string[] = [];

  constructor(config: WalletConnectConfig) {
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

    // Get UniversalProvider for custom QR code flows
    this.universalProvider = (await this.modal.getUniversalProvider()) ?? null;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.modal) return;

    // Subscribe to provider changes
    const unsubscribeProviders = this.modal.subscribeProviders((state) => {
      const eip155Provider = (state as Record<string, AurumRpcProvider | undefined>)['eip155'];
      this.provider = eip155Provider || null;
      if (!eip155Provider) {
        this.address = null;
      }
    });
    this.unsubscribeFunctions.push(unsubscribeProviders);

    // Listen for WalletConnect URI events from UniversalProvider
    if (this.universalProvider) {
      this.universalProvider.on('display_uri', (uri: string) => {
        this.connectionUri = uri;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('walletconnect:uri', { detail: { uri } }));
        }
      });

      this.universalProvider.on('session_delete', () => {
        this.connectionUri = null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('walletconnect:disconnect'));
        }
      });
    }
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
      sentryLogger.warn('Failed to get provider from WalletConnect', { error });
    }
  }

  isInstalled(): boolean {
    return true;
  }

  getConnectionUri(): string | null {
    return this.connectionUri;
  }

  /**
   * Resets any existing connection state to ensure a fresh connection flow.
   * Called at the start of connect(), startSession(), and openModal().
   */
  private async resetConnectionState(): Promise<void> {
    // Reset local state
    this.connectionUri = null;
    this.address = null;
    this.lastKnownAccounts = [];

    // Disconnect all wagmi connectors
    if (this.wagmiAdapter?.wagmiConfig) {
      try {
        const { state } = this.wagmiAdapter.wagmiConfig;
        if (state.current && state.connections) {
          const connection = state.connections.get(state.current);
          const connector = connection?.connector;
          if (connector && typeof connector.disconnect === 'function') {
            await connector.disconnect();
          }
        }
      } catch {
        // Ignore wagmi disconnect errors
      }
    }

    // Disconnect from AppKit/WalletConnect if connected
    if (this.modal?.getIsConnectedState()) {
      try {
        await this.modal.disconnect('eip155' as Parameters<typeof this.modal.disconnect>[0]);
      } catch {
        // Ignore disconnect errors
      }
    }

    // Also disconnect UniversalProvider session if active
    if (this.universalProvider?.session) {
      try {
        await this.universalProvider.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }

    // Wait briefly for all state to clear
    await new Promise((r) => setTimeout(r, 200));

    this.provider = null;
  }

  /**
   * Connects via WalletConnect QR code flow.
   * Emits walletconnect:uri event for QR code display.
   * Used when user clicks WalletConnect button on desktop.
   */
  async connect(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) {
      throw createConfigError('WalletConnect');
    }

    await this.ensureInitialized();

    if (!this.modal || !this.universalProvider) {
      sentryLogger.error('connect: WalletConnect is not available');
      throw new Error('WalletConnect is not available');
    }

    // Reset any existing connection for a fresh start
    await this.resetConnectionState();

    try {
      // Connect via UniversalProvider - this triggers display_uri event
      const session = await this.universalProvider.connect({
        namespaces: WALLETCONNECT_NAMESPACE,
      });

      if (!session) {
        throw new Error('Failed to establish WalletConnect session');
      }

      // Extract accounts from session
      const accounts = session.namespaces?.eip155?.accounts || [];
      const address = accounts[0]?.split(':')[2]; // Format: "eip155:1:0x..."

      if (!address) {
        sentryLogger.error('connect: No accounts returned from WalletConnect');
        throw new Error('No accounts returned from WalletConnect');
      }

      // Update provider reference
      this.provider = this.universalProvider as unknown as AurumRpcProvider;
      this.address = address;
      this.lastKnownAccounts = [address];

      return {
        address,
        provider: this.provider,
        walletId: this.id,
      };
    } catch {
      this.connectionUri = null;
      throw new Error('Failed to connect to WalletConnect');
    }
  }

  /**
   * Starts a WalletConnect session for headless/custom QR code flows.
   * Returns the URI immediately and a function to wait for the connection.
   */
  async startSession(timeout = 10000): Promise<WalletConnectSession> {
    if (!this.config.projectId) {
      throw new Error('WalletConnect projectId is required');
    }

    await this.ensureInitialized();

    if (!this.modal || !this.universalProvider) {
      sentryLogger.error('startSession: WalletConnect is not available');
      throw new Error('WalletConnect is not available');
    }

    // Reset any existing connection for a fresh start
    await this.resetConnectionState();

    // Create a promise that resolves when URI is generated
    const uriPromise = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for WalletConnect URI'));
      }, timeout);

      const handleUri = (uri: string) => {
        clearTimeout(timeoutId);
        this.connectionUri = uri;
        resolve(uri);
      };

      // Listen for display_uri event
      this.universalProvider!.once('display_uri', handleUri);
    });

    // Start connection process
    const connectionPromise = (async (): Promise<WalletConnectionResult> => {
      const session = await this.universalProvider!.connect({
        namespaces: WALLETCONNECT_NAMESPACE,
      });

      if (!session) {
        throw new Error('Failed to establish WalletConnect session');
      }

      // Extract accounts from session
      const accounts = session.namespaces?.eip155?.accounts || [];
      const address = accounts[0]?.split(':')[2];

      if (!address) {
        sentryLogger.error('startSession: No accounts returned from WalletConnect');
        throw new Error('No accounts returned from WalletConnect');
      }

      // Update provider reference
      this.provider = this.universalProvider as unknown as AurumRpcProvider;
      this.address = address;
      this.lastKnownAccounts = [address];

      return {
        address,
        provider: this.provider,
        walletId: this.id,
      };
    })();

    // Wait for URI to be generated
    const uri = await uriPromise;

    return {
      uri,
      waitForConnection: async () => {
        try {
          return await connectionPromise;
        } catch {
          this.connectionUri = null;
          throw new Error('Failed to connect via WalletConnect');
        }
      },
    };
  }

  /**
   * Opens the AppKit modal for wallet selection.
   * Used on mobile and when user clicks "Open Modal" button on QR code page.
   * Modal close is handled silently - does not throw.
   */
  async openModal(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) {
      throw createConfigError('WalletConnect');
    }

    await this.ensureInitialized();

    if (!this.modal) {
      sentryLogger.error('openModal: AppKit is not available');
      throw new Error('AppKit is not available');
    }

    // Reset any existing connection for a fresh start
    await this.resetConnectionState();

    this.modal.open({ view: 'AllWallets' });

    return await this.waitForModalConnection();
  }

  private waitForModalConnection(timeout = 60000): Promise<WalletConnectionResult> {
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
              this.lastKnownAccounts = accounts;
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

        // Modal closed without connection - silently reject (user can still use QR code)
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
          this.lastKnownAccounts = [...connection.accounts];

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
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.modal) {
      this.address = null;
      this.provider = null;
      this.connectionUri = null;
      this.lastKnownAccounts = [];
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
    this.connectionUri = null;
    this.lastKnownAccounts = [];
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider;
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (!this.provider?.on) return;

    // Remove existing listeners if any
    if (this.accountsChangedCallback) {
      this.provider.removeListener?.('accountsChanged', this.accountsChangedCallback);
    }
    if (this.sessionUpdateHandler && this.universalProvider) {
      this.universalProvider.removeListener?.('session_update', this.sessionUpdateHandler);
    }

    // Store initial accounts
    this.lastKnownAccounts =
      this.lastKnownAccounts.length > 0 ? this.lastKnownAccounts : this.address ? [this.address] : [];

    this.accountsChangedCallback = (accounts: string[]) => {
      this.address = accounts[0] || null;
      this.lastKnownAccounts = accounts;
      callback(accounts);
    };

    this.provider.on('accountsChanged', this.accountsChangedCallback);

    // Also listen on UniversalProvider for session_update (WalletConnect v2 specific)
    if (this.universalProvider) {
      this.sessionUpdateHandler = (args) => {
        const namespaces = args?.params?.namespaces;
        if (!namespaces) return;

        // Extract accounts from all namespaces (typically eip155)
        const allAccounts: string[] = [];
        Object.values(namespaces).forEach((ns) => {
          if (ns.accounts) {
            // Accounts are in format "eip155:1:0x..." - extract the address
            ns.accounts.forEach((account) => {
              const parts = account.split(':');
              if (parts.length >= 3) {
                allAccounts.push(parts[2]);
              }
            });
          }
        });

        // Deduplicate and check if accounts changed
        const uniqueAccounts = [...new Set(allAccounts)];
        const accountsChanged =
          uniqueAccounts.length !== this.lastKnownAccounts.length ||
          uniqueAccounts.some((acc, i) => acc.toLowerCase() !== this.lastKnownAccounts[i]?.toLowerCase());

        if (accountsChanged && uniqueAccounts.length > 0) {
          this.lastKnownAccounts = uniqueAccounts;
          this.address = uniqueAccounts[0] || null;
          callback(uniqueAccounts);
        }
      };
      this.universalProvider.on('session_update', this.sessionUpdateHandler);
    }
  }

  removeListeners(): void {
    if (this.provider?.removeListener && this.accountsChangedCallback) {
      this.provider.removeListener('accountsChanged', this.accountsChangedCallback);
      this.accountsChangedCallback = null;
    }

    if (this.universalProvider?.removeListener && this.sessionUpdateHandler) {
      this.universalProvider.removeListener('session_update', this.sessionUpdateHandler);
      this.sessionUpdateHandler = null;
    }

    this.unsubscribeFunctions.forEach((unsub) => unsub());
    this.unsubscribeFunctions = [];
    this.lastKnownAccounts = [];
  }
}

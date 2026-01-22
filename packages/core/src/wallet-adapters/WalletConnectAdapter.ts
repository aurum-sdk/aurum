import type { AppKit } from '@reown/appkit';
import type { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sentryLogger } from '@src/services/sentry';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { createConfigError } from '@src/utils/isConfigError';
import { WALLETCONNECT_NAMESPACE } from '@src/constants/adapters';

type UniversalProvider = Awaited<ReturnType<AppKit['getUniversalProvider']>>;
type SessionNamespaces = { eip155?: { accounts?: string[] } };

interface WalletConnectConfig {
  projectId?: string;
  appName: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
  telemetry?: boolean;
}

export interface WalletConnectSession {
  uri: string;
  waitForConnection: () => Promise<WalletConnectionResult>;
}

/** Extracts the first address from WalletConnect session namespaces */
function extractAddressFromSession(namespaces: SessionNamespaces | undefined): string | null {
  const accounts = namespaces?.eip155?.accounts || [];
  const firstAccount = accounts[0]; // Format: "eip155:1:0x..."
  return firstAccount?.split(':')[2] ?? null;
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
  private chainChangedCallback: ((chainId: string | number) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;
  private sessionUpdateHandler: ((args: { params: { namespaces: SessionNamespaces } }) => void) | null = null;
  private unsubscribeFunctions: Array<() => void> = [];
  private initPromise: Promise<void> | null = null;
  private lastKnownAccounts: string[] = [];
  private lastKnownChainId: string | null = null;

  constructor(config: WalletConnectConfig) {
    this.config = config;
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
      features: {
        analytics: this.config.telemetry ?? false,
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

      // Handle remote disconnect (user disconnects from mobile wallet)
      this.universalProvider.on('session_delete', () => {
        this.handleRemoteDisconnect();
      });

      // Also listen for session_expire
      this.universalProvider.on('session_expire', () => {
        this.handleRemoteDisconnect();
      });
    }
  }

  /** Called when user disconnects from the wallet side (mobile app) */
  private handleRemoteDisconnect(): void {
    this.connectionUri = null;
    this.address = null;
    this.provider = null;
    this.lastKnownAccounts = [];
    this.lastKnownChainId = null;

    // Notify listeners about account change (empty accounts = disconnected)
    if (this.accountsChangedCallback) {
      this.accountsChangedCallback([]);
    }

    // Notify disconnect listener
    if (this.disconnectCallback) {
      this.disconnectCallback();
    }

    // Dispatch window event for legacy/custom handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('walletconnect:disconnect'));
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

  /** Resets connection state for a fresh connection flow */
  private async resetConnectionState(): Promise<void> {
    this.connectionUri = null;
    this.address = null;
    this.lastKnownAccounts = [];
    this.lastKnownChainId = null;

    // Disconnect wagmi connector
    try {
      const { state } = this.wagmiAdapter?.wagmiConfig || {};
      const connection = state?.current && state.connections?.get(state.current);
      if (connection && typeof connection !== 'string' && connection.connector?.disconnect) {
        await connection.connector.disconnect();
      }
    } catch {
      /* ignore */
    }

    // Disconnect AppKit
    if (this.modal?.getIsConnectedState()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.modal.disconnect('eip155' as any);
      } catch {
        /* ignore */
      }
    }

    // Disconnect UniversalProvider
    if (this.universalProvider?.session) {
      try {
        await this.universalProvider.disconnect();
      } catch {
        /* ignore */
      }
    }

    await new Promise((r) => setTimeout(r, 200)); // Allow state to clear
    this.provider = null;
  }

  /**
   * Connects via WalletConnect QR code flow.
   * Emits walletconnect:uri event for QR code display.
   */
  async connect(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) throw createConfigError('WalletConnect');
    await this.ensureInitialized();
    if (!this.universalProvider) throw new Error('WalletConnect is not available');

    await this.resetConnectionState();

    try {
      const session = await this.universalProvider.connect({ namespaces: WALLETCONNECT_NAMESPACE });
      if (!session) throw new Error('Failed to establish WalletConnect session');

      const address = extractAddressFromSession(session.namespaces);
      if (!address) throw new Error('No accounts returned from WalletConnect');

      this.provider = this.universalProvider as unknown as AurumRpcProvider;
      this.address = address;
      this.lastKnownAccounts = [address];

      return { address, provider: this.provider, walletId: this.id };
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
    if (!this.config.projectId) throw new Error('WalletConnect projectId is required');
    await this.ensureInitialized();
    if (!this.universalProvider) throw new Error('WalletConnect is not available');

    await this.resetConnectionState();

    // Promise that resolves when URI is generated
    const uriPromise = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Timeout waiting for WalletConnect URI')), timeout);
      this.universalProvider!.once('display_uri', (uri: string) => {
        clearTimeout(timeoutId);
        this.connectionUri = uri;
        resolve(uri);
      });
    });

    // Connection promise runs in parallel
    const connectionPromise = (async (): Promise<WalletConnectionResult> => {
      const session = await this.universalProvider!.connect({ namespaces: WALLETCONNECT_NAMESPACE });
      if (!session) throw new Error('Failed to establish WalletConnect session');

      const address = extractAddressFromSession(session.namespaces);
      if (!address) throw new Error('No accounts returned from WalletConnect');

      this.provider = this.universalProvider as unknown as AurumRpcProvider;
      this.address = address;
      this.lastKnownAccounts = [address];
      return { address, provider: this.provider, walletId: this.id };
    })();

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
   * Used on mobile and when user clicks "Open Modal" button.
   */
  async openModal(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) throw createConfigError('WalletConnect');
    await this.ensureInitialized();
    if (!this.modal) throw new Error('AppKit is not available');

    await this.resetConnectionState();
    this.modal.open({ view: 'AllWallets' });
    return this.waitForModalConnection();
  }

  private waitForModalConnection(timeout = 60000): Promise<WalletConnectionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let unsubscribe: (() => void) | null = null;
      let resolved = false;

      const cleanup = () => unsubscribe?.();

      const checkConnection = async (): Promise<boolean> => {
        if (resolved) return true;
        this.syncAddressFromWagmi();
        if (this.address && !this.provider) await this.syncProviderFromModal();

        if (this.provider && this.address) {
          try {
            const accounts = (await this.provider.request({ method: 'eth_accounts' })) as string[];
            if (accounts?.length) {
              resolved = true;
              cleanup();
              this.modal?.close();
              this.lastKnownAccounts = accounts;
              resolve({ address: this.address, provider: this.provider, walletId: this.id });
              return true;
            }
          } catch {
            /* continue polling */
          }
        }
        return false;
      };

      // Watch modal state
      unsubscribe = this.modal!.subscribeState(async (state: { open: boolean }) => {
        if (await checkConnection()) return;
        if (!state.open && !this.address && !resolved) {
          cleanup();
          reject(new Error('Connection rejected by user'));
        }
      });

      // Polling fallback
      const poll = async () => {
        if (await checkConnection()) return;
        if (Date.now() - startTime > timeout) {
          cleanup();
          reject(new Error('Connection timeout'));
          return;
        }
        setTimeout(poll, 500);
      };
      poll();
    });
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    await this.ensureInitialized();
    if (!this.wagmiAdapter) return null;

    try {
      await new Promise((r) => setTimeout(r, 1000)); // Allow wagmi state to settle

      const { state } = this.wagmiAdapter.wagmiConfig || {};
      const connection = state?.current && state.connections?.get(state.current);
      if (!connection || typeof connection === 'string') return null;

      const address = connection.accounts?.[0];
      if (address && this.provider) {
        this.address = address;
        this.lastKnownAccounts = [...(connection.accounts || [])];
        return { address, provider: this.provider, walletId: this.id };
      }
      return null;
    } catch {
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.modal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.modal.disconnect('eip155' as any);
      // Wait for AppKit state to clear
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline && (this.modal.getIsConnectedState() || this.modal.getAddress())) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    this.address = null;
    this.provider = null;
    this.connectionUri = null;
    this.lastKnownAccounts = [];
    this.lastKnownChainId = null;
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider;
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    // Clean up existing listeners
    if (this.accountsChangedCallback && this.provider?.removeListener) {
      this.provider.removeListener('accountsChanged', this.accountsChangedCallback);
    }
    if (this.sessionUpdateHandler && this.universalProvider?.removeListener) {
      this.universalProvider.removeListener('session_update', this.sessionUpdateHandler);
    }

    if (!this.lastKnownAccounts.length && this.address) this.lastKnownAccounts = [this.address];

    // Always store the callback - needed for handleRemoteDisconnect even if provider isn't ready
    this.accountsChangedCallback = (accounts: string[]) => {
      this.address = accounts[0] || null;
      this.lastKnownAccounts = accounts;
      callback(accounts);
    };

    // Set up provider listener if available
    if (this.provider?.on) {
      this.provider.on('accountsChanged', this.accountsChangedCallback);
    }

    // WalletConnect v2 session_update fallback
    if (this.universalProvider?.on) {
      this.sessionUpdateHandler = (args) => {
        const accounts = this.extractAccountsFromNamespaces(args?.params?.namespaces);
        if (accounts.length && this.hasAccountsChanged(accounts)) {
          this.lastKnownAccounts = accounts;
          this.address = accounts[0];
          callback(accounts);
        }
      };
      this.universalProvider.on('session_update', this.sessionUpdateHandler);
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (!this.provider?.on) return;

    // Clean up existing listener
    if (this.chainChangedCallback) this.provider.removeListener?.('chainChanged', this.chainChangedCallback);

    this.chainChangedCallback = (chainId: string | number) => {
      const normalized = typeof chainId === 'string' ? chainId : `0x${Number(chainId).toString(16)}`;
      // Deduplicate - only fire if chain actually changed
      if (normalized !== this.lastKnownChainId) {
        this.lastKnownChainId = normalized;
        callback(normalized);
      }
    };
    this.provider.on('chainChanged', this.chainChangedCallback);
  }

  /** Called when remote wallet disconnects (user disconnects from mobile app) */
  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  /** Updates the AppKit modal theme */
  updateTheme(theme: 'light' | 'dark'): void {
    this.config.theme = theme;
    // AppKit exposes setThemeMode to update theme after initialization
    if (
      this.modal &&
      typeof (this.modal as unknown as { setThemeMode?: (t: string) => void }).setThemeMode === 'function'
    ) {
      (this.modal as unknown as { setThemeMode: (t: string) => void }).setThemeMode(theme);
    }
  }

  private extractAccountsFromNamespaces(namespaces: SessionNamespaces | undefined): string[] {
    if (!namespaces) return [];
    const accounts: string[] = [];
    Object.values(namespaces).forEach((ns) => {
      ns?.accounts?.forEach((account) => {
        const address = account.split(':')[2];
        if (address) accounts.push(address);
      });
    });
    return [...new Set(accounts)];
  }

  private hasAccountsChanged(newAccounts: string[]): boolean {
    if (newAccounts.length !== this.lastKnownAccounts.length) return true;
    return newAccounts.some((acc, i) => acc.toLowerCase() !== this.lastKnownAccounts[i]?.toLowerCase());
  }

  removeListeners(): void {
    if (this.accountsChangedCallback) {
      this.provider?.removeListener?.('accountsChanged', this.accountsChangedCallback);
      this.accountsChangedCallback = null;
    }
    if (this.chainChangedCallback) {
      this.provider?.removeListener?.('chainChanged', this.chainChangedCallback);
      this.chainChangedCallback = null;
    }
    if (this.sessionUpdateHandler) {
      this.universalProvider?.removeListener?.('session_update', this.sessionUpdateHandler);
      this.sessionUpdateHandler = null;
    }
    this.disconnectCallback = null;
    this.unsubscribeFunctions.forEach((unsub) => unsub());
    this.unsubscribeFunctions = [];
    this.lastKnownAccounts = [];
    this.lastKnownChainId = null;
  }
}

import type { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum/types';
import { sentryLogger } from '@src/services/sentry';
import { createConfigError } from '@src/utils/isConfigError';

type WalletConnectProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

interface WalletConnectConfig {
  projectId?: string;
  appName: string;
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

  private provider: WalletConnectProvider | null = null;
  private config: WalletConnectConfig;
  private connectionUri: string | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(config: WalletConnectConfig) {
    this.config = {
      projectId: config.projectId,
      appName: config.appName,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.provider) return;
    if (!this.initPromise) {
      this.initPromise = this.initializeProvider();
    }
    await this.initPromise;
  }

  private async initializeProvider(): Promise<void> {
    if (typeof window === 'undefined') return;

    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');

    this.provider = await EthereumProvider.init({
      projectId: this.config.projectId ?? '',
      optionalChains: [1],
      showQrModal: false,
      metadata: {
        name: this.config.appName,
        description: this.config.appName,
        url: window.location.origin,
        icons: [],
      },
    });

    this.provider.on('display_uri', (uri) => {
      this.connectionUri = uri;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletconnect:uri', { detail: { uri } }));
      }
    });

    this.provider.on('connect', (session) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletconnect:connect', { detail: { session } }));
      }
    });

    this.provider.on('disconnect', () => {
      this.connectionUri = null;
    });

    this.provider.on('session_delete', () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletconnect:disconnect'));
      }
    });
  }

  isInstalled(): boolean {
    return true;
  }

  async connect(): Promise<WalletConnectionResult> {
    if (!this.config.projectId) {
      throw createConfigError('WalletConnect');
    }

    try {
      await this.ensureInitialized();

      if (!this.provider) {
        sentryLogger.error('connect: WalletConnect is not available');
        throw new Error('WalletConnect is not available');
      }

      const accounts = await this.provider.enable();

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        sentryLogger.error('connect: No accounts returned from WalletConnect');
        throw new Error('No accounts returned from WalletConnect');
      }

      return {
        address: accounts[0],
        provider: this.provider as unknown as AurumRpcProvider,
        walletId: this.id,
      };
    } catch {
      this.connectionUri = null;
      throw new Error('Failed to connect to WalletConnect');
    }
  }

  getConnectionUri(): string | null {
    return this.connectionUri;
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

    if (!this.provider) {
      sentryLogger.error('startSession: WalletConnect is not available');
      throw new Error('WalletConnect is not available');
    }

    // Reset state for fresh connection
    this.connectionUri = null;

    // Create a promise that resolves when URI is generated
    const uriPromise = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for WalletConnect URI'));
      }, timeout);

      // Use 'once' to listen for single URI event
      (this.provider as WalletConnectProvider).once('display_uri', (uri: string) => {
        clearTimeout(timeoutId);
        this.connectionUri = uri;
        resolve(uri);
      });
    });

    // Start connection process (triggers display_uri, then waits for user approval)
    const connectionPromise = (async (): Promise<WalletConnectionResult> => {
      const accounts = await (this.provider as WalletConnectProvider).enable();
      if (!accounts || accounts.length === 0 || !accounts[0]) {
        sentryLogger.error('startSession: No accounts returned from WalletConnect');
        throw new Error('No accounts returned from WalletConnect');
      }
      return {
        address: accounts[0],
        provider: this.provider as unknown as AurumRpcProvider,
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

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    try {
      await this.ensureInitialized();

      if (!this.provider) {
        return null;
      }

      const accounts = this.provider.accounts;
      if (!accounts || accounts.length === 0 || !accounts[0]) {
        return null;
      }

      return {
        address: accounts[0],
        provider: this.provider as unknown as AurumRpcProvider,
        walletId: this.id,
      };
    } catch {
      // sentryLogger.warn('Failed to restore connection to WalletConnect', { error });
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider) {
        await this.provider.disconnect();
      }
    } finally {
      this.connectionUri = null;
      this.provider = null;
      this.initPromise = null;
    }
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider as unknown as AurumRpcProvider | null;
  }

  // Called by Aurum when user connects wallet
  // Passes Aurum.ts --> syncStateFromAccountsChanged() to handle the provider accounts changed event
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (!this.provider?.on) return;

    if (this.accountsChangedCallback) {
      this.provider.removeListener?.('accountsChanged', this.accountsChangedCallback);
    }

    this.accountsChangedCallback = callback;
    this.provider.on('accountsChanged', this.accountsChangedCallback);
  }

  removeListeners(): void {
    if (!this.provider?.removeListener || !this.accountsChangedCallback) return;
    this.provider.removeListener('accountsChanged', this.accountsChangedCallback);
    this.accountsChangedCallback = null;
  }
}

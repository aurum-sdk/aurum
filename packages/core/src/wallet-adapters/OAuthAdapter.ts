import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { AurumRpcProvider, WalletId, WalletName, OAuthProvider } from '@aurum-sdk/types';
import type { Transport, PublicClient, Chain } from 'viem';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { sentryLogger } from '@src/services/sentry';
import { createConfigError } from '@src/utils/isConfigError';

interface OAuthRpcProvider extends AurumRpcProvider {
  selectedAddress?: string | null;
  close?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

interface OAuthAdapterConfig {
  projectId?: string;
  provider: OAuthProvider;
}

/**
 * OAuth adapter for social login (Google, Apple, X) using CDP embedded wallets.
 * Each OAuth provider gets its own adapter instance with the appropriate WalletId.
 */
export class OAuthAdapter implements WalletAdapter {
  readonly id: WalletId;
  readonly name: WalletName;
  readonly icon: string;
  readonly hide = true;
  readonly downloadUrl = null;
  readonly wcDeepLinkUrl = null;

  private rpcProvider: OAuthRpcProvider | null = null;
  private initPromise: Promise<void> | null = null;
  private publicClientCache: Map<number, PublicClient> = new Map();
  private projectId: string;
  private oauthProvider: OAuthProvider;

  // Static variables - computed once across all instances (shared with EmailAdapter)
  private static chainIdMap: Map<number, Chain> | null = null;
  private static viemChains: Chain[] | null = null;
  private static viemTransports: Record<number, Transport> | null = null;

  constructor(config: OAuthAdapterConfig) {
    this.projectId = config.projectId || '';
    this.oauthProvider = config.provider;

    // Set id and name based on the OAuth provider
    if (config.provider === 'google') {
      this.id = WalletId.Google;
      this.name = WalletName.Google;
      this.icon = getLogoDataUri('google' as WalletId, 'brand') ?? '';
    } else if (config.provider === 'apple') {
      this.id = WalletId.Apple;
      this.name = WalletName.Apple;
      this.icon = getLogoDataUri('apple' as WalletId, 'brand') ?? '';
    } else {
      this.id = WalletId.X;
      this.name = WalletName.X;
      this.icon = getLogoDataUri('x' as WalletId, 'brand') ?? '';
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.rpcProvider) return;
    if (!this.initPromise) {
      this.initPromise = this.initializeProvider();
    }
    await this.initPromise;
  }

  isInstalled(): boolean {
    return true;
  }

  /**
   * Redirects user to the OAuth provider (Google/Apple/X) to complete login.
   * After returning, the connection is restored automatically via tryRestoreConnection().
   */
  async signInWithOAuth(): Promise<void> {
    if (!this.projectId) {
      throw createConfigError(this.name);
    }

    await this.ensureInitialized();

    if (!this.rpcProvider) {
      sentryLogger.error(`${this.name} OAuth is not available`);
      throw new Error(`${this.name} OAuth is not available`);
    }

    try {
      const { signInWithOAuth } = await import('@coinbase/cdp-core');
      // This will redirect the user - execution stops here
      void signInWithOAuth(this.oauthProvider);
    } catch (error) {
      sentryLogger.error(`Failed to sign in with ${this.name}`, { error });
      throw error;
    }
  }

  async connect(): Promise<WalletConnectionResult> {
    sentryLogger.error(`OAuthAdapter.connect() is not implemented - use signInWithOAuth() instead`);
    throw new Error(`OAuthAdapter.connect() is not implemented - use signInWithOAuth() instead`);
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    await this.ensureInitialized();

    if (!this.rpcProvider) {
      return null;
    }

    try {
      const accounts = await this.rpcProvider.request<string[]>({
        method: 'eth_accounts',
        params: [],
      });

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        return null;
      }

      return {
        address: accounts[0],
        provider: this.rpcProvider,
        walletId: this.id,
      };
    } catch {
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.ensureInitialized();
      const { signOut } = await import('@coinbase/cdp-core');
      await signOut();
    } catch {
      // no-op - if user is not logged in, this is expected to throw an error
    }
  }

  getProvider(): AurumRpcProvider | null {
    return this.rpcProvider;
  }

  getProjectId(): string {
    return this.projectId;
  }

  private static async initializeChainData(): Promise<void> {
    if (this.chainIdMap !== null) return; // Already initialized

    const [allChains, { http }] = await Promise.all([import('viem/chains'), import('viem')]);

    const chains = Object.values(allChains).filter(
      (chain) => typeof chain === 'object' && chain !== null && 'id' in chain,
    ) as Chain[];

    this.chainIdMap = new Map(chains.map((chain) => [chain.id, chain]));

    this.viemChains = chains;
    this.viemTransports = chains.reduce(
      (acc, chain) => {
        acc[chain.id] = http() as Transport;
        return acc;
      },
      {} as Record<number, Transport>,
    );
  }

  private async getPublicClientForChain(chainId: number): Promise<PublicClient> {
    if (this.publicClientCache.has(chainId)) {
      return this.publicClientCache.get(chainId)!;
    }

    await OAuthAdapter.initializeChainData();

    const viemChain = OAuthAdapter.chainIdMap!.get(chainId);
    if (!viemChain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const { createPublicClient, http } = await import('viem');

    const publicClient = createPublicClient({
      chain: viemChain,
      transport: http(),
    });

    this.publicClientCache.set(chainId, publicClient);
    return publicClient;
  }

  /**
   * Initializes CDP and creates the provider.
   * Called by ensureInitialized() - deduplication handled via initPromise.
   */
  private async initializeProvider(): Promise<void> {
    const { initialize } = await import('@coinbase/cdp-core');

    await initialize({
      projectId: this.projectId,
      ethereum: {
        createOnLogin: 'eoa',
      },
    });

    this.rpcProvider = await this.createProvider();
  }

  /**
   * Special case:
   * Coinbase default provider does not support generic read methods like eth_getBalance.
   * Wraps the provider to send unsupported methods to a public RPC endpoint.
   */
  private async createProvider(): Promise<OAuthRpcProvider | null> {
    try {
      await OAuthAdapter.initializeChainData();

      const { createCDPEmbeddedWallet } = await import('@coinbase/cdp-core');

      const wallet = createCDPEmbeddedWallet({
        chains: OAuthAdapter.viemChains as [Chain, ...Chain[]],
        transports: OAuthAdapter.viemTransports as Record<number, Transport>,
      });

      const base = wallet.provider as OAuthRpcProvider;
      const getPublicClient = this.getPublicClientForChain.bind(this);

      const wrapped: OAuthRpcProvider = {
        ...base,
        async request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T> {
          try {
            return await base.request<T>(args);
          } catch (err: unknown) {
            const msg = String((err as Error)?.message || '');
            const isUnsupported =
              msg.includes('not supported') ||
              msg.includes('Unsupported') ||
              (err as { code?: number })?.code === -32601;

            if (isUnsupported) {
              // Get current chainId to use the correct RPC endpoint
              let chainId: number;
              try {
                const chainIdHex = await base.request<string>({ method: 'eth_chainId', params: [] });
                chainId = parseInt(chainIdHex, 16);
              } catch {
                sentryLogger.error('Failed to get chainId for fallback request');
                throw new Error('Failed to get chainId for fallback request');
              }

              // Get or create publicClient for this chain
              const publicClient = await getPublicClient(chainId);

              return (await publicClient.transport.request({
                method: args.method as unknown as string,
                params: Array.isArray(args.params)
                  ? (args.params as unknown[])
                  : args.params
                    ? [args.params as unknown]
                    : undefined,
              })) as T;
            }
            throw err;
          }
        },
      };

      return wrapped;
    } catch (error) {
      sentryLogger.error(`Failed to initialize ${this.name} OAuth provider`, { error });
      return null;
    }
  }

  // OAuth wallets don't support account switching
  onAccountsChanged(): void {}
  removeListeners(): void {}
}

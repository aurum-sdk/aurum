import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import type { SignInWithSmsResult, VerifySmsOTPResult } from '@coinbase/cdp-core';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import type { Transport, PublicClient, Chain } from 'viem';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { sentryLogger } from '@src/services/sentry';
import { createConfigError } from '@src/utils/isConfigError';

interface SmsProvider extends AurumRpcProvider {
  selectedAddress?: string | null;
  close?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

interface SmsAdapterConfig {
  projectId?: string;
}

export class SmsAdapter implements WalletAdapter {
  readonly id = WalletId.Sms;
  readonly name = WalletName.Sms;
  readonly icon = getLogoDataUri(WalletId.Sms, 'brand') ?? '';
  readonly hide = true;
  readonly downloadUrl = null;
  readonly wcDeepLinkUrl = null;

  private provider: SmsProvider | null = null;
  private initPromise: Promise<void> | null = null;
  private publicClientCache: Map<number, PublicClient> = new Map();
  private projectId: string;

  // Static variables - computed once across all instances
  private static chainIdMap: Map<number, Chain> | null = null;
  private static viemChains: Chain[] | null = null;
  private static viemTransports: Record<number, Transport> | null = null;

  constructor(config?: SmsAdapterConfig) {
    this.projectId = config?.projectId || '';
  }

  private async ensureInitialized(): Promise<void> {
    if (this.provider) return;
    if (!this.initPromise) {
      this.initPromise = this.initializeProvider();
    }
    await this.initPromise;
  }

  isInstalled(): boolean {
    return true;
  }

  async smsAuthStart(phoneNumber: string): Promise<SignInWithSmsResult> {
    if (!this.projectId) {
      throw createConfigError('SMS');
    }

    await this.ensureInitialized();

    if (!this.provider) {
      sentryLogger.error('SMS is not available');
      throw new Error('SMS is not available');
    }

    try {
      const { signInWithSms } = await import('@coinbase/cdp-core');
      const authResult = await signInWithSms({ phoneNumber });
      return authResult;
    } catch (error) {
      sentryLogger.error('Failed to start SMS authentication', { error });
      throw error;
    }
  }

  async smsAuthVerify(flowId: string, otp: string): Promise<VerifySmsOTPResult> {
    if (!flowId || !otp) {
      throw new Error('flowId and otp are required');
    }

    await this.ensureInitialized();
    if (!this.provider) {
      sentryLogger.error('SMS provider not initialized');
      throw new Error('SMS provider not initialized');
    }

    const { verifySmsOTP } = await import('@coinbase/cdp-core');
    return verifySmsOTP({ flowId, otp });
  }

  async connect(): Promise<WalletConnectionResult> {
    sentryLogger.error('SmsAdapter.connect() is not implemented');
    throw new Error('SmsAdapter.connect() is not implemented');
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    await this.ensureInitialized();

    if (!this.provider) {
      return null;
    }

    try {
      const accounts = await this.provider.request<string[]>({
        method: 'eth_accounts',
        params: [],
      });

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        return null;
      }

      return {
        address: accounts[0],
        provider: this.provider,
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
      // no-op
    }
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider;
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

    await SmsAdapter.initializeChainData();

    const viemChain = SmsAdapter.chainIdMap!.get(chainId);
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

    this.provider = await this.createProvider();
  }

  /**
   * Special case:
   * Coinbase default provider does not support generic read methods like eth_getBalance.
   * Wraps the provider to send unsupported methods to a public RPC endpoint.
   */
  private async createProvider(): Promise<SmsProvider | null> {
    try {
      await SmsAdapter.initializeChainData();

      const { createCDPEmbeddedWallet } = await import('@coinbase/cdp-core');

      const wallet = createCDPEmbeddedWallet({
        chains: SmsAdapter.viemChains as [Chain, ...Chain[]],
        transports: SmsAdapter.viemTransports as Record<number, Transport>,
      });

      const base = wallet.provider as SmsProvider;
      const getPublicClient = this.getPublicClientForChain.bind(this);

      const wrapped: SmsProvider = {
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
      sentryLogger.error('Failed to initialize SMS provider', { error });
      return null;
    }
  }

  // SMS wallets don't support account switching
  onAccountsChanged(): void {}
  removeListeners(): void {}
}

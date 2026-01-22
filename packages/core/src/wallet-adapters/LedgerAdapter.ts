import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';
import { createConfigError } from '@src/utils/isConfigError';
import { SupportedProviders } from '@ledgerhq/connect-kit-loader';
import { mainnet } from 'viem/chains';

interface LedgerAdapterConfig {
  walletConnectProjectId?: string;
}

export class LedgerAdapter implements WalletAdapter {
  readonly id = WalletId.Ledger;
  readonly name = WalletName.Ledger;
  readonly icon = getLogoDataUri(WalletId.Ledger, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = 'https://www.ledger.com/ledger-live';
  readonly wcDeepLinkUrl = 'ledgerlive://wc?uri=';

  private provider: AurumRpcProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private walletConnectProjectId?: string;

  constructor(config?: LedgerAdapterConfig) {
    this.walletConnectProjectId = config?.walletConnectProjectId;
  }

  isInstalled(): boolean {
    return true;
  }

  async connect(): Promise<WalletConnectionResult> {
    if (!this.walletConnectProjectId) {
      throw createConfigError('Ledger');
    }

    const { loadConnectKit } = await import('@ledgerhq/connect-kit-loader');
    const connectKit = await loadConnectKit();

    connectKit.enableDebugLogs();

    connectKit.checkSupport({
      providerType: SupportedProviders.Ethereum,
      chainId: 1,
      walletConnectVersion: 2,
      projectId: this.walletConnectProjectId,
      rpc: { 1: mainnet.rpcUrls.default.http[0] },
    });

    this.provider = (await connectKit.getProvider()) as AurumRpcProvider;

    if (!this.provider) {
      sentryLogger.error('Failed to get Ledger provider');
      throw new Error('Failed to get Ledger provider');
    }

    const accounts = await this.provider.request<string[]>({
      method: 'eth_requestAccounts',
      params: [],
    });

    if (!accounts || accounts.length === 0 || !accounts[0]) {
      sentryLogger.error('No accounts returned from Ledger');
      throw new Error('No accounts returned from Ledger');
    }

    return {
      address: accounts[0],
      provider: this.provider,
      walletId: this.id,
    };
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    try {
      const { loadConnectKit } = await import('@ledgerhq/connect-kit-loader');
      const connectKit = await loadConnectKit();

      connectKit.checkSupport({
        providerType: SupportedProviders.Ethereum,
        chainId: 1,
        walletConnectVersion: 2,
        projectId: this.walletConnectProjectId,
        rpc: { 1: mainnet.rpcUrls.default.http[0] },
      });

      this.provider = (await connectKit.getProvider()) as AurumRpcProvider;

      if (!this.provider) {
        return null;
      }

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
      // sentryLogger.warn('Failed to restore connection to Ledger', { error });
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = this.provider as AurumRpcProvider & { disconnect?: () => Promise<void> };
      if (provider?.disconnect) {
        await provider.disconnect();
      }
      this.provider = null;
    } catch (error) {
      sentryLogger.warn('Failed to disconnect from Ledger', { error });
    }
  }

  getProvider(): AurumRpcProvider | null {
    return this.provider;
  }

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

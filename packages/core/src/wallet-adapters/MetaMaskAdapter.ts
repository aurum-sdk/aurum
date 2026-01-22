import { WalletAdapter, WalletConnectionResult, EIP6963AnnounceProviderEvent } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';

const METAMASK_RDNS = 'io.metamask';

interface MetaMaskProvider extends AurumRpcProvider {
  isMetaMask: boolean;
  isBraveWallet: boolean;
  providers?: MetaMaskProvider[];
}

export class MetaMaskAdapter implements WalletAdapter {
  readonly id = WalletId.MetaMask;
  readonly name = WalletName.MetaMask;
  readonly icon = getLogoDataUri(WalletId.MetaMask, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = 'https://metamask.io/download';
  readonly wcDeepLinkUrl = 'metamask://wc?uri=';

  private provider: MetaMaskProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private providerPromise: Promise<MetaMaskProvider | null> | null = null;

  constructor() {
    // Start EIP-6963 discovery immediately
    this.providerPromise = this.discoverProvider();
  }

  /**
   * Uses EIP-6963 to discover the MetaMask provider by its RDNS identifier.
   * Falls back to window.ethereum for in-app browser support (MetaMask Mobile).
   * This prevents other wallets (like Rabby) from hijacking the connection.
   */
  private discoverProvider(): Promise<MetaMaskProvider | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
      let resolved = false;

      const onAnnouncement = (event: Event) => {
        const { detail } = event as EIP6963AnnounceProviderEvent<MetaMaskProvider>;
        if (detail.info.rdns === METAMASK_RDNS) {
          resolved = true;
          this.provider = detail.provider;
          window.removeEventListener('eip6963:announceProvider', onAnnouncement);
          resolve(detail.provider);
        }
      };

      window.addEventListener('eip6963:announceProvider', onAnnouncement);
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // Timeout after 100ms - fall back to legacy window.ethereum for in-app browsers
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('eip6963:announceProvider', onAnnouncement);
          const legacyProvider = this.detectLegacyProvider();
          if (legacyProvider) {
            this.provider = legacyProvider;
          }
          resolve(legacyProvider);
        }
      }, 100);
    });
  }

  /**
   * Fallback detection for in-app browsers (MetaMask Mobile) that don't support EIP-6963.
   * Checks window.ethereum for MetaMask-specific flags.
   */
  private detectLegacyProvider(): MetaMaskProvider | null {
    const ethereum = (window as unknown as { ethereum?: MetaMaskProvider }).ethereum;
    if (!ethereum) return null;

    // Check providers array first (multiple wallets installed)
    if (ethereum.providers?.length) {
      const metaMaskProvider = ethereum.providers.find((p) => p.isMetaMask && !p.isBraveWallet);
      if (metaMaskProvider) return metaMaskProvider;
    }

    // Single provider - check if it's MetaMask (and not Brave masquerading)
    if (ethereum.isMetaMask && !ethereum.isBraveWallet) {
      return ethereum;
    }

    return null;
  }

  isInstalled(): boolean {
    return Boolean(this.provider ?? this.detectLegacyProvider());
  }

  async connect(): Promise<WalletConnectionResult> {
    // Wait for EIP-6963 discovery to complete if not already done
    if (!this.provider && this.providerPromise) {
      await this.providerPromise;
    }

    if (!this.provider) {
      sentryLogger.error('MetaMask is not available');
      throw new Error('MetaMask is not available');
    }

    try {
      // Force MetaMask to prompt for a fresh connection instead of returning cached accounts
      await this.provider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const accounts = await this.provider.request<string[]>({
        method: 'eth_requestAccounts',
        params: [],
      });

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        sentryLogger.error('No accounts returned from MetaMask');
        throw new Error('No accounts returned from MetaMask');
      }

      return {
        address: accounts[0],
        provider: this.provider,
        walletId: this.id,
      };
    } catch {
      throw new Error('Failed to connect to MetaMask');
    }
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    // Wait for EIP-6963 discovery to complete if not already done
    if (!this.provider && this.providerPromise) {
      await this.providerPromise;
    }

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
      // sentryLogger.warn('Failed to restore connection to MetaMask', { error });
      return null;
    }
  }

  async disconnect(): Promise<void> {}

  getProvider(): AurumRpcProvider | null {
    return this.provider;
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

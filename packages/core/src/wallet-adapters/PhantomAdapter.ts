import { WalletAdapter, WalletConnectionResult, EIP6963AnnounceProviderEvent } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';

const PHANTOM_RDNS = 'app.phantom';

interface PhantomProvider extends AurumRpcProvider {
  isPhantom: boolean;
  providers?: PhantomProvider[];
}

export class PhantomAdapter implements WalletAdapter {
  readonly id = WalletId.Phantom;
  readonly name = WalletName.Phantom;
  readonly icon = getLogoDataUri(WalletId.Phantom, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = 'https://phantom.com/download';
  readonly wcDeepLinkUrl = 'phantom://wc?uri=';

  private provider: PhantomProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private providerPromise: Promise<PhantomProvider | null> | null = null;

  constructor() {
    // Start EIP-6963 discovery immediately
    this.providerPromise = this.discoverProvider();
  }

  /**
   * Uses EIP-6963 to discover the Phantom provider by its RDNS identifier.
   * Falls back to window.phantom.ethereum for in-app browser support (Phantom Mobile).
   * This prevents other wallets from hijacking the connection.
   */
  private discoverProvider(): Promise<PhantomProvider | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
      let resolved = false;

      const onAnnouncement = (event: Event) => {
        const { detail } = event as EIP6963AnnounceProviderEvent<PhantomProvider>;
        if (detail.info.rdns === PHANTOM_RDNS) {
          resolved = true;
          this.provider = detail.provider;
          window.removeEventListener('eip6963:announceProvider', onAnnouncement);
          resolve(detail.provider);
        }
      };

      window.addEventListener('eip6963:announceProvider', onAnnouncement);
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // Timeout after 100ms - fall back to legacy detection for in-app browsers
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
   * Fallback detection for in-app browsers (Phantom Mobile) that don't support EIP-6963.
   * Checks window.phantom.ethereum and window.ethereum for Phantom-specific flags.
   */
  private detectLegacyProvider(): PhantomProvider | null {
    // Phantom prefers window.phantom.ethereum namespace
    const phantom = (window as unknown as { phantom?: { ethereum?: PhantomProvider } }).phantom;
    if (phantom?.ethereum?.isPhantom) {
      return phantom.ethereum;
    }

    // Fallback to window.ethereum if Phantom is the only provider
    const ethereum = (window as unknown as { ethereum?: PhantomProvider }).ethereum;
    if (ethereum?.isPhantom) {
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
      sentryLogger.error('Phantom is not available');
      throw new Error('Phantom is not available');
    }

    // Force Phantom to prompt for a fresh connection instead of returning cached accounts
    await this.provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });

    const accounts = await this.provider.request<string[]>({
      method: 'eth_requestAccounts',
      params: [],
    });

    if (!accounts || accounts.length === 0 || !accounts[0]) {
      sentryLogger.error('No accounts returned from Phantom');
      throw new Error('No accounts returned from Phantom');
    }

    return {
      address: accounts[0],
      provider: this.provider,
      walletId: this.id,
    };
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
      // sentryLogger.warn('Failed to restore connection to Phantom', { error });
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

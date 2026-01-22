import { WalletAdapter, WalletConnectionResult, EIP6963AnnounceProviderEvent } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';

const RABBY_RDNS = 'io.rabby';

interface RabbyProvider extends AurumRpcProvider {
  isRabby: boolean;
  providers?: RabbyProvider[];
}

export class RabbyAdapter implements WalletAdapter {
  readonly id = WalletId.Rabby;
  readonly name = WalletName.Rabby;
  readonly icon = getLogoDataUri(WalletId.Rabby, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = 'https://rabby.io';
  readonly wcDeepLinkUrl = null;

  private provider: RabbyProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private providerPromise: Promise<RabbyProvider | null> | null = null;

  constructor() {
    // Start EIP-6963 discovery immediately
    this.providerPromise = this.discoverProvider();
  }

  /**
   * Uses EIP-6963 to discover the Rabby provider by its RDNS identifier.
   * Falls back to window.ethereum for legacy detection.
   */
  private discoverProvider(): Promise<RabbyProvider | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
      let resolved = false;

      const onAnnouncement = (event: Event) => {
        const { detail } = event as EIP6963AnnounceProviderEvent<RabbyProvider>;
        if (detail.info.rdns === RABBY_RDNS) {
          resolved = true;
          this.provider = detail.provider;
          window.removeEventListener('eip6963:announceProvider', onAnnouncement);
          resolve(detail.provider);
        }
      };

      window.addEventListener('eip6963:announceProvider', onAnnouncement);
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // Timeout after 100ms - fall back to legacy detection
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
   * Fallback detection for legacy Rabby installations.
   * Checks window.ethereum for Rabby-specific flags.
   */
  private detectLegacyProvider(): RabbyProvider | null {
    const ethereum = (window as unknown as { ethereum?: RabbyProvider }).ethereum;
    if (ethereum?.isRabby) {
      return ethereum;
    }
    return null;
  }

  isInstalled(): boolean {
    return Boolean(this.provider);
  }

  async connect(): Promise<WalletConnectionResult> {
    // Wait for EIP-6963 discovery to complete if not already done
    if (!this.provider && this.providerPromise) {
      await this.providerPromise;
    }

    if (!this.provider) {
      sentryLogger.error('Rabby is not available');
      throw new Error('Rabby is not available');
    }

    // Force Rabby to prompt for a fresh connection instead of returning cached accounts
    await this.provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });

    const accounts = await this.provider.request<string[]>({
      method: 'eth_requestAccounts',
      params: [],
    });

    if (!accounts || accounts.length === 0 || !accounts[0]) {
      sentryLogger.error('No accounts returned from Rabby');
      throw new Error('No accounts returned from Rabby');
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
      // sentryLogger.warn('Failed to restore connection to Rabby', { error });
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

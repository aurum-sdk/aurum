import { WalletAdapter, WalletConnectionResult, EIP6963AnnounceProviderEvent } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';
import { isBraveBrowser } from '@src/utils/platform/isBraveBrowser';

const BRAVE_RDNS = 'com.brave.wallet';

interface BraveProvider extends AurumRpcProvider {
  isBraveWallet: boolean;
}

export class BraveAdapter implements WalletAdapter {
  readonly id = WalletId.Brave;
  readonly name = WalletName.Brave;
  readonly icon = getLogoDataUri(WalletId.Brave, 'brand') ?? '';
  readonly downloadUrl = 'https://brave.com/download';
  readonly wcDeepLinkUrl = null;

  private provider: BraveProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private providerPromise: Promise<BraveProvider | null> | null = null;

  constructor() {
    // Start EIP-6963 discovery immediately
    this.providerPromise = this.discoverProvider();
  }

  get hide(): boolean {
    if (this.provider) return false;
    if (isBraveBrowser()) return false;
    return true;
  }

  /**
   * Uses EIP-6963 to discover the Brave Wallet provider by its RDNS identifier.
   * Falls back to window.ethereum for legacy detection.
   */
  private discoverProvider(): Promise<BraveProvider | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
      let resolved = false;

      const onAnnouncement = (event: Event) => {
        const { detail } = event as EIP6963AnnounceProviderEvent<BraveProvider>;
        if (detail.info.rdns === BRAVE_RDNS) {
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
   * Fallback detection for legacy Brave Wallet detection.
   * Checks window.ethereum for Brave-specific flags.
   */
  private detectLegacyProvider(): BraveProvider | null {
    const ethereum = (window as unknown as { ethereum?: BraveProvider }).ethereum;
    if (ethereum?.isBraveWallet) {
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
      sentryLogger.error('Brave Wallet is not available');
      throw new Error('Brave Wallet is not available');
    }

    try {
      // Force Brave Wallet to prompt for a fresh connection instead of returning cached accounts
      await this.provider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const accounts = await this.provider.request<string[]>({
        method: 'eth_requestAccounts',
        params: [],
      });

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        sentryLogger.error('No accounts returned from Brave Wallet');
        throw new Error('No accounts returned from Brave Wallet');
      }

      return {
        address: accounts[0],
        provider: this.provider,
        walletId: this.id,
      };
    } catch {
      throw new Error('Failed to connect to Brave Wallet');
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
      // sentryLogger.warn('Failed to restore connection to Brave Wallet', { error });
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

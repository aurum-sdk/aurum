import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { sentryLogger } from '@src/services/sentry';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { getLogoDataUri } from '@aurum-sdk/logos';
import { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';

interface CoinbaseProvider extends AurumRpcProvider {
  isWalletLink?: boolean;
  isCoinbaseWallet?: boolean;
  selectedAddress?: string | null;
  close?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

export class CoinbaseWalletAdapter implements WalletAdapter {
  readonly id = WalletId.CoinbaseWallet;
  readonly name = WalletName.CoinbaseWallet;
  readonly icon = getLogoDataUri(WalletId.CoinbaseWallet, 'brand') ?? '';
  readonly hide = false;
  readonly downloadUrl = 'https://www.coinbase.com/wallet/downloads';
  readonly wcDeepLinkUrl = 'cbwallet://wc?uri=';

  private provider: CoinbaseProvider | null = null;
  private accountsChangedCallback: ((accounts: string[]) => void) | null = null;

  constructor({ appName, appLogoUrl }: { appName: string; appLogoUrl?: string }) {
    this.provider = this.detectProvider({ appName, appLogoUrl });
  }

  private detectProvider({ appName, appLogoUrl }: { appName: string; appLogoUrl?: string }): CoinbaseProvider | null {
    if (typeof window === 'undefined') return null;

    try {
      const coinbaseSdk = createCoinbaseWalletSDK({
        appName,
        appLogoUrl,
      });

      return coinbaseSdk.getProvider() as CoinbaseProvider;
    } catch (error) {
      sentryLogger.warn('Failed to initialize Coinbase Wallet provider', { error });
      return null;
    }
  }

  isInstalled(): boolean {
    return Boolean(this.provider);
  }

  async connect(): Promise<WalletConnectionResult> {
    if (!this.isInstalled() || !this.provider) {
      sentryLogger.error('Coinbase Wallet is not available');
      throw new Error('Coinbase Wallet is not available');
    }

    try {
      const accounts = await this.provider.request<string[]>({
        method: 'eth_requestAccounts',
        params: [],
      });

      if (!accounts || accounts.length === 0 || !accounts[0]) {
        sentryLogger.error('No accounts returned from Coinbase Wallet');
        throw new Error('No accounts returned from Coinbase Wallet');
      }
      return {
        address: accounts[0],
        provider: this.provider,
        walletId: this.id,
      };
    } catch {
      throw new Error('Failed to connect to Coinbase Wallet');
    }
  }

  async tryRestoreConnection(): Promise<WalletConnectionResult | null> {
    if (!this.isInstalled() || !this.provider) {
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
      // sentryLogger.warn('Failed to restore connection to Coinbase Wallet', { error });
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider?.close) {
        await this.provider.close();
      } else if (this.provider?.disconnect) {
        await this.provider.disconnect();
      }
    } catch (error) {
      sentryLogger.warn('Error disconnecting from Coinbase Wallet', { error });
    } finally {
      this.clearLocalStorage();
    }
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('-walletlink') ||
          key.startsWith('-CBWSDK') ||
          key.startsWith('walletlink:') ||
          key.startsWith('CBWSDK:'))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  }

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

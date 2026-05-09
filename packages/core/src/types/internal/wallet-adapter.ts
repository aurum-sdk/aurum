import type { AurumRpcProvider, WalletId, WalletName } from '@aurum-sdk/types';
import { SignInWithEmailResult, VerifyEmailOTPResult } from '@coinbase/cdp-core';

export interface WalletConnectionResult {
  address: string;
  provider: AurumRpcProvider;
  walletId: WalletId;
  email?: string;
}

export interface WalletAdapter {
  readonly id: WalletId;
  readonly name: WalletName;
  readonly icon: string;

  // Ex:
  // hide Brave on non-Brave browsers
  // hide Email adapter since that's not rendered like other wallets
  readonly hide: boolean;
  readonly downloadUrl: string | null;

  // If it supports deep linking via WalletConnect URI
  readonly wcDeepLinkUrl: string | null;

  isInstalled(): boolean;

  getProvider(): AurumRpcProvider | null;

  connect(): Promise<WalletConnectionResult>;

  tryRestoreConnection(): Promise<WalletConnectionResult | null>;

  disconnect(): Promise<void>;

  // Email adapter only
  emailAuthStart?(email: string): Promise<SignInWithEmailResult>;
  emailAuthVerify?(email: string, otp: string): Promise<VerifyEmailOTPResult>;

  // WalletConnect adapter only - opens the AppKit modal
  openModal?(): Promise<WalletConnectionResult>;

  // Listeners
  onAccountsChanged(callback: (accounts: string[]) => void): void;
  removeListeners(): void;
}

export interface WalletAdapterConfig {
  name: string;
  id: string;
}

/**
 * Lightweight, eagerly-bundled descriptor for a wallet.
 *
 * The modal renders the wallet list from manifests. The heavy adapter
 * implementation (with all its third-party SDK dependencies) is only
 * pulled in via `load()` when the user actually clicks a wallet, calls
 * `aurum.connect(walletId)`, or session restoration needs it.
 */
export interface WalletAdapterManifest {
  readonly id: WalletId;
  readonly name: WalletName;
  readonly icon: string;
  readonly downloadUrl: string | null;
  readonly wcDeepLinkUrl: string | null;

  /** Computed each access — Brave depends on runtime browser detection. */
  readonly hide: boolean;

  /** Synchronous install sniff. Safe to call many times during render. */
  isInstalled(): boolean;

  /** Dynamic-imports the adapter module and instantiates it. Cached by `walletAdapterCache`. */
  load(): Promise<WalletAdapter>;
}

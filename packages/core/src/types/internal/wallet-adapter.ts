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
  // hide AppKit since that's only prompt-able from the QR code screen
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

  // OAuth adapter only
  signInWithOAuth?(): Promise<void>;

  // Listeners
  onAccountsChanged(callback: (accounts: string[]) => void): void;
  removeListeners(): void;
}

export interface WalletAdapterConfig {
  name: string;
  id: string;
}

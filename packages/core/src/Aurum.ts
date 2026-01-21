import { Chain } from 'viem';
import { AurumCore } from '@src/AurumCore';
import type { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import type {
  UserInfo,
  AurumRpcProvider,
  AurumConfig,
  NonNullableBrandConfig,
  WalletsConfig,
  WalletId,
  EmailAuthStartResult,
  EmailAuthVerifyResult,
  WalletConnectSessionResult,
} from '@aurum-sdk/types';

/**
 * Aurum SDK - Web3 Wallet Integration Library
 */

export class Aurum {
  private core: AurumCore;

  /**
   * Creates a new Aurum instance.
   *
   * @param config - Configuration for branding and wallets
   *
   * @example
   * ```typescript
   * const aurum = new Aurum({
   *   brand: { appName: 'Your App Name' },
   *   wallets: {
   *     embedded: { projectId: 'cdp-project-id' },
   *     walletConnect: { projectId: 'reown-project-id' },
   *   },
   * });
   * ```
   */
  constructor(config: AurumConfig) {
    this.core = new AurumCore(config);
  }

  /**
   * EIP1193 compatible RPC provider that can be used to interact with the connected wallet.
   * Compatible with viem, ethers.js, and other web3 libraries.
   *
   * @example
   * ```typescript
   * const balance = await aurum.rpcProvider.request({
   *   method: 'eth_getBalance',
   *   params: [address, 'latest']
   * });
   * ```
   */
  public get rpcProvider(): AurumRpcProvider {
    return this.core.rpcProvider;
  }

  /**
   * Indicates whether the SDK is finished initializing.
   */
  public get ready(): boolean {
    return this.core.ready;
  }

  /**
   * Returns the resolved brand configuration.
   * @internal Used by widget components (i.e. ConnectWidget)
   */
  public get brandConfig(): NonNullableBrandConfig {
    return this.core.resolvedBrandConfig;
  }

  /**
   * Returns the wallet adapters configured for this instance.
   * @internal Used by widget components (i.e. ConnectWidget)
   */
  public get walletAdapters(): WalletAdapter[] {
    return this.core.walletAdapters;
  }

  /**
   * Returns the set of excluded wallet IDs.
   * @internal Used by widget components (i.e. ConnectWidget)
   */
  public get excludedWalletIds(): Set<WalletId> {
    return this.core.excludedWalletIds;
  }

  /**
   * Waits for the SDK to finish initializing.
   * This should be called before calling methods with the provider to ensure provider is set (such as after a page refresh).
   *
   * @example
   * ```typescript
   * await aurum.whenReady();
   * const balance = await aurum.rpcProvider.request({
   *   method: 'eth_getBalance',
   *   params: [address, 'latest']
   * });
   * ```
   */
  public async whenReady(): Promise<void> {
    return this.core.whenReady();
  }

  /**
   * Opens the wallet connection modal or connects directly to a specific wallet.
   *
   * @param walletId - Optional wallet ID for direct connection (bypasses modal).
   *                   Cannot be 'email' or 'walletconnect' (use their dedicated methods).
   * @returns The connected wallet address
   * @throws Error if user closes the modal without connecting a wallet
   *
   * @example
   * ```typescript
   * // Open modal for user to choose
   * const address = await aurum.connect();
   *
   * // Or connect directly to a specific wallet
   * import { WalletId } from '@aurum-sdk/types';
   * const address = await aurum.connect(WalletId.MetaMask);
   * ```
   */
  public async connect(walletId?: WalletId): Promise<`0x${string}`> {
    return this.core.connect(walletId);
  }

  /**
   * Disconnects the currently connected wallet and clears the connection state.
   *
   * @example
   * ```typescript
   * await aurum.disconnect();
   * ```
   */
  public async disconnect(): Promise<void> {
    return this.core.disconnect();
  }

  /**
   * Gets information about the currently connected user.
   *
   * @returns User information including wallet address and wallet name, or undefined if no wallet is connected
   *
   * @example
   * ```typescript
   * const userInfo = await aurum.getUserInfo();
   * if (userInfo) {
   *   console.log(`Connected to ${userInfo.walletName}: ${userInfo.publicAddress}`);
   * } else {
   *   console.log('No wallet connected');
   * }
   * ```
   */
  public async getUserInfo(): Promise<UserInfo | undefined> {
    return this.core.getUserInfo();
  }

  /**
   * Checks if a wallet is currently connected.
   *
   * @returns `true` if a wallet is connected, `false` otherwise
   *
   * @example
   * ```typescript
   * const isConnected = await aurum.isConnected();
   * console.log('Is user connected:', isConnected);
   * ```
   */
  public async isConnected(): Promise<boolean> {
    return this.core.isConnected();
  }

  /**
   * Gets the current chain ID of the connected wallet.
   *
   * @returns The current chain ID as a number
   *
   * @example
   * ```typescript
   * const chainId = await aurum.getChainId();
   * console.log('Connected to chain:', chainId);
   * ```
   */
  public async getChainId(): Promise<number> {
    return this.core.getChainId();
  }

  /**
   * Switches the connected wallet to a different blockchain network.
   * If the chain is not added to the wallet, it will attempt to add it using the provided chain config.
   *
   * @param chainId - The chain ID to switch to (can be hex string, decimal string, or number)
   * @param chain - Optional viem Chain object with chain configuration (required if chain needs to be added)
   * @throws Error if the switch fails or the user rejects the request
   *
   * @example
   * ```typescript
   * import { sepolia } from 'viem/chains';
   *
   * await aurum.switchChain(sepolia.id, sepolia);
   * ```
   */
  public async switchChain(chainId: `0x${string}` | string | number, chain?: Chain): Promise<void> {
    return this.core.switchChain(chainId, chain);
  }

  /**
   * Updates the brand configuration at runtime.
   * Changes will be reflected the next time the connect modal is opened.
   *
   * @param newConfig - Partial brand config to merge with existing config
   *
   * @example
   * ```typescript
   * aurum.updateBrandConfig({
   *   theme: 'light',
   * });
   * ```
   */
  public updateBrandConfig(newConfig: Partial<NonNullableBrandConfig>): void {
    this.core.updateBrandConfig(newConfig);
  }

  /**
   * Updates the wallets configuration at runtime.
   * Changes will be reflected the next time the connect modal is opened.
   *
   * @param newConfig - Partial wallets config to update (currently supports `exclude`)
   *
   * @example
   * ```typescript
   * import { WalletId } from '@aurum-sdk/types';
   *
   * aurum.updateWalletsConfig({
   *   exclude: [WalletId.Email, WalletId.AppKit],
   * });
   * ```
   */
  public updateWalletsConfig(newConfig: Partial<Pick<WalletsConfig, 'exclude'>>): void {
    this.core.updateWalletsConfig(newConfig);
  }

  /**
   * Notifies the SDK of a widget-initiated connection.
   * Updates internal state so getUserInfo(), isConnected(), etc. work correctly.
   * @internal Used by ConnectWidget - not intended for direct use
   */
  public async handleWidgetConnection(result: WalletConnectionResult): Promise<UserInfo> {
    return this.core.handleWidgetConnection(result);
  }

  /* ===== HEADLESS / WHITELABEL API ===== */

  /**
   * Starts the email authentication flow by sending an OTP to the provided email.
   * Use with `emailAuthVerify()` to complete the connection.
   *
   * @param email - The email address to send the OTP to
   * @returns Object containing flowId to use with emailAuthVerify
   * @throws Error if email wallet is not configured
   *
   * @example
   * ```typescript
   * const { flowId } = await aurum.emailAuthStart('user@example.com');
   * // User receives OTP email, then verify:
   * const { address, email, isNewUser } = await aurum.emailAuthVerify(flowId, '123456');
   * ```
   */
  public async emailAuthStart(email: string): Promise<EmailAuthStartResult> {
    return this.core.emailAuthStart(email);
  }

  /**
   * Verifies the email OTP and completes the wallet connection.
   *
   * @param flowId - The flowId returned from emailAuthStart
   * @param otp - The OTP code the user received via email
   * @returns Object containing the connected address and email
   * @throws Error if verification fails
   *
   * @example
   * ```typescript
   * const { flowId } = await aurum.emailAuthStart('user@example.com');
   * // User receives OTP...
   * const { address, email, isNewUser } = await aurum.emailAuthVerify(flowId, '123456');
   * console.log(`Connected: ${address} (${email})`);
   * ```
   */
  public async emailAuthVerify(flowId: string, otp: string): Promise<EmailAuthVerifyResult> {
    return this.core.emailAuthVerify(flowId, otp);
  }

  /**
   * Initiates a WalletConnect session and returns the URI for displaying a custom QR code.
   * Use this for building custom QR code UIs instead of using the built-in modal.
   *
   * @returns Object containing the URI and a function to wait for the connection
   * @throws Error if WalletConnect is not configured
   *
   * @example
   * ```typescript
   * // Get the WalletConnect URI
   * const { uri, waitForConnection } = await aurum.getWalletConnectSession();
   *
   * // Display your custom QR code with the URI
   * myQRCodeComponent.render(uri);
   *
   * // Wait for user to scan and approve
   * const address = await waitForConnection();
   * console.log('Connected:', address);
   * ```
   */
  public async getWalletConnectSession(): Promise<WalletConnectSessionResult> {
    return this.core.getWalletConnectSession();
  }
}

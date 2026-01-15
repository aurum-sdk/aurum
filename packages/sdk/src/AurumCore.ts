import { Chain, checksumAddress } from 'viem';
import { useAurumStore, waitForStoreHydration } from '@src/store';
import { normalizeChainId, isChainNotAddedError, isChainExistsError } from '@src/utils/chainHelpers';
import { renderConnectModal } from '@src/components/ConnectModal/renderConnectModal';
import { DEFAULT_THEME, getDefaultThemeConfig } from '@src/constants/theme';
import { createWalletAdapters } from '@src/utils/createWalletAdapters';
import type { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import type {
  UserInfo,
  AurumRpcProvider,
  AurumConfig,
  NonNullableBrandConfig,
  WalletsConfig,
  WalletName,
  EmailAuthStartResult,
  EmailAuthVerifyResult,
  WalletConnectSessionResult,
} from '@aurum/types';
import { WalletId } from '@aurum/types';
import { RpcProvider } from '@src/providers/RpcProvider';
import { initSentry, sentryLogger } from '@src/services/sentry';
import { WalletConnectAdapter } from '@src/wallet-adapters/WalletConnectAdapter';
import { EmailAdapter } from '@src/wallet-adapters/EmailAdapter';

export class AurumCore {
  // Singleton instance
  private static instance: AurumCore | null = null;

  // Events managed by AurumCore (not forwarded to underlying provider)
  private static readonly MANAGED_EVENTS = ['accountsChanged', 'connect', 'disconnect'];

  // Current RPC provider (proxy that always points to current provider)
  public rpcProvider!: AurumRpcProvider;

  // `true` once we have restored the connection state
  public ready: boolean = false;

  private wallets!: WalletAdapter[];
  private excludedWallets!: Set<WalletId>;
  private readyPromise!: Promise<void>;
  private brandConfig!: NonNullableBrandConfig;
  private userInfo: UserInfo | undefined = undefined;
  private connectedWalletAdapter: WalletAdapter | null = null;

  // Minimal provider that satisfies EIP-1193 to use when no wallet is connected
  private skeletonProvider!: AurumRpcProvider;
  private currentProvider!: AurumRpcProvider;
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor(config: AurumConfig) {
    if (AurumCore.instance) {
      return AurumCore.instance;
    }

    const telemetryEnabled = config.telemetry !== false;
    initSentry(telemetryEnabled);

    this.brandConfig = this.resolveBrandConfig(config);
    this.excludedWallets = new Set((config.wallets?.exclude as WalletId[]) ?? []);
    this.wallets = createWalletAdapters({
      walletsConfig: config.wallets,
      appName: this.brandConfig.appName,
      appLogoUrl: this.brandConfig.logo,
      modalZIndex: this.brandConfig.modalZIndex,
      theme: this.brandConfig.theme,
    });

    this.skeletonProvider = new RpcProvider(() => this.connect());
    this.currentProvider = this.skeletonProvider;
    this.rpcProvider = this.createProviderProxy();

    this.readyPromise = this.tryRestoreConnection();

    AurumCore.instance = this;
  }

  public async whenReady(): Promise<void> {
    try {
      await this.readyPromise;
    } catch {
      this.resetConnectionState();
      this.ready = true;
    }
  }

  public get resolvedBrandConfig(): NonNullableBrandConfig {
    return this.brandConfig;
  }

  public get walletAdapters(): WalletAdapter[] {
    return this.wallets;
  }

  public get excludedWalletIds(): Set<WalletId> {
    return this.excludedWallets;
  }

  public async connect(walletId?: WalletId): Promise<`0x${string}`> {
    await this.whenReady();

    if (walletId === 'email') {
      throw new Error('Use emailAuthStart() and emailAuthVerify() for email wallet connections');
    }
    if (walletId === 'walletconnect') {
      throw new Error('Use getWalletConnectSession() for WalletConnect connections');
    }

    // If already connected, return existing address (unless requesting a different wallet)
    if (this.userInfo?.publicAddress && this.connectedWalletAdapter?.getProvider()) {
      if (!walletId || this.userInfo.walletId === walletId) {
        return this.userInfo.publicAddress as `0x${string}`;
      }
      // Different wallet requested - disconnect first
      await this.disconnect();
    }

    let adapter: WalletAdapter | null = null;
    let result: WalletConnectionResult;

    if (walletId) {
      // Direct connection - bypass modal
      if (this.excludedWallets.has(walletId)) {
        throw new Error(`${walletId} is excluded from wallet options`);
      }
      adapter = this.wallets.find((w) => w.id === walletId) || null;
      if (!adapter) {
        throw new Error(`${walletId} is not configured`);
      }
      if (!adapter.isInstalled()) {
        throw new Error(`${adapter.name} is not installed`);
      }
      result = await adapter.connect();
    } else {
      // Open modal to let user choose
      const displayedWallets = this.wallets.filter((w) => !this.excludedWallets.has(w.id));
      const modalResult = await renderConnectModal({ displayedWallets, brandConfig: this.brandConfig });
      if (!modalResult) {
        sentryLogger.error('Missing modal result');
        throw new Error('Missing modal result');
      }

      adapter = this.wallets.find((w) => w.id === modalResult.walletId) || null;
      if (!adapter) {
        sentryLogger.error(`Selected wallet adapter not found: ${modalResult.walletId}`);
        throw new Error('Selected wallet adapter not found');
      }
      result = modalResult;
    }

    const provider = result.provider ?? adapter.getProvider();
    if (!provider) {
      sentryLogger.error(`Error fetching provider on login: ${adapter.id}`);
      throw new Error('Error fetching provider. Please try again.');
    }

    // Update internal state
    const checksumAdr = checksumAddress(result.address as `0x${string}`);
    this.connectedWalletAdapter = adapter;
    this.updateProvider(provider);
    this.userInfo = {
      publicAddress: checksumAdr,
      walletName: adapter.name,
      walletId: adapter.id,
      email: result.email,
    };

    this.persistConnectionState(adapter, checksumAdr, result.email);
    this.setInternalAccountChangeListener(adapter);

    // Notify listeners - EIP-1193 events
    const chainId = await provider.request<string>({ method: 'eth_chainId' });
    this.emitConnect(chainId);
    this.emitAccountsChanged([checksumAdr]);

    sentryLogger.info(`Wallet connected: ${adapter.id} (${walletId ? 'headless' : 'modal'})`);

    return checksumAdr;
  }

  public async disconnect(): Promise<void> {
    await this.whenReady();

    // Clean up event listeners before disconnecting
    if (this.connectedWalletAdapter) {
      this.connectedWalletAdapter.removeListeners();
      await this.connectedWalletAdapter.disconnect();
    }

    this.resetConnectionState();

    // Notify listeners - EIP-1193 events
    this.emitDisconnect();
    this.emitAccountsChanged([]);
  }

  public async getUserInfo(): Promise<UserInfo | undefined> {
    await this.whenReady();
    return this.userInfo;
  }

  public async isConnected(): Promise<boolean> {
    await this.whenReady();
    return Boolean(
      this.userInfo?.publicAddress && this.userInfo?.walletName && this.connectedWalletAdapter?.getProvider(),
    );
  }

  public async handleWidgetConnection(result: WalletConnectionResult): Promise<void> {
    await this.whenReady();

    const adapter = this.wallets.find((w) => w.id === result.walletId) || null;
    if (!adapter) throw new Error('Selected wallet adapter not found');

    const provider = result.provider ?? adapter.getProvider();
    if (!provider) {
      sentryLogger.error(`Error fetching provider on widget login: ${result?.walletId}`);
      throw new Error('Error fetching provider. Please try again.');
    }

    // Update internal state (mirrors connect() logic)
    const checksumAdr = checksumAddress(result.address as `0x${string}`);
    this.connectedWalletAdapter = adapter;
    this.updateProvider(provider);
    this.userInfo = {
      publicAddress: checksumAdr,
      walletName: adapter.name,
      walletId: adapter.id,
      email: result.email,
    };

    this.persistConnectionState(adapter, checksumAdr, result.email);
    this.setInternalAccountChangeListener(adapter);

    // Notify listeners - EIP-1193 events
    const chainId = await provider.request<string>({ method: 'eth_chainId' });
    this.emitConnect(chainId);
    this.emitAccountsChanged([checksumAdr]);

    sentryLogger.info(`Wallet connected: ${adapter.id} (widget)`);
  }

  public async getChainId(): Promise<number> {
    await this.whenReady();
    const chainId = await this.rpcProvider.request({ method: 'eth_chainId' });
    return Number(chainId);
  }

  public async switchChain(chainId: `0x${string}` | string | number, chain?: Chain): Promise<void> {
    await this.whenReady();

    const hexChainId = normalizeChainId(chainId);

    try {
      await this.attemptSwitchChain(hexChainId);
    } catch (switchError: unknown) {
      if (!isChainNotAddedError(switchError as { code?: number; message?: string }) || !chain) throw switchError;
      await this.handleMissingChain(hexChainId, chain);
    }
  }

  public updateBrandConfig(newConfig: Partial<NonNullableBrandConfig>): void {
    // Get defaults based on the theme (use new theme if provided, otherwise current)
    const defaultTheme = getDefaultThemeConfig(newConfig.theme ?? this.brandConfig.theme);

    // For each property:
    // - If not in newConfig: keep current value
    // - If in newConfig with value: use new value
    // - If in newConfig with undefined: reset to default
    this.brandConfig = {
      logo: 'logo' in newConfig ? (newConfig.logo ?? defaultTheme.logo) : this.brandConfig.logo,
      theme: 'theme' in newConfig ? (newConfig.theme ?? defaultTheme.theme) : this.brandConfig.theme,
      primaryColor:
        'primaryColor' in newConfig
          ? (newConfig.primaryColor ?? defaultTheme.primaryColor)
          : this.brandConfig.primaryColor,
      borderRadius:
        'borderRadius' in newConfig
          ? (newConfig.borderRadius ?? defaultTheme.borderRadius)
          : this.brandConfig.borderRadius,
      modalZIndex:
        'modalZIndex' in newConfig
          ? typeof newConfig.modalZIndex === 'number'
            ? newConfig.modalZIndex
            : defaultTheme.modalZIndex
          : this.brandConfig.modalZIndex,
      appName: 'appName' in newConfig ? (newConfig.appName ?? defaultTheme.appName) : this.brandConfig.appName,
      hideFooter:
        'hideFooter' in newConfig ? (newConfig.hideFooter ?? defaultTheme.hideFooter) : this.brandConfig.hideFooter,
      font: 'font' in newConfig ? (newConfig.font ?? defaultTheme.font) : this.brandConfig.font,
      walletLayout:
        'walletLayout' in newConfig
          ? (newConfig.walletLayout ?? defaultTheme.walletLayout)
          : this.brandConfig.walletLayout,
    };
  }

  public updateWalletsConfig(newConfig: Partial<Pick<WalletsConfig, 'exclude'>>): void {
    if (newConfig.exclude !== undefined) {
      this.excludedWallets = new Set((newConfig.exclude as WalletId[]) ?? []);
    }
  }

  /* HEADLESS / WHITELABEL API */

  /**
   * Starts the email authentication flow by sending an OTP to the provided email.
   * @returns flowId to use with emailAuthVerify
   */
  public async emailAuthStart(email: string): Promise<EmailAuthStartResult> {
    await this.whenReady();

    const emailAdapter = this.wallets.find((w) => w.id === WalletId.Email) as EmailAdapter | undefined;
    if (!emailAdapter || !emailAdapter.emailAuthStart) {
      throw new Error('Email wallet is not configured');
    }

    const result = await emailAdapter.emailAuthStart(email);
    return { flowId: result.flowId };
  }

  /**
   * Verifies the email OTP and completes the connection.
   * @param flowId - The flowId returned from emailAuthStart
   * @param otp - The OTP code the user received via email
   * @returns The connected wallet address and email
   */
  public async emailAuthVerify(flowId: string, otp: string): Promise<EmailAuthVerifyResult> {
    await this.whenReady();

    const emailAdapter = this.wallets.find((w) => w.id === WalletId.Email) as EmailAdapter | undefined;
    if (!emailAdapter || !emailAdapter.emailAuthVerify) {
      throw new Error('Email wallet is not configured');
    }

    const verifyResult = await emailAdapter.emailAuthVerify(flowId, otp);
    const provider = emailAdapter.getProvider();

    if (!provider) {
      sentryLogger.error('Failed to get provider after email verification');
      throw new Error('Failed to get provider after email verification');
    }

    const address = verifyResult.user?.evmAccounts?.[0];
    const email = verifyResult.user?.authenticationMethods?.email?.email;

    if (!address || !email) {
      sentryLogger.error('Address or email not found after email verification');
      throw new Error('Address or email not found after email verification');
    }

    const checksumAdr = checksumAddress(address as `0x${string}`);

    this.connectedWalletAdapter = emailAdapter;
    this.updateProvider(provider);
    this.userInfo = {
      publicAddress: checksumAdr,
      walletName: emailAdapter.name,
      walletId: emailAdapter.id,
      email,
    };

    this.persistConnectionState(emailAdapter, checksumAdr, email);
    this.setInternalAccountChangeListener(emailAdapter);

    // Notify listeners - EIP-1193 events
    const chainId = await provider.request<string>({ method: 'eth_chainId' });
    this.emitConnect(chainId);
    this.emitAccountsChanged([checksumAdr]);

    sentryLogger.info(`Wallet connected: ${emailAdapter.id} (headless)`);

    return { address: checksumAdr, email: email ?? '', isNewUser: verifyResult.isNewUser ?? false };
  }

  /**
   * Initiates a WalletConnect session and returns the URI for displaying a custom QR code.
   * @returns URI string and a promise that resolves when the user connects
   */
  public async getWalletConnectSession(): Promise<WalletConnectSessionResult> {
    await this.whenReady();

    const wcAdapter = this.wallets.find((w) => w.id === WalletId.WalletConnect) as WalletConnectAdapter | undefined;
    if (!wcAdapter) {
      throw new Error('WalletConnect is not enabled');
    }

    const session = await wcAdapter.startSession();

    return {
      uri: session.uri,
      waitForConnection: async (): Promise<`0x${string}`> => {
        const result = await session.waitForConnection();
        const provider = result.provider ?? wcAdapter.getProvider();

        if (!provider) {
          sentryLogger.error('Failed to get provider after WalletConnect connection');
          throw new Error('Failed to get provider after WalletConnect connection');
        }

        const checksumAdr = checksumAddress(result.address as `0x${string}`);
        this.connectedWalletAdapter = wcAdapter;
        this.updateProvider(provider);
        this.userInfo = {
          publicAddress: checksumAdr,
          walletName: wcAdapter.name,
          walletId: wcAdapter.id,
        };

        this.persistConnectionState(wcAdapter, checksumAdr);
        this.setInternalAccountChangeListener(wcAdapter);

        // Notify listeners - EIP-1193 events
        const chainId = await provider.request<string>({ method: 'eth_chainId' });
        this.emitConnect(chainId);
        this.emitAccountsChanged([checksumAdr]);

        sentryLogger.info(`Wallet connected: ${wcAdapter.id} (headless)`);

        return checksumAdr;
      },
    };
  }

  /* PROVIDER METHODS */

  private createProviderProxy(): AurumRpcProvider {
    type EventCallback = (...args: unknown[]) => void;
    const handler: ProxyHandler<AurumRpcProvider> = {
      get: (_, prop) => {
        // Handle event listener methods specially - these are managed by AurumCore
        if (prop === 'on') {
          return (event: string, callback: EventCallback) => {
            if (!this.eventListeners.has(event)) {
              this.eventListeners.set(event, new Set());
            }
            this.eventListeners.get(event)!.add(callback);
            // accountsChanged/connect/disconnect: AurumCore emits manually
            // Other events (chainChanged, etc.): Forward to provider directly
            if (!AurumCore.MANAGED_EVENTS.includes(event)) {
              (this.currentProvider.on as (e: string, cb: EventCallback) => void)?.(event, callback);
            }
          };
        }

        if (prop === 'removeListener') {
          return (event: string, callback: EventCallback) => {
            this.eventListeners.get(event)?.delete(callback);
            if (!AurumCore.MANAGED_EVENTS.includes(event)) {
              (this.currentProvider.removeListener as (e: string, cb: EventCallback) => void)?.(event, callback);
            }
          };
        }

        // Get the value from currentProvider
        const provider = this.currentProvider as unknown as Record<string, unknown>;
        const value = provider[prop as string];

        // If it's a function, bind it to currentProvider and return
        // This ensures the function is called with correct context at CALL time
        if (typeof value === 'function') {
          return (...args: unknown[]) => {
            // Re-fetch in case provider changed between get and call (important for viem)
            const currentValue = (this.currentProvider as unknown as Record<string, unknown>)[prop as string];
            if (typeof currentValue === 'function') {
              return (currentValue as (...a: unknown[]) => unknown).apply(this.currentProvider, args);
            }
            return currentValue;
          };
        }

        // For non-function properties (isConnected, chainId, etc.), return the value directly
        return value;
      },
    };
    return new Proxy({} as AurumRpcProvider, handler);
  }

  private updateProvider(newProvider: AurumRpcProvider): void {
    this.currentProvider = newProvider;
    // Re-register provider-managed listeners on the new provider
    // (accountsChanged/connect/disconnect are managed by AurumCore)
    type EventCallback = (...args: unknown[]) => void;
    this.eventListeners.forEach((callbacks, event) => {
      if (!AurumCore.MANAGED_EVENTS.includes(event)) {
        callbacks.forEach((callback) => {
          (newProvider.on as (e: string, cb: EventCallback) => void)?.(event, callback);
        });
      }
    });
  }

  /* BRAND & THEME METHODS */

  private resolveBrandConfig(config?: AurumConfig): NonNullableBrandConfig {
    const { brand = {} } = config || {};
    const themeConfig = getDefaultThemeConfig(brand.theme || DEFAULT_THEME);

    return {
      logo: brand.logo ?? themeConfig.logo,
      theme: brand.theme ?? themeConfig.theme,
      primaryColor: brand.primaryColor ?? themeConfig.primaryColor,
      borderRadius: brand.borderRadius ?? themeConfig.borderRadius,
      modalZIndex: typeof brand.modalZIndex === 'number' ? brand.modalZIndex : themeConfig.modalZIndex,
      appName: brand.appName ?? themeConfig.appName,
      hideFooter: brand.hideFooter ?? themeConfig.hideFooter,
      font: brand.font ?? themeConfig.font,
      walletLayout: brand.walletLayout ?? themeConfig.walletLayout,
    };
  }

  private async tryRestoreConnection(): Promise<void> {
    try {
      // Wait for Zustand to finish hydrating from localStorage
      await waitForStoreHydration();

      const store = useAurumStore.getState();
      if (!store.isConnected || !store.walletId || !store.address || !store.walletName) {
        return;
      }

      const persistedAdapter = this.wallets.find((w) => w.id === store.walletId) || null;
      if (!persistedAdapter || !persistedAdapter.isInstalled()) {
        store.clearConnection();
        return;
      }

      const connectionResult = await persistedAdapter.tryRestoreConnection();
      if (!connectionResult || connectionResult.address.toLowerCase() !== store.address.toLowerCase()) {
        store.clearConnection();
        return;
      }

      this.connectedWalletAdapter = persistedAdapter;
      this.updateProvider(connectionResult.provider);
      this.userInfo = {
        publicAddress: checksumAddress(connectionResult.address as `0x${string}`),
        walletName: store.walletName,
        walletId: persistedAdapter.id,
        email: store.email ?? undefined,
      };

      this.setInternalAccountChangeListener(persistedAdapter);
    } catch {
      this.resetConnectionState();
    } finally {
      this.ready = true;
    }
  }

  private persistConnectionState(adapter: WalletAdapter, address: string, email?: string): void {
    useAurumStore.getState().setConnection(adapter.id, checksumAddress(address as `0x${string}`), adapter.name, email);
  }

  /* INTERNAL LISTENER METHODS */

  private setInternalAccountChangeListener(adapter: WalletAdapter): void {
    adapter.onAccountsChanged(async (accounts) => {
      if (accounts.length === 0) {
        await this.disconnect();
        return;
      }
      this.syncStateFromAccountsChanged(accounts);
    });
  }

  private async syncStateFromAccountsChanged(accounts: string[]): Promise<void> {
    if (!accounts.length || !accounts[0]) return;

    const prevAccount = this.userInfo?.publicAddress;
    const newAccount = checksumAddress(accounts[0] as `0x${string}`);

    if (newAccount !== prevAccount) {
      this.userInfo = {
        publicAddress: newAccount,
        walletName: this.userInfo?.walletName as WalletName,
        walletId: this.userInfo?.walletId as WalletId,
        email: this.userInfo?.email,
      };
      if (this.connectedWalletAdapter) {
        this.persistConnectionState(this.connectedWalletAdapter, newAccount, this.userInfo.email);
      }
      // Notify listeners of account change (provider-initiated, e.g. user switched in wallet UI)
      this.emitAccountsChanged([newAccount]);
    }
  }

  /**
   * Emit accountsChanged to listeners registered via rpcProvider.on('accountsChanged', cb)
   * This is the single source of truth - we don't forward to underlying providers to prevent duplicates
   */
  private emitAccountsChanged(accounts: string[]): void {
    const listeners = this.eventListeners.get('accountsChanged');
    if (listeners) {
      listeners.forEach((callback) => callback(accounts));
    }
  }

  /**
   * Emit connect event per EIP-1193 when provider becomes connected
   * @param chainId - The chain ID in hex format (e.g., "0x1")
   */
  private emitConnect(chainId: string): void {
    const listeners = this.eventListeners.get('connect');
    if (listeners) {
      listeners.forEach((callback) => callback({ chainId }));
    }
  }

  /**
   * Emit disconnect event per EIP-1193 when provider becomes disconnected
   * @param error - Optional error that caused the disconnection
   */
  private emitDisconnect(error?: { code: number; message: string }): void {
    const listeners = this.eventListeners.get('disconnect');
    if (listeners) {
      const disconnectError = error || { code: 4900, message: 'Disconnected' };
      listeners.forEach((callback) => callback(disconnectError));
    }
  }

  /* SWITCH CHAIN METHODS */

  private async attemptSwitchChain(hexChainId: string): Promise<void> {
    await this.rpcProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  }

  private async handleMissingChain(hexChainId: string, chain: Chain): Promise<void> {
    try {
      await this.addChain(chain);
      await this.attemptSwitchChain(hexChainId);
    } catch (addError: unknown) {
      if (isChainExistsError(addError as { code?: number; message?: string })) {
        await this.attemptSwitchChain(hexChainId);
      } else {
        throw addError;
      }
    }
  }

  private async addChain(chain: Chain): Promise<void> {
    if (!chain?.id || !chain?.name || !chain?.nativeCurrency || !chain?.rpcUrls?.default?.http) {
      throw new Error('Invalid chain configuration: missing required properties');
    }

    await this.rpcProvider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chain.id.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls.default.http,
          blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
        },
      ],
    });
  }

  /* REST */
  private resetConnectionState(): void {
    useAurumStore.getState().clearConnection();
    this.connectedWalletAdapter = null;
    this.updateProvider(this.skeletonProvider);
    this.userInfo = undefined;
  }
}

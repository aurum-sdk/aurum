import { getLogoDataUri } from '@aurum-sdk/logos';
import { WalletId, WalletName } from '@aurum-sdk/types';
import type { AurumRpcProvider } from '@aurum-sdk/types';
import type { WalletAdapter, WalletAdapterManifest } from '@src/types/internal';
import { getAnnouncedProvider } from '@src/utils/eip6963Registry';
import { isBraveBrowser } from '@src/utils/platform/isBraveBrowser';

const METAMASK_RDNS = 'io.metamask';
const PHANTOM_RDNS = 'app.phantom';
const RABBY_RDNS = 'io.rabby';
const BRAVE_RDNS = 'com.brave.wallet';

interface MultiInjectedEthereum extends AurumRpcProvider {
  isMetaMask?: boolean;
  isBraveWallet?: boolean;
  isRabby?: boolean;
  isPhantom?: boolean;
  providers?: MultiInjectedEthereum[];
}

function getWindowEthereum(): MultiInjectedEthereum | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { ethereum?: MultiInjectedEthereum }).ethereum;
}

function detectMetaMask(): boolean {
  if (getAnnouncedProvider(METAMASK_RDNS)) return true;
  const eth = getWindowEthereum();
  if (!eth) return false;
  if (eth.providers?.length) {
    return eth.providers.some((p) => p.isMetaMask && !p.isBraveWallet);
  }
  return Boolean(eth.isMetaMask && !eth.isBraveWallet);
}

function detectPhantom(): boolean {
  if (getAnnouncedProvider(PHANTOM_RDNS)) return true;
  if (typeof window === 'undefined') return false;
  const phantom = (window as unknown as { phantom?: { ethereum?: { isPhantom?: boolean } } }).phantom;
  if (phantom?.ethereum?.isPhantom) return true;
  return Boolean(getWindowEthereum()?.isPhantom);
}

function detectRabby(): boolean {
  if (getAnnouncedProvider(RABBY_RDNS)) return true;
  return Boolean(getWindowEthereum()?.isRabby);
}

function detectBrave(): boolean {
  if (getAnnouncedProvider(BRAVE_RDNS)) return true;
  return Boolean(getWindowEthereum()?.isBraveWallet);
}

export interface ManifestConfig {
  appName: string;
  appLogoUrl?: string;
  modalZIndex: number;
  theme: 'light' | 'dark';
  telemetry: boolean;
  embeddedProjectId?: string;
  walletConnectProjectId?: string;
}

export function createMetaMaskManifest(): WalletAdapterManifest {
  return {
    id: WalletId.MetaMask,
    name: WalletName.MetaMask,
    icon: getLogoDataUri(WalletId.MetaMask, 'brand') ?? '',
    hide: false,
    downloadUrl: 'https://metamask.io/download',
    wcDeepLinkUrl: 'metamask://wc?uri=',
    isInstalled: detectMetaMask,
    load: async (): Promise<WalletAdapter> => {
      const { MetaMaskAdapter } = await import('@src/wallet-adapters/MetaMaskAdapter');
      return new MetaMaskAdapter();
    },
  };
}

export function createPhantomManifest(): WalletAdapterManifest {
  return {
    id: WalletId.Phantom,
    name: WalletName.Phantom,
    icon: getLogoDataUri(WalletId.Phantom, 'brand') ?? '',
    hide: false,
    downloadUrl: 'https://phantom.com/download',
    wcDeepLinkUrl: 'phantom://wc?uri=',
    isInstalled: detectPhantom,
    load: async (): Promise<WalletAdapter> => {
      const { PhantomAdapter } = await import('@src/wallet-adapters/PhantomAdapter');
      return new PhantomAdapter();
    },
  };
}

export function createRabbyManifest(): WalletAdapterManifest {
  return {
    id: WalletId.Rabby,
    name: WalletName.Rabby,
    icon: getLogoDataUri(WalletId.Rabby, 'brand') ?? '',
    hide: false,
    downloadUrl: 'https://rabby.io',
    wcDeepLinkUrl: null,
    isInstalled: detectRabby,
    load: async (): Promise<WalletAdapter> => {
      const { RabbyAdapter } = await import('@src/wallet-adapters/RabbyAdapter');
      return new RabbyAdapter();
    },
  };
}

export function createBraveManifest(): WalletAdapterManifest {
  return {
    id: WalletId.Brave,
    name: WalletName.Brave,
    icon: getLogoDataUri(WalletId.Brave, 'brand') ?? '',
    downloadUrl: 'https://brave.com/download',
    wcDeepLinkUrl: null,
    isInstalled: detectBrave,
    get hide() {
      // Mirrors BraveAdapter.hide: visible when the wallet is detected or the user is on Brave.
      return !detectBrave() && !isBraveBrowser();
    },
    load: async (): Promise<WalletAdapter> => {
      const { BraveAdapter } = await import('@src/wallet-adapters/BraveAdapter');
      return new BraveAdapter();
    },
  };
}

export function createCoinbaseWalletManifest(config: ManifestConfig): WalletAdapterManifest {
  return {
    id: WalletId.CoinbaseWallet,
    name: WalletName.CoinbaseWallet,
    icon: getLogoDataUri(WalletId.CoinbaseWallet, 'brand') ?? '',
    hide: false,
    downloadUrl: 'https://www.coinbase.com/wallet/downloads',
    wcDeepLinkUrl: 'cbwallet://wc?uri=',
    isInstalled: () => true,
    load: async (): Promise<WalletAdapter> => {
      const { CoinbaseWalletAdapter } = await import('@src/wallet-adapters/CoinbaseWalletAdapter');
      return new CoinbaseWalletAdapter({
        appName: config.appName,
        appLogoUrl: config.appLogoUrl,
        telemetry: config.telemetry,
      });
    },
  };
}

export function createWalletConnectManifest(config: ManifestConfig): WalletAdapterManifest {
  return {
    id: WalletId.WalletConnect,
    name: WalletName.WalletConnect,
    icon: getLogoDataUri(WalletId.WalletConnect, 'brand') ?? '',
    hide: false,
    downloadUrl: null,
    wcDeepLinkUrl: null,
    isInstalled: () => true,
    load: async (): Promise<WalletAdapter> => {
      const { WalletConnectAdapter } = await import('@src/wallet-adapters/WalletConnectAdapter');
      return new WalletConnectAdapter({
        projectId: config.walletConnectProjectId,
        appName: config.appName,
        modalZIndex: config.modalZIndex,
        theme: config.theme,
        telemetry: config.telemetry,
      });
    },
  };
}

export function createEmailManifest(config: ManifestConfig): WalletAdapterManifest {
  return {
    id: WalletId.Email,
    name: WalletName.Email,
    icon: getLogoDataUri(WalletId.Email, 'brand') ?? '',
    hide: true,
    downloadUrl: null,
    wcDeepLinkUrl: null,
    isInstalled: () => true,
    load: async (): Promise<WalletAdapter> => {
      const { EmailAdapter } = await import('@src/wallet-adapters/EmailAdapter');
      return new EmailAdapter({
        projectId: config.embeddedProjectId,
        telemetry: config.telemetry,
      });
    },
  };
}

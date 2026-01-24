import { PAGE_IDS, PageIdType } from '@src/components/ConnectModal/PageIds';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { useNavigation } from '@src/contexts/NavigationContext';
import {
  clearExistingDeepLinkListeners,
  createWalletConnectHandlers,
  setupEventListeners,
  registerGlobalCleanup,
} from '@src/utils/walletConnectDeepLink';
import { WalletId } from '@aurum-sdk/types';
import { isConfigError } from '@src/utils/isConfigError';
import { sentryLogger } from '@src/services/sentry';
import { isMobile } from '@src/utils/platform/isMobile';

interface ResolvePayloadProps {
  adapter: WalletAdapter;
  displayedWallets?: WalletAdapter[];
  onConnect: (payload: WalletConnectionResult) => void;
  navigateTo?: (pageId: PageIdType) => void;
  setSuccess?: (success: boolean) => void;
}

export const useConnectSelectedWallet = () => {
  const { navigateTo } = useNavigation();

  const connectInstalledWallet = async ({ adapter, onConnect, setSuccess }: ResolvePayloadProps) => {
    navigateTo(PAGE_IDS.CONNECTING);

    try {
      const { address, provider } = await adapter.connect();

      setSuccess?.(true);

      setTimeout(() => {
        onConnect({ walletId: adapter.id, address, provider });
      }, 1000);
    } catch (error) {
      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
        return;
      }
      throw error;
    }
  };

  const connectUninstalledWalletQRCode = async ({ displayedWallets, onConnect, setSuccess }: ResolvePayloadProps) => {
    const walletConnectAdapter = displayedWallets?.find(({ id }) => id === WalletId.WalletConnect);
    if (!walletConnectAdapter) {
      sentryLogger.error('connectUninstalledWalletQRCode: WalletConnect adapter not found');
      throw new Error('WalletConnect adapter not found');
    }

    navigateTo(PAGE_IDS.QR_CODE);

    try {
      const { address, provider } = await walletConnectAdapter.connect();

      setSuccess?.(true);

      setTimeout(() => {
        onConnect({ walletId: walletConnectAdapter.id, address, provider });
      }, 1000);
    } catch (error) {
      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
        return;
      }
      throw error;
    }
  };

  const connectWithMobileDeepLink = async ({
    displayedWallets,
    adapter,
    onConnect,
    setSuccess,
  }: ResolvePayloadProps) => {
    const walletConnectAdapter = displayedWallets?.find(({ id }) => id === WalletId.WalletConnect);
    if (!walletConnectAdapter) {
      sentryLogger.error('connectWithMobileDeepLink: WalletConnect adapter not found');
      throw new Error('WalletConnect adapter not found');
    }

    let isRejected = false;

    clearExistingDeepLinkListeners();

    const handlers = createWalletConnectHandlers(adapter.wcDeepLinkUrl, () => {
      isRejected = true;
    });

    const cleanupEventListeners = setupEventListeners(handlers);
    const cleanupGlobal = registerGlobalCleanup(cleanupEventListeners);

    try {
      navigateTo(PAGE_IDS.MOBILE_DEEP_LINK);

      const { address, provider } = await walletConnectAdapter.connect();

      cleanupGlobal();

      if (isRejected) {
        return;
      }

      setSuccess?.(true);

      setTimeout(() => {
        onConnect({ walletId: walletConnectAdapter.id, address, provider });
      }, 1000);
    } catch (error) {
      cleanupGlobal();
      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
        return;
      }
      throw error;
    }
  };

  const connectWalletConnectModal = async ({ adapter, onConnect, setSuccess }: ResolvePayloadProps) => {
    try {
      // Use openModal() for AppKit modal flow
      if (!adapter.openModal) {
        throw new Error('Adapter does not support openModal');
      }
      const { address, provider } = await adapter.openModal();
      setSuccess?.(true);

      // Immediately resolve on mobile
      // (no nice UI for appkit modal for flashing a success state like on desktop)
      if (isMobile()) {
        onConnect({ walletId: adapter.id, address, provider });
      } else {
        setTimeout(() => {
          onConnect({ walletId: adapter.id, address, provider });
        }, 1000);
      }
    } catch (error) {
      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
        return;
      }
      // ignore - user rejected or closed AppKit modal
    }
  };

  const redirectToDownloadPage = async () => {
    navigateTo(PAGE_IDS.DOWNLOAD_WALLET);
  };

  return {
    // Both mobile and desktop
    connectInstalledWallet,
    connectWalletConnectModal,
    redirectToDownloadPage,

    // Desktop only
    connectUninstalledWalletQRCode,

    // Mobile only
    connectWithMobileDeepLink,
  };
};

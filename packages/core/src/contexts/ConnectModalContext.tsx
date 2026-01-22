import React, { createContext, useContext, useState } from 'react';

import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { PAGE_IDS } from '@src/components/ConnectModal/PageIds';
import { isMobile } from '@src/utils/platform/isMobile';
import { useConnectSelectedWallet } from '@src/hooks/useConnectSelectedWallet';
import { useNavigation } from '@src/contexts/NavigationContext';
import { EmailAuthProvider } from '@src/contexts/EmailAuthContext';
import { WalletId } from '@aurum-sdk/types';
import { isConfigError } from '@src/utils/isConfigError';
import { sentryLogger } from '@src/services/sentry';

interface ConnectModalProviderProps {
  children: React.ReactNode;
  displayedWallets: WalletAdapter[];
  onConnect: (result: WalletConnectionResult) => void;
}

interface ConnectModalContextValue {
  error: boolean;
  configError: boolean;
  success: boolean;
  qrSuccess: boolean;
  selectedWallet: WalletAdapter | null;
  displayedWallets: WalletAdapter[];
  goBackToHome: () => void;
  connectWallet: (wallet: WalletAdapter) => void;
  openWalletConnectModal: () => void;
  retryConnection: () => void;
  setSelectedWallet: (wallet: WalletAdapter | null) => void;
  setSuccess: (success: boolean) => void;
  setQrSuccess: (success: boolean) => void;
}

const ConnectModalContext = createContext<ConnectModalContextValue | null>(null);

export const useConnectModal = () => {
  const context = useContext(ConnectModalContext);
  if (!context) {
    throw new Error('useConnectModal must be used within a ConnectModalProvider');
  }
  return context;
};

export const ConnectModalProvider = ({ children, displayedWallets, onConnect }: ConnectModalProviderProps) => {
  const { navigateTo } = useNavigation();
  const {
    redirectToDownloadPage,
    connectInstalledWallet,
    connectWithMobileDeepLink,
    connectUninstalledWalletQRCode,
    connectWalletConnectModal,
  } = useConnectSelectedWallet();

  const [error, setError] = useState<boolean>(false);
  const [configError, setConfigError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [qrSuccess, setQrSuccess] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletAdapter | null>(null);

  const connectWallet = async (wallet: WalletAdapter) => {
    try {
      setError(false);
      setConfigError(false);
      setSuccess(false);
      setQrSuccess(false);
      setSelectedWallet(wallet);

      const isOnMobile = isMobile();
      const isDesktop = !isOnMobile;
      const hasDeepLink = Boolean(wallet.wcDeepLinkUrl);

      if (isDesktop) {
        if (!wallet.isInstalled() && !hasDeepLink) {
          return await redirectToDownloadPage();
        }

        // User clicks `WalletConnect` wallet button (or clicks wallet button for uninstalled wallet)
        if (wallet.id === WalletId.WalletConnect || !wallet.isInstalled())
          return await connectUninstalledWalletQRCode({
            adapter: wallet,
            displayedWallets,
            onConnect,
            setSuccess: setQrSuccess,
          });

        // User clicks wallet button that is installed
        return await connectInstalledWallet({ adapter: wallet, onConnect, setSuccess });
      }

      if (isOnMobile) {
        // On mobile, WalletConnect opens the AppKit modal
        if (wallet.id === WalletId.WalletConnect) {
          const wcAdapter = displayedWallets?.find(({ id }) => id === WalletId.WalletConnect);
          if (!wcAdapter) {
            sentryLogger.error('WalletConnect adapter not found');
            throw new Error('WalletConnect adapter not found');
          }
          return await connectWalletConnectModal({ adapter: wcAdapter, onConnect, setSuccess: setQrSuccess });
        }
        if (wallet.isInstalled()) return await connectInstalledWallet({ adapter: wallet, onConnect, setSuccess });
        if (hasDeepLink) {
          return await connectWithMobileDeepLink({ adapter: wallet, displayedWallets, onConnect, setSuccess });
        }
        return await redirectToDownloadPage();
      }
    } catch (err) {
      setError(true);
      if (isConfigError(err)) {
        setConfigError(true);
      }
    }
  };

  const retryConnection = () => {
    if (selectedWallet) connectWallet(selectedWallet);
  };

  const openWalletConnectModal = async () => {
    const wcAdapter = displayedWallets?.find(({ id }) => id === WalletId.WalletConnect);
    if (!wcAdapter) {
      sentryLogger.error('WalletConnect adapter not found');
      return;
    }
    try {
      await connectWalletConnectModal({ adapter: wcAdapter, onConnect, setSuccess: setQrSuccess });
    } catch {
      // User closed modal - ignore
    }
  };

  const goBackToHome = () => {
    navigateTo(PAGE_IDS.SELECT_WALLET);
    setSelectedWallet(null);
    setError(false);
    setConfigError(false);
    setSuccess(false);
    setQrSuccess(false);
  };

  const contextValue: ConnectModalContextValue = {
    error,
    configError,
    success,
    qrSuccess,
    selectedWallet,
    displayedWallets,
    goBackToHome,
    connectWallet,
    openWalletConnectModal,
    retryConnection,
    setSelectedWallet,
    setSuccess,
    setQrSuccess,
  };

  return (
    <ConnectModalContext.Provider value={contextValue}>
      <EmailAuthProvider
        onConnect={onConnect}
        navigateTo={navigateTo}
        displayedWallets={displayedWallets}
        setSelectedWallet={setSelectedWallet}
      >
        {children}
      </EmailAuthProvider>
    </ConnectModalContext.Provider>
  );
};

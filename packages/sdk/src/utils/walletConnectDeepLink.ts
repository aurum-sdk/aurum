type WindowWithAurumListeners = Window & {
  __aurumDeepLinkListeners?: Array<() => void>;
};

export interface WalletConnectEventHandlers {
  handleUri: (event: CustomEvent) => void;
  handleDisconnect: () => void;
}

/**
 * Clear any existing global deep link listeners to prevent interference
 */
export const clearExistingDeepLinkListeners = () => {
  const existingListeners = (window as WindowWithAurumListeners).__aurumDeepLinkListeners ?? [];
  existingListeners.forEach((cleanup) => cleanup());
  (window as WindowWithAurumListeners).__aurumDeepLinkListeners = [];
};

/**
 * Create event handlers for WalletConnect deep linking
 * @param deepLinkBaseUrl - Base URL for wallet deep linking
 * @param onRejection - Callback when connection is rejected
 */
export const createWalletConnectHandlers = (
  deepLinkBaseUrl: string | null,
  onRejection: () => void,
): WalletConnectEventHandlers => {
  const handleUri = (event: CustomEvent) => {
    const uri = event.detail.uri;
    if (uri && deepLinkBaseUrl) {
      const deepLinkUrl = `${deepLinkBaseUrl}${encodeURIComponent(uri)}`;
      window.location.href = deepLinkUrl;
    }
  };

  const handleDisconnect = () => {
    onRejection();
  };

  return { handleUri, handleDisconnect };
};

/**
 * Register event listeners and setup cleanup function
 * @param handlers - WalletConnect event handlers
 * @returns Cleanup function to remove all event listeners
 */
export const setupEventListeners = (handlers: WalletConnectEventHandlers): (() => void) => {
  const { handleUri, handleDisconnect } = handlers;

  window.addEventListener('walletconnect:uri', handleUri as EventListener);
  window.addEventListener('walletconnect:disconnect', handleDisconnect as EventListener);

  return () => {
    window.removeEventListener('walletconnect:uri', handleUri as EventListener);
    window.removeEventListener('walletconnect:disconnect', handleDisconnect as EventListener);
  };
};

/**
 * Register cleanup function globally for multi-instance management
 * @param cleanupFn - Cleanup function to register
 * @returns Global cleanup function that includes the provided cleanup
 */
export const registerGlobalCleanup = (cleanupFn: () => void): (() => void) => {
  if (!(window as WindowWithAurumListeners).__aurumDeepLinkListeners) {
    (window as WindowWithAurumListeners).__aurumDeepLinkListeners = [];
  }

  const cleanup = () => {
    const cleanupList = (window as WindowWithAurumListeners).__aurumDeepLinkListeners ?? [];
    const index = cleanupList.indexOf(cleanup);
    if (index > -1) cleanupList.splice(index, 1);
    cleanupFn();
  };

  (window as WindowWithAurumListeners).__aurumDeepLinkListeners?.push(cleanup);
  return cleanup;
};

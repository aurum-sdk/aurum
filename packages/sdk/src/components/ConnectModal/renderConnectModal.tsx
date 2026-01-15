import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { ThemeContainer } from '@src/ui';
import { ConnectUIProviders } from '@src/components/ConnectUIProviders';
import { ModalShell } from '@src/components/ConnectModal/ModalShell';
import { sortWallets } from '@src/utils/sortWallets';
import { createModalContainer } from '@src/utils/createModalContainer';
import { isMobile } from '@src/utils/platform/isMobile';
import { NonNullableBrandConfig, WalletId } from '@aurum/types';
import { sentryLogger } from '@src/services/sentry';

const CONTAINER_ID = 'aurum-modal-container';

interface RenderConnectModalProps {
  displayedWallets: WalletAdapter[];
  brandConfig: NonNullableBrandConfig;
}

export function renderConnectModal({
  displayedWallets,
  brandConfig,
}: RenderConnectModalProps): Promise<WalletConnectionResult> {
  return new Promise((resolve, reject) => {
    let sortedWallets = sortWallets(displayedWallets, { filterHidden: false });

    // On mobile, WalletConnect requires AppKit. Hide WalletConnect if AppKit is not available.
    const hasAppKit = sortedWallets.some((w) => w.id === WalletId.AppKit);
    if (isMobile() && !hasAppKit) {
      sortedWallets = sortedWallets.filter((w) => w.id !== WalletId.WalletConnect);
    }

    const { root, cleanup } = createModalContainer(CONTAINER_ID, brandConfig);

    const onConnect = (result: WalletConnectionResult) => {
      sentryLogger.info(`Wallet connected: ${result.walletId}`);
      cleanup();
      resolve(result);
    };

    const onClose = () => {
      cleanup();
      reject(new Error('User rejected request'));
    };

    root.render(
      <ThemeContainer theme={brandConfig.theme}>
        <ConnectUIProviders onConnect={onConnect} displayedWallets={sortedWallets}>
          <ModalShell onClose={onClose} brandConfig={brandConfig} />
        </ConnectUIProviders>
      </ThemeContainer>,
    );
  });
}

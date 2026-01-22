import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { ThemeContainer } from '@src/ui';
import { ConnectUIProviders } from '@src/components/ConnectUIProviders';
import { ModalShell } from '@src/components/ConnectModal/ModalShell';
import { sortWallets } from '@src/utils/sortWallets';
import { createModalContainer } from '@src/utils/createModalContainer';
import { NonNullableBrandConfig } from '@aurum-sdk/types';

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
    const sortedWallets = sortWallets(displayedWallets, { filterHidden: false });

    const { root, cleanup } = createModalContainer(CONTAINER_ID, brandConfig);

    const onConnect = (result: WalletConnectionResult) => {
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

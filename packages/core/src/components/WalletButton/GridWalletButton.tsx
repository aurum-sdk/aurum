import { WalletAdapterManifest } from '@src/types/internal';
import { Button } from '@src/ui';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';

export const GridWalletButton = ({
  wallet,
  connectWallet,
}: {
  wallet: WalletAdapterManifest;
  connectWallet: (wallet: WalletAdapterManifest) => void;
}) => {
  return (
    <Button
      variant="secondary"
      onClick={() => connectWallet(wallet)}
      aria-label={`Connect with ${wallet.name}`}
      title={wallet.name}
      size="xs"
      style={{ borderRadius: 'var(--aurum-border-radius-md)' }}
    >
      <WalletLogoWrapper id={wallet.id} size={44} variant="icon" />
    </Button>
  );
};

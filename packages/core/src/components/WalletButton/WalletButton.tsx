import { WalletAdapter } from '@src/types/internal';
import { Button, Row, Text } from '@src/ui';
import { QrCode } from 'lucide-react';
import { WalletButtonLabel } from '@src/components/WalletButton/WalletButtonLabel';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';
import { WalletId } from '@aurum-sdk/types';

export const WalletButton = ({
  wallet,
  connectWallet,
  isLastUsed = false,
  iconSize = 32,
}: {
  wallet: WalletAdapter;
  connectWallet: (wallet: WalletAdapter) => void;
  isLastUsed?: boolean;
  iconSize?: number;
}) => {
  const label = isLastUsed ? 'Recent' : undefined;

  return (
    <Button
      key={wallet.id}
      variant={'secondary'}
      onClick={() => connectWallet(wallet)}
      expand
      // account for the logo making the button larger, and the normal border
      // radius not being enough to make it fully rounded in xl radius config
      // (normally, button has `-2px` subtracted from the border radius to make it look better)
      style={{ borderRadius: 'var(--aurum-border-radius-md)' }}
    >
      <Row justify="space-between" align="center" style={{ width: '100%' }}>
        <Row align="center" gap={10}>
          <WalletLogoWrapper id={wallet.id} size={iconSize} sizeSlot="sm" />
          <Text weight="semibold" size="md">
            {wallet.name}
          </Text>
        </Row>
        {wallet.id === WalletId.WalletConnect && !isLastUsed ? (
          <QrCode color="var(--color-foreground)" size={18} />
        ) : (
          <WalletButtonLabel type={label} />
        )}
      </Row>
    </Button>
  );
};

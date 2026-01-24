import React, { useEffect, useState } from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useNavigation } from '@src/contexts/NavigationContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { QRCodeDisplay } from '@src/components/QRCodeDisplay/QRCodeDisplay';
import { Spacer, Column, Button, Text } from '@src/ui';
import { ChevronLeft, X, SquareArrowOutUpRight, CircleCheck } from 'lucide-react';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { PAGE_IDS } from '@src/components/ConnectModal/PageIds';
import { WalletName } from '@aurum-sdk/types';

export const QRCodePage: React.FC = () => {
  const { onDismiss } = useWidgetContext();
  const { navigateTo } = useNavigation();
  const { selectedWallet, error, configError, retryConnection, qrSuccess } = useConnectModal();

  const [connectionUri, setConnectionUri] = useState<string | null>(null);

  const goBackToHome = () => {
    navigateTo(PAGE_IDS.SELECT_WALLET);
  };

  const title =
    selectedWallet?.name === WalletName.WalletConnect ? 'Scan QR code' : `Scan with ${selectedWallet?.name} app`;

  useEffect(() => {
    const handleWalletConnectURI = (event: CustomEvent<{ uri: string }>) => {
      setConnectionUri(event.detail.uri);
    };

    window.addEventListener('walletconnect:uri', handleWalletConnectURI as EventListener);

    return () => {
      window.removeEventListener('walletconnect:uri', handleWalletConnectURI as EventListener);
    };
  }, []);

  // Don't auto-retry connect() if config error
  useEffect(() => {
    if (error && !configError) {
      setConnectionUri(null);
      retryConnection();
    }
  }, [error, configError]);

  if (!selectedWallet) {
    return null;
  }

  return (
    <>
      <ModalHeader
        leftAction={
          qrSuccess ? null : (
            <Button size="sm" variant="close" onClick={goBackToHome} aria-label="Go back">
              <ChevronLeft size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
        title={title}
        rightAction={
          qrSuccess ? null : (
            <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
              <X size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
      />
      {qrSuccess ? (
        <Column align="center" style={{ height: '8rem' }}>
          <CircleCheck color="var(--aurum-primary-color)" size={46} />
        </Column>
      ) : (
        <>
          <Column align="center" gap={24}>
            <QRCodeDisplay uri={error ? null : connectionUri} />
          </Column>
          {selectedWallet?.downloadUrl && (
            <>
              <Spacer size={15} />
              <Button
                variant="tertiary"
                expand
                onClick={() => window.open(selectedWallet.downloadUrl ?? '', '_blank', 'noopener,noreferrer')}
              >
                <SquareArrowOutUpRight size={16} color="var(--color-foreground-muted)" />
                <Text size="sm" weight="semibold" variant="secondary">
                  Download {selectedWallet.name}
                </Text>
              </Button>
            </>
          )}
        </>
      )}
    </>
  );
};

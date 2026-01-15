import React from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { Column, Text, Button } from '@src/ui';
import { X, SquareArrowOutUpRight, ChevronLeft } from 'lucide-react';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';

// Fallback page for when on mobile & no provider & no WalletConnect support
export const DownloadWalletPage: React.FC = () => {
  const { selectedWallet, goBackToHome } = useConnectModal();
  const { onDismiss } = useWidgetContext();

  if (!selectedWallet) {
    return null;
  }

  const downloadUrl = selectedWallet.downloadUrl;

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <ModalHeader
        leftAction={
          <Button size="sm" variant="close" onClick={goBackToHome} aria-label="Go back">
            <ChevronLeft size={20} color="var(--color-foreground-muted)" />
          </Button>
        }
        rightAction={
          <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
            <X size={20} color="var(--color-foreground-muted)" />
          </Button>
        }
        title={`Install ${selectedWallet.name}`}
      />

      <Column align="center" gap={24} justify="center">
        <WalletLogoWrapper id={selectedWallet.id} size={64} sizeSlot="lg" title={selectedWallet.name} />

        <Column align="center" gap={12}>
          <Text size="lg" weight="semibold" align="center">
            Install {selectedWallet.name}
          </Text>
          <Text size="md" variant="secondary" align="center" style={{ maxWidth: '20rem' }}>
            {selectedWallet.name} not installed. Please download then try again.
          </Text>
        </Column>

        {downloadUrl && (
          <>
            <Button variant="tertiary" onClick={handleDownload} expand>
              <SquareArrowOutUpRight size={16} color="var(--color-foreground-muted)" />
              <Text size="sm" weight="semibold" variant="secondary">
                Download {selectedWallet.name}
              </Text>
            </Button>
          </>
        )}
      </Column>
    </>
  );
};

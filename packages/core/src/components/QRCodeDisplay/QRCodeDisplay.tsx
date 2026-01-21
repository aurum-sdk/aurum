import React, { useRef, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Column, CopyButton, Row, Button } from '@src/ui';
import { generateQrCodeWalletLogo } from '@src/utils/generateQrCodeWalletLogo';
import { QRCodeSkeleton } from '@src/components/QRCodeDisplay/QRCodeSkeleton';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { getBorderRadiusScale } from '@src/constants/theme';
import { WalletAdapter } from '@src/types/internal';
import { AppKitAdapter } from '@src/wallet-adapters/AppKitAdapter';
import './QRCodeDisplay.css';

interface QRCodeDisplayProps {
  uri?: string | null;
  size?: number;
  title?: string;
  subtitle?: string;
  error?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ uri, size = 256 }) => {
  const { brandConfig } = useWidgetContext();
  const { selectedWallet, displayedWallets, connectWallet } = useConnectModal();
  const qrCodeDisplayColor = brandConfig.theme === 'light' ? '#000000' : '#6b7280';
  const bgColor = brandConfig.theme === 'light' ? '#ffffff' : '#121212';

  // Preserve the wallet logo when switching to AppKit modal
  const logoWalletRef = useRef<WalletAdapter | null>(null);

  useEffect(() => {
    // Only update the logo wallet if selectedWallet is not AppKit modal
    if (selectedWallet && !(selectedWallet instanceof AppKitAdapter)) {
      logoWalletRef.current = selectedWallet;
    }
  }, [selectedWallet]);

  const logoWallet = logoWalletRef.current || selectedWallet;

  const appKitAdapter = displayedWallets.find((w) => w instanceof AppKitAdapter);

  const handleAppKitConnect = async () => {
    if (appKitAdapter) {
      connectWallet(appKitAdapter);
    }
  };

  return (
    <Column align="center" gap={16}>
      <Column align="center" gap={4}>
        <div
          className={`qr-container ${!uri ? 'qr-container-shimmer' : ''}`}
          style={{
            width: size,
            height: size,
          }}
        >
          {!uri ? (
            <QRCodeSkeleton size={size} />
          ) : (
            <QRCode
              value={uri}
              size={size}
              quietZone={0}
              bgColor={bgColor}
              fgColor={qrCodeDisplayColor}
              logoImage={generateQrCodeWalletLogo(logoWallet || undefined)}
              logoWidth={size * 0.2}
              logoHeight={size * 0.2}
              removeQrCodeBehindLogo={true}
              logoPadding={6}
              qrStyle="dots"
              eyeRadius={getBorderRadiusScale(brandConfig.borderRadius).xs}
            />
          )}
        </div>
        <Row justify={appKitAdapter ? 'space-between' : 'center'} style={{ width: '100%' }}>
          <CopyButton text={uri || ''} disabled={!uri} variant="secondary" label="Copy URI" />
          {appKitAdapter && (
            <Button
              variant="text"
              size="sm"
              onClick={handleAppKitConnect}
              style={{ color: 'var(--color-foreground-muted)', fontWeight: '500' }}
            >
              Open Modal
            </Button>
          )}
        </Row>
      </Column>
    </Column>
  );
};

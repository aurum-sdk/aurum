import React, { useEffect, useRef } from 'react';
import { QRCodeStyling } from '@liquid-js/qr-code-styling';
import { Column, CopyButton, Row, Button } from '@src/ui';
import { generateQrCodeWalletLogo } from '@src/utils/generateQrCodeWalletLogo';
import { QRCodeSkeleton } from '@src/components/QRCodeDisplay/QRCodeSkeleton';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { WalletId } from '@aurum-sdk/types';
import { getBorderRadiusScale } from '@src/constants/theme';
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
  const { selectedWallet, displayedWallets, openWalletConnectModal } = useConnectModal();
  const qrCodeDisplayColor = brandConfig.theme === 'light' ? '#000000' : '#6b7280';
  const bgColor = brandConfig.theme === 'light' ? '#ffffff' : '#121212';
  const logoImage = generateQrCodeWalletLogo(selectedWallet || undefined);
  const eyeRadius = getBorderRadiusScale(brandConfig.borderRadius).xs;
  const cornerType: 'extra-rounded' | 'square' = eyeRadius > 0 ? 'extra-rounded' : 'square';

  const containerRef = useRef<HTMLDivElement>(null);
  // We only need to know whether WalletConnect is configured — the openModal capability
  // belongs to the loaded adapter, but it's the only wallet that exposes openModal so the
  // manifest's presence is a sufficient proxy.
  const hasWalletConnect = displayedWallets.some(({ id }) => id === WalletId.WalletConnect);

  useEffect(() => {
    if (!containerRef.current || !uri) return;

    containerRef.current.innerHTML = '';

    const qr = new QRCodeStyling({
      data: uri,
      image: logoImage,
      dotsOptions: {
        type: 'dot',
        color: qrCodeDisplayColor,
        size: 10,
      },
      imageOptions: {
        mode: 'center',
        imageSize: 0.3,
        margin: 1,
        fill: { color: bgColor },
      },
      cornersSquareOptions: { type: cornerType },
      cornersDotOptions: { type: cornerType },
      backgroundOptions: {
        color: bgColor,
        margin: 0,
      },
    });

    qr.append(containerRef.current);

    // The library sizes the SVG from dotsOptions.size × numModules.
    // Pin it to our fixed container so it scales cleanly regardless of data length.
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      svg.style.width = `${size}px`;
      svg.style.height = `${size}px`;
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [uri, size, qrCodeDisplayColor, bgColor, logoImage, cornerType]);

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
          {!uri ? <QRCodeSkeleton size={size} /> : <div ref={containerRef} style={{ width: size, height: size }} />}
        </div>
        <Row justify={hasWalletConnect ? 'space-between' : 'center'} style={{ width: '100%' }}>
          <CopyButton text={uri || ''} disabled={!uri} variant="secondary" label="Copy URI" />
          {hasWalletConnect && (
            <Button
              variant="text"
              size="sm"
              onClick={openWalletConnectModal}
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

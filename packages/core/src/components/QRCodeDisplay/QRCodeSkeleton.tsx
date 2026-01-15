import React from 'react';
import { generateQrCodeWalletLogo } from '@src/utils/generateQrCodeWalletLogo';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { QREye } from '@src/components/QRCodeDisplay/QREye';
import { generateSkeletonDots } from '@src/components/QRCodeDisplay/generateSkeletonDots';
import './QRCodeSkeleton.css';

interface QRCodeSkeletonProps {
  size?: number;
}

export const QRCodeSkeleton: React.FC<QRCodeSkeletonProps> = ({ size = 128 }) => {
  const { brandConfig } = useWidgetContext();
  const { selectedWallet } = useConnectModal();

  const fillColor = brandConfig.theme === 'light' ? '#777777' : '#6b7280';
  const bgColor = brandConfig.theme === 'light' ? '#ffffff' : '#121212';

  const logoSize = size * 0.2;
  const eyeRadius = 6;
  const dotSize = size / 40;
  const eyeSize = 32;
  const gridSize = 40;

  return (
    <div className="qr-skeleton-container" style={{ height: size }}>
      <svg width={size} height={size} className="qr-skeleton-svg">
        {/* Background */}
        <rect width={size} height={size} fill={bgColor} />

        {/* Generate dots pattern */}
        {generateSkeletonDots({ logoSize, dotSize, eyeSize, gridSize, fillColor })}

        {/* QR code eyes */}
        <QREye
          x={0}
          y={0}
          eyeSize={eyeSize}
          eyeRadius={eyeRadius}
          dotSize={dotSize}
          fillColor={fillColor}
          bgColor={bgColor}
        />
        <QREye
          x={size - eyeSize}
          y={0}
          eyeSize={eyeSize}
          eyeRadius={eyeRadius}
          dotSize={dotSize}
          fillColor={fillColor}
          bgColor={bgColor}
        />
        <QREye
          x={0}
          y={size - eyeSize}
          eyeSize={eyeSize}
          eyeRadius={eyeRadius}
          dotSize={dotSize}
          fillColor={fillColor}
          bgColor={bgColor}
        />

        {/* Logo placeholder with square background */}
        <rect
          x={size / 2 - logoSize / 2}
          y={size / 2 - logoSize / 2}
          width={logoSize}
          height={logoSize}
          fill={bgColor}
          rx={6}
          ry={6}
        />

        {/* Selected wallet logo or WalletConnect fallback */}
        <image
          x={size / 2 - logoSize / 2}
          y={size / 2 - logoSize / 2}
          width={logoSize}
          height={logoSize}
          href={generateQrCodeWalletLogo(selectedWallet || undefined)}
          opacity="1.0"
        />
      </svg>
    </div>
  );
};

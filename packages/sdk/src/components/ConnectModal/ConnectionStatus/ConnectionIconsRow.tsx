import React from 'react';
import { AurumLogo } from '@aurum/logos/react';
import { Row, Button } from '@src/ui';
import { RotateCcw } from 'lucide-react';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';
import { BrandLogo } from '@src/components/ConnectModal/BrandLogo';
import { StatusIcons } from '@src/components/ConnectModal/ConnectionStatus/StatusIcons';
import { BrandConfig, WalletId } from '@aurum/types';

interface ConnectionIconsRowProps {
  brandConfig: BrandConfig;
  walletId: WalletId;
  walletName: string;
  success: boolean;
  error: boolean;
  shouldShake: boolean;
  onRetry: () => void;
}

export const ConnectionIconsRow: React.FC<ConnectionIconsRowProps> = ({
  brandConfig,
  walletId,
  walletName,
  success,
  error,
  shouldShake,
  onRetry,
}) => {
  return (
    <div className={`connection-icons-row ${shouldShake ? 'wallet-icon-shake' : ''}`}>
      <Row gap={4}>
        <div className="brand-logo-container">
          {brandConfig.logo ? (
            <BrandLogo size={54} sizeSlot="md" />
          ) : (
            <AurumLogo variant="black" size={53} radius={brandConfig.borderRadius} sizeSlot="md" title="Aurum" />
          )}
        </div>
        <StatusIcons success={success} error={error} />
        <div className="wallet-logo-with-retry">
          <WalletLogoWrapper id={walletId} size={54} sizeSlot="md" title={walletName} />
          {error && (
            <Button variant="secondary" className="retry-icon-overlay" onClick={onRetry} aria-label="Retry connection">
              <RotateCcw size={18} />
            </Button>
          )}
        </div>
      </Row>
    </div>
  );
};

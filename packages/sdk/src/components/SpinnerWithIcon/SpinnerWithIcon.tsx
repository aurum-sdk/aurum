import { Spinner, Row } from '@src/ui';
import { Circle } from 'lucide-react';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';
import { WalletId, BorderRadiusSizeSlot } from '@aurum/types';
import './SpinnerWithIcon.css';

export const SpinnerWithIcon = ({
  walletId,
  strokeWidth = 2,
  size = 64,
  error = false,
  sizeSlot = 'sm',
}: {
  walletId?: WalletId;
  strokeWidth?: number;
  size?: number;
  error?: boolean;
  sizeSlot?: BorderRadiusSizeSlot;
}) => {
  return (
    <div className="spinner-with-icon">
      <Row align="center" justify="center" gap={0} style={{ position: 'relative' }}>
        {error ? (
          <Circle size={size} color="var(--color-error)" strokeWidth={strokeWidth} />
        ) : (
          <Spinner size={size} color="var(--color-foreground-muted)" strokeWidth={strokeWidth} />
        )}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {walletId && <WalletLogoWrapper id={walletId} size={size / 2} sizeSlot={sizeSlot} />}
        </div>
      </Row>
    </div>
  );
};

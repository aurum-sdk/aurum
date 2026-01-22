import React, { useEffect, useState } from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { Spacer, Column, Row, Button, Text } from '@src/ui';
import { X, ChevronLeft, CircleCheck } from 'lucide-react';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { ANIMATION_DURATION } from '@src/constants/theme';
import { ConnectionIconsRow } from '@src/components/ConnectModal/ConnectionStatus/ConnectionIconsRow';
import './ConnectionStatus.css';

interface ConnectionStatusBaseProps {
  title?: string;
  pendingHeaderText: string;
  pendingSubContent: React.ReactNode;
  extraContent?: React.ReactNode;
}

// EIP-1193 error codes
const ERROR_CODE = {
  USER_REJECTED: 4001,
  REQUEST_PENDING: -32002,
} as const;

export const ConnectionStatusBase: React.FC<ConnectionStatusBaseProps> = ({
  title,
  pendingHeaderText,
  pendingSubContent,
  extraContent,
}) => {
  const { selectedWallet, error, errorCode, success, goBackToHome, retryConnection } = useConnectModal();
  const { onDismiss, brandConfig } = useWidgetContext();
  const [shouldShake, setShouldShake] = useState(false);

  // Trigger shake animation when error occurs
  useEffect(() => {
    if (error) {
      setShouldShake(true);
      const timer = setTimeout(() => {
        setShouldShake(false);
      }, ANIMATION_DURATION.SHAKE);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!selectedWallet) {
    return null;
  }

  const getHeaderVariant = () => {
    if (success) return 'success';
    if (error && errorCode !== ERROR_CODE.REQUEST_PENDING) return 'error';
    return 'primary';
  };

  const getHeaderText = () => {
    if (success) return '';
    if (error) {
      if (errorCode === ERROR_CODE.REQUEST_PENDING) return 'Request Pending';
      return 'Request Rejected';
    }
    return pendingHeaderText;
  };

  const renderSubContent = () => {
    if (success) {
      return (
        <div className="success-icon-large">
          <CircleCheck color="var(--aurum-primary-color)" size={46} />
        </div>
      );
    }

    if (error) {
      if (errorCode === ERROR_CODE.REQUEST_PENDING) {
        return (
          <Text align="center" size="sm" variant="secondary">
            Check your wallet for a {'\n'}pending connection request
          </Text>
        );
      }
      return (
        <Text align="center" size="sm" variant="secondary">
          Please try again or select a {'\n'}different wallet
        </Text>
      );
    }

    return pendingSubContent;
  };

  return (
    <>
      <ModalHeader
        leftAction={
          success ? null : (
            <Button size="sm" variant="close" onClick={goBackToHome} aria-label="Go back">
              <ChevronLeft size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
        rightAction={
          success ? null : (
            <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
              <X size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
        title={title || selectedWallet.name}
      />
      <Spacer size={12} />
      <Column align="center" style={{ maxWidth: '15.625rem', margin: '0 auto' }} gap={8}>
        <ConnectionIconsRow
          brandConfig={brandConfig}
          walletId={selectedWallet.id}
          walletName={selectedWallet.name}
          success={success}
          error={error}
          shouldShake={shouldShake}
          onRetry={retryConnection}
        />
        <Spacer size={12} />
        <Column align="center" justify="start" gap={0} style={{ minHeight: '5rem', width: '100%' }}>
          <Column gap={8} style={{ width: '100%' }} align="center">
            <Row align="center" justify="center" gap={0} style={{ width: '100%' }}>
              <Text size="lg" variant={getHeaderVariant()} weight="bold" align="center">
                {getHeaderText()}
              </Text>
            </Row>
            <Row align="center" justify="center" gap={0} style={{ width: '100%', whiteSpace: 'pre-line' }}>
              {renderSubContent()}
            </Row>
            {extraContent}
          </Column>
        </Column>
      </Column>
      <Spacer size={12} />
    </>
  );
};

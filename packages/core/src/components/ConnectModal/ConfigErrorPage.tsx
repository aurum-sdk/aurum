import React from 'react';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { Column, Text, Button } from '@src/ui';
import { X, AlertTriangle, ChevronLeft } from 'lucide-react';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';

export const ConfigErrorPage: React.FC = () => {
  const { onDismiss } = useWidgetContext();
  const { goBackToHome } = useConnectModal();

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
        title="Error"
      />

      <Column align="center" gap={24} justify="center">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--aurum-border-radius-md)',
            backgroundColor: 'color-mix(in srgb, var(--color-error) 80%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={32} color="white" />
        </div>

        <Column align="center" gap={12}>
          <Text size="lg" weight="semibold" align="center">
            Configuration Error
          </Text>
          <Text size="md" variant="secondary" align="center" style={{ maxWidth: '20rem' }}>
            Missing required project ID
          </Text>
        </Column>

        <Button variant="secondary" onClick={goBackToHome} expand>
          <Text size="sm" weight="semibold">
            Back
          </Text>
        </Button>
      </Column>
    </>
  );
};

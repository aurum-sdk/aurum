import { AurumLogo } from '@aurum-sdk/logos/react';
import { Row, Text, Button } from '@src/ui';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import './PoweredBy.css';

export const PoweredBy = () => {
  const { brandConfig } = useWidgetContext();

  return (
    <div className="powered-by-container">
      <Row align="center" justify="center" gap={0}>
        <Button
          variant="text"
          size="xs"
          onClick={() => window.open('https://aurumsdk.com', '_blank')}
          style={{ gap: '0.15rem' }}
        >
          <Text variant="secondary" size="xs">
            Powered by
          </Text>
          <Row align="center" justify="center" gap={0}>
            <AurumLogo
              variant="icon"
              size={22}
              radius={brandConfig.borderRadius}
              sizeSlot="xs"
              color="var(--color-foreground-muted)"
              title="Aurum"
            />
            <Text variant="secondary" weight="bold" style={{ fontSize: '13px' }}>
              Aurum
            </Text>
          </Row>
        </Button>
      </Row>
    </div>
  );
};

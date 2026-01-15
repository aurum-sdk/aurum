import React from 'react';
import { Row } from '@src/ui';
import { X } from 'lucide-react';

const ELLIPSES_COUNT = 3;

interface StatusIconsProps {
  success: boolean;
  error: boolean | string | null;
}

export const StatusIcons: React.FC<StatusIconsProps> = ({ success, error }) => {
  const getStatusKey = () => {
    if (success) return 'success';
    if (error) return 'error';
    return 'connecting';
  };

  if (success) {
    return (
      <Row
        key={getStatusKey()}
        align="center"
        justify="center"
        gap={0}
        style={{ padding: '0 0.5rem', minHeight: '3rem' }}
      >
        <div className="ellipses-success">
          {Array.from({ length: ELLIPSES_COUNT }, (_, i) => (
            <span key={i}>·</span>
          ))}
        </div>
      </Row>
    );
  }

  if (error) {
    const dotsBeforeIcon = Math.floor(ELLIPSES_COUNT / 2);
    const dotsAfterIcon = ELLIPSES_COUNT - dotsBeforeIcon - 1;

    return (
      <Row
        key={getStatusKey()}
        align="center"
        justify="center"
        gap={0}
        style={{ padding: '0 0.5rem', minHeight: '3rem' }}
      >
        <div className="status-icon-with-dots error">
          {Array.from({ length: dotsBeforeIcon }, (_, i) => (
            <span key={`before-${i}`} className="dot">
              ·
            </span>
          ))}
          <div className="icon-center">
            <X size={24} color="var(--color-error)" />
          </div>
          {Array.from({ length: dotsAfterIcon }, (_, i) => (
            <span key={`after-${i}`} className="dot">
              ·
            </span>
          ))}
        </div>
      </Row>
    );
  }

  return (
    <Row
      key={getStatusKey()}
      align="center"
      justify="center"
      gap={0}
      style={{ padding: '0 0.5rem', minHeight: '3rem' }}
    >
      <div className="ellipses-loading">
        {Array.from({ length: ELLIPSES_COUNT }, (_, i) => (
          <span key={i}>·</span>
        ))}
      </div>
    </Row>
  );
};

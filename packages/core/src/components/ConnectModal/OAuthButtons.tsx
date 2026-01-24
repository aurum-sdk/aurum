import { useState } from 'react';
import { Button, Row, Text } from '@src/ui';
import { WalletAdapter } from '@src/types/internal';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';
import { sentryLogger } from '@src/services/sentry';

interface OAuthButtonsProps {
  adapters: WalletAdapter[];
}

export const OAuthButtons = ({ adapters }: OAuthButtonsProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleOAuthSignIn = async (adapter: WalletAdapter) => {
    if (!adapter.signInWithOAuth) {
      sentryLogger.error(`${adapter.name} adapter signIn not available`);
      setError(`${adapter.name} sign-in is not available`);
      return;
    }

    try {
      setLoadingId(adapter.id);
      setError('');
      await adapter.signInWithOAuth();
    } catch (err) {
      setLoadingId(null);
      sentryLogger.error(`Failed to sign in with ${adapter.name}`, { error: err });
      setError(`Failed to sign in with ${adapter.name}`);
    }
  };

  if (adapters.length === 0) return null;

  return (
    <div>
      <Row justify="center" gap={12}>
        {adapters.map((adapter) => (
          <Button
            key={adapter.id}
            variant="secondary"
            onClick={() => handleOAuthSignIn(adapter)}
            aria-label={`Sign in with ${adapter.name}`}
            title={adapter.name}
            loading={loadingId === adapter.id}
            disabled={loadingId !== null}
            size="xs"
            style={{ width: 56, height: 56, borderRadius: 'var(--aurum-border-radius-md)' }}
          >
            {loadingId !== adapter.id && <WalletLogoWrapper id={adapter.id} size={44} variant="icon" />}
          </Button>
        ))}
      </Row>
      {error && (
        <Text variant="error" size="sm" align="center" style={{ marginTop: '0.5rem' }}>
          {error}
        </Text>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useEmailAuth } from '@src/contexts/EmailAuthContext';
import { Button, Text } from '@src/ui';
import { ChevronRight, Mail } from 'lucide-react';
import './EmailAuth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailAuth = () => {
  const { emailAuthState, error, sendEmailOTP, clearError } = useEmailAuth();

  const [email, setEmail] = useState(emailAuthState.email);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonFocused, setIsButtonFocused] = useState(false);

  const showPrimary = isValidEmail && (isFocused || isButtonFocused);

  useEffect(() => {
    setIsValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  const handleSend = async () => {
    try {
      setIsLoading(true);
      await sendEmailOTP(email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (error) {
      clearError();
    }
    if (e.key === 'Enter' && isValidEmail) {
      handleSend();
    }
  };

  const getInputClassName = () => {
    const classes = ['email-auth-input'];
    if (error) classes.push('email-auth-input--error');
    return classes.join(' ');
  };

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        <div className="email-auth-icon">
          <Mail size={20} color="var(--color-foreground-muted)" />
        </div>
        <input
          aria-label="Email address"
          id="email-input"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          className={getInputClassName()}
          disabled={isLoading}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          size="sm"
          variant={showPrimary ? 'primary' : 'secondary'}
          loading={isLoading}
          onClick={handleSend}
          disabled={!isValidEmail}
          className="email-auth-submit-button"
          onFocus={() => setIsButtonFocused(true)}
          onBlur={() => setIsButtonFocused(false)}
        >
          {!isLoading && (
            <ChevronRight
              size={16}
              color={showPrimary ? 'var(--color-primary-foreground)' : 'var(--color-foreground-subtle)'}
            />
          )}
        </Button>
      </div>

      {error && (
        <Text variant="error" size="sm" align="left" style={{ width: '100%', marginTop: '0.3125rem' }}>
          {error}
        </Text>
      )}
    </>
  );
};

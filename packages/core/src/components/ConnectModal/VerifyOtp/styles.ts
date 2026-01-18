import React from 'react';

export const getOtpInputStyles = (isFocused: boolean, hasError: boolean, hideCaret: boolean): React.CSSProperties => ({
  width: '2.625rem',
  height: '3rem',
  textAlign: 'center',
  fontFamily: 'inherit',
  fontSize: '1.375rem',
  border: `${hasError || !isFocused ? '0.0625rem' : '0.125rem'} solid ${
    hasError ? 'var(--color-error)' : isFocused ? 'var(--color-border-focus)' : 'var(--color-border-muted)'
  }`,
  borderRadius: 'var(--aurum-border-radius-sm)',
  outline: 'none',
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-foreground)',
  caretColor: hideCaret ? 'transparent' : 'auto',
  transition: 'border-color 0.3s ease',
});

export const emailHighlightStyles: React.CSSProperties = {
  fontWeight: 'bold',
  color: 'var(--color-primary)',
};

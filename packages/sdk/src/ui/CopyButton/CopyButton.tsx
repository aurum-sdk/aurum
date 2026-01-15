import React, { useState } from 'react';
import { Button, Text } from '@src/ui';
import { Copy, CopyCheck } from 'lucide-react';

export interface CopyButtonProps {
  text: string;
  /** Label to show next to icon. Pass empty string or undefined for icon-only mode. */
  label?: string;
  /** Label to show after copying. Pass empty string or undefined for icon-only mode. */
  copiedLabel?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error' | 'brand';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  iconSize?: number;
  disabled?: boolean;
}

// Map text variants to new semantic color tokens
const variantColorMap: Record<string, string> = {
  primary: 'var(--color-foreground)',
  secondary: 'var(--color-foreground-muted)',
  tertiary: 'var(--color-foreground-subtle)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  brand: 'var(--color-primary)',
};

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  copiedLabel,
  variant = 'brand',
  size = 'sm',
  iconSize = 16,
  disabled = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!text || disabled || isCopied) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy text', error);
    }
  };

  // Icon-only mode
  if (!label && !copiedLabel) {
    return (
      <Button
        variant="text"
        size={size}
        onClick={handleCopy}
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', padding: '0.25rem' }}
      >
        {isCopied ? (
          <CopyCheck size={iconSize} color="var(--color-success)" />
        ) : (
          <Copy size={iconSize} color={variantColorMap[variant]} />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="text"
      size={size}
      onClick={handleCopy}
      disabled={disabled}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {isCopied ? (
        <Text
          variant="success"
          size="sm"
          align="center"
          weight="semibold"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CopyCheck size={iconSize} color="var(--color-success)" />
          {copiedLabel || 'Copied'}
        </Text>
      ) : (
        <Text
          variant={variant}
          size="sm"
          align="center"
          weight="semibold"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Copy size={iconSize} color={variantColorMap[variant]} />
          {label || 'Copy'}
        </Text>
      )}
    </Button>
  );
};

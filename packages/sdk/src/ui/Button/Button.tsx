import React from 'react';

import { Spinner } from '@src/ui';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'text' | 'close';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  expand?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  expand = false,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const baseClassName = 'aurum-button';
  const classes = [
    baseClassName,
    `${baseClassName}--${variant}`,
    `${baseClassName}--${size}`,
    expand && `${baseClassName}--full-width`,
    loading && `${baseClassName}--loading`,
    disabled && `${baseClassName}--disabled`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner color="currentColor" />}
      {children}
    </button>
  );
};

import React from 'react';
import './Text.css';

export interface TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'brand' | 'success';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Text: React.FC<TextProps> = ({
  variant = 'primary',
  as = 'p',
  size = 'md',
  weight = 'normal',
  align = 'left',
  children,
  className,
  style,
  ...props
}) => {
  const Element = as;

  const baseClassName = 'aurum-text';
  const classes = [
    baseClassName,
    `${baseClassName}--${variant}`,
    size && `${baseClassName}--${size}`,
    weight && `${baseClassName}--${weight}`,
    align && `${baseClassName}--align-${align}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Element className={classes} {...props} style={style}>
      {children}
    </Element>
  );
};

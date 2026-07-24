import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${fullWidth ? 'button--full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import type React from 'react';
import { Button as MuiButton } from '@mui/material';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'text' | 'contained' | 'outlined';
  isDisabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  color?: 'secondary' | 'success' | 'error';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'contained',
  isDisabled = false,
  onClick,
  type = 'button',
  color
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
    </MuiButton>
  );
};

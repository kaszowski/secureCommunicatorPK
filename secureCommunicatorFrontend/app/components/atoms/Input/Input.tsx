import React from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

interface InputProps
  extends Omit<TextFieldProps, 'variant' | 'size' | 'color'> {
  children?: React.ReactNode;
  id: string;
  variant?: 'filled' | 'outlined' | 'standard';
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({
  children,
  id,
  variant = 'outlined',
  size = 'medium',
  color = undefined,
  onChange,
  ...props
}) => {
  return (
    <TextField
      id={id}
      variant={variant}
      label={children}
      size={size}
      color={color}
      {...props}
      onChange={onChange}
    />
  );
};

export default Input;

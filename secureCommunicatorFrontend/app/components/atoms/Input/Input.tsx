import React from 'react';
import { useState } from 'react';
import { TextField } from '@mui/material';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
      variant={variant}
      label={children}
      size={size}
      color={color}
      onChange={onChange}
      {...props}
    />
  );
};

export default Input;

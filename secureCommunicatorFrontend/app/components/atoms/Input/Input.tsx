import React from 'react';
import { useState } from 'react';
import { TextField } from '@mui/material';

interface InputProps {
  children?: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'standard';
  size?: 'small' | 'medium';
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({
  children,
  variant = 'outlined',
  size = 'medium',
  onChange
}) => {
  return (
    <TextField
      variant={variant}
      label={children}
      size={size}
      onChange={onChange}
    />
  );
};

export default Input;

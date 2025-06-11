import React from 'react';
import {
  TextField as MuiTextField,
  type TextFieldProps as MuiTextFieldProps,
} from '@mui/material';

interface InputProps extends Omit<MuiTextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
}

const Input: React.FC<InputProps> = ({ variant = 'outlined', ...props }) => {
  return <MuiTextField variant={variant} fullWidth {...props} />;
};

export default Input;

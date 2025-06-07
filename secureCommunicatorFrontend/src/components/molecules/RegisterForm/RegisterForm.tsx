import React, { useState } from 'react';
import { Box, Typography, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Input, Button } from '../../atoms';

interface RegisterFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  loading?: boolean;
  error?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    onSubmit(formData);
  };

  const isFormValid = () => {
    return (
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword
    );
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 400 }}
    >
      <Typography variant='h4' component='h1' gutterBottom align='center'>
        Register
      </Typography>

      {error && (
        <Typography color='error' variant='body2' sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Input
        label='Username'
        value={formData.username}
        onChange={handleChange('username')}
        margin='normal'
        required
        disabled={loading}
      />

      <Input
        label='Email'
        type='email'
        value={formData.email}
        onChange={handleChange('email')}
        margin='normal'
        required
        disabled={loading}
      />

      <Input
        label='Password'
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange('password')}
        margin='normal'
        required
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge='end'
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Input
        label='Confirm Password'
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        margin='normal'
        required
        disabled={loading}
        error={Boolean(
          formData.confirmPassword &&
            formData.password !== formData.confirmPassword
        )}
        helperText={
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword
            ? 'Passwords do not match'
            : ''
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge='end'
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type='submit'
        variant='contained'
        fullWidth
        disabled={loading || !isFormValid()}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? 'Creating account...' : 'Register'}
      </Button>
    </Box>
  );
};

export default RegisterForm;

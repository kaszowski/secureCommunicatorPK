import React, { useState } from 'react';
import { Box, Typography, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Input, Button } from '../../atoms';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onSubmit(username.trim(), password);
    }
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 400 }}
    >
      <Typography variant='h4' component='h1' gutterBottom align='center'>
        Login
      </Typography>

      {error && (
        <Typography color='error' variant='body2' sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Input
        label='Username'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin='normal'
        required
        disabled={loading}
      />

      <Input
        label='Password'
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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

      <Button
        type='submit'
        variant='contained'
        fullWidth
        disabled={loading || !username.trim() || !password.trim()}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </Box>
  );
};

export default LoginForm;

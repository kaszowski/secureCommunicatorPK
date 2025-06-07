import React, { useState } from 'react';
import Input from '~/components/atoms/Input/Input';
import type { Route } from './+types/LoginPage';
import { Button } from '~/components/atoms/Button/Button';
import { Container, Paper, Typography, Box, Stack } from '@mui/material';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'SC - Login' },
    { name: 'description', content: 'Secure Communicator Login' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ];
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Login attempt:', { ...formData, password: '******' });
    // TODO: Implement actual login logic
  };

  return (
    <Container component='main' maxWidth='sm'>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            borderRadius: 2
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography
              component='h1'
              variant='h4'
              color='primary.main'
              fontWeight='bold'
            >
              🔒 Secure Communicator
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Sign in to your account
            </Typography>
          </Box>

          <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Stack spacing={3}>
              <Input
                id='username'
                type='text'
                required
                fullWidth
                value={formData.username}
                onChange={handleInputChange('username')}
              >
                Username
              </Input>

              <Input
                id='password'
                type='password'
                required
                fullWidth
                value={formData.password}
                onChange={handleInputChange('password')}
              >
                Password
              </Input>

              <Button type='submit' variant='contained' color='secondary'>
                Sign In
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Don't have an account?{' '}
              <Typography
                component='span'
                variant='body2'
                color='primary.main'
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                Contact your administrator
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

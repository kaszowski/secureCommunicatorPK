import React, { useState } from 'react';
import { Box, Paper, Typography, Tab, Tabs, Alert, Fade } from '@mui/material';
import { Lock, Message } from '@mui/icons-material';
import { LoginForm, RegisterForm } from '../../molecules';
import api from '../../../utils/api';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setError(null);

      const response = await api.post('/login', {
        username,
        password,
      });

      if (response.data.success) {
        // Store the user info and call the parent callback
        const userInfo: User = {
          userId: response.data.userId,
          username: response.data.username,
          email: response.data.email,
        };

        onLogin(userInfo);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    }
  };

  const handleRegister = async (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setError(null);

      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const response = await api.post('/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        setSuccess(
          'Registration successful! Please login with your credentials.'
        );
        setActiveTab(0); // Switch to login tab
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
        <Fade in timeout={800}>
          <Paper
            elevation={12}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                color: 'white',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Message sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant='h4' component='h1' gutterBottom>
                SecureChat
              </Typography>
              <Typography variant='subtitle1' sx={{ opacity: 0.9 }}>
                End-to-end encrypted messaging
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <Lock sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant='caption'>
                  Your privacy is protected
                </Typography>
              </Box>
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='fullWidth'
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            >
              <Tab label='Sign In' />
              <Tab label='Sign Up' />
            </Tabs>

            {/* Content */}
            <Box sx={{ p: 4 }}>
              {/* Alerts */}
              {error && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity='success' sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              {/* Login Form */}
              {activeTab === 0 && (
                <Fade in key='login'>
                  <Box>
                    <Typography variant='h6' gutterBottom>
                      Welcome back
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 3 }}
                    >
                      Sign in to your account to continue
                    </Typography>

                    <LoginForm onSubmit={handleLogin} />
                  </Box>
                </Fade>
              )}

              {/* Register Form */}
              {activeTab === 1 && (
                <Fade in key='register'>
                  <Box>
                    <Typography variant='h6' gutterBottom>
                      Create account
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 3 }}
                    >
                      Join SecureChat for private messaging
                    </Typography>

                    <RegisterForm onSubmit={handleRegister} />
                  </Box>
                </Fade>
              )}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                textAlign: 'center',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                SecureChat • End-to-end encrypted messaging platform
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Box>
  );
};

export default LoginPage;

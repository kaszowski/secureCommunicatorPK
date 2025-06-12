import React, { useState } from 'react';
import { Box, Paper, Typography, Tab, Tabs, Alert, Fade } from '@mui/material';
import { Lock, Message } from '@mui/icons-material';
import {
  LoginForm,
  RegisterForm,
  type KeyStorageOption,
} from '../../molecules';
import api from '../../../utils/api';
import {
  hashPassword,
  generateKeyPair,
  encryptPrivateKey,
  downloadPrivateKey,
} from '../../../utils/crypto';

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

      // Hash password on client-side before sending to backend
      const hashedPassword = hashPassword(password);

      const response = await api.post('/login', {
        username,
        password: hashedPassword,
      });

      if (response.data.success) {
        // Store password temporarily in session storage for private key decryption
        // This is needed to decrypt the private key that's encrypted with the user's password
        sessionStorage.setItem(
          'userData',
          JSON.stringify({
            username: username,
            password: password, // Store the original password for key decryption
          })
        );

        // Get actual user info from profile endpoint
        try {
          const profileResponse = await api.get('/profile');
          if (profileResponse.data) {
            const userInfo: User = {
              userId: profileResponse.data.userId,
              username: profileResponse.data.username,
              email: profileResponse.data.email,
            };
            onLogin(userInfo);
          }
        } catch (profileError) {
          console.error('Error getting user profile:', profileError);
          setError('Login successful but failed to get user information');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.error ||
          'Login failed. Please check your credentials.'
      );
    }
  };
  const handleRegister = async (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    keyStorageOption: KeyStorageOption;
  }) => {
    try {
      setError(null);

      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Hash password on client-side before sending to backend
      const hashedPassword = hashPassword(data.password);

      // Generate proper cryptographic keys for the user
      const keyPair = await generateKeyPair();

      let privateKeyToStore: string | null = null;

      // Handle private key storage based on user choice
      if (data.keyStorageOption === 'database') {
        // Encrypt private key with user's password for database storage
        privateKeyToStore = encryptPrivateKey(
          keyPair.privateKey,
          data.password
        );
      } else {
        // User will manage the private key themselves
        privateKeyToStore = null;
      }

      // Backend expects specific field names
      const response = await api.post('/register', {
        username: data.username,
        email: data.email,
        password_hash: hashedPassword, // Now properly hashed on client-side
        public_key: keyPair.publicKey, // Generate proper public key
        private_key: privateKeyToStore, // Either encrypted or null
      });

      if (response.status === 201) {
        // If user chose to manage keys themselves, download the private key
        if (data.keyStorageOption === 'user-managed') {
          downloadPrivateKey(keyPair.privateKey, data.username);
          setSuccess(
            'Registration successful! Your private key has been downloaded. Please keep it safe! You can now login with your credentials.'
          );
        } else {
          setSuccess(
            'Registration successful! Please login with your credentials.'
          );
        }
        setActiveTab(0); // Switch to login tab
      } else {
        setError('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.error || 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Tło całej strony logowania - gradient fioletowo-niebieski
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
                background: 'linear-gradient(45deg, #66bb6a 30%, #81c784 90%)', // Tło nagłówka w formularzu zmienione na gradient zielony
                color: 'white', // Kolor tekstu w nagłówku - biały
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
                backgroundColor: 'grey.50', // Tło stopki formularza - jasny szary
                textAlign: 'center',
                borderTop: 1,
                borderColor: 'divider', // Kolor obramowania - standardowy kolor dzielnika Material-UI
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

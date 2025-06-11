import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { Input, Button } from '../../atoms';
import { KeyStorageChoice, type KeyStorageOption } from '../KeyStorageChoice';
import { validatePasswordStrength } from '../../../utils/crypto';

interface RegisterFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    keyStorageOption: KeyStorageOption;
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
  const [keyStorageOption, setKeyStorageOption] =
    useState<KeyStorageOption>('database');

  // Validate password strength in real-time
  const passwordValidation = useMemo(() => {
    if (!formData.password) return null;
    return validatePasswordStrength(formData.password);
  }, [formData.password]);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    onSubmit({
      ...formData,
      keyStorageOption,
    });
  };

  const isFormValid = () => {
    return (
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword &&
      (passwordValidation?.isValid ?? false)
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

      {/* Password Strength Indicator */}
      {formData.password && passwordValidation && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <Alert
            severity={passwordValidation.isValid ? 'success' : 'warning'}
            icon={passwordValidation.isValid ? <CheckCircle /> : <Warning />}
            sx={{ mb: 1 }}
          >
            <Typography variant='body2'>
              Password strength: {passwordValidation.score}/5
              {passwordValidation.isValid ? ' (Strong)' : ' (Weak)'}
            </Typography>
          </Alert>
          {!passwordValidation.isValid &&
            passwordValidation.feedback.length > 0 && (
              <Box sx={{ ml: 2 }}>
                {passwordValidation.feedback.map((feedback, index) => (
                  <Typography
                    key={index}
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    • {feedback}
                  </Typography>
                ))}
              </Box>
            )}
        </Box>
      )}

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

      {/* Key Storage Option Selection */}
      <KeyStorageChoice
        value={keyStorageOption}
        onChange={setKeyStorageOption}
        disabled={loading}
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

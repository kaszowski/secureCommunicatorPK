import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import api from '../../../utils/api';
import { hashPassword } from '../../../utils/crypto';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  user,
}) => {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch user profile to get display name
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/profile');
        if (response.data && response.data.profile) {
          setDisplayName(response.data.profile.UsernameShow || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUserProfile();
    }
  }, [open]);

  const handleSave = async () => {
    // Reset messages
    setError(null);
    setSuccess(null);

    // Validate inputs
    if (!currentPassword) {
      setError('Current password is required to make changes');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const updates: any = {
      currentPassword: hashPassword(currentPassword),
    };

    // Only include fields that changed
    if (username !== user.username) {
      updates.username = username;
    }

    if (email !== user.email) {
      updates.email = email;
    }

    if (displayName) {
      updates.usernameShow = displayName;
    }

    if (newPassword) {
      updates.newPassword = hashPassword(newPassword);
    }

    // If nothing changed, just close the dialog
    if (Object.keys(updates).length === 1) {
      // Only currentPassword is present, no changes
      onClose();
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/updateUser', { updates });

      if (response.data.success) {
        setSuccess('Profile updated successfully');
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Wait a moment to show success message before closing
        setTimeout(() => {
          onClose();
          // Reload the page to reflect changes
          window.location.reload();
        }, 1500);
      } else {
        setError('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(
        error.response?.data?.error ||
          error.message ||
          'An error occurred while updating your profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form and close dialog
    setUsername(user.username);
    setEmail(user.email);
    // Don't reset display name to allow it to be fetched again
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Account Settings</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3, mt: 1 }}>
          <Typography variant='h6' gutterBottom>
            Profile Information
          </Typography>
          <TextField
            label='Username'
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin='normal'
            variant='outlined'
          />
          <TextField
            label='Display Name'
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            margin='normal'
            variant='outlined'
            helperText='This is the name that will be displayed to other users'
          />
          <TextField
            label='Email'
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin='normal'
            variant='outlined'
            type='email'
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant='h6' gutterBottom>
            Change Password
          </Typography>
          <TextField
            label='Current Password'
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin='normal'
            variant='outlined'
            type='password'
            required
          />
          <TextField
            label='New Password'
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin='normal'
            variant='outlined'
            type='password'
          />
          <TextField
            label='Confirm New Password'
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin='normal'
            variant='outlined'
            type='password'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant='contained'
          color='primary'
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore, Upload, Key, Security } from '@mui/icons-material';
import { Button } from '../../atoms';
import { validatePemFormat, decryptPrivateKey } from '../../../utils/crypto';

interface PrivateKeyImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (privateKey: string) => void;
  username?: string;
}

const PrivateKeyImport: React.FC<PrivateKeyImportProps> = ({
  open,
  onClose,
  onImport,
  username,
}) => {
  const [privateKeyText, setPrivateKeyText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPrivateKeyText(content);
        // Check if the content looks like encrypted data (not PEM format)
        setIsEncrypted(!validatePemFormat(content));
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    setError(null);

    if (!privateKeyText.trim()) {
      setError('Please provide a private key');
      return;
    }

    let finalPrivateKey = privateKeyText.trim();

    // If the key appears to be encrypted, try to decrypt it
    if (isEncrypted && password) {
      const decrypted = decryptPrivateKey(finalPrivateKey, password);
      if (!decrypted) {
        setError('Failed to decrypt private key. Please check your password.');
        return;
      }
      finalPrivateKey = decrypted;
    }

    // Validate the final key format
    if (!validatePemFormat(finalPrivateKey)) {
      setError(
        'Invalid private key format. Please provide a valid PEM formatted private key.'
      );
      return;
    }

    onImport(finalPrivateKey);
    handleClose();
  };

  const handleClose = () => {
    setPrivateKeyText('');
    setPassword('');
    setError(null);
    setIsEncrypted(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Key />
          <Typography variant='h6'>Import Private Key</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant='body1' gutterBottom>
            Import your private key to access encrypted messages on this device.
          </Typography>

          {username && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Importing private key for user: <strong>{username}</strong>
            </Alert>
          )}

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle2' gutterBottom>
              Upload Private Key File
            </Typography>
            <Button
              component='label'
              variant='outlined'
              startIcon={<Upload />}
              sx={{ mb: 2 }}
            >
              Choose File
              <input
                type='file'
                hidden
                accept='.pem,.txt,.key'
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          <TextField
            label='Private Key'
            multiline
            rows={8}
            fullWidth
            value={privateKeyText}
            onChange={(e) => {
              setPrivateKeyText(e.target.value);
              setIsEncrypted(!validatePemFormat(e.target.value));
            }}
            placeholder='-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----'
            sx={{ mb: 2 }}
          />

          {isEncrypted && (
            <TextField
              label='Decryption Password'
              type='password'
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password to decrypt private key'
              sx={{ mb: 2 }}
            />
          )}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant='subtitle2'>Security Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity='warning' icon={<Security />}>
                <Typography variant='body2' gutterBottom>
                  <strong>Important Security Notes:</strong>
                </Typography>
                <Typography variant='body2' component='div'>
                  • Your private key is only stored locally on this device
                  <br />
                  • Never share your private key with anyone
                  <br />
                  • Make sure you trust this device and browser
                  <br />• The key will be used to decrypt your messages
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant='contained'
          disabled={!privateKeyText.trim()}
        >
          Import Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivateKeyImport;

import React from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore, Security, Download } from '@mui/icons-material';

export type KeyStorageOption = 'database' | 'user-managed';

interface KeyStorageChoiceProps {
  value: KeyStorageOption;
  onChange: (option: KeyStorageOption) => void;
  disabled?: boolean;
}

const KeyStorageChoice: React.FC<KeyStorageChoiceProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value as KeyStorageOption);
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <FormControl component='fieldset' fullWidth disabled={disabled}>
        <FormLabel component='legend' sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security />
            <Typography variant='h6'>Private Key Storage</Typography>
          </Box>
        </FormLabel>

        <RadioGroup value={value} onChange={handleChange}>
          <FormControlLabel
            value='database'
            control={<Radio />}
            label={
              <Box>
                <Typography variant='body1' fontWeight='medium'>
                  Store encrypted private key in database (Recommended)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Your private key will be encrypted with your password and
                  stored securely on our servers. You can access your messages
                  from any device by logging in.
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />

          <FormControlLabel
            value='user-managed'
            control={<Radio />}
            label={
              <Box>
                <Typography variant='body1' fontWeight='medium'>
                  Download and manage private key yourself (Advanced)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Your private key will be downloaded to your device. You're
                  responsible for keeping it safe. You'll need to import it to
                  access messages on other devices.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </RadioGroup>

        {/* Information sections */}
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant='subtitle2'>
                What's the difference? (Click to expand)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity='info' icon={<Security />}>
                  <Typography variant='body2' fontWeight='medium'>
                    Database Storage (Recommended)
                  </Typography>
                  <Typography variant='body2'>
                    • Convenient access from any device • Private key encrypted
                    with your password • Automatic backup and recovery •
                    Suitable for most users
                  </Typography>
                </Alert>

                <Alert severity='warning' icon={<Download />}>
                  <Typography variant='body2' fontWeight='medium'>
                    User-Managed Storage (Advanced)
                  </Typography>
                  <Typography variant='body2'>
                    • Maximum security - you control your keys • Requires manual
                    backup and management • Need to import keys on each device •
                    If you lose the key, your messages are unrecoverable
                  </Typography>
                </Alert>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {value === 'user-managed' && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              <strong>Important:</strong> If you choose user-managed storage,
              make sure to securely backup your private key. Without it, you
              won't be able to decrypt your messages.
            </Typography>
          </Alert>
        )}
      </FormControl>
    </Box>
  );
};

export default KeyStorageChoice;

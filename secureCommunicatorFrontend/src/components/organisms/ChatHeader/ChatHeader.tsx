import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  VideoCall,
  Call,
  Info,
  ExitToApp,
  Lock,
  Group,
} from '@mui/icons-material';
import { Avatar } from '../../atoms';

interface Participant {
  id: string;
  username: string;
  isOnline?: boolean;
}

interface ChatHeaderProps {
  conversationName: string;
  participants: Participant[];
  currentUserId: string;
  isEncrypted?: boolean;
  onLogout: () => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationName,
  participants,
  currentUserId,
  isEncrypted = true,
  onLogout,
  onVideoCall,
  onVoiceCall,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInfoClick = () => {
    setInfoDialogOpen(true);
    handleMenuClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    handleMenuClose();
  };

  const getOnlineParticipants = () => {
    return participants.filter((p) => p.isOnline && p.id !== currentUserId);
  };

  const getConversationSubtitle = () => {
    const otherParticipants = participants.filter(
      (p) => p.id !== currentUserId
    );
    const onlineCount = getOnlineParticipants().length;

    if (otherParticipants.length === 1) {
      // Direct message
      const participant = otherParticipants[0];
      return participant.isOnline ? 'Online' : 'Offline';
    } else {
      // Group chat
      return `${participants.length} members, ${onlineCount} online`;
    }
  };

  const isDirectMessage = participants.length === 2;

  return (
    <>
      <AppBar position='static' elevation={1} color='default'>
        <Toolbar>
          {/* Conversation Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar username={conversationName} sx={{ mr: 2 }} />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='h6' component='div'>
                  {conversationName}
                </Typography>

                {isEncrypted && (
                  <Lock
                    sx={{
                      ml: 1,
                      fontSize: 16,
                      color: 'success.main',
                      title: 'End-to-end encrypted',
                    }}
                  />
                )}

                {!isDirectMessage && (
                  <Group
                    sx={{
                      ml: 1,
                      fontSize: 16,
                      color: 'text.secondary',
                    }}
                  />
                )}
              </Box>

              <Typography variant='body2' color='text.secondary'>
                {getConversationSubtitle()}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isDirectMessage && (
              <>
                <IconButton
                  color='inherit'
                  onClick={onVoiceCall}
                  disabled={!onVoiceCall}
                  title='Voice call'
                >
                  <Call />
                </IconButton>

                <IconButton
                  color='inherit'
                  onClick={onVideoCall}
                  disabled={!onVideoCall}
                  title='Video call'
                >
                  <VideoCall />
                </IconButton>
              </>
            )}

            <IconButton
              color='inherit'
              onClick={handleMenuOpen}
              title='More options'
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Toolbar>

        {/* Encryption Status Bar */}
        {isEncrypted && (
          <Box
            sx={{
              backgroundColor: 'success.main',
              color: 'success.contrastText',
              px: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock sx={{ fontSize: 14, mr: 0.5 }} />
            <Typography variant='caption'>
              Messages are end-to-end encrypted
            </Typography>
          </Box>
        )}
      </AppBar>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleInfoClick}>
          <Info sx={{ mr: 1 }} />
          Conversation Info
        </MenuItem>

        <MenuItem onClick={handleLogoutClick}>
          <ExitToApp sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Conversation Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar username={conversationName} sx={{ mr: 2 }} />
            <Box>
              <Typography variant='h6'>{conversationName}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {isDirectMessage ? 'Direct Message' : 'Group Chat'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle2' gutterBottom>
              Security
            </Typography>
            <Chip
              icon={<Lock />}
              label={isEncrypted ? 'End-to-end encrypted' : 'Not encrypted'}
              color={isEncrypted ? 'success' : 'warning'}
              variant='outlined'
              size='small'
            />
          </Box>

          <Typography variant='subtitle2' gutterBottom>
            Participants ({participants.length})
          </Typography>

          <List dense>
            {participants.map((participant) => (
              <ListItem key={participant.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar username={participant.username} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant='body1'>
                        {participant.username}
                      </Typography>
                      {participant.id === currentUserId && (
                        <Chip label='You' size='small' sx={{ ml: 1 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    participant.id !== currentUserId ? (
                      <Chip
                        label={participant.isOnline ? 'Online' : 'Offline'}
                        size='small'
                        color={participant.isOnline ? 'success' : 'default'}
                        variant='outlined'
                      />
                    ) : null
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatHeader;

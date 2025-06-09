import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Typography,
  Alert,
} from '@mui/material';
import { ConversationList, MessageList, ChatHeader } from '../../organisms';
import { MessageInput } from '../../molecules';
import api from '../../../utils/api';
import { io, Socket } from 'socket.io-client';
import CryptoJS from 'crypto-js';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface Participant {
  id: string;
  username: string;
  isOnline?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  participants: Participant[];
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderUsername: string;
  timestamp: string;
  encrypted: boolean;
}

interface ChatPageProps {
  user: User;
  onLogout: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout }) => {
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newConversationDialogOpen, setNewConversationDialogOpen] =
    useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [conversationName, setConversationName] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeSocket();
    generateEncryptionKey();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchConversationDetails();
    }
  }, [selectedConversationId]);

  const initializeSocket = () => {
    const newSocket = io(
      '/', // Use nginx proxy - no need for specific URL
      {
        withCredentials: true,
        path: '/socket.io/',
      }
    );

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('user-online', user.userId);
    });

    newSocket.on('new-message', (message: Message) => {
      // Handle new message - this would trigger a re-fetch of messages
      // In a production app, you'd update the local state directly
      if (message.conversationId === selectedConversationId) {
        // Refresh messages for current conversation
        window.location.reload(); // Temporary solution
      }
    });

    newSocket.on('user-online', (userId: string) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user-offline', (userId: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    setSocket(newSocket);
  };

  const generateEncryptionKey = () => {
    // In a real app, you'd use proper key exchange
    // For demo purposes, we'll generate a simple key
    if (!localStorage.getItem('encryptionKey')) {
      const key = CryptoJS.lib.WordArray.random(256 / 8).toString();
      localStorage.setItem('encryptionKey', key);
    }
  };

  const fetchConversationDetails = async () => {
    try {
      const response = await api.get(
        `/conversations/${selectedConversationId}`
      );
      const conversation = response.data.conversation;

      // Update online status for participants
      const updatedParticipants = conversation.participants.map(
        (p: Participant) => ({
          ...p,
          isOnline: onlineUsers.has(p.id),
        })
      );

      setSelectedConversation({
        ...conversation,
        participants: updatedParticipants,
      });
    } catch (error) {
      console.error('Failed to fetch conversation details:', error);
      setError('Failed to load conversation details');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (socket) {
      socket.emit('join-conversation', conversationId);
    }
  };

  const handleNewConversation = () => {
    setNewConversationDialogOpen(true);
    fetchAvailableUsers();
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      const users =
        response.data.users?.filter((u: User) => u.userId !== user.userId) ||
        [];
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      setError(null);

      if (selectedUsers.length === 0) {
        setError('Please select at least one user');
        return;
      }

      const participantIds = [
        user.userId,
        ...selectedUsers.map((u) => u.userId),
      ];
      const isDirectMessage = participantIds.length === 2;

      const response = await api.post('/conversation/create', {
        name: isDirectMessage ? '' : conversationName,
        participantIds,
      });

      if (response.data.success) {
        setNewConversationDialogOpen(false);
        setSelectedUsers([]);
        setConversationName('');

        // Select the new conversation
        const newConversationId = response.data.conversationId;
        handleConversationSelect(newConversationId);
      } else {
        setError(response.data.message || 'Failed to create conversation');
      }
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      setError(
        error.response?.data?.message || 'Failed to create conversation'
      );
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !content.trim()) return;

    try {
      // Encrypt the message
      const encryptionKey =
        localStorage.getItem('encryptionKey') || 'default-key';
      const encryptedContent = CryptoJS.AES.encrypt(
        content,
        encryptionKey
      ).toString();

      const response = await api.post('/messages', {
        conversationId: selectedConversationId,
        content: encryptedContent,
        encrypted: true,
      });

      if (response.data.success && socket) {
        // Emit the message through socket for real-time delivery
        const messageData = {
          conversationId: selectedConversationId,
          content: encryptedContent,
          senderId: user.userId,
          senderUsername: user.username,
          encrypted: true,
        };

        socket.emit('send-message', messageData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.name) {
      return conversation.name;
    }

    // For direct messages, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== user.userId
    );
    return otherParticipant?.username || 'Unknown';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      {selectedConversation && (
        <ChatHeader
          conversationName={getConversationDisplayName(selectedConversation)}
          participants={selectedConversation.participants}
          currentUserId={user.userId}
          isEncrypted={true}
          onLogout={onLogout}
        />
      )}

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversations Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', sm: '33.33%', md: '25%' },
            borderRight: 1,
            borderColor: 'divider',
            height: '100%',
            display: {
              xs: selectedConversationId ? 'none' : 'block',
              sm: 'block',
            },
          }}
        >
          <ConversationList
            currentUserId={user.userId}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Messages List */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <MessageList
              conversationId={selectedConversationId}
              currentUserId={user.userId}
              currentUsername={user.username}
            />
          </Box>

          {/* Message Input */}
          {selectedConversationId && (
            <Paper
              elevation={3}
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                borderRadius: 0,
              }}
            >
              <MessageInput
                onSendMessage={handleSendMessage}
                placeholder={`Message ${
                  selectedConversation
                    ? getConversationDisplayName(selectedConversation)
                    : ''
                }...`}
              />
            </Paper>
          )}
        </Box>
      </Box>

      {/* New Conversation Dialog */}
      <Dialog
        open={newConversationDialogOpen}
        onClose={() => setNewConversationDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Autocomplete
            multiple
            options={availableUsers}
            getOptionLabel={(option) => option.username}
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Select users'
                placeholder='Search users...'
                margin='normal'
                fullWidth
              />
            )}
            sx={{ mb: 2 }}
          />

          {selectedUsers.length > 1 && (
            <TextField
              fullWidth
              label='Group name (optional)'
              value={conversationName}
              onChange={(e) => setConversationName(e.target.value)}
              margin='normal'
              placeholder='Enter group name...'
            />
          )}

          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            {selectedUsers.length === 1
              ? 'This will create a direct message'
              : selectedUsers.length > 1
              ? 'This will create a group chat'
              : 'Select users to start messaging'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            variant='contained'
            disabled={selectedUsers.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;

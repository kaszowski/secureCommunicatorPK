import React, { useState, useEffect } from 'react';
import {
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  Divider,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search, PersonAdd } from '@mui/icons-material';
import { Avatar } from '../../atoms';
import api from '../../../utils/api';

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  participants: Array<{
    id: string;
    username: string;
  }>;
}

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  currentUserId,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.participants.some((participant) =>
        participant.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.name) {
      return conversation.name;
    }

    // For direct messages, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUserId
    );
    return otherParticipant?.username || 'Unknown';
  };

  if (loading) {
    return (
      <Box p={2}>
        <Typography>Loading conversations...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search and New Conversation Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            Messages
          </Typography>
          <IconButton onClick={onNewConversation} color='primary'>
            <PersonAdd />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          size='small'
          placeholder='Search conversations...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Conversations List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color='text.secondary'>
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredConversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ListItemButton
                  selected={selectedConversationId === conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      username={getConversationDisplayName(conversation)}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle1'
                          sx={{
                            flexGrow: 1,
                            fontWeight:
                              conversation.unreadCount > 0 ? 'bold' : 'normal',
                          }}
                        >
                          {getConversationDisplayName(conversation)}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color='error'
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conversation.lastMessage || 'No messages yet'}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ ml: 1, flexShrink: 0 }}
                        >
                          {formatLastMessageTime(conversation.lastMessageTime)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationList;

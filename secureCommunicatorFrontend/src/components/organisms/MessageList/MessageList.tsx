import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { MoreVert, Lock } from '@mui/icons-material';
import { Avatar } from '../../atoms';
import api from '../../../utils/api';
import CryptoJS from 'crypto-js';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  timestamp: string;
  encrypted: boolean;
}

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  currentUsername: string;
}

const MessageList: React.FC<MessageListProps> = ({
  conversationId,
  currentUserId,
  currentUsername: _currentUsername,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/messages?conversationId=${conversationId}`
      );
      const decryptedMessages = response.data.messages.map(decryptMessage);
      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const decryptMessage = (message: Message): Message => {
    try {
      if (message.encrypted && message.content) {
        // In a real app, you'd use proper key management
        // For now, we'll use a simple decryption with stored keys
        const encryptionKey =
          localStorage.getItem('encryptionKey') || 'default-key';
        const decryptedContent = CryptoJS.AES.decrypt(
          message.content,
          encryptionKey
        ).toString(CryptoJS.enc.Utf8);

        return {
          ...message,
          content: decryptedContent || message.content,
        };
      }
      return message;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return {
        ...message,
        content: '[Encrypted message - unable to decrypt]',
      };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffInDays > 365 ? 'numeric' : undefined,
      });
    }
  };

  const handleMessageMenu = (
    event: React.MouseEvent<HTMLElement>,
    messageId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleDeleteMessage = async () => {
    if (selectedMessageId) {
      try {
        await api.delete(`/messages/${selectedMessageId}`);
        setMessages(messages.filter((msg) => msg.id !== selectedMessageId));
        handleMenuClose();
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const isConsecutiveMessage = (
    currentMessage: Message,
    previousMessage: Message | null
  ) => {
    if (!previousMessage) return false;

    const timeDiff =
      new Date(currentMessage.timestamp).getTime() -
      new Date(previousMessage.timestamp).getTime();
    const sameUser = currentMessage.senderId === previousMessage.senderId;

    return sameUser && timeDiff < 5 * 60 * 1000; // 5 minutes
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100%'
      >
        <Typography>Loading messages...</Typography>
      </Box>
    );
  }

  if (!conversationId) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100%'
        flexDirection='column'
      >
        <Typography variant='h6' color='text.secondary'>
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {Object.keys(messageGroups).length === 0 ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height='100%'
          flexDirection='column'
        >
          <Typography variant='h6' color='text.secondary'>
            No messages yet
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Start the conversation by sending a message below
          </Typography>
        </Box>
      ) : (
        Object.entries(messageGroups).map(([date, dayMessages]) => (
          <Box key={date}>
            {/* Date Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography
                variant='caption'
                sx={{
                  mx: 2,
                  px: 2,
                  py: 0.5,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const previousMessage = dayMessages[index - 1] || null;
              const isOwn = message.senderId === currentUserId;
              const isConsecutive = isConsecutiveMessage(
                message,
                previousMessage
              );

              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    mb: isConsecutive ? 0.5 : 2,
                    alignItems: 'flex-end',
                  }}
                >
                  {/* Avatar for received messages */}
                  {!isOwn && !isConsecutive && (
                    <Avatar
                      username={message.senderUsername}
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                  )}

                  {/* Spacer for consecutive messages */}
                  {!isOwn && isConsecutive && <Box sx={{ width: 48, mr: 1 }} />}

                  {/* Message Content */}
                  <Box sx={{ maxWidth: '70%' }}>
                    {/* Sender name for received messages (non-consecutive) */}
                    {!isOwn && !isConsecutive && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ ml: 1, mb: 0.5, display: 'block' }}
                      >
                        {message.senderUsername}
                      </Typography>
                    )}

                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        backgroundColor: isOwn
                          ? 'primary.main'
                          : 'background.paper',
                        color: isOwn ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        borderTopRightRadius: isOwn && isConsecutive ? 0.5 : 2,
                        borderTopLeftRadius: !isOwn && isConsecutive ? 0.5 : 2,
                        position: 'relative',
                        '&:hover .message-menu': {
                          opacity: 1,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Typography
                          variant='body1'
                          sx={{ flexGrow: 1, wordBreak: 'break-word' }}
                        >
                          {message.content}
                        </Typography>

                        {message.encrypted && (
                          <Lock sx={{ ml: 1, fontSize: 16, opacity: 0.7 }} />
                        )}

                        <IconButton
                          size='small'
                          className='message-menu'
                          onClick={(e) => handleMessageMenu(e, message.id)}
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            ml: 0.5,
                            mt: -0.5,
                            color: isOwn
                              ? 'primary.contrastText'
                              : 'text.secondary',
                          }}
                        >
                          <MoreVert fontSize='small' />
                        </IconButton>
                      </Box>

                      <Typography
                        variant='caption'
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 0.5,
                          opacity: 0.7,
                        }}
                      >
                        {formatMessageTime(message.timestamp)}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))
      )}

      {/* Message Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteMessage}>Delete Message</MenuItem>
      </Menu>

      {/* Scroll to bottom reference */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;

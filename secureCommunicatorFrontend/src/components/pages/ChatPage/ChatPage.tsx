import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MoreVert,
  Add,
  Logout,
  Settings,
} from '@mui/icons-material';
import { MessageInput } from '../../molecules';
import { PrivateKeyImport } from '../../molecules';
import { SettingsDialog } from '../../molecules';
import api from '../../../utils/api';
import { io, Socket } from 'socket.io-client';
import {
  generateConversationKey,
  encryptConversationKey,
  decryptConversationKey,
  encryptMessage,
  decryptMessage,
} from '../../../utils/crypto';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface Conversation {
  ConversationId: string;
  Name: string;
  Avatar?: string;
  Background?: string;
  EncryptedConversationKey: string;
}

interface Message {
  MessageId: string;
  UserId: string;
  ConversationId: string;
  Content: string;
  SendAt: string;
  sender?: string;
  message?: string;
}

interface ChatPageProps {
  user: User;
  onLogout: () => void;
}

const DRAWER_WIDTH = 300;

const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Encryption state
  const [conversationKeys, setConversationKeys] = useState<Map<string, string>>(
    new Map()
  );
  const [userPrivateKey, setUserPrivateKey] = useState<string | null>(null);
  const [needsPrivateKey, setNeedsPrivateKey] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  // Socket and refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = () => {
      // Connect to backend through nginx proxy
      socketRef.current = io('/', {
        withCredentials: true,
        autoConnect: true,
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        upgrade: true,
        rememberUpgrade: true,
        forceNew: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        // Connected to chat server
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socketRef.current.on('message', async (msg: any) => {
        try {
          // Get conversation key for decryption
          const conversationKey = await getConversationKey(msg.conversationId);
          if (!conversationKey) {
            // If we don't have the conversation data yet, store for later processing
            if (conversations.length === 0 || !userPrivateKey) {
              setPendingMessages((prev: any[]) => [...prev, msg]);
              return;
            }
            return;
          }

          // Decrypt the incoming message
          const decryptedContent = decryptMessage(msg.message, conversationKey);
          if (!decryptedContent) {
            return;
          }

          // Add the decrypted message to state
          const newMessage: Message = {
            MessageId: `received-${Date.now()}`,
            UserId: msg.sender,
            ConversationId: msg.conversationId,
            Content: decryptedContent,
            SendAt: new Date().toISOString(),
          };

          // Only add if it's for the currently selected conversation
          if (selectedConversation?.ConversationId === msg.conversationId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        } catch (error) {
          // Error processing incoming message
        }
      });

      socketRef.current.on('error', (error: string) => {
        // If it's an invalid conversationId error, we might need to reload conversations
        if (error.includes('invalid conversationId')) {
          // Reload conversations to get the latest data
          loadConversations();
          return;
        }

        // If authentication failed, don't retry - user needs to login again
        if (error.includes('Authentication failed')) {
          onLogout();
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        // If disconnected due to auth issues, logout the user
        if (reason === 'io server disconnect') {
          onLogout();
        }
      });

      socketRef.current.on('reconnect', () => {
        // After reconnection, refresh conversation list to ensure socket has latest data
        loadConversations();

        // Rejoin the current conversation if there is one
        if (selectedConversation && socketRef.current) {
          socketRef.current.emit('join', {
            conversationId: selectedConversation.ConversationId,
          });
        }
      });

      // Handle successful join acknowledgment
      socketRef.current.on('joinedConversation', () => {
        // Successfully joined conversation
      });
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    initializeUserKeys();
  }, []);

  // Initialize user keys
  const initializeUserKeys = async () => {
    try {
      const response = await api.get('/keys');
      if (response.data.keys.PrivateKey) {
        setUserPrivateKey(response.data.keys.PrivateKey);
        setNeedsPrivateKey(false);
      } else {
        // User has user-managed keys, prompt for import
        setNeedsPrivateKey(true);
      }
    } catch (error) {
      setNeedsPrivateKey(true);
    }
  };

  // Handle private key import
  const handlePrivateKeyImport = (privateKeyPem: string) => {
    setUserPrivateKey(privateKeyPem);
    setNeedsPrivateKey(false);
  };

  // Get and decrypt conversation key
  const getConversationKey = async (
    conversationId: string
  ): Promise<string | null> => {
    try {
      // Check if we already have the key cached
      const cachedKey = conversationKeys.get(conversationId);
      if (cachedKey) {
        return cachedKey;
      }

      // Find the conversation and decrypt its key
      const conversation = conversations.find(
        (c) => c.ConversationId === conversationId
      );
      if (!conversation || !userPrivateKey) {
        return null;
      }

      // Decrypt the conversation key using user's private key
      const decryptedKey = await decryptConversationKey(
        conversation.EncryptedConversationKey,
        userPrivateKey
      );

      if (decryptedKey) {
        // Cache the decrypted key
        setConversationKeys(
          (prev) => new Map(prev.set(conversationId, decryptedKey))
        );
        return decryptedKey;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.ConversationId);

      // Create a function to join the conversation via socket
      const joinConversation = () => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('join', {
            conversationId: selectedConversation.ConversationId,
          });
        } else {
          // Try to reconnect if not connected
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
          // Retry after a short delay
          setTimeout(joinConversation, 1000);
        }
      };

      // Execute the join function
      joinConversation();
    }
  }, [selectedConversation]);

  // Preload conversation keys when user private key is available
  useEffect(() => {
    if (userPrivateKey && conversations.length > 0) {
      preloadConversationKeys(conversations);
    }
  }, [userPrivateKey, conversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process pending messages when conversations and private key become available
  useEffect(() => {
    if (userPrivateKey && conversations.length > 0 && pendingMessages.length > 0) {
      const processPendingMessages = async () => {
        for (const msg of pendingMessages) {
          try {
            const conversationKey = await getConversationKey(msg.conversationId);
            if (conversationKey) {
              const decryptedContent = decryptMessage(msg.message, conversationKey);
              if (decryptedContent) {
                const newMessage: Message = {
                  MessageId: `received-${Date.now()}-${Math.random()}`,
                  UserId: msg.sender,
                  ConversationId: msg.conversationId,
                  Content: decryptedContent,
                  SendAt: new Date().toISOString(),
                };

                // Add message if it's for the currently selected conversation
                if (selectedConversation?.ConversationId === msg.conversationId) {
                  setMessages((prev) => [...prev, newMessage]);
                }
              }
            }
          } catch (error) {
            // Error processing pending message
          }
        }
        
        // Clear pending messages after processing
        setPendingMessages([]);
      };
      
      processPendingMessages();
    }
  }, [userPrivateKey, conversations, pendingMessages, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/conversations');
      const loadedConversations = response.data.conversations || [];

      // Update state with loaded conversations
      setConversations(loadedConversations);

      // Preload conversation keys for better performance
      if (userPrivateKey && loadedConversations.length > 0) {
        await preloadConversationKeys(loadedConversations);
      }

      // Return the loaded conversations for immediate use
      return loadedConversations;
    } catch (error) {
      return [];
    }
  };

  // Preload conversation keys for all conversations
  const preloadConversationKeys = async (conversations: Conversation[]) => {
    try {
      const newKeys = new Map(conversationKeys);

      for (const conversation of conversations) {
        if (!newKeys.has(conversation.ConversationId) && userPrivateKey) {
          try {
            const decryptedKey = await decryptConversationKey(
              conversation.EncryptedConversationKey,
              userPrivateKey
            );
            if (decryptedKey) {
              newKeys.set(conversation.ConversationId, decryptedKey);
            }
          } catch (error) {
            // Error decrypting key for conversation
          }
        }
      }

      setConversationKeys(newKeys);
    } catch (error) {
      // Error preloading conversation keys
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Use query parameters instead of body for GET request
      const response = await api.get('/messages', {
        params: {
          conversationId,
          limit: 50,
          offset: 0,
        },
      });

      const encryptedMessages = response.data.messages || [];

      // Get conversation key for decryption
      const conversationKey = await getConversationKey(conversationId);
      if (!conversationKey) {
        setMessages([]);
        return;
      }

      // Decrypt all messages
      const decryptedMessages = encryptedMessages.map((message: Message) => {
        try {
          // Message.Content comes as base64 from backend
          const decryptedContent = decryptMessage(
            message.Content,
            conversationKey
          );
          return {
            ...message,
            Content: decryptedContent || 'Unable to decrypt message',
          };
        } catch (error) {
          return {
            ...message,
            Content: 'Unable to decrypt message',
          };
        }
      });

      setMessages(decryptedMessages);
    } catch (error) {
      setMessages([]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      // Get the conversation key for encryption
      const conversationKey = await getConversationKey(
        selectedConversation.ConversationId
      );
      if (!conversationKey) {
        return;
      }

      // Encrypt the message content
      const encryptedContent = encryptMessage(content.trim(), conversationKey);

      // Send via socket with encrypted content
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('message', {
          conversationId: selectedConversation.ConversationId,
          content: encryptedContent, // Send encrypted content as base64
        });

        // Add message to local state immediately (optimistic update)
        // Store unencrypted content for display
        const newMessage: Message = {
          MessageId: `temp-${Date.now()}`,
          UserId: user.userId,
          ConversationId: selectedConversation.ConversationId,
          Content: content.trim(),
          SendAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
      } else {
        // Socket not connected
      }
    } catch (error) {
      // Error sending message
    }
  };

  const createNewConversation = async () => {
    if (!newChatUsername.trim()) return;

    try {
      // Get the other user's public key
      const otherUserResponse = await api.get('/key/public', {
        params: { username: newChatUsername },
      });

      if (!otherUserResponse.data.keys) {
        throw new Error('User not found or has no public key');
      }

      const otherUserPublicKey = otherUserResponse.data.keys;

      // Get current user's public key
      const myKeysResponse = await api.get('/keys');
      if (!myKeysResponse.data.keys.PublicKey) {
        throw new Error('Unable to get your public key');
      }

      const myPublicKey = myKeysResponse.data.keys.PublicKey;

      // Generate a new conversation key
      const conversationKey = generateConversationKey();

      // Encrypt the conversation key for both users
      const encryptedKeyForMe = await encryptConversationKey(
        conversationKey,
        myPublicKey
      );
      const encryptedKeyForOther = await encryptConversationKey(
        conversationKey,
        otherUserPublicKey
      );

      // Create the conversation with proper encrypted keys
      const response = await api.post('/conversation/create', {
        userToAdd: newChatUsername,
        keyMine: encryptedKeyForMe,
        keyOther: encryptedKeyForOther,
      });

      if (response.data.newConversation) {
        // Cache the conversation key for immediate use
        const newConversationId = response.data.newConversation.ConversationId;
        if (newConversationId) {
          // Add the decrypted key to our keys map for immediate use
          setConversationKeys(
            (prev) => new Map(prev.set(newConversationId, conversationKey))
          );

          // Load all conversations
          const loadedConversations = await loadConversations();

          // Find the new conversation in the loaded list
          const newConversation = loadedConversations.find(
            (conv: Conversation) => conv.ConversationId === newConversationId
          );

          // Select the newly created conversation
          if (newConversation) {
            setSelectedConversation(newConversation);
          } else {
            // If we can't find it in the list, use the response data

            // Make sure the conversation object has all required fields
            const conversation = {
              ...response.data.newConversation,
              // Ensure all required fields are present
              ConversationId: response.data.newConversation.ConversationId,
              Name: response.data.newConversation.Name || newChatUsername,
              EncryptedConversationKey:
                response.data.newConversation.EncryptedConversationKey ||
                response.data.newConversation.Users?.find(
                  (u: { UserId: string }) => u.UserId === user.userId
                )?.EncryptedConversationKey,
            };

            setSelectedConversation(conversation);

            // Add conversation to the local list if it's not there
            if (
              !conversations.some(
                (c) => c.ConversationId === conversation.ConversationId
              )
            ) {
              setConversations((prev) => [...prev, conversation]);
            }
          }

          // Ensure the socket is properly connected
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }

        setNewChatDialog(false);
        setNewChatUsername('');
      }
    } catch (error: any) {
      // Check if the error is because the conversation already exists
      if (error.response?.data?.error === 'Conversation already exists') {
        alert('You already have a conversation with this user.');
      } else {
        alert(
          error.response?.data?.error ||
            error.message ||
            'Failed to create conversation. User might not exist.'
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Logout error
    } finally {
      // Clean up sensitive data from session storage
      sessionStorage.removeItem('userData');

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      onLogout();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyMessage = (message: Message) => {
    return message.UserId === user.userId;
  };

  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e3f2fd', // Tło obszaru konwersacji zmienione na jasny niebieski
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#bbdefb' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6' noWrap>
            Conversations
          </Typography>
          <IconButton onClick={() => setNewChatDialog(true)} size='small'>
            <Add />
          </IconButton>
        </Box>
        <Typography variant='body2' color='text.secondary' noWrap>
          {user.username}
        </Typography>
      </Box>

      {/* Conversations List */}
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.map((conversation) => (
          <ListItem
            key={conversation.ConversationId}
            component='div'
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#90caf9', // Kolor przy hover na liście konwersacji - średni niebieski
              },
              ...(selectedConversation?.ConversationId ===
                conversation.ConversationId && {
                backgroundColor: theme.palette.primary.main + '40', // Tło wybranej konwersacji - łagodny zielony z przezroczystością 40%
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '60', // Tło wybranej konwersacji przy hover - łagodny zielony z przezroczystością 60%
                },
              }),
            }}
            onClick={() => {
              setSelectedConversation(conversation);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {conversation.Name?.charAt(0).toUpperCase() || 'C'}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={conversation.Name || 'Unknown'}
              secondary=''
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position='fixed'
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color='inherit'
            edge='start'
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Typography variant='h6' noWrap component='div' sx={{ flex: 1 }}>
              {selectedConversation?.Name || 'SecureChat'}
            </Typography>

            <IconButton
              color='inherit'
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component='nav'
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant='temporary'
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant='permanent'
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Chat Area */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />

        {selectedConversation ? (
          <>
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 1,
                backgroundColor: theme.palette.grey[200], // Tło obszaru wiadomości zmienione na bardziej szary
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={message.MessageId || index}
                  sx={{
                    display: 'flex',
                    justifyContent: isMyMessage(message)
                      ? 'flex-end'
                      : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      backgroundColor: isMyMessage(message)
                        ? theme.palette.primary.main // Tło moich wiadomości - łagodny zielony
                        : theme.palette.grey[300], // Tło wiadomości innych zmienione na ciemniejszy szary
                      color: isMyMessage(message)
                        ? theme.palette.primary.contrastText // Kolor tekstu moich wiadomości - kontrast do primary (biały)
                        : theme.palette.text.primary, // Kolor tekstu wiadomości innych - standardowy kolor tekstu (czarny)
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant='body1' sx={{ mb: 0.5 }}>
                      {message.Content || message.message}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{
                        opacity: 0.7,
                        display: 'block',
                        textAlign: 'right',
                      }}
                    >
                      {formatMessageTime(message.SendAt)}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, backgroundColor: theme.palette.grey[100] }}>
              <MessageInput
                onSendMessage={sendMessage}
                placeholder={`Message ${selectedConversation.Name}...`}
              />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'text.secondary',
            }}
          >
            <Typography variant='h5' gutterBottom>
              Welcome to SecureChat
            </Typography>
            <Typography variant='body1'>
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setSettingsDialogOpen(true);
          }}
        >
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* New Chat Dialog */}
      <Dialog
        open={newChatDialog}
        onClose={() => setNewChatDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Username'
            fullWidth
            variant='outlined'
            value={newChatUsername}
            onChange={(e) => setNewChatUsername(e.target.value)}
            placeholder='Enter username to chat with'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialog(false)}>Cancel</Button>
          <Button onClick={createNewConversation} variant='contained'>
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Private Key Import Dialog */}
      <PrivateKeyImport
        open={needsPrivateKey}
        onClose={onLogout} // Log out the user when they cancel the key import
        onImport={handlePrivateKeyImport}
        username={user.username}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        user={user}
      />
    </Box>
  );
};

export default ChatPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, List, ListItemButton, ListItemIcon,
  ListItemText, TextField, IconButton, Avatar, Tabs, Tab,
  Badge, CircularProgress, Divider, Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon,
  Groups as GroupsIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { timeAgoShort, formatChatTime } from '../utils/dateUtils';

interface Conversation {
  type: 'marketplace' | 'housing' | 'study_group' | 'roommate';
  // marketplace fields
  item_id?: number;
  item_title?: string;
  // housing fields
  listing_id?: number;
  listing_title?: string;
  // study group fields
  group_id?: number;
  group_name?: string;
  // roommate fields
  match_request_id?: number;
  // common
  other_user_id?: number;
  other_username?: string;
  last_message: string;
  timestamp: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender: number;
  sender_username: string;
  content: string;
  timestamp: string;
}

const typeIcons: Record<string, React.ReactElement> = {
  marketplace: <StoreIcon fontSize="small" />,
  housing: <ApartmentIcon fontSize="small" />,
  study_group: <GroupsIcon fontSize="small" />,
  roommate: <PeopleIcon fontSize="small" />,
};

const typeColors: Record<string, string> = {
  marketplace: '#0EA5E9',
  housing: '#3B82F6',
  study_group: '#F59E0B',
  roommate: '#8B5CF6',
};

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMessages();
  const { subscribe } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvoRef = useRef<Conversation | null>(null);

  // Keep ref in sync with state so the WS handler always sees the latest value
  useEffect(() => {
    selectedConvoRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time new_message events
  useEffect(() => {
    const unsub = subscribe('new_message', (data: any) => {
      const convo = selectedConvoRef.current;

      // Check if the message belongs to the currently selected conversation
      const isCurrentConvo = convo && convo.type === data.conversation_type && (
        (data.conversation_type === 'marketplace' && convo.item_id === data.item_id) ||
        (data.conversation_type === 'housing' && convo.listing_id === data.listing_id) ||
        (data.conversation_type === 'study_group' && convo.group_id === data.group_id) ||
        (data.conversation_type === 'roommate' && convo.match_request_id === data.match_request_id)
      );

      if (isCurrentConvo) {
        // Append new message to the chat
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            sender: data.sender,
            sender_username: data.sender_username,
            content: data.content,
            timestamp: data.timestamp,
          }];
        });
      }

      // Update conversation list: bump matching conversation to top with new last_message
      setConversations((prev) => {
        const updated = prev.map((c) => {
          const isMatch = c.type === data.conversation_type && (
            (data.conversation_type === 'marketplace' && c.item_id === data.item_id) ||
            (data.conversation_type === 'housing' && c.listing_id === data.listing_id) ||
            (data.conversation_type === 'study_group' && c.group_id === data.group_id) ||
            (data.conversation_type === 'roommate' && c.match_request_id === data.match_request_id)
          );
          if (isMatch) {
            return {
              ...c,
              last_message: data.content,
              timestamp: data.timestamp,
              unread_count: isCurrentConvo ? c.unread_count : c.unread_count + 1,
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    });
    return unsub;
  }, [subscribe]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const [marketplaceRes, housingRes, groupsRes, roommateRes] = await Promise.all([
        axios.get('/api/marketplace-messages/conversations/'),
        axios.get('/api/housing-inquiries/conversations/'),
        axios.get('/api/study-groups/?my_groups=true'),
        axios.get('/api/roommate-messages/conversations/'),
      ]);

      const marketplaceConvos: Conversation[] = (marketplaceRes.data || []).map((c: any) => ({
        type: 'marketplace' as const,
        item_id: c.item_id,
        item_title: c.item_title,
        other_user_id: c.other_user_id,
        other_username: c.other_username,
        last_message: c.last_message,
        timestamp: c.timestamp,
        unread_count: c.unread_count,
      }));

      const housingConvos: Conversation[] = (housingRes.data || []).map((c: any) => ({
        type: 'housing' as const,
        listing_id: c.listing_id,
        listing_title: c.listing_title,
        other_user_id: c.other_user_id,
        other_username: c.other_username,
        last_message: c.last_message,
        timestamp: c.timestamp,
        unread_count: c.unread_count,
      }));

      const groupsData = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data.results || []);
      const groupConvos: Conversation[] = groupsData.map((g: any) => ({
        type: 'study_group' as const,
        group_id: g.id,
        group_name: g.name,
        last_message: '',
        timestamp: g.updated_date || g.created_date,
        unread_count: 0,
      }));

      const roommateConvos: Conversation[] = (roommateRes.data || []).map((c: any) => ({
        type: 'roommate' as const,
        match_request_id: c.match_request_id,
        other_user_id: c.other_user_id,
        other_username: c.other_username,
        last_message: c.last_message,
        timestamp: c.timestamp,
        unread_count: c.unread_count,
      }));

      const all = [...marketplaceConvos, ...housingConvos, ...groupConvos, ...roommateConvos]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setConversations(all);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    setLoading(false);
  };

  const fetchMessages = async (convo: Conversation) => {
    setMessagesLoading(true);
    setMessages([]);
    try {
      let data: any[] = [];
      if (convo.type === 'marketplace') {
        const res = await axios.get(
          `/api/marketplace-messages/by_item/?item_id=${convo.item_id}&other_user_id=${convo.other_user_id}`
        );
        data = (Array.isArray(res.data) ? res.data : (res.data.results || [])).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          sender_username: m.sender_username,
          content: m.content,
          timestamp: m.timestamp,
        }));
      } else if (convo.type === 'housing') {
        const res = await axios.get(
          `/api/housing-inquiries/by_listing/?listing_id=${convo.listing_id}&other_user_id=${convo.other_user_id}`
        );
        data = (Array.isArray(res.data) ? res.data : (res.data.results || [])).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          sender_username: m.sender_username,
          content: m.message,
          timestamp: m.timestamp,
        }));
      } else if (convo.type === 'study_group') {
        const res = await axios.get(`/api/study-groups/${convo.group_id}/messages/`);
        data = (Array.isArray(res.data) ? res.data : (res.data.results || [])).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          sender_username: m.sender_username,
          content: m.content,
          timestamp: m.timestamp,
        }));
      } else if (convo.type === 'roommate') {
        const res = await axios.get(`/api/roommate-messages/by_match/?match_request_id=${convo.match_request_id}`);
        data = (Array.isArray(res.data) ? res.data : (res.data.results || [])).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          sender_username: m.sender_username,
          content: m.content,
          timestamp: m.timestamp,
        }));
      }
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setMessagesLoading(false);
  };

  const handleSelectConversation = async (convo: Conversation) => {
    setSelectedConversation(convo);
    await fetchMessages(convo);
    // Reading messages marks them as read on backend — refresh the badge count
    refreshUnreadCount();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    setSending(true);
    try {
      if (selectedConversation.type === 'marketplace') {
        await axios.post('/api/marketplace-messages/', {
          item: selectedConversation.item_id,
          receiver: selectedConversation.other_user_id,
          content: newMessage,
        });
      } else if (selectedConversation.type === 'housing') {
        await axios.post('/api/housing-inquiries/', {
          listing: selectedConversation.listing_id,
          receiver: selectedConversation.other_user_id,
          message: newMessage,
        });
      } else if (selectedConversation.type === 'study_group') {
        await axios.post(`/api/study-groups/${selectedConversation.group_id}/messages/`, {
          group: selectedConversation.group_id,
          content: newMessage,
        });
      } else if (selectedConversation.type === 'roommate') {
        await axios.post('/api/roommate-messages/', {
          match_request: selectedConversation.match_request_id,
          content: newMessage,
        });
      }
      setNewMessage('');
      fetchMessages(selectedConversation);
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setSending(false);
  };

  const getConversationTitle = (convo: Conversation) => {
    if (convo.type === 'marketplace') return convo.item_title || 'Marketplace Item';
    if (convo.type === 'housing') return convo.listing_title || 'Housing Listing';
    if (convo.type === 'roommate') return convo.other_username || 'Roommate';
    return convo.group_name || 'Study Group';
  };

  const getConversationSubtitle = (convo: Conversation) => {
    if (convo.type === 'study_group') return 'Group Chat';
    if (convo.type === 'roommate') return 'Roommate Chat';
    return convo.other_username || '';
  };

  const filteredConversations = conversations.filter((c) => {
    if (tab === 0) return true;
    if (tab === 1) return c.type === 'roommate';
    if (tab === 2) return c.type === 'marketplace';
    if (tab === 3) return c.type === 'housing';
    if (tab === 4) return c.type === 'study_group';
    return true;
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)',
          borderRadius: 4,
          p: 4,
          mb: 3,
          color: 'white',
        }}
      >
        <Typography variant="h4" fontWeight={800}>
          Messages
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
          All your conversations in one place
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 280px)', minHeight: 500 }}>
        {/* Left panel - conversations list */}
        <Box sx={{ width: 380, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 48 }}
          >
            <Tab label="All" sx={{ minHeight: 48 }} />
            <Tab label="Roommate" sx={{ minHeight: 48 }} />
            <Tab label="Marketplace" sx={{ minHeight: 48 }} />
            <Tab label="Housing" sx={{ minHeight: 48 }} />
            <Tab label="Groups" sx={{ minHeight: 48 }} />
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No conversations yet
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredConversations.map((convo, i) => {
                  const isSelected =
                    selectedConversation &&
                    selectedConversation.type === convo.type &&
                    ((convo.type === 'marketplace' && selectedConversation.item_id === convo.item_id && selectedConversation.other_user_id === convo.other_user_id) ||
                      (convo.type === 'housing' && selectedConversation.listing_id === convo.listing_id && selectedConversation.other_user_id === convo.other_user_id) ||
                      (convo.type === 'study_group' && selectedConversation.group_id === convo.group_id) ||
                      (convo.type === 'roommate' && selectedConversation.match_request_id === convo.match_request_id));

                  return (
                    <ListItemButton
                      key={`${convo.type}-${convo.item_id || convo.listing_id || convo.group_id || convo.match_request_id}-${convo.other_user_id || ''}-${i}`}
                      selected={!!isSelected}
                      onClick={() => handleSelectConversation(convo)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: typeColors[convo.type] + '20',
                            color: typeColors[convo.type],
                          }}
                        >
                          {typeIcons[convo.type]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                              {getConversationTitle(convo)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {timeAgoShort(convo.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {getConversationSubtitle(convo)}
                              {convo.last_message ? ` - ${convo.last_message}` : ''}
                            </Typography>
                            {convo.unread_count > 0 && (
                              <Badge badgeContent={convo.unread_count} color="primary" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>

        {/* Right panel - chat view */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: typeColors[selectedConversation.type] + '20',
                    color: typeColors[selectedConversation.type],
                  }}
                >
                  {typeIcons[selectedConversation.type]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {getConversationTitle(selectedConversation)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getConversationSubtitle(selectedConversation)}
                  </Typography>
                </Box>
                <Chip
                  label={selectedConversation.type === 'study_group' ? 'Study Group' : selectedConversation.type === 'marketplace' ? 'Marketplace' : selectedConversation.type === 'roommate' ? 'Roommate' : 'Housing'}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 'auto', fontSize: '0.7rem' }}
                />
              </Box>

              {/* Messages area */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender === user?.id;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            bgcolor: isOwn ? 'primary.main' : 'background.paper',
                            color: isOwn ? 'white' : 'text.primary',
                            px: 2,
                            py: 1,
                            borderRadius: 2.5,
                            borderTopRightRadius: isOwn ? 4 : 20,
                            borderTopLeftRadius: isOwn ? 20 : 4,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          }}
                        >
                          {!isOwn && (
                            <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.7 }}>
                              {msg.sender_username}
                            </Typography>
                          )}
                          <Typography variant="body2">{msg.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.6, display: 'block', textAlign: 'right', mt: 0.3 }}
                          >
                            {formatChatTime(msg.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input area */}
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                    width: 40,
                    height: 40,
                  }}
                >
                  {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Box sx={{ textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a conversation from the left to start messaging
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessagesPage;

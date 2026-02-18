import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar,
  CircularProgress, Chip, Tooltip, Button
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatChatTime } from '../utils/dateUtils';

export interface ChatMessage {
  id: number;
  sender: number;
  sender_username: string;
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: number;
  onSend: (content: string) => Promise<void>;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  titleIcon?: React.ReactElement;
  emptyText?: string;
  height?: number | string;
  showSenderName?: boolean;
  messagesLink?: string;
}

const scrollbarSx = {
  '&::-webkit-scrollbar': { width: 5 },
  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'grey.300',
    borderRadius: 3,
    '&:hover': { bgcolor: 'grey.400' },
  },
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#CBD5E1 transparent',
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  onSend,
  loading = false,
  title,
  subtitle,
  titleIcon,
  emptyText = 'No messages yet. Start the conversation!',
  height = 400,
  showSenderName = false,
  messagesLink = '/messages',
}) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput('');
    } catch {
      // parent handles error
    }
    setSending(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      {title && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'grey.50',
            flexShrink: 0,
          }}
        >
          {titleIcon && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              {titleIcon}
            </Avatar>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', flexShrink: 0 }}
          />
          {messagesLink && (
            <Tooltip title="Open in Messages">
              <IconButton
                size="small"
                onClick={() => navigate(messagesLink)}
                sx={{
                  color: 'primary.main',
                  bgcolor: 'primary.main' + '10',
                  '&:hover': { bgcolor: 'primary.main' + '20' },
                  ml: 0.5,
                  width: 30,
                  height: 30,
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 1.5,
          bgcolor: 'grey.50',
          ...scrollbarSx,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={28} />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: 1,
            }}
          >
            <ChatIcon sx={{ fontSize: 36, color: 'grey.300' }} />
            <Typography variant="body2" color="text.secondary">
              {emptyText}
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender === currentUserId;
            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1.5,
                }}
              >
                {!isOwn && showSenderName && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: 'secondary.main',
                      mr: 1,
                      mt: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {msg.sender_username?.charAt(0).toUpperCase() || '?'}
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: '75%',
                    bgcolor: isOwn ? 'primary.main' : 'background.paper',
                    color: isOwn ? 'white' : 'text.primary',
                    px: 2,
                    py: 1,
                    borderRadius: 2.5,
                    borderTopRightRadius: isOwn ? 6 : 20,
                    borderTopLeftRadius: isOwn ? 20 : 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  {!isOwn && showSenderName && (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        display: 'block',
                        mb: 0.25,
                        color: isOwn ? 'rgba(255,255,255,0.8)' : 'primary.main',
                      }}
                    >
                      {msg.sender_username}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'right',
                      mt: 0.5,
                      opacity: 0.6,
                      fontSize: '0.65rem',
                    }}
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
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'grey.50',
              fontSize: '0.875rem',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!input.trim() || sending}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 40,
            height: 40,
            flexShrink: 0,
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'grey.200', color: 'grey.400' },
            transition: 'all 0.15s ease',
          }}
        >
          {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatPanel;

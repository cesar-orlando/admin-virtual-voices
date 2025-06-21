import React, { useEffect, useState, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import ForumIcon from '@mui/icons-material/Forum'

import { fetchMessages } from '../api/fetchMessages'
import { sendMessages } from '../api/sendMessages'
import type { UserProfile } from '../types'
import io from 'socket.io-client'

const user = JSON.parse(localStorage.getItem('user') || '{}') as UserProfile

type Message = {
  id: string
  phone: string
  messages: { body: string; direction: string }[]
  session: { id: string }
  // add other properties if needed
}

export function ChatsTab() {
  const theme = useTheme()
  const [conversations, setConversations] = useState<Message[]>([])
  const [activeConversation, setActiveConversation] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const socket = io('http://localhost:3001') // Use your backend URL

    // Listen for new whatsapp-message events
    socket.on(`whatsapp-message-${user.c_name}`, (newMessageData: Message) => {
      setConversations(prev => {
        const existingConvoIndex = prev.findIndex(m => m.id === newMessageData.id)
        let updatedConversations

        if (existingConvoIndex !== -1) {
          // Update existing conversation
          updatedConversations = [...prev]
          const existingConvo = updatedConversations[existingConvoIndex]
          updatedConversations[existingConvoIndex] = {
            ...existingConvo,
            messages: [...existingConvo.messages, ...newMessageData.messages],
          }
        } else {
          // Add new conversation
          updatedConversations = [newMessageData, ...prev]
        }
        return updatedConversations
      })
      
      // Update active conversation if it's the one receiving a message
      if(activeConversation && activeConversation.id === newMessageData.id) {
        setActiveConversation(prev => prev ? ({ ...prev, messages: [...prev.messages, ...newMessageData.messages]}) : null)
      }
    })

    // Fetch initial messages
    fetchMessages(user).then(initialData => {
      setConversations(initialData)
      setIsLoading(false)
    })

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect()
    }
  }, [user.c_name, user.id, activeConversation])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeConversation?.messages])

  async function handleSendMessage() {
    if (!chatInput.trim() || !activeConversation) return
    const userMessage = chatInput
    setChatInput('')
    
    const newMessage = { body: userMessage, direction: 'outbound' }

    // Optimistically update the UI
    const updatedMessages = [...activeConversation.messages, newMessage]
    setActiveConversation({ ...activeConversation, messages: updatedMessages })

    sendMessages(activeConversation.session.id, user, activeConversation.phone, userMessage)
      .catch(() => {
        // Handle error - maybe show a 'failed to send' indicator
        console.error("Failed to send message")
        // Revert optimistic update if needed
      })
  }

  const filteredConversations = conversations.filter(convo =>
    convo.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    )
  }

  return (
    <Box 
      component="main"
      sx={{
        width: '90vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
       <Box sx={{ p: 3, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
            fontFamily: 'Montserrat, Arial, sans-serif',
          }}
        >
          Bandeja de Entrada
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          Gestiona todas tus conversaciones de WhatsApp en un solo lugar.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Conversation List */}
        <Paper 
          elevation={0}
          sx={{ 
            width: { xs: '100%', md: 360 },
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent',
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Divider />
          <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {filteredConversations.length > 0 ? filteredConversations.map(convo => (
              <ListItem 
                key={convo.id}
                button
                selected={activeConversation?.id === convo.id}
                onClick={() => setActiveConversation(convo)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: '#8B5CF6' }}>
                    {convo.phone.substring(0, 2)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={convo.phone.split('@')[0]}
                  secondary={convo.messages.length > 0 ? convo.messages[convo.messages.length - 1].body : 'Sin mensajes'}
                  primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true, fontStyle: 'italic' }}
                />
              </ListItem>
            )) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">No hay conversaciones</Typography>
              </Box>
            )}
          </List>
        </Paper>

        {/* Chat View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeConversation ? (
            <>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Avatar sx={{ backgroundColor: '#8B5CF6', mr: 2 }}>{activeConversation.phone.substring(0, 2)}</Avatar>
                <Typography variant="h6" fontWeight={600}>{activeConversation.phone.split('@')[0]}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeConversation.messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      alignSelf: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                      maxWidth: '70%',
                    }}
                  >
                    <Paper 
                      elevation={1}
                      sx={{
                        p: '10px 14px',
                        borderRadius: msg.direction === 'inbound' ? '20px 20px 20px 5px' : '20px 20px 5px 20px',
                        backgroundColor: msg.direction === 'inbound'
                          ? (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200')
                          : 'primary.main',
                        color: msg.direction === 'inbound' ? 'text.primary' : 'primary.contrastText',
                      }}
                    >
                      <Typography variant="body1">{msg.body}</Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.default' }}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Escribe un mensaje..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <IconButton color="primary" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'text.secondary' }}>
              <ForumIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }}/>
              <Typography variant="h5">Selecciona una conversación</Typography>
              <Typography>Elige un chat de la lista para ver los mensajes.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

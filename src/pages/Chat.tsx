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
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import ForumIcon from '@mui/icons-material/Forum'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { fetchWhatsAppUsers, fetchUserMessages, sendMessages, fetchSessions } from '../api/servicios'
import type { UserProfile, WhatsAppSession, WhatsAppUser, WhatsAppMessage } from '../types'
import io from 'socket.io-client'

type Message = {
  id: string
  phone: string
  messages: WhatsAppMessage[]
  session: { id: string }
  // add other properties if needed
}

export function ChatsTab() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') as UserProfile
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  const [conversations, setConversations] = useState<WhatsAppUser[]>([])
  const [filteredConversations, setFilteredConversations] = useState<WhatsAppUser[]>([])
  const [activeConversation, setActiveConversation] = useState<WhatsAppUser | null>(null)
  const [activeMessages, setActiveMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showConversationsList, setShowConversationsList] = useState(true)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // State for the new message modal
  const [openSendModal, setOpenSendModal] = useState(false)
  const [sendPhone, setSendPhone] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [sendLoading, setSendLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Handle conversation selection for mobile
  const handleConversationSelect = (convo: WhatsAppUser) => {
    setActiveConversation(convo)
    if (isMobile) {
      setShowConversationsList(false)
    }
  }

  // Handle back to conversations list on mobile
  const handleBackToConversations = () => {
    if (isMobile) {
      setShowConversationsList(true)
      setActiveConversation(null)
    }
  }

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL) // Use environment variable

    // Listen for new whatsapp-message events
    socket.on(`whatsapp-message-${user.companySlug}`, (newMessageData: any) => {
      // Update conversations when new messages arrive
      setConversations(prev => {
        const existingConvoIndex = prev.findIndex(m => m.phone === newMessageData.phone.replace('@c.us', ''));
        if (existingConvoIndex !== -1) {
          const updatedConversations = [...prev];
          updatedConversations[existingConvoIndex] = {
            ...updatedConversations[existingConvoIndex],
            lastMessage: newMessageData.messages[newMessageData.messages.length - 1],
            totalMessages: updatedConversations[existingConvoIndex].totalMessages + 1,
            updatedAt: newMessageData.messages[newMessageData.messages.length - 1].createdAt
          };
          return updatedConversations;
        }
        return prev;
      });
      
      if(activeConversation && activeConversation.phone === newMessageData.phone) {
        setActiveMessages(prev => [...prev, newMessageData.lastMessage])
      }
    })

    // Fetch initial data
    const loadData = async () => {
      try {
        const [usersData, sessionsData] = await Promise.all([
          fetchWhatsAppUsers(user, ['prospectos', 'clientes', 'nuevo_ingreso']),
          fetchSessions(user),
        ]) as [WhatsAppUser[], WhatsAppSession[]]
        
        // Sort conversations after initial fetch
        const sortedConversations = usersData.sort((a, b) => {
          const lastMessageDateA = a.lastMessage ? new Date(a.lastMessage.date).getTime() : 0;
          const lastMessageDateB = b.lastMessage ? new Date(b.lastMessage.date).getTime() : 0;
          return lastMessageDateB - lastMessageDateA; // Sort descending by latest message
        });
        setConversations(sortedConversations)
        setSessions(sessionsData)
      } catch (error) {
        console.error("Error loading conversations:", error)
        setSnackbar({ open: true, message: 'Error al cargar datos iniciales', severity: 'error' })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect()
    }
  }, [user.companySlug, user.id])

  useEffect(() => {

    const updatedConversations = conversations
      .filter(convo =>
        convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        convo.phone.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const lastMessageDateA = a.lastMessage && a.lastMessage.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const lastMessageDateB = b.lastMessage && b.lastMessage.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        
        return lastMessageDateB - lastMessageDateA;  // Descending order
      });

    setFilteredConversations(updatedConversations);
  }, [conversations, searchTerm]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation?.phone) {
      const loadMessages = async () => {
        try {
          const messagesData = await fetchUserMessages(user, activeConversation.phone)
          setActiveMessages(messagesData.chat?.messages || [])
        } catch (error) {
          console.error("Failed to load messages", error)
          setSnackbar({ open: true, message: 'Error al cargar mensajes', severity: 'error' })
        }
      }
      loadMessages()
    } else {
      setActiveMessages([])
    }
  }, [activeConversation?.phone, conversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeMessages])

  async function handleSendMessage() {
    if (!chatInput.trim() || !activeConversation || !sessions.length) return
    const userMessage = chatInput
    setChatInput('')

    // Asegúrate de que el número tenga @c.us
    let phone = activeConversation.phone
    if (!phone.endsWith('@c.us')) {
      phone = phone + '@c.us'
    }

    const newMessage: WhatsAppMessage = {
      _id: Date.now().toString(),
      body: userMessage,
      direction: 'outbound',
      respondedBy: 'user',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Optimistically update the UI
    setActiveMessages(prev => [...prev, newMessage])

    // Usa la primera sesión disponible
    const sessionId = sessions[0]._id || sessions[0].id
    try {
      await sendMessages(sessionId, user, phone, userMessage);
      // Update conversations if message sent successfully
      setConversations((prevConvos) =>
        prevConvos.map((convo) =>
          convo.phone === activeConversation.phone
            ? {
                ...convo,
                lastMessage: newMessage,
                updatedAt: new Date().toISOString(),
              }
            : convo
        )
      );
    } catch (error) {
      // If the message fails, show error
      setSnackbar({ open: true, message: 'Error al enviar mensaje', severity: 'error' });
      // Optionally, remove the optimistic message if failed
      setActiveMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
    }
  }

  async function handleSendFromModal() {
    if (!sendPhone.trim() || !sendMessage.trim() || !selectedSessionId) return;
    setSendLoading(true);

    const newMessage: WhatsAppMessage = {
      _id: Date.now().toString(),
      body: sendMessage,
      direction: 'outbound',
      respondedBy: 'user',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Send the message
      await sendMessages(selectedSessionId, user, `521${sendPhone}@c.us`, sendMessage);
      // Update conversations if message sent successfully
      setConversations((prevConvos) =>
        prevConvos.map((convo) =>
          convo.phone === `521${sendPhone}`
            ? {
                ...convo,
                lastMessage: newMessage,
                updatedAt: new Date().toISOString(),
              }
            : convo
        )
      );

      setSnackbar({ open: true, message: 'Mensaje enviado correctamente', severity: 'success' });
      setSendPhone('');
      setSendMessage('');
      setOpenSendModal(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al enviar mensaje', severity: 'error' });
    } finally {
      setSendLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        p: { xs: 2, md: 0 }
      }}>
        <CircularProgress 
          sx={{ color: '#8B5CF6' }} 
          size={isMobile ? 40 : 60}
        />
      </Box>
    )
  }

  return (
    <Box 
      component="main"
      sx={{
        width: '100%',
        height: { xs: '100vh', md: '85vh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: { xs: 2, md: 3 }, 
        flexShrink: 0, 
        borderBottom: `1px solid ${theme.palette.divider}`, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 }
      }}>
        <div>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: { xs: '1.5rem', md: '2.125rem' }
            }}
          >
            Bandeja de Entrada
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            Gestiona todas tus conversaciones de WhatsApp en un solo lugar.
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenSendModal(true)}
          size={isMobile ? "small" : "medium"}
          sx={{
            backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            fontSize: { xs: '0.875rem', md: '1rem' },
            width: { xs: '100%', md: 'auto' }
          }}
        >
          {isMobile ? 'Nuevo' : 'Nuevo Mensaje'}
        </Button>
      </Box>

      {/* Main Chat Layout */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversations Sidebar */}
        <Paper 
          elevation={2} 
          sx={{ 
            width: isMobile ? '100%' : { xs: '100%', md: '350px' },
            display: isMobile ? (showConversationsList ? 'flex' : 'none') : 'flex',
            flexDirection: 'column', 
            borderRadius: 0,
            position: 'relative'
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, pb: 0 }}>
            <TextField
              fullWidth
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
          </Box>
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredConversations.length > 0 ? filteredConversations.map((convo, index) => (
              <ListItem
                key={convo.phone}
                button
                onClick={() => handleConversationSelect(convo)}
                selected={activeConversation?.phone === convo.phone}
                sx={{
                  borderBottom: index < filteredConversations.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 2, md: 3 },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '20',
                    borderRight: `4px solid ${theme.palette.primary.main}`
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      backgroundColor: '#8B5CF6',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    {convo.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={convo.name}
                  secondary={convo.lastMessage?.body || 'Sin mensajes'}
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    noWrap: true,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}
                  secondaryTypographyProps={{ 
                    noWrap: true, 
                    fontStyle: 'italic',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                />
              </ListItem>
            )) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                >
                  No hay conversaciones
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        {/* Chat View */}
        <Box sx={{ 
          flex: 1, 
          display: isMobile ? (showConversationsList ? 'none' : 'flex') : 'flex',
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <Box sx={{ 
                p: { xs: 2, md: 3 }, 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: `1px solid ${theme.palette.divider}`,
                gap: 2
              }}>
                {isMobile && (
                  <IconButton 
                    onClick={handleBackToConversations}
                    size="small"
                  >
                    <ArrowBackIcon />
                  </IconButton>
                )}
                <Avatar 
                  sx={{ 
                    backgroundColor: '#8B5CF6',
                    width: { xs: 32, md: 40 },
                    height: { xs: 32, md: 40 },
                    fontSize: { xs: '0.75rem', md: '1rem' }
                  }}
                >
                  {activeConversation.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    fontWeight={600}
                    sx={{ 
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {activeConversation.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {activeConversation.phone}
                  </Typography>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ 
                flex: 1, 
                p: { xs: 2, md: 3 }, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 1.5, md: 2 }
              }}>
                {activeMessages.map((msg, idx) => (
                  <Box
                    key={msg._id || idx}
                    sx={{
                      alignSelf: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                      maxWidth: { xs: '85%', md: '70%' },
                    }}
                  >
                    <Paper 
                      elevation={1}
                      sx={{
                        p: { xs: '8px 12px', md: '10px 14px' },
                        borderRadius: msg.direction === 'inbound' ? '20px 20px 20px 5px' : '20px 20px 5px 20px',
                        backgroundColor: msg.direction === 'inbound'
                          ? (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200')
                          : 'primary.main',
                        color: msg.direction === 'inbound' ? 'text.primary' : 'primary.contrastText',
                      }}
                    >
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          lineHeight: 1.4,
                          wordBreak: 'break-word'
                        }}
                      >
                        {msg.body}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>

              {/* Message Input */}
              <Box sx={{ 
                p: { xs: 2, md: 3 }, 
                borderTop: `1px solid ${theme.palette.divider}`, 
                backgroundColor: 'background.default' 
              }}>
                <Stack direction="row" spacing={{ xs: 1, md: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={isMobile ? 2 : 3}
                    placeholder="Escribe un mensaje..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage} 
                    disabled={!chatInput.trim()}
                    size={isMobile ? "small" : "medium"}
                  >
                    <SendIcon fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flexDirection: 'column', 
              color: 'text.secondary',
              p: { xs: 3, md: 4 }
            }}>
              <ForumIcon sx={{ 
                fontSize: { xs: 60, md: 80 }, 
                mb: { xs: 1.5, md: 2 }, 
                opacity: 0.3 
              }}/>
              <Typography 
                variant={isMobile ? "h6" : "h5"}
                sx={{ 
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  textAlign: 'center',
                  mb: 1
                }}
              >
                Selecciona una conversación
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  textAlign: 'center'
                }}
              >
                {isMobile ? 'Elige un chat para ver los mensajes.' : 'Elige un chat de la lista para ver los mensajes.'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal para enviar mensaje manual */}
      <Dialog 
        open={openSendModal} 
        onClose={() => setOpenSendModal(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1.25rem', md: '1.5rem' }
        }}>
          Enviar Nuevo Mensaje
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl 
              fullWidth
              size={isMobile ? "small" : "medium"}
            >
              <InputLabel 
                id="session-select-label"
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                Sesión de Envío
              </InputLabel>
              <Select
                labelId="session-select-label"
                value={selectedSessionId}
                label="Sesión de Envío"
                onChange={e => setSelectedSessionId(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              >
                {sessions.map(session => (
                  <MenuItem key={session._id || session.id} value={session._id || session.id}>
                    {session.name || session._id || session.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Número de Teléfono (10 dígitos)"
              value={sendPhone}
              onChange={e => setSendPhone(e.target.value)}
              fullWidth
              placeholder="Ej: 5512345678"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
            <TextField
              label="Mensaje"
              value={sendMessage}
              onChange={e => setSendMessage(e.target.value)}
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              placeholder="Escribe el mensaje..."
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            onClick={() => setOpenSendModal(false)}
            size={isMobile ? "medium" : "large"}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendFromModal}
            disabled={!sendPhone.trim() || !sendMessage.trim() || !selectedSessionId || sendLoading}
            size={isMobile ? "medium" : "large"}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            {sendLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'center' : 'left',
        }}
      >
        <Alert 
          elevation={6} 
          variant="filled" 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.875rem', md: '1rem' },
            minWidth: { xs: 'auto', md: '300px' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
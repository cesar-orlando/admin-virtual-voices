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
import Badge from '@mui/material/Badge'

import { fetchWhatsAppUsers, fetchUserMessages, sendMessages, fetchSessions } from '../api/servicios'
import type { UserProfile, WhatsAppSession, WhatsAppUser, WhatsAppMessage, GroupedWhatsAppUser } from '../types'
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
  const [conversations, setConversations] = useState<GroupedWhatsAppUser[]>([])
  const [filteredConversations, setFilteredConversations] = useState<GroupedWhatsAppUser[]>([])
  const [activeConversation, setActiveConversation] = useState<GroupedWhatsAppUser | null>(null)
  const [activeMessages, setActiveMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // State for the new message modal
  const [openSendModal, setOpenSendModal] = useState(false)
  const [sendPhone, setSendPhone] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [sendLoading, setSendLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  const [selectedSessionViewId, setSelectedSessionViewId] = useState<string>(''); // <-- NUEVO

  // Agrupa conversaciones por número de teléfono
  function groupConversationsByPhone(users: WhatsAppUser[]): GroupedWhatsAppUser[] {
    const map = new Map<string, GroupedWhatsAppUser>();
    users.forEach(u => {
      if (!map.has(u.phone)) {
        map.set(u.phone, { ...u, sessions: [u.session.id], unreadMessages: u.unreadMessages || 0 });
      } else {
        const existing = map.get(u.phone)!;
        existing.sessions.push(u.session.id);
        // Suma los mensajes no leídos de todas las sesiones
        existing.unreadMessages = (existing.unreadMessages || 0) + (u.unreadMessages || 0);
        // Actualiza el último mensaje si es más reciente
        if (
          u.lastMessage &&
          (!existing.lastMessage ||
            new Date(u.lastMessage.date).getTime() > new Date(existing.lastMessage.date).getTime())
        ) {
          existing.lastMessage = u.lastMessage;
        }
      }
    });
    return Array.from(map.values());
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
            updatedAt: newMessageData.messages[newMessageData.messages.length - 1].createdAt,
            unreadMessages: newMessageData.messages[newMessageData.messages.length - 1].direction === 'inbound'
              ? (updatedConversations[existingConvoIndex].unreadMessages || 0) + 1
              : 0
          };
          // Notificación tipo snackbar solo para mensajes entrantes
          const lastMsg = newMessageData.messages[newMessageData.messages.length - 1];
          if (lastMsg.direction === 'inbound') {
            setSnackbar({
              open: true,
              message: `Nuevo mensaje de ${newMessageData.name || newMessageData.phone.replace('@c.us', '')}: ${lastMsg.body?.slice(0, 60)}`,
              severity: 'info'
            });
          }
          return updatedConversations;
        }
        return prev;
      });

      if (activeConversation && activeConversation.phone === newMessageData.phone) {
        setActiveMessages(prev => [...prev, newMessageData.lastMessage])
      }
    })

    // Fetch initial data
    const loadData = async () => {
      try {
        const sessionsData = await fetchSessions(user) as WhatsAppSession[];
        setSessions(sessionsData);
        // Selecciona la primera sesión por defecto si no hay una seleccionada
        if (!selectedSessionViewId && sessionsData.length > 0) {
          setSelectedSessionViewId(sessionsData[0]._id || sessionsData[0].id);
        }
        // Solo carga usuarios si hay una sesión seleccionada
        if ((selectedSessionViewId || sessionsData[0]?._id || sessionsData[0]?.id)) {
          const usersData = await fetchWhatsAppUsers(user, ['prospectos', 'clientes', 'nuevo_ingreso']) as WhatsAppUser[];
          console.log("Fetched users:", usersData);
          // Agrupa por número
          const grouped = groupConversationsByPhone(usersData);
          // Ordena por fecha de último mensaje
          const sortedConversations = grouped.sort((a, b) => {
            const lastMessageDateA = a.lastMessage ? new Date(a.lastMessage.date).getTime() : 0;
            const lastMessageDateB = b.lastMessage ? new Date(b.lastMessage.date).getTime() : 0;
            return lastMessageDateB - lastMessageDateA;
          }) as GroupedWhatsAppUser[];
          setConversations(sortedConversations)
        }
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
  }, [user.companySlug, user.id]) // No agregues selectedSessionViewId aquí

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
    if (
      activeConversation?.phone &&
      activeConversation.sessions?.includes(selectedSessionViewId)
    ) {
      const loadMessages = async () => {
        try {
          const messagesData = await fetchUserMessages(user, selectedSessionViewId, activeConversation.phone)
          setActiveMessages(messagesData.chat?.messages || [])
          console.log(messagesData);
          // Cambia el nombre del chat si el nombre de la sesión es diferente
          if (
            messagesData.chat?.name &&
            messagesData.chat.name !== activeConversation.name
          ) {
            setConversations(prev =>
              prev.map(convo =>
                convo.phone === activeConversation.phone
                  ? { ...convo, name: messagesData.chat.name, lastMessage: messagesData.chat.messages[messagesData.chat.messages.length - 1] }
                  : convo
              )
            )
            // Si el chat activo es el mismo, actualiza también el activeConversation
            setActiveConversation(prev =>
              prev && prev.phone === activeConversation.phone
                ? { ...prev, name: messagesData.chat.name, lastMessage: messagesData.chat.messages[messagesData.chat.messages.length - 1] }
                : prev
            )
          }
        } catch (error) {
          console.error("Failed to load messages", error)
          setSnackbar({ open: true, message: 'Error al cargar mensajes', severity: 'error' })
        }
      }
      loadMessages()
    } else {
      setActiveMessages([])
    }
  }, [activeConversation?.phone, conversations, selectedSessionViewId])

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

    try {
      if (
        activeConversation?.phone &&
        activeConversation.sessions?.includes(selectedSessionViewId)
      ) {
        await sendMessages(selectedSessionViewId, user, phone, userMessage);
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
      }
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

  useEffect(() => {
    if (!activeConversation) return;
    // Si el selectedSessionViewId no es válido para este número, selecciona la primera sesión disponible
    if (
      !activeConversation.sessions?.includes(selectedSessionViewId) &&
      activeConversation.sessions &&
      activeConversation.sessions.length > 0
    ) {
      setSelectedSessionViewId(activeConversation.sessions[0]);
    }
    // Si solo hay una sesión, asegúrate de que esté seleccionada
    if (
      activeConversation.sessions &&
      activeConversation.sessions.length === 1 &&
      selectedSessionViewId !== activeConversation.sessions[0]
    ) {
      setSelectedSessionViewId(activeConversation.sessions[0]);
    }
  }, [activeConversation]);

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
      {/* Header */}
      <Box sx={{ p: 3, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
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
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenSendModal(true)}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
          }}
        >
          Nuevo Mensaje
        </Button>
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
                key={convo._id}
                button
                selected={activeConversation?._id === convo._id}
                onClick={() => setActiveConversation(convo)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemAvatar>
                  <Badge
                    color="secondary"
                    badgeContent={convo.unreadMessages > 0 ? convo.unreadMessages : 0}
                    invisible={!convo.unreadMessages || convo.unreadMessages <= 0}
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    <Avatar sx={{ backgroundColor: '#8B5CF6' }}>
                      {convo.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={convo.name}
                  secondary={convo.lastMessage?.body || 'Sin mensajes'}
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
                <Avatar sx={{ backgroundColor: '#8B5CF6', mr: 2 }}>{activeConversation.name.substring(0, 2).toUpperCase()}</Avatar>
                <Typography variant="h6" fontWeight={600}>{activeConversation.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {activeConversation.phone}
                </Typography>
                {/* Selector de sesión si hay más de una sesión para este número */}
                {activeConversation.sessions && activeConversation.sessions.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 180, ml: 3 }}>
                    <InputLabel id="session-view-chat-label">Sesión</InputLabel>
                    <Select
                      labelId="session-view-chat-label"
                      value={selectedSessionViewId}
                      label="Sesión"
                      onChange={e => setSelectedSessionViewId(e.target.value)}
                    >
                      {sessions
                        .filter(s => activeConversation.sessions.includes(s._id || s.id))
                        .map(session => (
                          <MenuItem key={session._id || session.id} value={session._id || session.id}>
                            {session.name || session._id || session.id}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeMessages.map((msg, idx) => (
                  <Box
                    key={msg._id || idx}
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

      {/* Modal para enviar mensaje manual */}
      <Dialog open={openSendModal} onClose={() => setOpenSendModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enviar Nuevo Mensaje</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="session-select-label">Sesión de Envío</InputLabel>
              <Select
                labelId="session-select-label"
                value={selectedSessionId}
                label="Sesión de Envío"
                onChange={e => setSelectedSessionId(e.target.value)}
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
            />
            <TextField
              label="Mensaje"
              value={sendMessage}
              onChange={e => setSendMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Escribe el mensaje..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setOpenSendModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendFromModal}
            disabled={!sendPhone.trim() || !sendMessage.trim() || !selectedSessionId || sendLoading}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            {sendLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
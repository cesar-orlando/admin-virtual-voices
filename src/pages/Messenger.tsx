import React, { useEffect, useState, useRef } from 'react';
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
  Snackbar,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import Badge from '@mui/material/Badge';
import io from 'socket.io-client';
import { fetchFacebookUsers, fetchUserMessages, sendMessage, createSession, fetchSessions, updateSession, deleteSession } from '../api/servicios/metaServices';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { fetchAllAiConfigs } from '../api/servicios';
import { set } from 'date-fns';

const MESSENGER_SOCKET_EVENT = 'messenger-message';

export default function Messenger() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const theme = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [openCreateSession, setOpenCreateSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [openSessionsModal, setOpenSessionsModal] = useState(false);
  const [editSession, setEditSession] = useState<any | null>(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [editSessionIA, setEditSessionIA] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [availableIAs, setAvailableIAs] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch Messenger conversations from backend
  useEffect(() => {
    const fetchMessengerChats = async () => {
      setIsLoading(true);
      try {
        const response = await fetchFacebookUsers(user);
        console.log(response)
        setConversations(response);
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al cargar chats de Messenger', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessengerChats();
  }, [user.companySlug, user.id]);

  // Socket for real-time updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);

    socket.on(`${MESSENGER_SOCKET_EVENT}-${user.companySlug}`, (newMessageData: any) => {
      console.log(newMessageData);
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === newMessageData._id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: newMessageData.messages[newMessageData.messages.length - 1],
            updatedAt: newMessageData.messages[newMessageData.messages.length - 1].createdAt,
          };
          setSnackbar({
            open: true,
            message: `Nuevo mensaje de ${newMessageData.name}: ${newMessageData.messages[newMessageData.messages.length - 1].body?.slice(0, 60)}`,
            severity: 'info'
          });
          return updated;
        }
        return prev;
      });

      if (activeConversation && activeConversation.id === newMessageData.chatId) {
        setActiveMessages(prev => [...prev, newMessageData.messages[newMessageData.messages.length - 1]]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user.companySlug, activeConversation]);

  // Filter conversations by search
  useEffect(() => {
    const updated = conversations
      .filter(convo =>
        (convo.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    setFilteredConversations(updated);
  }, [conversations, searchTerm]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        try {
          const response = await fetchUserMessages(user, activeConversation.session.id, activeConversation.userId);
          console.log(response);
          setActiveMessages(response.chat.messages);
        } catch (error) {
          setSnackbar({ open: true, message: 'Error al cargar mensajes', severity: 'error' });
        }
      };
      fetchMessages();
    } else {
      setActiveMessages([]);
    }
  }, [activeConversation, user.companySlug, user.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages]);

  // Send message handler (dummy, replace with real API)
  async function handleSendMessage() {
    if (!chatInput.trim() || !activeConversation) return;
    try {
      setChatInput('');
      await sendMessage(user, activeConversation.userId, chatInput);
      setActiveMessages(prev => [
        ...prev,
        {
          body: chatInput,
          senderId: user.id,
          createdAt: new Date().toISOString(),
          direction: 'outbound',
        }
      ]);
      setSnackbar({ open: true, message: 'Mensaje enviado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al enviar el mensaje', severity: 'error' });
    }
  }

  // Handler para crear sesión
  const handleCreateSession = async () => {
    if (!sessionName.trim() || !pageId.trim() || !pageAccessToken.trim()) {
      setSnackbar({ open: true, message: 'Completa todos los campos', severity: 'error' });
      return;
    }
    setCreateLoading(true);
    try {
      await createSession(user, sessionName, { pageId, pageAccessToken });
      setSnackbar({ open: true, message: 'Sesión creada correctamente', severity: 'success' });
      setOpenCreateSession(false);
      setSessionName('');
      setPageId('');
      setPageAccessToken('');
      window.location.reload();
      // Opcional: recargar sesiones/conversaciones si aplica
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear la sesión', severity: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Cargar sesiones activas de Messenger
useEffect(() => {
  const fetchAllSessions = async () => {
    try {
      const data = await fetchSessions(user);
      setSessions(data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al cargar sesiones', severity: 'error' });
    }
  };
  fetchAllSessions();
}, [user.companySlug, user.id]);

  // Handler para editar sesión
  const handleEditSession = (session: any) => {
    setEditSession(session);
    setEditSessionName(session.name || '');
    setEditSessionIA(session.IA ? String(session.IA.id || session.IA._id) : '');
    // IA se setea en useEffect abajo
  };

  // Cargar IAs disponibles al abrir el modal de editar sesión
  useEffect(() => {
    if (!editSession) return;
    const fetchIAs = async () => {
      try {
        // Reemplaza esto por tu llamada real
        const data = await fetchAllAiConfigs(user);
        console.log(data);
        setAvailableIAs(data);
      } catch {
        setAvailableIAs([]);
      }
    };
    fetchIAs();
  }, [editSession?._id, user.id]);

  const handleSaveEditSession = async () => {
    if (!editSession) return;
    setEditLoading(true);
    try {
      // Buscar la IA seleccionada por id o _id
      const selectedIA = availableIAs.find((ia: any) => String(ia.id) === String(editSessionIA) || String(ia._id) === String(editSessionIA));

      const res = await updateSession({
        _id: editSession._id,
        name: editSessionName,
        IA: { id: selectedIA._id, name: selectedIA.name },
      }, user);
      setSessions(prev => prev.map(s => s._id === res.session._id ? res.session : s));
      setSnackbar({ open: true, message: 'Sesión actualizada', severity: 'success' });
      setEditSession(null);
    } catch {
      setSnackbar({ open: true, message: 'Error al actualizar sesión', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  // Handler para cambiar status
  const handleToggleStatus = async (session: any) => {
    try {
      const res = await updateSession({
        _id: session._id,
        status: session.status === 'connected' ? 'disconnected' : 'connected',
      }, user);
      setSessions(prev => prev.map(s => s._id === res.session._id ? res.session : s));
      setSnackbar({ open: true, message: 'Estado actualizado', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error al cambiar estado', severity: 'error' });
    }
  };

  // Handler para borrar sesión
  const handleDeleteSession = async (session: any) => {
    if (!window.confirm('¿Seguro que deseas borrar esta sesión?')) return;
    try {
      await deleteSession(user, session._id);
      setSnackbar({ open: true, message: 'Sesión eliminada', severity: 'success' });
      setOpenSessionsModal(false);
      window.location.reload();
    } catch {
      setSnackbar({ open: true, message: 'Error al eliminar sesión', severity: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#4267B2' }} />
      </Box>
    );
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
      {/* Botón para abrir el modal */}
      <Box sx={{ p: 3, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#4267B2',
              fontFamily: 'Montserrat, Arial, sans-serif',
            }}
          >
            Bandeja Messenger
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
          >
            Gestiona tus conversaciones de Facebook Messenger aquí.
          </Typography>
        </div>
        <Box>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#4267B2', color: '#fff', borderRadius: 2, mr: 2 }}
            onClick={() => setOpenCreateSession(true)}
          >
            Crear Sesión
          </Button>
          {sessions.length > 0 && (
            <Button
              variant="outlined"
              sx={{ borderColor: '#4267B2', color: '#4267B2', borderRadius: 2 }}
              onClick={() => setOpenSessionsModal(true)}
            >
              Ver Sesiones
            </Button>
          )}
        </Box>
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
                    color="primary"
                    badgeContent={convo.unreadCount > 0 ? convo.unreadCount : 0}
                    invisible={!convo.unreadCount || convo.unreadCount <= 0}
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    <Avatar sx={{ backgroundColor: '#4267B2' }}>
                      {(convo.name || 'M').substring(0, 2).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={convo.name || convo.id}
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
                <Avatar sx={{ backgroundColor: '#4267B2', mr: 2 }}>{(activeConversation.name || 'M').substring(0, 2).toUpperCase()}</Avatar>
                <Typography variant="h6" fontWeight={600}>{activeConversation.name || activeConversation.id}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {activeConversation.id}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeMessages.map((msg, idx) => (
                  <Box
                    key={msg._id ? `msg-${msg._id}` : `msg-${idx}`}
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
                          : '#4267B2',
                        color: msg.direction === 'inbound' ? 'text.primary' : '#fff',
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
                        e.preventDefault();
                        handleSendMessage();
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
              <ForumIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
              <Typography variant="h5">Selecciona una conversación</Typography>
              <Typography>Elige un chat de la lista para ver los mensajes.</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal para crear sesión */}
      <Dialog open={openCreateSession} onClose={() => setOpenCreateSession(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Crear Sesión de Messenger</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre de la sesión"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Page ID"
              value={pageId}
              onChange={e => setPageId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Page Access Token"
              value={pageAccessToken}
              onChange={e => setPageAccessToken(e.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateSession(false)} disabled={createLoading}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#4267B2', color: '#fff' }}
            onClick={handleCreateSession}
            disabled={createLoading}
          >
            {createLoading ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver y editar sesiones */}
      <Dialog open={openSessionsModal} onClose={() => setOpenSessionsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sesiones de Messenger</DialogTitle>
        <DialogContent>
          {sessions.length === 0 ? (
            <Typography color="text.secondary">No hay sesiones activas.</Typography>
          ) : (
            <List>
              {sessions.map(session => (
                <ListItem key={session._id} divider>
                  <ListItemText
                    primary={session.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Estado: {session.status === 'connected' ? 'Conectado' : 'Desconectado'}
                        </Typography>
                        {session.IA?.name && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            IA: {session.IA.name}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <IconButton onClick={() => handleEditSession(session)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleToggleStatus(session)} color={session.status === 'connected' ? 'success' : 'default'}>
                    <PowerSettingsNewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteSession(session)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSessionsModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar sesión */}
      <Dialog open={!!editSession} onClose={() => setEditSession(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Sesión</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre de la sesión"
              value={editSessionName}
              onChange={e => setEditSessionName(e.target.value)}
              fullWidth
              required
            />
            <Select
              label="Selecciona IA"
              value={editSessionIA ?? ''}
              onChange={e => setEditSessionIA(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">
                <em>Sin IA</em>
              </MenuItem>
              {availableIAs.map((ia) => {
                const iaKey = String(ia.id ?? ia._id);
                return (
                  <MenuItem key={iaKey} value={iaKey}>
                    {ia.name}
                  </MenuItem>
                );
              })}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSession(null)} disabled={editLoading}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#4267B2', color: '#fff' }}
            onClick={handleSaveEditSession}
            disabled={editLoading}
          >
            {editLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
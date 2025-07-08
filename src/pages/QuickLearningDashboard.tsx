import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  LinearProgress,
  useTheme,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  PeopleAlt as PeopleAltIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Launch as LaunchIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Audiotrack as AudiotrackIcon,
  Movie as MovieIcon
} from '@mui/icons-material';
import { useQuickLearningTwilio } from '../hooks/useQuickLearningTwilio';
import type { TwilioSendRequest, TwilioTemplateRequest } from '../types/quicklearning';

const QuickLearningDashboard: React.FC = () => {
  console.log('QuickLearningDashboard - Component rendering')
  
  // Debug user state
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const currentCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
    
    console.log('=== DEBUG USER STATE ===');
    console.log('User from localStorage:', user);
    console.log('Token from localStorage:', token);
    console.log('CurrentCompany from localStorage:', currentCompany);
    console.log('Is Quick Learning user:', user.companySlug === 'quicklearning');
    console.log('Current pathname:', window.location.pathname);
    console.log('=== END DEBUG ===');
  }, []);
  
  const theme = useTheme();
  const {
    status,
    activeChats,
    currentChat,
    isLoading,
    error,
    sendMessage,
    sendTemplate,
    loadChatByPhone,
    toggleAI,
    assignAdvisor,
    updateCustomerInfo,
    changeChatStatus,
    clearError,
    formatPhoneNumber,
    getMessageStatusColor,
    getChatStatusColor,
    prospects,
    selectedProspect,
    chatHistory,
    loadProspects,
    loadMoreProspects,
    selectProspect,
    isLoadingProspects,
    isLoadingMoreProspects,
    isLoadingChatHistory,
    errorProspects,
    errorChatHistory,
    hasMoreProspects,
  } = useQuickLearningTwilio();

  // State para modales y formularios
  const [sendMessageDialog, setSendMessageDialog] = useState(false);
  const [sendTemplateDialog, setSendTemplateDialog] = useState(false);
  const [chatDetailsDialog, setChatDetailsDialog] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  
  // State para formularios
  const [messageForm, setMessageForm] = useState<TwilioSendRequest>({
    phone: '',
    message: ''
  });
  
  const [templateForm, setTemplateForm] = useState<TwilioTemplateRequest>({
    phone: '',
    templateId: '',
    variables: []
  });

  // State para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [messageInputValue, setMessageInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Estado local para loading del input de mensaje
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Estado local para historial mostrado
  const [chatHistoryLocal, setChatHistoryLocal] = useState<any[]>([]);

  // Estado para controlar si mostrar botón de scroll al final
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 1. Agrega un estado para controlar el Dialog de info del cliente
  const [openClientInfo, setOpenClientInfo] = useState(false);

  // 1. Estados para el modal de imagen
  const [openImageModal, setOpenImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Función helper para formatear fechas
  const formatMessageDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Si es hoy, mostrar solo hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es ayer, mostrar "Ayer" + hora
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    
    // Si es esta semana, mostrar día + hora
    if (diffInHours < 168) { // 7 días
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es más antiguo, mostrar fecha completa
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
  }, []);

  // Función helper para formatear fechas de manera compacta (para lista de prospectos)
  const formatCompactDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Si es hoy, mostrar solo hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es ayer, mostrar "Ayer"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    // Si es esta semana, mostrar día
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    }
    
    // Si es más antiguo, mostrar fecha corta
    return date.toLocaleDateString('es-ES', {
      month: '2-digit',
      day: '2-digit'
    });
  }, []);

  // Función para hacer scroll al final del chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Sincroniza chatHistoryLocal con chatHistory global al seleccionar prospecto
  useEffect(() => {
    setChatHistoryLocal(chatHistory);
  }, [chatHistory]);

  // Agregar mensajes de prueba para verificar el formato de fechas
  useEffect(() => {
    if (chatHistoryLocal.length === 0 && selectedProspect) {
      const testMessages = [
        {
          _id: 'test-1',
          body: 'Mensaje de prueba - Hace 5 minutos',
          direction: 'inbound' as const,
          dateCreated: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          _id: 'test-2',
          body: 'Mensaje de prueba - Ayer',
          direction: 'outbound' as const,
          dateCreated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'test-3',
          body: 'Mensaje de prueba - Hace 3 días',
          direction: 'inbound' as const,
          dateCreated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'test-4',
          body: 'Mensaje de prueba - Hace 1 semana',
          direction: 'outbound' as const,
          dateCreated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setChatHistoryLocal(testMessages);
    }
  }, [chatHistoryLocal.length, selectedProspect]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    // Scroll inmediato cuando cambia el prospecto o se cargan mensajes
    if (chatHistoryLocal.length > 0) {
      // Pequeño delay para asegurar que el DOM se haya renderizado
      setTimeout(scrollToBottom, 100);
      setShowScrollToBottom(false); // Ocultar botón cuando se hace auto-scroll
    }
  }, [chatHistoryLocal.length, selectedProspect?._id, scrollToBottom]);

  // Detectar scroll del usuario para mostrar/ocultar botón de scroll al final
  useEffect(() => {
    const chatContainer = document.querySelector('[data-chat-container]');
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer as HTMLElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, [selectedProspect]);

  // Infinite scroll para la lista de prospectos
  useEffect(() => {
    const prospectsContainer = document.querySelector('[data-prospects-container]');
    if (!prospectsContainer) return;

    const handleProspectsScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = prospectsContainer as HTMLElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isNearBottom && hasMoreProspects && !isLoadingMoreProspects) {
        loadMoreProspects();
      }
    };

    prospectsContainer.addEventListener('scroll', handleProspectsScroll);
    return () => prospectsContainer.removeEventListener('scroll', handleProspectsScroll);
  }, [hasMoreProspects, isLoadingMoreProspects, loadMoreProspects]);

  // Handler optimizado para el input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInputValue(e.target.value);
  }, []);

  // Enviar mensaje (optimista)
  const handleSendMessageInput = useCallback(async () => {
    if (!selectedProspect || !messageInputValue.trim()) return;
    try {
      setIsSendingMessage(true);
      // Mensaje optimista
      const newMsg = {
        _id: `local-${Date.now()}`,
        body: messageInputValue.trim(),
        direction: 'outbound',
        dateCreated: new Date().toISOString(),
      };
      setChatHistoryLocal(prev => [...prev, newMsg]);
      setMessageInputValue('');
      
      // Scroll al final después de agregar el mensaje
      setTimeout(scrollToBottom, 50);
      
      await sendMessage({ phone: selectedProspect.phone, message: newMsg.body });
      // Fetch en background (no bloquea input)
      selectProspect(selectedProspect);
    } catch (err) {
      // Maneja el error si es necesario
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedProspect, messageInputValue, sendMessage, selectProspect, scrollToBottom]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageInput();
    }
  }, [handleSendMessageInput]);

  // Filtro memoizado de prospectos
  const filteredProspects = React.useMemo(() =>
    prospects.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm)),
    [prospects, searchTerm]
  );

  // Handlers para modales
  const handleSendMessage = useCallback(async () => {
    try {
      await sendMessage(messageForm);
      setSendMessageDialog(false);
      setMessageForm({ phone: '', message: '' });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [sendMessage, messageForm]);

  const handleSendTemplate = useCallback(async () => {
    try {
      await sendTemplate(templateForm);
      setSendTemplateDialog(false);
      setTemplateForm({ phone: '', templateId: '', variables: [] });
    } catch (err) {
      console.error('Error sending template:', err);
    }
  }, [sendTemplate, templateForm]);

  const handleChatClick = useCallback(async (phone: string) => {
    setSelectedChat(phone);
    await loadChatByPhone(phone);
    setChatDetailsDialog(true);
  }, [loadChatByPhone]);

  // Filtrar chats (memoizado para evitar recálculos)
  const filteredChats = React.useMemo(() => {
    return activeChats.filter(chat => {
      const matchesSearch = chat.phone.includes(searchTerm) || 
                           chat.profileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           chat.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [activeChats, searchTerm, statusFilter]);

  // MessageInput definition:
  type MessageInputProps = {
    value: string;
    setValue: Dispatch<SetStateAction<string>>;
    onSend: (msg: string) => void;
    disabled: boolean;
  };
  const MessageInput = memo(function MessageInput({ value, setValue, onSend, disabled }: MessageInputProps) {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), [setValue]);
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) onSend(value.trim());
      }
    }, [onSend, value]);
    const handleSend = useCallback(() => {
      if (value.trim()) onSend(value.trim());
    }, [onSend, value]);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe un mensaje..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{ borderRadius: 2, fontSize: 16, bgcolor: 'background.default' }}
          inputProps={{ maxLength: 1500, style: { fontSize: '16px' } }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          sx={{ minWidth: 48, minHeight: 48, borderRadius: 2, fontWeight: 700, fontSize: 18, boxShadow: 1 }}
        >
          <SendIcon />
        </Button>
      </Box>
    );
  });

  return (
    <Box sx={{ width: '90vw', height: '85vh', overflow: 'hidden', bgcolor: theme.palette.background.default, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
      {/* Header y stats */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', width: 56, height: 56 }}>
              <WhatsAppIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="primary" sx={{ letterSpacing: 1 }}>
                Quick Learning WhatsApp
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Dashboard de NatalIA - IA Conversacional
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setSendMessageDialog(true)}
              sx={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', fontWeight: 700, fontSize: 16, px: 3, borderRadius: 3, boxShadow: 2 }}
            >
              ENVIAR MENSAJE
            </Button>
{/*             <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={isLoading} sx={{ fontWeight: 700, fontSize: 16, px: 3, borderRadius: 3 }}>
              ACTUALIZAR
            </Button> */}
          </Box>
        </Box>
      </Box>

      {/* Main content: Lista de prospectos y chat */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2, px: 1, pb: 1 }}>
        {/* Lista de prospectos */}
        <Card sx={{ width: 340, minWidth: 340, maxWidth: 340, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper, ml: 0, mr: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField size="small" placeholder="Buscar prospecto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} sx={{ flex: 1, fontSize: 15, bgcolor: theme.palette.background.default, borderRadius: 2 }} inputProps={{ style: { color: theme.palette.text.primary } }} />
            <IconButton onClick={() => loadProspects()} disabled={isLoadingProspects}><RefreshIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} /></IconButton>
          </Box>
          <Box data-prospects-container sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 0.5, bgcolor: theme.palette.background.paper }}>
            {errorProspects && <Alert severity="error">{errorProspects}</Alert>}
            {isLoadingProspects ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}><CircularProgress size={28} /></Box>
            ) : prospects.length === 0 ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}><WhatsAppIcon sx={{ fontSize: 32, mb: 1, color: theme.palette.text.secondary }} /><Typography fontSize={15}>No hay prospectos</Typography></Box>
            ) : (
              <List>
                {filteredProspects.map(prospect => (
                  <ListItem key={prospect._id} button selected={selectedProspect?._id === prospect._id} onClick={() => selectProspect(prospect)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      px: 1,
                      py: 0.5,
                      minHeight: 48,
                      background: selectedProspect?._id === prospect._id ? (theme.palette.mode === 'dark' ? theme.palette.action.selected : theme.palette.action.selected) : 'transparent',
                      boxShadow: selectedProspect?._id === prospect._id ? 2 : 0,
                      transition: 'background 0.2s, box-shadow 0.2s',
                      '&:hover, &:focus': {
                        background: theme.palette.action.hover,
                        boxShadow: 2
                      }
                    }}
                  >
                    <ListItemAvatar><Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32, color: theme.palette.getContrastText(theme.palette.success.main) }}><PersonIcon fontSize="small" /></Avatar></ListItemAvatar>
                    <ListItemText
                      primary={<Typography component="span" fontWeight={700} fontSize={15} noWrap color={theme.palette.text.primary}>{prospect.name || prospect.phone}</Typography>}
                      secondary={
                        <>
                          <Typography component="div" variant="caption" color="text.secondary" fontSize={13} noWrap>{prospect.phone}</Typography>
                          {prospect.lastMessage && (
                            <>
                              <Typography component="div" variant="body2" color="text.secondary" noWrap fontSize={13} sx={{ mb: 0.5 }}>
                                {prospect.lastMessage.body}
                              </Typography>
                              {prospect.lastMessage.dateCreated && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography component="div" variant="caption" color="text.secondary" fontSize={11}>
                                    {formatCompactDate(prospect.lastMessage.dateCreated)}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          )}
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200],
                          color: theme.palette.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 60,
                          justifyContent: 'center'
                        }}
                      >
                        {prospect.linkedTable?.refModel || prospect.tableSlug}
                        {typeof prospect.aiEnabled !== 'undefined' && (
                          <Tooltip title={prospect.aiEnabled ? 'IA activada' : 'IA desactivada'}>
                            <span>
                              <AIIcon
                                sx={{
                                  ml: 1,
                                  fontSize: 18,
                                  color: prospect.aiEnabled ? theme.palette.success.main : theme.palette.grey[500],
                                  verticalAlign: 'middle'
                                }}
                              />
                            </span>
                          </Tooltip>
                        )}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
                
                {/* Indicador de carga para infinite scroll */}
                {isLoadingMoreProspects && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      Cargando más prospectos...
                    </Typography>
                  </Box>
                )}
                
                {/* Indicador de fin de lista */}
                {!hasMoreProspects && prospects.length > 0 && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay más prospectos para cargar
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Box>
        </Card>
        {/* Panel de chat */}
        <Card sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper, ml: 0, mr: 0 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
            {!selectedProspect ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8 }}><WhatsAppIcon sx={{ fontSize: 64, mb: 2 }} /><Typography variant="h6">Selecciona un prospecto para ver la conversación</Typography></Box>
            ) : (
              <>
                {selectedProspect && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}
                    onClick={() => setOpenClientInfo(true)}
                  >
                    <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.success.main, color: theme.palette.getContrastText(theme.palette.success.main), fontWeight: 700 }}>
                      <PersonIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{selectedProspect.name || selectedProspect.phone}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedProspect.phone}</Typography>
                    </Box>
                  </Box>
                )}
                {isLoadingChatHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}><CircularProgress /></Box>
                ) : errorChatHistory ? (
                  <Alert severity="error">{errorChatHistory}</Alert>
                ) : (
                  <Box 
                    data-chat-container
                    sx={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      px: 2, 
                      py: 2, 
                      minHeight: 0, 
                      bgcolor: theme.palette.background.default, 
                      borderRadius: 2,
                      position: 'relative'
                    }}
                  >
                    {chatHistoryLocal.length === 0 ? (
                      <Typography color="text.secondary">No hay mensajes</Typography>
                    ) : (
                      chatHistoryLocal.map((msg, idx) => {
                        const body = msg.body || '';
                        const mediaUrl = msg.mediaUrl || '';
                        let content = null;

                        if (body.startsWith('🖼️ El usuario compartió una imagen:') && body.includes('https://')) {
                          const url = body.replace('🖼️ El usuario compartió una imagen:', '').trim();
                          content = (
                            <img
                              src={url}
                              alt="Imagen recibida"
                              style={{ maxWidth: 200, maxHeight: 350, width: '100%', height: 'auto', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                              onClick={() => { setModalImageUrl(url); setOpenImageModal(true); }}
                              onError={e => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'}
                            />
                          );
                        } else if (body.startsWith('🎥 El usuario compartió un video:') && body.includes('https://')) {
                          const url = body.replace('🎥 El usuario compartió un video:', '').trim();
                          content = (
                            <video controls style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                              <source src={url} />
                              Tu navegador no puede reproducir el video.
                            </video>
                          );
                        } else if (body.startsWith('🎙️ Transcripción del audio:') && mediaUrl) {
                          content = (
                            <Box>
                              <audio controls style={{ width: '100%', marginBottom: 4 }}>
                                <source src={mediaUrl} />
                                Tu navegador no soporta el elemento de audio.
                              </audio>
                              <Typography variant="body2">{body}</Typography>
                            </Box>
                          );
                        } else if (body.startsWith('📍 El usuario compartió su ubicación:') && body.includes('https://')) {
                          const url = body.replace('📍 El usuario compartió su ubicación:', '').trim();
                          content = (
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: 'underline' }}>
                              Ver ubicación en el mapa
                            </a>
                          );
                        } else if (body.startsWith('Aquí tienes la información para realizar tu pago a Quick Learning')) {
                          content = (
                            <>
                              <Typography variant="body2">{body}</Typography>
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src="https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/Iztacalco.jpeg"
                                  alt="Método de pago"
                                  style={{ maxWidth: 220, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: '#fff' }}
                                />
                              </Box>
                            </>
                          );
                        } else {
                          content = <Typography variant="body1" fontSize={17}>{body}</Typography>;
                        }

                        return (
                          <Box key={msg._id || idx} sx={{ display: 'flex', flexDirection: msg.direction === 'inbound' ? 'row' : 'row-reverse', alignItems: 'flex-end', mb: 2 }}>
                            <Avatar sx={{ bgcolor: msg.direction === 'inbound' ? (theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200]) : theme.palette.success.main, width: 44, height: 44, color: theme.palette.getContrastText(msg.direction === 'inbound' ? (theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200]) : theme.palette.success.main) }}>{msg.direction === 'inbound' ? <PersonIcon fontSize="large" /> : <AIIcon fontSize="large" />}</Avatar>
                            <Box sx={{
                              maxWidth: '70%',
                              bgcolor: msg.direction === 'inbound'
                                ? (theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100])
                                : (theme.palette.mode === 'dark' ? theme.palette.success.dark : theme.palette.success.main),
                              color: theme.palette.text.primary,
                              borderRadius: msg.direction === 'inbound' ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                              p: 2,
                              mx: 2,
                              boxShadow: 2
                            }}>
                              {content}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, float: 'right' }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" fontSize={14}>
                                  {formatMessageDate(msg.dateCreated)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                    
                    {/* Botón de scroll al final */}
                    {showScrollToBottom && (
                      <IconButton
                        onClick={scrollToBottom}
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          right: 16,
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          boxShadow: 3,
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                    )}
                  </Box>
                )}
                {/* Input de mensaje */}
                {selectedProspect && (
                  <MessageInput
                    value={messageInputValue}
                    setValue={setMessageInputValue}
                    onSend={async (text) => {
                      setIsSendingMessage(true);
                      const newMsg = {
                        _id: `local-${Date.now()}`,
                        body: text,
                        direction: 'outbound',
                        dateCreated: new Date().toISOString(),
                      };
                      setChatHistoryLocal(prev => [...prev, newMsg]);
                      
                      // Scroll al final después de agregar el mensaje
                      setTimeout(scrollToBottom, 50);
                      
                      try {
                        await sendMessage({ phone: selectedProspect.phone, message: text });
                        setMessageInputValue('');
                      } finally {
                        setIsSendingMessage(false);
                      }
                    }}
                    disabled={isSendingMessage || isLoadingChatHistory}
                  />
                )}
              </>
            )}
          </Box>
        </Card>
      </Box>

      {/* Modal para enviar mensaje */}
      <Dialog
        open={sendMessageDialog}
        onClose={() => setSendMessageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enviar Mensaje de WhatsApp</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Número de Teléfono"
            placeholder="+5214521311888"
            fullWidth
            variant="outlined"
            value={messageForm.phone}
            onChange={(e) => setMessageForm(prev => ({ ...prev, phone: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Mensaje"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={messageForm.message}
            onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
            inputProps={{ maxLength: 1500 }}
            helperText={`${messageForm.message.length}/1500 caracteres`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendMessageDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            disabled={!messageForm.phone || !messageForm.message || isLoading}
            startIcon={<SendIcon />}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para errores */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Cargando...</Typography>
          </Paper>
        </Box>
      )}

      {/* Dialog para mostrar información del cliente */}
      <Dialog open={openClientInfo} onClose={() => setOpenClientInfo(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Información del Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.success.main, color: theme.palette.getContrastText(theme.palette.success.main), fontWeight: 700 }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedProspect?.name || selectedProspect?.phone}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedProspect?.phone}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2"><b>Tabla:</b> {selectedProspect?.tableSlug || 'N/A'}</Typography>
            {selectedProspect?.linkedTable?.refModel && (
              <Typography variant="body2"><b>Modelo:</b> {selectedProspect.linkedTable.refModel}</Typography>
            )}
            {/* Agrega aquí más campos si existen en selectedProspect */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClientInfo(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para mostrar la imagen en grande */}
      <Dialog open={openImageModal} onClose={() => setOpenImageModal(false)} maxWidth="md" fullWidth>
        <Box sx={{ bgcolor: "#111", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", p: 2 }}>
          <img
            src={modalImageUrl || ""}
            alt="Vista previa"
            style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            onError={e => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300'}
          />
        </Box>
        <DialogActions>
          <Button onClick={() => setOpenImageModal(false)} color="primary" variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickLearningDashboard;
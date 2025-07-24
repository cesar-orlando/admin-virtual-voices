import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  useTheme,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useQuickLearningTwilio } from '../hooks/useQuickLearningTwilio';
import api from '../api/axios';
import { fetchCompanyUsers } from '../api/servicios';
import { updateRecord } from '../api/servicios';
import { useDebounce } from '../hooks/useDebounce';
import ClientEditModal from '../components/ClientEditModal';
import { FixedSizeList as VirtualizedList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
// import TemplateModal from '../../components/Record/';

// TemplateModal local para plantillas (basado en ProspectDrawer)

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: {
    id: string;
    label: string;
    preview: string;
    variables: string[];
  }[];
  onSend: (templateId: string, preview: string) => void;
  name: string;
}

const TemplateModal = ({ open, onClose, templates, onSend, name }: TemplateModalProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7B61FF', fontWeight: 700 }}>
      Selecciona una plantilla
      <IconButton onClick={onClose} size="small">✕</IconButton>
    </DialogTitle>
    <Divider />
    <DialogContent dividers sx={{ p: 2 }}>
      {templates.map((template, index) => {
        const preview = template.preview.replace("{{1}}", name || "amigo/a");
        return (
          <Box
            key={index}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 3,
              border: '1px solid #E0E0E0',
              backgroundColor: '#F7F4FF',
              boxShadow: '0 1px 4px rgba(123, 97, 255, 0.1)',
            }}
          >
            <Typography fontWeight={600} color="#333" sx={{ mb: 1 }}>
              {template.label}
            </Typography>
            <Box
              sx={{
                bgcolor: '#fff',
                p: 2,
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap',
                border: '1px solid #DDD',
                mb: 2,
                color: '#333',
              }}
            >
              {preview}
            </Box>
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#7B61FF',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                ':hover': { backgroundColor: '#6C54E0' },
              }}
              onClick={() => onSend(template.id, preview)}
            >
              Enviar esta plantilla
            </Button>
          </Box>
        );
      })}
    </DialogContent>
  </Dialog>
);

const QuickLearningDashboard: React.FC = () => {
  console.log('QuickLearningDashboard - Component rendering');
  
  const theme = useTheme();
  const {
    isLoading,
    error,
    sendMessage,
    sendTemplate,
    clearError,
    formatPhoneNumber,
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
    unreadMessages,
    markMessageAsRead,
    socketConnected,
    typingIndicators,
  } = useQuickLearningTwilio();

  // State para modales y formularios
  const [sendMessageDialog, setSendMessageDialog] = useState(false);
  
  // State para formularios
  const [messageForm, setMessageForm] = useState<{phone: string; message: string}>({
    phone: '',
    message: ''
  });
  
  const [templateForm, setTemplateForm] = useState<{phone: string; templateId: string; variables: string[]}>({
    phone: '',
    templateId: '',
    variables: []
  });

  // State para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Estados para búsqueda global
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [messageInputValue, setMessageInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Estado local para loading del input de mensaje
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Estado local para historial mostrado - ELIMINADO: usar solo chatHistory global

  // Estado para controlar si mostrar botón de scroll al final
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 1. Agrega un estado para controlar el Dialog de info del cliente
  const [openClientInfo, setOpenClientInfo] = useState(false);

  // 1. Estados para el modal de imagen
  const [openImageModal, setOpenImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Estados para edición de prospecto
  const [editProspectData, setEditProspectData] = useState<any>(null);
  const [tableFields, setTableFields] = useState<any[]>([]);
  const [asesores, setAsesores] = useState<any[]>([]);
  const [savingProspect, setSavingProspect] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tableChanged, setTableChanged] = useState(false);
  const [reloadingTableParams, setReloadingTableParams] = useState(false);

  // 1. Agrega estados para validación y referencias de campos
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const fieldRefs = useRef<Record<string, any>>({});

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

  // Detectar mensajes nuevos para auto-scroll automático
  const lastMessageRef = useRef<any>(null);
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      const isNewMessage = lastMessage.isNewMessage || lastMessage.isOptimistic;
      
      if (isNewMessage && lastMessageRef.current !== lastMessage._id) {
        console.log('🆕 Mensaje nuevo detectado, haciendo auto-scroll automático');
        lastMessageRef.current = lastMessage._id;
        setTimeout(() => scrollToBottom(), 100);
        setShowScrollToBottom(false);
      }
    }
  }, [chatHistory, scrollToBottom]);

  // ELIMINADO: No hay sincronización - usamos únicamente chatHistory global

  // Limpiar input de mensaje solo cuando cambia selectedProspect
  useEffect(() => {
    setMessageInputValue('');
  }, [selectedProspect]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // Limpiar mensajes no leídos al desmontar el componente
  // ELIMINADO: Este useEffect estaba causando que se marcaran como leídos TODOS los números
  // cuando cambiaba unreadMessages, en lugar de solo el seleccionado

  // Mostrar notificación cuando llega un nuevo mensaje
  useEffect(() => {
    if (unreadMessages.size > 0) {
      // Encontrar el prospecto correspondiente al último mensaje no leído
      const lastUnreadEntry = Array.from(unreadMessages.entries()).pop();
      if (lastUnreadEntry) {
        const [lastUnreadPhone] = lastUnreadEntry;
        const prospect = prospects.find(p => formatPhoneNumber(p.data?.telefono || '') === lastUnreadPhone);
        if (prospect && selectedProspect?._id !== prospect._id) {
          setNewMessageNotification({
            show: true,
            phone: lastUnreadPhone,
            message: prospect.data?.ultimo_mensaje || 'Nuevo mensaje'
          });
          
          // Ocultar notificación después de 5 segundos
          setTimeout(() => {
            setNewMessageNotification((prev: any) => ({ ...prev, show: false }));
          }, 5000);
        }
      }
    }
  }, [unreadMessages, prospects, selectedProspect, formatPhoneNumber]);

  // Auto-scroll al último mensaje
  useEffect(() => {    
    console.log('🔄 useEffect chatHistory cambió:', chatHistory.length, 'mensajes');
    
    // Scroll inmediato cuando cambia el prospecto o se cargan mensajes
    if (chatHistory.length > 0) {
      console.log('🎯 ChatHistory tiene mensajes, haciendo auto-scroll');
      // Siempre hacer scroll al final cuando se carga un chat
      setTimeout(() => scrollToBottom(), 150);
      setShowScrollToBottom(false);
    }
  }, [chatHistory, selectedProspect?._id, scrollToBottom]);

  // ELIMINADO: No hay manejo local - todo se maneja en el hook global

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
    if (!prospectsContainer || isGlobalSearch) return;

    const handleProspectsScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = prospectsContainer as HTMLElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isNearBottom && hasMoreProspects && !isLoadingMoreProspects) {
        loadMoreProspects();
      }
    };

    prospectsContainer.addEventListener('scroll', handleProspectsScroll);
    return () => prospectsContainer.removeEventListener('scroll', handleProspectsScroll);
  }, [hasMoreProspects, isLoadingMoreProspects, loadMoreProspects, isGlobalSearch]);

  // Handler optimizado para el input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInputValue(e.target.value);
  }, []);

  // Estado para error de envío de mensaje
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);

  // Enviar mensaje (optimista)
  const handleSendMessageInput = useCallback(async () => {
    if (!selectedProspect || !messageInputValue.trim()) return;
    console.log("selectedProspect", selectedProspect.data.telefono);
    if (!selectedProspect.data.telefono || typeof selectedProspect.data.telefono !== 'string') {
      setSendMessageError('El número de teléfono del prospecto es inválido.');
      return;
    }
    try {
      setIsSendingMessage(true);
      setSendMessageError(null);
      await sendMessage({ phone: selectedProspect.data.telefono, message: messageInputValue });
      setMessageInputValue('');
      // Recarga el chat si es necesario
      selectProspect(selectedProspect);
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      setSendMessageError(err.message || 'Error al enviar mensaje');
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedProspect, messageInputValue, sendMessage, selectProspect]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageInput();
    }
  }, [handleSendMessageInput]);

  // Filtro memoizado de prospectos
  const filteredProspects = React.useMemo(() => {
    if (!searchTerm.trim()) return prospects;
    return prospects.filter(p =>
      p.data?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.data?.telefono?.includes(searchTerm)
    );
  }, [prospects, searchTerm]);

  // Función para búsqueda global en el backend
  const performGlobalSearch = useCallback(async (query: string) => {
    console.log('DEBUG: performGlobalSearch called with query:', query);
    
    if (!query.trim()) {
      console.log('DEBUG: Empty query, clearing search');
      setIsGlobalSearch(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setIsGlobalSearch(true);
    
    try {
      // Búsqueda local inteligente en todos los prospectos
      const searchTerm = query.toLowerCase().trim();
      
      // Buscar en múltiples campos de cada prospecto
      const localResults = prospects.filter(prospect => {
        const nombre = prospect.data?.nombre?.toLowerCase() || '';
        const telefono = prospect.data?.telefono?.toLowerCase() || '';
        const email = prospect.data?.email?.toLowerCase() || '';
        const ciudad = prospect.data?.ciudad?.toLowerCase() || '';
        const ultimo_mensaje = prospect.data?.ultimo_mensaje?.toLowerCase() || '';
        
        // Manejar asesor que puede ser objeto o string
        let asesor = '';
        if (typeof prospect.data?.asesor === 'string') {
          asesor = prospect.data.asesor.toLowerCase();
        } else if (prospect.data?.asesor && typeof prospect.data.asesor === 'object') {
          asesor = (prospect.data.asesor.nombre || prospect.data.asesor.name || prospect.data.asesor.email || '').toLowerCase();
        }
        
        const curso = prospect.data?.curso?.toLowerCase() || '';
        const campana = prospect.data?.campana?.toLowerCase() || '';
        const medio = prospect.data?.medio?.toLowerCase() || '';
        const comentario = prospect.data?.comentario?.toLowerCase() || '';
        
        // Buscar en todos los campos
        return nombre.includes(searchTerm) ||
               telefono.includes(searchTerm) ||
               email.includes(searchTerm) ||
               ciudad.includes(searchTerm) ||
               ultimo_mensaje.includes(searchTerm) ||
               asesor.includes(searchTerm) ||
               curso.includes(searchTerm) ||
               campana.includes(searchTerm) ||
               medio.includes(searchTerm) ||
               comentario.includes(searchTerm) ||
               prospect.tableSlug?.toLowerCase().includes(searchTerm);
      });
      
      console.log('DEBUG: Local search results:', localResults);
      setSearchResults(localResults);
      
      // Si no hay resultados y hay más prospectos disponibles, cargar más
      if (localResults.length === 0 && hasMoreProspects && !isLoadingMoreProspects) {
        console.log('DEBUG: No results found, loading more prospects for search');
        // Cargar más prospectos para la búsqueda
        await loadMoreProspects();
      }
      
    } catch (error) {
      console.error('DEBUG: Error en búsqueda:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [prospects, hasMoreProspects, isLoadingMoreProspects, loadMoreProspects]);

  // useEffect para búsqueda global cuando cambia el término debounced
  useEffect(() => {
    console.log('DEBUG: useEffect debouncedSearchTerm changed:', debouncedSearchTerm);
    console.log('DEBUG: isGlobalSearch current state:', isGlobalSearch);
    
    if (debouncedSearchTerm.trim()) {
      console.log('DEBUG: Calling performGlobalSearch with:', debouncedSearchTerm);
      performGlobalSearch(debouncedSearchTerm);
    } else {
      console.log('DEBUG: Clearing global search');
      setIsGlobalSearch(false);
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, performGlobalSearch]);

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




  // Cuando se abre la info del cliente, inicializa los datos editables
  const handleOpenClientInfo = async () => {
    if (selectedProspect) {
      try {
        // Buscar el prospecto actualizado en la lista
        const updatedProspect = prospects.find(p => p._id === selectedProspect._id) || selectedProspect;
        // Obtener la estructura de la tabla para renderizar campos apropiados
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tableData = await api.get(`/tables/${user.companySlug}/${updatedProspect.tableSlug}`);
        let fields = tableData.data.fields || [];
        // Si no existe el campo tableSlug, agrégalo manualmente al principio
        if (!fields.some((f: any) => f.name === 'tableSlug')) {
          fields.unshift({
            name: 'tableSlug',
            label: 'Tipo de Prospecto',
            required: true,
            type: 'string'
          });
        }
        setTableFields(fields);

        const response = await fetchCompanyUsers(user.companySlug || '')
        setAsesores(response || []);


        // Inicializar todos los campos de la tabla, aunque no existan en data
        const initialData: any = {};
        (tableData.data.fields || []).forEach((field: any) => {
          initialData[field.name] = updatedProspect.data[field.name] ?? '';
        });

        // Agregar campos adicionales que no están en la estructura de la tabla
        // pero que necesitamos mostrar en el modal
        initialData.tableSlug = updatedProspect.tableSlug || '';
        initialData.aiEnabled = updatedProspect.aiEnabled || false;
        initialData.lastMessageDate = updatedProspect.lastMessageDate || '';

        // Asegurar que los campos especiales tengan valores por defecto
        if (!initialData.asesor && updatedProspect.data.asesor) {
          initialData.asesor = updatedProspect.data.asesor;
        }

        if (!initialData.curso) {
          initialData.curso = updatedProspect.data.curso || 'virtual';
        }

        // Agregar campos específicos de Quick Learning
        initialData.campana = updatedProspect.data.campana || '';
        initialData.medio = updatedProspect.data.medio || '';
        initialData.comentario = updatedProspect.data.comentario || '';
        initialData.consecutivo = updatedProspect.data.consecutivo || '';


        setEditProspectData(initialData);
        setOpenClientInfo(true);
        setSaveSuccess(false);
        setSaveError(null);
      } catch (err) {
        console.error('Error loading table structure:', err);
        // Fallback: usar solo los datos del prospecto
        setTableFields([]);
        const updatedProspect = prospects.find(p => p._id === selectedProspect._id) || selectedProspect;
        const fallbackData = { 
          ...updatedProspect.data,
          tableSlug: updatedProspect.tableSlug || '',
          aiEnabled: updatedProspect.aiEnabled || false,
          campana: updatedProspect.data.campana || '',
          medio: updatedProspect.data.medio || '',
          comentario: updatedProspect.data.comentario || ''
        };
        setEditProspectData(fallbackData);
        setOpenClientInfo(true);
        setSaveSuccess(false);
        setSaveError(null);
        // También intenta cargar asesores en el fallback
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const asesoresData = await api.get(`/users/${user.companySlug}`);
          setAsesores(asesoresData.data.users || []);
        } catch (err2) {
          setAsesores([]);
          console.error('Error cargando asesores (fallback):', err2);
        }
      }
    }
  };



  // 3. Valida campos requeridos antes de guardar
  const handleSaveProspectValidated = async (formData?: any) => {
    if (!selectedProspect) {
      return;
    }
    
    // Usar los datos del formulario si se proporcionan, sino usar editProspectData
    const dataToProcess = formData || editProspectData;
    
    setSavingProspect(true);
    setSaveError(null);
    setMissingFields([]);
    try {
      // Validar campos requeridos
      const requiredFields = tableFields.filter((f: any) => f.required);
      const missing: string[] = [];
      requiredFields.forEach((f: any) => {
        const value = dataToProcess?.[f.name];
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)
        ) {
          missing.push(f.name);
        }
      });
      setMissingFields(missing);
      if (missing.length > 0) {
        // Crear mensaje específico con los campos que faltan
        const missingFieldLabels = missing.map(fieldName => {
          const field = tableFields.find((f: any) => f.name === fieldName);
          return field?.label || fieldName;
        });
        
        const errorMessage = missing.length === 1 
          ? `Falta el campo obligatorio: ${missingFieldLabels[0]}`
          : `Faltan los campos obligatorios: ${missingFieldLabels.join(', ')}`;
        
        setSaveError(errorMessage);
        setSavingProspect(false);
        return;
      }

      // --- TRANSFORMACIONES PARA VALIDACIÓN DEL BACKEND ---
      const dataToSave = { ...dataToProcess };
      // 1. Curso: mayúscula inicial
      if (dataToSave.curso) {
        const mapCurso: Record<string, string> = { virtual: 'Virtual', online: 'Online', presencial: 'Presencial', Virtual: 'Virtual', Online: 'Online', Presencial: 'Presencial' };
        dataToSave.curso = mapCurso[dataToSave.curso as string] || dataToSave.curso;
      }
      // 2. Asesor: string (nombre o email)
      if (dataToSave.asesor && typeof dataToSave.asesor === 'object') {
        dataToSave.asesor = dataToSave.asesor.nombre || dataToSave.asesor.name || dataToSave.asesor.email || '';
      } else if (typeof dataToSave.asesor === 'string' && dataToSave.asesor.startsWith('{')) {
        try {
          const parsed = JSON.parse(dataToSave.asesor);
          dataToSave.asesor = parsed.nombre || parsed.name || parsed.email || '';
        } catch {}
      }
      // 3. Email: si está vacío, NO lo mandes
      if (!dataToSave.email) {
        delete dataToSave.email;
      }
      // --- FIN TRANSFORMACIONES ---

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const recordId = selectedProspect._id;
      
      // El backend extrae tableSlug de data, así que lo incluimos ahí
      const updateData = { 
        data: dataToSave // Incluir tableSlug dentro de data
      };
      
      const response = await updateRecord(recordId, updateData, user);
      
      // Verificar si se cambió de tabla
      if (response?.tableChanged) {
        setTableChanged(true);
        // Actualizar el selectedProspect con la nueva tabla
        if (selectedProspect) {
          selectedProspect.tableSlug = response.table.slug;
        }
      } else {
        setTableChanged(false);
      }
      
      setSaveSuccess(true);
      setSaveError(null);
      
      // Recargar la lista de prospectos después de guardar
      await loadProspects();
      
      // Actualizar el selectedProspect con los nuevos datos
      if (selectedProspect) {
        const updatedProspect = prospects.find(p => p._id === selectedProspect._id);
        if (updatedProspect) {
          // Actualizar el prospecto sin recargar el chat (solo los datos del prospecto)
          selectProspect(updatedProspect, false);
        }
      }
      
    } catch (err) {
      setSaveError('Error al guardar la información del prospecto.');
      setSaveSuccess(false);
      console.error('Error saving prospect:', err);
    } finally {
      setSavingProspect(false);
    }
  };

  // Array de plantillas igual que en ProspectDrawer
  const templates = [
    {
      id: "HXa25e27e01d0a93a41a5871e703787526",
      label: "Seguimiento inscripción Quick Learning",
      variables: ["{{1}}"],
      preview: `Hola {{1}},\nPara continuar con tu proceso de inscripción a los cursos de inglés de Quick Learning 🏫, solo necesitamos confirmar algunos datos contigo:\nModalidad preferida (presencial, virtual u online)\nHorario que te acomode mejor 📅\nDatos de contacto (teléfono o correo) ☎️\nUna vez con esa info, te podemos apartar un lugar y enviarte los detalles completos del curso 📚.\n¿Te gustaría avanzar con eso esta semana?`,
    },
    {
      id: "HXd040e0ab8c9c7f35b5ec3fab80c0263c",
      label: "Mensaje cordial para reconectar",
      variables: ["{{1}}"],
      preview: `Hola {{1}}, hace tiempo no hablamos, ¿te gustaría continuar con la información que te compartí?`,
    },
    {
      id: "HX2c7fb2b1266957b8fad06a42ba2fa1ce",
      label: "Seguimiento inscripción",
      variables: ["{{1}}"],
      preview: `Hola {{1}}, ¿te gustaría retomar tu proceso de inscripción?`,
    },
  ];

  // Estado para el modal de plantilla
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Función para saber si han pasado más de 24 horas desde el último mensaje
  const isLastMessageOlderThan24h = (() => {
    if (!selectedProspect) return false;
    let lastDate = null;
    if (selectedProspect.lastMessageDate) {
      lastDate = new Date(selectedProspect.lastMessageDate);
    } else if (chatHistory.length > 0) {
      lastDate = new Date(chatHistory[chatHistory.length - 1].dateCreated);
    }
    if (!lastDate) return false;
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  })();

  // Estado para el modal de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Estado para notificación de nuevo mensaje
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    phone: string;
    message: string;
  }>({ show: false, phone: '', message: '' });

  // Métodos de pago igual que en ProspectDrawer
  const paymentMethods = [
    {
      id: "oxxo",
      label: "Pago OXXO, banco o transferencia",
      description: "Depósito, transferencia o pago en OXXO.",
      image: "https://realstate-virtual-voices.s3.us-east-2.amazonaws.com/Iztacalco.jpeg",
      templateId: "HX1df87ec38ef585d7051f805dec8a395b",
    },
  ];

  // Función para recargar parámetros de tabla cuando cambie tableSlug
  const reloadTableParameters = async (newTableSlug: string | {}) => {
    if (!newTableSlug || typeof newTableSlug !== 'string') return;
    
    setReloadingTableParams(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Obtener la estructura de la nueva tabla
      const tableData = await api.get(`/tables/${user.companySlug}/${newTableSlug}`);
      let newTableFields = tableData.data.fields || [];
      // Si no existe el campo tableSlug, agrégalo manualmente al principio
      if (!newTableFields.some((f: any) => f.name === 'tableSlug')) {
        newTableFields.unshift({
          name: 'tableSlug',
          label: 'Tipo de Cliente',
          required: true,
          type: 'string'
        });
      }
      setTableFields(newTableFields);

      // Crear nuevos datos con los campos de la nueva tabla
      const newData: any = {};
      newTableFields.forEach((field: any) => {
        // Mantener valores existentes si el campo existe en ambos
        newData[field.name] = editProspectData?.[field.name] ?? '';
      });

      // Mantener campos especiales que no están en la estructura de tabla
      newData.tableSlug = newTableSlug;
      newData.aiEnabled = editProspectData?.aiEnabled || false;
      newData.lastMessageDate = editProspectData?.lastMessageDate || '';

      // Asegurar que los campos especiales tengan valores por defecto
      if (!newData.asesor && editProspectData?.asesor) {
        newData.asesor = editProspectData.asesor;
      }

      if (!newData.curso) {
        newData.curso = editProspectData?.curso || 'virtual';
      }

      // Agregar campos específicos de Quick Learning
      newData.campana = editProspectData?.campana || '';
      newData.medio = editProspectData?.medio || '';
      newData.comentario = editProspectData?.comentario || '';
      newData.consecutivo = editProspectData?.consecutivo || '';

      setEditProspectData(newData);
      
      console.log('DEBUG: Parámetros recargados para tabla:', newTableSlug);
    } catch (err) {
      console.error('Error recargando parámetros de tabla:', err);
      // En caso de error, mantener los datos actuales
    } finally {
      setReloadingTableParams(false);
    }
  };

  // Tipos para los datos de la lista virtualizada
  interface ProspectListItemData {
    items: any[];
    selectedProspect: any;
    selectProspect: (prospect: any) => void;
    unreadMessages: Map<string, number>;
    formatPhoneNumber: (phone: string) => string;
    theme: any;
  }

  return (
    <Box sx={{ 
      width: '90vw', 
      height: '85vh', 
      overflow: 'hidden', 
      bgcolor: theme.palette.background.default, 
      display: 'flex', 
      flexDirection: 'column', 
      borderRadius: 2, 
      boxShadow: 3,
      '@keyframes pulse': {
        '0%': {
          opacity: 1,
          transform: 'scale(1)'
        },
        '50%': {
          opacity: 0.7,
          transform: 'scale(1.1)'
        },
        '100%': {
          opacity: 1,
          transform: 'scale(1)'
        }
      },
      '@keyframes newMessagePulse': {
        '0%': {
          opacity: 1,
          transform: 'scale(1)',
          boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)'
        },
        '50%': {
          opacity: 0.9,
          transform: 'scale(1.02)',
          boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)'
        },
        '100%': {
          opacity: 1,
          transform: 'scale(1)',
          boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
        }
      },
      '@keyframes typingDot': {
        '0%, 60%, 100%': {
          transform: 'translateY(0)',
          opacity: 0.4
        },
        '30%': {
          transform: 'translateY(-10px)',
          opacity: 1
        }
      },
      '@keyframes bumpIn': {
        '0%': {
          transform: 'translateY(-20px)',
          opacity: 0
        },
        '50%': {
          transform: 'translateY(5px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateY(0)',
          opacity: 1
        }
      }
    }}>
      {/* Header y stats */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', width: 56, height: 56 }}>
              <WhatsAppIcon fontSize="large" />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={700} color="primary" sx={{ letterSpacing: 1 }}>
                  Quick Learning WhatsApp
                </Typography>

                {/* Indicador de estado de conexión del socket */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: socketConnected ? 'success.light' : 'error.light',
                    color: socketConnected ? 'success.dark' : 'error.dark',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    opacity: 0.8
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: socketConnected ? 'success.main' : 'error.main',
                      animation: socketConnected ? 'pulse 2s infinite' : 'none'
                    }}
                  />
                  {socketConnected ? 'Conectado' : 'Desconectado'}
                </Box>
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Dashboard de NatalIA - IA Conversacional
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadProspects()} disabled={isLoadingProspects} sx={{ fontWeight: 700, fontSize: 16, px: 3, borderRadius: 3 }}>
              ACTUALIZAR
            </Button> 
          </Box>
        </Box>
      </Box>

      {/* Main content: Lista de prospectos y chat */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2, px: 1, pb: 1 }}>
        {/* Lista de prospectos */}
        <Card sx={{ width: 340, minWidth: 340, maxWidth: 340, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.background.paper, ml: 0, mr: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField 
              size="small" 
              placeholder="Buscar prospecto..." 
              value={searchTerm} 
              onChange={e => {
                setSearchTerm(e.target.value);
                if (!e.target.value.trim()) {
                  setIsGlobalSearch(false);
                  setSearchResults([]);
                }
              }}
              InputProps={{ 
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                endAdornment: isGlobalSearch && (
                  <Chip 
                    label="Búsqueda global" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mr: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )
              }} 
              sx={{ flex: 1, fontSize: 15, bgcolor: theme.palette.background.default, borderRadius: 2 }} 
              inputProps={{ style: { color: theme.palette.text.primary } }} 
            />
            <IconButton onClick={() => {
              loadProspects();
              setSearchTerm('');
              setIsGlobalSearch(false);
              setSearchResults([]);
            }} disabled={isLoadingProspects}>
              <RefreshIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
            </IconButton>
          </Box>
          <Box data-prospects-container sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 0.5, bgcolor: theme.palette.background.paper }}>
            {errorProspects && <Alert severity="error">{errorProspects}</Alert>}
            {!socketConnected && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Conectando al servidor en tiempo real...
              </Alert>
            )}
            {isLoadingProspects ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}><CircularProgress size={28} /></Box>
            ) : isSearching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Buscando...
                </Typography>
              </Box>
            ) : (isGlobalSearch ? searchResults : filteredProspects).length === 0 ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
                <WhatsAppIcon sx={{ fontSize: 32, mb: 1, color: theme.palette.text.secondary }} />
                <Typography fontSize={15}>
                  {isGlobalSearch ? 'No se encontraron prospectos' : 'No hay prospectos'}
                </Typography>
              </Box>
            ) : (
              <VirtualizedList
                height={520}
                itemCount={(isGlobalSearch ? searchResults : filteredProspects).length}
                itemSize={76}
                width={340}
                overscanCount={6}
                itemData={{
                  items: isGlobalSearch ? searchResults : filteredProspects,
                  selectedProspect,
                  selectProspect,
                  unreadMessages,
                  formatPhoneNumber,
                  theme
                } as ProspectListItemData}
                onScroll={(params: { scrollOffset: number; scrollDirection: 'forward' | 'backward' }) => {
                  const totalItems = (isGlobalSearch ? searchResults : filteredProspects).length;
                  if (!isGlobalSearch && hasMoreProspects && !isLoadingMoreProspects && params.scrollDirection === 'forward') {
                    const visibleRows = Math.ceil(520 / 76);
                    if (params.scrollOffset / 76 + visibleRows >= totalItems - 2) {
                      loadMoreProspects();
                    }
                  }
                }}
              >
                {({ index, style, data }: ListChildComponentProps<ProspectListItemData>) => {
                  const prospect = data.items[index];
                  const { selectedProspect, selectProspect, unreadMessages, formatPhoneNumber, theme } = data;
                  return (
                    <div style={style}>
                      <ListItem
                        key={prospect._id}
                        button
                        selected={selectedProspect?._id === prospect._id}
                        onClick={() => selectProspect(prospect)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          px: 1,
                          py: 1.5,
                          minHeight: 56,
                          background: selectedProspect?._id === prospect._id ? (theme.palette.mode === 'dark' ? theme.palette.action.selected : theme.palette.action.selected) : 'transparent',
                          boxShadow: selectedProspect?._id === prospect._id ? 2 : 0,
                          transition: 'background 0.2s, box-shadow 0.2s',
                          '&:hover, &:focus': {
                            background: theme.palette.action.hover,
                            boxShadow: 2
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              (() => {
                                const phone = formatPhoneNumber(prospect.data?.telefono || '');
                                const unreadCount = unreadMessages.get(phone) || 0;
                                return unreadCount > 0 ? (
                                  <Box
                                    sx={{
                                      minWidth: 20,
                                      height: 20,
                                      borderRadius: '10px',
                                      bgcolor: theme.palette.error.main,
                                      border: `2px solid ${theme.palette.background.paper}`,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: 'white'
                                    }}
                                  >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </Box>
                                ) : null;
                              })()
                            }
                          >
                            <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32, color: theme.palette.getContrastText(theme.palette.success.main) }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                component="span"
                                fontWeight={(() => {
                                  const phone = formatPhoneNumber(prospect.data?.telefono || '');
                                  const unreadCount = unreadMessages.get(phone) || 0;
                                  return unreadCount > 0 ? 800 : 700;
                                })()}
                                fontSize={15}
                                noWrap
                                color={(() => {
                                  const phone = formatPhoneNumber(prospect.data?.telefono || '');
                                  const unreadCount = unreadMessages.get(phone) || 0;
                                  return unreadCount > 0 ? theme.palette.primary.main : theme.palette.text.primary;
                                })()}
                                sx={{ 
                                  flex: 1, 
                                  textOverflow: 'ellipsis', 
                                  overflow: 'hidden', 
                                  whiteSpace: 'nowrap',
                                  ...(() => {
                                    const phone = formatPhoneNumber(prospect.data?.telefono || '');
                                    const unreadCount = unreadMessages.get(phone) || 0;
                                    return unreadCount > 0 ? {
                                      textShadow: '0 0 1px rgba(0,0,0,0.1)'
                                    } : {};
                                  })()
                                }}
                              >
                                {prospect.data?.nombre ? prospect.data.nombre.trim() : (prospect.data?.telefono || '-')}
                              </Typography>
                              {(() => {
                                const phone = formatPhoneNumber(prospect.data?.telefono || '');
                                const unreadCount = unreadMessages.get(phone) || 0;
                                return unreadCount > 0 ? (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: theme.palette.error.main,
                                      flexShrink: 0,
                                      animation: 'pulse 2s infinite'
                                    }}
                                  />
                                ) : null;
                              })()}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="div"
                                fontSize={13}
                                color="text.secondary"
                                noWrap
                                sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                              >
                                {prospect.data?.telefono || ''}
                              </Typography>
                              {prospect.data?.ultimo_mensaje && (
                                <Typography
                                  component="div"
                                  fontSize={13}
                                  color="text.secondary"
                                  noWrap
                                  sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                >
                                  {prospect.data.ultimo_mensaje}
                                </Typography>
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
                            {prospect.tableSlug}
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
                    </div>
                  );
                }}
              </VirtualizedList>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 2, marginTop: 1 }}
                                      onClick={handleOpenClientInfo}
                  
                    >
                      <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.success.main, color: theme.palette.getContrastText(theme.palette.success.main), fontWeight: 700 }}>
                        <PersonIcon fontSize="large" />
                      </Avatar>
                      <Box sx={{ marginLeft: 1, }}>
                        <Typography variant="h6" fontWeight={700}>{selectedProspect.data?.nombre ? selectedProspect.data.nombre.trim() : (selectedProspect.data?.telefono || '-')}</Typography>
                        <Typography variant="body2" color="text.secondary">{selectedProspect.data?.telefono || '-'}</Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<PaymentIcon sx={{ fontSize: 28 }} />}
                      onClick={() => setPaymentModalOpen(true)}
                      sx={{
                        background: 'linear-gradient(90deg, #7B61FF 60%, #A084FF 100%)',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '18px',
                        px: 2,
                        py: .5,
                        marginRight: 2,
                        boxShadow: '0 4px 16px 0 rgba(123,97,255,0.10)',
                        fontSize: 18,
                        letterSpacing: 0.5,
                        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                        '&:hover': {
                          background: 'linear-gradient(90deg, #A084FF 60%, #7B61FF 100%)',
                          boxShadow: '0 6px 24px 0 rgba(123,97,255,0.18)',
                          transform: 'scale(1.04)'
                        },
                        minWidth: 160,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      Enviar pago
                    </Button>
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
                    {chatHistory.length === 0 ? (
                      <Typography color="text.secondary">No hay mensajes</Typography>
                    ) : (
                      [...chatHistory]
                      .map((msg, idx) => {
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
                              boxShadow: 2,
                              position: 'relative',
                              ...(msg.isNewMessage && {
                                border: `2px solid ${theme.palette.primary.main}`,
                                animation: 'newMessagePulse 2s ease-in-out'
                              })
                            }}>
                              {content}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, float: 'right' }}>
                                {msg.isNewMessage && (
                                  <Chip
                                    label="NUEVO"
                                    size="small"
                                    color="primary"
                                    sx={{
                                      fontSize: '0.6rem',
                                      height: 16,
                                      mr: 0.5,
                                      animation: 'newMessagePulse 2s ease-in-out'
                                    }}
                                  />
                                )}
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
                    
                    {/* Indicadores de escritura */}
                    {(() => {
                      if (!selectedProspect) return null;
                      const phone = formatPhoneNumber(selectedProspect.data?.telefono || '');
                      const typingIndicator = typingIndicators.get(phone);
                      
                      if (typingIndicator) {
                        const typingText = (() => {
                          switch(typingIndicator.userType) {
                            case 'human': return 'está escribiendo...';
                            case 'bot': return 'NatalIA está escribiendo...';
                            case 'asesor': return 'Asesor está escribiendo...';
                            default: return 'está escribiendo...';
                          }
                        })();
                        
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], 
                              width: 44, 
                              height: 44, 
                              color: theme.palette.getContrastText(theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200])
                            }}>
                              <PersonIcon fontSize="large" />
                            </Avatar>
                            <Box sx={{
                              maxWidth: '70%',
                              bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100],
                              color: theme.palette.text.primary,
                              borderRadius: '18px 18px 18px 6px',
                              p: 2,
                              mx: 2,
                              boxShadow: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <Typography variant="body2" color="text.secondary">
                                {typingText}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: theme.palette.text.secondary,
                                  animation: 'typingDot 1.4s infinite ease-in-out'
                                }} />
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: theme.palette.text.secondary,
                                  animation: 'typingDot 1.4s infinite ease-in-out',
                                  animationDelay: '0.2s'
                                }} />
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: theme.palette.text.secondary,
                                  animation: 'typingDot 1.4s infinite ease-in-out',
                                  animationDelay: '0.4s'
                                }} />
                              </Box>
                            </Box>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                    
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
                {/* Input de mensaje o botón plantilla según antigüedad del último mensaje */}
                {selectedProspect && (
                  isLastMessageOlderThan24h ? (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ fontWeight: 700, fontSize: 18, borderRadius: 2, py: 1.5 }}
                        onClick={() => setTemplateModalOpen(true)}
                      >
                        Seleccionar plantilla
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Escribe un mensaje..."
                        value={messageInputValue}
                        onChange={e => setMessageInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        disabled={isSendingMessage || isLoadingChatHistory}
                        sx={{ borderRadius: 2, fontSize: 16, bgcolor: 'background.default' }}
                        inputProps={{ maxLength: 1500, style: { fontSize: '16px' } }}
                      />
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSendMessageInput}
                        disabled={isSendingMessage || isLoadingChatHistory || !messageInputValue.trim()}
                        sx={{ minWidth: 48, minHeight: 48, borderRadius: 2, fontWeight: 700, fontSize: 18, boxShadow: 1 }}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  )
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
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <CircularProgress size={24} />
            <Typography>Cargando...</Typography>
          </Box>
        </Box>
      )}

      {/* Modal profesional para editar información del cliente */}
      <ClientEditModal
        open={openClientInfo}
        onClose={() => setOpenClientInfo(false)}
        onSave={handleSaveProspectValidated}
        initialData={editProspectData}
        tableFields={tableFields}
        asesores={asesores}
        loading={false}
        saving={savingProspect}
        error={saveError}
        success={saveSuccess}
        tableChanged={tableChanged}
        reloadingTableParams={reloadingTableParams}
        onTableSlugChange={reloadTableParameters}
        missingFields={missingFields}
      />

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

      {/* Snackbar para errores de envío de mensaje */}
      <Snackbar
        open={!!sendMessageError}
        autoHideDuration={6000}
        onClose={() => setSendMessageError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSendMessageError(null)} severity="error" sx={{ width: '100%' }}>
          {sendMessageError}
        </Alert>
      </Snackbar>

      {/* Modal de plantilla */}
      <TemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        templates={templates}
        name={selectedProspect?.data?.nombre || selectedProspect?.data?.name || 'amigo/a'}
        onSend={async (templateId: string, preview: string) => {
          const phone = selectedProspect?.data?.telefono || selectedProspect?.phone;
          const nombre = selectedProspect?.data?.nombre || selectedProspect?.data?.name || 'amigo/a';
          console.log('DEBUG: Enviando plantilla', { phone, templateId, variables: [nombre] });
          if (!phone) {
            alert('No hay teléfono para enviar la plantilla');
            return;
          }
          try {
            const resp = await sendTemplate({ phone, templateId, variables: [nombre] });
            console.log('DEBUG: Respuesta de sendTemplate', resp);
            alert('Plantilla enviada correctamente');
            setTemplateModalOpen(false);
            selectProspect(selectedProspect); // recarga el chat
          } catch (error: any) {
            console.error('Error al enviar plantilla:', error);
            alert('Error al enviar plantilla: ' + (error?.message || error));
          }
        }}
      />

      {/* Modal de pago */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 26, color: '#7B61FF', textAlign: 'center', letterSpacing: 1, pb: 1 }}>
          Métodos de Pago
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#F7F4FF', borderRadius: 3 }}>
          {paymentMethods.map((method) => (
            <Box key={method.id} sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid #E0E0E0', backgroundColor: '#fff', boxShadow: '0 2px 12px 0 rgba(123,97,255,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#7B61FF', color: '#fff', boxShadow: '0 2px 8px 0 rgba(123,97,255,0.12)' }}>
                  <PaymentIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#7B61FF">{method.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{method.description}</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <img
                  src={method.image}
                  alt={method.label}
                  style={{ maxWidth: 220, borderRadius: 12, boxShadow: '0 4px 16px 0 rgba(123,97,255,0.10)', border: '1px solid #E0E0E0', background: '#fff' }}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  background: 'linear-gradient(90deg, #7B61FF 60%, #A084FF 100%)',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  ':hover': { background: 'linear-gradient(90deg, #A084FF 60%, #7B61FF 100%)', boxShadow: '0 6px 24px 0 rgba(123,97,255,0.18)', transform: 'scale(1.03)' },
                  mt: 2,
                  fontSize: 18,
                  letterSpacing: 0.5,
                  boxShadow: '0 4px 16px 0 rgba(123,97,255,0.10)'
                }}
                onClick={async () => {
                  const phone = selectedProspect?.data?.telefono || selectedProspect?.phone;
                  const nombre = selectedProspect?.data?.nombre || selectedProspect?.data?.name || 'amigo/a';
                  console.log('DEBUG: Enviando plantilla de pago', { phone, templateId: method.templateId, variables: [nombre] });
                  if (!phone) {
                    alert('No hay teléfono para enviar la plantilla de pago');
                    return;
                  }
                  try {
                    const resp = await sendTemplate({ phone, templateId: method.templateId, variables: [nombre] });
                    console.log('DEBUG: Respuesta de sendTemplate (pago)', resp);
                    alert('Plantilla de pago enviada correctamente');
                    setPaymentModalOpen(false);
                    selectProspect(selectedProspect);
                  } catch (error: any) {
                    console.error('Error al enviar método de pago:', error);
                    alert('Error al enviar plantilla de pago: ' + (error?.message || error));
                  }
                }}
              >
                Enviar {method.label}
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setPaymentModalOpen(false)} sx={{ color: '#7B61FF', fontWeight: 700, fontSize: 16 }}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Notificación de nuevo mensaje */}
      <Snackbar
        open={newMessageNotification.show}
        autoHideDuration={5000}
                  onClose={() => setNewMessageNotification((prev: any) => ({ ...prev, show: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={() => setNewMessageNotification((prev: any) => ({ ...prev, show: false }))} 
          severity="info" 
          sx={{ 
            width: '100%',
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
          icon={<MessageIcon />}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Nuevo mensaje de {newMessageNotification.phone}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {newMessageNotification.message.length > 50 
                ? `${newMessageNotification.message.substring(0, 50)}...` 
                : newMessageNotification.message
              }
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuickLearningDashboard;
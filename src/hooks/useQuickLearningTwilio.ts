import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { 
  sendTwilioMessage, 
  sendTwilioTemplate, 
  getTwilioStatus, 
  getTwilioHistory,
  toggleChatAI,
  assignChatAdvisor,
  getChatByPhone,
  updateChatCustomerInfo,
  updateChatStatus,
  getQuickLearningProspects,
  getQuickLearningChatHistory
} from '../api/servicios';
import type { 
  TwilioSendRequest, 
  TwilioTemplateRequest, 
  TwilioStatus, 
  TwilioHistoryRequest, 
  TwilioHistoryResponse,
  QuickLearningChat,
  TwilioMessage
} from '../types/quicklearning';
import api from '../api/axios';

interface UseQuickLearningTwilioReturn {
  // State
  status: TwilioStatus | null;
  history: TwilioHistoryResponse | null;
  activeChats: QuickLearningChat[];
  currentChat: QuickLearningChat | null;
  isLoading: boolean;
  error: string | null;
  
  // Prospects
  prospects: any[];
  selectedProspect: any | null;
  chatHistory: any[];
  isLoadingProspects: boolean;
  isLoadingChatHistory: boolean;
  errorProspects: string | null;
  errorChatHistory: string | null;
  
  // Paginación
  hasMoreProspects: boolean;
  isLoadingMoreProspects: boolean;
  
  // Última fecha de mensaje global
  lastMessageDate: string | null;
  
  // Socket state
  unreadMessages: Set<string>; // Set de teléfonos con mensajes no leídos
  
  // Actions
  sendMessage: (request: TwilioSendRequest) => Promise<any>;
  sendTemplate: (request: TwilioTemplateRequest) => Promise<any>;
  refreshStatus: () => Promise<void>;
  loadHistory: (params?: TwilioHistoryRequest) => Promise<void>;
  loadActiveChats: () => Promise<void>;
  loadChatByPhone: (phone: string) => Promise<void>;
  toggleAI: (phone: string, enabled: boolean) => Promise<void>;
  assignAdvisor: (phone: string, advisorId: string, advisorName: string) => Promise<void>;
  updateCustomerInfo: (phone: string, customerInfo: any) => Promise<void>;
  changeChatStatus: (phone: string, status: "active" | "inactive" | "blocked") => Promise<void>;
  clearError: () => void;
  markMessageAsRead: (phone: string) => void; // Marcar mensaje como leído
  
  // Utilities
  formatPhoneNumber: (phone: string) => string;
  getMessageStatusColor: (status: string) => string;
  getChatStatusColor: (status: string) => string;
  
  // Prospects
  loadProspects: (cursor?: string | null) => Promise<void>;
  loadMoreProspects: () => Promise<void>;
  selectProspect: (prospect: any) => Promise<void>;
}

export function useQuickLearningTwilio(): UseQuickLearningTwilioReturn {
  const [status, setStatus] = useState<TwilioStatus | null>(null);
  const [history, setHistory] = useState<TwilioHistoryResponse | null>(null);
  const [activeChats, setActiveChats] = useState<QuickLearningChat[]>([]);
  const [currentChat, setCurrentChat] = useState<QuickLearningChat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Prospects
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [errorProspects, setErrorProspects] = useState<string | null>(null);
  const [errorChatHistory, setErrorChatHistory] = useState<string | null>(null);
  
  // Paginación
  const [hasMoreProspects, setHasMoreProspects] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMoreProspects, setIsLoadingMoreProspects] = useState(false);

  // State para lastMessageDate global
  const [lastMessageDate, setLastMessageDate] = useState<string | null>(null);

  // Socket state para mensajes no leídos
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());

  // Socket instance
  const [socket, setSocket] = useState<any>(null);

  // Utilidad para formatear números de teléfono
  const formatPhoneNumber = useCallback((phone: string): string => {
    // Remover caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Si empieza con 52, es formato mexicano
    if (cleaned.startsWith('52') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    
    // Si no empieza con +, agregarlo
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  }, []);

  // Utilidad para obtener color según estado del mensaje
  const getMessageStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'sent': return '#2196F3'; // Blue
      case 'delivered': return '#4CAF50'; // Green
      case 'read': return '#8BC34A'; // Light Green
      case 'failed': return '#F44336'; // Red
      case 'pending': return '#FF9800'; // Orange
      default: return '#9E9E9E'; // Grey
    }
  }, []);

  // Utilidad para obtener color según estado del chat
  const getChatStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'active': return '#4CAF50'; // Green
      case 'inactive': return '#FF9800'; // Orange
      case 'blocked': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  }, []);

  // Enviar mensaje
  const sendMessage = useCallback(async (request: TwilioSendRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      // Validar teléfono
      if (!request.phone || typeof request.phone !== 'string') {
        setIsLoading(false);
        throw new Error('El número de teléfono es inválido o está vacío.');
      }
      const formattedRequest = {
        ...request,
        phone: formatPhoneNumber(request.phone)
      };
      console.log('Enviando mensaje a la API:', formattedRequest);
      const response = await sendTwilioMessage(formattedRequest);
      console.log('Respuesta de la API:', response);
      // Actualizar historial si está cargado
      if (history) {
        await loadHistory();
      }
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje');
      console.error('Error en sendMessage:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, history]);

  // Enviar plantilla
  const sendTemplate = useCallback(async (request: TwilioTemplateRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formattedRequest = {
        ...request,
        phone: formatPhoneNumber(request.phone)
      };
      
      const response = await sendTwilioTemplate(formattedRequest);
      
      // Actualizar historial si está cargado
      if (history) {
        await loadHistory();
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al enviar plantilla');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, history]);

  // Obtener estado del servicio
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const statusData = await getTwilioStatus();
      setStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Error al obtener estado del servicio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar historial
  const loadHistory = useCallback(async (params?: TwilioHistoryRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const historyData = await getTwilioHistory(params);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar chats activos
  const loadActiveChats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // const chats = await getActiveChats();
      // setActiveChats(chats || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar chats activos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar chat específico
  const loadChatByPhone = useCallback(async (phone: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      const chat = await getChatByPhone(formattedPhone);
      setCurrentChat(chat);
    } catch (err: any) {
      setError(err.message || 'Error al cargar chat');
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber]);

  // Toggle IA
  const toggleAI = useCallback(async (phone: string, enabled: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      await toggleChatAI(formattedPhone, enabled);
      
      // Actualizar chats activos
      await loadActiveChats();
      
      // Actualizar chat actual si es el mismo
      if (currentChat && currentChat.phone === formattedPhone) {
        await loadChatByPhone(formattedPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado de IA');
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, currentChat, loadActiveChats, loadChatByPhone]);

  // Asignar asesor
  const assignAdvisor = useCallback(async (phone: string, advisorId: string, advisorName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      await assignChatAdvisor(formattedPhone, advisorId, advisorName);
      
      // Actualizar chats activos
      await loadActiveChats();
      
      // Actualizar chat actual si es el mismo
      if (currentChat && currentChat.phone === formattedPhone) {
        await loadChatByPhone(formattedPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Error al asignar asesor');
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, currentChat, loadActiveChats, loadChatByPhone]);

  // Actualizar información del cliente
  const updateCustomerInfo = useCallback(async (phone: string, customerInfo: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      await updateChatCustomerInfo(formattedPhone, customerInfo);
      
      // Actualizar chats activos
      await loadActiveChats();
      
      // Actualizar chat actual si es el mismo
      if (currentChat && currentChat.phone === formattedPhone) {
        await loadChatByPhone(formattedPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar información del cliente');
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, currentChat, loadActiveChats, loadChatByPhone]);

  // Cambiar estado del chat
  const changeChatStatus = useCallback(async (phone: string, status: "active" | "inactive" | "blocked") => {
    try {
      setIsLoading(true);
      setError(null);
      const formattedPhone = formatPhoneNumber(phone);
      await updateChatStatus(formattedPhone, status);
      
      // Actualizar chats activos
      await loadActiveChats();
      
      // Actualizar chat actual si es el mismo
      if (currentChat && currentChat.phone === formattedPhone) {
        await loadChatByPhone(formattedPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del chat');
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber, currentChat, loadActiveChats, loadChatByPhone]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Inicializar socket
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl) {
      console.warn('VITE_SOCKET_URL no está configurado');
      return;
    }

    const socketInstance = io(socketUrl);
    
    socketInstance.on('connect', () => {
      console.log('QuickLearning - Socket connected successfully');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('QuickLearning - Socket connection error:', error);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('QuickLearning - Socket disconnected:', reason);
    });

    // Escuchar mensajes nuevos de WhatsApp
    socketInstance.on('nuevo_mensaje_whatsapp', (notificationData: any) => {
      console.log('📨 QuickLearning - Nuevo mensaje recibido:', notificationData);
      
      const { phone, message } = notificationData;
      
      // Formatear el teléfono para hacer match
      const formattedPhone = formatPhoneNumber(phone);
      
      // Agregar a mensajes no leídos si no es el chat actual
      if (selectedProspect?.data?.telefono !== formattedPhone) {
        setUnreadMessages(prev => new Set([...prev, formattedPhone]));
      }
      
      // Si es el chat actual, actualizar el historial inmediatamente (al principio)
      if (selectedProspect?.data?.telefono === formattedPhone) {
        setChatHistory(prev => [{
          _id: message.twilioSid || `temp_${Date.now()}`,
          body: message.body,
          direction: message.direction,
          respondedBy: message.respondedBy,
          messageType: message.messageType,
          dateCreated: notificationData.timestamp,
          mediaUrl: message.mediaUrl || null
        }, ...prev]);
      }
      
      // Actualizar el último mensaje en la lista de prospectos (opcional, ya que recargamos)
      setProspects(prev => prev.map(prospect => {
        const prospectPhone = formatPhoneNumber(prospect.data?.telefono || '');
        if (prospectPhone === formattedPhone) {
          return {
            ...prospect,
            data: {
              ...prospect.data,
              ultimo_mensaje: message.body,
              lastMessageDate: notificationData.timestamp
            }
          };
        }
        return prospect;
      }));

      // Recargar la lista de prospectos para reflejar el nuevo orden
      loadProspects();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [selectedProspect?.data?.telefono]);

  // Función para marcar mensaje como leído
  const markMessageAsRead = useCallback((phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    setUnreadMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(formattedPhone);
      return newSet;
    });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.allSettled([
        refreshStatus(),
        loadActiveChats()
      ]);
    };
    
    loadInitialData();
  }, []);

  // Auto-refresh cada 30 segundos (sin mostrar loading)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Refresh silencioso sin activar loading
        const statusData = await getTwilioStatus();
        setStatus(statusData);
      } catch (err) {
        // Silenciar errores del auto-refresh
        console.warn('Auto-refresh error:', err);
      }
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Cargar prospectos al inicializar
  useEffect(() => {
    console.log('useEffect: Loading prospects on mount');
    loadProspects();
  }, []);

  // Cargar lista de prospectos
  const loadProspects = useCallback(async (cursor?: string | null) => {
    if (cursor) {
      setIsLoadingMoreProspects(true);
    } else {
      setIsLoadingProspects(true);
    }
    setErrorProspects(null);
    try {
      // Obtener usuario y rol
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
      } catch (e) {
        user = null;
      }
      let role = undefined;
      let asesorId = undefined;
      if (user && user.role) {
        if (user.role === 'Asesor') {
          role = 'Asesor';
          asesorId = user.id;
          if (!asesorId) {
            setErrorProspects('No se puede cargar la lista: falta el ID del asesor.');
            setIsLoadingProspects(false);
            setIsLoadingMoreProspects(false);
            return;
          }
        } else if (
          user.role === 'Administrador' ||
          user.role === 'Gerente' ||
          user.role === 'Supervisor'
        ) {
          role = user.role;
        }
      }
      const response = await getQuickLearningProspects(cursor, 200, role, asesorId);
      
      // El backend retorna { data: { pagination, usuarios }, lastMessageDate }
      let data = response.data || response; // Fallback para compatibilidad
      let lastMsgDate = response.lastMessageDate || null;
      
      setLastMessageDate(lastMsgDate);      
      // Validación defensiva para soportar ambas respuestas
      if (!data || !data.usuarios) {
        setErrorProspects('Respuesta inesperada del servidor.');
        setIsLoadingProspects(false);
        setIsLoadingMoreProspects(false);
        return;
      }

      // Obtener la estructura de la tabla para mapear todos los campos dinámicamente
      let tableFields: any= [];
      try {
        // Intentar obtener la estructura de la tabla del primer usuario
        if (data.usuarios.length > 0 && data.usuarios[0].tableSlug) {
          const tableResponse = await api.get(`/tables/${user.companySlug}/${data.usuarios[0].tableSlug}`);
          tableFields = tableResponse.data.fields || [];
        }
      } catch (tableError) {
        console.warn('No se pudo obtener la estructura de la tabla:', tableError);
      }

      // Transformar los datos para que coincidan con la estructura esperada por el componente
      const transformedUsuarios = data.usuarios.map((usuario: any) => {
        // Crear un objeto data dinámico basado en la estructura de la tabla
        const dynamicData: any = {};
        
        // Mapear campos específicos que siempre necesitamos
        dynamicData.nombre = usuario.data.nombre || usuario.name || 'Sin nombre';
        dynamicData.telefono = usuario.data.telefono || usuario.phone;
        dynamicData.ultimo_mensaje = usuario.data.ultimo_mensaje || usuario.lastMessage?.body || 'Sin mensajes';
        
        // Mapear todos los campos de la tabla dinámicamente
        tableFields.forEach((field: any) => {
          dynamicData[field.name] = usuario.data[field.name] ?? '';
        });
        
        // Asegurar que campos específicos tengan valores por defecto si no están en la tabla
        if (!dynamicData.clasificacion) dynamicData.clasificacion = usuario.data.clasificacion || '';
        if (!dynamicData.email) dynamicData.email = usuario.data.email || '';
        if (!dynamicData.ciudad) dynamicData.ciudad = usuario.data.ciudad || '';
        if (!dynamicData.curso) dynamicData.curso = usuario.data.curso || '';
        if (!dynamicData.asesor) dynamicData.asesor = usuario.data.asesor || '';
        if (!dynamicData.campana) dynamicData.campana = usuario.data.campana || '';
        if (!dynamicData.medio) dynamicData.medio = usuario.data.medio || '';
        if (!dynamicData.comentario) dynamicData.comentario = usuario.data.comentario || '';
        if (!dynamicData.consecutivo) dynamicData.consecutivo = usuario.data.consecutivo || '';
        
        return {
          _id: usuario._id,
          data: dynamicData,
          tableSlug: usuario.tableSlug,
          aiEnabled: usuario.data.aiEnabled || false,
          createdAt: usuario.createdAt,
          updatedAt: usuario.updatedAt,
          lastMessageDate: usuario.lastMessageDate
        };
      });

      // Si tiene pagination, úsalo
      if (data.pagination) {
        if (cursor) {
          setProspects(prev => [...prev, ...transformedUsuarios]);
        } else {
          setProspects(transformedUsuarios);
        }
        setHasMoreProspects(!!data.pagination.hasMore);
        setNextCursor(data.pagination.nextCursor ?? null);
      } else {
        // Si no tiene pagination, calcula hasMore de forma defensiva
        const total = data.total ?? data.usuarios.length;
        const limit = data.limit ?? 20;
        if (cursor) {
          setProspects(prev => [...prev, ...transformedUsuarios]);
        } else {
          setProspects(transformedUsuarios);
        }
        setHasMoreProspects(data.usuarios.length >= limit && data.usuarios.length < total);
        setNextCursor(null); // No hay paginación real
      }
    } catch (err: any) {
      setErrorProspects(err.message || 'Error al cargar prospectos');
    } finally {
      if (cursor) {
        setIsLoadingMoreProspects(false);
      } else {
        setIsLoadingProspects(false);
      }
    }
  }, []);

  // Cargar más prospectos (infinite scroll)
  const loadMoreProspects = useCallback(async () => {
    if (hasMoreProspects && !isLoadingMoreProspects && nextCursor) {
      await loadProspects(nextCursor);
    }
  }, [hasMoreProspects, isLoadingMoreProspects, nextCursor]);

  // En selectProspect, usa prospect.data.telefono para obtener el historial:
  const selectProspect = useCallback(async (prospect: any) => {
    console.log('selectProspect called with:', prospect);
    setSelectedProspect(prospect);
    setIsLoadingChatHistory(true);
    setErrorChatHistory(null);
    try {
      const phone = prospect.data?.telefono || prospect.phone;
      if (!phone) throw new Error('El prospecto no tiene número de teléfono');
      console.log('Loading chat history for phone:', phone);
      const response = await getQuickLearningChatHistory(phone);
      console.log('Chat history response:', response);
      
      // Manejar la nueva estructura de respuesta { data }
      let data = response.data || response; // Fallback para compatibilidad
      console.log('Extracted chat history data:', data);
      
      setChatHistory(Array.isArray(data) ? data : []);
      
      // Marcar mensajes como leídos cuando se selecciona el prospecto
      markMessageAsRead(phone);
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      setErrorChatHistory(err.message || 'Error al cargar historial de chat');
      setChatHistory([]);
    } finally {
      setIsLoadingChatHistory(false);
    }
  }, [markMessageAsRead]);

  return {
    // State
    status,
    history,
    activeChats,
    currentChat,
    isLoading,
    error,
    
    // Prospects
    prospects,
    selectedProspect,
    chatHistory,
    isLoadingProspects,
    isLoadingChatHistory,
    errorProspects,
    errorChatHistory,
    
    // Paginación
    hasMoreProspects,
    isLoadingMoreProspects,
    
    // Última fecha de mensaje global
    lastMessageDate,
    
    // Socket state
    unreadMessages,
    
    // Actions
    sendMessage,
    sendTemplate,
    refreshStatus,
    loadHistory,
    loadActiveChats,
    loadChatByPhone,
    toggleAI,
    assignAdvisor,
    updateCustomerInfo,
    changeChatStatus,
    clearError,
    markMessageAsRead,
    
    // Utilities
    formatPhoneNumber,
    getMessageStatusColor,
    getChatStatusColor,
    
    // Prospects
    loadProspects,
    loadMoreProspects,
    selectProspect
  };
}
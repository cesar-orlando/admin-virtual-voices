import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocketIO } from './useSocketIO';
import { 
  getTwilioStatus, 
  getQuickLearningChatHistory,
  sendTwilioMessage,
  sendTwilioTemplate,
  getQuickLearningProspects
} from '../api/servicios/quickLearningTwilioServices';

// Types
interface TwilioStatus {
  connected: boolean;
  status: string;
}

interface TwilioSendRequest {
  phone: string;
  message: string;
}

interface TwilioTemplateRequest {
  phone: string;
  templateId: string;
  variables: string[];
}

interface QuickLearningChat {
  phone: string;
  profileName?: string;
  status: string;
  customerInfo?: any;
}

interface UseQuickLearningTwilioReturn {
  // State
  status: TwilioStatus | null;
  history: any | null;
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
  
  // Socket state
  unreadMessages: Map<string, number>;
  socketConnected: boolean;
  
  // Indicadores de escritura
  typingIndicators: Map<string, { userType: string; timestamp: Date }>;
  
  // Actions
  sendMessage: (request: TwilioSendRequest) => Promise<any>;
  sendTemplate: (request: TwilioTemplateRequest) => Promise<any>;
  loadHistory: (params?: any) => Promise<void>;
  clearError: () => void;
  markMessageAsRead: (phone: string) => void;
  
  // Utilities
  formatPhoneNumber: (phone: string) => string;
  getMessageStatusColor: (status: string) => string;
  
  // Prospects
  loadProspects: (cursor?: string | null) => Promise<void>;
  loadMoreProspects: () => Promise<void>;
  selectProspect: (prospect: any, forceReload?: boolean) => Promise<void>;
  
  // Testing functions
  simulateTyping: (phone: string, isTyping: boolean, userType: string) => Promise<void>;
}

export function useQuickLearningTwilio(): UseQuickLearningTwilioReturn {
  // ===== STATE DECLARATIONS =====
  const [status, setStatus] = useState<TwilioStatus | null>(null);
  const [history, setHistory] = useState<any | null>(null);
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

  // Socket state para mensajes no leídos
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(() => {
    const saved = localStorage.getItem('unreadMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed));
      } catch {
        return new Map();
      }
    }
    return new Map();
  });

  // Indicadores de escritura
  const [typingIndicators, setTypingIndicators] = useState<Map<string, { userType: string; timestamp: Date }>>(new Map());

  // Refs para auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottom = useRef(true);

  // Usar el hook de Socket.IO
  const { socket, isConnected: socketConnected, error: socketError } = useSocketIO();

  // ===== UTILITY FUNCTIONS =====
  
  const formatPhoneNumber = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('52') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    return phone;
  }, []);

  const getMessageStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'sent': return '#2196F3';
      case 'delivered': return '#4CAF50';
      case 'read': return '#8BC34A';
      case 'failed': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  }, []);

  const loadHistory = useCallback(async (params?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      // Implementación básica - puedes expandir según necesites
      setHistory({ messages: [], total: 0 });
    } catch (err: any) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== UNREAD MESSAGES MANAGEMENT =====

  const incrementUnreadCount = useCallback((phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📈 Incrementando contador para:', formattedPhone);
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(formattedPhone) || 0;
      const newCount = current + 1;
      newMap.set(formattedPhone, newCount);
      console.log('📊 Nuevo contador para', formattedPhone, ':', newCount);
      return newMap;
    });
  }, [formatPhoneNumber]);

  const markMessageAsRead = useCallback((phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    console.log('👁️ Marcando como leído:', formattedPhone);
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(formattedPhone) || 0;
      if (currentCount > 0) {
        newMap.delete(formattedPhone);
        console.log('✅ Contador eliminado para:', formattedPhone);
      } else {
        console.log('ℹ️ No había mensajes no leídos para:', formattedPhone);
      }
      return newMap;
    });
  }, [formatPhoneNumber]);

  // ===== AUTO-SCROLL FUNCTIONS =====

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // ===== API FUNCTIONS =====

  const sendMessage = useCallback(async (request: TwilioSendRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje');
      console.error('Error en sendMessage:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber]);

  const sendTemplate = useCallback(async (request: TwilioTemplateRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formattedRequest = {
        ...request,
        phone: formatPhoneNumber(request.phone)
      };
      
      const response = await sendTwilioTemplate(formattedRequest);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al enviar plantilla');
      console.error('Error en sendTemplate:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formatPhoneNumber]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== PROSPECTS FUNCTIONS =====

  const loadProspects = useCallback(async (cursor?: string | null) => {
    const isInitialLoad = !cursor;
    try {
      if (isInitialLoad) setIsLoadingProspects(true);
      setErrorProspects(null);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let asesorId = undefined;
      if (user.role === 'Asesor') {
        asesorId = user._id || user.id;
      }
      // Cargar 100 registros por petición (requerimiento del usuario)
      const limit = 100;
      const response = await getQuickLearningProspects(cursor || null, limit, user.role, asesorId);

      // Soportar múltiples formatos de respuesta del backend
      // Puede venir como { usuarios, pagination } o como { data: { usuarios, pagination } }
      const container: any =
        (response && typeof response === 'object' && 'data' in response && response.data)
          ? response.data
          : response;

      const usuarios: any[] = Array.isArray(container?.usuarios) ? container.usuarios : [];
      const pagination: any = container?.pagination || response?.pagination || null;

      if (cursor) {
        // Cargar más prospectos
        setProspects(prev => [...prev, ...usuarios]);
      } else {
        // Cargar prospectos iniciales
        setProspects(usuarios);
      }

      setHasMoreProspects(Boolean(pagination?.hasMore));
      setNextCursor(pagination?.nextCursor ?? null);
    } catch (err: any) {
      console.error('Error loading prospects:', err);
      setErrorProspects(err.message || 'Error al cargar prospectos');
    } finally {
      if (isInitialLoad) setIsLoadingProspects(false);
    }
  }, []);

  const loadMoreProspects = useCallback(async () => {
    if (hasMoreProspects && !isLoadingMoreProspects && nextCursor) {
      setIsLoadingMoreProspects(true);
      try {
        await loadProspects(nextCursor);
      } finally {
        setIsLoadingMoreProspects(false);
      }
    }
  }, [hasMoreProspects, isLoadingMoreProspects, nextCursor, loadProspects]);

  const selectProspect = useCallback(async (prospect: any, forceReload: boolean = true) => {
    setSelectedProspect(prospect);
    
    if (forceReload) {
      setIsLoadingChatHistory(true);
      setErrorChatHistory(null);
      try {
        const phone = prospect.data?.telefono || prospect.phone;
        if (!phone) throw new Error('El prospecto no tiene número de teléfono');
        const formattedPhone = formatPhoneNumber(phone);
        
        const response = await getQuickLearningChatHistory(phone);
        
        let data = response.data || response;
        
        // Extraer los mensajes del objeto de respuesta
        const messages = data.messages || data;
        
        const cleanedData = Array.isArray(messages) ? messages.map(msg => ({
          ...msg,
          isNewMessage: false
        })) : [];
        
        setChatHistory(cleanedData);
        
        const unreadCount = unreadMessages.get(formattedPhone) || 0;
        if (unreadCount > 0) {
          markMessageAsRead(phone);
        }
      } catch (err: any) {
        console.error('Error loading chat history:', err);
        setErrorChatHistory(err.message || 'Error al cargar historial del chat');
      } finally {
        setIsLoadingChatHistory(false);
      }
    }
  }, [markMessageAsRead, unreadMessages, formatPhoneNumber]);

  const simulateTyping = useCallback(async (phone: string, isTyping: boolean, userType: string) => {
    try {
      const response = await fetch('/api/quicklearning/twilio/simulate-typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, isTyping, userType })
      });
      
      const data = await response.json();
      console.log('Simulación de escritura:', data);
    } catch (error) {
      console.error('Error en simulación de escritura:', error);
    }
  }, []);

  // ===== EFFECTS =====

  // Guardar unreadMessages en localStorage
  useEffect(() => {
    const unreadObj = Object.fromEntries(unreadMessages);
    localStorage.setItem('unreadMessages', JSON.stringify(unreadObj));
    console.log('💾 Guardando unreadMessages en localStorage:', unreadObj);
  }, [unreadMessages]);

  // Solicitar permisos de notificación
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 QuickLearning - Configurando listeners de socket...');

    socket.on('nuevo_mensaje_whatsapp', async (notificationData: any) => {
      console.log('📨 QuickLearning - Nuevo mensaje recibido:', notificationData);
      
      try {
        const { phone, message, chat, metadata } = notificationData;
        
        console.log('🔍 Datos extraídos:', { phone, message, chat, metadata });
        
        const formattedPhone = formatPhoneNumber(phone);
        console.log('📱 Teléfono formateado:', formattedPhone);
        
        // Incrementar contador de mensajes no leídos
        incrementUnreadCount(formattedPhone);
        console.log('📊 Contador incrementado para:', formattedPhone);
        
        // Si es el chat actualmente seleccionado, recargar desde el backend
        const selectedPhone = selectedProspect?.data?.telefono;
        const formattedSelectedPhone = selectedPhone ? formatPhoneNumber(selectedPhone) : null;
        
        if (formattedSelectedPhone === formattedPhone) {
          console.log('🎯 Chat actual seleccionado, recargando desde backend');
          // Recargar el chat completo desde el backend
          const response = await getQuickLearningChatHistory(phone);
          let data = response.data || response;
          const messages = data.messages || data;
          const cleanedData = Array.isArray(messages) ? messages.map(msg => ({
            ...msg,
            isNewMessage: false
          })) : [];
          setChatHistory(cleanedData);
        }
        
        // Actualizar el último mensaje en la lista de prospectos
        console.log('📝 Actualizando lista de prospectos');
        setProspects(prev => {
          // Actualiza el prospecto afectado y lo sube arriba
          const updated = prev.map(prospect => {
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
          });
          // Encuentra el prospecto actualizado
          const moved = updated.find(p => formatPhoneNumber(p.data?.telefono || '') === formattedPhone);
          const rest = updated.filter(p => formatPhoneNumber(p.data?.telefono || '') !== formattedPhone);
          // Si lo encontró, lo sube arriba
          return moved ? [moved, ...rest] : updated;
        });
        // Quitar la recarga completa de loadProspects();
        // loadProspects(); // <-- Eliminar esta línea para evitar recarga global
        
        console.log('✅ Procesamiento del mensaje completado');
      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
      }
    });

    socket.on('escribiendo_whatsapp', (data: any) => {
      console.log('✍️ QuickLearning - Indicador de escritura:', data);
      
      const { phone, isTyping, userType } = data;
      
      if (isTyping) {
        setTypingIndicators(prev => new Map(prev).set(formatPhoneNumber(phone), {
          userType,
          timestamp: new Date()
        }));
      } else {
        setTypingIndicators(prev => {
          const newMap = new Map(prev);
          newMap.delete(formatPhoneNumber(phone));
          return newMap;
        });
      }
    });

    return () => {
      socket.off('nuevo_mensaje_whatsapp');
      socket.off('escribiendo_whatsapp');
    };
  }, [socket, formatPhoneNumber, incrementUnreadCount, selectedProspect, loadProspects]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const statusData = await getTwilioStatus();
        setStatus(statusData as any);
      } catch (err) {
        console.warn('Error loading initial status:', err);
      }
    };
    
    loadInitialData();
  }, []);

  // Cargar prospectos al inicializar
  useEffect(() => {
    console.log('useEffect: Loading prospects on mount');
    loadProspects();
  }, [loadProspects]);

  // ===== RETURN =====

  return {
    // State
    status,
    history,
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
    
    // Socket state
    unreadMessages,
    socketConnected,
    
    // Indicadores de escritura
    typingIndicators,
    
    // Actions
    sendMessage,
    sendTemplate,
    loadHistory,
    clearError,
    markMessageAsRead,
    
    // Utilities
    formatPhoneNumber,
    getMessageStatusColor,
    
    // Prospects
    loadProspects,
    loadMoreProspects,
    selectProspect,
    
    // Testing functions
    simulateTyping,
  };
}
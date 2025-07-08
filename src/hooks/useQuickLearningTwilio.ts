import { useState, useEffect, useCallback } from 'react';
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
  console.log('useQuickLearningTwilio - Hook initialized')
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
      
      const formattedRequest = {
        ...request,
        phone: formatPhoneNumber(request.phone)
      };
      
      const response = await sendTwilioMessage(formattedRequest);
      
      // Actualizar historial si está cargado
      if (history) {
        await loadHistory();
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje');
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
      const data = await getQuickLearningProspects(cursor);
      // Validación defensiva para soportar ambas respuestas
      if (!data || !data.usuarios) {
        setErrorProspects('Respuesta inesperada del servidor.');
        setIsLoadingProspects(false);
        setIsLoadingMoreProspects(false);
        return;
      }
      // Si tiene pagination, úsalo
      if (data.pagination) {
        if (cursor) {
          setProspects(prev => [...prev, ...data.usuarios]);
        } else {
          setProspects(data.usuarios);
        }
        setHasMoreProspects(!!data.pagination.hasMore);
        setNextCursor(data.pagination.nextCursor ?? null);
      } else {
        // Si no tiene pagination, calcula hasMore de forma defensiva
        const total = data.total ?? data.usuarios.length;
        const limit = data.limit ?? 20;
        if (cursor) {
          setProspects(prev => [...prev, ...data.usuarios]);
        } else {
          setProspects(data.usuarios);
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
  }, [hasMoreProspects, isLoadingMoreProspects, nextCursor, loadProspects]);

  // Seleccionar prospecto y cargar historial
  const selectProspect = useCallback(async (prospect: any) => {
    setSelectedProspect(prospect);
    setIsLoadingChatHistory(true);
    setErrorChatHistory(null);
    try {
      const data = await getQuickLearningChatHistory(prospect.phone);
      setChatHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorChatHistory(err.message || 'Error al cargar historial de chat');
      setChatHistory([]);
    } finally {
      setIsLoadingChatHistory(false);
    }
  }, []);

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
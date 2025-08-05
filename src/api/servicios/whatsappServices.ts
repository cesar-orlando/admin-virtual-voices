import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, WhatsAppSession } from "../../types";

export const fetchSessions = async (user: UserProfile) => {
  try {
    console.log('🔍 [WhatsApp Service] Intentando obtener sesiones con prioridad del usuario:', {
      userEndpoint: `/sessions/whatsapp/${user.companySlug}/${user.id}`,
      companyEndpoint: `/sessions/whatsapp/${user.companySlug}`,
      user: { id: user.id, companySlug: user.companySlug, role: user.role }
    });
    
    // PRIORIDAD 1: Intentar obtener sesiones específicas del usuario primero
    try {
      const userResponse = await api.get(`/sessions/whatsapp/${user.companySlug}/${user.id}`);
      
      console.log('📡 [WhatsApp Service] Respuesta de sesiones del usuario:', {
        status: userResponse.status,
        data: userResponse.data,
        isArray: Array.isArray(userResponse.data),
        length: userResponse.data?.length
      });
      
      if (userResponse.data && Array.isArray(userResponse.data) && userResponse.data.length > 0) {
        console.log('✅ Usando sesiones específicas del usuario (PRIORIDAD 1)');
        return userResponse.data;
      }
    } catch (userError) {
      console.log('⚠️ No se pudieron obtener sesiones del usuario, continuando con sesiones de compañía...');
    }
    
    // PRIORIDAD 2: Si el usuario no tiene sesiones, obtener todas las sesiones de la compañía (admin)
    console.log('🔍 Buscando sesiones de la compañía/admin...');
    const companyResponse = await api.get(`/sessions/whatsapp/${user.companySlug}`);
    
    console.log('📡 [WhatsApp Service] Respuesta de sesiones de compañía/admin:', {
      status: companyResponse.status,
      data: companyResponse.data,
      isArray: Array.isArray(companyResponse.data),
      length: companyResponse.data?.length
    });
    
    // Si hay sesiones de compañía disponibles, devolverlas
    if (companyResponse.data && Array.isArray(companyResponse.data) && companyResponse.data.length > 0) {
      console.log('✅ Usando sesiones de la compañía/admin (PRIORIDAD 2)');
      return companyResponse.data;
    }
    
    // Si no hay sesiones disponibles, devolver array vacío
    console.log('⚠️ No hay sesiones disponibles - devolviendo array vacío');
    return [];
    
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en fetchSessions:', {
      error: error instanceof Error ? error.message : error,
      user: { id: user.id, companySlug: user.companySlug }
    });
    
    // En caso de error, devolver array vacío
    console.log('❌ Error obteniendo sesiones - devolviendo array vacío');
    return [];
  }
};

// Función para obtener la sesión específica de una conversación asignada
export const getConversationSession = async (user: UserProfile, conversationPhone: string, conversationSessionId?: string) => {
  try {
    console.log('🔍 [WhatsApp Service] Obteniendo sesión específica para conversación asignada:', {
      conversationPhone,
      conversationSessionId,
      user: { id: user.id, companySlug: user.companySlug, role: user.role }
    });
    
    // Si la conversación tiene un sessionId específico, intentar usarlo
    if (conversationSessionId) {
      try {
        // Obtener todas las sesiones disponibles
        const allSessions = await fetchSessions(user);
        
        // Buscar la sesión específica de la conversación
        const conversationSession = allSessions.find(session => 
          session._id === conversationSessionId || session.id === conversationSessionId
        );
        
        if (conversationSession) {
          console.log('✅ Usando sesión específica de la conversación asignada:', {
            sessionId: conversationSession._id || conversationSession.id,
            sessionName: conversationSession.sessionName
          });
          return conversationSession;
        }
      } catch (error) {
        console.log('⚠️ No se pudo obtener la sesión específica de la conversación, usando sesiones por defecto');
      }
    }
    
    // Fallback: usar las sesiones normales del usuario/compañía
    console.log('🔄 Usando sesiones por defecto del usuario/compañía');
    const defaultSessions = await fetchSessions(user);
    return defaultSessions[0]; // Devolver la primera sesión disponible
    
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en getConversationSession:', {
      error: error instanceof Error ? error.message : error,
      conversationPhone,
      conversationSessionId
    });
    
    // En caso de error, usar sesiones por defecto
    const defaultSessions = await fetchSessions(user);
    return defaultSessions[0];
  }
};

export const requestNewQr = async (sessionName: string, user: UserProfile) => {
  try {
    const response = await api.post('/sessions/whatsapp/', {
      sessionName,
      c_name: user.companySlug,
      user_id: user.id,
      user_name: user.name,
    });
    return response.data;
  } catch (error) {
    handleError(error as Error);
    throw new Error('No se pudo solicitar un nuevo QR');
  }
};

export const updateSession = async (update: Partial<WhatsAppSession>, user: UserProfile) => {
  try {
    const response = await api.put(`/sessions/whatsapp/${user.companySlug}`, update);
    return response.data;
  } catch (error) {
    handleError(error as Error);
    throw new Error('No se pudo actualizar la configuración de la sesión');
  }
};

export const deleteSession = async (sessionId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/sessions/whatsapp/${user.companySlug}/${sessionId}`);
    return response.data;
  } catch (error) {
    handleError(error as Error);
    throw new Error('No se pudo eliminar la sesión');
  }
};

// Función específica para obtener chats filtrados según asignaciones
export const fetchFilteredChats = async (user: UserProfile, showAll: boolean = false) => {
  try {
    // Construir parámetros de consulta
    const params = new URLSearchParams({
      userId: user.id,
      userRole: user.role || 'Asesor'
    });
    
    // Solo agregar showAll si es true
    if (showAll) {
      params.append('showAll', 'true');
    }
    
    const endpoint = `/whatsapp/chats-filtered/${user.companySlug}?${params.toString()}`;
    
    console.log('🔍 [WhatsApp Service] Obteniendo chats filtrados:', {
      endpoint,
      fullURL: `${api.defaults.baseURL}${endpoint}`,
      user: { id: user.id, companySlug: user.companySlug, role: user.role },
      showAll,
      params: Object.fromEntries(params)
    });

    const response = await api.get(endpoint);
    
    console.log('📊 [WhatsApp Service] Chats filtrados obtenidos:', {
      status: response.status,
      success: response.data?.success,
      chatsCount: response.data?.data?.length || 0,
      summary: response.data?.summary,
      data: response.data
    });
    
    return response.data?.data || [];
  } catch (error: unknown) {
    const axiosError = error as { 
      message?: string;
      response?: { 
        status?: number; 
        statusText?: string; 
        data?: unknown; 
      };
      config?: { url?: string };
    };
    
    console.error('💥 [WhatsApp Service] Error en fetchFilteredChats:', {
      message: axiosError?.message,
      status: axiosError?.response?.status,
      statusText: axiosError?.response?.statusText,
      responseData: axiosError?.response?.data,
      url: axiosError?.config?.url,
      user: { id: user.id, companySlug: user.companySlug, role: user.role }
    });
    
    // En caso de error, usar el endpoint de usuarios como fallback
    console.log('🔄 Intentando fallback con fetchWhatsAppUsers...');
    try {
      const fallbackUsers = await fetchWhatsAppUsers(user);
      console.log('✅ Fallback exitoso:', { usersCount: fallbackUsers.length });
      return fallbackUsers;
    } catch (fallbackError) {
      console.error('💥 Error en fallback:', fallbackError);
      console.log('❌ Error obteniendo chats filtrados - devolviendo array vacío');
      return [];
    }
  }
};

// Nueva función para obtener usuarios de WhatsApp
export const fetchWhatsAppUsers = async (user: UserProfile, tableSlugs: string[] = ['prospectos', 'clientes', 'nuevo_ingreso']) => {
  try {
    console.log('🔍 [WhatsApp Service] Intentando obtener usuarios con prioridad del usuario:', {
      userEndpoint: `/whatsapp/usuarios/${user.companySlug}/${user.id}?tableSlugs=${tableSlugs.join(',')}`,
      companyEndpoint: `/whatsapp/usuarios/${user.companySlug}?tableSlugs=${tableSlugs.join(',')}`,
      user: { id: user.id, companySlug: user.companySlug, role: user.role }
    });
    
    // PRIORIDAD 1: Intentar obtener conversaciones específicas del usuario primero
    try {
      const userResponse = await api.get(`/whatsapp/usuarios/${user.companySlug}/${user.id}?tableSlugs=${tableSlugs.join(',')}`);
      
      console.log('📡 [WhatsApp Service] Respuesta de usuarios del usuario:', {
        status: userResponse.status,
        data: userResponse.data,
        usuarios: userResponse.data.usuarios,
        isArray: Array.isArray(userResponse.data.usuarios),
        length: userResponse.data.usuarios?.length
      });
      
      if (userResponse.data.usuarios && Array.isArray(userResponse.data.usuarios) && userResponse.data.usuarios.length > 0) {
        console.log('✅ Usando conversaciones específicas del usuario (PRIORIDAD 1)');
        return userResponse.data.usuarios;
      }
    } catch (userError) {
      console.log('⚠️ No se pudieron obtener conversaciones del usuario, continuando con conversaciones de compañía...');
    }
    
    // PRIORIDAD 2: Si el usuario no tiene conversaciones, obtener todas las conversaciones de la compañía
    console.log('🔍 Buscando conversaciones de la compañía...');
    const companyResponse = await api.get(`/whatsapp/usuarios/${user.companySlug}?tableSlugs=${tableSlugs.join(',')}`);
    
    console.log('📡 [WhatsApp Service] Respuesta de usuarios de compañía:', {
      status: companyResponse.status,
      data: companyResponse.data,
      usuarios: companyResponse.data.usuarios,
      isArray: Array.isArray(companyResponse.data.usuarios),
      length: companyResponse.data.usuarios?.length
    });
    
    // Si hay usuarios de compañía disponibles, devolverlos
    if (companyResponse.data.usuarios && Array.isArray(companyResponse.data.usuarios) && companyResponse.data.usuarios.length > 0) {
      console.log('✅ Usando conversaciones de la compañía (PRIORIDAD 2)');
      return companyResponse.data.usuarios;
    }
    
    // Si no hay conversaciones disponibles, devolver array vacío
    console.log('⚠️ No hay conversaciones disponibles - devolviendo array vacío');
    return [];
    
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en fetchWhatsAppUsers:', {
      error: error instanceof Error ? error.message : error,
      user: { id: user.id, companySlug: user.companySlug }
    });
    
    // En caso de error, devolver array vacío
    console.log('❌ Error obteniendo usuarios - devolviendo array vacío');
    return [];
  }
};

// Función para obtener mensajes de un usuario específico
export const fetchUserMessages = async (user: UserProfile, sessionId: string, phone: string) => {
  try {
    console.log('📬 [WhatsApp Service] Cargando mensajes:', {
      endpoint: `/whatsapp/messages/${user.companySlug}/${sessionId}/${phone}`,
      sessionId,
      phone,
      user: { id: user.id, companySlug: user.companySlug }
    });

    const response = await api.get(`/whatsapp/messages/${user.companySlug}/${sessionId}/${phone}`);
    
    console.log('📩 [WhatsApp Service] Mensajes obtenidos:', {
      status: response.status,
      messagesCount: response.data?.messages?.length || 0,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en fetchUserMessages:', {
      error: error instanceof Error ? error.message : error,
      sessionId,
      phone,
      user: { id: user.id, companySlug: user.companySlug }
    });
    
    handleError(error as Error);
    throw new Error('No se pudieron obtener mensajes del usuario');
  }
};

// Función legacy para compatibilidad (mantener por si acaso)
export const fetchMessages = async (user: UserProfile) => {
  try {
    const response = await api.get(`/whatsapp/messages/${user.companySlug}`);
    return response.data;
  } catch (error) {
    handleError(error as Error);
    throw new Error('No se pudieron obtener mensajes');
  }
};

export const sendMessages = async (sessionId: string, user: UserProfile, phone: string, message: string) => {
  try {
    const response = await api.post(`/whatsapp/session/${user.companySlug}/${sessionId}`, {
      phone,
      message,
    });
    return response.data;
  } catch (error) {
    handleError(error as Error);
    throw new Error('No se pudo mandar el mensaje');
  }
};

// Función para asignar chat a asesor
export const assignChatToAdvisor = async (user: UserProfile, params: {
  sessionId: string;
  number: string;
  advisorId?: string | null;
  isVisibleToAll?: boolean;
}) => {
  try {
    const endpoint = `/whatsapp/assign-chat/${user.companySlug}`;
    const requestData = {
      data: {
        sessionId: params.sessionId,
        number: params.number,
        advisorId: params.advisorId,
        isVisibleToAll: params.isVisibleToAll || false
      }
    };
    
    console.log('🚀 [WhatsApp Service] Enviando request:', {
      endpoint,
      method: 'PUT',
      requestData,
      user: { id: user.id, companySlug: user.companySlug }
    });

    const response = await api.put(endpoint, requestData);
    
    console.log('📝 [WhatsApp Service] Respuesta recibida:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en assignChatToAdvisor:', {
      error: error instanceof Error ? error.message : error,
      params,
      user: { id: user.id, companySlug: user.companySlug }
    });
    
    handleError(error as Error);
    throw new Error('Error al asignar chat');
  }
};

// Función para obtener asesores disponibles
export const getAvailableAdvisors = async (user: UserProfile) => {
  try {
    const endpoint = `/whatsapp/advisors/${user.companySlug}`;
    
    console.log('👥 [WhatsApp Service] Obteniendo asesores:', {
      endpoint,
      user: { id: user.id, companySlug: user.companySlug }
    });

    const response = await api.get(endpoint);
    
    console.log('📋 [WhatsApp Service] Asesores obtenidos:', {
      status: response.status,
      data: response.data,
      advisorsCount: response.data?.data?.length || 0
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en getAvailableAdvisors:', {
      error: error instanceof Error ? error.message : error,
      user: { id: user.id, companySlug: user.companySlug }
    });
    handleError(error as Error);
    throw new Error('Error al obtener asesores');
  }
};

// Función para obtener las asignaciones de chats existentes
export const getChatAssignments = async (user: UserProfile) => {
  try {
    const endpoint = `/whatsapp/chat-assignments/${user.companySlug}`;
    
    console.log('🗂️ [WhatsApp Service] Obteniendo asignaciones de chats:', {
      endpoint,
      user: { id: user.id, companySlug: user.companySlug }
    });

    const response = await api.get(endpoint);
    
    console.log('📊 [WhatsApp Service] Asignaciones obtenidas:', {
      status: response.status,
      data: response.data,
      assignmentsCount: response.data?.data?.length || 0
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('💥 [WhatsApp Service] Error en getChatAssignments:', {
      error: error instanceof Error ? error.message : error,
      user: { id: user.id, companySlug: user.companySlug }
    });
    
    // En caso de error, devolver array vacío
    console.log('❌ Error obteniendo asignaciones - devolviendo array vacío');
    return [];
  }
};
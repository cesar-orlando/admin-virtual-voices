import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { 
  TwilioSendRequest, 
  TwilioTemplateRequest, 
  TwilioStatus, 
  TwilioHistoryRequest, 
  TwilioHistoryResponse,
  QuickLearningDashboardStats,
  TwilioError 
} from "../../types/quicklearning";

/**
 * Enviar mensaje de WhatsApp via Twilio
 * @param request - Datos del mensaje a enviar
 * @returns Response con el resultado del envío
 */
export const sendTwilioMessage = async (request: TwilioSendRequest) => {
  try {
    const response = await api.post('/quicklearning/twilio/send', request);
    return response.data;
  } catch (error: any) {
    const twilioError: TwilioError = new Error(
      error.response?.data?.message || 'Error al enviar mensaje de WhatsApp'
    );
    twilioError.code = error.response?.data?.code;
    twilioError.status = error.response?.status;
    twilioError.moreInfo = error.response?.data?.moreInfo;
    
    handleError(twilioError);
    throw twilioError;
  }
};

/**
 * Enviar plantilla de WhatsApp via Twilio
 * @param request - Datos de la plantilla a enviar
 * @returns Response con el resultado del envío
 */
export const sendTwilioTemplate = async (request: TwilioTemplateRequest) => {
  try {
    const response = await api.post('/quicklearning/twilio/send-template', request);
    return response.data;
  } catch (error: any) {
    const twilioError: TwilioError = new Error(
      error.response?.data?.message || 'Error al enviar plantilla de WhatsApp'
    );
    twilioError.code = error.response?.data?.code;
    twilioError.status = error.response?.status;
    twilioError.moreInfo = error.response?.data?.moreInfo;
    
    handleError(twilioError);
    throw twilioError;
  }
};

/**
 * Obtener el estado del servicio de Twilio
 * @returns Estado actual del servicio
 */
export const getTwilioStatus = async (): Promise<TwilioStatus> => {
  try {
    const response = await api.get('/quicklearning/twilio/status');
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al obtener el estado del servicio de Twilio');
  }
};

/**
 * Obtener historial de mensajes de WhatsApp
 * @param params - Parámetros de filtrado
 * @returns Historial de mensajes
 */
export const getTwilioHistory = async (params?: TwilioHistoryRequest): Promise<TwilioHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.phone) queryParams.append('phone', params.phone);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `/quicklearning/twilio/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al obtener el historial de mensajes');
  }
};

/**
 * Habilitar/deshabilitar IA para un chat específico
 * @param phone - Número de teléfono del chat
 * @param enabled - Si la IA debe estar habilitada
 * @returns Resultado de la operación
 */
export const toggleChatAI = async (phone: string, enabled: boolean) => {
  try {
    const response = await api.put(`/quicklearning/chat/${phone}/ai`, {
      aiEnabled: enabled
    });
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al cambiar el estado de la IA del chat');
  }
};

/**
 * Asignar asesor a un chat
 * @param phone - Número de teléfono del chat
 * @param advisorId - ID del asesor
 * @param advisorName - Nombre del asesor
 * @returns Resultado de la operación
 */
export const assignChatAdvisor = async (phone: string, advisorId: string, advisorName: string) => {
  try {
    const response = await api.put(`/quicklearning/chat/${phone}/advisor`, {
      advisor: {
        id: advisorId,
        name: advisorName
      }
    });
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al asignar el asesor al chat');
  }
};

/**
 * Obtener chat específico por número de teléfono
 * @param phone - Número de teléfono
 * @returns Datos del chat
 */
export const getChatByPhone = async (phone: string) => {
  try {
    const response = await api.get(`/quicklearning/chat/${phone}`);
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al obtener el chat');
  }
};

/**
 * Actualizar información del cliente en un chat
 * @param phone - Número de teléfono
 * @param customerInfo - Información del cliente
 * @returns Resultado de la operación
 */
export const updateChatCustomerInfo = async (phone: string, customerInfo: any) => {
  try {
    const response = await api.put(`/quicklearning/chat/${phone}/customer`, {
      customerInfo
    });
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al actualizar la información del cliente');
  }
};

/**
 * Cambiar estado de un chat
 * @param phone - Número de teléfono
 * @param status - Nuevo estado del chat
 * @returns Resultado de la operación
 */
export const updateChatStatus = async (phone: string, status: "active" | "inactive" | "blocked") => {
  try {
    const response = await api.put(`/quicklearning/chat/${phone}/status`, {
      status
    });
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al actualizar el estado del chat');
  }
};

/**
 * Obtener lista de prospectos/clientes con su último mensaje
 * @param cursor - Cursor para paginación
 * @param limit - Límite de resultados por página
 * @param role - Rol del usuario (Administrador, Gerente, Supervisor, Asesor)
 * @param asesorId - ID del asesor (solo si role es Asesor)
 * @returns Lista de prospectos/clientes con información de paginación
 */
export const getQuickLearningProspects = async (
  cursor?: string | null,
  limit: number = 20,
  role?: string,
  asesorId?: string
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('companySlug', 'quicklearning');
    queryParams.append('tableSlugs', 'prospectos,clientes,alumnos,sin_contestar,nuevo_ingreso');
    queryParams.append('limit', limit.toString());
    if (cursor) {
      queryParams.append('cursor', cursor);
    }
    if (role) {
      queryParams.append('role', role);
      if (role === 'Asesor' && asesorId) {
        queryParams.append('asesorId', asesorId);
      }
    }

    const url = `/quicklearning/twilio/usuarios?${queryParams.toString()}`;
    console.log("url --------->", url);

    const response = await api.get(url);
    // El backend ahora retorna { data: { pagination, usuarios }, lastMessageDate }
    const result = response.data;
    console.log("API Response --------------------------", result);
    return result;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al obtener la lista de prospectos/clientes');
  }
};

/**
 * Obtener historial de chat de un usuario
 * @param phone - Teléfono del usuario
 * @returns Historial de chat
 */
export const getQuickLearningChatHistory = async (phone: string) => {
  try {
    const response = await api.get(`/quicklearning/twilio/chats/${phone}/history?companySlug=quicklearning`);
    return response.data;
  } catch (error: any) {
    handleError(error);
    throw new Error('Error al obtener el historial de chat');
  }
};
import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, WhatsAppSession } from "../../types";

export const fetchSessions = async (user: UserProfile) => {
  try {
    const response = await api.get(`/whatsapp/session/${user.companySlug}/${user.id}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener las sesiones');
  }
};

export const requestNewQr = async (sessionName: string, user: UserProfile) => {
  try {
    const response = await api.post('/whatsapp/session', {
      sessionName,
      c_name: user.companySlug,
      user_id: user.id,
      user_name: user.name,
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo solicitar un nuevo QR');
  }
};

export const updateSession = async (update: Partial<WhatsAppSession>, user: UserProfile) => {
  try {
    const response = await api.put(`/whatsapp/session/${user.companySlug}`, update);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar la configuración de la sesión');
  }
};

export const deleteSession = async (sessionId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/whatsapp/session/${user.companySlug}/${sessionId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar la sesión');
  }
};

// Nueva función para obtener usuarios de WhatsApp
export const fetchWhatsAppUsers = async (user: UserProfile, tableSlugs: string[] = ['prospectos', 'clientes']) => {
  try {
    const response = await api.get(`/whatsapp/usuarios/${user.companySlug}?tableSlugs=${tableSlugs.join(',')}`);
    return response.data.usuarios || [];
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener usuarios de WhatsApp');
  }
};

// Función para obtener mensajes de un usuario específico
export const fetchUserMessages = async (user: UserProfile, phone: string) => {
  try {
    const response = await api.get(`/whatsapp/messages/${user.companySlug}/${phone}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener mensajes del usuario');
  }
};

// Función legacy para compatibilidad (mantener por si acaso)
export const fetchMessages = async (user: UserProfile) => {
  try {
    const response = await api.get(`/whatsapp/messages/${user.companySlug}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
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
    handleError(error as any);
    throw new Error('No se pudo mandar el mensaje');
  }
};
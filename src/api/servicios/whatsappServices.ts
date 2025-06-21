import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, WhatsAppSession } from "../../types";

export const fetchSessions = async (user: UserProfile) => {
  try {
    const response = await api.get(`/whatsapp/session/${user.c_name}/${user.id}`);
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
      c_name: user.c_name,
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
    const response = await api.put(`/whatsapp/session/${user.c_name}`, update);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar la configuración de la sesión');
  }
};

export const deleteSession = async (sessionId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/whatsapp/session/${user.c_name}/${sessionId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar la sesión');
  }
};

export const fetchMessages = async (user: UserProfile) => {
  try {
    const response = await api.get(`/whatsapp/messages/${user.c_name}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener mensajes');
  }
};

export const sendMessages = async (sessionId: string, user: UserProfile, phone: string, message: string) => {
  try {
    const response = await api.post(`/whatsapp/session/${user.c_name}/${sessionId}`, {
      phone,
      message,
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo mandar el mensaje');
  }
};
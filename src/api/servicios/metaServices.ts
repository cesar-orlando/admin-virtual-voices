import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, WhatsAppSession } from "../../types";

export const fetchSessions = async (user: UserProfile) => {
  try {
    const response = await api.get(`/sessions/messenger/${user.companySlug}/${user.id}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener las sesiones');
  }
};

export const createSession = async (user: UserProfile, sessionName: string, sessionData: Record<string, any>) => {
  try {
    const response = await api.post('/sessions/messenger/', {
      sessionName,
      c_name: user.companySlug,
      user_id: user.id,
      user_name: user.name,
      sessionData: {
          "facebook": {
            "pageId": sessionData.pageId,
            "pageAccessToken": sessionData.pageAccessToken
          }
      }
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo crear la sesión');
  }
};

export const fetchFacebookUsers = async (user: UserProfile) => {
  try {
    const response = await api.get(`/meta/messenger/usuarios/${user.companySlug}/${user.id}`);
    return response.data.usuarios || [];
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener usuarios de Messenger');
  }
}

export const fetchUserMessages = async (user: UserProfile, sessionId: string, userId: string) => {
  try {
    const response = await api.get(`/meta/messenger/messages/${user.companySlug}/${sessionId}/${userId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener los mensajes del usuario');
  }
}

export const sendMessage = async (user: UserProfile, userId: string, message: string) => {
  try {
    const response = await api.post(`/meta/messenger/send-message/`, {
        c_name: user.companySlug,
        userId,
        text:message,
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo enviar el mensaje');
  }
};
import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, AIConfig } from "../../types";

export const createAiConfig = async (config: AIConfig, user: UserProfile) => {
  try {
    const response = await api.post(`/ia-configs/${user.c_name}`, config);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo guardar la configuración de AI');
  }
};

export const fetchAllAiConfigs = async (user: UserProfile) => {
  try {
    const response = await api.get(`/ia-configs/${user.c_name}/${user.id}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener la configuración de AI');
  }
};

export const updateAiConfig = async (config: Partial<AIConfig>, user: UserProfile) => {
  try {
    const response = await api.put(`/ia-configs/${user.c_name}`, config);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar la configuración de AI');
  }
};

export const deleteAiConfig = async (configId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/ia-configs/${user.c_name}/${configId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar la configuración de AI');
  }
};

export const simulateAiResponse = async (user: UserProfile, message: string, configId: string) => {
  try {
    const response = await api.post(`/ia-configs/simulate/${user.c_name}`, {
      message,
      configId,
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo simular la respuesta de AI');
  }
};
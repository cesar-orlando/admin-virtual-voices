import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { UserProfile, AIConfig } from "../../types";
import type { AiConfig } from "../../types/common";

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
    const response = await api.put(`/ia-configs/${user.c_name}/${user.id}`, config);
    return response.data;
  } catch (error) {
    console.log("error", (error as any).response.data)
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

export const simulateAiResponse = async (user: UserProfile, messages: Array<{ from: "user" | "ai"; text: string }>, aiConfig: Partial<AiConfig>) => {
  try {
    const response = await api.post(`/ia-configs/simulate/${user.c_name}`, {
      messages,
      aiConfig,
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo simular la respuesta de AI');
  }
};

export const getCompanyConfig = async (companyName: string) => {
  const response = await api.get(`/companies/${companyName}`);
  return response.data[0];
};

export const updateCompanyConfig = async (companyName: string, data: Partial<{ displayName: string; logoUrl: string; statuses: string[] }>) => {
  const response = await api.patch(`/companies/${companyName}`, data);
  return response.data;
};
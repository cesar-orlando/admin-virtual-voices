import api from "../axios";
import { handleApiError } from "../../Helpers/ErrorHandler";

export interface ChatMetrics {
  totalChats: number;
  totalMessages: number;
  totalActiveChats: number;
  averageResponseTime: number;
  medianResponseTime: number;
  fastestResponse: number;
  slowestResponse: number;
  responsesUnder5Seconds: number;
  responsesUnder10Seconds: number;
  responsesOver30Seconds: number;
  averageMessagesPerChat: number;
  botActiveChats: number;
  humanActiveChats: number;
  peakHours: { hour: number; messageCount: number }[];
  dailyStats: { date: string; chats: number; messages: number; avgResponseTime: number }[];
  responseTimeDistribution: { range: string; count: number }[];
  topActiveChats: { phone: string; name?: string; messageCount: number; lastMessage: Date }[];
}

export interface RealTimeMetrics {
  last24Hours: {
    totalChats: number;
    totalMessages: number;
    averageResponseTime: number;
    responsesUnder5Seconds: number;
    botActiveChats: number;
  };
  lastHour: {
    totalChats: number;
    totalMessages: number;
    averageResponseTime: number;
    responsesUnder5Seconds: number;
    botActiveChats: number;
  };
}

/**
 * Get comprehensive chat metrics for a specific company
 * @param companySlug - Company slug
 * @param period - Time period (7days, 30days, 90days)
 * @param chatType - Type of chats (whatsapp, quicklearning, both) - auto-determined based on companySlug
 * @returns Chat metrics data with analytics, trends, and KPIs
 */
export const getChatMetrics = async (
  companySlug: string, 
  period: string = '30days',
  chatType?: string
) => {
  try {
    // Determine chat type based on company slug - maintain separation like normal dashboard
    const determinedChatType = companySlug === 'quicklearning' || companySlug.includes('quicklearning') 
      ? 'quicklearning' 
      : 'whatsapp';
    
    // Use provided chatType only if explicitly passed, otherwise use determined type
    const finalChatType = chatType || determinedChatType;
    
    console.log(`🔍 Loading chat metrics for ${companySlug} - Chat type: ${finalChatType}`);
    
    const response = await api.get(`/chat-metrics/${companySlug}/metrics`, {
      params: { period, chatType: finalChatType }
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = handleApiError(error);
    console.error('Chat metrics error:', errorMessage);
    throw new Error('Error al obtener métricas de chat');
  }
};

/**
 * Get real-time chat metrics (last 24 hours + current performance)
 * @param companySlug - Company slug
 * @param chatType - Type of chats (whatsapp, quicklearning, both) - auto-determined based on companySlug
 * @returns Real-time metrics and current performance indicators
 */
export const getRealTimeChatMetrics = async (
  companySlug: string,
  chatType?: string
) => {
  try {
    // Determine chat type based on company slug - maintain separation like normal dashboard
    const determinedChatType = companySlug === 'quicklearning' || companySlug.includes('quicklearning') 
      ? 'quicklearning' 
      : 'whatsapp';
    
    // Use provided chatType only if explicitly passed, otherwise use determined type
    const finalChatType = chatType || determinedChatType;
    
    console.log(`⚡ Loading real-time metrics for ${companySlug} - Chat type: ${finalChatType}`);
    
    const response = await api.get(`/chat-metrics/${companySlug}/real-time`, {
      params: { chatType: finalChatType }
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = handleApiError(error);
    console.error('Real-time metrics error:', errorMessage);
    throw new Error('Error al obtener métricas en tiempo real');
  }
};

/**
 * Get available chat sources for debugging and validation
 * @param companySlug - Company slug
 * @returns Available chat sources info and data validation
 */
export const getAvailableChatSources = async (companySlug: string) => {
  try {
    const response = await api.get(`/chat-metrics/${companySlug}/debug/sources`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = handleApiError(error);
    console.error('Chat sources error:', errorMessage);
    throw new Error('Error al obtener fuentes de chat');
  }
};

/**
 * Get sample chat data for debugging and development
 * @param companySlug - Company slug  
 * @param source - Source type (whatsapp, quicklearning) - auto-determined based on companySlug if not provided
 * @param limit - Number of samples
 * @returns Sample chat data for testing
 */
export const getSampleChatData = async (
  companySlug: string,
  source?: string,
  limit: number = 3
) => {
  try {
    // Determine source based on company slug if not provided - maintain separation
    const determinedSource = companySlug === 'quicklearning' || companySlug.includes('quicklearning') 
      ? 'quicklearning' 
      : 'whatsapp';
    
    const finalSource = source || determinedSource;
    
    console.log(`📝 Loading sample data for ${companySlug} - Source: ${finalSource}`);
    
    const response = await api.get(`/chat-metrics/${companySlug}/debug/sample`, {
      params: { source: finalSource, limit }
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = handleApiError(error);
    console.error('Sample data error:', errorMessage);
    throw new Error('Error al obtener datos de muestra');
  }
};

/**
 * Get chat structure analysis for debugging
 * @param companySlug - Company slug
 * @returns Chat structure analysis and data insights
 */
export const getChatStructureAnalysis = async (companySlug: string) => {
  try {
    const response = await api.get(`/chat-metrics/${companySlug}/debug/structure`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = handleApiError(error);
    console.error('Structure analysis error:', errorMessage);
    throw new Error('Error al obtener análisis de estructura de chat');
  }
};
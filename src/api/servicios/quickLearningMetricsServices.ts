import axios from '../axios';

// Tipos para las respuestas del backend
export interface QuickLearningDashboardData {
  period: string;
  periodLabel: string;
  totalChats: number;
  activeChats: number;
  inactiveChats: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  averageMessagesPerChat: number;
  generatedAt: string;
}

export interface QuickLearningMetricsData {
  period: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalChats: number;
  activeChats: number;
  inactiveChats: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  averageMessagesPerChat: number;
  dailyBreakdown: Array<{
    date: string;
    totalChats: number;
    newChats: number;
    totalMessages: number;
    inbound: number;
    outbound: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    messages: number;
    chats: number;
  }>;
  responseTypes: {
    bot: number;
    human: number;
    advisor: number;
  };
  userStages: {
    prospecto: number;
    interesado: number;
    inscrito: number;
    no_prospecto: number;
  };
  topActiveChats: Array<{
    userId: string;
    userName?: string;
    messageCount: number;
    lastMessage: string;
  }>;
  responseStats: {
    averageResponseTime: number;
    fastestResponse: number;
    slowestResponse: number;
  };
  generatedAt: string;
}

// Servicio para dashboard (métricas rápidas)
export const getQuickLearningDashboard = async (
  period: '24hours' | '7days' | '30days' = '24hours'
): Promise<QuickLearningDashboardData> => {
  try {
    console.log(`📡 Llamando a /quicklearning/dashboard con period: ${period}`);
    
    const response = await axios.get(`/quicklearning/dashboard`, {
      params: { period }
    });
    
    console.log('📡 Respuesta dashboard:', response.data);
    
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    
    throw new Error(`Error en la respuesta del servidor: ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    console.error('❌ Error obteniendo dashboard QuickLearning:', error);
    console.error('❌ URL:', error.config?.url);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data:', error.response?.data);
    throw new Error(`Error cargando dashboard: ${error.response?.data?.message || error.message}`);
  }
};

// Servicio para métricas completas (análisis detallado)
export const getQuickLearningMetrics = async (params: {
  startDate?: string;
  endDate?: string;
  period?: '24hours' | '7days' | '30days';
  includeInactive?: boolean;
} = {}): Promise<QuickLearningMetricsData> => {
  try {
    const finalParams = {
      period: params.period || '7days',
      ...params
    };
    
    console.log(`📡 Llamando a /quicklearning/metrics con params:`, finalParams);
    
    const response = await axios.get(`/quicklearning/metrics`, {
      params: finalParams
    });
    
    console.log('📡 Respuesta métricas:', response.data);
    
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    
    throw new Error(`Error en la respuesta del servidor: ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    console.error('❌ Error obteniendo métricas QuickLearning:', error);
    console.error('❌ URL:', error.config?.url);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data:', error.response?.data);
    throw new Error(`Error cargando métricas: ${error.response?.data?.message || error.message}`);
  }
};

// Función auxiliar para formatear fechas
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Función auxiliar para obtener rango de fechas según el período
export const getDateRangeForPeriod = (period: '24hours' | '7days' | '30days') => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '24hours':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
  }
  
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate)
  };
};
import api from '../axios';
import type { 
  ITool, 
  ToolCategory, 
  ToolAnalytics, 
  ToolDashboardStats,
  CreateToolRequest, 
  UpdateToolRequest, 
  ToolTestRequest, 
  ToolTestResponse,
  ExecuteToolRequest, 
  BatchExecuteRequest,
  ValidateSchemaRequest,
  ValidateEndpointRequest,
  ToolListParams,
  CreateCategoryRequest,
  ApiResponse,
  PaginatedResponse,
  ToolExecution
} from '../../types';

// CRUD básico de herramientas
export const toolsServices = {
  // Crear herramienta
  create: async (data: CreateToolRequest): Promise<ApiResponse<ITool>> => {
    const response = await api.post('/tools', data);
    return response.data;
  },

  // Listar herramientas
  list: async (c_name: string, params?: ToolListParams): Promise<PaginatedResponse<ITool>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get(`/tools/${c_name}?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener herramienta por ID
  getById: async (c_name: string, toolId: string): Promise<ApiResponse<ITool>> => {
    const response = await api.get(`/tools/${c_name}/${toolId}`);
    return response.data;
  },

  // Actualizar herramienta
  update: async (c_name: string, toolId: string, data: UpdateToolRequest): Promise<ApiResponse<ITool>> => {
    const response = await api.put(`/tools/${c_name}/${toolId}`, data);
    return response.data;
  },

  // Eliminar herramienta (soft delete)
  delete: async (c_name: string, toolId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/tools/${c_name}/${toolId}`);
    return response.data;
  },

  // Activar/Desactivar herramienta
  toggleStatus: async (c_name: string, toolId: string, isActive: boolean): Promise<ApiResponse<ITool>> => {
    const response = await api.patch(`/tools/${c_name}/${toolId}/status`, { isActive });
    return response.data;
  },

  // Probar herramienta
  test: async (c_name: string, toolId: string, data: ToolTestRequest): Promise<ApiResponse<ToolTestResponse>> => {
    const response = await api.post(`/tools/${c_name}/${toolId}/test`, data);
    return response.data;
  },

  // Ejecutar herramienta individual
  execute: async (data: ExecuteToolRequest): Promise<ApiResponse<any>> => {
    const response = await api.post('/tools/execute', data);
    return response.data;
  },

  // Ejecutar múltiples herramientas
  batchExecute: async (data: BatchExecuteRequest): Promise<ApiResponse<any[]>> => {
    const response = await api.post('/tools/batch-execute', data);
    return response.data;
  },

  // Obtener schema para OpenAI
  getOpenAISchema: async (c_name: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/tools/openai-schema/${c_name}`);
    return response.data;
  },

  // Obtener analytics de uso
  getAnalytics: async (c_name: string, startDate?: string, endDate?: string): Promise<ApiResponse<ToolAnalytics>> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await api.get(`/tools/analytics/${c_name}?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener estadísticas del dashboard
  getDashboardStats: async (c_name: string): Promise<ApiResponse<ToolDashboardStats>> => {
    const response = await api.get(`/tools/dashboard-stats/${c_name}`);
    return response.data;
  },

  // Obtener logs de ejecución
  getExecutionLogs: async (c_name: string, toolId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<ToolExecution>> => {
    const response = await api.get(`/tools/logs/${c_name}/${toolId}?page=${page}&limit=${limit}`);
    return response.data;
  }
};

// Servicios de categorías
export const categoriesServices = {
  // Listar categorías
  list: async (c_name: string): Promise<ApiResponse<ToolCategory[]>> => {
    const response = await api.get(`/tools/${c_name}/categories/list`);
    return response.data;
  },

  // Crear categoría
  create: async (data: CreateCategoryRequest): Promise<ApiResponse<ToolCategory>> => {
    const response = await api.post('/tools/categories', data);
    return response.data;
  },

  // Actualizar categoría
  update: async (categoryId: string, data: Partial<CreateCategoryRequest>): Promise<ApiResponse<ToolCategory>> => {
    const response = await api.put(`/tools/categories/${categoryId}`, data);
    return response.data;
  },

  // Eliminar categoría
  delete: async (categoryId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/tools/categories/${categoryId}`);
    return response.data;
  }
};

// Servicios de validación
export const validationServices = {
  // Validar schema de parámetros
  validateSchema: async (data: ValidateSchemaRequest): Promise<ApiResponse<{ isValid: boolean; errors?: string[] }>> => {
    const response = await api.post('/tools/validate-schema', data);
    return response.data;
  },

  // Validar endpoint
  validateEndpoint: async (data: ValidateEndpointRequest): Promise<ApiResponse<{ isValid: boolean; responseTime?: number; error?: string }>> => {
    const response = await api.post('/tools/validate-endpoint', data);
    return response.data;
  }
};

// Re-exportar todos los servicios
export { toolsServices as default };
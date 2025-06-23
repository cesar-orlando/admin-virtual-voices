import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toolsServices, categoriesServices, validationServices } from '../api/servicios/toolsServices';
import type { 
  ITool, 
  ToolListParams, 
  CreateToolRequest, 
  UpdateToolRequest, 
  ToolTestRequest,
  ExecuteToolRequest,
  BatchExecuteRequest,
  CreateCategoryRequest,
  ValidateSchemaRequest,
  ValidateEndpointRequest
} from '../types';

export const useTools = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const c_name = user?.c_name || '';

  // Query para listar herramientas
  const useToolsList = (params?: ToolListParams) => {
    return useQuery({
      queryKey: ['tools', c_name, params],
      queryFn: () => toolsServices.list(c_name, params),
      enabled: !!c_name,
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Query para obtener herramienta por ID
  const useToolById = (toolId: string) => {
    return useQuery({
      queryKey: ['tool', c_name, toolId],
      queryFn: () => toolsServices.getById(c_name, toolId),
      enabled: !!c_name && !!toolId,
    });
  };

  // Query para estadísticas del dashboard
  const useDashboardStats = () => {
    return useQuery({
      queryKey: ['tools-dashboard-stats', c_name],
      queryFn: () => toolsServices.getDashboardStats(c_name),
      enabled: !!c_name,
      staleTime: 2 * 60 * 1000, // 2 minutos
    });
  };

  // Query para analytics
  const useAnalytics = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: ['tools-analytics', c_name, startDate, endDate],
      queryFn: () => toolsServices.getAnalytics(c_name, startDate, endDate),
      enabled: !!c_name,
    });
  };

  // Query para logs de ejecución
  const useExecutionLogs = (toolId: string, page: number = 1, limit: number = 50) => {
    return useQuery({
      queryKey: ['execution-logs', c_name, toolId, page, limit],
      queryFn: () => toolsServices.getExecutionLogs(c_name, toolId, page, limit),
      enabled: !!c_name && !!toolId,
    });
  };

  // Mutation para crear herramienta
  const useCreateTool = () => {
    return useMutation({
      mutationFn: (data: CreateToolRequest) => toolsServices.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tools', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
      },
    });
  };

  // Mutation para actualizar herramienta
  const useUpdateTool = () => {
    return useMutation({
      mutationFn: ({ toolId, data }: { toolId: string; data: UpdateToolRequest }) =>
        toolsServices.update(c_name, toolId, data),
      onSuccess: (_result, { toolId }) => {
        queryClient.invalidateQueries({ queryKey: ['tools', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tool', c_name, toolId] });
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
      },
    });
  };

  // Mutation para eliminar herramienta
  const useDeleteTool = () => {
    return useMutation({
      mutationFn: (toolId: string) => toolsServices.delete(c_name, toolId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tools', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
      },
    });
  };

  // Mutation para cambiar estado de herramienta
  const useToggleToolStatus = () => {
    return useMutation({
      mutationFn: ({ toolId, isActive }: { toolId: string; isActive: boolean }) =>
        toolsServices.toggleStatus(c_name, toolId, isActive),
      onSuccess: (_, { toolId }) => {
        queryClient.invalidateQueries({ queryKey: ['tools', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tool', c_name, toolId] });
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
      },
    });
  };

  // Mutation para probar herramienta
  const useTestTool = () => {
    return useMutation({
      mutationFn: ({ toolId, data }: { toolId: string; data: ToolTestRequest }) =>
        toolsServices.test(c_name, toolId, data),
    });
  };

  // Mutation para ejecutar herramienta
  const useExecuteTool = () => {
    return useMutation({
      mutationFn: (data: ExecuteToolRequest) => toolsServices.execute(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tools-analytics', c_name] });
      },
    });
  };

  // Mutation para ejecutar múltiples herramientas
  const useBatchExecuteTools = () => {
    return useMutation({
      mutationFn: (data: BatchExecuteRequest) => toolsServices.batchExecute(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tools-dashboard-stats', c_name] });
        queryClient.invalidateQueries({ queryKey: ['tools-analytics', c_name] });
      },
    });
  };

  return {
    // Queries
    useToolsList,
    useToolById,
    useDashboardStats,
    useAnalytics,
    useExecutionLogs,
    
    // Mutations
    useCreateTool,
    useUpdateTool,
    useDeleteTool,
    useToggleToolStatus,
    useTestTool,
    useExecuteTool,
    useBatchExecuteTools,
  };
};

export const useCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const c_name = user?.c_name || '';

  // Query para listar categorías
  const useCategoriesList = () => {
    return useQuery({
      queryKey: ['categories', c_name],
      queryFn: () => categoriesServices.list(c_name),
      enabled: !!c_name,
      staleTime: 10 * 60 * 1000, // 10 minutos
    });
  };

  // Mutation para crear categoría
  const useCreateCategory = () => {
    return useMutation({
      mutationFn: (data: CreateCategoryRequest) => categoriesServices.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories', c_name] });
      },
    });
  };

  // Mutation para actualizar categoría
  const useUpdateCategory = () => {
    return useMutation({
      mutationFn: ({ categoryId, data }: { categoryId: string; data: Partial<CreateCategoryRequest> }) =>
        categoriesServices.update(categoryId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories', c_name] });
      },
    });
  };

  // Mutation para eliminar categoría
  const useDeleteCategory = () => {
    return useMutation({
      mutationFn: (categoryId: string) => categoriesServices.delete(categoryId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories', c_name] });
      },
    });
  };

  return {
    useCategoriesList,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
  };
};

export const useValidation = () => {
  // Mutation para validar schema
  const useValidateSchema = () => {
    return useMutation({
      mutationFn: (data: ValidateSchemaRequest) => validationServices.validateSchema(data),
    });
  };

  // Mutation para validar endpoint
  const useValidateEndpoint = () => {
    return useMutation({
      mutationFn: (data: ValidateEndpointRequest) => validationServices.validateEndpoint(data),
    });
  };

  return {
    useValidateSchema,
    useValidateEndpoint,
  };
};
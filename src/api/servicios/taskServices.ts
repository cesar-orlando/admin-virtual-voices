import api from '../axios'
import type { 
  Task, 
  Company, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskStats,
  TaskStatus,
  ApiResponse 
} from '../../types/tasks'

// Base headers para multiempresa
export const getTaskHeaders = (companySlug: string, userRole?: string, userCompany?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-company': userCompany || 'quicklearning',
    'x-user-role': userRole || 'Administrador'
  }
  
  // Para "all-companies", usar el slug tal como está (el backend tiene una empresa especial 'all-companies')
  headers['x-company-slug'] = companySlug
  
  console.log('🔄 Task Headers FIXED:', {
    companySlug,
    userRole,
    userCompany,
    headers,
    isGlobalView: companySlug === 'all-companies'
  })
  
  return headers
}

// ===== TASK SERVICES =====

export const fetchTasks = async (
  companySlug: string,
  filters?: TaskFilters,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task[]>> => {
  try {
    // Si es vista global (all-companies), obtener tareas de todas las empresas
    if (companySlug === 'all-companies') {
      const companies = ['VirtualVoices', 'quicklearning', 'mitsubishi', 'grupo-milkasa', 'grupokg']
      
      console.log('🌍 Fetching tasks from all companies:', companies)
      
      // Hacer peticiones paralelas a todas las empresas
      const promises = companies.map(async (company) => {
        try {
          const response = await api.get('/tasks', {
            headers: getTaskHeaders(company, userRole, userCompany),
            params: filters
          })
          console.log(`✅ ${company}:`, response.data?.length || 0, 'tasks')
          return response.data || []
        } catch (error) {
          console.log(`❌ ${company}: error fetching tasks`)
          return []
        }
      })
      
      const results = await Promise.all(promises)
      const allTasks = results.flat() // Combinar todas las tareas en un solo array
      
      console.log('🎯 Combined tasks from all companies:', allTasks.length)
      
      return {
        success: true,
        data: allTasks,
        statusCode: 200
      }
    }
    
    // Para empresas específicas, petición normal
    const response = await api.get('/tasks', {
      headers: getTaskHeaders(companySlug, userRole, userCompany),
      params: filters
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener tareas',
      statusCode: error.response?.status
    }
  }
}

export const fetchTaskById = async (
  taskId: string,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task>> => {
  try {
    const response = await api.get(`/tasks/${taskId}`, {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener tarea',
      statusCode: error.response?.status
    }
  }
}

export const createTask = async (
  taskData: CreateTaskRequest,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task>> => {
  try {
    const response = await api.post('/tasks', taskData, {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al crear tarea',
      statusCode: error.response?.status
    }
  }
}

export const updateTask = async (
  taskId: string,
  updates: UpdateTaskRequest,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task>> => {
  try {
    const response = await api.put(`/tasks/${taskId}`, updates, {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al actualizar tarea',
      statusCode: error.response?.status
    }
  }
}

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  position: number,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task>> => {
  try {
    const response = await api.patch(`/tasks/${taskId}/status`, { status, position }, {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al cambiar estado',
      statusCode: error.response?.status
    }
  }
}

export const deleteTask = async (
  taskId: string,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/tasks/${taskId}`, {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al eliminar tarea',
      statusCode: error.response?.status
    }
  }
}

export const addTaskComment = async (
  taskId: string,
  comment: string,
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task>> => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  try {
    const response = await api.post(
      `/tasks/${taskId}/comments`,
      { comment, userId: user.id, userName: user.name },
      { headers: getTaskHeaders(user.companySlug, userRole, userCompany) }
    )
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al agregar comentario',
      statusCode: error.response?.status
    }
  }
}

export const fetchTaskStats = async (
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<TaskStats>> => {
  try {
    const response = await api.get('/tasks/stats', {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener estadísticas',
      statusCode: error.response?.status
    }
  }
}

export const fetchOverdueTasks = async (
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task[]>> => {
  try {
    const response = await api.get('/tasks/overdue', {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener tareas vencidas',
      statusCode: error.response?.status
    }
  }
}

export const fetchUpcomingTasks = async (
  companySlug: string,
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Task[]>> => {
  try {
    const response = await api.get('/tasks/upcoming', {
      headers: getTaskHeaders(companySlug, userRole, userCompany)
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener próximas tareas',
      statusCode: error.response?.status
    }
  }
}

// ===== COMPANY SERVICES =====

export const fetchCompanies = async (
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<Company[]>> => {
  try {
    const response = await api.get('/companies', {
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || 'Administrador',
        'x-user-company': userCompany || 'VirtualVoices'
      }
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener empresas',
      statusCode: error.response?.status
    }
  }
}

export const fetchGlobalStats = async (
  userRole?: string,
  userCompany?: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get('/companies/global/stats', {
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || 'SuperAdmin',
        'x-user-company': userCompany || 'VirtualVoices'
      }
    })
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener estadísticas globales',
      statusCode: error.response?.status
    }
  }
}
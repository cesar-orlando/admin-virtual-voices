import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { 
  Task, 
  Company, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskStats,
  TaskStatus,
  TasksByStatus
} from '../types/tasks'
import { 
  fetchTasks,
  fetchTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addTaskComment,
  fetchTaskStats,
  fetchOverdueTasks,
  fetchUpcomingTasks,
  fetchCompanies
} from '../api/servicios/taskServices'
import { fetchCompanyUsers } from '../api/servicios/userServices'

interface UseTasksParams {
  companySlug: string
  userRole?: string
  userCompany?: string
}

interface UseTasksReturn {
  // Data
  tasks: Task[]
  tasksByStatus: TasksByStatus
  stats: TaskStats | null
  loading: boolean
  error: string | null
  
  // Actions
  refetchTasks: () => void
  createNewTask: (taskData: CreateTaskRequest) => Promise<Task | null>
  updateTaskData: (taskId: string, updates: UpdateTaskRequest) => Promise<Task | null>
  changeTaskStatus: (taskId: string, status: TaskStatus, position: number) => Promise<Task | null>
  removeTask: (taskId: string) => Promise<boolean>
  addComment: (taskId: string, comment: string) => Promise<Task | null>
  
  // Filters
  filters: TaskFilters
  setFilters: (filters: TaskFilters) => void
  filteredTasks: Task[]
}

export function useTasks({ companySlug, userRole, userCompany }: UseTasksParams): UseTasksReturn {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TaskFilters>({})

  // Fetch tasks with React Query
  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks', companySlug, userRole, userCompany, filters],
    queryFn: async () => {
      console.log('🔄 Fetching tasks with params:', {
        companySlug,
        userRole,
        userCompany,
        filters,
        isGlobalView: companySlug === 'all-companies'
      })
      
      const response = await fetchTasks(companySlug, filters, userRole, userCompany)
      
      console.log('📊 Tasks fetch response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        error: response.message,
        statusCode: response.statusCode,
        companySlug,
        isGlobalView: companySlug === 'all-companies'
      })
      
      if (!response.success) {
        console.error('❌ FETCH TASKS ERROR:', {
          message: response.message,
          statusCode: response.statusCode,
          companySlug,
          userRole,
          userCompany
        })
      }
      
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data || []
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })

  // Fetch stats separately
  const {
    data: stats = null
  } = useQuery({
    queryKey: ['task-stats', companySlug, userRole, userCompany],
    queryFn: async () => {
      const response = await fetchTaskStats(companySlug, userRole, userCompany)
      if (!response.success) {
        return null
      }
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await createTask(taskData, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data!
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success(`Tarea "${newTask.title}" creada exitosamente`)
    },
    onError: (error: Error) => {
      toast.error(`Error al crear tarea: ${error.message}`)
    }
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: UpdateTaskRequest }) => {
      const response = await updateTask(taskId, updates, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data!
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success(`Tarea "${updatedTask.title}" actualizada exitosamente`)
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar tarea: ${error.message}`)
    }
  })

  // Update task status mutation (for drag & drop)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status, position }: { taskId: string; status: TaskStatus; position: number }) => {
      const response = await updateTaskStatus(taskId, status, position, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data!
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      // Don't show success toast for drag & drop to avoid spam
    },
    onError: (error: Error) => {
      toast.error(`Error al cambiar estado: ${error.message}`)
      // Refetch to revert optimistic updates
      refetchTasks()
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await deleteTask(taskId, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success('Tarea eliminada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tarea: ${error.message}`)
    }
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const response = await addTaskComment(taskId, comment, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Comentario agregado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al agregar comentario: ${error.message}`)
    }
  })

  // Group tasks by status
  const tasksByStatus: TasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    review: tasks.filter(task => task.status === 'review'),
    done: tasks.filter(task => task.status === 'done')
  }

  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false
    if (filters.tags && !task.tags.some(tag => tag.includes(filters.tags!))) return false
    if (filters.isOverdue && !task.isOverdue) return false
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return task.title.toLowerCase().includes(searchTerm) ||
             task.description?.toLowerCase().includes(searchTerm) ||
             task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    }
    return true
  })

  // Actions
  const createNewTask = useCallback(async (taskData: CreateTaskRequest): Promise<Task | null> => {
    try {
      const result = await createTaskMutation.mutateAsync(taskData)
      return result
    } catch (error) {
      return null
    }
  }, [createTaskMutation])

  const updateTaskData = useCallback(async (taskId: string, updates: UpdateTaskRequest): Promise<Task | null> => {
    try {
      const result = await updateTaskMutation.mutateAsync({ taskId, updates })
      return result
    } catch (error) {
      return null
    }
  }, [updateTaskMutation])

  const changeTaskStatus = useCallback(async (taskId: string, status: TaskStatus, position: number): Promise<Task | null> => {
    try {
      const result = await updateStatusMutation.mutateAsync({ taskId, status, position })
      return result
    } catch (error) {
      return null
    }
  }, [updateStatusMutation])

  const removeTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      await deleteTaskMutation.mutateAsync(taskId)
      return true
    } catch (error) {
      return false
    }
  }, [deleteTaskMutation])

  const addComment = useCallback(async (taskId: string, comment: string): Promise<Task | null> => {
    try {
      const result = await addCommentMutation.mutateAsync({ taskId, comment })
      return result
    } catch (error) {
      return null
    }
  }, [addCommentMutation])

  const error = queryError?.message || null

  return {
    // Data
    tasks,
    tasksByStatus,
    stats,
    loading,
    error,
    
    // Actions
    refetchTasks,
    createNewTask,
    updateTaskData,
    changeTaskStatus,
    removeTask,
    addComment,
    
    // Filters
    filters,
    setFilters,
    filteredTasks
  }
}

// Hook for companies (VirtualVoices/SuperAdmin users)
interface UseCompaniesReturn {
  companies: Company[]
  loading: boolean
  error: string | null
  canSelectCompanies: boolean
}

export function useCompanies(userRole?: string, userCompany?: string): UseCompaniesReturn {
  const canSelectCompanies = userRole === 'SuperAdmin' || 
                            userCompany?.toLowerCase().includes('virtual') ||
                            userCompany?.toLowerCase() === 'virtualvoices'
  
  console.log('🔍 useCompanies - Detection:', {
    userRole,
    userCompany,
    canSelectCompanies
  })

  const {
    data: companies = [],
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['companies', userRole, userCompany],
    queryFn: async () => {
      const response = await fetchCompanies(userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data || []
    },
    enabled: canSelectCompanies, // Only run query if user can select companies
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const error = queryError?.message || null

  return {
    companies,
    loading,
    error,
    canSelectCompanies
  }
}

// Hook for individual task
export function useTask(taskId: string, companySlug: string, userRole?: string, userCompany?: string) {
  return useQuery({
    queryKey: ['task', taskId, companySlug, userRole, userCompany],
    queryFn: async () => {
      const response = await fetchTaskById(taskId, companySlug, userRole, userCompany)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data!
    },
    enabled: !!taskId,
  })
}

// Hook for users by company
interface UseCompanyUsersReturn {
  users: Array<{ id: string; name: string; email: string; role: string }>
  loading: boolean
  error: string | null
}

export function useCompanyUsers(companySlug: string): UseCompanyUsersReturn {
  const {
    data: users = [],
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['company-users', companySlug],
    queryFn: async () => {
      if (!companySlug || companySlug === 'all-companies') {
        return []
      }
      
      try {
        const response = await fetchCompanyUsers(companySlug)
        // Transform _id to id for consistency
        const transformedUsers = (response || []).map((user: any) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }))
        
        console.log('🔄 useCompanyUsers - Transformed users:', {
          companySlug,
          originalCount: response?.length || 0,
          transformedCount: transformedUsers.length,
          sampleUser: transformedUsers[0]
        })
        
        return transformedUsers
      } catch (error) {
        console.error('Error fetching company users:', error)
        return []
      }
    },
    enabled: !!companySlug && companySlug !== 'all-companies',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const error = queryError?.message || null

  return {
    users,
    loading,
    error
  }
}
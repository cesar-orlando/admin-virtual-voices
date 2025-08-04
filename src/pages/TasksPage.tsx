import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import CompanySelector from '../components/CompanySelector'
import TaskBoard from '../components/TaskBoard'
import TaskModal from '../components/TaskModal'
import TaskFilters from '../components/TaskFilters'
import { useTasks, useCompanyUsers } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import type { Task, CreateTaskRequest, TaskFilters as TaskFiltersType } from '../types/tasks'

// Users are now loaded dynamically from API in TaskModal

const TasksPage: React.FC = () => {
  const { user } = useAuth()
  const [selectedCompany, setSelectedCompany] = useState<string>(
    (user as any)?.companySlug || 'quicklearning'
  )
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    task?: Task
  }>({
    open: false,
    mode: 'create'
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    taskId?: string
    taskTitle?: string
  }>({
    open: false
  })
  const [filters, setFilters] = useState<TaskFiltersType>({
    companySlug: selectedCompany
  })

  // Update filters when company changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      companySlug: selectedCompany
    }))
  }, [selectedCompany])

  // Initialize company selection based on user permissions
  useEffect(() => {
    if (user) {
      // For SuperAdmin and VirtualVoices users, allow company selection
      const userCompanySlug = (user as any).companySlug?.toLowerCase() || ''
      const canSelectCompanies = (user as any).role === 'SuperAdmin' || 
                                  userCompanySlug === 'virtualvoices' ||
                                  userCompanySlug === 'virtual-voices' ||
                                  userCompanySlug.includes('virtual')
      
      console.log('🔍 TasksPage - User detection:', {
        user: user,
        companySlug: userCompanySlug,
        role: (user as any).role,
        canSelectCompanies
      })
      
      if (!canSelectCompanies) {
        // Regular users see only their company
        setSelectedCompany((user as any).companySlug || 'quicklearning')
      } else {
        // VirtualVoices users start with "all-companies" view
        setSelectedCompany('all-companies')
      }
    }
  }, [user])

  // Use tasks hook
  const {
    tasks,
    tasksByStatus,
    stats,
    loading,
    error,
    refetchTasks,
    createNewTask,
    updateTaskData,
    changeTaskStatus,
    removeTask,
    addComment
  } = useTasks({
    companySlug: selectedCompany,
    userRole: (user as any)?.role,
    userCompany: (user as any)?.companySlug
  })

  // Get users for the current company (for filters)
  const currentCompanyForUsers = selectedCompany && selectedCompany !== 'all-companies' 
    ? selectedCompany 
    : (user as any)?.companySlug || 'quicklearning'
  
  const { users: companyUsers, loading: usersLoading } = useCompanyUsers(currentCompanyForUsers)

  // Filter tasks based on active filters
  const filterTasks = (tasks: Task[], filters: TaskFiltersType): Task[] => {
    return tasks.filter(task => {
      // Search filter (title, description, tags)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(searchTerm)
        const matchesDescription = task.description?.toLowerCase().includes(searchTerm) || false
        const matchesTags = task.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm) || 
          searchTerm.includes(tag.toLowerCase())
        )
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false
        }
      }

      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false
      }

      // Assigned user filter
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned' && task.assignedTo) {
          return false
        }
        if (filters.assignedTo !== 'unassigned' && task.assignedTo !== filters.assignedTo) {
          return false
        }
      }

      // Overdue filter
      if (filters.isOverdue && !task.isOverdue) {
        return false
      }

      return true
    })
  }

  // Apply filters to tasks
  const filteredTasks = filterTasks(tasks, filters)
  
  // Group filtered tasks by status
  const filteredTasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    done: filteredTasks.filter(task => task.status === 'done')
  }

  // Get company name for display
  const getCompanyDisplayName = () => {
    if (selectedCompany === 'all-companies') {
      return 'Todas las Empresas'
    }
    return selectedCompany.charAt(0).toUpperCase() + selectedCompany.slice(1)
  }

  // Modal handlers
  const handleCreateTask = () => {
    setModalState({
      open: true,
      mode: 'create'
    })
  }

  const handleEditTask = (task: Task) => {
    setModalState({
      open: true,
      mode: 'edit',
      task
    })
  }

  const handleViewTask = (task: Task) => {
    setModalState({
      open: true,
      mode: 'view',
      task
    })
  }

  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create'
    })
  }

  // Task operations
  const handleSaveTask = async (taskData: CreateTaskRequest) => {
    try {
      await createNewTask(taskData)
      toast.success(`Tarea creada exitosamente para ${getCompanyDisplayName()}`)
    } catch (error) {
      toast.error('Error al crear la tarea')
      throw error
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<CreateTaskRequest>) => {
    try {
      await updateTaskData(taskId, updates)
      toast.success('Tarea actualizada exitosamente')
    } catch (error) {
      toast.error('Error al actualizar la tarea')
      throw error
    }
  }

  const handleStatusChange = async (taskId: string, status: any, position: number) => {
    try {
      await changeTaskStatus(taskId, status, position)
      // Success toast is handled in the hook to avoid spam
    } catch (error) {
      // Error toast is handled in the hook
      throw error
    }
  }

  const handleDeleteConfirm = (taskId: string) => {
    const task = tasks.find(t => t._id === taskId)
    setDeleteDialog({
      open: true,
      taskId,
      taskTitle: task?.title
    })
  }

  const handleDeleteTask = async () => {
    if (!deleteDialog.taskId) return

    try {
      await removeTask(deleteDialog.taskId)
      setDeleteDialog({ open: false })
      toast.success('Tarea eliminada exitosamente')
    } catch (error) {
      toast.error('Error al eliminar la tarea')
    }
  }

  const handleAddComment = async (taskId: string, comment: string) => {
    try {
      await addComment(taskId, comment)
      // Refresh the current task in modal if it's open
      if (modalState.task?._id === taskId) {
        const updatedTask = tasks.find(t => t._id === taskId)
        if (updatedTask) {
          setModalState(prev => ({ ...prev, task: updatedTask }))
        }
      }
    } catch (error) {
      toast.error('Error al agregar comentario')
      throw error
    }
  }

  const handleCompanyChange = (companySlug: string) => {
    setSelectedCompany(companySlug)
  }

  // Show loading for initial page load
  if (!user) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando...
        </Typography>
      </Backdrop>
    )
  }

  const isGlobalView = selectedCompany === 'all-companies'

  return (
    <Container maxWidth={false} sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 0 }}>
      {/* Header with Company Selector and Nueva Tarea */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🎯 Sistema de Tareas
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CompanySelector
            userRole={(user as any).role}
            userCompany={(user as any).companySlug}
            selectedCompany={selectedCompany}
            onCompanyChange={handleCompanyChange}
          />
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Nueva Tarea
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refetchTasks}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Task Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        users={companyUsers}
        usersLoading={usersLoading}
        totalTasks={tasks.length}
        filteredCount={filteredTasks.length}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TaskBoard
          tasks={filteredTasks}
          tasksByStatus={filteredTasksByStatus}
          loading={loading}
          error={error}
          onCreateTask={handleCreateTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteConfirm}
          onViewTask={handleViewTask}
          onStatusChange={handleStatusChange}
          showCompanyBadge={isGlobalView}
        />
      </Box>

      {/* Task Modal */}
      <TaskModal
        open={modalState.open}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        onAddComment={handleAddComment}
        task={modalState.task}
        mode={modalState.mode}
        loading={loading}
        selectedCompany={selectedCompany}
        availableCompanies={[
          { slug: 'quicklearning', name: 'Quick Learning' },
          { slug: 'test', name: 'Test Company' },
          { slug: 'virtualvoices', name: 'VirtualVoices' }
        ]}
        isGlobalView={isGlobalView}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
      >
        <DialogTitle>
          ⚠️ Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la tarea "{deleteDialog.taskTitle}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteTask} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default TasksPage
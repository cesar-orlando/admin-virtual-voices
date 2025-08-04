import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
  IconButton,
  Autocomplete,
  Grid,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import type { Task, CreateTaskRequest, TaskPriority, TaskStatus } from '../types/tasks'
import { useCompanyUsers } from '../hooks/useTasks'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (taskData: CreateTaskRequest) => Promise<void>
  onUpdate?: (taskId: string, updates: Partial<CreateTaskRequest>) => Promise<void>
  onAddComment?: (taskId: string, comment: string) => Promise<void>
  task?: Task // undefined for create, Task for edit/view
  mode: 'create' | 'edit' | 'view'
  loading?: boolean
  // New props for company selection
  selectedCompany?: string
  availableCompanies?: Array<{ slug: string; name: string }>
  isGlobalView?: boolean
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: '#CCCCCC' },
  { value: 'medium', label: 'Media', color: '#0088FF' },
  { value: 'high', label: 'Alta', color: '#FFAA00' },
  { value: 'urgent', label: 'Urgente', color: '#FF4444' }
]

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'En Revisión' },
  { value: 'done', label: 'Completada' }
]

const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  onAddComment,
  task,
  mode,
  loading = false,
  selectedCompany,
  availableCompanies = [],
  isGlobalView = false
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: [],
    estimatedHours: undefined
  })
  
  const [selectedCompanyForTask, setSelectedCompanyForTask] = useState<string>(
    selectedCompany && selectedCompany !== 'all-companies' ? selectedCompany : 'quicklearning'
  )

  // Get users for the selected company
  const currentCompanyForUsers = mode === 'create' && isGlobalView 
    ? selectedCompanyForTask 
    : selectedCompany && selectedCompany !== 'all-companies' 
      ? selectedCompany 
      : task?.companySlug || 'quicklearning'
      
  const { users, loading: usersLoading, error: usersError } = useCompanyUsers(currentCompanyForUsers)

  console.log('🧑‍💼 TaskModal - Users loading:', {
    currentCompanyForUsers,
    usersCount: users.length,
    usersLoading,
    usersError,
    mode,
    isGlobalView,
    assignedTo: formData.assignedTo,
    sampleUser: users[0],
    allUserIds: users.map(u => u.id)
  })

  const [newTag, setNewTag] = useState('')
  const [newComment, setNewComment] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when task changes
  useEffect(() => {
    if (task && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate || '',
        tags: [...task.tags],
        estimatedHours: task.estimatedHours
      })
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        tags: [],
        estimatedHours: undefined
      })
      // Reset company selection when creating new task
      const defaultCompany = selectedCompany && selectedCompany !== 'all-companies' 
        ? selectedCompany 
        : 'quicklearning'
      setSelectedCompanyForTask(defaultCompany)
    }
    setErrors({})
  }, [task, mode, open, selectedCompany])

  // Update company for task when it changes and clear assignedTo if users change
  useEffect(() => {
    if (mode === 'create' && isGlobalView) {
      setFormData(prev => ({ ...prev, assignedTo: '' }))
    }
  }, [selectedCompanyForTask, mode, isGlobalView])

  const handleInputChange = (field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || [])
  }

  const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      action()
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }

    if (formData.estimatedHours && (formData.estimatedHours < 0 || formData.estimatedHours > 1000)) {
      newErrors.estimatedHours = 'Las horas deben estar entre 0 y 1000'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      if (mode === 'create') {
        await onSave(formData)
      } else if (mode === 'edit' && task && onUpdate) {
        await onUpdate(task._id, formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !onAddComment) return

    try {
      await onAddComment(task._id, newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const isReadOnly = mode === 'view'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {mode === 'create' ? '🆕 Nueva Tarea' : 
             mode === 'edit' ? '✏️ Editar Tarea' : 
             '👁️ Ver Tarea'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                disabled={isReadOnly}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isReadOnly}
                variant="outlined"
              />
            </Grid>

            {/* Priority and Status */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  label="Prioridad"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isReadOnly}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: option.color
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {mode === 'edit' && task && (
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={task.status}
                    label="Estado"
                    disabled // Status is changed via drag & drop
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Company Selection - Only for create mode in global view */}
            {mode === 'create' && isGlobalView && availableCompanies.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>🏢 Empresa para la nueva tarea</InputLabel>
                  <Select
                    value={selectedCompanyForTask}
                    label="🏢 Empresa para la nueva tarea"
                    onChange={(e) => setSelectedCompanyForTask(e.target.value)}
                    disabled={isReadOnly}
                  >
                    {availableCompanies
                      .filter(company => !company.slug.includes('all-companies'))
                      .map((company) => (
                        <MenuItem key={company.slug} value={company.slug}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" />
                            {company.name}
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Los usuarios disponibles se cargarán según la empresa seleccionada
                </Typography>
              </Grid>
            )}

            {/* Assignment and Due Date */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Asignar a</InputLabel>
                <Select
                  value={formData.assignedTo}
                  label="Asignar a"
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  disabled={isReadOnly}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em>Sin asignar</em>
                    }
                    
                    const user = users.find(u => u.id === selected)
                    if (!user) {
                      return <em>Usuario no encontrado</em>
                    }
                    
                    return user.name
                  }}
                >
                  <MenuItem value="">
                    <em>Sin asignar</em>
                  </MenuItem>
                  {usersLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Cargando usuarios...
                    </MenuItem>
                  ) : usersError ? (
                    <MenuItem disabled>
                      <Typography color="error" variant="body2">
                        Error al cargar usuarios
                      </Typography>
                    </MenuItem>
                  ) : users.length === 0 ? (
                    <MenuItem disabled>
                      <Typography color="text.secondary" variant="body2">
                        No hay usuarios disponibles
                      </Typography>
                    </MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {getInitials(user.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.role} - {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <DateTimePicker
                label="Fecha de vencimiento"
                value={formData.dueDate ? new Date(formData.dueDate) : null}
                onChange={(date) => handleInputChange('dueDate', date ? date.toISOString() : '')}
                disabled={isReadOnly}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </Grid>

            {/* Time Tracking */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Horas estimadas"
                value={formData.estimatedHours || ''}
                onChange={(e) => handleInputChange('estimatedHours', e.target.value ? Number(e.target.value) : undefined)}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours}
                disabled={isReadOnly}
                inputProps={{ min: 0, max: 1000, step: 0.5 }}
              />
            </Grid>

            {mode === 'edit' && task?.actualHours && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Horas reales"
                  value={task.actualHours}
                  disabled
                  helperText="Se actualiza automáticamente"
                />
              </Grid>
            )}

            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Etiquetas
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.tags?.map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag}`}
                    onDelete={isReadOnly ? undefined : () => handleRemoveTag(tag)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              {!isReadOnly && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Nueva etiqueta"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                  />
                  <Button
                    size="small"
                    onClick={handleAddTag}
                    startIcon={<AddIcon />}
                  >
                    Agregar
                  </Button>
                </Box>
              )}
            </Grid>

            {/* Comments Section - Only for edit/view mode */}
            {(mode === 'edit' || mode === 'view') && task && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CommentIcon />
                    Comentarios ({task.comments.length})
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {task.comments.length === 0 ? (
                      <ListItem>
                        <ListItemText 
                          primary="No hay comentarios"
                          secondary="¡Sé el primero en comentar!"
                        />
                      </ListItem>
                    ) : (
                      task.comments.map((comment) => (
                        <ListItem key={comment._id} alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                              {getInitials(comment.authorName)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">
                                  {comment.authorName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                                </Typography>
                              </Box>
                            }
                            secondary={comment.text}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Grid>

                {/* Add Comment */}
                {onAddComment && !isReadOnly && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        maxRows={3}
                        placeholder="Agregar un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleAddComment()
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        startIcon={<SendIcon />}
                      >
                        Enviar
                      </Button>
                    </Box>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          {!isReadOnly && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear Tarea' : 'Guardar Cambios'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default TaskModal
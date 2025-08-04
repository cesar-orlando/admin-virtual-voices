import React, { useState } from 'react'
import {
  Box,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
  Typography,
  Button,
  Stack,
  Collapse,
  IconButton,
  Badge
} from '@mui/material'
import {
  Search as SearchIcon,
  AccessTime as OverdueIcon,
  LocalOffer as TagIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material'
import type { TaskFilters, TaskPriority, TaskStatus } from '../types/tasks'

interface User {
  id: string
  name: string
  email: string
}

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  users: User[]
  usersLoading: boolean
  totalTasks: number
  filteredCount: number
}

const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  users,
  usersLoading,
  totalTasks,
  filteredCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const handleFilterChange = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: undefined,
      priority: undefined,
      assignedTo: undefined,
      isOverdue: undefined,
      tags: undefined,
      companySlug: filters.companySlug // Keep company filter
    })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.assignedTo ||
    filters.isOverdue ||
    filters.tags
  )

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.assignedTo,
    filters.isOverdue,
    filters.tags
  ].filter(Boolean).length

  return (
    <Paper elevation={1} sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Collapsible Header */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={activeFiltersCount} color="primary" invisible={!hasActiveFilters}>
            <FilterListIcon color={hasActiveFilters ? 'primary' : 'action'} />
          </Badge>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Filtros de Tareas
            {hasActiveFilters && (
              <Chip 
                label={`${filteredCount} de ${totalTasks}`}
                color="primary" 
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={(e) => {
                e.stopPropagation()
                clearAllFilters()
              }}
              sx={{ mr: 1 }}
            >
              Limpiar
            </Button>
          )}
          <IconButton
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 3, pt: 0 }}>
          {/* Filter Controls */}

          <Grid container spacing={2}>
        {/* Search by Title/Description/Tags */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Buscar tareas o tags"
            placeholder="ej: #mitsubishi, marketing, bug..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Filter by Assigned User */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Asignado a</InputLabel>
            <Select
              value={filters.assignedTo || ''}
              label="Asignado a"
              onChange={(e) => handleFilterChange('assignedTo', e.target.value || undefined)}
              startAdornment={
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <em>Todos los usuarios</em>
              </MenuItem>
              {usersLoading ? (
                <MenuItem disabled>Cargando usuarios...</MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Filter by Priority */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={filters.priority || ''}
              label="Prioridad"
              onChange={(e) => handleFilterChange('priority', e.target.value as TaskPriority || undefined)}
            >
              <MenuItem value="">
                <em>Todas</em>
              </MenuItem>
              <MenuItem value="urgent">🔴 Urgente</MenuItem>
              <MenuItem value="high">🟠 Alta</MenuItem>
              <MenuItem value="medium">🟡 Media</MenuItem>
              <MenuItem value="low">🟢 Baja</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Filter by Status */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status || ''}
              label="Estado"
              onChange={(e) => handleFilterChange('status', e.target.value as TaskStatus || undefined)}
            >
              <MenuItem value="">
                <em>Todos los estados</em>
              </MenuItem>
              <MenuItem value="todo">📋 Por Hacer</MenuItem>
              <MenuItem value="in_progress">⏳ En Progreso</MenuItem>
              <MenuItem value="review">👀 Revisión</MenuItem>
              <MenuItem value="done">✅ Completado</MenuItem>
            </Select>
          </FormControl>
        </Grid>
          </Grid>

          {/* Quick Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant={filters.isOverdue ? 'contained' : 'outlined'}
          color="error"
          size="small"
          startIcon={<OverdueIcon />}
          onClick={() => handleFilterChange('isOverdue', filters.isOverdue ? undefined : true)}
        >
          🚨 Vencidas
        </Button>
        
        <Button
          variant={filters.assignedTo === 'unassigned' ? 'contained' : 'outlined'}
          color="secondary"
          size="small"
          startIcon={<PersonIcon />}
          onClick={() => handleFilterChange('assignedTo', filters.assignedTo === 'unassigned' ? undefined : 'unassigned')}
        >
          Sin Asignar
        </Button>

        <Button
          variant={filters.priority === 'urgent' ? 'contained' : 'outlined'}
          color="error"
          size="small"
          onClick={() => handleFilterChange('priority', filters.priority === 'urgent' ? undefined : 'urgent')}
        >
          🔴 Urgentes
            </Button>
          </Stack>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Filtros activos:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {filters.search && (
              <Chip
                icon={<SearchIcon />}
                label={`Búsqueda: "${filters.search}"`}
                size="small"
                onDelete={() => handleFilterChange('search', '')}
              />
            )}
            {filters.assignedTo && (
              <Chip
                icon={<PersonIcon />}
                label={`Usuario: ${users.find(u => u.id === filters.assignedTo)?.name || 'Desconocido'}`}
                size="small"
                onDelete={() => handleFilterChange('assignedTo', undefined)}
              />
            )}
            {filters.isOverdue && (
              <Chip
                icon={<OverdueIcon />}
                label="Vencidas"
                size="small"
                color="error"
                onDelete={() => handleFilterChange('isOverdue', undefined)}
              />
            )}
            {filters.priority && (
              <Chip
                label={`Prioridad: ${filters.priority}`}
                size="small"
                onDelete={() => handleFilterChange('priority', undefined)}
              />
            )}
            {filters.status && (
              <Chip
                label={`Estado: ${filters.status}`}
                size="small"
                onDelete={() => handleFilterChange('status', undefined)}
              />
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default TaskFiltersComponent
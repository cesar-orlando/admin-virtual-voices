import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import TaskColumn from './TaskColumn'
import type { Task, TaskStatus, TasksByStatus } from '../types/tasks'

interface TaskBoardProps {
  tasks: Task[]
  tasksByStatus: TasksByStatus
  loading: boolean
  error: string | null
  onCreateTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onViewTask: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus, position: number) => Promise<void>
  showCompanyBadge?: boolean
}

const statusConfig = {
  todo: { 
    title: 'Por Hacer', 
    color: '#1976d2', 
    bgColor: '#e3f2fd',
    icon: '📋' 
  },
  in_progress: { 
    title: 'En Progreso', 
    color: '#ed6c02', 
    bgColor: '#fff4e6',
    icon: '🔄' 
  },
  review: { 
    title: 'En Revisión', 
    color: '#9c27b0', 
    bgColor: '#f3e5f5',
    icon: '👁️' 
  },
  done: { 
    title: 'Completadas', 
    color: '#2e7d32', 
    bgColor: '#e8f5e8',
    icon: '✅' 
  }
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  tasksByStatus,
  loading,
  error,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onViewTask,
  onStatusChange,
  showCompanyBadge = false
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t._id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t._id === activeId)
    if (!activeTask) return

    // Check if we're dropping on a column or another task
    const isOverColumn = overId.startsWith('column-')
    const newStatus = isOverColumn 
      ? overId.replace('column-', '') as TaskStatus
      : tasks.find(t => t._id === overId)?.status

    if (!newStatus) return

    // If status hasn't changed and we're not reordering within the same column, do nothing
    if (activeTask.status === newStatus && activeId === overId) return

    // Calculate new position
    const targetColumnTasks = tasksByStatus[newStatus]
    let newPosition = 0

    if (!isOverColumn) {
      // Dropping on another task - find position
      const overTask = tasks.find(t => t._id === overId)
      if (overTask) {
        const overIndex = targetColumnTasks.findIndex(t => t._id === overTask._id)
        newPosition = overIndex
      }
    } else {
      // Dropping on column - add to end
      newPosition = targetColumnTasks.length
    }

    try {
      await onStatusChange(activeId, newStatus, newPosition)
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando tareas...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats */}
      <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          📈 Stats:
        </Typography>
        <Chip 
          label={`${tasks.length} total`}
          size="small"
          variant="outlined"
        />
        {tasks.filter(t => t.isOverdue).length > 0 && (
          <Chip 
            label={`${tasks.filter(t => t.isOverdue).length} vencidas`}
            size="small"
            color="error"
            variant="filled"
          />
        )}
        <Chip 
          label={`${tasksByStatus.in_progress.length} en progreso`}
          size="small"
          sx={{ backgroundColor: statusConfig.in_progress.bgColor }}
        />
      </Box>

      <Divider />

      {/* Kanban Board */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: 2,
            p: 2,
            height: '100%',
            overflow: 'auto'
          }}>
            {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
              <TaskColumn
                key={status}
                status={status}
                title={statusConfig[status].title}
                icon={statusConfig[status].icon}
                color={statusConfig[status].color}
                bgColor={statusConfig[status].bgColor}
                tasks={tasksByStatus[status]}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onViewTask={onViewTask}
                showCompanyBadge={showCompanyBadge}
              />
            ))}
          </Box>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onView={onViewTask}
                showCompanyBadge={showCompanyBadge}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    </Box>
  )
}

export default TaskBoard
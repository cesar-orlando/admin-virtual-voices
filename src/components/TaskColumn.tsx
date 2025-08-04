import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip
} from '@mui/material'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import type { Task, TaskStatus } from '../types/tasks'

interface TaskColumnProps {
  status: TaskStatus
  title: string
  icon: string
  color: string
  bgColor: string
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onViewTask: (task: Task) => void
  showCompanyBadge?: boolean
}

const SortableTaskCard: React.FC<{
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onView: (task: Task) => void
  showCompanyBadge?: boolean
}> = ({ task, onEdit, onDelete, onView, showCompanyBadge }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        showCompanyBadge={showCompanyBadge}
      />
    </div>
  )
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  title,
  icon,
  color,
  bgColor,
  tasks,
  onEditTask,
  onDeleteTask,
  onViewTask,
  showCompanyBadge = false
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  })

  return (
    <Paper 
      ref={setNodeRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? bgColor : 'background.paper',
        border: isOver ? `2px dashed ${color}` : '1px solid',
        borderColor: isOver ? color : 'divider',
        transition: 'all 0.2s ease-in-out',
        minHeight: 400
      }}
    >
      {/* Column Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {icon} {title}
          </Typography>
        </Box>
        <Chip 
          label={tasks.length}
          size="small"
          sx={{ 
            backgroundColor: color,
            color: 'white',
            fontWeight: 'bold',
            minWidth: 24
          }}
        />
      </Box>

      {/* Tasks Container */}
      <Box sx={{ 
        flex: 1, 
        p: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 3,
        },
      }}>
        <SortableContext 
          items={tasks.map(task => task._id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <Box sx={{ 
              p: 3, 
              textAlign: 'center', 
              color: 'text.secondary',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.default'
            }}>
              <Typography variant="body2">
                No hay tareas
              </Typography>
              <Typography variant="caption">
                Arrastra una tarea aquí
              </Typography>
            </Box>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onView={onViewTask}
                showCompanyBadge={showCompanyBadge}
              />
            ))
          )}
        </SortableContext>
      </Box>
    </Paper>
  )
}

export default TaskColumn
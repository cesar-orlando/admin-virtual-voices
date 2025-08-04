import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material'
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  AccessTime as TimeIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Task, TaskPriority } from '../types/tasks'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onView?: (task: Task) => void
  showCompanyBadge?: boolean
  isDragging?: boolean
}

// Priority colors and labels
const priorityConfig: Record<TaskPriority, { color: string; label: string; bgColor: string }> = {
  urgent: { color: '#FF4444', label: 'Urgente', bgColor: '#FFEBEE' },
  high: { color: '#FFAA00', label: 'Alta', bgColor: '#FFF8E1' },
  medium: { color: '#0088FF', label: 'Media', bgColor: '#E3F2FD' },
  low: { color: '#CCCCCC', label: 'Baja', bgColor: '#F5F5F5' }
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onView,
  showCompanyBadge = false,
  isDragging = false
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    onEdit?.(task)
  }

  const handleDelete = () => {
    handleMenuClose()
    onDelete?.(task._id)
  }

  const handleView = () => {
    handleMenuClose()
    onView?.(task)
  }

  const priorityInfo = priorityConfig[task.priority]
  const isOverdue = task.isOverdue && task.status !== 'done'
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isValidDueDate = dueDate && isValid(dueDate)

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card 
      sx={{
        mb: 1,
        cursor: 'grab',
        borderLeft: `4px solid ${priorityInfo.color}`,
        backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'white',
        transform: isDragging ? 'rotate(5deg)' : 'none',
        boxShadow: isDragging ? 4 : 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        },
        ...(isOverdue && {
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: `0 0 0 0 ${priorityInfo.color}40` },
            '70%': { boxShadow: `0 0 0 10px ${priorityInfo.color}00` },
            '100%': { boxShadow: `0 0 0 0 ${priorityInfo.color}00` }
          }
        })
      }}
      onClick={() => onView?.(task)}
    >
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        {/* Header with priority and menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip
            label={priorityInfo.label}
            size="small"
            sx={{
              backgroundColor: priorityInfo.bgColor,
              color: priorityInfo.color,
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ ml: 1, p: 0.5 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Company badge for global view */}
        {showCompanyBadge && task.companySlug !== 'all-companies' && (
          <Chip
            label={task.companySlug}
            size="small"
            variant="outlined"
            sx={{ mb: 1, fontSize: '0.7rem' }}
          />
        )}

        {/* Title */}
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            mb: 1, 
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {task.title}
        </Typography>

        {/* Description */}
        {task.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.8rem'
            }}
          >
            {task.description}
          </Typography>
        )}

        {/* Assigned user */}
        {task.assignedToName && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{ 
                width: 20, 
                height: 20, 
                mr: 1, 
                fontSize: '0.7rem',
                bgcolor: 'primary.main'
              }}
            >
              {getInitials(task.assignedToName)}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {task.assignedToName}
            </Typography>
          </Box>
        )}

        {/* Due date */}
        {isValidDueDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ fontSize: 14, mr: 0.5, color: isOverdue ? 'error.main' : 'text.secondary' }} />
            <Typography 
              variant="caption" 
              color={isOverdue ? 'error.main' : 'text.secondary'}
              sx={{ fontWeight: isOverdue ? 'bold' : 'normal' }}
            >
              {format(dueDate!, 'dd/MM/yyyy', { locale: es })}
              {isOverdue && ' (Vencida)'}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <Box sx={{ mb: 1 }}>
            {task.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5, 
                  fontSize: '0.6rem', 
                  height: 18,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            ))}
            {task.tags.length > 3 && (
              <Chip
                label={`+${task.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.6rem', 
                  height: 18,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Box>
        )}

        {/* Time tracking */}
        {(task.estimatedHours || task.actualHours) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {task.estimatedHours && `${task.estimatedHours}h est.`}
              {task.actualHours && ` / ${task.actualHours}h real`}
            </Typography>
          </Box>
        )}

        {/* Footer with comments and attachments */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.comments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CommentIcon sx={{ fontSize: 12, mr: 0.3, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {task.comments.length}
                </Typography>
              </Box>
            )}
            {task.attachments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachFileIcon sx={{ fontSize: 12, mr: 0.3, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {task.attachments.length}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Days until due */}
          {task.daysUntilDue !== undefined && task.daysUntilDue >= 0 && task.status !== 'done' && (
            <Typography 
              variant="caption" 
              color={task.daysUntilDue <= 1 ? 'error.main' : 'text.secondary'}
              sx={{ fontWeight: task.daysUntilDue <= 1 ? 'bold' : 'normal' }}
            >
              {task.daysUntilDue === 0 ? 'Hoy' : `${task.daysUntilDue}d`}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  )
}

export default TaskCard
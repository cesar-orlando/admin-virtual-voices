import React from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material'
import type { NotificationState, NotificationType } from '../../types'

interface NotificationPanelProps {
  notifications: NotificationState[]
  isVisible: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onRemove: (id: string) => void
  onClearAll: () => void
  theme: any // TODO: Type this properly
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <SuccessIcon sx={{ color: '#4CAF50' }} />
    case 'error':
      return <ErrorIcon sx={{ color: '#f44336' }} />
    case 'warning':
      return <WarningIcon sx={{ color: '#ff9800' }} />
    case 'info':
    default:
      return <InfoIcon sx={{ color: '#2196f3' }} />
  }
}

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'success':
      return '#4CAF50'
    case 'error':
      return '#f44336'
    case 'warning':
      return '#ff9800'
    case 'info':
    default:
      return '#2196f3'
  }
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}d`
}

export function NotificationPanel({
  notifications,
  isVisible,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onClearAll,
  theme
}: NotificationPanelProps) {
  if (!isVisible) return null

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 2000,
        width: 380,
        maxHeight: 500,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} nuevas`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
        
        {/* Action buttons */}
        {notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={onMarkAllAsRead}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  fontSize: '0.75rem',
                }}
              >
                Marcar todas como leídas
              </Button>
            )}
            <Button
              size="small"
              onClick={onClearAll}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                fontSize: '0.75rem',
              }}
            >
              Limpiar todo
            </Button>
          </Box>
        )}
      </Box>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No hay notificaciones
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.isRead ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.isRead ? 400 : 600,
                          color: getNotificationColor(notification.type),
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, fontSize: '0.875rem' }}
                    >
                      {notification.message}
                    </Typography>
                  }
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                  {!notification.isRead && (
                    <IconButton
                      size="small"
                      onClick={() => onMarkAsRead(notification.id)}
                      title="Marcar como leída"
                    >
                      <MarkReadIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onRemove(notification.id)}
                    title="Eliminar"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  )
}
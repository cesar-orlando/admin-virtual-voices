import React from 'react'
import {
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Badge,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material'

interface Notification {
  id: number | string
  text: string
  type?: 'info' | 'warning' | 'error' | 'success'
  isRead?: boolean
  timestamp?: Date
}

interface NotificationPanelProps {
  notifications: Notification[]
  isVisible: boolean
  onMarkAsRead: (id: number | string) => void
  onMarkAllAsRead: () => void
  onRemove: (id: number | string) => void
  onClearAll: () => void
  theme: any
}

// Componente de notificación individual
function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  theme
}: {
  notification: Notification
  onMarkAsRead: (id: number | string) => void
  onRemove: (id: number | string) => void
  theme: any
}) {
  return (
    <ListItem
      disablePadding
      sx={{
        mb: 0.5,
        bgcolor: notification.isRead
          ? 'transparent'
          : theme.palette.mode === 'dark'
            ? 'rgba(139, 92, 246, 0.1)'
            : 'rgba(139, 92, 246, 0.05)',
        borderRadius: 1,
        border: notification.isRead
          ? 'none'
          : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
        transition: 'all 0.2s ease-out',
      }}
    >
      <ListItemButton
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
        sx={{
          px: 2,
          py: 1,
          borderRadius: 1,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.02)',
          },
        }}
      >
        <Badge
          variant="dot"
          invisible={notification.isRead}
          sx={{
            '& .MuiBadge-dot': {
              backgroundColor: '#E05EFF',
              width: 8,
              height: 8,
              borderRadius: '50%',
              mr: 1,
            },
          }}
        >
          <ListItemText
            primary={notification.text}
            secondary={notification.timestamp?.toLocaleString()}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: notification.isRead ? 400 : 600,
              color: notification.isRead
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
              sx: { 
                fontSize: { xs: '0.875rem', md: '0.875rem' },
                lineHeight: 1.4
              }
            }}
            secondaryTypographyProps={{
              variant: 'caption',
              color: theme.palette.text.disabled,
              sx: { 
                fontSize: { xs: '0.75rem', md: '0.75rem' }
              }
            }}
          />
        </Badge>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(notification.id)
          }}
          sx={{
            ml: 1,
            color: theme.palette.text.secondary,
            '&:hover': {
              color: '#E05EFF',
              bgcolor: 'rgba(224, 94, 255, 0.1)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </ListItemButton>
    </ListItem>
  )
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  if (!isVisible) return null

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Calcular dimensiones responsivas
  const getWidth = () => {
    if (isMobile) return 'calc(100vw - 32px)'
    if (isTablet) return 320
    return 380
  }

  const getMaxHeight = () => {
    if (isMobile) return 'calc(100vh - 160px)'
    return 500
  }

  const getPosition = () => {
    if (isMobile) {
      return {
        top: 80,
        left: 16,
        right: 16,
        width: 'auto'
      }
    }
    return {
      top: 80,
      right: 16,
      width: getWidth()
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        ...getPosition(),
        zIndex: 2000,
        maxHeight: getMaxHeight(),
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: { xs: 2, md: 2 },
        boxShadow: isMobile 
          ? '0 4px 24px rgba(0, 0, 0, 0.15)'
          : '0 8px 32px rgba(139, 92, 246, 0.2)',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            sx={{ fontWeight: 600 }}
          >
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} nuevas`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                height: { xs: 20, md: 24 }
              }}
            />
          )}
        </Box>
        
        {/* Action buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, md: 1 }, 
          mt: { xs: 1, md: 1.5 },
          flexWrap: 'wrap'
        }}>
          {unreadCount > 0 && (
            <Button
              size={isMobile ? "small" : "small"}
              startIcon={<MarkEmailReadIcon fontSize="small" />}
              onClick={onMarkAllAsRead}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                px: { xs: 1, md: 1.5 },
                py: 0.5,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {isMobile ? 'Leer' : 'Marcar leídas'}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              size={isMobile ? "small" : "small"}
              startIcon={<ClearAllIcon fontSize="small" />}
              onClick={onClearAll}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                px: { xs: 1, md: 1.5 },
                py: 0.5,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {isMobile ? 'Limpiar' : 'Limpiar todo'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          overflowY: 'auto',
          maxHeight: isMobile ? 'calc(100vh - 200px)' : 350,
          p: { xs: 1, md: 1.5 },
        }}
      >
        {notifications.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 3, md: 4 },
              color: theme.palette.text.secondary,
            }}
          >
            <NotificationsIcon
              sx={{
                fontSize: { xs: 32, md: 40 },
                mb: 1,
                opacity: 0.5,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onRemove={onRemove}
                theme={theme}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  )
}
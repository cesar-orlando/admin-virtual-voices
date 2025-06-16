import { useState, useCallback } from 'react'
import type { NotificationState, NotificationType } from '../types'

interface UseNotificationsReturn {
  notifications: NotificationState[]
  addNotification: (type: NotificationType, title: string, message: string) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  unreadCount: number
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationState[]>([
    {
      id: '1',
      type: 'info' as const,
      title: 'Bienvenido',
      message: 'Sistema iniciado correctamente',
      timestamp: new Date(),
      isRead: false
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Nueva funcionalidad',
      message: 'Sistema de notificaciones implementado',
      timestamp: new Date(),
      isRead: false
    }
  ])

  const addNotification = useCallback((
    type: NotificationType, 
    title: string, 
    message: string
  ) => {
    const newNotification: NotificationState = {
      id: `notification-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false
    }

    setNotifications((prev: NotificationState[]) => [newNotification, ...prev])

    // Auto-remove after 5 seconds for success notifications
    if (type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev: NotificationState[]) => 
      prev.filter((notification: NotificationState) => notification.id !== id)
    )
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev: NotificationState[]) =>
      prev.map((notification: NotificationState) =>
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev: NotificationState[]) =>
      prev.map((notification: NotificationState) => ({
        ...notification,
        isRead: true
      }))
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n: NotificationState) => !n.isRead).length

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount
  }
}
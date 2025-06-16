import { useState, useCallback } from 'react'
import type { NotificationState } from '../types'
import { NotificationType } from '../types'

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
      type: NotificationType.INFO,
      title: 'Bienvenido',
      message: 'Sistema iniciado correctamente',
      timestamp: new Date(),
      isRead: false
    },
    {
      id: '2',
      type: NotificationType.SUCCESS,
      title: 'Nueva funcionalidad',
      message: 'Sistema de notificaciones implementado',
      timestamp: new Date(),
      isRead: false
    }
  ])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev: NotificationState[]) => 
      prev.filter((notification: NotificationState) => notification.id !== id)
    )
  }, [])

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
    if (type === NotificationType.SUCCESS) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }, [removeNotification])

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
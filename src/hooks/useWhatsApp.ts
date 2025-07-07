import { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import type { WhatsAppSession, WhatsAppSocketData, UserProfile } from '../types'
import { SessionStatus } from '../types'
import { fetchSessions, requestNewQr } from '../api/servicios'
import { toast } from 'react-toastify'

interface UseWhatsAppReturn {
  sessions: WhatsAppSession[]
  qrCode: string
  isLoading: boolean
  error: string | null
  requestQR: (sessionName: string) => Promise<void>
  refreshSessions: () => Promise<void>
  removeSession: (sessionId: string) => void
}

export function useWhatsApp(user: UserProfile): UseWhatsAppReturn {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedSessions = await fetchSessions(user)
      setSessions(fetchedSessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar sesiones'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Inicializar socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    const socketInstance = io(socketUrl)

    console.log('useWhatsApp - Socket URL:', socketUrl);
    console.log('useWhatsApp - User companySlug:', user.companySlug);
    console.log('useWhatsApp - User id:', user.id);
    console.log('useWhatsApp - Listening for QR event:', `whatsapp-qr-${user.companySlug}-${user.id}`);

    // Debug: eventos de conexión
    socketInstance.on('connect', () => {
      console.log('useWhatsApp - Socket connected successfully');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('useWhatsApp - Socket connection error:', error);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('useWhatsApp - Socket disconnected:', reason);
    });

    // Escuchar eventos de QR específicos para el usuario
    const qrEventName = `whatsapp-qr-${user.companySlug}-${user.id}`
    socketInstance.on(qrEventName, (data: WhatsAppSocketData) => {
      if (data.qr) {
        setQrCode(data.qr)
      }
      if (data.message) {
        toast.info(data.message)
      }
    })

    // Escuchar cambios de estado de sesión
    socketInstance.on('whatsapp-status-change', (data: WhatsAppSocketData) => {
      setSessions((prev: WhatsAppSession[]) => 
        prev.map((session: WhatsAppSession) => 
          session._id === data.sessionId 
            ? { ...session, status: data.status }
            : session
        )
      )
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [user.companySlug, user.id])

  // Cargar sesiones al inicializar
  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  const requestQR = useCallback(async (sessionName: string) => {
    if (!sessionName.trim()) {
      toast.warning('Por favor ingresa un nombre para la sesión')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await requestNewQr(sessionName, user)
      
      // Agregar sesión temporal mientras se conecta
      const tempSession: WhatsAppSession = {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        name: sessionName,
        user: { name: user.name, id: user.id },
        status: SessionStatus.PENDING,
        createdAt: new Date().toISOString()
      }
      setSessions((prev: WhatsAppSession[]) => [...prev, tempSession])
      
      toast.success('QR solicitado correctamente')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al solicitar QR'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const removeSession = useCallback((sessionId: string) => {
    setSessions((prev: WhatsAppSession[]) => 
      prev.filter((session: WhatsAppSession) => session._id !== sessionId)
    )
    toast.success('Sesión eliminada')
  }, [])

  return {
    sessions,
    qrCode,
    isLoading,
    error,
    requestQR,
    refreshSessions,
    removeSession
  }
}
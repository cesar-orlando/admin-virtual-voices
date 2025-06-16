import { useState, useCallback } from 'react'
import type { ApiResponse, ErrorState, LoadingState } from '../types'

interface UseApiState<T> {
  data: T | null
  loading: LoadingState
  error: ErrorState
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: { isLoading: false },
    error: { hasError: false }
  })

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setState((prev: UseApiState<T>) => ({
      ...prev,
      loading: { isLoading: true, message: 'Cargando...' },
      error: { hasError: false }
    }))

    try {
      const response = await apiFunction(...args)
      
      if (response.success && response.data) {
        const data = response.data
        setState((prev: UseApiState<T>) => ({
          ...prev,
          data,
          loading: { isLoading: false },
          error: { hasError: false }
        }))
        return data
      } else {
        setState((prev: UseApiState<T>) => ({
          ...prev,
          loading: { isLoading: false },
          error: { 
            hasError: true, 
            message: response.message || 'Error desconocido',
            code: response.statusCode?.toString()
          }
        }))
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setState((prev: UseApiState<T>) => ({
        ...prev,
        loading: { isLoading: false },
        error: { hasError: true, message: errorMessage }
      }))
      return null
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: { isLoading: false },
      error: { hasError: false }
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}
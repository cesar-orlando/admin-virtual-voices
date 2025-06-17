import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from '../useApi'
import type { ApiResponse } from '../../types'

// Mock API function
const mockApiFunction = vi.fn()

describe('useApi', () => {
  beforeEach(() => {
    mockApiFunction.mockClear()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useApi(mockApiFunction))

    expect(result.current.data).toBeNull()
    expect(result.current.loading.isLoading).toBe(false)
    expect(result.current.error.hasError).toBe(false)
  })

  it('should handle successful API call', async () => {
    const mockResponse: ApiResponse<string> = {
      success: true,
      data: 'test data',
      message: 'Success'
    }
    mockApiFunction.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useApi<string>(mockApiFunction))

    await act(async () => {
      const response = await result.current.execute('test-param')
      expect(response).toBe('test data')
    })

    expect(result.current.data).toBe('test data')
    expect(result.current.loading.isLoading).toBe(false)
    expect(result.current.error.hasError).toBe(false)
    expect(mockApiFunction).toHaveBeenCalledWith('test-param')
  })

  it('should handle API error response', async () => {
    const mockResponse: ApiResponse = {
      success: false,
      message: 'API Error',
      statusCode: 400
    }
    mockApiFunction.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      const response = await result.current.execute()
      expect(response).toBeNull()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading.isLoading).toBe(false)
    expect(result.current.error.hasError).toBe(true)
    expect(result.current.error.message).toBe('API Error')
    expect(result.current.error.code).toBe('400')
  })

  it('should handle network error', async () => {
    const networkError = new Error('Network Error')
    mockApiFunction.mockRejectedValueOnce(networkError)

    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      const response = await result.current.execute()
      expect(response).toBeNull()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading.isLoading).toBe(false)
    expect(result.current.error.hasError).toBe(true)
    expect(result.current.error.message).toBe('Network Error')
  })

  it('should set loading state during API call', async () => {
    mockApiFunction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: 'test' }), 100))
    )

    const { result } = renderHook(() => useApi(mockApiFunction))

    act(() => {
      result.current.execute()
    })

    expect(result.current.loading.isLoading).toBe(true)
    expect(result.current.loading.message).toBe('Cargando...')
  })

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useApi(mockApiFunction))

    // Set some state first
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading.isLoading).toBe(false)
    expect(result.current.error.hasError).toBe(false)
  })
})
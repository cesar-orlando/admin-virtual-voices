import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Definir los handlers para las APIs
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:3001/api/users/login', async () => {
    return HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      c_name: 'test-company',
      token: 'mock-jwt-token'
    })
  }),

  http.post('http://localhost:3001/api/users/register', async () => {
    return HttpResponse.json({
      id: '2',
      name: 'New User',
      email: 'new@example.com',
      c_name: 'new-company',
      token: 'new-mock-jwt-token'
    })
  }),

  // WhatsApp endpoints
  http.get('http://localhost:3001/api/whatsapp/sessions', async () => {
    return HttpResponse.json([
      {
        _id: '1',
        name: 'Test Session',
        user: { name: 'Test User' },
        IA: { id: '1', name: 'Test AI' }
      }
    ])
  }),

  http.post('http://localhost:3001/api/whatsapp/request-qr', async () => {
    return HttpResponse.json({
      success: true,
      message: 'QR code requested successfully'
    })
  }),

  // AI Config endpoints
  http.get('http://localhost:3001/api/ai/configs', async () => {
    return HttpResponse.json([
      {
        _id: '1',
        name: 'Test AI',
        welcomeMessage: 'Welcome!',
        objective: 'Help users',
        customPrompt: 'Be helpful'
      }
    ])
  }),

  http.put('http://localhost:3001/api/ai/config', async () => {
    return HttpResponse.json({
      success: true,
      message: 'AI config updated'
    })
  }),
]

// Configurar el servidor
export const server = setupServer(...handlers)
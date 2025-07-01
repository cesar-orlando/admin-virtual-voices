import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  sendTwilioMessage,
  sendTwilioTemplate,
  getTwilioStatus,
  getTwilioHistory,
  getQuickLearningDashboardStats,
  toggleChatAI,
  assignChatAdvisor,
  getChatByPhone,
  updateChatCustomerInfo,
  updateChatStatus
} from '../api/servicios/quickLearningTwilioServices';
import type {
  TwilioSendRequest,
  TwilioTemplateRequest,
  TwilioStatus,
  TwilioHistoryResponse,
  QuickLearningDashboardStats,
  QuickLearningChat,
  TwilioMessage
} from '../types/quicklearning';

// Mock data
const mockTwilioStatus: TwilioStatus = {
  service: 'twilio',
  status: 'active',
  twilioAccountSid: 'AC5f21ea4eaf1c576c0d13fca789f63a5d',
  twilioPhoneNumber: '+5213341610750',
  lastWebhookReceived: new Date().toISOString(),
  messagesCount: {
    today: 15,
    thisWeek: 87,
    thisMonth: 324,
    total: 1205
  },
  aiResponses: {
    successful: 95,
    failed: 3,
    averageResponseTime: 1.2
  },
  activeChats: 12,
  errors: []
};

const mockDashboardStats: QuickLearningDashboardStats = {
  totalChats: 145,
  activeChats: 12,
  messagesThisWeek: 87,
  averageResponseTime: 1.2,
  conversionRate: 0.23,
  topCities: [
    { city: 'Guadalajara', count: 45 },
    { city: 'CDMX', count: 32 },
    { city: 'Monterrey', count: 28 }
  ],
  aiPerformance: {
    totalQueries: 324,
    successfulResponses: 312,
    averageProcessingTime: 0.8
  }
};

const mockActiveChats: QuickLearningChat[] = [
  {
    _id: '64a7b1f4c9e1b2a3d4e5f6g7',
    phone: '+5214521311888',
    profileName: 'Juan Pérez',
    messages: [],
    linkedTable: {
      refModel: 'prospectos',
      refId: '64a7b1f4c9e1b2a3d4e5f6g8'
    },
    aiEnabled: true,
    status: 'active',
    customerInfo: {
      name: 'Juan Pérez',
      email: 'juan@email.com',
      city: 'Guadalajara',
      stage: 'prospecto'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '64a7b1f4c9e1b2a3d4e5f6g9',
    phone: '+5218765432100',
    profileName: 'María González',
    messages: [],
    linkedTable: {
      refModel: 'prospectos',
      refId: '64a7b1f4c9e1b2a3d4e5f6h0'
    },
    aiEnabled: false,
    status: 'active',
    customerInfo: {
      name: 'María González',
      city: 'CDMX',
      stage: 'interesado'
    },
    advisor: {
      id: 'advisor1',
      name: 'Ana Martínez'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockHistoryResponse: TwilioHistoryResponse = {
  messages: [
    {
      _id: 'msg1',
      from: '+5214521311888',
      to: '+5213341610750',
      body: '¡Hola! Quiero información sobre cursos de inglés',
      direction: 'inbound',
      status: 'delivered',
      timestamp: new Date().toISOString(),
      messageType: 'text',
      twilioSid: 'SM1234567890abcdef'
    },
    {
      _id: 'msg2',
      from: '+5213341610750',
      to: '+5214521311888',
      body: '¡Hola Juan! Soy NatalIA, tu asesora de Quick Learning. Te puedo ayudar con información sobre nuestros cursos...',
      direction: 'outbound',
      status: 'delivered',
      timestamp: new Date().toISOString(),
      messageType: 'text',
      twilioSid: 'SM0987654321fedcba'
    }
  ],
  total: 2,
  limit: 10,
  offset: 0,
  hasMore: false
};

// Setup MSW server
const server = setupServer(
  // Send message endpoint
  http.post('http://localhost:3001/api/quicklearning/twilio/send', async ({ request }) => {
    const body = await request.json() as TwilioSendRequest;
    
    if (!body.phone || !body.message) {
      return HttpResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      messageId: 'SM1234567890abcdef',
      status: 'sent',
      phone: body.phone,
      message: body.message
    });
  }),

  // Send template endpoint
  http.post('http://localhost:3001/api/quicklearning/twilio/send-template', async ({ request }) => {
    const body = await request.json() as TwilioTemplateRequest;
    
    if (!body.phone || !body.templateId) {
      return HttpResponse.json(
        { error: 'Phone and templateId are required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      messageId: 'SM1234567890template',
      status: 'sent',
      phone: body.phone,
      templateId: body.templateId
    });
  }),

  // Status endpoint
  http.get('http://localhost:3001/api/quicklearning/twilio/status', () => {
    return HttpResponse.json(mockTwilioStatus);
  }),

  // History endpoint
  http.get('http://localhost:3001/api/quicklearning/twilio/history', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const phone = url.searchParams.get('phone');
    
    let response = { ...mockHistoryResponse };
    
    if (limit) {
      response.limit = parseInt(limit);
    }
    
    if (phone) {
      response.messages = response.messages.filter((msg: TwilioMessage) => 
        msg.from === phone || msg.to === phone
      );
      response.total = response.messages.length;
    }
    
    return HttpResponse.json(response);
  }),

  // Dashboard stats endpoint
  http.get('http://localhost:3001/api/quicklearning/dashboard/stats', () => {
    return HttpResponse.json(mockDashboardStats);
  }),

  // Active chats endpoint
  http.get('http://localhost:3001/api/quicklearning/chats/active', () => {
    return HttpResponse.json(mockActiveChats);
  }),

  // Get chat by phone endpoint
  http.get('http://localhost:3001/api/quicklearning/chat/:phone', ({ params }) => {
    const { phone } = params;
    const chat = mockActiveChats.find(c => c.phone === phone);
    
    if (!chat) {
      return HttpResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(chat);
  }),

  // Toggle AI endpoint
  http.put('http://localhost:3001/api/quicklearning/chat/:phone/ai', async ({ params, request }) => {
    const { phone } = params;
    const body = await request.json() as { aiEnabled: boolean };
    
    return HttpResponse.json({
      success: true,
      phone,
      aiEnabled: body.aiEnabled
    });
  }),

  // Assign advisor endpoint
  http.put('http://localhost:3001/api/quicklearning/chat/:phone/advisor', async ({ params, request }) => {
    const { phone } = params;
    const body = await request.json() as { advisor: { id: string; name: string } };
    
    return HttpResponse.json({
      success: true,
      phone,
      advisor: body.advisor
    });
  }),

  // Update customer info endpoint
  http.put('http://localhost:3001/api/quicklearning/chat/:phone/customer', async ({ params, request }) => {
    const { phone } = params;
    const body = await request.json() as { customerInfo: any };
    
    return HttpResponse.json({
      success: true,
      phone,
      customerInfo: body.customerInfo
    });
  }),

  // Update chat status endpoint
  http.put('http://localhost:3001/api/quicklearning/chat/:phone/status', async ({ params, request }) => {
    const { phone } = params;
    const body = await request.json() as { status: string };
    
    return HttpResponse.json({
      success: true,
      phone,
      status: body.status
    });
  })
);

// Setup and teardown
beforeAll(() => server.listen());
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

describe('Quick Learning Twilio Services', () => {
  describe('sendTwilioMessage', () => {
    test('should send message successfully', async () => {
      const request: TwilioSendRequest = {
        phone: '+5214521311888',
        message: '¡Hola! Esto es un mensaje de prueba.'
      };

      const response = await sendTwilioMessage(request);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(request.phone);
      expect(response.message).toBe(request.message);
      expect(response.messageId).toBeTruthy();
    });

    test('should handle validation errors', async () => {
      const request: TwilioSendRequest = {
        phone: '',
        message: 'Mensaje sin teléfono'
      };

      await expect(sendTwilioMessage(request)).rejects.toThrow();
    });

    test('should format phone number correctly', async () => {
      const request: TwilioSendRequest = {
        phone: '5214521311888', // Sin +
        message: 'Mensaje de prueba'
      };

      const response = await sendTwilioMessage(request);
      expect(response.success).toBe(true);
    });
  });

  describe('sendTwilioTemplate', () => {
    test('should send template successfully', async () => {
      const request: TwilioTemplateRequest = {
        phone: '+5214521311888',
        templateId: 'HX1234567890abcdef',
        variables: ['Juan', 'Quick Learning', 'mañana']
      };

      const response = await sendTwilioTemplate(request);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(request.phone);
      expect(response.templateId).toBe(request.templateId);
    });

    test('should handle missing templateId', async () => {
      const request: TwilioTemplateRequest = {
        phone: '+5214521311888',
        templateId: '',
        variables: []
      };

      await expect(sendTwilioTemplate(request)).rejects.toThrow();
    });
  });

  describe('getTwilioStatus', () => {
    test('should get service status', async () => {
      const status = await getTwilioStatus();

      expect(status.service).toBe('twilio');
      expect(status.status).toBe('active');
      expect(status.twilioPhoneNumber).toBe('+5213341610750');
      expect(status.messagesCount).toBeDefined();
      expect(status.aiResponses).toBeDefined();
      expect(typeof status.activeChats).toBe('number');
    });

    test('should include message counts', async () => {
      const status = await getTwilioStatus();

      expect(status.messagesCount.today).toBeGreaterThanOrEqual(0);
      expect(status.messagesCount.thisWeek).toBeGreaterThanOrEqual(0);
      expect(status.messagesCount.thisMonth).toBeGreaterThanOrEqual(0);
      expect(status.messagesCount.total).toBeGreaterThanOrEqual(0);
    });

    test('should include AI performance metrics', async () => {
      const status = await getTwilioStatus();

      expect(status.aiResponses.successful).toBeGreaterThanOrEqual(0);
      expect(status.aiResponses.failed).toBeGreaterThanOrEqual(0);
      expect(status.aiResponses.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('getTwilioHistory', () => {
    test('should get message history without filters', async () => {
      const history = await getTwilioHistory();

      expect(history.messages).toBeInstanceOf(Array);
      expect(history.total).toBeGreaterThanOrEqual(0);
      expect(history.limit).toBeDefined();
      expect(history.offset).toBeDefined();
      expect(typeof history.hasMore).toBe('boolean');
    });

    test('should filter by phone number', async () => {
      const history = await getTwilioHistory({
        phone: '+5214521311888'
      });

      expect(history.messages).toBeInstanceOf(Array);
      history.messages.forEach((msg: TwilioMessage) => {
        expect(
          msg.from === '+5214521311888' || msg.to === '+5214521311888'
        ).toBe(true);
      });
    });

    test('should apply limit parameter', async () => {
      const history = await getTwilioHistory({
        limit: 5
      });

      expect(history.limit).toBe(5);
    });

    test('should handle date filters', async () => {
      const today = new Date().toISOString().split('T')[0];
      const history = await getTwilioHistory({
        dateFrom: today,
        dateTo: today
      });

      expect(history).toBeDefined();
    });
  });

  describe('getQuickLearningDashboardStats', () => {
    test('should get dashboard statistics', async () => {
      const stats = await getQuickLearningDashboardStats();

      expect(typeof stats.totalChats).toBe('number');
      expect(typeof stats.activeChats).toBe('number');
      expect(typeof stats.messagesThisWeek).toBe('number');
      expect(typeof stats.averageResponseTime).toBe('number');
      expect(typeof stats.conversionRate).toBe('number');
      expect(stats.topCities).toBeInstanceOf(Array);
      expect(stats.aiPerformance).toBeDefined();
    });

    test('should include top cities data', async () => {
      const stats = await getQuickLearningDashboardStats();

      expect(stats.topCities.length).toBeGreaterThan(0);
      stats.topCities.forEach((city: { city: string; count: number }) => {
        expect(city.city).toBeTruthy();
        expect(typeof city.count).toBe('number');
      });
    });

    test('should include AI performance metrics', async () => {
      const stats = await getQuickLearningDashboardStats();

      expect(typeof stats.aiPerformance.totalQueries).toBe('number');
      expect(typeof stats.aiPerformance.successfulResponses).toBe('number');
      expect(typeof stats.aiPerformance.averageProcessingTime).toBe('number');
    });
  });

  describe('getChatByPhone', () => {
    test('should get chat by phone number', async () => {
      const phone = '+5214521311888';
      const chat = await getChatByPhone(phone);

      expect(chat.phone).toBe(phone);
      expect(chat.status).toBeTruthy();
      expect(typeof chat.aiEnabled).toBe('boolean');
    });

    test('should handle not found chat', async () => {
      const phone = '+5219999999999';
      
      await expect(getChatByPhone(phone)).rejects.toThrow();
    });
  });

  describe('toggleChatAI', () => {
    test('should enable AI for chat', async () => {
      const phone = '+5214521311888';
      const response = await toggleChatAI(phone, true);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(phone);
      expect(response.aiEnabled).toBe(true);
    });

    test('should disable AI for chat', async () => {
      const phone = '+5214521311888';
      const response = await toggleChatAI(phone, false);

      expect(response.success).toBe(true);
      expect(response.aiEnabled).toBe(false);
    });
  });

  describe('assignChatAdvisor', () => {
    test('should assign advisor to chat', async () => {
      const phone = '+5214521311888';
      const advisorId = 'advisor123';
      const advisorName = 'Carlos Ruiz';

      const response = await assignChatAdvisor(phone, advisorId, advisorName);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(phone);
      expect(response.advisor.id).toBe(advisorId);
      expect(response.advisor.name).toBe(advisorName);
    });
  });

  describe('updateChatCustomerInfo', () => {
    test('should update customer information', async () => {
      const phone = '+5214521311888';
      const customerInfo = {
        name: 'Juan Pérez Actualizado',
        email: 'juan.updated@email.com',
        city: 'Guadalajara'
      };

      const response = await updateChatCustomerInfo(phone, customerInfo);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(phone);
      expect(response.customerInfo).toEqual(customerInfo);
    });
  });

  describe('updateChatStatus', () => {
    test('should update chat status to active', async () => {
      const phone = '+5214521311888';
      const status = 'active';

      const response = await updateChatStatus(phone, status);

      expect(response.success).toBe(true);
      expect(response.phone).toBe(phone);
      expect(response.status).toBe(status);
    });

    test('should update chat status to blocked', async () => {
      const phone = '+5214521311888';
      const status = 'blocked';

      const response = await updateChatStatus(phone, status);

      expect(response.success).toBe(true);
      expect(response.status).toBe(status);
    });

    test('should update chat status to inactive', async () => {
      const phone = '+5214521311888';
      const status = 'inactive';

      const response = await updateChatStatus(phone, status);

      expect(response.success).toBe(true);
      expect(response.status).toBe(status);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.get('http://localhost:3001/api/quicklearning/twilio/status', () => {
          return HttpResponse.error();
        })
      );

      await expect(getTwilioStatus()).rejects.toThrow();
    });

    test('should handle API validation errors', async () => {
      const invalidRequest: TwilioSendRequest = {
        phone: '', // Invalid phone
        message: ''
      };

      await expect(sendTwilioMessage(invalidRequest)).rejects.toThrow();
    });
  });

  describe('Phone Number Formatting', () => {
    test('should accept international format', async () => {
      const request: TwilioSendRequest = {
        phone: '+5214521311888',
        message: 'Test message'
      };

      const response = await sendTwilioMessage(request);
      expect(response.success).toBe(true);
    });

    test('should handle national format', async () => {
      const request: TwilioSendRequest = {
        phone: '4521311888',
        message: 'Test message'
      };

      const response = await sendTwilioMessage(request);
      expect(response.success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should complete full workflow: send message, check status, get history', async () => {
      // 1. Send message
      const sendResponse = await sendTwilioMessage({
        phone: '+5214521311888',
        message: 'Flujo completo de prueba'
      });
      expect(sendResponse.success).toBe(true);

      // 2. Check status
      const status = await getTwilioStatus();
      expect(status.status).toBe('active');

      // 3. Get history
      const history = await getTwilioHistory({
        phone: '+5214521311888',
        limit: 10
      });
      expect(history.messages).toBeInstanceOf(Array);
    });

    test('should handle chat management workflow', async () => {
      const phone = '+5214521311888';

      // 1. Get chat
      const chat = await getChatByPhone(phone);
      expect(chat.phone).toBe(phone);

      // 2. Toggle AI
      await toggleChatAI(phone, !chat.aiEnabled);

      // 3. Assign advisor
      await assignChatAdvisor(phone, 'advisor1', 'Test Advisor');

      // 4. Update customer info
      await updateChatCustomerInfo(phone, {
        name: 'Test Customer',
        city: 'Test City'
      });

      // 5. Update status
      await updateChatStatus(phone, 'active');
    });
  });
});
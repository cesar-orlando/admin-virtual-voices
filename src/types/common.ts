export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  status: number;
  message?: string;
};

export type ErrorResponse = {
  message: string;
  code?: string;
  status?: number;
};

export type ApiError = {
  response?: {
    data?: ErrorResponse;
    status?: number;
  };
  message?: string;
};

export type SocketEvent = {
  type: string;
  payload: unknown;
};

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppSession = {
  id: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode?: string;
  lastConnection?: string;
  phoneNumber?: string;
};

export type Message = {
  id: string;
  content: string;
  sender: string;
  receiver: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video';
};

export type AiConfig = {
  id: string;
  name: string;
  description?: string;
  model: string;
  parameters: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}; 
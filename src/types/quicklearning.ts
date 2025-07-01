// Quick Learning Twilio Types
export interface QuickLearningChat {
  _id?: string;
  phone: string;
  profileName?: string;
  messages: TwilioMessage[];
  linkedTable: {
    refModel: string;
    refId: string;
  };
  advisor?: {
    id: string;
    name: string;
  };
  aiEnabled: boolean;
  status: "active" | "inactive" | "blocked";
  customerInfo?: {
    name?: string;
    email?: string;
    city?: string;
    stage?: "prospecto" | "interesado" | "inscrito";
  };
  createdAt: string;
  updatedAt: string;
}

export interface TwilioMessage {
  _id?: string;
  from: string;
  to: string;
  body: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read" | "failed" | "pending";
  timestamp: string;
  messageType: "text" | "media" | "location" | "audio";
  mediaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  audioTranscription?: string;
  twilioSid?: string;
  errorMessage?: string;
}

export interface TwilioSendRequest {
  phone: string;
  message: string;
}

export interface TwilioTemplateRequest {
  phone: string;
  templateId: string;
  variables: string[];
}

export interface TwilioStatus {
  service: "twilio";
  status: "active" | "inactive" | "error";
  twilioAccountSid: string;
  twilioPhoneNumber: string;
  lastWebhookReceived?: string;
  messagesCount: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  aiResponses: {
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  activeChats: number;
  errors?: Array<{
    timestamp: string;
    error: string;
    phone?: string;
  }>;
}

export interface TwilioHistoryRequest {
  limit?: number;
  offset?: number;
  phone?: string;
  dateFrom?: string;
  dateTo?: string;
  direction?: "inbound" | "outbound";
  status?: string;
}

export interface TwilioHistoryResponse {
  messages: TwilioMessage[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface QuickLearningDashboardStats {
  totalChats: number;
  activeChats: number;
  messagesThisWeek: number;
  averageResponseTime: number;
  conversionRate: number;
  topCities: Array<{
    city: string;
    count: number;
  }>;
  aiPerformance: {
    totalQueries: number;
    successfulResponses: number;
    averageProcessingTime: number;
  };
}

// Tipos para herramientas de IA de NatalIA
export interface NatalIATools {
  get_start_dates: {
    city?: string;
    course_type?: string;
  };
  register_user_name: {
    name: string;
    phone: string;
  };
  submit_student_complaint: {
    student_name: string;
    complaint: string;
    phone: string;
  };
  suggest_branch_or_virtual_course: {
    city: string;
  };
  suggest_nearby_branch: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface TwilioError extends Error {
  code?: string;
  status?: number;
  moreInfo?: string;
}
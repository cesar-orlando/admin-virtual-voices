// Base types
export interface BaseEntity {
  _id: string
  createdAt?: string
  updatedAt?: string
}

// User types
export interface UserProfile {
  id: string
  name: string
  email: string
  c_name: string
  role?: UserRole
}

export interface UserProfileToken extends UserProfile {
  token: string
}

export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  c_name: string
}

export interface AuthResponse {
  user: UserProfile
  token: string
  message?: string
}

// WhatsApp types
export interface WhatsAppSession extends BaseEntity {
  name: string
  user: {
    name: string
    id?: string
  }
  IA?: {
    id: string
    name: string
  }
  status?: SessionStatus
  qrCode?: string
  isConnected?: boolean
  id: string
}

export const SessionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PENDING: 'pending',
  ERROR: 'error'
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export interface QRRequest {
  sessionName: string
  user: UserProfile
}

// AI Configuration types
export interface AIConfig extends BaseEntity {
  name: string
  type: string
  welcomeMessage: string
  objective: string
  tone: string
  customPrompt: string
  isActive?: boolean
  model?: AIModel
  temperature?: number
  maxTokens?: number
  user: {
    id: string,
    name: string
  }
}

export const AIModel = {
  GPT_3_5: 'gpt-3.5-turbo',
  GPT_4: 'gpt-4',
  CLAUDE: 'claude-3',
  LOCAL: 'local-model'
} as const;

export type AIModel = typeof AIModel[keyof typeof AIModel];

export interface AIConfigRequest {
  config: Partial<AIConfig>
  sessionId?: string
}

// Message types
export interface Message extends BaseEntity {
  content: string
  sender: MessageSender
  timestamp: string
  sessionId: string
  type?: MessageType
  metadata?: MessageMetadata
}

export const MessageSender = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
} as const;

export type MessageSender = typeof MessageSender[keyof typeof MessageSender];

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  FILE: 'file'
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface MessageMetadata {
  phoneNumber?: string
  userName?: string
  isFromWhatsApp?: boolean
  hasError?: boolean
  errorMessage?: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

export interface NotificationState {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  isRead?: boolean
}

export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Form types
export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: Record<string, string>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

// Socket types
export interface SocketEvent<T = unknown> {
  event: string
  data: T
  timestamp?: Date
}

export interface WhatsAppSocketData {
  qr?: string
  sessionId: string
  status: SessionStatus
  message?: string
}

// Dynamic Tables types
export interface DynamicTable extends BaseEntity {
  name: string
  slug: string
  icon: string
  c_name: string
  description?: string;
  createdBy: string
  isActive: boolean
  fields: TableField[]
  totalRecords?: number
  recordsCount?: number
}

export interface TableField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  defaultValue?: any
  options?: string[]
  order: number
  width?: number
}

export const FieldType = {
  TEXT: 'text',
  EMAIL: 'email',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  FILE: 'file',
  CURRENCY: 'currency'
} as const;

export type FieldType = typeof FieldType[keyof typeof FieldType];

export interface DynamicRecord extends BaseEntity {
  tableSlug: string
  c_name: string
  data: Record<string, any>
  createdBy: string
  updatedBy?: string
}

// Request/Response types
export interface CreateTableRequest {
  name: string
  slug: string
  icon: string
  fields: TableField[]
  isActive?: boolean
}

export interface UpdateTableRequest {
  name?: string
  slug?: string
  icon?: string
  description?: string;
  fields?: TableField[]
  isActive?: boolean
}

export interface CreateRecordRequest {
  tableSlug: string
  data: Record<string, any>
}

export interface UpdateRecordRequest {
  data: Record<string, any>
}

export interface TableStats {
  totalRecords: number
  recentRecords: number
  dailyStats: Array<{ _id: string; count: number }>
  table: {
    name: string
    slug: string
    fieldCount: number
  }
}

export interface PaginatedRecordsResponse {
  records: DynamicRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  table: {
    name: string
    slug: string
    fields: TableField[]
  }
}
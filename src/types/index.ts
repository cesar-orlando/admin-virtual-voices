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
  status?: 'active' | 'inactive'
  companySlug?: string
}

export interface UserProfileToken extends UserProfile {
  token: string
}

export const UserRole = {
  ADMIN: 'Admin',
  USER: 'Usuario',
  MODERATOR: 'moderator'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Auth types
export interface LoginRequest {
  email: string
  password: string
  companySlug?: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  c_name: string
  role?: string
  companySlug?: string
}

export interface AuthResponse {
  user: UserProfile
  token: string
  message?: string
}

// Company Enterprise Types
export interface CompanyConfig {
  slug: string
  name: string
  displayName: string
  isEnterprise: boolean
  features: {
    quickLearning?: boolean
    controlMinutos?: boolean
    elevenLabs?: boolean
    autoAssignment?: boolean
  }
  database: {
    type: 'local' | 'external'
    connectionString?: string
  }
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
}

// Quick Learning Enterprise specific types
export interface QuickLearningUser extends UserProfile {
  companySlug: 'quicklearning'
  role: 'Admin' | 'Usuario'
  enterpriseFeatures?: {
    advancedAnalytics: boolean
    customWorkflows: boolean
    dedicatedSupport: boolean
  }
}

export interface QuickLearningLoginRequest extends LoginRequest {
  companySlug: 'quicklearning'
}

export interface QuickLearningRegisterRequest extends RegisterRequest {
  companySlug: 'quicklearning'
  role: 'Admin' | 'Usuario'
}

// Company detection types
export interface CompanyDetectionResponse {
  companies: CompanyConfig[]
  recommended?: string
  defaultSlug: string
}

// Environment configuration
export interface EnvironmentConfig {
  apiBaseUrl: string
  environment: 'development' | 'qa' | 'production'
  features: {
    multiCompany: boolean
    enterpriseMode: boolean
    quickLearningIntegration: boolean
  }
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

// Quick Learning Twilio exports
export * from './quicklearning';

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

// Tools System types
export interface ITool extends BaseEntity {
  name: string
  displayName: string
  description: string
  category: string
  isActive: boolean
  c_name: string
  createdBy: string
  updatedBy?: string
  config: ToolConfig
  parameters: ToolParameters
  responseMapping?: ResponseMapping
  security: SecurityConfig
}

export interface ToolConfig {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  authType?: 'none' | 'api_key' | 'bearer' | 'basic'
  authConfig?: {
    apiKey?: string
    bearerToken?: string
    username?: string
    password?: string
  }
  timeout?: number
}

export interface ToolParameters {
  type: 'object'
  properties: Record<string, ParameterProperty>
  required: string[]
}

export interface ParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  required?: boolean
  enum?: string[]
  format?: string
  default?: any
}

export interface ResponseMapping {
  successPath?: string
  errorPath?: string
  transformFunction?: string
}

export interface SecurityConfig {
  rateLimit?: {
    requests: number
    window: string
  }
  allowedDomains?: string[]
  maxTimeout?: number
}

export interface ToolCategory extends BaseEntity {
  name: string
  displayName: string
  description: string
  c_name: string
  icon?: string
  color?: string
}

export interface ToolExecution extends BaseEntity {
  toolId: string
  toolName: string
  c_name: string
  executedBy: string
  parameters: Record<string, any>
  response?: {
    success: boolean
    data?: any
    error?: string
    executionTime: number
  }
  status: 'pending' | 'success' | 'failed'
}

export interface ToolAnalytics {
  c_name: string
  period: { 
    startDate?: string
    endDate?: string 
  }
  stats: Array<{
    _id: string
    toolName: string
    displayName: string
    category: string
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecuted?: Date
  }>
}

export interface ToolDashboardStats {
  totalTools: number
  activeTools: number
  executionsToday: number
  successRate: number
  categoriesCount: number
  executionsTrend: Array<{
    date: string
    executions: number
    success: number
    failed: number
  }>
  topTools: Array<{
    id: string
    name: string
    displayName: string
    executions: number
    successRate: number
  }>
  categoryDistribution: Array<{
    category: string
    count: number
    percentage: number
  }>
}

// Request/Response types for Tools
export interface CreateToolRequest {
  name: string
  displayName: string
  description: string
  category: string
  config: ToolConfig
  parameters: ToolParameters
  responseMapping?: ResponseMapping
  security: SecurityConfig
}

export interface UpdateToolRequest {
  displayName?: string
  description?: string
  category?: string
  config?: Partial<ToolConfig>
  parameters?: ToolParameters
  responseMapping?: ResponseMapping
  security?: Partial<SecurityConfig>
}

export interface ToolTestRequest {
  testParameters: Record<string, any>
}

export interface ToolTestResponse {
  success: boolean
  executionTime: number
  response?: any
  error?: string
}

export interface ExecuteToolRequest {
  toolName: string
  parameters: Record<string, any>
  c_name: string
  executedBy: string
}

export interface BatchExecuteRequest {
  tools: Array<{
    toolName: string
    parameters: Record<string, any>
  }>
  c_name: string
  executedBy: string
}

export interface ValidateSchemaRequest {
  parameters: ToolParameters
}

export interface ValidateEndpointRequest {
  endpoint: string
  method: string
  timeout?: number
}

export interface ToolListParams {
  page?: number
  limit?: number
  category?: string
  isActive?: boolean
  search?: string
}

export interface CreateCategoryRequest {
  name: string
  displayName: string
  description: string
  c_name: string
  icon?: string
  color?: string
}

// Task Types
export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: string
  assignedToName?: string
  companySlug: string
  createdBy: string
  createdByName: string
  dueDate?: string
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  position: number
  comments: TaskComment[]
  attachments: TaskAttachment[]
  createdAt: string
  updatedAt: string
  isOverdue: boolean
  daysUntilDue?: number
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskComment {
  _id: string
  text: string
  author: string
  authorName: string
  createdAt: string
}

export interface TaskAttachment {
  _id: string
  filename: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
}

// Company Types
export interface Company {
  _id: string
  name: string
  slug: string
  address?: string
  phone?: string
  description?: string
  isSpecial?: boolean
}

// Request/Response Types
export interface CreateTaskRequest {
  title: string
  description?: string
  priority: TaskPriority
  assignedTo?: string
  dueDate?: string
  tags?: string[]
  estimatedHours?: number
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus
  actualHours?: number
  position?: number
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  assignedTo?: string
  tags?: string
  isOverdue?: boolean
  search?: string
  companySlug?: string
}

export interface TaskStats {
  statusStats: Array<{
    _id: TaskStatus
    count: number
  }>
  priorityStats: Array<{
    _id: TaskPriority
    count: number
  }>
  overdueCount: number
  totalTasks: number
}

export interface TasksByStatus {
  todo: Task[]
  in_progress: Task[]
  review: Task[]
  done: Task[]
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

// Socket Event Types
export interface TaskSocketEvent {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'task:status_changed'
  task: Task
  companySlug: string
}
import type { AssistedConfig } from '../types/aiAgent';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4331/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string | null;
  companyName?: string | null;
  phone?: string | null;
}

export interface AuthResponse {
  status: string;
  token?: string;
  user: User;
  message?: string;
}

export interface UpdateProfileData {
  name?: string;
  profilePicture?: string | null;
  companyName?: string | null;
  phone?: string | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ApiError {
  status: string;
  message: string;
}

// Instâncias
export interface Instance {
  id: string;
  name: string; // Nome escolhido pelo usuário
  instanceName: string; // Nome interno gerado automaticamente
  instanceId?: string | null;
  token?: string; // Token para API externa
  qrcode: boolean;
  qrcodeBase64?: string | null;
  status: 'created' | 'connecting' | 'connected' | 'disconnected' | 'error';
  integration: string;
  webhook: {
    url: string;
    events: string[];
  };
  settings: {
    rejectCall: boolean;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstanceData {
  name: string; // Nome escolhido pelo usuário
  rejectCall?: boolean;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
}

export interface UpdateInstanceSettingsData {
  rejectCall?: boolean;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
}

export interface CreateInstanceResponse {
  status: string;
  message: string;
  instance: Instance;
}

export interface GetInstancesResponse {
  status: string;
  count: number;
  instances: Instance[];
}

export interface GetInstanceResponse {
  status: string;
  instance: Instance;
}

export interface UpdateInstanceSettingsResponse {
  status: string;
  message: string;
  instance: {
    id: string;
    instanceName: string;
    settings: Instance['settings'];
  };
}

export interface DeleteInstanceResponse {
  status: string;
  message: string;
}


// Função auxiliar para fazer requisições
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      status: data.status || 'error',
      message: data.message || 'Erro ao processar requisição. Tente novamente.',
    };
    throw error;
  }

  return data;
};

// API de Autenticação
export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/me');
  },

  updateProfile: async (data: UpdateProfileData): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: ChangePasswordData): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// API de Instâncias
export const instanceAPI = {
  create: async (data: CreateInstanceData): Promise<CreateInstanceResponse> => {
    return request<CreateInstanceResponse>('/instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<GetInstancesResponse> => {
    return request<GetInstancesResponse>('/instances');
  },

  getById: async (id: string): Promise<GetInstanceResponse> => {
    return request<GetInstanceResponse>(`/instances/${id}`);
  },

  updateSettings: async (
    id: string,
    data: UpdateInstanceSettingsData
  ): Promise<UpdateInstanceSettingsResponse> => {
    return request<UpdateInstanceSettingsResponse>(`/instances/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<DeleteInstanceResponse> => {
    return request<DeleteInstanceResponse>(`/instances/${id}`, {
      method: 'DELETE',
    });
  },
};

// CRM Interfaces
export interface CRMColumn {
  id: string;
  name: string;
  order: number;
  shortId: number;
  color?: string | null;
}

export interface Label {
  id: string;
  shortId?: number;
  name: string;
  color: string;
  order: number;
}

export interface Contact {
  id: string;
  instanceId: string;
  remoteJid: string;
  phone: string;
  name: string;
  profilePicture?: string | null;
  columnId: string | null;
  columnName: string | null;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  labels?: Label[];
}

export interface Message {
  id: string;
  messageId: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  timestamp: string;
  read: boolean;
}

export interface GetColumnsResponse {
  status: string;
  columns: CRMColumn[];
}

export interface GetLabelsResponse {
  status: string;
  labels: Label[];
}

export interface GetContactsResponse {
  status: string;
  count: number;
  contacts: Contact[];
}

export interface GetMessagesResponse {
  status: string;
  count: number;
  messages: Message[];
}

export interface MoveContactData {
  columnId: string;
}

export interface SendMessageData {
  text: string;
}

// API de CRM
export const crmAPI = {
  getColumns: async (): Promise<GetColumnsResponse> => {
    return request<GetColumnsResponse>('/crm/columns');
  },

  updateColumn: async (id: string, name: string): Promise<{ status: string; column: CRMColumn }> => {
    return request<{ status: string; column: CRMColumn }>(`/crm/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  getContacts: async (): Promise<GetContactsResponse> => {
    return request<GetContactsResponse>('/crm/contacts');
  },

  searchContacts: async (query: string): Promise<GetContactsResponse> => {
    return request<GetContactsResponse>(`/crm/contacts/search?q=${encodeURIComponent(query)}`);
  },

  moveContact: async (contactId: string, data: MoveContactData): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/crm/contacts/${contactId}/move`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMessages: async (contactId: string): Promise<GetMessagesResponse> => {
    return request<GetMessagesResponse>(`/crm/contacts/${contactId}/messages`);
  },

  sendMessage: async (contactId: string, data: SendMessageData): Promise<{ status: string; message: string; data: Message }> => {
    return request<{ status: string; message: string; data: Message }>(`/crm/contacts/${contactId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendMedia: async (contactId: string, file: File, caption?: string): Promise<{ status: string; message: string; data: Message }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await fetch(`${API_URL}/crm/contacts/${contactId}/messages/media`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: data.status || 'error',
        message: data.message || 'Erro ao enviar mídia. Tente novamente.',
      };
      throw error;
    }

    return data;
  },

  sendAudio: async (contactId: string, file: File): Promise<{ status: string; message: string; data: Message }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/crm/contacts/${contactId}/messages/audio`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: data.status || 'error',
        message: data.message || 'Erro ao enviar áudio. Tente novamente.',
      };
      throw error;
    }

    return data;
  },

  // Labels
  getLabels: async (): Promise<GetLabelsResponse> => {
    return request<GetLabelsResponse>('/crm/labels');
  },

  updateLabel: async (id: string, name: string, color: string): Promise<{ status: string; label: Label }> => {
    return request<{ status: string; label: Label }>(`/crm/labels/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color }),
    });
  },

  addLabelToContact: async (contactId: string, labelId: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/crm/contacts/${contactId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labelId }),
    });
  },

  removeLabelFromContact: async (contactId: string, labelId: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/crm/contacts/${contactId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// DISPATCHES API
// ============================================

export type TemplateType =
  | 'text'
  | 'image'
  | 'image_caption'
  | 'video'
  | 'video_caption'
  | 'audio'
  | 'file'
  | 'sequence';

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  type: TemplateType;
  content: any;
}

export interface UpdateTemplateData {
  name?: string;
  content?: any;
}

export type DispatchStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface Dispatch {
  id: string;
  name: string;
  status: DispatchStatus;
  settings: {
    speed: 'fast' | 'normal' | 'slow' | 'randomized';
    autoDelete?: boolean;
    deleteDelay?: number;
    deleteDelayUnit?: 'seconds' | 'minutes' | 'hours';
  };
  schedule?: {
    startTime: string;
    endTime: string;
    suspendedDays: number[];
  } | null;
  stats: {
    sent: number;
    failed: number;
    invalid: number;
    total: number;
  };
  defaultName?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateDispatchData {
  instanceId: string;
  templateId?: string | null;
  name: string;
  settings: {
    speed: 'fast' | 'normal' | 'slow' | 'randomized';
    autoDelete?: boolean;
    deleteDelay?: number;
    deleteDelayUnit?: 'seconds' | 'minutes' | 'hours';
  };
  schedule?: {
    startTime: string;
    endTime: string;
    suspendedDays: number[];
  } | null;
  contactsSource: 'list' | 'kanban';
  contactsData?: Array<{ phone: string; name?: string }>;
  columnIds?: string[];
  defaultName?: string | null;
}

export interface ContactValidationResult {
  phone: string;
  name?: string;
  validated: boolean;
  validationResult?: {
    exists: boolean;
    name?: string;
  } | null;
}

export interface ValidateContactsResponse {
  status: string;
  contacts: ContactValidationResult[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export const dispatchAPI = {
  // Templates
  createTemplate: async (data: CreateTemplateData): Promise<{ status: string; template: Template }> => {
    return request<{ status: string; template: Template }>('/dispatches/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTemplates: async (type?: TemplateType): Promise<{ status: string; templates: Template[] }> => {
    const url = type ? `/dispatches/templates?type=${type}` : '/dispatches/templates';
    return request<{ status: string; templates: Template[] }>(url);
  },

  getTemplate: async (id: string): Promise<{ status: string; template: Template }> => {
    return request<{ status: string; template: Template }>(`/dispatches/templates/${id}`);
  },

  updateTemplate: async (id: string, data: UpdateTemplateData): Promise<{ status: string; template: Template }> => {
    return request<{ status: string; template: Template }>(`/dispatches/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTemplate: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/dispatches/templates/${id}`, {
      method: 'DELETE',
    });
  },

  uploadTemplateFile: async (file: File): Promise<{ status: string; url: string; fullUrl: string; fileName: string }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/dispatches/templates/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: data.status || 'error',
        message: data.message || 'Erro ao fazer upload do arquivo. Tente novamente.',
      };
      throw error;
    }

    return data;
  },

  // Validação
  validateContacts: async (instanceId: string, contacts: Array<{ phone: string; name?: string }>): Promise<ValidateContactsResponse> => {
    return request<ValidateContactsResponse>('/dispatches/validate-contacts', {
      method: 'POST',
      body: JSON.stringify({ instanceId, contacts }),
    });
  },

  // Upload/Processamento
  uploadCSV: async (file: File): Promise<{ status: string; contacts: Array<{ phone: string; name?: string }>; count: number }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/dispatches/upload-csv`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: data.status || 'error',
        message: data.message || 'Erro ao processar CSV',
      };
      throw error;
    }

    return data;
  },

  processInput: async (inputText: string): Promise<{ status: string; contacts: Array<{ phone: string; name?: string }>; count: number }> => {
    return request<{ status: string; contacts: Array<{ phone: string; name?: string }>; count: number }>('/dispatches/process-input', {
      method: 'POST',
      body: JSON.stringify({ inputText }),
    });
  },

  // Disparos
  createDispatch: async (data: CreateDispatchData): Promise<{ status: string; dispatch: Dispatch }> => {
    return request<{ status: string; dispatch: Dispatch }>('/dispatches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDispatches: async (status?: DispatchStatus): Promise<{ status: string; dispatches: Dispatch[] }> => {
    const url = status ? `/dispatches?status=${status}` : '/dispatches';
    return request<{ status: string; dispatches: Dispatch[] }>(url);
  },

  getDispatch: async (id: string): Promise<{ status: string; dispatch: Dispatch }> => {
    return request<{ status: string; dispatch: Dispatch }>(`/dispatches/${id}`);
  },

  startDispatch: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/dispatches/${id}/start`, {
      method: 'POST',
    });
  },

  pauseDispatch: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/dispatches/${id}/pause`, {
      method: 'POST',
    });
  },

  resumeDispatch: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/dispatches/${id}/resume`, {
      method: 'POST',
    });
  },

  deleteDispatch: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/dispatches/${id}`, {
      method: 'DELETE',
    });
  },
};

// Workflow Interfaces
export interface WorkflowNode {
  id: string;
  type: 'whatsappTrigger' | 'typebotTrigger' | 'condition' | 'delay' | 'end' | 'response' | 'spreadsheet' | 'openai';
  position: { x: number; y: number };
  data: {
    instanceId?: string;
    webhookUrl?: string;
    workflowId?: string;
    spreadsheetId?: string;
    spreadsheetName?: string;
    sheetName?: string;
    authStatus?: 'authenticated' | 'not_authenticated';
    isAuthenticated?: boolean;
    apiKey?: string;
    model?: string;
    prompt?: string;
    conditions?: Array<{ id: string; text: string; outputId: string }>;
    delay?: number;
    delayUnit?: 'seconds' | 'minutes' | 'hours';
    responseType?: 'text' | 'image' | 'image_caption' | 'video' | 'video_caption' | 'audio' | 'file';
    content?: string;
    mediaUrl?: string;
    caption?: string;
    fileName?: string;
    responseInstanceId?: string; // Instância de onde enviar a resposta (diferente do instanceId do trigger)
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  instanceId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowData {
  name: string;
  instanceId?: string; // Opcional - será obtido do nó de gatilho WhatsApp se não fornecido
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive?: boolean;
}

export interface UpdateWorkflowData {
  name?: string;
  instanceId?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  isActive?: boolean;
}

export interface WorkflowContact {
  id: string;
  contactPhone: string;
  instanceId: string;
  enteredAt: string;
}

// API de Workflows
export const workflowAPI = {
  getAll: async (): Promise<{ status: string; workflows: Workflow[] }> => {
    return request<{ status: string; workflows: Workflow[] }>('/workflows');
  },

  getById: async (id: string): Promise<{ status: string; workflow: Workflow }> => {
    return request<{ status: string; workflow: Workflow }>(`/workflows/${id}`);
  },

  create: async (data: CreateWorkflowData): Promise<{ status: string; message: string; workflow: Workflow }> => {
    return request<{ status: string; message: string; workflow: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateWorkflowData): Promise<{ status: string; message: string; workflow: Workflow }> => {
    return request<{ status: string; message: string; workflow: Workflow }>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  },

  getContacts: async (id: string): Promise<{ status: string; contacts: WorkflowContact[] }> => {
    return request<{ status: string; contacts: WorkflowContact[] }>(`/workflows/${id}/contacts`);
  },

  clearContacts: async (id: string): Promise<{ status: string; message: string; deletedCount: number }> => {
    return request<{ status: string; message: string; deletedCount: number }>(`/workflows/${id}/contacts/clear`, {
      method: 'POST',
    });
  },
};

// Agente de IA
export interface AIAgent {
  id: string;
  userId: string;
  instanceId: string;
  name: string;
  prompt: string;
  waitTime: number;
  isActive: boolean;
  transcribeAudio: boolean;
  agentType: 'manual' | 'assisted';
  assistedConfig?: AssistedConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAIAgentData {
  instanceId: string;
  name: string;
  prompt?: string;
  waitTime?: number;
  isActive?: boolean;
  transcribeAudio?: boolean;
  agentType?: 'manual' | 'assisted';
  assistedConfig?: AssistedConfig;
}

export interface UpdateAIAgentData {
  name?: string;
  prompt?: string;
  waitTime?: number;
  isActive?: boolean;
  transcribeAudio?: boolean;
  agentType?: 'manual' | 'assisted';
  assistedConfig?: AssistedConfig;
}

export interface AIAgentLead {
  phone: string;
  name?: string;
  interest?: string;
  detectedInterest?: boolean;
  lastInteraction?: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

// API de Agente de IA
export const aiAgentAPI = {
  getAll: async (): Promise<{ status: string; agents: AIAgent[] }> => {
    return request<{ status: string; agents: AIAgent[] }>('/ai-agent');
  },

  getById: async (id: string): Promise<{ status: string; agent: AIAgent }> => {
    return request<{ status: string; agent: AIAgent }>(`/ai-agent/${id}`);
  },

  create: async (data: CreateAIAgentData): Promise<{ status: string; message: string; agent: AIAgent }> => {
    return request<{ status: string; message: string; agent: AIAgent }>('/ai-agent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateAIAgentData): Promise<{ status: string; message: string; agent: AIAgent }> => {
    return request<{ status: string; message: string; agent: AIAgent }>(`/ai-agent/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/ai-agent/${id}`, {
      method: 'DELETE',
    });
  },

  getLeads: async (instanceId?: string): Promise<{ status: string; leads: AIAgentLead[]; count: number }> => {
    const url = instanceId ? `/ai-agent/leads?instanceId=${instanceId}` : '/ai-agent/leads';
    return request<{ status: string; leads: AIAgentLead[]; count: number }>(url);
  },
};

// Group Interfaces
export interface GroupParticipant {
  id: string;
  name?: string;
  isAdmin?: boolean;
}

export interface Group {
  id: string;
  name?: string;
  description?: string;
  creation?: number;
  participants?: GroupParticipant[];
  pictureUrl?: string;
  announcement?: boolean;
  locked?: boolean;
}

// Dashboard API
export interface DashboardStats {
  instances: {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
    error: number;
  };
  contacts: {
    total: number;
    byColumn: Array<{ columnId: string; count: number }>;
  };
  dispatches: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    paused: number;
  };
  workflows: {
    total: number;
  };
  groups: {
    total: number;
  };
  aiAgents: {
    total: number;
    active: number;
  };
}

export interface RecentActivity {
  messages: Array<{
    id: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    content: string;
    messageType: string;
    timestamp: string;
  }>;
  contacts: Array<{
    id: string;
    name: string | null;
    phone: string;
    createdAt: string;
  }>;
  dispatches: Array<{
    id: string;
    name: string;
    status: string;
    stats: {
      total: number;
      sent: number;
      failed: number;
      invalid: number;
    };
    createdAt: string;
  }>;
}

export const dashboardAPI = {
  getStats: async (): Promise<{
    status: string;
    stats: DashboardStats;
    recent: RecentActivity;
  }> => {
    return request<{
      status: string;
      stats: DashboardStats;
      recent: RecentActivity;
    }>('/dashboard/stats');
  },
};

// Group API
export const groupAPI = {
  getAll: async (instanceId: string): Promise<{ status: string; groups: Group[] }> => {
    return request<{ status: string; groups: Group[] }>(`/groups?instanceId=${instanceId}`);
  },

  leave: async (instanceId: string, groupId: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/groups/leave`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, groupId }),
    });
  },

  validateParticipants: async (
    instanceId: string,
    participants: string[]
  ): Promise<{
    status: string;
    valid: Array<{ phone: string; name?: string }>;
    invalid: Array<{ phone: string; reason: string }>;
    validCount: number;
    invalidCount: number;
    totalCount: number;
  }> => {
    return request<{
      status: string;
      valid: Array<{ phone: string; name?: string }>;
      invalid: Array<{ phone: string; reason: string }>;
      validCount: number;
      invalidCount: number;
      totalCount: number;
    }>(`/groups/validate-participants`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, participants }),
    });
  },

  create: async (
    instanceId: string,
    subject: string,
    description: string,
    participants: string[]
  ): Promise<{ status: string; message: string; group: Group }> => {
    return request<{ status: string; message: string; group: Group }>(`/groups/create`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, subject, description, participants }),
    });
  },

  updatePicture: async (
    instanceId: string,
    groupId: string,
    file: File
  ): Promise<{ status: string; message: string; imageUrl: string }> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('instanceId', instanceId);
    formData.append('groupId', groupId);

    const response = await fetch(`${API_URL}/groups/update-picture`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        status: data.status || 'error',
        message: data.message || 'Erro ao atualizar imagem do grupo',
      };
      throw error;
    }

    return data;
  },

  updateSubject: async (
    instanceId: string,
    groupId: string,
    subject: string
  ): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/groups/update-subject`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, groupId, subject }),
    });
  },

  updateDescription: async (
    instanceId: string,
    groupId: string,
    description: string
  ): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/groups/update-description`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, groupId, description }),
    });
  },

  getInviteCode: async (
    instanceId: string,
    groupId: string
  ): Promise<{ status: string; code: string; url: string }> => {
    return request<{ status: string; code: string; url: string }>(
      `/groups/invite-code?instanceId=${instanceId}&groupId=${encodeURIComponent(groupId)}`
    );
  },

  updateSettings: async (
    instanceId: string,
    groupId: string,
    action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
  ): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/groups/update-settings`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, groupId, action }),
    });
  },

  mentionEveryone: async (
    instanceId: string,
    groupId: string,
    text: string
  ): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/groups/mention-everyone`, {
      method: 'POST',
      body: JSON.stringify({ instanceId, groupId, text }),
    });
  },
};

const api = { authAPI, instanceAPI, crmAPI, dispatchAPI, workflowAPI, aiAgentAPI, groupAPI, dashboardAPI };

export default api;


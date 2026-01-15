import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/lib/zustand-store/store';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized
      useAuthStore.getState().clearAuth();
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export type Permissions = Record<string, string[]>;

export interface Role {
  id: string;
  name: "ADMIN" | "SALES" | "IMPLEMENTATION_LEAD" | "HARDWARE_ENGINEER";
  permissions: Permissions;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  password?: string;
  roleId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Client API Types
export interface Client {
  id: string;
  name: string;
  address: string;
  notes?: string;
  isActive: boolean;
  _count?: { onboardingTasks: number };
  onboardingTasks?: OnboardingTask[];
  createdAt: string;
  updatedAt: string;
}

export const clientsApi = {
  getAll: async (includeInactive = false): Promise<Client[]> => {
    const response = await apiClient.get('/clients', {
      params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return response.data;
  },

  search: async (query: string): Promise<Client[]> => {
    const response = await apiClient.get('/clients/search', {
      params: { q: query },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data: { name: string; address: string; notes?: string }): Promise<Client> => {
    const response = await apiClient.post('/clients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt' | '_count'>>): Promise<Client> => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },

  reactivate: async (id: string): Promise<Client> => {
    const response = await apiClient.post(`/clients/${id}/reactivate`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/users/roles');
    return response.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// Products API
export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive?: boolean;
  parentProductId?: string;
  sopTemplate?: {
    id: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      order: number;
      estimatedDuration?: number;
      requiredRole?: string;
    }>;
  };
  reportSchema?: {
    id: string;
    formStructure: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
      validation?: Array<{
        type: string;
        value: any;
        message: string;
      }>;
      options?: Array<{
        value: string;
        label: string;
      }>;
      order: number;
    }>;
  };
  _count?: {
    onboardingTasks: number;
  };
}

export const productsApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  getCompatibleHardware: async (productId: string): Promise<any[]> => {
    const response = await apiClient.get(`/products/${productId}/hardware-configs/for-provisioning`);
    return response.data;
  },

  createSopTemplate: async (productId: string, data: { steps: any[] }): Promise<any> => {
    const response = await apiClient.post(`/products/${productId}/sop-template`, data);
    return response.data;
  },

  updateSopTemplate: async (productId: string, data: { steps: any[] }): Promise<any> => {
    const response = await apiClient.put(`/products/${productId}/sop-template`, data);
    return response.data;
  },

  createReportSchema: async (productId: string, data: { formStructure: any[] }): Promise<any> => {
    const response = await apiClient.post(`/products/${productId}/report-schema`, data);
    return response.data;
  },

  updateReportSchema: async (productId: string, data: { formStructure: any[] }): Promise<any> => {
    const response = await apiClient.put(`/products/${productId}/report-schema`, data);
    return response.data;
  },
};

// Workflow API
export interface HardwareProcurement {
  id: string;
  taskId: string;
  hardwareId: string;
  hardware: Hardware;
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  clientId?: string;
  client?: Client;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  contactPerson: string;
  productId: string;
  product: Product;
  currentStatus:
  | 'INITIALIZATION'
  | 'SCHEDULED_VISIT'
  | 'REQUIREMENTS_COMPLETE'
  | 'HARDWARE_PROCUREMENT_COMPLETE'
  | 'HARDWARE_PREPARED_COMPLETE'
  | 'READY_FOR_INSTALLATION';
  assignedUserId?: string;
  assignedUser?: User;
  sopSnapshot: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    estimatedDuration?: number;
    requiredRole?: string;
  }>;
  technicalReports: Array<{
    id: string;
    submissionData: Record<string, any>;
    submittedBy: string;
    submittedAt: string;
  }>;
  deviceProvisionings: Array<{
    id: string;
    deviceSerial: string;
    deviceType: string;
    hardwareId?: string;
    firmwareVersion: string;
    qrCode: string;
    provisionedBy: string;
    provisionedAt: string;
  }>;
  hardwareProcurements: HardwareProcurement[];
  createdAt: string;
  updatedAt: string;
}

export const workflowApi = {
  getAllTasks: async (filters?: { status?: string; assigned?: string; created?: string }): Promise<OnboardingTask[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigned) params.append('assigned', filters.assigned);
    if (filters?.created) params.append('created', filters.created);

    const response = await apiClient.get<OnboardingTask[]>(`/workflow/tasks?${params.toString()}`);
    return response.data;
  },

  getTasks: async (): Promise<OnboardingTask[]> => {
    const response = await apiClient.get<OnboardingTask[]>('/workflow/tasks');
    return response.data;
  },

  getTask: async (id: string): Promise<OnboardingTask> => {
    const response = await apiClient.get<OnboardingTask>(`/workflow/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData: {
    clientId?: string;
    clientName?: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress?: string;
    contactPerson: string;
    productId: string;
  }): Promise<OnboardingTask> => {
    const response = await apiClient.post<OnboardingTask>('/workflow/tasks', taskData);
    return response.data;
  },

  updateTaskStatus: async (id: string, status: OnboardingTask['currentStatus'], data?: any): Promise<OnboardingTask> => {
    const response = await apiClient.put<OnboardingTask>(`/workflow/tasks/${id}/status/${status}`, data || {});
    return response.data;
  },
};

// Alias for convenience
export const tasksApi = workflowApi;

// Reports API
export const reportsApi = {
  submitTechnicalReport: async (taskId: string, reportData: Record<string, any>) => {
    const response = await apiClient.post(`/reports/technical/${taskId}`, { submissionData: reportData });
    return response.data;
  },

  getReportSchema: async (productId: string) => {
    const response = await apiClient.get(`/reports/schema/${productId}`);
    return response.data;
  },

  updateReport: async (reportId: string, submissionData: Record<string, any>) => {
    const response = await apiClient.put(`/reports/${reportId}`, { submissionData });
    return response.data;
  },
};

// Hardware API (Device provisioning)
export const hardwareApi = {
  getDevices: async (taskId: string) => {
    const response = await apiClient.get(`/hardware/task/${taskId}/devices`);
    return response.data;
  },

  generateSerial: async () => {
    const response = await apiClient.post('/hardware/generate-serial');
    return response.data;
  },

  getDeviceProvisionings: async (taskId: string) => {
    const response = await apiClient.get(`/hardware/task/${taskId}/devices`);
    return response.data;
  },

  generatePreviewQrCodes: async (taskId: string): Promise<{
    taskId: string;
    clientName: string;
    devices: Array<{
      id: string;
      deviceSerial: string;
      deviceType: string;
      firmwareVersion: string;
      qrCode: string;
    }>;
  }> => {
    const response = await apiClient.post(`/hardware/generate-preview-qr-codes/${taskId}`);
    return response.data;
  },
};

// Hardware Category API
export interface HardwareCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  _count?: { hardware: number };
  createdAt: string;
  updatedAt: string;
}

// Hardware Catalog API
export interface Hardware {
  id: string;
  name: string;
  code: string;
  description?: string;
  categoryId: string;
  category?: HardwareCategory;
  manufacturer?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductHardwareConfig {
  id: string;
  productId: string;
  hardwareId: string;
  firmwareVersion: string;
  firmwareUrl?: string;
  isDefault: boolean;
  notes?: string;
  hardware?: Hardware;
  product?: Product;
}

export const hardwareCategoryApi = {
  getAll: async (includeInactive = false): Promise<HardwareCategory[]> => {
    const response = await apiClient.get('/hardware-categories', {
      params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return response.data;
  },

  getById: async (id: string): Promise<HardwareCategory> => {
    const response = await apiClient.get(`/hardware-categories/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    icon?: string;
  }): Promise<HardwareCategory> => {
    const response = await apiClient.post('/hardware-categories', data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  }): Promise<HardwareCategory> => {
    const response = await apiClient.put(`/hardware-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<HardwareCategory> => {
    const response = await apiClient.delete(`/hardware-categories/${id}`);
    return response.data;
  },

  reactivate: async (id: string): Promise<HardwareCategory> => {
    const response = await apiClient.post(`/hardware-categories/${id}/reactivate`);
    return response.data;
  },
};

export const hardwareCatalogApi = {
  getAll: async (includeInactive = false): Promise<Hardware[]> => {
    const response = await apiClient.get('/hardware-catalog', {
      params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return response.data;
  },

  getById: async (id: string): Promise<Hardware> => {
    const response = await apiClient.get(`/hardware-catalog/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    code: string;
    description?: string;
    categoryId: string;
    manufacturer?: string;
  }): Promise<Hardware> => {
    const response = await apiClient.post('/hardware-catalog', data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    categoryId?: string;
    manufacturer?: string;
    isActive?: boolean;
  }): Promise<Hardware> => {
    const response = await apiClient.put(`/hardware-catalog/${id}`, data);
    return response.data;
  },

  delete: async (id: string, hard = false): Promise<Hardware> => {
    const response = await apiClient.delete(`/hardware-catalog/${id}`, {
      params: hard ? { hard: 'true' } : {},
    });
    return response.data;
  },

  getByCategoryId: async (categoryId: string): Promise<Hardware[]> => {
    const response = await apiClient.get(`/hardware-catalog/by-category/${categoryId}`);
    return response.data;
  },
};

// Product Hardware Config API (added to productsApi)
export const productHardwareConfigApi = {
  getConfigsForProduct: async (productId: string): Promise<ProductHardwareConfig[]> => {
    const response = await apiClient.get(`/products/${productId}/hardware-configs`);
    return response.data;
  },

  getForProvisioning: async (productId: string): Promise<ProductHardwareConfig[]> => {
    const response = await apiClient.get(`/products/${productId}/hardware-configs/for-provisioning`);
    return response.data;
  },

  addConfig: async (productId: string, data: {
    hardwareId: string;
    firmwareVersion: string;
    firmwareUrl?: string;
    isDefault?: boolean;
    notes?: string;
  }): Promise<ProductHardwareConfig> => {
    const response = await apiClient.post(`/products/${productId}/hardware-configs`, data);
    return response.data;
  },

  updateConfig: async (productId: string, configId: string, data: {
    firmwareVersion?: string;
    firmwareUrl?: string;
    isDefault?: boolean;
    notes?: string;
  }): Promise<ProductHardwareConfig> => {
    const response = await apiClient.put(`/products/${productId}/hardware-configs/${configId}`, data);
    return response.data;
  },

  removeConfig: async (productId: string, configId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/hardware-configs/${configId}`);
  },

  setDefault: async (productId: string, configId: string): Promise<ProductHardwareConfig> => {
    const response = await apiClient.post(`/products/${productId}/hardware-configs/${configId}/set-default`);
    return response.data;
  },
};

export default apiClient;

const API_BASE_URL = (process.env as any).REACT_APP_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  token?: string;
}

interface AuthResponse {
  token: string;
  user: {
    email: string;
    nickname: string;
  };
}

interface LoginResponse extends ApiResponse<AuthResponse> {
  token?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('ecr_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('ecr_token');
        localStorage.removeItem('ecr_user');
        window.location.href = '/';
      }
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post('/api/auth/login', { email, password });
  },
  
  register: async (email: string, password: string, nickname?: string): Promise<LoginResponse> => {
    return apiClient.post('/api/auth/register', { email, password, nickname });
  },
  
  verifyToken: async () => {
    return apiClient.get('/api/auth/verify');
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.put('/api/auth/change-password', { currentPassword, newPassword });
  }
};

interface Room {
  id: string;
  name: string;
  hasPassword: boolean;
  maxUsers: number;
  userCount?: number;
  createdAt: string;
  lastActivity?: string;
}

interface CreateRoomResponse {
  room: Room;
}

interface GetRoomResponse {
  room: Room;
}

interface JoinRoomResponse {
  room: Room;
}

export const roomsApi = {
  createRoom: async (name: string, password?: string, maxUsers?: number): Promise<ApiResponse<CreateRoomResponse>> => {
    return apiClient.post('/api/rooms', { name, password, maxUsers });
  },
  
  getRoom: async (roomId: string): Promise<ApiResponse<GetRoomResponse>> => {
    return apiClient.get(`/api/rooms/${roomId}`);
  },
  
  joinRoom: async (roomId: string, password?: string, nickname?: string): Promise<ApiResponse<JoinRoomResponse>> => {
    return apiClient.post(`/api/rooms/${roomId}/join`, { password, nickname });
  },
  
  deleteRoom: async (roomId: string, password?: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/rooms/${roomId}`, { password });
  }
};

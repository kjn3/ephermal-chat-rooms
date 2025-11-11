const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG?.APP_API_URL) {
    return (window as any).APP_CONFIG.APP_API_URL;
  }
  return (process.env as any).APP_API_URL || 'http://localhost:3001';
};

const API_BASE_URL = getApiUrl();

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

  private async handleResponse<T>(response: Response, skipAuthRedirect: boolean = false): Promise<ApiResponse<T>> {
    let data: any;
    
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      if (response.status === 401 && !skipAuthRedirect) {
        localStorage.removeItem('ecr_token');
        localStorage.removeItem('ecr_user');
        window.location.href = '/';
      }
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
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

  async post<T>(endpoint: string, data?: any, skipAuthRedirect: boolean = false): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });
      return this.handleResponse<T>(response, skipAuthRedirect);
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error('Network error: Unable to reach server. Please check your connection and CORS settings.');
      }
      throw error;
    }
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
    return apiClient.post('/api/auth/login', { email, password }, true);
  },
  
  register: async (email: string, password: string, nickname?: string): Promise<LoginResponse> => {
    return apiClient.post('/api/auth/register', { email, password, nickname }, true);
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
  ownerEmail?: string;
  isOwner?: boolean;
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

interface GetUserRoomsResponse {
  rooms: Room[];
}

export const roomsApi = {
  createRoom: async (name: string, password?: string, maxUsers?: number): Promise<ApiResponse<CreateRoomResponse>> => {
    return apiClient.post('/api/rooms', { name, password, maxUsers });
  },
  
  getRoom: async (roomId: string): Promise<ApiResponse<GetRoomResponse>> => {
    return apiClient.get(`/api/rooms/${roomId}`);
  },
  
  getUserRooms: async (): Promise<ApiResponse<GetUserRoomsResponse>> => {
    return apiClient.get('/api/rooms');
  },
  
  joinRoom: async (roomId: string, password?: string, nickname?: string): Promise<ApiResponse<JoinRoomResponse>> => {
    return apiClient.post(`/api/rooms/${roomId}/join`, { password, nickname });
  },
  
  deleteRoom: async (roomId: string, password?: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/rooms/${roomId}`, { password });
  },
  
  extendRoomTTL: async (roomId: string): Promise<ApiResponse<{ ttl: number }>> => {
    return apiClient.post(`/api/rooms/${roomId}/extend-ttl`);
  }
};

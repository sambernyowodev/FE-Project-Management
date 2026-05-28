import { apiClient } from '@/shared/api/api-client';
import type { AuthResponse, LoginRequest, RegisterRequest, BaseResponse } from '../types';

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<BaseResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<BaseResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  }
};

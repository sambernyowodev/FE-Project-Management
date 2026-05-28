import { apiClient } from '@/shared/api/api-client';
import type { User, CreateUser, UpdateUser } from '../types';

export const usersApi = {
  getUsers: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: User[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: User[]; meta?: any }>('/users', { params });
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<{ data: User }>(`/users/${id}`);
    return response.data.data;
  },

  createUser: async (data: CreateUser): Promise<User> => {
    const response = await apiClient.post<{ data: User }>('/users', data);
    return response.data.data;
  },

  updateUser: async (id: number, data: UpdateUser): Promise<User> => {
    const response = await apiClient.put<{ data: User }>(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

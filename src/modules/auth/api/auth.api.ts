import { supabase } from '@/shared/api/supabase';
import type { AuthResponse, LoginRequest, RegisterRequest, BaseResponse, UserResponse, ChangePasswordRequest } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<BaseResponse<AuthResponse>> => {
    const { data: resData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password || '',
    });
    if (error) throw error;

    // Get user details from app_users table
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, full_name, email, role, created_at, updated_at')
      .eq('id', resData.user.id)
      .single();

    if (appUserError) throw appUserError;

    const userResponse: UserResponse = {
      id: appUser.id,
      email: appUser.email,
      fullName: appUser.full_name,
      employeeId: '',
      avatarUrl: '',
      isActive: true,
      roles: [{ code: appUser.role, name: appUser.role === 'ADMIN' ? 'Administrator' : appUser.role }],
      createdAt: appUser.created_at,
      updatedAt: appUser.updated_at,
    } as any;

    return {
      success: true,
      data: {
        accessToken: resData.session?.access_token || '',
        user: userResponse,
      } as any
    };
  },

  register: async (data: RegisterRequest): Promise<BaseResponse<AuthResponse>> => {
    const { data: resData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || '',
      options: {
        data: {
          full_name: data.fullName,
          role: 'ADMIN',
        }
      }
    });
    if (error) throw error;

    // Fetch profile (may need a slight retry to wait for trigger execution)
    let appUser = null;
    let retries = 3;
    while (retries > 0 && !appUser) {
      const { data: au } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', resData.user?.id)
        .maybeSingle();
      if (au) {
        appUser = au;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries--;
      }
    }

    if (!appUser && resData.user) {
      // Manual fallback if trigger was delayed
      const { data: newAppUser } = await supabase
        .from('app_users')
        .insert({
          id: resData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: 'ADMIN',
        })
        .select()
        .single();
      appUser = newAppUser;
    }

    const userResponse: UserResponse = {
      id: appUser?.id || resData.user?.id,
      email: appUser?.email || data.email,
      fullName: appUser?.full_name || data.fullName,
      employeeId: '',
      avatarUrl: '',
      isActive: true,
      roles: [{ code: appUser?.role || 'ADMIN', name: (appUser?.role || 'ADMIN') === 'ADMIN' ? 'Administrator' : (appUser?.role || 'ADMIN') }],
      createdAt: appUser?.created_at || new Date().toISOString(),
      updatedAt: appUser?.updated_at || new Date().toISOString(),
    } as any;

    return {
      success: true,
      data: {
        accessToken: resData.session?.access_token || '',
        user: userResponse,
      } as any
    };
  },

  getProfile: async (): Promise<BaseResponse<UserResponse>> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');

    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, full_name, email, role, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (appUserError) throw appUserError;

    const userResponse: UserResponse = {
      id: appUser.id,
      email: appUser.email,
      fullName: appUser.full_name,
      employeeId: '',
      avatarUrl: '',
      isActive: true,
      roles: [{ code: appUser.role, name: appUser.role === 'ADMIN' ? 'Administrator' : appUser.role }],
      createdAt: appUser.created_at,
      updatedAt: appUser.updated_at,
    } as any;

    return {
      success: true,
      data: userResponse
    };
  },

  changePassword: async (data: ChangePasswordRequest): Promise<BaseResponse<null>> => {
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });
    if (error) throw error;
    return {
      success: true,
      data: null
    };
  },

  getAppUsers: async (): Promise<{ id: string; fullName: string; email: string; role: string }[]> => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, full_name, email, role');
    if (error) throw error;
    return (data || []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
    }));
  },
};



import { supabase } from '@/shared/api/supabase';
import type { AuthResponse, LoginRequest, RegisterRequest, BaseResponse, UserResponse, ChangePasswordRequest } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<BaseResponse<AuthResponse>> => {
    const { data: resData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;

    // Get user details from members table
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email, employee_id, avatar_url, is_active')
      .eq('id', resData.user.id)
      .single();

    if (memberError) throw memberError;

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(code, name)')
      .eq('member_id', resData.user.id);

    const rolesList = userRoles ? (userRoles as any[]).map((ur: any) => ur.role) : [];

    const userResponse: UserResponse = {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      employeeId: member.employee_id || '',
      avatarUrl: member.avatar_url || '',
      isActive: member.is_active,
      roles: rolesList,
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
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        }
      }
    });
    if (error) throw error;

    // Fetch profile (may need a slight retry to wait for trigger execution)
    let member = null;
    let retries = 3;
    while (retries > 0 && !member) {
      const { data: m } = await supabase
        .from('members')
        .select('*')
        .eq('id', resData.user?.id)
        .maybeSingle();
      if (m) {
        member = m;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries--;
      }
    }

    if (!member && resData.user) {
      // Manual fallback if trigger was delayed
      const employeeId = `EMP-${data.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 50);
      const { data: newMember } = await supabase
        .from('members')
        .insert({
          id: resData.user.id,
          email: data.email,
          full_name: data.fullName,
          employee_id: employeeId,
          is_active: true,
        })
        .select()
        .single();
      member = newMember;
    }

    const userResponse: UserResponse = {
      id: member?.id || resData.user?.id,
      email: member?.email || data.email,
      fullName: member?.full_name || data.fullName,
      employeeId: member?.employee_id || '',
      avatarUrl: member?.avatar_url || '',
      isActive: true,
      roles: [],
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

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email, employee_id, avatar_url, is_active')
      .eq('id', user.id)
      .single();

    if (memberError) throw memberError;

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(code, name)')
      .eq('member_id', user.id);

    const rolesList = userRoles ? (userRoles as any[]).map((ur: any) => ur.role) : [];

    const userResponse: UserResponse = {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      employeeId: member.employee_id || '',
      avatarUrl: member.avatar_url || '',
      isActive: member.is_active,
      roles: rolesList,
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
  }
};



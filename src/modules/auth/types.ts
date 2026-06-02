import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type BaseResponse<T> = Schema<'BaseResponseDto'> & {
  data: T;
};

export type AuthResponse = Schema<'AuthResponseDto'>;
export type LoginRequest = Schema<'LoginDto'>;
export type RegisterRequest = Schema<'RegisterDto'>;
export type UserResponse = Entity<'UserResponseDto'>;
export type ChangePasswordRequest = Schema<'ChangePasswordDto'>;


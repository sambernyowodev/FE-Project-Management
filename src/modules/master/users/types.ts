import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type User = Entity<'UserResponseDto'>;
export type CreateUser = Schema<'CreateUserDto'>
export type UpdateUser = Schema<'UpdateUserDto'>


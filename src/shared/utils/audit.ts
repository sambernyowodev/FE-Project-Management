import { supabase } from '@/shared/api/supabase';

/**
 * Mendapatkan ID user yang sedang login dari Supabase auth session.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error('Failed to get current user ID for audit:', err);
    return null;
  }
}

/**
 * Menyematkan created_by dan updated_by ke payload insert.
 */
export async function withAuditCreated<T extends Record<string, any>>(payload: T): Promise<T & { created_by: string | null; updated_by: string | null }> {
  const userId = await getCurrentUserId();
  return {
    ...payload,
    created_by: userId,
    updated_by: userId,
  };
}

/**
 * Menyematkan updated_by ke payload update.
 */
export async function withAuditUpdated<T extends Record<string, any>>(payload: T): Promise<T & { updated_by: string | null }> {
  const userId = await getCurrentUserId();
  return {
    ...payload,
    updated_by: userId,
  };
}

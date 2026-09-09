import { supabase } from '@/shared/api/supabase';
import type { Holiday, CreateHolidayInput, UpdateHolidayInput } from '../types';

const mapHoliday = (h: any): Holiday => ({
  id: String(h.id),
  name: h.name,
  holidayDate: h.holiday_date,
  year: Number(h.year),
  createdAt: h.created_at,
  updatedAt: h.updated_at,
});

export const holidaysApi = {
  getHolidayYears: async (): Promise<number[]> => {
    const { data, error } = await supabase
      .from('master_holidays')
      .select('year')
      .order('year', { ascending: false });

    if (error) throw error;
    const set = new Set<number>((data || []).map((r: any) => Number(r.year)).filter(Boolean));
    if (set.size === 0) {
      set.add(new Date().getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  },

  getHolidays: async (year?: number): Promise<Holiday[]> => {
    let query = supabase
      .from('master_holidays')
      .select('*')
      .order('holiday_date', { ascending: true });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapHoliday);
  },

  getHolidayById: async (id: string): Promise<Holiday> => {
    const { data, error } = await supabase
      .from('master_holidays')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapHoliday(data);
  },

  createHoliday: async (input: CreateHolidayInput): Promise<Holiday> => {
    const year = input.year || (input.holidayDate ? new Date(input.holidayDate).getFullYear() : new Date().getFullYear());

    const { data, error } = await supabase
      .from('master_holidays')
      .insert({
        name: input.name,
        holiday_date: input.holidayDate,
        year,
      })
      .select()
      .single();

    if (error) throw error;
    return mapHoliday(data);
  },

  updateHoliday: async (id: string, input: UpdateHolidayInput): Promise<Holiday> => {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.holidayDate !== undefined) {
      payload.holiday_date = input.holidayDate;
      payload.year = input.year || new Date(input.holidayDate).getFullYear();
    } else if (input.year !== undefined) {
      payload.year = input.year;
    }

    const { data, error } = await supabase
      .from('master_holidays')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return holidaysApi.getHolidayById(id);
    return mapHoliday(data);
  },

  deleteHoliday: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('master_holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

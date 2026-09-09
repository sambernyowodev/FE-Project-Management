import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApi } from '../api/holidays.api';
import type { CreateHolidayInput, UpdateHolidayInput } from '../types';

export const useGetHolidayYears = () => {
  return useQuery({
    queryKey: ['master-holidays-years'],
    queryFn: () => holidaysApi.getHolidayYears(),
  });
};

export const useGetHolidays = (year?: number) => {
  return useQuery({
    queryKey: ['master-holidays', year],
    queryFn: () => holidaysApi.getHolidays(year),
  });
};

export const useGetHoliday = (id: string) => {
  return useQuery({
    queryKey: ['master-holidays', id],
    queryFn: () => holidaysApi.getHolidayById(id),
    enabled: !!id,
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHolidayInput) => holidaysApi.createHoliday(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['master-holidays-years'] });
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHolidayInput }) => holidaysApi.updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['master-holidays-years'] });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysApi.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['master-holidays-years'] });
    },
  });
};

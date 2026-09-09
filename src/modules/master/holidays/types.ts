export interface Holiday {
  id: string;
  name: string;
  holidayDate: string; // Format: YYYY-MM-DD
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateHolidayInput = Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateHolidayInput = Partial<CreateHolidayInput>;

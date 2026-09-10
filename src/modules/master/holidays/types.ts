export interface Holiday {
  id: string;
  name: string;
  holidayDate: string; // Format: YYYY-MM-DD
  year: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type CreateHolidayInput = Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateHolidayInput = Partial<CreateHolidayInput>;

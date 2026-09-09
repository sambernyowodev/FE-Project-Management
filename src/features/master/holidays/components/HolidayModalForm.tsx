import { useState, useEffect } from 'react';
import { X, Calendar, Save } from 'lucide-react';
import type { Holiday, CreateHolidayInput } from '@/modules/master/holidays/types';

interface HolidayModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHolidayInput) => void;
  holiday?: Holiday | null;
  selectedYear?: number;
  isLoading?: boolean;
}

export function HolidayModalForm({
  isOpen,
  onClose,
  onSubmit,
  holiday,
  selectedYear = new Date().getFullYear(),
  isLoading = false,
}: HolidayModalFormProps) {
  const [formData, setFormData] = useState<CreateHolidayInput>({
    name: '',
    holidayDate: '',
    year: selectedYear,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (holiday) {
        setFormData({
          name: holiday.name || '',
          holidayDate: holiday.holidayDate || '',
          year: holiday.year || selectedYear,
        });
      } else {
        const defaultDate = `${selectedYear}-01-01`;
        setFormData({
          name: '',
          holidayDate: defaultDate,
          year: selectedYear,
        });
      }
    }
  }, [isOpen, holiday, selectedYear]);

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const yearVal = val ? new Date(val).getFullYear() : selectedYear;
    setFormData(prev => ({
      ...prev,
      holidayDate: val,
      year: yearVal,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama hari libur wajib diisi');
      return;
    }
    if (!formData.holidayDate) {
      setError('Tanggal libur wajib dipilih');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      holidayDate: formData.holidayDate,
      year: formData.year,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-background">
                {holiday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
              </h2>
              <p className="text-xs text-secondary">
                {holiday ? 'Perbarui data hari libur' : `Tambah data hari libur untuk tahun ${formData.year}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-secondary hover:text-on-background transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Tanggal */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="holidayDate" className="text-xs font-bold text-secondary uppercase tracking-wider">
              Tanggal Libur <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="holidayDate"
              value={formData.holidayDate}
              onChange={handleDateChange}
              className="px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          {/* Nama Hari Libur */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-bold text-secondary uppercase tracking-wider">
              Nama Hari Libur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              placeholder="Contoh: Hari Raya Idul Fitri 1447 H"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/40 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-container-high rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Menyimpan...' : holiday ? 'Simpan Perubahan' : 'Tambah Hari Libur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

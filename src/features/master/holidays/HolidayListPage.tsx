import { useState, useMemo, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  CalendarDays, 
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  useGetHolidayYears,
  useGetHolidays, 
  useCreateHoliday, 
  useUpdateHoliday, 
  useDeleteHoliday
} from '@/modules/master/holidays/hooks/useHolidays';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import { HolidayModalForm } from './components/HolidayModalForm';
import { formatDate } from '@/shared/lib/formatter';
import type { Holiday, CreateHolidayInput } from '@/modules/master/holidays/types';

export function HolidayListPage() {
  const currentYear = new Date().getFullYear();
  const { data: dbYears = [] } = useGetHolidayYears();

  const availableYears = useMemo(() => {
    const list = [...dbYears];
    if (!list.includes(currentYear)) {
      list.push(currentYear);
    }
    return list.sort((a, b) => b - a);
  }, [dbYears, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  // If initial selectedYear is not in availableYears when dbYears loads, update to the most relevant year
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const { data: holidays = [], isLoading, refetch } = useGetHolidays(selectedYear);
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: CreateHolidayInput) => {
    if (editingHoliday) {
      updateMutation.mutate(
        { id: editingHoliday.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingHoliday(null);
            refetch();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          refetch();
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingHoliday) return;
    deleteMutation.mutate(deletingHoliday.id, {
      onSuccess: () => {
        setDeletingHoliday(null);
        refetch();
      },
    });
  };

  const columns: ColumnDef<Holiday, any>[] = [
    {
      id: 'holidayDate',
      header: 'Tanggal Libur',
      accessorKey: 'holidayDate',
      meta: {
        filterType: 'date',
      },
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const cellValue = row.getValue(columnId) as string;
        if (!cellValue) return false;
        return cellValue === filterValue || cellValue.startsWith(filterValue);
      },
      cell: ({ row }) => {
        const d = new Date(row.original.holidayDate);
        const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
        const dateFormatted = formatDate(row.original.holidayDate, 'long');

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-red-600 leading-none">
                {dayName.substring(0, 3)}
              </span>
              <span className="text-sm font-extrabold text-red-600 font-mono leading-tight">
                {d.getDate()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-on-background">{dateFormatted}</span>
              <span className="text-xs text-secondary">{dayName}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'name',
      header: 'Nama Hari Libur',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-on-background">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      meta: { className: 'text-right w-24' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 items-center">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Hari Libur"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingHoliday(row.original)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Hapus Hari Libur"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-background tracking-tight">
                Master Data Hari Libur
              </h1>
              <p className="text-xs text-secondary mt-0.5">
                Kelola data hari libur per tahun untuk validasi timeline dan kalkulasi mandays akurat.
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector Dropdown */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <label htmlFor="yearFilterSelect" className="text-xs font-bold text-secondary uppercase tracking-wider">
            Filter Tahun:
          </label>
          <div className="relative min-w-[140px]">
            <select
              id="yearFilterSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full pl-3.5 pr-9 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs font-bold text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs appearance-none"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  Tahun {year}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-surface-container-low to-surface-container-lowest border border-red-500/20 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-red-500/15 text-red-600 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-on-background">
            Tahun {selectedYear}: Total {holidays.length} Hari Libur Terdaftar
          </h4>
          <p className="text-xs text-secondary mt-0.5">
            Semua tanggal libur di atas diambil langsung dari database master holiday dan otomatis dikecualikan dari perhitungan Mandays serta ditandai merah pada Timeline Gantt Chart.
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={holidays}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Cari hari libur (misal: Idul Fitri, Nyepi, Natal)..."
        onAdd={handleOpenAdd}
        addLabel="Tambah Hari Libur"
        onRefresh={refetch}
        exportFilename={`master-hari-libur-${selectedYear}`}
      />

      {/* Modal Form */}
      <HolidayModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHoliday(null);
        }}
        onSubmit={handleFormSubmit}
        holiday={editingHoliday}
        selectedYear={selectedYear}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingHoliday)}
        onClose={() => setDeletingHoliday(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Hari Libur?"
        message={`Apakah Anda yakin ingin menghapus hari libur "${deletingHoliday?.name || ''}" (${deletingHoliday?.holidayDate || ''})?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

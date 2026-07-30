import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { ParsedExcelRow } from '@/shared/lib/excel-helpers';
import type { ProjectMember, ProjectActivity, CreateProjectActivity, UpdateProjectActivity } from '@/modules/projects/types';
import { useBulkImportActivities } from '@/modules/projects/hooks/useProjectActivities';
import { projectsApi } from '@/modules/projects/api/projects.api';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parsedRows: ParsedExcelRow[];
  resourceRoles?: Record<string, string>;
  members: ProjectMember[];
  existingActivities: ProjectActivity[];
}

const PHASE_OPTIONS = [
  'FCAB', 'REQUIREMENT', 'ANALYSIS', 'DESIGN', 'SRS', 'CRQ', 'DEVELOPMENT',
  'UT SIT', 'TRA TC', 'REVIEW', 'SIT', 'UAT', 'NFT', 'SECURITY', 'RFS', 'FUT'
];

export function ExcelImportModal({
  isOpen,
  onClose,
  projectId,
  parsedRows: initialRows,
  resourceRoles = {},
  members,
  existingActivities
}: ExcelImportModalProps) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ParsedExcelRow[]>(initialRows);
  const [duplicateMode, setDuplicateMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncingResources, setIsSyncingResources] = useState(false);

  const bulkImportMutation = useBulkImportActivities(projectId);

  // Sync local editable rows with the latest parsed data whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setRows(initialRows);
      setErrorMsg('');
    }
  }, [isOpen, initialRows]);

  if (!isOpen) return null;

  const handleCellChange = (index: number, field: keyof ParsedExcelRow, value: any) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      // Clear errors on field change
      if (field === 'activityName') {
        const existing = existingActivities.find(
          a => a.activityName.trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        copy[index].isDuplicate = Boolean(existing);
        copy[index].existingActivityId = existing?.id;
      }
      return copy;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const duplicateCount = rows.filter(r => r.isDuplicate).length;

  const handleImport = async () => {
    setErrorMsg('');

    // Filter valid rows
    const validRows = rows.filter(r => r.activityName.trim().length > 0);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada data aktivitas yang valid untuk diimport.');
      return;
    }

    try {
      setIsSyncingResources(true);

      // STEP 1: Extract all assigned resource names from Excel rows
      const assignedResourceNames = validRows
        .map(r => r.assignedToName)
        .filter((name): name is string => Boolean(name && name.trim()));

      // STEP 2: Ensure resources are inserted/registered in project_members with resolved roles
      const resourceMap = await projectsApi.ensureResourcesInProject(
        projectId,
        assignedResourceNames,
        resourceRoles
      );

      // STEP 3: Map activities with assignedToId
      const newActivitiesToCreate: CreateProjectActivity[] = [];
      const activitiesToUpdate: { id: string; data: UpdateProjectActivity }[] = [];

      for (const r of validRows) {
        const assignedToId = r.assignedToName
          ? resourceMap.get(r.assignedToName.trim().toLowerCase()) || null
          : null;

        const payload: any = {
          projectId,
          activityName: r.activityName,
          description: r.details || undefined,
          feature: r.feature || undefined,
          subFeature: r.subFeature || undefined,
          details: r.details || undefined,
          durationDays: r.durationDays,
          mandays: r.mandays,
          startDate: r.startDate || undefined,
          endDate: r.endDate || undefined,
          progressPct: r.progressPct || 0,
          phase: r.phase || 'DEVELOPMENT',
          assignedToId,
          sortOrder: r.sortOrder || 0,
          isMilestone: r.isMilestone || false,
        };

        if (r.isDuplicate && r.existingActivityId && duplicateMode === 'upsert') {
          activitiesToUpdate.push({
            id: r.existingActivityId,
            data: payload
          });
        } else {
          newActivitiesToCreate.push(payload);
        }
      }

      // STEP 4: Bulk import activities to database
      bulkImportMutation.mutate(
        {
          mode: duplicateMode,
          newActivities: newActivitiesToCreate,
          updateActivities: activitiesToUpdate
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
          },
          onError: (err: any) => {
            setErrorMsg(err.message || 'Gagal menyimpan data import');
          }
        }
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyinkronkan data resource member.');
    } finally {
      setIsSyncingResources(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-background">Preview & Edit Data Excel</h3>
              <p className="text-xs text-secondary">
                {rows.length} aktivitas terdeteksi dari file Excel. Silakan periksa dan edit data sebelum disimpan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Strategy Option bar */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Terdeteksi <strong>{duplicateCount} aktivitas</strong> yang sudah ada di database (nama sama).
            </span>
          </div>

          <div className="flex items-center gap-4 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className="font-semibold text-secondary">Opsi Duplikasi:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-on-background">
              <input
                type="radio"
                name="duplicateMode"
                value="upsert"
                checked={duplicateMode === 'upsert'}
                onChange={() => setDuplicateMode('upsert')}
                className="accent-primary"
              />
              <span>Replace / Update</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-on-background">
              <input
                type="radio"
                name="duplicateMode"
                value="append"
                checked={duplicateMode === 'append'}
                onChange={() => setDuplicateMode('append')}
                className="accent-primary"
              />
              <span>Buat Baru (Append)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-on-background">
              <input
                type="radio"
                name="duplicateMode"
                value="replace"
                checked={duplicateMode === 'replace'}
                onChange={() => setDuplicateMode('replace')}
                className="accent-primary"
              />
              <span>Timpa Semua Timeline (Reset)</span>
            </label>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-error-container text-error text-xs rounded-lg border border-error/20 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Editable Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-secondary uppercase tracking-wider">
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5 min-w-[220px]">Nama Aktivitas *</th>
                <th className="p-2.5 min-w-[130px]">Phase</th>
                <th className="p-2.5 min-w-[140px]">Feature</th>
                <th className="p-2.5 min-w-[120px]">Mulai</th>
                <th className="p-2.5 min-w-[120px]">Selesai</th>
                <th className="p-2.5 min-w-[80px]">Mandays</th>
                <th className="p-2.5 min-w-[150px]">Resource</th>
                <th className="p-2.5 min-w-[80px]">Progress</th>
                <th className="p-2.5 w-16 text-center">Status</th>
                <th className="p-2.5 w-10 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-surface-container-low/40 transition-colors ${row.isDuplicate ? 'bg-amber-500/5' : ''
                    }`}
                >
                  <td className="p-2 text-center text-secondary font-mono">{idx + 1}</td>

                  {/* Activity Name */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.activityName}
                      onChange={(e) => handleCellChange(idx, 'activityName', e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary ${!row.activityName ? 'border-error bg-error/5' : 'border-outline-variant'
                        }`}
                    />
                  </td>

                  {/* Phase */}
                  <td className="p-1.5">
                    <select
                      value={row.phase || 'DEVELOPMENT'}
                      onChange={(e) => handleCellChange(idx, 'phase', e.target.value)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      {PHASE_OPTIONS.map(ph => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                  </td>

                  {/* Feature */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.feature || ''}
                      onChange={(e) => handleCellChange(idx, 'feature', e.target.value)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>

                  {/* Start Date */}
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.startDate || ''}
                      onChange={(e) => handleCellChange(idx, 'startDate', e.target.value)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>

                  {/* End Date */}
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.endDate || ''}
                      onChange={(e) => handleCellChange(idx, 'endDate', e.target.value)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>

                  {/* Mandays */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={row.mandays !== undefined ? row.mandays : ''}
                      onChange={(e) => handleCellChange(idx, 'mandays', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </td>

                  {/* Resource */}
                  <td className="p-1.5">
                    <select
                      value={row.assignedToName || ''}
                      onChange={(e) => handleCellChange(idx, 'assignedToName', e.target.value)}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Belum Ditugaskan --</option>
                      {members.map(m => {
                        const name = m.user?.fullName || m.user?.email || `Member-${m.memberId}`;
                        return (
                          <option key={m.memberId} value={name}>{name}</option>
                        );
                      })}
                    </select>
                  </td>

                  {/* Progress */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.progressPct !== undefined ? row.progressPct : 0}
                      onChange={(e) => handleCellChange(idx, 'progressPct', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-outline-variant rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                    />
                  </td>

                  {/* Status Badge */}
                  <td className="p-2 text-center">
                    {row.isDuplicate ? (
                      <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded font-semibold whitespace-nowrap">
                        Duplikat
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded font-semibold whitespace-nowrap">
                        Baru
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-secondary hover:text-error hover:bg-surface-container-high rounded transition-colors"
                      title="Hapus baris ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-outline-variant bg-surface-container-low">
          <span className="text-xs text-secondary font-medium">
            Total {rows.length} aktivitas akan diproses.
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={isSyncingResources || bulkImportMutation.isPending || rows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSyncingResources || bulkImportMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isSyncingResources
                  ? 'Menyinkronkan Member...'
                  : bulkImportMutation.isPending
                  ? 'Menyimpan Timeline...'
                  : `Simpan & Import (${rows.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

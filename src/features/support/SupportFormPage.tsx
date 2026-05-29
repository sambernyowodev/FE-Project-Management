import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Ticket, Clock } from 'lucide-react';
import {
  useGetSupportTicket,
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useDeleteSupportTicket
} from '@/modules/support/hooks/useSupportTickets';
import { useGetMasterProjects } from '@/modules/master/projects/hooks/useMasterProjects';
import { SupportTicketStatus } from '@/shared/constants/enums';

const STATUS_OPTIONS = Object.values(SupportTicketStatus);

export function SupportFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: ticket, isLoading: isTicketLoading } = useGetSupportTicket(Number(id));
  const { data: masterProjectsRes, isLoading: isMasterProjectsLoading } = useGetMasterProjects({ perPage: 200 });
  const masterProjects = masterProjectsRes?.data || [];

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const projectContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectContainerRef.current && !projectContainerRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProjectSelect = (value: string) => {
    setFormData(prev => {
      const next = { ...prev };
      if (value === 'new') {
        next.projectId = 'new';
        next.projectName = prev.newProjectName || '';
        next.customer = '';
      } else if (value) {
        const selectedProj = masterProjects.find(p => p.id === Number(value));
        if (selectedProj) {
          next.projectId = value;
          next.projectName = selectedProj.name;
          next.customer = ''; // Customer can be updated by user if needed
        } else {
          next.projectId = '';
          next.projectName = '';
          next.customer = '';
        }
      } else {
        next.projectId = '';
        next.projectName = '';
        next.customer = '';
      }
      return next;
    });
  };

  const filteredProjects = masterProjects.filter(p =>
    p.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();
  const deleteMutation = useDeleteSupportTicket();

  const [formData, setFormData] = useState({
    projectName: '',
    projectId: '',
    newProjectName: '',
    customer: '',
    issueTitle: '',
    issueDescription: '',
    picClient: '',
    hoursSpent: '0',
    status: SupportTicketStatus.OPEN as string,
    notes: '',
  });

  const [error, setError] = useState('');
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isEditing) {
      if (isTicketLoading || isMasterProjectsLoading) return;
      if (hasInitialized.current) return;

      if (ticket) {
        setFormData({
          projectName: ticket.masterProject?.name || '',
          projectId: ticket.masterProjectId ? String(ticket.masterProjectId) : '',
          newProjectName: '',
          customer: ticket.customer || '',
          issueTitle: ticket.issueTitle || '',
          issueDescription: ticket.issueDescription || '',
          picClient: ticket.picClient || '',
          hoursSpent: String(ticket.hoursSpent || 0),
          status: ticket.status || SupportTicketStatus.OPEN,
          notes: ticket.notes || '',
        });
        hasInitialized.current = true;
      }
    }
  }, [ticket, isEditing, masterProjects, isTicketLoading, isMasterProjectsLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'projectId') {
        if (value === 'new') {
          next.projectId = 'new';
          next.projectName = prev.newProjectName || '';
          next.customer = '';
        } else {
          const selectedProj = masterProjects.find(p => p.id === Number(value));
          if (selectedProj) {
            next.projectId = value;
            next.projectName = selectedProj.name;
            next.customer = '';
          } else {
            next.projectId = '';
            next.projectName = '';
            next.customer = '';
          }
        }
      } else if (name === 'newProjectName' && prev.projectId === 'new') {
        next.projectName = value;
      }

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.projectName && !formData.projectId) {
      setError('Silakan pilih project terkait');
      return;
    }

    if (formData.projectId === 'new' && !formData.newProjectName.trim()) {
      setError('Silakan isi nama project support baru');
      return;
    }

    const selectedProj = masterProjects.find(p => String(p.id) === formData.projectId);
    const masterProjectId = formData.projectId && formData.projectId !== 'new' && selectedProj
      ? selectedProj.id
      : undefined;
    const masterProjectName = formData.projectId === 'new'
      ? formData.newProjectName
      : (selectedProj ? selectedProj.name : formData.projectName);

    const payload: any = {
      projectName: masterProjectName,
      masterProjectId,
      masterProjectName,
      issueTitle: formData.issueTitle,
      issueDescription: formData.issueDescription || undefined,
    };

    if (isEditing) {
      const updatePayload = {
        ...payload,
        picClient: formData.picClient || undefined,
        hoursSpent: formData.hoursSpent ? Number(formData.hoursSpent) : 0,
        status: formData.status,
        notes: formData.notes || undefined
      };

      updateMutation.mutate(
        { id: Number(id), data: updatePayload },
        {
          onSuccess: () => {
            navigate('/support');
          },
          onError: (err: any) => {
            setError(err.message || 'Gagal memperbarui ticket');
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/support');
        },
        onError: (err: any) => {
          setError(err.message || 'Gagal membuat ticket');
        }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ticket ini?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          navigate('/support');
        }
      });
    }
  };

  if (isEditing && (isTicketLoading || isMasterProjectsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail ticket...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/support')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Support Ticket' : 'Buat Support Ticket'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing ? `Ubah detail untuk ticket ${ticket?.ticketCode || ''}` : 'Laporkan issue/kendala baru untuk diproses.'}
            </p>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/5 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Ticket</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container text-error text-sm rounded-lg border border-error/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <span>Detail Kendala (Issue)</span>
            </h2>

            <div className="flex flex-col gap-5">
              {/* Project Selection */}
              <div className="flex flex-col gap-2" ref={projectContainerRef}>
                <label className="text-sm font-semibold text-on-background">Project Terkait *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-semibold text-left flex justify-between items-center cursor-pointer"
                  >
                    <span className={formData.projectId ? 'text-on-background' : 'text-secondary'}>
                      {formData.projectId === 'new'
                        ? '+ Tambah Project Baru (Support)'
                        : masterProjects.find(p => String(p.id) === formData.projectId)
                          ? masterProjects.find(p => String(p.id) === formData.projectId)?.name
                          : '-- Pilih Project --'}
                    </span>
                    <span className="text-secondary text-xs">▼</span>
                  </button>

                  {isProjectDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg flex flex-col p-2 gap-2 max-h-80">
                      <input
                        type="text"
                        placeholder="Cari Project..."
                        value={projectSearchQuery}
                        onChange={e => setProjectSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                        autoFocus
                      />
                      <div className="overflow-y-auto flex flex-col max-h-48 gap-1">
                        {filteredProjects.length > 0 ? (
                          filteredProjects.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleProjectSelect(String(p.id));
                                setIsProjectDropdownOpen(false);
                                setProjectSearchQuery('');
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-container-low rounded transition-colors cursor-pointer ${formData.projectId === String(p.id) ? 'bg-surface-container-high font-bold' : ''}`}
                            >
                              {p.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-secondary text-center">
                            Tidak ditemukan project
                          </div>
                        )}

                        <div className="border-t border-outline-variant/60 my-1"></div>

                        <button
                          type="button"
                          onClick={() => {
                            handleProjectSelect('new');
                            setIsProjectDropdownOpen(false);
                            setProjectSearchQuery('');
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-container-low text-primary font-bold rounded transition-colors cursor-pointer ${formData.projectId === 'new' ? 'bg-surface-container-high' : ''}`}
                        >
                          + Tambah Project Baru (Support)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formData.projectId === 'new' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="newProjectName" className="text-sm font-semibold text-on-background">Nama Project Support Baru *</label>
                  <input
                    id="newProjectName"
                    name="newProjectName"
                    type="text"
                    required
                    value={formData.newProjectName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="e.g. Project Support A"
                  />
                </div>
              )}

              {/* Customer & Client PIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="customer" className="text-sm font-semibold text-on-background">Customer</label>
                  <input
                    id="customer"
                    name="customer"
                    type="text"
                    value={formData.customer}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="e.g. Telkomsel"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="picClient" className="text-sm font-semibold text-on-background">Client PIC</label>
                  <input
                    id="picClient"
                    name="picClient"
                    type="text"
                    value={formData.picClient}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="e.g. Mba Isti"
                  />
                </div>
              </div>

              {/* Issue Title */}
              <div className="flex flex-col gap-2">
                <label htmlFor="issueTitle" className="text-sm font-semibold text-on-background">Judul Kendala *</label>
                <input
                  id="issueTitle"
                  name="issueTitle"
                  type="text"
                  required
                  value={formData.issueTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. Error 500 saat mengunggah file attachment"
                />
              </div>

              {/* Issue Description */}
              <div className="flex flex-col gap-2">
                <label htmlFor="issueDescription" className="text-sm font-semibold text-on-background">Deskripsi Masalah</label>
                <textarea
                  id="issueDescription"
                  name="issueDescription"
                  rows={6}
                  value={formData.issueDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                  placeholder="Jelaskan langkah-langkah reproduksi error atau detail lainnya..."
                />
              </div>
            </div>
          </div>

          {/* Notes (Only when editing) */}
          {isEditing && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <span>Catatan Penyelesaian (Internal Notes)</span>
              </h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="notes" className="text-sm font-semibold text-on-background">Internal Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                  placeholder="Tulis resolusi masalah atau catatan penyelesaian..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Status, Hours, PIC */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Status & Alokasi Waktu</span>
            </h2>

            <div className="flex flex-col gap-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="status" className="text-sm font-semibold text-on-background">Status Ticket</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background font-semibold focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="hoursSpent" className="text-sm font-semibold text-on-background">Hours Spent (Jam)</label>
                    <input
                      id="hoursSpent"
                      name="hoursSpent"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.hoursSpent}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                  <p className="font-semibold text-on-background mb-1">💡 Catatan Alokasi:</p>
                  PIC Client, Jam pengerjaan (Hours Spent), dan Status ticket akan dapat diperbarui setelah ticket berhasil dibuat dan diproses oleh tim support.
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Ticket'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

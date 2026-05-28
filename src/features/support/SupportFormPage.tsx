import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Ticket, Layers, Clock, User } from 'lucide-react';
import { 
  useGetSupportTicket, 
  useCreateSupportTicket, 
  useUpdateSupportTicket,
  useDeleteSupportTicket
} from '@/modules/support/hooks/useSupportTickets';
import { useGetProjects, useGetProjectMembers } from '@/modules/projects/hooks/useProjects';
import { useGetUsers } from '@/modules/users/hooks/useUsers';
import { SupportTicketStatus } from '@/shared/constants/enums';


const STATUS_OPTIONS = Object.values(SupportTicketStatus);

export function SupportFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: ticket, isLoading: isTicketLoading } = useGetSupportTicket(Number(id));
  const { data: projectsRes } = useGetProjects();
  const projects = projectsRes?.data || [];

  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();
  const deleteMutation = useDeleteSupportTicket();

  const [formData, setFormData] = useState({
    projectName: '',
    projectId: '',
    newProjectName: '',
    issueTitle: '',
    issueDescription: '',
    picClient: '',
    hoursSpent: '0',
    status: SupportTicketStatus.OPEN as string,
    notes: '',
    businessAnalystId: '',
    uiUxId: '',
    devFeId: '',
    devBeId: '',
  });

  const selectedProjectId = Number(formData.projectId) || 0;
  const { data: membersRes } = useGetProjectMembers(selectedProjectId);
  const members = membersRes || [];

  const { data: usersRes } = useGetUsers({ perPage: 100 });
  const allUsers = usersRes?.data || [];

  const assigneesOptions = formData.projectId === 'new'
    ? allUsers.map((u: any) => ({ id: u.id, name: u.fullName }))
    : members.map((m: any) => ({ id: m.user?.id || m.userId, name: m.user?.fullName || 'Unknown' }));


  const [error, setError] = useState('');

  useEffect(() => {
    if (ticket && isEditing) {
      setFormData({
        projectName: ticket.projectName || '',
        projectId: ticket.projectId ? String(ticket.projectId) : '',
        newProjectName: '',
        issueTitle: ticket.issueTitle || '',
        issueDescription: ticket.issueDescription || '',
        picClient: ticket.picClient || '',
        hoursSpent: String(ticket.hoursSpent || 0),
        status: ticket.status || SupportTicketStatus.OPEN,
        notes: ticket.notes || '',
        businessAnalystId: ticket.businessAnalystId ? String(ticket.businessAnalystId) : '',
        uiUxId: ticket.uiUxId ? String(ticket.uiUxId) : '',
        devFeId: ticket.devFeId ? String(ticket.devFeId) : '',
        devBeId: ticket.devBeId ? String(ticket.devBeId) : '',
      });
    }
  }, [ticket, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      if (name === 'projectId') {
        if (value === 'new') {
          next.projectId = 'new';
          next.projectName = prev.newProjectName || '';
        } else {
          const selectedProj = projects.find(p => p.id === Number(value));
          if (selectedProj) {
            next.projectId = value;
            next.projectName = selectedProj.name;
          } else {
            next.projectId = '';
            next.projectName = '';
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

    const payload: any = {
      projectName: formData.projectId === 'new' ? formData.newProjectName : formData.projectName,
      projectId: formData.projectId && formData.projectId !== 'new' ? Number(formData.projectId) : undefined,
      issueTitle: formData.issueTitle,
      issueDescription: formData.issueDescription || undefined,
      businessAnalystId: formData.businessAnalystId ? Number(formData.businessAnalystId) : undefined,
      uiUxId: formData.uiUxId ? Number(formData.uiUxId) : undefined,
      devFeId: formData.devFeId ? Number(formData.devFeId) : undefined,
      devBeId: formData.devBeId ? Number(formData.devBeId) : undefined,
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

  if (isEditing && isTicketLoading) {
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
              <div className="flex flex-col gap-2">
                <label htmlFor="projectId" className="text-sm font-semibold text-on-background">Project Terkait *</label>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  value={formData.projectId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="new">+ Tambah Project Baru (Support)</option>
                </select>
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

          {/* Assignee Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>Assign Project Members</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Analyst */}
              <div className="flex flex-col gap-2">
                <label htmlFor="businessAnalystId" className="text-sm font-semibold text-on-background">Business Analyst</label>
                <select
                  id="businessAnalystId"
                  name="businessAnalystId"
                  value={formData.businessAnalystId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">-- Pilih BA --</option>
                  {assigneesOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* UI/UX */}
              <div className="flex flex-col gap-2">
                <label htmlFor="uiUxId" className="text-sm font-semibold text-on-background">UI/UX Designer</label>
                <select
                  id="uiUxId"
                  name="uiUxId"
                  value={formData.uiUxId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">-- Pilih UI/UX --</option>
                  {assigneesOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* Developer FE */}
              <div className="flex flex-col gap-2">
                <label htmlFor="devFeId" className="text-sm font-semibold text-on-background">Developer FE</label>
                <select
                  id="devFeId"
                  name="devFeId"
                  value={formData.devFeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">-- Pilih Dev FE --</option>
                  {assigneesOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* Developer BE */}
              <div className="flex flex-col gap-2">
                <label htmlFor="devBeId" className="text-sm font-semibold text-on-background">Developer BE</label>
                <select
                  id="devBeId"
                  name="devBeId"
                  value={formData.devBeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">-- Pilih Dev BE --</option>
                  {assigneesOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes (Only when editing) */}
          {isEditing && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
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

        {/* Right Sidebar - Status, Hours, PIC (Only visible/editable when editing or partially custom) */}
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

                  <div className="flex flex-col gap-2">
                    <label htmlFor="picClient" className="text-sm font-semibold text-on-background">Client PIC</label>
                    <input
                      id="picClient"
                      name="picClient"
                      type="text"
                      value={formData.picClient}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="e.g. Mba Isti"
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

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { 
  useGetProject, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject 
} from '@/modules/projects/hooks/useProjects';

const STATUS_OPTIONS = [
  'PLANNING',
  'IN_PROGRESS',
  'SIT',
  'UAT',
  'FUT',
  'CLOSED',
  'ON_HOLD',
  'CANCELLED'
];

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: project, isLoading: isProjectLoading } = useGetProject(Number(id));
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    picClient: '',
    platform: '',
    customer: '',
    status: 'PLANNING',
    timelineRemark: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (project && isEditing) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        picClient: project.picClient || '',
        platform: project.platform || '',
        customer: project.customer || '',
        status: project.status || 'PLANNING',
        timelineRemark: project.timelineRemark || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : ''
      });
    }
  }, [project, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For create, we just send required fields based on CreateProjectDto
    // For update, we can send all fields
    const dataToSend = { ...formData };
    if (!dataToSend.startDate) delete (dataToSend as any).startDate;
    if (!dataToSend.endDate) delete (dataToSend as any).endDate;

    if (isEditing) {
      updateMutation.mutate(
        { id: Number(id), data: dataToSend },
        {
          onSuccess: () => {
            navigate('/projects');
          }
        }
      );
    } else {
      createMutation.mutate(dataToSend as any, {
        onSuccess: () => {
          navigate('/projects');
        }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          navigate('/projects');
        }
      });
    }
  };

  if (isEditing && isProjectLoading) {
    return <div className="p-8 text-center text-secondary">Loading project details...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-on-background mb-1">
            {isEditing ? 'Edit Project' : 'New Project'}
          </h1>
          <p className="text-secondary text-sm">
            {isEditing ? 'Update project details and status.' : 'Fill in the details to create a new project.'}
          </p>
        </div>
        {isEditing && (
          <button 
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error-container transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-on-background">Project Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              placeholder="e.g. HCM Implementation"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="customer" className="text-sm font-semibold text-on-background">Customer</label>
            <input
              id="customer"
              name="customer"
              type="text"
              value={formData.customer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              placeholder="e.g. ACME Corp"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="picClient" className="text-sm font-semibold text-on-background">PIC Client</label>
            <input
              id="picClient"
              name="picClient"
              type="text"
              value={formData.picClient}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="platform" className="text-sm font-semibold text-on-background">Platform</label>
            <input
              id="platform"
              name="platform"
              type="text"
              value={formData.platform}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              placeholder="e.g. Web, Mobile, Desktop"
            />
          </div>

          {isEditing && (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="status" className="text-sm font-semibold text-on-background">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="timelineRemark" className="text-sm font-semibold text-on-background">Timeline Remark</label>
                <input
                  id="timelineRemark"
                  name="timelineRemark"
                  type="text"
                  value={formData.timelineRemark}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. On Track, Delayed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="startDate" className="text-sm font-semibold text-on-background">Start Date</label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="endDate" className="text-sm font-semibold text-on-background">End Date</label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor="description" className="text-sm font-semibold text-on-background">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
              placeholder="Detailed description of the project..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Update Project' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

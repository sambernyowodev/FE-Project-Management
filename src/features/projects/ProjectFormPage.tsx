import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Calendar, Link as LinkIcon, User, Layers } from 'lucide-react';
import {
  useGetProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject
} from '@/modules/projects/hooks/useProjects';
import { useGetMasterProjects, useCreateMasterProject } from '@/modules/master/projects/hooks/useMasterProjects';
import { useGetUsers } from '@/modules/master/users/hooks/useUsers';
import { ProjectStatus } from '@/shared/constants/enums';


const STATUS_OPTIONS = Object.values(ProjectStatus);

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: project, isLoading: isProjectLoading } = useGetProject(Number(id));
  const { data: masterProjectsRes } = useGetMasterProjects({ perPage: 100 });
  const masterProjects = masterProjectsRes?.data || [];

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const createMasterMutation = useCreateMasterProject();

  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [isPicDropdownOpen, setIsPicDropdownOpen] = useState(false);
  const picContainerRef = useRef<HTMLDivElement>(null);
  const [isMasterDropdownOpen, setIsMasterDropdownOpen] = useState(false);
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const masterContainerRef = useRef<HTMLDivElement>(null);
  const { data: usersRes } = useGetUsers({ perPage: 100 });
  const activeMembers = (usersRes?.data || []).filter((u: any) => u.isActive);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    picClient: '',
    picInternal: '',
    platform: '',
    customer: '',
    status: ProjectStatus.PLANNING as string,
    timelineRemark: '',
    startDate: '',
    endDate: '',
    actualStart: '',
    actualEnd: '',
    totalMandays: '',
    progressPct: '0',
    repositoryLink: '',
    timelineLink: '',
    remarks: ''
  });

  useEffect(() => {
    if (project && isEditing) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        picClient: project.picClient || '',
        picInternal: project.picInternal || '',
        platform: project.platform || '',
        customer: project.customer || '',
        status: project.status || ProjectStatus.PLANNING,
        timelineRemark: project.timelineRemark || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        actualStart: project.actualStart ? project.actualStart.split('T')[0] : '',
        actualEnd: project.actualEnd ? project.actualEnd.split('T')[0] : '',
        totalMandays: project.totalMandays !== undefined && project.totalMandays !== null ? String(project.totalMandays) : '',
        progressPct: project.progressPct !== undefined && project.progressPct !== null ? String(project.progressPct) : '0',
        repositoryLink: project.repositoryLink || '',
        timelineLink: project.timelineLink || '',
        remarks: project.remarks || ''
      });
      setSelectedMasterId(project.projectId ? String(project.projectId) : '');
    }
  }, [project, isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (picContainerRef.current && !picContainerRef.current.contains(event.target as Node)) {
        setIsPicDropdownOpen(false);
      }
      if (masterContainerRef.current && !masterContainerRef.current.contains(event.target as Node)) {
        setIsMasterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredPics = activeMembers.filter((member: any) =>
    member.fullName.toLowerCase().includes(formData.picInternal.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMasterSelection = (value: string) => {
    setSelectedMasterId(value);

    if (value === 'new') {
      setFormData(prev => ({
        ...prev,
        name: '',
        description: '',
        platform: '',
      }));
    } else if (value) {
      const selectedMaster = masterProjects.find(mp => String(mp.id) === value);
      if (selectedMaster) {
        setFormData(prev => ({
          ...prev,
          name: selectedMaster.name,
          description: selectedMaster.description || '',
          platform: selectedMaster.platform || '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        description: '',
        platform: '',
      }));
    }
  };

  const filteredMasterProjects = masterProjects.filter(mp =>
    mp.name.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
    (mp.projectCode && mp.projectCode.toLowerCase().includes(masterSearchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMasterId) {
      alert('Silakan pilih Master Project terlebih dahulu');
      return;
    }

    try {
      let targetProjectId = Number(selectedMasterId);

      // 1. If it's a new master project, create it first
      if (selectedMasterId === 'new') {
        const newMaster = await createMasterMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          platform: formData.platform || undefined,
        });
        targetProjectId = newMaster.id;
      }

      const dataToSend: any = {
        projectId: targetProjectId,
        picClient: formData.picClient || undefined,
        picInternal: formData.picInternal || undefined,
        platform: formData.platform || undefined,
        customer: formData.customer || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        totalMandays: formData.totalMandays ? Number(formData.totalMandays) : undefined,
        status: formData.status,
        timelineRemark: formData.timelineRemark || undefined,
        progressPct: formData.progressPct ? Number(formData.progressPct) : 0,
        repositoryLink: formData.repositoryLink || undefined,
        timelineLink: formData.timelineLink || undefined,
        remarks: formData.remarks || undefined,
        actualStart: formData.actualStart || undefined,
        actualEnd: formData.actualEnd || undefined,
      };

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
        createMutation.mutate(dataToSend, {
          onSuccess: () => {
            navigate('/projects');
          }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan project');
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Loading project details...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Project' : 'Create Project'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing ? 'Update enterprise project settings, dates, and repositories.' : 'Register a new project in the system.'}
            </p>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/5 transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>General Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-on-background">Master Project</label>
                    <input
                      type="text"
                      disabled
                      value={project ? `${project.name} (${project.projectCode})` : ''}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-surface-container-low disabled:opacity-80 font-semibold"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2" ref={masterContainerRef}>
                    <label className="text-sm font-semibold text-on-background">Master Project *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMasterDropdownOpen(!isMasterDropdownOpen)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-semibold text-left flex justify-between items-center cursor-pointer"
                      >
                        <span className={selectedMasterId ? 'text-on-background' : 'text-secondary'}>
                          {selectedMasterId === 'new'
                            ? ' + Tambah Project Baru '
                            : masterProjects.find(mp => String(mp.id) === selectedMasterId)
                              ? `${masterProjects.find(mp => String(mp.id) === selectedMasterId)?.name} (${masterProjects.find(mp => String(mp.id) === selectedMasterId)?.projectCode})`
                              : '-- Pilih Master Project --'}
                        </span>
                        <span className="text-secondary text-xs">▼</span>
                      </button>

                      {isMasterDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg flex flex-col p-2 gap-2 max-h-80">
                          <input
                            type="text"
                            placeholder="Cari Master Project..."
                            value={masterSearchQuery}
                            onChange={e => setMasterSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                            autoFocus
                          />
                          <div className="overflow-y-auto flex flex-col max-h-48 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleMasterSelection('new');
                                setIsMasterDropdownOpen(false);
                                setMasterSearchQuery('');
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-container-low text-primary font-bold rounded transition-colors cursor-pointer ${selectedMasterId === 'new' ? 'bg-surface-container-high' : ''}`}
                            >
                              + Tambah Project Baru
                            </button>

                            {filteredMasterProjects.length > 0 ? (
                              filteredMasterProjects.map(mp => (
                                <button
                                  key={mp.id}
                                  type="button"
                                  onClick={() => {
                                    handleMasterSelection(String(mp.id));
                                    setIsMasterDropdownOpen(false);
                                    setMasterSearchQuery('');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-container-low rounded transition-colors cursor-pointer ${selectedMasterId === String(mp.id) ? 'bg-surface-container-high font-bold' : ''}`}
                                >
                                  {mp.name} ({mp.projectCode})
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-secondary text-center">
                                Tidak ditemukan master project
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-semibold text-on-background">Project Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    disabled={selectedMasterId !== 'new' && selectedMasterId !== ''}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background disabled:bg-surface-container-low disabled:opacity-80"
                    placeholder="e.g. HCM Implementation"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="customer" className="text-sm font-semibold text-on-background">
                    Customer
                  </label>
                  <input
                    id="customer"
                    name="customer"
                    type="text"
                    value={formData.customer}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="e.g. PT Bank Mandiri"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="picClient" className="text-sm font-semibold text-on-background">
                    PIC Client
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      id="picClient"
                      name="picClient"
                      type="text"
                      value={formData.picClient}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. John Doe (Client PM)"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2" ref={picContainerRef}>
                  <label htmlFor="picInternal" className="text-sm font-semibold text-on-background">
                    PIC Internal
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      id="picInternal"
                      name="picInternal"
                      type="text"
                      value={formData.picInternal}
                      onChange={handleChange}
                      onFocus={() => setIsPicDropdownOpen(true)}
                      className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="Search or select internal PIC..."
                      autoComplete="off"
                    />

                    {isPicDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg">
                        {filteredPics.length > 0 ? (
                          filteredPics.map((member: any) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, picInternal: member.fullName }));
                                setIsPicDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer"
                            >
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-xs text-secondary">{member.email}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-secondary text-center">
                            No active members found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="platform" className="text-sm font-semibold text-on-background">
                    Platform
                  </label>
                  <input
                    id="platform"
                    name="platform"
                    type="text"
                    disabled={selectedMasterId !== 'new' && selectedMasterId !== ''}
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background disabled:bg-surface-container-low disabled:opacity-80"
                    placeholder="e.g. Web & Mobile App"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="totalMandays" className="text-sm font-semibold text-on-background">Total Mandays</label>
                  <input
                    id="totalMandays"
                    name="totalMandays"
                    type="number"
                    min="0"
                    value={formData.totalMandays}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="e.g. 120"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-semibold text-on-background">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  disabled={selectedMasterId !== 'new' && selectedMasterId !== ''}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y disabled:bg-surface-container-low disabled:opacity-80"
                  placeholder="Detailed description of the project scope and goals..."
                />
              </div>
            </div>

            {/* Development Links & Metadata (Only when editing) */}
            {isEditing && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
                <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  <span>References & Links</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="repositoryLink" className="text-sm font-semibold text-on-background">Repository Link</label>
                    <input
                      id="repositoryLink"
                      name="repositoryLink"
                      type="url"
                      value={formData.repositoryLink}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. https://github.com/org/repo"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="timelineLink" className="text-sm font-semibold text-on-background">External Timeline Link</label>
                    <input
                      id="timelineLink"
                      name="timelineLink"
                      type="url"
                      value={formData.timelineLink}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. https://trello.com/board"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="remarks" className="text-sm font-semibold text-on-background">Remarks</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows={2}
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                    placeholder="General remarks or notes..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Status, Dates, Progress */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Timeline & Status</span>
              </h2>

              <div className="flex flex-col gap-5">
                {/* Status Options (Only on edit) */}
                {isEditing && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="status" className="text-sm font-semibold text-on-background">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-semibold"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="progressPct" className="text-sm font-semibold text-on-background">Progress ({formData.progressPct}%)</label>
                      </div>
                      <input
                        id="progressPct"
                        name="progressPct"
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progressPct}
                        onChange={handleChange}
                        className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="timelineRemark" className="text-sm font-semibold text-on-background">Timeline Remark</label>
                      <input
                        id="timelineRemark"
                        name="timelineRemark"
                        type="text"
                        value={formData.timelineRemark}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                        placeholder="e.g. On Track, Behind Schedule"
                      />
                    </div>
                  </>
                )}

                {/* Date Inputs */}
                <div className="border-t border-outline-variant pt-4 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Planned Schedule</h3>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="startDate" className="text-sm font-semibold text-on-background">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
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
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    />
                  </div>
                </div>

                {/* Actual Schedule (Only on edit) */}
                {isEditing && (
                  <div className="border-t border-outline-variant pt-4 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Actual Schedule</h3>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="actualStart" className="text-sm font-semibold text-on-background">Actual Start</label>
                      <input
                        id="actualStart"
                        name="actualStart"
                        type="date"
                        value={formData.actualStart}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="actualEnd" className="text-sm font-semibold text-on-background">Actual End</label>
                      <input
                        id="actualEnd"
                        name="actualEnd"
                        type="date"
                        value={formData.actualEnd}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

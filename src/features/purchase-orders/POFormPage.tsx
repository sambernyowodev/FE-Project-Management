import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, DollarSign, ClipboardList } from 'lucide-react';
import {
  useCreatePurchaseOrder,
  useGetPurchaseOrder,
  useUpdatePurchaseOrder
} from '@/modules/purchase-orders/hooks/usePurchaseOrders';

export function POFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const poId = id ? Number(id) : undefined;
  const isEditMode = !!poId;

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { data: po, isLoading: isPoLoading } = useGetPurchaseOrder(poId);

  const [formData, setFormData] = useState({
    poName: '',
    customer: 'Telkomsel HCM',
    totalMandays: '',
    totalAmount: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (po && isEditMode) {
      setFormData({
        poName: po.poName || '',
        customer: po.customer || '',
        totalMandays: po.totalMandays?.toString() || '',
        totalAmount: po.totalAmount?.toString() || '',
        description: po.description || '',
        startDate: po.startDate ? new Date(po.startDate).toISOString().split('T')[0] : '',
        endDate: po.endDate ? new Date(po.endDate).toISOString().split('T')[0] : '',
      });
    }
  }, [po, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.poName || !formData.customer || !formData.totalMandays || !formData.totalAmount) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      const payload = {
        poName: formData.poName,
        customer: formData.customer,
        totalMandays: Number(formData.totalMandays),
        totalAmount: Number(formData.totalAmount),
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      if (isEditMode && poId) {
        await updateMutation.mutateAsync({ id: poId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/purchase-orders');
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} PO`);
    }
  };

  if (isEditMode && isPoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Loading PO details...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <button
          type="button"
          onClick={() => navigate('/purchase-orders')}
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">
            {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-secondary text-sm">
            {isEditMode ? 'Modify PO fields and parameters.' : 'Register a new client Purchase Order to track budget and project alocations.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left / Main Info */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <span>PO Information</span>
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="poName" className="text-sm font-semibold text-on-background">PO Name *</label>
                  <input
                    id="poName"
                    name="poName"
                    type="text"
                    required
                    value={formData.poName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
                    placeholder="e.g. PO HCM - Sprint 6 Development"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="customer" className="text-sm font-semibold text-on-background">Customer *</label>
                  <input
                    id="customer"
                    name="customer"
                    type="text"
                    required
                    value={formData.customer}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
                    placeholder="e.g. Telkomsel HCM"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-sm font-semibold text-on-background">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background resize-y"
                    placeholder="Provide details about PO terms, scope, or remarks..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Budget & Dates */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Budget & Dates</span>
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="totalMandays" className="text-sm font-semibold text-on-background">Total Mandays *</label>
                  <input
                    id="totalMandays"
                    name="totalMandays"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalMandays}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="totalAmount" className="text-sm font-semibold text-on-background">Total Amount (IDR) *</label>
                  <input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    required
                    min="0"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
                    placeholder="e.g. 150000000"
                  />
                </div>

                <div className="border-t border-outline-variant pt-4 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Duration</span>
                  </h3>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="startDate" className="text-sm font-semibold text-on-background">Start Date</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
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
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
            className="px-6 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold cursor-pointer text-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEditMode ? updateMutation.isPending : createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isEditMode
                ? (updateMutation.isPending ? 'Saving...' : 'Update PO')
                : (createMutation.isPending ? 'Saving...' : 'Create PO')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

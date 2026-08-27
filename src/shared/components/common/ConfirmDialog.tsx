import React from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from 'lucide-react';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-error" />,
          iconBg: 'bg-error-container/40 text-error border-error/20',
          confirmBtn: 'bg-error text-on-error hover:bg-error/90 focus:ring-error/20',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          confirmBtn: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500/20',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-primary" />,
          iconBg: 'bg-primary/10 text-primary border-primary/20',
          confirmBtn: 'bg-primary text-on-primary hover:bg-primary/90 focus:ring-primary/20',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          confirmBtn: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/20',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">

        {/* Modal Header / Icon */}
        <div className="p-6 pb-2 flex items-start gap-4">
          <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-on-background leading-snug">
              {title}
            </h3>
            <div className="text-xs text-secondary mt-1.5 leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-secondary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/60 mt-4 bg-surface-container-low/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-secondary hover:text-on-background border border-outline-variant rounded-lg hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 ${styles.confirmBtn}`}
          >
            {isLoading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

export type ConfirmType = 'info' | 'danger' | 'success' | 'warning';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'info',
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="h-6 w-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      default:
        return 'bg-slate-900 hover:bg-slate-800 text-white';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-100';
      case 'warning':
        return 'bg-amber-100';
      case 'success':
        return 'bg-emerald-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getIconBg()}`}>
              {getIcon()}
            </div>
            <button 
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {message}
            </p>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

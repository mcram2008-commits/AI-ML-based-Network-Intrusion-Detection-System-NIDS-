import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastNotification = ({ type = 'info', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300',
      icon: <CheckCircle2 size={18} className="text-emerald-400" />
    },
    error: {
      bg: 'bg-red-950/90 border-red-500/40 text-red-300',
      icon: <XCircle size={18} className="text-red-400" />
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/40 text-amber-300',
      icon: <AlertTriangle size={18} className="text-amber-400" />
    },
    info: {
      bg: 'bg-blue-950/90 border-blue-500/40 text-blue-300',
      icon: <Info size={18} className="text-blue-400" />
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl transition-all animate-bounce-short max-w-md ${config.bg}`}>
      {config.icon}
      <span className="text-xs font-medium tracking-wide flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastNotification;

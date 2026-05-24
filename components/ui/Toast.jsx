'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
};
const colors = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  warning: 'text-amber-400',
};

function Toast({ id, message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 3500);
    return () => clearTimeout(t);
  }, [id, onClose]);

  const Icon = icons[type] ?? CheckCircle;

  return (
    <div className="flex items-start gap-3 bg-[#0D1F3C] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm">
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors[type]}`} />
      <span className="text-sm flex-1 leading-snug">{message}</span>
      <button onClick={() => onClose(id)} className="text-white/40 hover:text-white transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onClose={onRemove} />
        </div>
      ))}
    </div>
  );
}

let _id = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = ++_id;
    setToasts(p => [...p, { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}

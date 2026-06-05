'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/i18n/LanguageContext';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({});
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((config) => {
    setOptions(config || {});
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              {(options.variant === 'destructive' || !options.variant) && (
                <div className="w-10 h-10 rounded-full bg-red-100/80 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <DialogTitle className="text-[18px] font-bold text-gray-900 tracking-tight">
                {options.title ?? t('common.confirmTitle')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-[14px] leading-relaxed text-gray-500">
              {options.message ?? t('common.confirmMessage')}
            </DialogDescription>
          </div>

          {/* Footer Area / Action Buttons */}
          <div className="bg-gray-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              className="bg-transparent hover:bg-gray-200/50 text-gray-600 font-medium text-[13px] h-10 px-4"
            >
              {options.cancelText ?? t('common.cancel')}
            </Button>
            <Button 
              variant={options.variant || 'destructive'} 
              onClick={handleConfirm}
              className={`h-10 px-5 text-[13px] font-semibold shadow-sm ${
                (options.variant || 'destructive') === 'destructive' 
                ? 'bg-red-600 hover:bg-red-700 text-white border-none' 
                : 'bg-gray-900 hover:bg-gray-800 text-white border-none'
              }`}
            >
              {options.confirmText ?? t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
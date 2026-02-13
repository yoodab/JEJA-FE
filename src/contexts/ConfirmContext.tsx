import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import type { ConfirmType } from '../components/common/ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          title: options.title || '확인',
          confirmText: options.confirmText || '확인',
          cancelText: options.cancelText || '취소',
          type: options.type || 'info',
          ...options
        },
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  }, [modalState]);

  const handleConfirm = useCallback(() => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  }, [modalState]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState && (
        <ConfirmModal
          isOpen={modalState.isOpen}
          title={modalState.options.title!}
          message={modalState.options.message}
          confirmText={modalState.options.confirmText}
          cancelText={modalState.options.cancelText}
          type={modalState.options.type}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

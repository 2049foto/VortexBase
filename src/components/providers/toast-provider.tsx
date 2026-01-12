'use client';

import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; className: string }> = {
  success: {
    icon: CheckCircle,
    className: 'border-vortex-success/30 bg-vortex-success/10',
  },
  error: {
    icon: AlertCircle,
    className: 'border-vortex-error/30 bg-vortex-error/10',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-vortex-warning/30 bg-vortex-warning/10',
  },
  info: {
    icon: Info,
    className: 'border-vortex-primary/30 bg-vortex-primary/10',
  },
};

const iconColors: Record<ToastType, string> = {
  success: 'text-vortex-success',
  error: 'text-vortex-error',
  warning: 'text-vortex-warning',
  info: 'text-vortex-primary',
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ type: 'success', title, description }),
    error: (title, description) => addToast({ type: 'error', title, description }),
    warning: (title, description) => addToast({ type: 'warning', title, description }),
    info: (title, description) => addToast({ type: 'info', title, description }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      <Toast.Provider swipeDirection="right">
        {children}

        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const config = toastConfig[toast.type];
            const Icon = config.icon;

            return (
              <Toast.Root
                key={toast.id}
                duration={toast.duration || 5000}
                onOpenChange={(open) => {
                  if (!open) dismiss(toast.id);
                }}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={cn(
                    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
                    config.className
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', iconColors[toast.type])} />
                  
                  <div className="flex-1 space-y-1">
                    <Toast.Title className="text-sm font-semibold text-vortex-text">
                      {toast.title}
                    </Toast.Title>
                    {toast.description && (
                      <Toast.Description className="text-xs text-vortex-text-muted">
                        {toast.description}
                      </Toast.Description>
                    )}
                  </div>

                  <Toast.Close asChild>
                    <button
                      className="shrink-0 rounded p-1 text-vortex-text-muted transition-colors hover:bg-vortex-border hover:text-vortex-text"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Toast.Close>
                </motion.div>
              </Toast.Root>
            );
          })}
        </AnimatePresence>

        <Toast.Viewport className="fixed bottom-0 right-0 z-[100] m-0 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

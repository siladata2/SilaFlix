'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastFunction = (message: string, type?: 'info' | 'success' | 'error') => void;

const ToastContext = createContext<ToastFunction>(() => {});

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);

  const showToast = useCallback<ToastFunction>((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-bg-card border border-line text-ink text-xs px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFunction {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return (message: string) => console.log(message);
  }
  return ctx;
}

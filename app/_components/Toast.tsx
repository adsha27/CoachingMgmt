"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_counter;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    const timer = setTimeout(() => dismiss(id), 3200);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none px-4 w-full max-w-sm"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto cursor-pointer animate-slide-up
                ${t.type === "success" ? "bg-gray-900 text-white" : ""}
                ${t.type === "error" ? "bg-red-600 text-white" : ""}
                ${t.type === "info" ? "bg-orange-600 text-white" : ""}
              `}
            >
              {t.type === "success" && <span className="text-green-400">✓</span>}
              {t.type === "error" && <span>✕</span>}
              {t.type === "info" && <span className="text-blue-200">ℹ</span>}
              <span className="flex-1">{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

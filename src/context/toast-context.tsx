"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

export type ToastOptions = ExternalToast;

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  message: (message: string, options?: ToastOptions) => void;
  dismiss: (id?: string | number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useMemo<ToastApi>(
    () => ({
      success: (message, options) => sonnerToast.success(message, options),
      error: (message, options) => sonnerToast.error(message, options),
      info: (message, options) => sonnerToast.info(message, options),
      warning: (message, options) => sonnerToast.warning(message, options),
      message: (message, options) => sonnerToast.message(message, options),
      dismiss: (id) => sonnerToast.dismiss(id),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}

/** Mostra erro no toast (útil fora de componentes React). */
export function showErrorToast(message: string, options?: ToastOptions) {
  sonnerToast.error(message, options);
}

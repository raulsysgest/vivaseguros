"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/toast-context";
import { AppToaster } from "@/components/ui/app-toaster";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <AppToaster />
      </ToastProvider>
    </SessionProvider>
  );
}

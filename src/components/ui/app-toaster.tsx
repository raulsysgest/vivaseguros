"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            "group !rounded-xl !border !border-zinc-200/80 !bg-white/95 !text-zinc-900 !shadow-lg !shadow-zinc-900/10 !backdrop-blur-md dark:!border-zinc-700 dark:!bg-zinc-900/95 dark:!text-zinc-50",
          title: "!text-sm !font-semibold !tracking-tight",
          description: "!text-xs !text-zinc-600 dark:!text-zinc-400",
          actionButton:
            "!rounded-lg !bg-[#C85A27] !text-white !text-xs !font-semibold",
          cancelButton:
            "!rounded-lg !bg-zinc-100 !text-zinc-700 dark:!bg-zinc-800 dark:!text-zinc-200",
          closeButton:
            "!border-zinc-200 !bg-white dark:!border-zinc-700 dark:!bg-zinc-900",
          success: "!border-emerald-200/80 dark:!border-emerald-900/50",
          error: "!border-red-200/80 dark:!border-red-900/50",
          warning: "!border-amber-200/80 dark:!border-amber-900/50",
          info: "!border-sky-200/80 dark:!border-sky-900/50",
        },
      }}
    />
  );
}

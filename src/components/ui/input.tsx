import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-zinc-900 transition-colors duration-150",
            "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-zinc-200 dark:border-zinc-700 focus:border-[#C85A27] focus:ring-[#C85A27]/20",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

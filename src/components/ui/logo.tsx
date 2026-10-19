import React from "react";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
}

/**
 * Logotipo oficial da Viva Seguros vetorizado em SVG de alta definição.
 * Utiliza o símbolo característico em gradiente magenta e terracota,
 * com tipografia estilizada 'VIVA SEGUROS'.
 */
export function Logo({ className, variant = "full", size = "md" }: LogoProps) {
  const sizeMap = {
    sm: { height: 32, iconSize: 26, titleSize: "text-lg", subSize: "text-[9px]" },
    md: { height: 42, iconSize: 34, titleSize: "text-2xl", subSize: "text-[11px]" },
    lg: { height: 56, iconSize: 46, titleSize: "text-3xl", subSize: "text-[13px]" },
  };

  const { iconSize, titleSize, subSize } = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Símbolo do 'V' estilizado da Viva Seguros */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="viva-magenta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C026D3" />
            <stop offset="50%" stopColor="#9D174D" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
          <linearGradient id="viva-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#C85A27" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Perna esquerda do V (Magenta / Vinho) */}
        <path
          d="M12 14L28 50C28.8 51.8 31.2 51.8 32 50L36 41L23 12C22.2 10.2 19.8 10.2 19 12L12 14Z"
          fill="url(#viva-magenta-grad)"
        />

        {/* Perna direita do V (Terracota / Laranja) */}
        <path
          d="M52 14L36 50C35.2 51.8 32.8 51.8 32 50L28 41L41 12C41.8 10.2 44.2 10.2 45 12L52 14Z"
          fill="url(#viva-orange-grad)"
        />
      </svg>

      {variant === "full" && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={cn(
              "font-black tracking-tight text-[#1E1B4B] dark:text-zinc-100 font-sans",
              titleSize
            )}
          >
            VIVA
          </span>
          <span
            className={cn(
              "font-semibold tracking-[0.22em] text-[#52525B] dark:text-zinc-400 uppercase mt-0.5",
              subSize
            )}
          >
            SEGUROS
          </span>
        </div>
      )}
    </div>
  );
}

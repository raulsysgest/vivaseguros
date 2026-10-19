"use client";

import React from "react";
import { Bell, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/context/dashboard-context";

export function Navbar() {
  const { user } = useAuth();
  const { toggleMobile, theme, toggleTheme } = useDashboard();

  const userName = user?.name || "Elizeth Lima";
  const userRole = user?.role || "Agente Viva";

  return (
    <header className="h-18 bg-white border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Lado Esquerdo: Botão Hamburger Mobile + Título */}
      <div className="flex items-center gap-3">
        {/* Botão Hamburger (Mobile) */}
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Abrir menu"
          className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Título da Página */}
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900">
          Painel do Agente
        </h1>
      </div>

      {/* Lado Direito: Ações (Tema, Notificações, Perfil) */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Seletor de Tema Dark / Light (Atualmente operando em Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
          aria-label="Alternar tema"
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          {theme === "light" ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {/* Notificações com Badge */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            1
          </span>
        </button>

        <div className="h-6 w-px bg-zinc-200 hidden sm:block mx-1" />

        {/* Informações do Agente */}
        <div className="flex items-center gap-2.5 pl-1">
          {/* Avatar com Gradiente Oficial */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9D174D] via-[#DB2777] to-[#F97316] flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-white shrink-0">
            {userName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs sm:text-sm font-semibold text-zinc-900">
              {userName}
            </span>
            <span className="text-[11px] text-zinc-500">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

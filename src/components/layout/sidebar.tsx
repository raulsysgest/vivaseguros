"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  CheckSquare,
  ShoppingBag,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/context/dashboard-context";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapse } = useDashboard();

  const navItems = [
    { label: "Visão Geral", href: "/dashboard", icon: Home },
    { label: "Gestão de Simulações", href: "/simulacoes", icon: FileText },
    { label: "Gestão de Propostas", href: "/propostas", icon: CheckSquare },
    { label: "Gestão de Vendas", href: "/vendas", icon: ShoppingBag },
    { label: "Perfil", href: "/perfil", icon: User },
  ];

  const renderNavContent = (collapsed: boolean, onNavClick?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Topo / Logo */}
      <div className={cn(
        "h-18 flex items-center border-b border-zinc-100 px-4",
        collapsed ? "justify-center" : "justify-between px-5"
      )}>
        <Link href="/dashboard" onClick={onNavClick} className="flex items-center">
          <Logo
            variant={collapsed ? "icon" : "full"}
            size={collapsed ? "sm" : "md"}
          />
        </Link>
      </div>

      {/* Lista de Navegação */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#C85A27] text-white shadow-xs font-semibold"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-zinc-500")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Botão Sair */}
        <button
          type="button"
          onClick={() => {
            if (onNavClick) onNavClick();
            logout();
          }}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer mt-auto",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 text-zinc-500 group-hover:text-red-600" />
          {!collapsed && <span>Sair</span>}
        </button>
      </nav>

      {/* Botão de Dobrar/Expandir Desktop */}
      <div className="hidden md:flex p-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={toggleCollapse}
          className={cn(
            "w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SIDEBAR DESKTOP (Expansível / Dobrável) */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-zinc-200/90 shrink-0 transition-all duration-200 ease-in-out h-screen sticky top-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {renderNavContent(isCollapsed)}
      </aside>

      {/* 2. SIDEBAR MOBILE (Drawer Off-Canvas) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col md:hidden transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Botão Fechar Mobile */}
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Fechar menu"
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {renderNavContent(false, closeMobile)}
      </aside>
    </>
  );
}

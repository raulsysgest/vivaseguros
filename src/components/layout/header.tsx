"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
            VivaSeguros
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/#seguros" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Nossos Seguros
          </Link>
          <Link href="/#como-funciona" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Como Funciona
          </Link>
          <Link href="/#cotacao" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Simular Cotação
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-20 h-9 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
                Olá, {user?.name?.split(" ")[0]}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/#cotacao">
                <Button variant="primary" size="sm">
                  Cotar Agora
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Entrar - Viva Seguros",
  description: "Acesse o portal e painel do agente da Viva Seguros.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#C85A27] flex items-center justify-center p-4 sm:p-6">
      {/* Card Central Branco */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl shadow-black/15 p-8 sm:p-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        {/* Logotipo Oficial Viva Seguros */}
        <div className="mb-4">
          <Logo size="md" />
        </div>

        {/* Título de Boas-vindas */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mb-6 text-center">
          Bem-vindo de volta
        </h1>

        {/* Formulário com react-hook-form */}
        <Suspense fallback={<div className="h-44 w-full flex items-center justify-center text-xs text-zinc-400">Carregando formulário...</div>}>
          <LoginForm />
        </Suspense>

        {/* Link de Recuperação de Senha */}
        <div className="mt-6 text-center">
          <Link
            href="/recuperar-senha"
            className="text-xs font-normal text-zinc-700 hover:text-[#C85A27] hover:underline transition-colors"
          >
            Esqueceu a sua senha? Recupere por aqui!
          </Link>
        </div>
      </div>
    </div>
  );
}

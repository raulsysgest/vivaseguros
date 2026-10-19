"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                VivaSeguros
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tranquilidade e proteção completa para você, sua família e sua empresa.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Soluções
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="/#seguros" className="hover:text-blue-600">Seguro Auto</Link></li>
              <li><Link href="/#seguros" className="hover:text-blue-600">Seguro de Vida</Link></li>
              <li><Link href="/#seguros" className="hover:text-blue-600">Seguro Residencial</Link></li>
              <li><Link href="/#seguros" className="hover:text-blue-600">Seguro Empresarial</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Atendimento
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>0800 123 4567</li>
              <li>suporte@vivaseguros.com.br</li>
              <li>Segunda a Sexta, 8h às 18h</li>
              <li>Sinistros: 24 horas</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Institucional
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="#" className="hover:text-blue-600">Sobre Nós</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Privacidade (LGPD)</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-4">
          <p>© 2026 VivaSeguros Corretora. Todos os direitos reservados.</p>
          <p>VivaSeguros Intermediações de Negócios Ltda.</p>
        </div>
      </div>
    </footer>
  );
}

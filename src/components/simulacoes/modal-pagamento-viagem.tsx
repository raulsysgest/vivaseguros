"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Mail, Phone, X } from "lucide-react";
import type { ViagemDadosPagamento } from "@/lib/viagem-proposta";
import { formatPrecoViagemAOA } from "@/lib/viagem-simulacao";
import { cn } from "@/utils/cn";
import { raioBotaoPonta } from "@/utils/botao-ponta";

type ModalPagamentoViagemProps = {
  isOpen: boolean;
  dados: ViagemDadosPagamento;
  onClose: () => void;
  onVoltarResumo: () => void;
  onConcluir: () => void;
};

const gridLabel =
  "text-[9px] font-bold uppercase tracking-wide text-white/85 sm:text-[10px]";
const gridValue = "mt-1 text-sm font-bold text-white sm:text-base";

function PagamentoCampo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className={gridLabel}>{label}</p>
      <p className={gridValue}>{value}</p>
    </div>
  );
}

export function ModalPagamentoViagem({
  isOpen,
  dados,
  onClose,
  onVoltarResumo,
  onConcluir,
}: ModalPagamentoViagemProps) {
  const valorLabel = formatPrecoViagemAOA(dados.totalAmount);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="relative flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-y-auto rounded-[24px] px-5 py-8 shadow-2xl sm:px-10 sm:py-10"
            style={{
              background:
                "linear-gradient(to top right, #f5921e 0%, #ef7a4a 18%, #e86a9a 42%, #c958d4 68%, #9b5cf0 100%)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-md hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={onConcluir}
                className="flex items-center gap-2 rounded-b-[1.25rem] bg-gradient-to-r from-[#c70f84] via-orange-500 to-orange-400 px-6 py-2.5 text-xs font-bold uppercase text-white shadow-lg sm:text-sm"
              >
                Voltar ao início
                <Home className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-black uppercase text-black sm:text-3xl">
                Dados para pagamento
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white sm:text-base">
                Caro cliente, efectue o pagamento do seu seguro utilizando os dados abaixo.
                Foi enviado um e-mail com os dados de pagamento.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-center text-sm font-black uppercase text-black sm:text-lg">
                Referência Multicaixa
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4 border-y border-white/30 py-5 sm:grid-cols-4">
                <PagamentoCampo label="Entidade" value={dados.entityMb} />
                <PagamentoCampo label="Referência" value={dados.referenceMb} />
                <PagamentoCampo label="Valor" value={valorLabel} />
                <PagamentoCampo label="Nº do contracto" value={dados.contractNumber} />
              </div>
            </div>

            <hr className="my-6 border-white/40" />

            <p className="text-center text-xs text-white sm:text-sm">
              Após pagamento a Viva Seguros irá enviar a apólice para o seu e-mail. Qualquer
              questão deverá contactar os nossos serviços.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
              <div className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">+244 923 165 450</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href="mailto:online@vivaseguros.ao"
                  className="text-sm font-semibold underline-offset-2 hover:underline"
                >
                  online@vivaseguros.ao
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onVoltarResumo}
                className={cn(
                  raioBotaoPonta,
                  "border border-white/70 px-6 py-2.5 text-xs font-bold uppercase text-white hover:bg-white/10",
                )}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onConcluir}
                className={cn(
                  raioBotaoPonta,
                  "bg-[#31124b] px-12 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:bg-[#3d1860]",
                )}
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

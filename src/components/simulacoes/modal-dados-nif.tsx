"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import type { NifContribuinte } from "@/types/nif";

interface ModalDadosNifProps {
  isOpen: boolean;
  dados: NifContribuinte | null;
  onConfirm: () => void;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || !String(value).trim()) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/10 py-2.5 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/80">
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export function ModalDadosNif({ isOpen, dados, onConfirm, onClose }: ModalDadosNifProps) {
  return (
    <AnimatePresence>
      {isOpen && dados && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#1E0836] shadow-2xl"
          >
            <div className="bg-gradient-to-r from-[#C026D3] via-[#DB2777] to-[#EA580C] px-5 py-4 flex items-start gap-3">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-white drop-shadow" />
              <div className="min-w-0 flex-1 pr-8">
                <h3 className="text-base font-black uppercase tracking-wide text-white">
                  NIF validado
                </h3>
                <p className="mt-0.5 text-xs text-white/90">
                  Dados obtidos junto do MINFIN
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 rounded-full p-1.5 text-white/90 hover:bg-black/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-2">
              <Row label="Nome / Denominação" value={dados.nome} />
              <Row label="NIF" value={dados.nif} />
              <Row label="Sexo" value={dados.sexo} />
              <Row label="Nº Documento" value={dados.numeroDocumento} />
            </div>

            <div className="px-5 pb-5 pt-2">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-full bg-gradient-to-r from-[#C026D3] via-[#DB2777] to-[#EA580C] py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

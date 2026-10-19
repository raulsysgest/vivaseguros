"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface ModalConsultarApoliceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalConsultarApolice({
  isOpen,
  onClose,
}: ModalConsultarApoliceProps) {
  const [numeroContrato, setNumeroContrato] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResultado(`Apólice encontrada para o contrato nº ${numeroContrato}! Status: Ativa.`);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          {/* Backdrop leve sem blur pesado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 cursor-pointer"
          />

          {/* Card com Gradiente e Design Fiel à Referência */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-[380px] sm:max-w-[400px] rounded-3xl p-8 sm:p-9 shadow-2xl z-10 flex flex-col items-center bg-gradient-to-b from-[#8B5CF6] via-[#A855F7] to-[#EA580C]"
          >
            {/* Botão Fechar em Círculo Sobreposto (X) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-zinc-200/95 hover:bg-white text-zinc-800 shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer z-20"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Título Centralizado */}
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider text-center drop-shadow-md mb-6">
              CONSULTAR APOLICE
            </h3>

            {/* Formulário com Inputs Pílula Brancos */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Número do Contracto"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-full bg-white text-zinc-800 placeholder:text-zinc-400 text-sm font-medium focus:outline-none shadow-md"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-full bg-white text-zinc-800 placeholder:text-zinc-400 text-sm font-medium focus:outline-none shadow-md"
                />
              </div>

              {resultado && (
                <div className="p-3 rounded-2xl bg-white/90 text-xs font-semibold text-emerald-800 text-center shadow-md animate-in fade-in">
                  {resultado}
                </div>
              )}

              {/* Botão Pílula CONSULTAR */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 px-8 py-3 rounded-full bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white text-sm font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer mx-auto flex items-center justify-center gap-2"
              >
                {loading ? "CONSULTANDO..." : "CONSULTAR"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

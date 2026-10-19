"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { classesBotaoAcaoModal } from "@/utils/botao-ponta";

export type TomadorTipo = "empresa" | "particular";

const COBERTURAS = [
  {
    icon: "/icones/Viva_Seguros_Icon_Cancelamento.png",
    label: "Atraso ou Cancelamento do Voo",
  },
  {
    icon: "/icones/Viva_Seguros_Icon_Apoio.png",
    label: "Apoio 24h",
  },
  {
    icon: "/icones/Viva_Seguros_Icon_Medico.png",
    label: "Assistência Médica",
  },
  {
    icon: "/icones/Viva_Seguros_Icon_Medico_Acidentes.png",
    label: "Acidentes Pessoais",
  },
  {
    icon: "/icones/Viva_Seguros_Icon_Medico_Bagagem.png",
    label: "Extravio ou Perda de Bagagem",
  },
] as const;

interface ModalPrecoViagemProps {
  isOpen: boolean;
  precoLabel: string;
  tomadorTipo: TomadorTipo | null;
  onTomadorChange: (tipo: TomadorTipo) => void;
  onAvancarProposta: () => void;
  onGuardarSimulacao: () => void;
  onClose: () => void;
}

export function ModalPrecoViagem({
  isOpen,
  precoLabel,
  tomadorTipo,
  onTomadorChange,
  onAvancarProposta,
  onGuardarSimulacao,
  onClose,
}: ModalPrecoViagemProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-[800px] flex-col items-center overflow-y-auto rounded-[30px] px-6 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
            style={{
              background:
                "linear-gradient(to top right, #f5921e 0%, #ef7a4a 18%, #e86a9a 42%, #c958d4 68%, #9b5cf0 100%)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-zinc-800 shadow-md transition hover:bg-white sm:right-6 sm:top-5"
            >
              <X className="h-5 w-5" />
            </button>

            <Image
              src="/image.png"
              alt="Viva Seguros"
              width={150}
              height={58}
              className="mb-2 h-auto w-[130px] brightness-0 invert sm:w-[150px]"
              priority
            />

            <p className="mt-2 text-lg font-bold text-zinc-900 sm:text-2xl">PREÇO SIMULAÇÃO</p>
            <h2 className="mt-1 text-3xl font-black text-white sm:text-[2.5rem]">{precoLabel}</h2>
            <p className="mt-2 text-sm text-white sm:text-base">( Inclui todos os passageiros )</p>

            <p className="mt-5 text-sm font-medium text-zinc-900 sm:text-base">
              Tipo de tomador de seguro?
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-900">
                <input
                  type="radio"
                  name="tomador-tipo"
                  checked={tomadorTipo === "empresa"}
                  onChange={() => onTomadorChange("empresa")}
                  className="h-4 w-4 accent-[#212546]"
                />
                Empresa
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-900">
                <input
                  type="radio"
                  name="tomador-tipo"
                  checked={tomadorTipo === "particular"}
                  onChange={() => onTomadorChange("particular")}
                  className="h-4 w-4 accent-[#212546]"
                />
                Particular
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onAvancarProposta}
                disabled={!tomadorTipo}
                className={classesBotaoAcaoModal(undefined, Boolean(tomadorTipo))}
              >
                Avançar para proposta
              </button>
              <button
                type="button"
                onClick={onGuardarSimulacao}
                disabled={!tomadorTipo}
                className={classesBotaoAcaoModal(undefined, Boolean(tomadorTipo))}
              >
                Guardar simulação
              </button>
            </div>

            <hr className="my-6 w-[80%] border-white/70" />

            <h3 className="text-lg font-bold text-zinc-900 sm:text-xl">COBERTURA</h3>
            <div className="mt-4 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-2">
              {COBERTURAS.map((item) => (
                <div
                  key={item.icon}
                  className="flex flex-col items-center justify-start px-1 text-center"
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={64}
                    height={64}
                    className="mb-2 h-12 w-12 object-contain sm:h-16 sm:w-16"
                  />
                  <span className="text-[10px] font-semibold leading-tight text-white sm:text-xs">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

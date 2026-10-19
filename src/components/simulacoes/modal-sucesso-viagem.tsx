"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type ModalSucessoViagemProps = {
  isOpen: boolean;
  onFechar: () => void;
};

const entradaDeCima = {
  initial: { opacity: 0, y: -72 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -32 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function ModalSucessoViagem({ isOpen, onFechar }: ModalSucessoViagemProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 sm:p-6"
          onClick={onFechar}
        >
          <motion.div
            {...entradaDeCima}
            className="flex w-full max-w-[800px] min-h-[min(720px,90vh)] max-h-[92vh] flex-col items-center justify-center gap-5 overflow-y-auto rounded-[30px] px-6 py-10 text-center shadow-2xl sm:gap-6 sm:px-12 sm:py-14"
            style={{
              background: "linear-gradient(to top right, #fa9e1b, #8d4fff)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-5 sm:gap-6">
              <Image
                src="/image.png"
                alt="Viva Seguros"
                width={250}
                height={80}
                className="mx-auto block h-auto w-[200px] brightness-0 invert sm:w-[250px]"
                priority
              />

              <div className="flex w-full flex-col items-center gap-2">
                <h2 className="text-3xl font-black uppercase leading-tight text-white sm:text-[40px]">
                  PARABÉNS
                </h2>
                <p className="max-w-sm text-sm leading-snug text-white sm:text-base">
                  Acaba de solicitar o seu seguro de viagem!
                </p>
              </div>

              <Image
                src="/icones/sent.png"
                alt=""
                width={375}
                height={280}
                className="mx-auto block h-auto w-full max-w-[375px]"
                priority
              />

              <button
                type="button"
                onClick={onFechar}
                className="mt-2 rounded-full bg-[#31124b] px-10 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-[#3d1860] sm:text-sm"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

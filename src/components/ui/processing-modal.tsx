"use client";

import { motion, AnimatePresence } from "motion/react";

interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
}

export function ProcessingModal({
  isOpen,
  message = "A validar NIF...",
}: ProcessingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-[2px] px-4"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={message}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1E0836]/95 px-8 py-10 text-center shadow-2xl shadow-fuchsia-900/30"
          >
            <div className="relative mx-auto mb-6 h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, #C026D3, #DB2777, #EA580C, #C026D3)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-[5px] rounded-full bg-[#1E0836]" />
              <motion.div
                className="absolute inset-[14px] rounded-full bg-gradient-to-br from-[#C026D3] via-[#DB2777] to-[#EA580C] opacity-90"
                animate={{ scale: [0.85, 1, 0.85], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm font-semibold tracking-wide text-white">{message}</p>
            <p className="mt-2 text-xs text-fuchsia-200/80">Aguarde um momento</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

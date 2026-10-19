"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { signOut } from "next-auth/react";
import type { TomadorTipo } from "@/components/simulacoes/modal-preco-viagem";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import type { NifContribuinte } from "@/types/nif";
import { normalizeNifValidationMessage } from "@/lib/nif-messages";
import { ProcessingModal } from "@/components/ui/processing-modal";
import { cn } from "@/utils/cn";
import { raioBotaoPonta } from "@/utils/botao-ponta";

export type TomadorViagemFormData = {
  nif: string;
  nomeCompleto: string;
  telefone: string;
  email: string;
  endereco: string;
  bi: string;
  genero: string;
  dataNascimento: string;
  numeroDocumento: string;
};

type ModalTomadorViagemProps = {
  isOpen: boolean;
  tomadorTipo: TomadorTipo;
  initial: {
    nif: string;
    telefone: string;
    nome: string;
    bi: string;
    sexo: string;
  };
  onClose: () => void;
  onVoltarPreco: () => void;
  onAvancar: (data: TomadorViagemFormData) => void;
};

const labelClass =
  "mb-1 block text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]";
const inputBase =
  "w-full rounded-md border-0 px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40 sm:text-sm";
const inputLocked = "bg-zinc-500/90 text-white cursor-not-allowed";
const inputEditable = "bg-white";

function sexoToGeneroOption(sexo?: string | null): string {
  const s = (sexo ?? "").trim().toUpperCase();
  if (s.startsWith("F")) return "F";
  if (s.startsWith("M")) return "M";
  return "";
}

export function ModalTomadorViagem({
  isOpen,
  tomadorTipo,
  initial,
  onClose,
  onVoltarPreco,
  onAvancar,
}: ModalTomadorViagemProps) {
  const isParticular = tomadorTipo === "particular";
  const [camposDesbloqueados, setCamposDesbloqueados] = useState(false);
  const [buscandoNif, setBuscandoNif] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TomadorViagemFormData>({
    defaultValues: {
      nif: initial.nif,
      nomeCompleto: initial.nome,
      telefone: initial.telefone,
      email: "",
      endereco: "",
      bi: initial.bi,
      genero: sexoToGeneroOption(initial.sexo),
      dataNascimento: "",
      numeroDocumento: initial.bi || "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      nif: initial.nif,
      nomeCompleto: initial.nome,
      telefone: initial.telefone,
      email: "",
      endereco: "",
      bi: initial.bi,
      genero: isParticular ? sexoToGeneroOption(initial.sexo) : "O",
      dataNascimento: isParticular ? "" : "1975-10-20",
      numeroDocumento: isParticular ? initial.bi || "" : "0000000000000",
    });
    setCamposDesbloqueados(Boolean(initial.nome && initial.nif));
  }, [isOpen, initial, reset, isParticular]);

  const buscarDadosNif = async () => {
    const nifInput = (document.getElementById("tomador-nif") as HTMLInputElement | null)?.value;
    const nif = (nifInput ?? "").trim();
    if (!nif) {
      setError("nif", { message: "Indique o NIF" });
      return;
    }
    setBuscandoNif(true);
    clearErrors("nif");
    try {
      const data = await clientFetch<NifContribuinte>(`/api/nif/${encodeURIComponent(nif)}`);
      if (!data.valid) {
        throw new Error("NIF inválido");
      }
      setValue("nomeCompleto", data.nome?.trim() || "");
      setValue("bi", data.numeroDocumento?.trim() || "");
      setValue("genero", sexoToGeneroOption(data.sexo) || "M");
      if (isParticular) {
        setValue("numeroDocumento", data.numeroDocumento?.trim() || "");
      }
      setCamposDesbloqueados(true);
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string } | undefined;
      setError("nif", {
        message: normalizeNifValidationMessage(
          payload?.message || (error instanceof Error ? error.message : undefined),
        ),
      });
      setCamposDesbloqueados(false);
    } finally {
      setBuscandoNif(false);
    }
  };

  const toggleNifLock = () => {
    if (camposDesbloqueados) {
      setCamposDesbloqueados(false);
      setValue("nomeCompleto", "");
      return;
    }
    void buscarDadosNif();
  };

  const submit = (data: TomadorViagemFormData) => {
    if (!camposDesbloqueados) {
      setError("nif", { message: "Valide o NIF antes de avançar" });
      return;
    }
    onAvancar(data);
  };

  return (
    <>
      <ProcessingModal isOpen={buscandoNif} message="A validar NIF..." />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-md transition hover:bg-zinc-100 sm:right-6 sm:top-5"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-wide text-[#31124b] sm:text-4xl">
                  Tomador do seguro
                </h2>
                <hr className="mx-auto my-3 w-[80%] border-white/80" />
                <p className="text-lg font-bold uppercase text-white sm:text-2xl">
                  Dados do tomador do seguro
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/90">
                  {isParticular ? "Particular" : "Empresa"}
                </p>
              </div>

              <form
                onSubmit={handleSubmit(submit)}
                className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass} htmlFor="tomador-nif">
                    NIF <span className="text-red-200">*</span>
                  </label>
                  <div className="flex gap-1">
                    <input
                      id="tomador-nif"
                      type="text"
                      readOnly={camposDesbloqueados}
                      className={cn(
                        inputBase,
                        camposDesbloqueados ? inputLocked : inputEditable,
                        "flex-1",
                      )}
                      {...register("nif", { required: "Indique o NIF" })}
                    />
                    <button
                      type="button"
                      onClick={toggleNifLock}
                      className="flex h-[38px] min-w-[38px] items-center justify-center rounded-md bg-[#2563eb] px-2 text-sm font-bold text-white shadow hover:bg-[#1d4ed8]"
                      aria-label={camposDesbloqueados ? "Editar NIF" : "Buscar dados do NIF"}
                    >
                      {camposDesbloqueados ? "×" : "›"}
                    </button>
                  </div>
                  {errors.nif && (
                    <p className="mt-1 text-[10px] font-medium text-red-100">{errors.nif.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Nome completo <span className="text-red-200">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    className={cn(inputBase, inputLocked)}
                    {...register("nomeCompleto", { required: "Nome obrigatório" })}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Número de telefone <span className="text-red-200">*</span>
                  </label>
                  <input
                    type="tel"
                    disabled={!camposDesbloqueados}
                    className={cn(
                      inputBase,
                      camposDesbloqueados ? inputEditable : inputLocked,
                    )}
                    {...register("telefone", { required: "Indique o telefone" })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Endereço (opcional)</label>
                  <input
                    type="text"
                    disabled={!camposDesbloqueados}
                    className={cn(
                      inputBase,
                      camposDesbloqueados ? inputEditable : inputLocked,
                    )}
                    {...register("endereco")}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Email <span className="text-red-200">*</span>
                  </label>
                  <input
                    type="email"
                    disabled={!camposDesbloqueados}
                    className={cn(
                      inputBase,
                      camposDesbloqueados ? inputEditable : inputLocked,
                    )}
                    {...register("email", {
                      required: "Indique o email",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Email inválido",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-[10px] font-medium text-red-100">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {isParticular && (
                  <div>
                    <label className={labelClass}>
                      Género <span className="text-red-200">*</span>
                    </label>
                    <select
                      disabled={!camposDesbloqueados}
                      className={cn(
                        inputBase,
                        camposDesbloqueados ? inputEditable : inputLocked,
                      )}
                      {...register("genero", { required: "Selecione o género" })}
                    >
                      <option value="">Selecione o género</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelClass}>BI (opcional)</label>
                  <input
                    type="text"
                    readOnly
                    className={cn(inputBase, inputLocked)}
                    {...register("bi")}
                  />
                </div>

                {isParticular && (
                  <>
                    <div>
                      <label className={labelClass}>
                        Data de nascimento <span className="text-red-200">*</span>
                      </label>
                      <input
                        type="date"
                        disabled={!camposDesbloqueados}
                        className={cn(
                          inputBase,
                          camposDesbloqueados ? inputEditable : inputLocked,
                        )}
                        {...register("dataNascimento", {
                          required: "Indique a data de nascimento",
                        })}
                      />
                      {errors.dataNascimento && (
                        <p className="mt-1 text-[10px] font-medium text-red-100">
                          {errors.dataNascimento.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>
                        Número documento (BI ou passaporte){" "}
                        <span className="text-red-200">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!camposDesbloqueados}
                        className={cn(
                          inputBase,
                          camposDesbloqueados ? inputEditable : inputLocked,
                        )}
                        {...register("numeroDocumento", {
                          required: "Indique o documento",
                        })}
                      />
                      {errors.numeroDocumento && (
                        <p className="mt-1 text-[10px] font-medium text-red-100">
                          {errors.numeroDocumento.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="col-span-full mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={onVoltarPreco}
                    className={cn(
                      raioBotaoPonta,
                      "border border-white/70 bg-transparent px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10",
                    )}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className={cn(
                      raioBotaoPonta,
                      "bg-[#31124b] px-10 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#3d1860] active:scale-[0.98]",
                    )}
                  >
                    Avançar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

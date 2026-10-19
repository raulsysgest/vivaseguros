"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, type Variants } from "motion/react";
import { Phone, User } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  VIAGEM_ADULTOS_OPCOES,
  VIAGEM_CRIANCAS_OPCOES,
  VIAGEM_DESTINOS,
  VIAGEM_ORIGENS,
} from "@/constants/viagem-destinos";
import { cn } from "@/utils/cn";
import { classesBotaoSeguinte } from "@/utils/botao-ponta";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import { useToast } from "@/hooks/use-toast";
import type { NifContribuinte } from "@/types/nif";
import { normalizeNifValidationMessage } from "@/lib/nif-messages";
import { ProcessingModal } from "@/components/ui/processing-modal";
import { ModalDadosNif } from "@/components/simulacoes/modal-dados-nif";

export type ViagemFormValues = {
  origem: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
  adultos: string;
  criancas: string;
  nif: string;
  telefone: string;
};

export type ViagemFormSubmitData = ViagemFormValues & {
  destinoLabel: string;
  origemCountryCode: string;
  destinoCountryCode: string;
  plano: string;
  clienteNome: string;
  clienteBi: string;
  clienteSexo: string;
};

export type ViagemFormInitialDraft = {
  values: ViagemFormValues;
  contribuinte: NifContribuinte;
};

type FormularioViagemProps = {
  formVariants: Variants;
  onSubmit: (data: ViagemFormSubmitData) => void;
  initialDraft?: ViagemFormInitialDraft | null;
  draftKey?: string;
};

type NifStatus = "idle" | "loading" | "valid" | "invalid";

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function extractErrorMessage(error: ClientFetchError): string {
  const data = error.data as { message?: string; error?: string } | undefined;
  const raw = data?.message || data?.error || error.message || "Não foi possível validar o NIF";
  return normalizeNifValidationMessage(raw);
}

const fieldClass =
  "px-2.5 py-1.5 rounded-full bg-white text-zinc-800 text-[11px] font-semibold focus:outline-none shadow-md";
const fieldErrorClass = "ring-2 ring-red-400 border border-red-400";
const labelClass =
  "mb-0.5 min-h-[1.35rem] text-[9px] font-bold text-white uppercase leading-tight flex items-end";
const ERROR_SLOT_CLASS =
  "mt-0.5 min-h-[1.25rem] text-[9px] leading-snug font-medium text-red-200";

function FieldError({ message }: { message?: string }) {
  return (
    <p className={ERROR_SLOT_CLASS} role="alert" aria-live="polite">
      {message ?? ""}
    </p>
  );
}

export function FormularioViagem({
  formVariants,
  onSubmit,
  initialDraft,
  draftKey,
}: FormularioViagemProps) {
  const minDate = useMemo(() => todayIsoDate(), []);
  const toast = useToast();

  const [nifStatus, setNifStatus] = useState<NifStatus>("idle");
  const [contribuinte, setContribuinte] = useState<NifContribuinte | null>(null);
  const [showDadosNif, setShowDadosNif] = useState(false);
  const [processingNif, setProcessingNif] = useState(false);

  const nifStatusRef = useRef<NifStatus>("idle");
  const lastValidatedNifRef = useRef<string | null>(null);

  useEffect(() => {
    nifStatusRef.current = nifStatus;
  }, [nifStatus]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    trigger,
    reset,
    formState: { errors, isValid },
  } = useForm<ViagemFormValues>({
    defaultValues: {
      origem: "ANGOLA",
      destino: "selecionar",
      dataInicio: "",
      dataFim: "",
      adultos: "SELECIONAR",
      criancas: "SELECIONAR",
      nif: "",
      telefone: "",
    },
    mode: "onChange",
  });

  const dataInicio = watch("dataInicio");
  const minFim = dataInicio && dataInicio > minDate ? dataInicio : minDate;

  useEffect(() => {
    if (!initialDraft) return;
    reset(initialDraft.values);
    setContribuinte(initialDraft.contribuinte);
    setNifStatus("valid");
    lastValidatedNifRef.current = initialDraft.values.nif.trim();
    setShowDadosNif(false);
    void trigger();
  }, [initialDraft, draftKey, reset, trigger]);

  useEffect(() => {
    void trigger("nif");
  }, [nifStatus, trigger]);

  const validateNifOnBlur = async (rawValue: string) => {
    const nif = rawValue.trim();
    if (!nif) {
      setNifStatus("idle");
      lastValidatedNifRef.current = null;
      setContribuinte(null);
      return;
    }

    if (lastValidatedNifRef.current === nif && nifStatusRef.current === "valid") {
      return;
    }

    setProcessingNif(true);
    setNifStatus("loading");

    try {
      const data = await clientFetch<NifContribuinte>(
        `/api/nif/${encodeURIComponent(nif)}`,
      );

      if (!data.valid) {
        throw Object.assign(new Error("NIF inválido"), {
          status: 404,
          data,
        }) as ClientFetchError;
      }

      lastValidatedNifRef.current = nif;
      setContribuinte(data);
      setNifStatus("valid");
      clearErrors("nif");
      setShowDadosNif(true);
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }

      const message = extractErrorMessage(err);
      setNifStatus("invalid");
      setContribuinte(null);
      lastValidatedNifRef.current = null;
      setError("nif", { type: "validate", message });
      toast.error(message);
    } finally {
      setProcessingNif(false);
    }
  };

  const nifField = register("nif", {
    required: "Indique o NIF",
    validate: (v) => {
      if (!v.trim()) return "Indique o NIF";
      if (nifStatusRef.current === "loading") {
        return "A validar o NIF...";
      }
      if (nifStatusRef.current !== "valid") {
        return "Valide o NIF (saia do campo após digitar)";
      }
      return true;
    },
    onChange: () => {
      if (nifStatusRef.current === "valid" || nifStatusRef.current === "invalid") {
        setNifStatus("idle");
        setContribuinte(null);
        lastValidatedNifRef.current = null;
        setShowDadosNif(false);
      }
    },
    onBlur: (e) => {
      void validateNifOnBlur(e.target.value);
    },
  });

  const submit = (values: ViagemFormValues) => {
    const destinoMeta = VIAGEM_DESTINOS.find((d) => d.value === values.destino);
    const origemMeta = VIAGEM_ORIGENS.find((o) => o.value === values.origem);

    onSubmit({
      ...values,
      destinoLabel: destinoMeta?.label ?? values.destino,
      origemCountryCode: origemMeta?.countryCode ?? "AO",
      destinoCountryCode: destinoMeta?.countryCode ?? "",
      plano: destinoMeta?.plan ?? "",
      clienteNome: contribuinte?.nome?.trim() || "Cliente",
      clienteBi: contribuinte?.numeroDocumento?.trim() || "",
      clienteSexo: contribuinte?.sexo?.trim() || "M",
    });
  };

  const podeSeguinte = isValid && nifStatus === "valid";

  return (
    <>
      <ProcessingModal isOpen={processingNif} />
      <ModalDadosNif
        isOpen={showDadosNif}
        dados={contribuinte}
        onConfirm={() => setShowDadosNif(false)}
        onClose={() => setShowDadosNif(false)}
      />

      <motion.form
        key={draftKey ? `form-viagens-${draftKey}` : "form-viagens"}
        variants={formVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
        onSubmit={handleSubmit(submit)}
        className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
        noValidate
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className={labelClass}>
              Origem <span className="text-red-300">*</span>
            </label>
            <select
              {...register("origem", { required: "Selecione a origem" })}
              className={cn(fieldClass, "cursor-pointer min-w-[120px]", errors.origem && fieldErrorClass)}
            >
              {VIAGEM_ORIGENS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.origem?.message} />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>
              Destino <span className="text-red-300">*</span>
            </label>
            <select
              {...register("destino", {
                required: "Selecione o destino",
                validate: (v) =>
                  v !== "selecionar" && v !== "SELECIONAR"
                    ? true
                    : "Selecione o destino da viagem",
              })}
              className={cn(
                fieldClass,
                "cursor-pointer min-w-[140px] max-w-[200px]",
                errors.destino && fieldErrorClass,
              )}
            >
              {VIAGEM_DESTINOS.map((d) => (
                <option key={`${d.value}-${d.countryCode}`} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.destino?.message} />
          </div>
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            Data de Início <span className="text-red-300">*</span>
          </label>
          <input
            type="date"
            min={minDate}
            {...register("dataInicio", {
              required: "Indique a data de início",
              validate: (v) => {
                if (!v) return "Indique a data de início";
                if (v < minDate) return "A data de início não pode ser no passado";
                return true;
              },
            })}
            className={cn(fieldClass, "font-medium", errors.dataInicio && fieldErrorClass)}
          />
          <FieldError message={errors.dataInicio?.message} />
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            Data de Fim <span className="text-red-300">*</span>
          </label>
          <input
            type="date"
            min={minFim}
            {...register("dataFim", {
              required: "Indique a data de fim",
              validate: (v, formValues) => {
                if (!v) return "Indique a data de fim";
                if (v < minDate) return "A data de fim não pode ser no passado";
                if (formValues.dataInicio && v < formValues.dataInicio) {
                  return "A data de fim deve ser igual ou posterior à data de início";
                }
                return true;
              },
            })}
            className={cn(fieldClass, "font-medium", errors.dataFim && fieldErrorClass)}
          />
          <FieldError message={errors.dataFim?.message} />
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            Adultos <span className="text-red-300">*</span>
          </label>
          <div className="relative flex items-center">
            <User className="w-3.5 h-3.5 text-[#C85A27] absolute left-3 pointer-events-none" />
            <select
              {...register("adultos", {
                required: "Selecione o número de adultos",
                validate: (v) => {
                  if (v === "SELECIONAR" || !v) return "Selecione pelo menos um adulto";
                  const n = parseInt(v, 10);
                  if (Number.isNaN(n) || n < 1) return "Selecione pelo menos um adulto";
                  return true;
                },
              })}
              className={cn(
                fieldClass,
                "pl-8 pr-4 cursor-pointer",
                errors.adultos && fieldErrorClass,
              )}
            >
              {VIAGEM_ADULTOS_OPCOES.map((opt) => (
                <option key={`adulto-${opt}`} value={opt}>
                  {opt === "SELECIONAR" ? opt : opt}
                </option>
              ))}
            </select>
          </div>
          <FieldError message={errors.adultos?.message} />
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            Crianças <span className="text-red-300">*</span>{" "}
            <span className="text-[9px] font-normal opacity-90">(0 - 11 anos)</span>
          </label>
          <select
            {...register("criancas", {
              required: "Selecione o número de crianças",
              validate: (v) => (v === "SELECIONAR" ? "Selecione o número de crianças" : true),
            })}
            className={cn(fieldClass, "px-4 cursor-pointer", errors.criancas && fieldErrorClass)}
          >
            {VIAGEM_CRIANCAS_OPCOES.map((opt) => (
              <option key={`crianca-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.criancas?.message} />
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            NIF <span className="text-red-300">*</span>
          </label>
          <input
            type="text"
            placeholder="Numero de NIF"
            {...nifField}
            className={cn(
              fieldClass,
              "placeholder:text-zinc-400 font-medium w-28 sm:w-32",
              errors.nif && fieldErrorClass,
            )}
          />
          <FieldError message={errors.nif?.message} />
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>
            Telefone <span className="text-red-300">*</span>
          </label>
          <div className="relative flex items-center">
            <Phone className="w-3.5 h-3.5 text-[#C85A27] absolute left-3 pointer-events-none" />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Numero de telefone"
              {...register("telefone", {
                required: "Indique o telefone",
                validate: (v) => {
                  const digits = v.replace(/\D/g, "");
                  if (digits.length < 9) return "Verifique o número de telefone";
                  return true;
                },
              })}
              className={cn(
                fieldClass,
                "pl-8 pr-3 placeholder:text-zinc-400 font-medium w-32 sm:w-36",
                errors.telefone && fieldErrorClass,
              )}
            />
          </div>
          <FieldError message={errors.telefone?.message} />
        </div>

        <button
          type="submit"
          disabled={!podeSeguinte}
          className={classesBotaoSeguinte(podeSeguinte, "ml-auto shrink-0 self-end px-5 py-2 text-[11px]")}
        >
          SEGUINTE
        </button>
      </motion.form>
    </>
  );
}

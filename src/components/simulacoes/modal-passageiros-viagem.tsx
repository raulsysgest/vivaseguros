"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { signOut } from "next-auth/react";
import type { TomadorTipo } from "@/components/simulacoes/modal-preco-viagem";
import type { TomadorViagemFormData } from "@/components/simulacoes/modal-tomador-viagem";
import type { ViagemFormSubmitData } from "@/components/simulacoes/formulario-viagem";
import type { PassageiroViagemApi } from "@/types/viagem-simulacao";
import {
  buildPassageirosFormSeeds,
  generoDeViagemCliente,
  generoPassageiroPrefill,
  passaporteParaFormulario,
  type PassageiroViagemFormSeed,
} from "@/lib/viagem-simulacao";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import type { NifContribuinte } from "@/types/nif";
import { normalizeNifValidationMessage } from "@/lib/nif-messages";
import { ProcessingModal } from "@/components/ui/processing-modal";
import { cn } from "@/utils/cn";
import { raioBotaoPonta } from "@/utils/botao-ponta";

/** Valor BI enviado à Viva para passageiro estrangeiro (legado). */
const BI_API_ESTRANGEIRO = "000000000000";

export type PassageiroViagemFormRow = PassageiroViagemFormSeed;

/** Último NIF/dados MINFIN aceites por passageiro (para restaurar após erro). */
type NifValidadoSnapshot = {
  bi: string;
  nomeCompleto: string;
  genero: string;
  passaporte: string;
};

function snapshotDePassageiro(row: PassageiroViagemFormRow): NifValidadoSnapshot {
  return {
    bi: row.bi.trim(),
    nomeCompleto: row.nomeCompleto.trim(),
    genero: row.genero.trim(),
    passaporte: row.passaporte.trim(),
  };
}

type ModalPassageirosViagemProps = {
  isOpen: boolean;
  tomadorTipo: TomadorTipo;
  tomador: TomadorViagemFormData;
  viagemForm: ViagemFormSubmitData;
  onClose: () => void;
  onVoltarTomador: () => void;
  onAvancar: (passageiros: PassageiroViagemApi[]) => void;
};

const labelClass =
  "mb-1 block text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]";
const inputClass =
  "w-full rounded-md border-0 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40 sm:text-sm";
const inputLocked = "cursor-not-allowed bg-zinc-500/90 text-white";

function emptyPassageiro(): PassageiroViagemFormRow {
  return {
    bi: "",
    nomeCompleto: "",
    passaporte: "",
    genero: "",
    dataNascimento: "",
    nomeGeneroBloqueados: false,
    nifValidado: false,
    estrangeiro: false,
  };
}

function nifDocumentoJaValidado(
  tomador: TomadorViagemFormData,
  nifViagem: string,
): string {
  const doc = tomador.numeroDocumento.trim();
  return tomador.bi.trim() || tomador.nif.trim() || nifViagem.trim() || doc;
}

function tomadorParaPassageiro(
  tomador: TomadorViagemFormData,
  nifViagem: string,
  sexoCliente?: string,
): Pick<
  PassageiroViagemFormRow,
  | "bi"
  | "nomeCompleto"
  | "passaporte"
  | "genero"
  | "dataNascimento"
  | "nomeGeneroBloqueados"
  | "nifValidado"
  | "estrangeiro"
> {
  const doc = tomador.numeroDocumento.trim();
  const bi = nifDocumentoJaValidado(tomador, nifViagem);
  const nome = tomador.nomeCompleto.trim();
  const validado = Boolean(bi && nome);
  return {
    bi,
    nomeCompleto: nome,
    passaporte: passaporteParaFormulario(undefined, bi),
    genero: generoPassageiroPrefill(tomador.genero, sexoCliente) || "M",
    dataNascimento: tomador.dataNascimento.trim(),
    nomeGeneroBloqueados: validado,
    nifValidado: validado,
    estrangeiro: false,
  };
}

function tomadorParaPassageiroManual(tomador: TomadorViagemFormData): Pick<
  PassageiroViagemFormRow,
  "nomeCompleto" | "passaporte" | "genero" | "dataNascimento"
> {
  return {
    nomeCompleto: tomador.nomeCompleto.trim(),
    passaporte: "",
    genero: tomador.genero.trim() || "M",
    dataNascimento: tomador.dataNascimento.trim(),
  };
}

function calcularIdade(dataIso: string): number | null {
  if (!dataIso) return null;
  const nasc = new Date(dataIso);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function sexoToGenero(sexo?: string | null): string {
  const s = (sexo ?? "").trim().toUpperCase();
  if (s.startsWith("F")) return "F";
  if (s.startsWith("M")) return "M";
  return "M";
}

export function ModalPassageirosViagem({
  isOpen,
  tomadorTipo,
  tomador,
  viagemForm,
  onClose,
  onVoltarTomador,
  onAvancar,
}: ModalPassageirosViagemProps) {
  const seedsIniciais = useMemo(
    () =>
      buildPassageirosFormSeeds(viagemForm, {
        nif: tomador.nif,
        nomeCompleto: tomador.nomeCompleto,
        bi: tomador.bi,
        numeroDocumento: tomador.numeroDocumento,
        genero: tomador.genero,
        dataNascimento: tomador.dataNascimento,
      }),
    [viagemForm, tomador],
  );
  const total = seedsIniciais.length;
  const [passageiros, setPassageiros] = useState<PassageiroViagemFormRow[]>(() =>
    seedsIniciais.length > 0 ? seedsIniciais : [emptyPassageiro()],
  );
  const [tomadorViaja, setTomadorViaja] = useState(false);
  const [tomadorViajaUsado, setTomadorViajaUsado] = useState(false);
  const [buscandoNif, setBuscandoNif] = useState<number | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [ultimoNifValidado, setUltimoNifValidado] = useState<
    (NifValidadoSnapshot | null)[]
  >([]);
  const [nifErroPassageiro, setNifErroPassageiro] = useState<Record<number, string>>(
    {},
  );

  const podeAvancar = useMemo(() => {
    for (let i = 0; i < total; i++) {
      const p = passageiros[i];
      if (!p) return false;
      if (nifErroPassageiro[i]) return false;
      if (p.estrangeiro) {
        if (
          !p.nomeCompleto.trim() ||
          !p.passaporte.trim() ||
          !p.genero ||
          !p.dataNascimento
        ) {
          return false;
        }
        continue;
      }
      if (!p.bi.trim() || !p.nifValidado) return false;
      if (
        !p.nomeCompleto.trim() ||
        !p.passaporte.trim() ||
        !p.genero ||
        !p.dataNascimento
      ) {
        return false;
      }
    }
    return total > 0;
  }, [passageiros, total, nifErroPassageiro]);

  const guardarSnapshotValidado = useCallback((index: number, row: PassageiroViagemFormRow) => {
    if (!row.nifValidado || row.estrangeiro) return;
    setUltimoNifValidado((prev) => {
      const next = [...prev];
      next[index] = snapshotDePassageiro(row);
      return next;
    });
  }, []);

  const nifViagemValidado = viagemForm.nif.trim();

  const aplicarTomadorNoPassageiro = useCallback(
    (index: number) => {
      setPassageiros((prev) => {
        const next = [...prev];
        const row = next[index];
        if (!row) return prev;
        if (row.estrangeiro) {
          next[index] = {
            ...row,
            ...tomadorParaPassageiroManual(tomador),
            bi: "",
            nifValidado: false,
            nomeGeneroBloqueados: false,
            estrangeiro: true,
          };
        } else {
          const atualizado: PassageiroViagemFormRow = {
            ...row,
            ...tomadorParaPassageiro(
              tomador,
              nifViagemValidado,
              viagemForm.clienteSexo,
            ),
          };
          next[index] = atualizado;
          if (atualizado.nifValidado) {
            setUltimoNifValidado((u) => {
              const nu = [...u];
              nu[index] = snapshotDePassageiro(atualizado);
              return nu;
            });
          }
        }
        return next;
      });
    },
    [tomador, nifViagemValidado, viagemForm.clienteSexo],
  );

  useEffect(() => {
    if (!isOpen) return;
    const seeds = buildPassageirosFormSeeds(viagemForm, {
      nif: tomador.nif,
      nomeCompleto: tomador.nomeCompleto,
      bi: tomador.bi,
      numeroDocumento: tomador.numeroDocumento,
      genero: tomador.genero,
      dataNascimento: tomador.dataNascimento,
    });
    const rows = seeds.length > 0 ? seeds : [emptyPassageiro()];
    setPassageiros(rows);
    setUltimoNifValidado(
      rows.map((r) => (r.nifValidado && !r.estrangeiro ? snapshotDePassageiro(r) : null)),
    );
    setNifErroPassageiro({});
    const primeiroValidado = Boolean(seeds[0]?.nifValidado);
    if (tomadorTipo === "particular" && primeiroValidado) {
      setTomadorViaja(true);
      setTomadorViajaUsado(true);
    } else {
      setTomadorViaja(false);
      setTomadorViajaUsado(false);
    }
    setErroForm(null);
  }, [isOpen, viagemForm, tomador, tomadorTipo]);

  const marcarTomadorViaja = () => {
    setTomadorViaja(true);
    setTomadorViajaUsado(true);
    aplicarTomadorNoPassageiro(0);
  };

  const marcarEstrangeiro = (index: number) => {
    setPassageiros((prev) => {
      const next = [...prev];
      const manualTomador = tomadorViaja && index === 0;
      next[index] = {
        ...next[index],
        estrangeiro: true,
        bi: "",
        nifValidado: false,
        nomeGeneroBloqueados: false,
        ...(manualTomador
          ? tomadorParaPassageiroManual(tomador)
          : {
              nomeCompleto: "",
              passaporte: "",
              genero: "",
              dataNascimento: "",
            }),
      };
      return next;
    });
  };

  const updateCampo = (
    index: number,
    field: keyof PassageiroViagemFormRow,
    value: string,
  ) => {
    setPassageiros((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      if (field === "bi" && !row.estrangeiro) {
        row.nifValidado = false;
        row.nomeGeneroBloqueados = false;
      }
      next[index] = row;
      return next;
    });
    if (field === "bi") {
      setNifErroPassageiro((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const validarNif = async (index: number, nifOverride?: string) => {
    if (passageiros[index]?.estrangeiro) return;
    const nif = (nifOverride ?? passageiros[index]?.bi ?? "").trim();
    if (!nif) {
      setErroForm(`Indique o NIF do ${index + 1}º passageiro.`);
      return;
    }
    setBuscandoNif(index);
    setErroForm(null);
    try {
      const data = await clientFetch<NifContribuinte>(`/api/nif/${encodeURIComponent(nif)}`);
      if (!data.valid) throw new Error("NIF inválido");
      const doc = data.numeroDocumento?.trim() || data.nif?.trim() || nif;
      setPassageiros((prev) => {
        const next = [...prev];
        const atual = next[index];
        const atualizado: PassageiroViagemFormRow = {
          ...atual,
          bi: doc,
          nomeCompleto: data.nome?.trim() || "",
          genero: sexoToGenero(data.sexo),
          passaporte: passaporteParaFormulario(atual?.passaporte, doc),
          nomeGeneroBloqueados: true,
          nifValidado: true,
        };
        next[index] = atualizado;
        guardarSnapshotValidado(index, atualizado);
        return next;
      });
      setNifErroPassageiro((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string } | undefined;
      const msg =
        normalizeNifValidationMessage(
          payload?.message || (error instanceof Error ? error.message : undefined),
        ) || "Não foi possível validar o NIF.";
      setNifErroPassageiro((prev) => ({ ...prev, [index]: msg }));
      setPassageiros((prev) => {
        const next = [...prev];
        const atual = next[index];
        if (!atual) return prev;
        next[index] = {
          ...atual,
          nifValidado: false,
          nomeGeneroBloqueados: false,
          nomeCompleto: "",
          genero: "",
        };
        return next;
      });
    } finally {
      setBuscandoNif(null);
    }
  };

  const validarNifAoSair = (index: number) => {
    const p = passageiros[index];
    if (!p || p.estrangeiro || p.nomeGeneroBloqueados) return;
    const nif = p.bi.trim();
    if (!nif) return;
    if (p.nifValidado) return;
    void validarNif(index, nif);
  };

  const desbloquearNif = (index: number) => {
    setPassageiros((prev) => {
      const row = prev[index];
      if (row?.nifValidado && !row.estrangeiro) {
        setUltimoNifValidado((u) => {
          const next = [...u];
          next[index] = snapshotDePassageiro(row);
          return next;
        });
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        bi: "",
        nomeCompleto: "",
        genero: "",
        nomeGeneroBloqueados: false,
        nifValidado: false,
      };
      return next;
    });
    setNifErroPassageiro((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const restaurarNifAnterior = (index: number) => {
    const snap = ultimoNifValidado[index];
    if (!snap) return;
    setPassageiros((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        bi: snap.bi,
        nomeCompleto: snap.nomeCompleto,
        genero: snap.genero,
        passaporte: snap.passaporte,
        nomeGeneroBloqueados: true,
        nifValidado: true,
        estrangeiro: false,
      };
      return next;
    });
    setNifErroPassageiro((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setErroForm(null);
  };

  const submit = () => {
    setErroForm(null);
    const lista: PassageiroViagemApi[] = [];
    let temAdulto = false;

    for (let i = 0; i < total; i++) {
      const p = passageiros[i];

      if (p.estrangeiro) {
        if (
          !p.nomeCompleto.trim() ||
          !p.passaporte.trim() ||
          !p.genero ||
          !p.dataNascimento
        ) {
          setErroForm(`Preencha os dados do ${i + 1}º passageiro (estrangeiro).`);
          return;
        }
      } else {
        if (!p.bi.trim()) {
          setErroForm(`Indique o NIF do ${i + 1}º passageiro.`);
          return;
        }
        if (!p.nifValidado) {
          setErroForm(
            `Valide o NIF do ${i + 1}º passageiro antes de avançar.`,
          );
          return;
        }
        if (
          !p.nomeCompleto.trim() ||
          !p.passaporte.trim() ||
          !p.genero ||
          !p.dataNascimento
        ) {
          setErroForm(`Preencha todos os campos do ${i + 1}º passageiro.`);
          return;
        }
      }

      const idade = calcularIdade(p.dataNascimento);
      if (idade === null) {
        setErroForm(`Data de nascimento inválida (${i + 1}º passageiro).`);
        return;
      }
      if (total === 1 && idade < 18) {
        setErroForm("O passageiro deve ter pelo menos 18 anos quando viaja sozinho.");
        return;
      }
      if (idade >= 18) temAdulto = true;

      lista.push({
        NAME: p.nomeCompleto.trim(),
        BI: p.estrangeiro ? BI_API_ESTRANGEIRO : p.bi.trim(),
        PASSPORT: p.passaporte.trim(),
        GENDER: p.genero,
        BIRTHDATE: p.dataNascimento,
      });
    }

    if (total > 1 && !temAdulto) {
      setErroForm("É necessário pelo menos um adulto entre os passageiros.");
      return;
    }

    onAvancar(lista);
  };

  const showTomadorCheckbox = tomadorTipo === "particular" && !tomadorViajaUsado;

  return (
    <>
      <ProcessingModal isOpen={buscandoNif !== null} message="A validar NIF..." />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-4"
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

              <div className="text-center">
                <h2 className="text-xl font-black uppercase tracking-wide text-black sm:text-3xl">
                  Informações passageiros
                </h2>
                <hr className="mx-auto my-3 w-[90%] border-white/80" />
              </div>

              {showTomadorCheckbox && (
                <button
                  type="button"
                  onClick={marcarTomadorViaja}
                  className="mb-4 flex items-center gap-3 text-left text-white"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-white bg-white/10",
                      tomadorViaja && "bg-white text-[#31124b]",
                    )}
                  >
                    {tomadorViaja ? "✓" : ""}
                  </span>
                  <span className="text-sm font-bold uppercase sm:text-base">
                    O tomador viajará?
                  </span>
                </button>
              )}

              <div className="space-y-8">
                {Array.from({ length: total }, (_, i) => {
                  const p = passageiros[i] ?? emptyPassageiro();
                  const snapAnterior = ultimoNifValidado[i];
                  const erroNif = nifErroPassageiro[i];
                  const mostrarRestaurarNif =
                    Boolean(snapAnterior) &&
                    (!p.nifValidado || Boolean(erroNif)) &&
                    !p.estrangeiro;
                  return (
                    <div key={i}>
                      <h3 className="mb-3 text-center text-base font-black uppercase text-white sm:text-lg">
                        {i + 1}º Passageiro
                      </h3>

                      {!p.estrangeiro && (
                        <div className="mb-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => marcarEstrangeiro(i)}
                            className="rounded-md bg-[#2563eb] px-4 py-2 text-[11px] font-bold uppercase text-white shadow hover:bg-[#1d4ed8] sm:text-xs"
                          >
                            Clique aqui se for estrangeiro
                          </button>
                        </div>
                      )}

                      {p.estrangeiro && (
                        <p className="mb-3 text-center text-[11px] font-semibold uppercase text-white/95">
                          Passageiro estrangeiro — preencha os campos manualmente
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {!p.estrangeiro && (
                          <div>
                            <label className={labelClass}>
                              NIF <span className="text-red-200">*</span>
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={p.bi}
                                readOnly={p.nomeGeneroBloqueados}
                                onChange={(e) => updateCampo(i, "bi", e.target.value)}
                                onBlur={() => validarNifAoSair(i)}
                                className={cn(
                                  inputClass,
                                  p.nomeGeneroBloqueados && inputLocked,
                                )}
                                placeholder="NIF do passageiro"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  p.nomeGeneroBloqueados
                                    ? desbloquearNif(i)
                                    : void validarNif(i)
                                }
                                className="flex min-w-[38px] items-center justify-center rounded-md bg-[#2563eb] px-2 font-bold text-white hover:bg-[#1d4ed8]"
                                aria-label={
                                  p.nomeGeneroBloqueados ? "Editar NIF" : "Validar NIF"
                                }
                              >
                                {p.nomeGeneroBloqueados ? "×" : "›"}
                              </button>
                            </div>
                            {p.nifValidado && (
                              <p className="mt-1 text-[10px] text-emerald-100">
                                NIF já validado no fluxo da simulação.
                              </p>
                            )}
                            {erroNif && (
                              <p className="mt-1 text-[10px] font-medium text-red-100">
                                {erroNif}
                              </p>
                            )}
                            {!erroNif && !p.nifValidado && p.bi.trim() && (
                              <p className="mt-1 text-[10px] text-amber-100">
                                Valide o NIF antes de avançar.
                              </p>
                            )}
                            {mostrarRestaurarNif && snapAnterior && (
                              <button
                                type="button"
                                onClick={() => restaurarNifAnterior(i)}
                                className="mt-2 text-left text-[10px] font-bold uppercase text-white underline decoration-white/80 hover:text-white/90 sm:text-[11px]"
                              >
                                Usar NIF anterior ({snapAnterior.bi})
                              </button>
                            )}
                          </div>
                        )}

                        <div className={!p.estrangeiro ? "" : "md:col-span-2"}>
                          <label className={labelClass}>
                            Nome completo <span className="text-red-200">*</span>
                          </label>
                          <input
                            type="text"
                            value={p.nomeCompleto}
                            readOnly={!p.estrangeiro && p.nomeGeneroBloqueados}
                            onChange={(e) => updateCampo(i, "nomeCompleto", e.target.value)}
                            className={cn(
                              inputClass,
                              !p.estrangeiro && p.nomeGeneroBloqueados && inputLocked,
                            )}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Passaporte <span className="text-red-200">*</span>
                          </label>
                          <input
                            type="text"
                            value={p.passaporte}
                            onChange={(e) => updateCampo(i, "passaporte", e.target.value)}
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Género <span className="text-red-200">*</span>
                          </label>
                          <select
                            value={p.genero}
                            disabled={!p.estrangeiro && p.nomeGeneroBloqueados}
                            onChange={(e) => updateCampo(i, "genero", e.target.value)}
                            className={cn(
                              inputClass,
                              !p.estrangeiro && p.nomeGeneroBloqueados && inputLocked,
                            )}
                          >
                            <option value="">Selecione o género</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                            <option value="O">Outro</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 md:col-auto">
                          <label className={labelClass}>
                            Data de nascimento <span className="text-red-200">*</span>
                          </label>
                          <input
                            type="date"
                            value={p.dataNascimento}
                            onChange={(e) => updateCampo(i, "dataNascimento", e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {erroForm && (
                <p className="mt-4 text-center text-sm font-medium text-red-100">{erroForm}</p>
              )}

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={onVoltarTomador}
                  className={cn(
                    raioBotaoPonta,
                    "border border-white/70 px-6 py-2.5 text-xs font-bold uppercase text-white hover:bg-white/10",
                  )}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!podeAvancar || buscandoNif !== null}
                  className={cn(
                    raioBotaoPonta,
                    "px-12 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg",
                    podeAvancar && buscandoNif === null
                      ? "cursor-pointer bg-[#31124b] hover:bg-[#3d1860]"
                      : "cursor-not-allowed bg-[#31124b]/40 opacity-60",
                  )}
                >
                  Avançar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

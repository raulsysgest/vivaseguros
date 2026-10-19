"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { signOut } from "next-auth/react";
import type { TomadorTipo } from "@/components/simulacoes/modal-preco-viagem";
import type { TomadorViagemFormData } from "@/components/simulacoes/modal-tomador-viagem";
import type { ViagemFormSubmitData } from "@/components/simulacoes/formulario-viagem";
import type { PassageiroViagemApi, ViagemSimulacaoApiData } from "@/types/viagem-simulacao";
import { parseViagemChildrenCount } from "@/lib/viagem-simulacao";
import {
  buildCriarPropostaViagemBody,
  buildGuardarPropostaAgentesBody,
  extrairDadosPagamentoViagem,
  labelGeneroResumo,
  type ViagemDadosPagamento,
  type ViagemPropostaVivaPayload,
} from "@/lib/viagem-proposta";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import { ProcessingModal } from "@/components/ui/processing-modal";
import { cn } from "@/utils/cn";
import { raioBotaoPonta } from "@/utils/botao-ponta";
import { useToast } from "@/hooks/use-toast";

type ModalResumoPropostaViagemProps = {
  isOpen: boolean;
  tomadorTipo: TomadorTipo;
  viagem: ViagemFormSubmitData;
  tomador: TomadorViagemFormData;
  passageiros: PassageiroViagemApi[];
  simulacao: ViagemSimulacaoApiData;
  onClose: () => void;
  onVoltarPassageiros: () => void;
  onAvancarPagamento: (dados: ViagemDadosPagamento) => void;
};

const itemLabel = "text-[9px] font-bold uppercase text-white/80 sm:text-[10px]";
const itemValue = "mt-0.5 text-xs font-semibold text-white sm:text-sm";

function ResumoItem({ label, value }: { label: string; value: string }) {
  const v = value.trim() || "—";
  return (
    <div className="min-w-0">
      <p className={itemLabel}>{label}</p>
      <p className={itemValue}>{v}</p>
    </div>
  );
}

export function ModalResumoPropostaViagem({
  isOpen,
  tomadorTipo,
  viagem,
  tomador,
  passageiros,
  simulacao,
  onClose,
  onVoltarPassageiros,
  onAvancarPagamento,
}: ModalResumoPropostaViagemProps) {
  const { toast } = useToast();
  const [criandoProposta, setCriandoProposta] = useState(false);
  const [descarregando, setDescarregando] = useState(false);
  const [contractNumber, setContractNumber] = useState<string | null>(null);
  const [dadosPagamento, setDadosPagamento] = useState<ViagemDadosPagamento | null>(
    null,
  );
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteKyc, setAceiteKyc] = useState(false);
  const [propostaDescarregada, setPropostaDescarregada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const isParticular = tomadorTipo === "particular";
  const criancasCount = parseViagemChildrenCount(viagem.criancas);
  const podeDescarregar = aceiteTermos && aceiteKyc && Boolean(contractNumber);

  const guardarPropostaAgentes = useCallback(
    async (pagamento: ViagemDadosPagamento) => {
      try {
        const payload = buildGuardarPropostaAgentesBody({
          tomador,
          viagem,
          passageiros,
          pagamento,
        });
        await clientFetch<{ success?: boolean; msg?: string }>("/api/proposals", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        const err = error as ClientFetchError;
        if (err.status === 401) {
          await signOut({ redirectTo: "/login" });
          return;
        }
        const payload = err.data as { message?: string; msg?: string } | undefined;
        toast.error(
          payload?.msg ||
            payload?.message ||
            "Proposta Viva criada, mas não foi possível guardar no sistema de agentes.",
        );
      }
    },
    [tomador, viagem, passageiros, toast],
  );

  const criarProposta = useCallback(async () => {
    if (!simulacao.idSimulationTel || !simulacao.idContract) {
      setErro("Simulação sem identificadores Viva. Volte e simule novamente.");
      return;
    }
    setCriandoProposta(true);
    setErro(null);
    try {
      const body = buildCriarPropostaViagemBody(tomador, simulacao);
      const res = await clientFetch<{
        success?: boolean;
        data?: ViagemPropostaVivaPayload;
      }>("/api/viagem/proposta", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = res.data;
      const pagamento = extrairDadosPagamentoViagem(payload);
      if (!pagamento) {
        throw new Error(
          (typeof payload?.error === "string" ? payload.error : null) ||
            "Resposta inválida ao criar proposta (referência Multicaixa em falta).",
        );
      }
      setDadosPagamento(pagamento);
      setContractNumber(pagamento.contractNumber);
      void guardarPropostaAgentes(pagamento);
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string; error?: string } | undefined;
      setErro(payload?.message || payload?.error || "Não foi possível criar a proposta.");
    } finally {
      setCriandoProposta(false);
    }
  }, [simulacao, tomador, guardarPropostaAgentes]);

  useEffect(() => {
    if (!isOpen) return;
    setAceiteTermos(false);
    setAceiteKyc(false);
    setPropostaDescarregada(false);
    setContractNumber(null);
    setDadosPagamento(null);
    setErro(null);
    void criarProposta();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir o modal
  }, [isOpen]);

  const descarregarProposta = async () => {
    if (!podeDescarregar || !contractNumber) {
      toast.info("Marque os dois checkboxes antes de descarregar.");
      return;
    }
    setDescarregando(true);
    try {
      const res = await fetch(
        `/api/viagem/proposta/${encodeURIComponent(contractNumber)}/print`,
        { credentials: "same-origin" },
      );
      if (res.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errJson?.message || "Erro ao descarregar proposta");
      }
      const blob = await res.blob();
      if (blob.size < 128) {
        throw new Error("Ficheiro da proposta vazio ou inválido");
      }
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `proposta-${contractNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      setPropostaDescarregada(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Não foi possível descarregar a proposta.",
      );
    } finally {
      setDescarregando(false);
    }
  };

  const avancarPagamento = () => {
    if (!aceiteTermos) {
      toast.info("Aceite os termos e condições.");
      return;
    }
    if (!propostaDescarregada) {
      toast.info("Descarregue a proposta antes de avançar para pagamento.");
      return;
    }
    if (!dadosPagamento) {
      toast.error("Dados de pagamento indisponíveis. Aguarde a criação da proposta.");
      return;
    }
    onAvancarPagamento(dadosPagamento);
  };

  return (
    <>
      <ProcessingModal
        isOpen={criandoProposta || descarregando}
        message={criandoProposta ? "A criar proposta..." : "A preparar download..."}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative flex max-h-[94vh] w-full max-w-[960px] flex-col overflow-y-auto rounded-[24px] px-5 py-8 shadow-2xl sm:px-10 sm:py-10"
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

              <h2 className="text-xl font-black uppercase text-white sm:text-3xl">
                Resumo da proposta
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/30 py-4 sm:grid-cols-3 md:grid-cols-6">
                <ResumoItem label="Origem" value={viagem.origem} />
                <ResumoItem label="Destino" value={viagem.destinoLabel} />
                <ResumoItem label="Check-in" value={viagem.dataInicio} />
                <ResumoItem label="Check-out" value={viagem.dataFim} />
                <ResumoItem label="Adultos" value={viagem.adultos} />
                <ResumoItem label="Crianças" value={String(criancasCount)} />
              </div>

              <h3 className="mt-6 text-center text-sm font-black uppercase text-white sm:text-base">
                Tomador de seguro
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ResumoItem label="Nome" value={tomador.nomeCompleto} />
                <ResumoItem label="E-mail" value={tomador.email} />
                <ResumoItem label="Telemóvel" value={tomador.telefone} />
                <ResumoItem label="Morada" value={tomador.endereco} />
                {isParticular && (
                  <>
                    <ResumoItem
                      label="Género"
                      value={labelGeneroResumo(tomador.genero)}
                    />
                    <ResumoItem label="Data nascimento" value={tomador.dataNascimento} />
                  </>
                )}
              </div>

              <h3 className="mt-8 text-center text-sm font-black uppercase text-white sm:text-base">
                Dados dos passageiros
              </h3>
              <div className="mt-4 space-y-6">
                {passageiros.map((p, i) => (
                  <div key={i}>
                    <p className="mb-2 text-center text-xs font-bold uppercase text-white">
                      {i + 1}º passageiro
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ResumoItem label="Nome" value={p.NAME} />
                      <ResumoItem label="Passaporte" value={p.PASSPORT} />
                      <ResumoItem
                        label="Data nascimento"
                        value={p.BIRTHDATE.split(" ")[0] ?? p.BIRTHDATE}
                      />
                      <ResumoItem label="NIF" value={p.BI} />
                      <ResumoItem label="Género" value={labelGeneroResumo(p.GENDER)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <label className="flex cursor-pointer gap-3 text-left text-white">
                  <input
                    type="checkbox"
                    checked={aceiteTermos}
                    onChange={(e) => setAceiteTermos(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#D78440]"
                  />
                  <span className="text-[11px] leading-snug sm:text-xs">
                    <span className="font-bold uppercase">Termos e condições</span>
                    <br />
                    Ao avançar para pagamento está a aceitar os Termos e Condições e irá
                    receber as Condições Particulares do Seguro e Recibo de Pagamento no seu
                    e-mail.
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 text-left text-white">
                  <input
                    type="checkbox"
                    checked={aceiteKyc}
                    onChange={(e) => setAceiteKyc(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#D78440]"
                  />
                  <span className="text-[11px] leading-snug sm:text-xs">
                    <span className="font-bold uppercase">Formulário de KYC</span>
                    <br />
                    Solicitamos que imprima, preencha e assine a proposta e o formulário de
                    KYC, e nos envie por e-mail.
                  </span>
                </label>
              </div>

              {erro && (
                <p className="mt-4 text-center text-sm font-medium text-red-100">{erro}</p>
              )}

              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={!podeDescarregar}
                  onClick={() => void descarregarProposta()}
                  className={cn(
                    raioBotaoPonta,
                    "w-full max-w-md px-8 py-3 text-sm font-black uppercase tracking-wide text-white sm:w-auto",
                    podeDescarregar
                      ? "cursor-pointer bg-[#31124b] hover:bg-[#3d1860]"
                      : "cursor-not-allowed bg-[#31124b]/40 opacity-60",
                  )}
                >
                  Descarregar proposta
                </button>
                <button
                  type="button"
                  disabled={!propostaDescarregada}
                  onClick={avancarPagamento}
                  className={cn(
                    raioBotaoPonta,
                    "w-full max-w-md px-8 py-3 text-sm font-black uppercase tracking-wide text-white sm:w-auto",
                    propostaDescarregada
                      ? "cursor-pointer bg-[#31124b] hover:bg-[#3d1860]"
                      : "cursor-not-allowed bg-[#31124b]/40 opacity-60",
                  )}
                >
                  Avançar para pagamento
                </button>
                <button
                  type="button"
                  onClick={onVoltarPassageiros}
                  className={cn(
                    raioBotaoPonta,
                    "border border-white/70 px-6 py-2 text-xs font-bold uppercase text-white hover:bg-white/10",
                  )}
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

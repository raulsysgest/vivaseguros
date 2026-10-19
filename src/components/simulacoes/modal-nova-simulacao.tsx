"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  User,
  Phone,
} from "lucide-react";
import { ModalConsultarApolice } from "./modal-consultar-apolice";
import {
  FormularioViagem,
  type ViagemFormSubmitData,
} from "./formulario-viagem";
import {
  ModalPrecoViagem,
  type TomadorTipo,
} from "./modal-preco-viagem";
import {
  ModalTomadorViagem,
  type TomadorViagemFormData,
} from "./modal-tomador-viagem";
import { ModalPassageirosViagem } from "./modal-passageiros-viagem";
import { ModalResumoPropostaViagem } from "./modal-resumo-proposta-viagem";
import { ModalPagamentoViagem } from "./modal-pagamento-viagem";
import { ModalSucessoViagem } from "./modal-sucesso-viagem";
import type { ViagemDadosPagamento } from "@/lib/viagem-proposta";
import type { PassageiroViagemApi } from "@/types/viagem-simulacao";
import { ProcessingModal } from "@/components/ui/processing-modal";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import {
  buildGuardarSimulacaoViagemPayload,
  buildViagemSimulacaoPayload,
  formatPrecoViagemAOA,
  type GuardarSimulacaoViagemPayload,
} from "@/lib/viagem-simulacao";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import type {
  ViagemSimulacaoApiData,
  ViagemSimulacaoResponse,
} from "@/types/viagem-simulacao";
import type { ContinuarViagemDraft } from "@/lib/continuar-viagem";
import { classesBotaoSimuleJa, classesBotaoSeguinte } from "@/utils/botao-ponta";

interface ModalNovaSimulacaoProps {
  isOpen: boolean;
  onClose: () => void;
  /** Reabrir formulário de viagem com dados de uma simulação guardada */
  continuarViagem?: ContinuarViagemDraft | null;
  onCriarSimulacao: (dados: {
    tipo: "viagem" | "automovel" | "conforto" | "acidentes";
    tipoNome: string;
    preco: number;
    clienteNome: string;
    nif: string;
    contacto: string;
    simulationId?: number;
    detalhesViagem?: GuardarSimulacaoViagemPayload;
  }) => void;
}

export function ModalNovaSimulacao({
  isOpen,
  onClose,
  onCriarSimulacao,
  continuarViagem = null,
}: ModalNovaSimulacaoProps) {
  const [selectedTipoIndex, setSelectedTipoIndex] = useState(0);
  const [heroFlipTick, setHeroFlipTick] = useState(0);
  const [heroAnimPhase, setHeroAnimPhase] = useState<"in" | "out">("in");
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isConsultarOpen, setIsConsultarOpen] = useState(false);
  const [mostrarCampos, setMostrarCampos] = useState(false);
  const toast = useToast();

  const [showPrecoViagem, setShowPrecoViagem] = useState(false);
  const [simulandoViagem, setSimulandoViagem] = useState(false);
  const [precoViagemLabel, setPrecoViagemLabel] = useState("AOA —");
  const [viagemPendente, setViagemPendente] = useState<ViagemFormSubmitData | null>(null);
  const [viagemSimApi, setViagemSimApi] = useState<ViagemSimulacaoApiData | null>(null);
  const [tomadorTipo, setTomadorTipo] = useState<TomadorTipo | null>(null);
  const [guardandoSimulacao, setGuardandoSimulacao] = useState(false);
  const [showTomadorViagem, setShowTomadorViagem] = useState(false);
  const [showPassageirosViagem, setShowPassageirosViagem] = useState(false);
  const [tomadorViagemDados, setTomadorViagemDados] =
    useState<TomadorViagemFormData | null>(null);
  const [showResumoPropostaViagem, setShowResumoPropostaViagem] = useState(false);
  const [passageirosConfirmados, setPassageirosConfirmados] = useState<
    PassageiroViagemApi[] | null
  >(null);
  const [showPagamentoViagem, setShowPagamentoViagem] = useState(false);
  const [dadosPagamentoViagem, setDadosPagamentoViagem] =
    useState<ViagemDadosPagamento | null>(null);
  const [showSucessoViagem, setShowSucessoViagem] = useState(false);

  const resetViagemSimulacao = useCallback(() => {
    setShowPrecoViagem(false);
    setShowTomadorViagem(false);
    setShowPassageirosViagem(false);
    setShowResumoPropostaViagem(false);
    setShowPagamentoViagem(false);
    setShowSucessoViagem(false);
    setDadosPagamentoViagem(null);
    setPassageirosConfirmados(null);
    setTomadorViagemDados(null);
    setSimulandoViagem(false);
    setViagemPendente(null);
    setViagemSimApi(null);
    setTomadorTipo(null);
    setPrecoViagemLabel("AOA —");
  }, []);

  const handleCloseModal = useCallback(() => {
    setMostrarCampos(false);
    resetViagemSimulacao();
    onClose();
  }, [onClose, resetViagemSimulacao]);

  const concluirFluxoViagem = useCallback(() => {
    setShowPagamentoViagem(false);
    setShowSucessoViagem(true);
  }, []);

  /** Fecha só o passo actual do fluxo viagem (preço → tomador → passageiros). */
  const fecharPassoFluxoViagem = useCallback(() => {
    if (showPagamentoViagem) {
      setShowPagamentoViagem(false);
      setShowResumoPropostaViagem(true);
      return;
    }
    if (showResumoPropostaViagem) {
      setShowResumoPropostaViagem(false);
      setShowPassageirosViagem(true);
      return;
    }
    if (showPassageirosViagem) {
      setShowPassageirosViagem(false);
      setShowTomadorViagem(true);
      return;
    }
    if (showTomadorViagem) {
      setShowTomadorViagem(false);
      setShowPrecoViagem(true);
      return;
    }
    if (showPrecoViagem) {
      setShowPrecoViagem(false);
    }
  }, [
    showPagamentoViagem,
    showResumoPropostaViagem,
    showPassageirosViagem,
    showTomadorViagem,
    showPrecoViagem,
  ]);

  // Campos do formulário AUTO
  const [autoMarca, setAutoMarca] = useState("ACESSMAQ");
  const [autoModelo, setAutoModelo] = useState("GS3EMZ00M");
  const [autoCilindrada, setAutoCilindrada] = useState("");
  const [autoNif, setAutoNif] = useState("");
  const [autoTelefone, setAutoTelefone] = useState("");

  // Campos do formulário CONFORTO
  const [confortoNome, setConfortoNome] = useState("");
  const [confortoNascimento, setConfortoNascimento] = useState("");
  const [confortoInicio, setConfortoInicio] = useState("");
  const [confortoTelefone, setConfortoTelefone] = useState("");
  const [confortoNif, setConfortoNif] = useState("");
  const [confortoAssegurados, setConfortoAssegurados] = useState("1");

  const banners = [
    {
      id: "viagens",
      tipo: "viagem" as const,
      category: "VIAGENS",
      iconSrc: "/icones/viagens.png",
      image: "/banners/banner1.png",
      precoBase: 20064.12,
      nomeSeguro: "SEGURO DE VIAGENS",
    },
    {
      id: "auto",
      tipo: "automovel" as const,
      category: "AUTO",
      iconSrc: "/icones/auto.png",
      image: "/banners/banner2.png",
      precoBase: 85450.0,
      nomeSeguro: "SEGURO AUTOMÓVEL",
    },
    {
      id: "conforto",
      tipo: "conforto" as const,
      category: "CONFORTO",
      iconSrc: "/icones/conforto.png",
      image: "/banners/banner3.png",
      precoBase: 42100.0,
      nomeSeguro: "SEGURO CONFORTO",
    },
    {
      id: "acidentes",
      tipo: "acidentes" as const,
      category: "ACIDENTES",
      iconSrc: "/icones/acidente.png",
      image: "/banners/banner4.png",
      precoBase: 15300.0,
      nomeSeguro: "SEGURO DE ACIDENTES",
    },
  ];

  const currentBanner = banners[selectedTipoIndex];

  const goToIndex = (index: number) => {
    if (swiperInstance) {
      swiperInstance.slideToLoop(index);
    }
    setSelectedTipoIndex(index);
    setMostrarCampos(true);
  };

  const handleSimuleJa = useCallback(() => {
    setMostrarCampos(true);
    setTimeout(() => {
      document.getElementById("form-strip")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMostrarCampos(false);
      resetViagemSimulacao();
      setSelectedTipoIndex(0);
      setHeroFlipTick(0);
      setHeroAnimPhase("in");
      swiperInstance?.slideToLoop(0, 0);
      return;
    }
    setHeroAnimPhase("in");
    setHeroFlipTick((tick) => tick + 1);

    if (continuarViagem) {
      resetViagemSimulacao();
      setSelectedTipoIndex(0);
      setMostrarCampos(true);
      swiperInstance?.slideToLoop(0, 0);
      setTimeout(() => {
        document.getElementById("form-strip")?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    }
  }, [isOpen, continuarViagem, swiperInstance, resetViagemSimulacao]);

  // Navegação por teclado com Swiper
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") swiperInstance?.slidePrev();
      if (e.key === "ArrowRight") swiperInstance?.slideNext();
      if (e.key === "Escape") {
        if (isConsultarOpen) {
          setIsConsultarOpen(false);
        } else if (
          showPagamentoViagem ||
          showResumoPropostaViagem ||
          showPassageirosViagem ||
          showTomadorViagem ||
          showPrecoViagem
        ) {
          fecharPassoFluxoViagem();
        } else {
          handleCloseModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isConsultarOpen,
    swiperInstance,
    handleCloseModal,
    fecharPassoFluxoViagem,
    showPagamentoViagem,
    showResumoPropostaViagem,
    showPassageirosViagem,
    showTomadorViagem,
    showPrecoViagem,
  ]);

  if (!isOpen) return null;

  const handleViagemSubmit = async (data: ViagemFormSubmitData) => {
    setSimulandoViagem(true);
    try {
      const payload = buildViagemSimulacaoPayload(data);
      const res = await clientFetch<ViagemSimulacaoResponse>("/api/viagem/simular", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const premium = res.data.installmentValues?.U;
      setPrecoViagemLabel(formatPrecoViagemAOA(premium));
      setViagemPendente(data);
      setViagemSimApi(res.data);
      setTomadorTipo(null);
      setShowPrecoViagem(true);
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string } | undefined;
      toast.error(payload?.message || "Não foi possível simular o seguro de viagem");
    } finally {
      setSimulandoViagem(false);
    }
  };

  const guardarViagemSimulacao = async () => {
    if (!viagemPendente || !tomadorTipo || guardandoSimulacao) return;
    const preco =
      viagemSimApi?.installmentValues?.U ?? currentBanner.precoBase;

    setGuardandoSimulacao(true);
    try {
      const payload = buildGuardarSimulacaoViagemPayload({
        form: viagemPendente,
        tomadorTipo,
        preco,
        nameInsurance: "SEGURO DE VIAGENS",
        simApi: viagemSimApi,
      });

      const res = await clientFetch<{
        success?: boolean;
        simulation_id?: number;
        message?: string;
      }>("/api/simulations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        toast.error(res.message || "Não foi possível guardar a simulação");
        return;
      }

      toast.success(res.message || "Simulação guardada com sucesso");
      onCriarSimulacao({
        tipo: "viagem",
        tipoNome: currentBanner.nomeSeguro,
        preco,
        clienteNome: viagemPendente.clienteNome,
        nif: viagemPendente.nif.trim(),
        contacto: viagemPendente.telefone.trim(),
        simulationId: res.simulation_id,
        detalhesViagem: payload,
      });
      handleCloseModal();
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string; error?: string } | undefined;
      toast.error(payload?.message || payload?.error || "Não foi possível guardar a simulação");
    } finally {
      setGuardandoSimulacao(false);
    }
  };

  // Submissão dos restantes formulários
  const handleSeguinte = (e: React.FormEvent) => {
    e.preventDefault();

    let clienteNome = "CLIENTE REGISTRADO";
    let nifFinal = "002233445LA001";
    let telefoneFinal = "923112233";

    if (currentBanner.tipo === "automovel") {
      nifFinal = autoNif || nifFinal;
      telefoneFinal = autoTelefone || telefoneFinal;
      clienteNome = `PROPRIETÁRIO ${autoMarca} ${autoModelo}`;
    } else if (currentBanner.tipo === "conforto") {
      clienteNome = confortoNome || clienteNome;
      nifFinal = confortoNif || nifFinal;
      telefoneFinal = confortoTelefone || telefoneFinal;
    }

    onCriarSimulacao({
      tipo: currentBanner.tipo,
      tipoNome: currentBanner.nomeSeguro,
      preco: currentBanner.precoBase,
      clienteNome,
      nif: nifFinal,
      contacto: telefoneFinal,
    });

    handleCloseModal();
  };

  // Variantes de animação de entrada para os formulários de cada apólice
  const formVariants = {
    initial: { opacity: 0, y: 18, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -12, filter: "blur(3px)" },
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 select-none">
        {/* Backdrop rápido e leve sem blur pesado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/75 cursor-pointer"
        />

        {/* Container Principal do Modal - Ocupa quase toda a tela */}
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.99 }}
          transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-[98vw] md:w-[96vw] h-[96vh] md:h-[95vh] max-w-[1750px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#1E0836] z-10"
        >
          {/* ========================================================= */}
          {/* 1. CARROSSEL DE BANNERS COM SWIPER (TOUCH / DRAG / SLIDE) */}
          {/* ========================================================= */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#1E0836]">
            <Swiper
              onSwiper={setSwiperInstance}
              loop={true}
              speed={1200}
              className="w-full h-full"
              onSlideChangeTransitionStart={() => {
                setHeroAnimPhase("out");
              }}
              onSlideChangeTransitionEnd={() => {
                setHeroFlipTick((tick) => tick + 1);
                setHeroAnimPhase("in");
              }}
            >
              {banners.map((item, index) => (
                <SwiperSlide key={item.id} className="relative w-full h-full overflow-hidden select-none">
                  <Image
                    src={item.image}
                    alt={item.category}
                    fill
                    priority={index === 0}
                    sizes="96vw"
                    draggable={false}
                    className="object-cover object-center pointer-events-none select-none opacity-90"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <div
              className="absolute inset-0 z-[1] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(192, 38, 211, 0.28) 0%, rgba(134, 25, 143, 0.52) 55%, rgba(46, 16, 101, 0.86) 100%)",
              }}
            />
            <div
              className="absolute inset-0 z-[1] pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(88, 28, 135, 0.45) 0%, rgba(112, 26, 117, 0.2) 40%, rgba(46, 16, 101, 0.78) 100%)",
              }}
            />
          </div>

          {/* Texto fixo no centro — sobe ligeiramente quando a faixa de formulário está aberta */}
          <div
            className={`pointer-events-none absolute inset-0 z-[15] flex items-center justify-center px-6 transition-[padding] duration-300 ${
              mostrarCampos ? "pb-44 sm:pb-52 md:pb-56" : "pb-0"
            }`}
          >
            <div
              key={heroAnimPhase === "in" ? `hero-flip-${heroFlipTick}` : "hero-fade-out"}
              className={`w-full max-w-5xl text-center ${
                heroAnimPhase === "in" ? "hero-slider-flip-in" : "hero-slider-fade-out"
              }`}
            >
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[7rem] font-black text-white uppercase tracking-wider drop-shadow-2xl leading-none">
                CONSIGO EM
              </h2>
              <p className="mt-1 sm:-mt-2 text-3xl sm:text-5xl md:text-6xl lg:text-[5rem] font-black text-white uppercase tracking-wider drop-shadow-2xl leading-tight">
                QUALQUER LUGAR
              </p>
              {!mostrarCampos && (
                <button
                  type="button"
                  onClick={handleSimuleJa}
                  className={classesBotaoSimuleJa(
                    "pointer-events-auto mt-8 sm:mt-[70px] mx-auto flex px-8 sm:px-10 py-2.5",
                  )}
                >
                  SIMULE JÁ
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. BARRA SUPERIOR: BOTÃO CONSULTAR APÓLICE + FECHAR (ESTÁTICA) */}
          {/* ========================================================= */}
          <button
            type="button"
            onClick={() => setIsConsultarOpen(true)}
            className="absolute top-0 left-1/2 z-30 -translate-x-1/2 flex items-center gap-0 pl-5 sm:pl-7 pr-1.5 py-2 sm:py-2.5 rounded-b-2xl sm:rounded-b-3xl rounded-t-none bg-gradient-to-r from-[#C026D3] via-[#DB2777] to-[#EA580C] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-fuchsia-900/40 transition-all duration-300 ease-in-out hover:brightness-110 active:scale-[0.98] cursor-pointer"
          >
            <span>CONSULTAR APÓLICE</span>
            <span className="ml-2.5 sm:ml-3 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#F97316] shadow-md">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Fechar"
            className="absolute top-4 sm:top-5 right-4 sm:right-7 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ========================================================= */}
          {/* 3. SETAS LATERAIS DO CARROSSEL (SWIPER) */}
          {/* ========================================================= */}
          <button
            type="button"
            onClick={() => swiperInstance?.slidePrev()}
            aria-label="Anterior"
            className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/30 bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer hover:scale-108 active:scale-95 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => swiperInstance?.slideNext()}
            aria-label="Próximo"
            className="absolute right-4 sm:right-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/30 bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer hover:scale-108 active:scale-95 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* ========================================================= */}
          {/* 5. BASE: ABAS SUPERIORES COM ÍCONES + FORMULÁRIO DINÂMICO */}
          {/* ========================================================= */}
          <div id="form-strip" className="absolute bottom-0 left-0 right-0 z-20 w-full">
            {/* A. Barra de tipos (paridade onlineinsurance / search_tabs) */}
            <div className="relative w-full px-3 sm:px-4">
              <div className="flex w-full overflow-hidden rounded-t-xl sm:rounded-t-2xl border border-[#D78440]/60 bg-white shadow-xl">
                {banners.map((item, index) => {
                  const isActive = index === selectedTipoIndex;
                  const isFirst = index === 0;
                  const isLast = index === banners.length - 1;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToIndex(index)}
                      className={`group flex min-h-[40px] sm:min-h-[46px] flex-1 items-center justify-center gap-1.5 border-[#D78440]/50 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200 sm:gap-2 sm:px-2.5 sm:text-[11px] ${
                        isFirst ? "rounded-tl-xl sm:rounded-tl-2xl" : "border-l"
                      } ${isLast ? "rounded-tr-xl sm:rounded-tr-2xl" : ""} ${
                        isActive
                          ? "bg-[#D78440] text-white"
                          : "bg-white text-[#D78440] hover:bg-[#D78440] hover:text-white"
                      } cursor-pointer`}
                    >
                      <Image
                        src={item.iconSrc}
                        alt={item.category}
                        width={18}
                        height={18}
                        className={`shrink-0 object-contain transition-all duration-200 ${
                          isActive
                            ? "brightness-200 grayscale"
                            : "group-hover:brightness-200 group-hover:grayscale"
                        }`}
                      />
                      <span className="truncate">{item.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. Faixa de Formulário: Só aparece quando o utilizador clica em SIMULE JÁ ou numa aba */}
            <AnimatePresence>
              {mostrarCampos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
                  className="w-full overflow-hidden"
                >
                  <div
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-t border-white/20 shadow-2xl"
                    style={{
                      background:
                        "linear-gradient(90deg, #E66928 0%, #D45B50 25%, #BA4B7E 55%, #96359A 75%, #7E2EA8 100%)",
                    }}
                  >
                    <div className="max-w-6xl mx-auto">
                      <AnimatePresence mode="wait">
                        {/* 1. SEGURO DE VIAGENS COM ANIMAÇÃO DE ENTRADA */}
                        {selectedTipoIndex === 0 && (
                          <FormularioViagem
                            formVariants={formVariants}
                            onSubmit={handleViagemSubmit}
                            initialDraft={
                              continuarViagem
                                ? {
                                    values: continuarViagem.values,
                                    contribuinte: continuarViagem.contribuinte,
                                  }
                                : null
                            }
                            draftKey={continuarViagem?.simulationId}
                          />
                        )}

                        {/* 2. SEGURO AUTOMÓVEL COM ANIMAÇÃO DE ENTRADA */}
                        {selectedTipoIndex === 1 && (
                          <motion.form
                            key="form-auto"
                            variants={formVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                            onSubmit={handleSeguinte}
                            className="flex flex-wrap items-end justify-between gap-2"
                          >
                            <div className="flex flex-col flex-1 min-w-[140px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Marca <span className="text-red-300">*</span>
                              </label>
                              <select
                                value={autoMarca}
                                onChange={(e) => setAutoMarca(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 text-xs font-semibold focus:outline-none shadow-md cursor-pointer"
                              >
                                <option value="ACESSMAQ">ACESSMAQ</option>
                                <option value="TOYOTA">TOYOTA</option>
                                <option value="HYUNDAI">HYUNDAI</option>
                                <option value="KIA">KIA</option>
                                <option value="MERCEDES-BENZ">MERCEDES-BENZ</option>
                              </select>
                            </div>

                            <div className="flex flex-col flex-1 min-w-[140px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Modelo <span className="text-red-300">*</span>
                              </label>
                              <select
                                value={autoModelo}
                                onChange={(e) => setAutoModelo(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 text-xs font-semibold focus:outline-none shadow-md cursor-pointer"
                              >
                                <option value="GS3EMZ00M">GS3EMZ00M</option>
                                <option value="COROLLA">COROLLA</option>
                                <option value="HILUX">HILUX</option>
                                <option value="TUCSON">TUCSON</option>
                                <option value="SPORTAGE">SPORTAGE</option>
                              </select>
                            </div>

                            <div className="flex flex-col flex-1 min-w-[120px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Cilindrada <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: 2000 cc"
                                value={autoCilindrada}
                                onChange={(e) => setAutoCilindrada(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[140px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                NIF <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Numero de NIF"
                                value={autoNif}
                                onChange={(e) => setAutoNif(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[140px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Telefone <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Numero de telefone"
                                value={autoTelefone}
                                onChange={(e) => setAutoTelefone(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <button
                              type="submit"
                              className={classesBotaoSeguinte(true, "ml-auto px-6 py-2.5 text-xs")}
                            >
                              SEGUINTE
                            </button>
                          </motion.form>
                        )}

                        {/* 3. SEGURO CONFORTO COM ANIMAÇÃO DE ENTRADA */}
                        {selectedTipoIndex === 2 && (
                          <motion.form
                            key="form-conforto"
                            variants={formVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                            onSubmit={handleSeguinte}
                            className="flex flex-wrap items-end justify-between gap-2"
                          >
                            <div className="flex flex-col flex-1 min-w-[140px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Nome Completo <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Nome Completo"
                                value={confortoNome}
                                onChange={(e) => setConfortoNome(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[130px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Data de Nascimento <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={confortoNascimento}
                                onChange={(e) => setConfortoNascimento(e.target.value)}
                                className="w-full px-3 py-2 rounded-full bg-white text-zinc-800 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[130px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Data Início Apólice <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={confortoInicio}
                                onChange={(e) => setConfortoInicio(e.target.value)}
                                className="w-full px-3 py-2 rounded-full bg-white text-zinc-800 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[130px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Telefone <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Telefone"
                                value={confortoTelefone}
                                onChange={(e) => setConfortoTelefone(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[130px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                NIF <span className="text-red-300">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="NIF"
                                value={confortoNif}
                                onChange={(e) => setConfortoNif(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 placeholder:text-zinc-400 text-xs font-medium focus:outline-none shadow-md"
                              />
                            </div>

                            <div className="flex flex-col flex-1 min-w-[130px]">
                              <label className="text-[9px] font-bold text-white uppercase mb-0.5">
                                Nº de Assegurados <span className="text-red-300">*</span>
                              </label>
                              <select
                                value={confortoAssegurados}
                                onChange={(e) => setConfortoAssegurados(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-full bg-white text-[11px] text-zinc-800 text-xs font-semibold focus:outline-none shadow-md cursor-pointer"
                              >
                                <option value="1">1 ASSEGURADO</option>
                                <option value="2">2 ASSEGURADOS</option>
                                <option value="3">3 ASSEGURADOS</option>
                                <option value="4+">4+ ASSEGURADOS</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              className={classesBotaoSeguinte(true, "ml-auto px-6 py-2.5 text-xs")}
                            >
                              SEGUINTE
                            </button>
                          </motion.form>
                        )}

                        {/* 4. SEGURO DE ACIDENTES (BREVEMENTE!) COM ANIMAÇÃO */}
                        {selectedTipoIndex === 3 && (
                          <motion.div
                            key="form-acidentes"
                            initial={{ opacity: 0, scale: 0.92, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -12 }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }}
                            className="py-5 flex items-center justify-center text-center"
                          >
                            <h3 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-widest drop-shadow-xl animate-pulse">
                              BREVEMENTE!
                            </h3>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rodapé (copyright + links) como produção */}
            <div className="flex w-full flex-col items-center justify-between gap-2 bg-[#A27284] px-4 py-3 text-[10px] text-white sm:flex-row sm:text-xs">
              <p className="text-center sm:text-left">
                VIVA Seguros - Todos os Direitos Reservados - {new Date().getFullYear()}
              </p>
              <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
                <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
                  VIVA SEGUROS
                </button>
                <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
                  CONTACTOS
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal 'CONSULTAR APÓLICE' */}
      <ModalConsultarApolice
        isOpen={isConsultarOpen}
        onClose={() => setIsConsultarOpen(false)}
      />

      <ProcessingModal isOpen={simulandoViagem} message="A simular seguro de viagem..." />

      <ModalPrecoViagem
        isOpen={showPrecoViagem}
        precoLabel={precoViagemLabel}
        tomadorTipo={tomadorTipo}
        onTomadorChange={setTomadorTipo}
        onAvancarProposta={() => {
          if (!tomadorTipo || !viagemPendente) return;
          setShowPrecoViagem(false);
          setShowTomadorViagem(true);
        }}
        onGuardarSimulacao={guardarViagemSimulacao}
        onClose={() => setShowPrecoViagem(false)}
      />

      {tomadorTipo && viagemPendente && (
        <ModalTomadorViagem
          isOpen={showTomadorViagem}
          tomadorTipo={tomadorTipo}
          initial={{
            nif: viagemPendente.nif.trim(),
            telefone: viagemPendente.telefone.trim(),
            nome: viagemPendente.clienteNome.trim(),
            bi: viagemPendente.clienteBi.trim(),
            sexo: viagemPendente.clienteSexo.trim(),
          }}
          onClose={fecharPassoFluxoViagem}
          onVoltarPreco={fecharPassoFluxoViagem}
          onAvancar={(data: TomadorViagemFormData) => {
            setTomadorViagemDados(data);
            setShowTomadorViagem(false);
            setShowPassageirosViagem(true);
          }}
        />
      )}

      {tomadorTipo && viagemPendente && tomadorViagemDados && (
        <ModalPassageirosViagem
          isOpen={showPassageirosViagem}
          tomadorTipo={tomadorTipo}
          tomador={tomadorViagemDados}
          viagemForm={viagemPendente}
          onClose={fecharPassoFluxoViagem}
          onVoltarTomador={fecharPassoFluxoViagem}
          onAvancar={(lista) => {
            setPassageirosConfirmados(lista);
            setShowPassageirosViagem(false);
            setShowResumoPropostaViagem(true);
          }}
        />
      )}

      {tomadorTipo &&
        viagemPendente &&
        tomadorViagemDados &&
        passageirosConfirmados &&
        viagemSimApi && (
          <ModalResumoPropostaViagem
            isOpen={showResumoPropostaViagem}
            tomadorTipo={tomadorTipo}
            viagem={viagemPendente}
            tomador={tomadorViagemDados}
            passageiros={passageirosConfirmados}
            simulacao={viagemSimApi}
            onClose={fecharPassoFluxoViagem}
            onVoltarPassageiros={fecharPassoFluxoViagem}
            onAvancarPagamento={(dados) => {
              setDadosPagamentoViagem(dados);
              setShowResumoPropostaViagem(false);
              setShowPagamentoViagem(true);
            }}
          />
        )}

      {dadosPagamentoViagem && (
        <ModalPagamentoViagem
          isOpen={showPagamentoViagem}
          dados={dadosPagamentoViagem}
          onClose={fecharPassoFluxoViagem}
          onVoltarResumo={fecharPassoFluxoViagem}
          onConcluir={concluirFluxoViagem}
        />
      )}

      <ModalSucessoViagem
        isOpen={showSucessoViagem}
        onFechar={handleCloseModal}
      />

      <ProcessingModal
        isOpen={guardandoSimulacao}
        message="A guardar simulação..."
      />
    </>
  );
}

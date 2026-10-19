"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  Layers,
  Car,
  Shield,
  Plane,
  Plus,
  RotateCcw,
  User,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  Store,
  ChevronDown,
  Download,
  Play,
  X,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKwanza } from "@/utils/formatters";
import { ModalNovaSimulacao } from "@/components/simulacoes/modal-nova-simulacao";
import type { SimulacaoItem, ViagemRotaLinha } from "@/lib/simulacoes-types";
import { mapApiSimulationToItem, type SimulacoesListResponse } from "@/lib/simulacoes-api";
import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import {
  simulacaoItemToContinuarViagem,
  type ContinuarViagemDraft,
} from "@/lib/continuar-viagem";
import { useToast } from "@/hooks/use-toast";
import { ProcessingModal } from "@/components/ui/processing-modal";
import {
  descarregarSimulacaoPdf,
  mensagemErroDescarregarSimulacao,
  vivaIdParaDownloadSimulacao,
} from "@/lib/descarregar-simulacao";

function resolveViagemRota(item: SimulacaoItem): ViagemRotaLinha | null {
  if (item.tipo !== "viagem") return null;
  if (item.viagemRota?.origin || item.viagemRota?.destiny) {
    return item.viagemRota;
  }
  const d = item.detalhesViagem;
  if (!d) return null;
  return {
    origin: d.origin,
    destiny: d.destiny,
    start_date: d.start_date,
    end_date: d.end_date,
  };
}

function ViagemRotaResumo({ item }: { item: SimulacaoItem }) {
  const rota = resolveViagemRota(item);
  if (!rota) return null;

  const origem = (rota.origin || "N/A").toUpperCase();
  const destino = (rota.destiny || "N/A").toUpperCase();
  const partida = rota.start_date || "N/A";
  const chegada = rota.end_date || "N/A";

  return (
    <div className="text-[11px] text-zinc-600 uppercase flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
      <span>
        ORIGEM: <span className="font-bold text-zinc-800">{origem}</span>
      </span>
      <span className="text-zinc-300">|</span>
      <span>
        DESTINO: <span className="font-bold text-zinc-800">{destino}</span>
      </span>
      <span className="text-zinc-300">|</span>
      <span>
        PARTIDA: <span className="font-bold text-zinc-800">{partida}</span>
      </span>
      <span className="text-zinc-300">|</span>
      <span>
        CHEGADA: <span className="font-bold text-zinc-800">{chegada}</span>
      </span>
    </div>
  );
}

export default function SimulacoesPage() {
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [nif, setNif] = useState("");
  const [telefone, setTelefone] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [continuarViagem, setContinuarViagem] = useState<ContinuarViagemDraft | null>(
    null,
  );
  const toast = useToast();

  const [simulacoes, setSimulacoes] = useState<SimulacaoItem[]>([]);
  const [listaCarregada, setListaCarregada] = useState(false);
  const [totalApi, setTotalApi] = useState<number | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [descarregandoSimulacaoId, setDescarregandoSimulacaoId] = useState<string | null>(
    null,
  );

  const carregarSimulacoes = useCallback(async () => {
    setListaCarregada(false);
    setErroLista(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        visibility_scope: "team",
      });

      const res = await clientFetch<SimulacoesListResponse>(
        `/api/simulations?${params.toString()}`,
      );

      const fromApi = (res.data ?? []).map(mapApiSimulationToItem);
      setTotalApi(res.pagination?.total ?? fromApi.length);
      setSimulacoes(fromApi);
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      const payload = err.data as { message?: string } | undefined;
      setErroLista(payload?.message || "Não foi possível carregar simulações");
      setSimulacoes([]);
      setTotalApi(null);
    } finally {
      setListaCarregada(true);
    }
  }, []);

  useEffect(() => {
    void carregarSimulacoes();
  }, [carregarSimulacoes]);

  const totalSimulacoes = totalApi ?? simulacoes.length;
  const totalAutomovel = useMemo(
    () => simulacoes.filter((s) => s.tipo === "automovel").length,
    [simulacoes],
  );
  const totalConforto = useMemo(
    () => simulacoes.filter((s) => s.tipo === "conforto").length,
    [simulacoes],
  );
  const totalViagem = useMemo(
    () => simulacoes.filter((s) => s.tipo === "viagem").length,
    [simulacoes],
  );

  const filtrosActivos = useMemo(
    () =>
      Boolean(
        filtroTipo ||
          filtroCanal ||
          filtroUnidade ||
          dataInicio ||
          dataTermino ||
          nomeCliente ||
          nif ||
          telefone,
      ),
    [
      filtroTipo,
      filtroCanal,
      filtroUnidade,
      dataInicio,
      dataTermino,
      nomeCliente,
      nif,
      telefone,
    ],
  );

  // Filtragem dinâmica
  const simulacoesFiltradas = useMemo(() => {
    return simulacoes.filter((item) => {
      if (filtroTipo && item.tipo !== filtroTipo) return false;
      if (filtroCanal && item.canal !== filtroCanal) return false;
      if (filtroUnidade && item.unidade !== filtroUnidade) return false;
      if (nomeCliente && !item.clienteNome.toLowerCase().includes(nomeCliente.toLowerCase()))
        return false;
      if (nif && !item.nif.toLowerCase().includes(nif.toLowerCase())) return false;
      if (telefone && !item.contacto.includes(telefone)) return false;
      return true;
    });
  }, [simulacoes, filtroTipo, filtroCanal, filtroUnidade, nomeCliente, nif, telefone]);

  const limparFiltros = () => {
    setFiltroTipo("");
    setFiltroCanal("");
    setFiltroUnidade("");
    setDataInicio("");
    setDataTermino("");
    setNomeCliente("");
    setNif("");
    setTelefone("");
  };

  const abrirNovaSimulacao = () => {
    setContinuarViagem(null);
    setIsModalOpen(true);
  };

  const fecharModalSimulacao = () => {
    setIsModalOpen(false);
    setContinuarViagem(null);
  };

  const handleDescarregarSimulacao = async (item: SimulacaoItem) => {
    if (!vivaIdParaDownloadSimulacao(item)) {
      toast.error(
        "Esta simulação não tem ID Viva associado. Guarde novamente a simulação.",
      );
      return;
    }
    if (descarregandoSimulacaoId) return;

    setDescarregandoSimulacaoId(item.id);
    try {
      await descarregarSimulacaoPdf(item);
      toast.success("Simulação descarregada.");
    } catch (error) {
      const err = error as ClientFetchError;
      if (err.status === 401) {
        await signOut({ redirectTo: "/login" });
        return;
      }
      toast.error(mensagemErroDescarregarSimulacao(error));
    } finally {
      setDescarregandoSimulacaoId(null);
    }
  };

  const handleContinuarSimulacao = (item: SimulacaoItem) => {
    if (item.tipo !== "viagem") {
      toast.info("Por agora, continuar simulação está disponível apenas para viagens.");
      return;
    }
    const draft = simulacaoItemToContinuarViagem(item);
    if (!draft) {
      toast.error("Não foi possível carregar os dados desta simulação.");
      return;
    }
    setContinuarViagem(draft);
    setIsModalOpen(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "viagem":
        return <Plane className="w-5 h-5 text-[#C85A27]" />;
      case "automovel":
        return <Car className="w-5 h-5 text-[#C85A27]" />;
      default:
        return <Shield className="w-5 h-5 text-[#C85A27]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. Grade de 4 Cards de Métricas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Simulações */}
        <Card className="bg-white border border-zinc-200/90 p-5 flex items-center gap-4 rounded-lg shadow-xs hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-[#C85A27]/10 text-[#C85A27] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-500 truncate">
              Total de Simulacoes
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {totalSimulacoes}
            </span>
          </div>
        </Card>

        {/* Total de Simulações Automóvel */}
        <Card className="bg-white border border-zinc-200/90 p-5 flex items-center gap-4 rounded-lg shadow-xs hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-[#C85A27]/10 text-[#C85A27] flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-500 truncate">
              Total de Simulacoes Automovel
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {totalAutomovel}
            </span>
          </div>
        </Card>

        {/* Total de Simulações Conforto */}
        <Card className="bg-white border border-zinc-200/90 p-5 flex items-center gap-4 rounded-lg shadow-xs hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-[#C85A27]/10 text-[#C85A27] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-500 truncate">
              Total de Simulacoes Conforto
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {totalConforto}
            </span>
          </div>
        </Card>

        {/* Total de Simulações de Viagem */}
        <Card className="bg-white border border-zinc-200/90 p-5 flex items-center gap-4 rounded-lg shadow-xs hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-[#C85A27]/10 text-[#C85A27] flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-500 truncate">
              Total de Simulacoes de Viagem
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {totalViagem}
            </span>
          </div>
        </Card>
      </div>

      {/* 2. Card Principal: Simulações Recentes + Filtros */}
      <Card className="bg-white border border-zinc-200/90 p-5 sm:p-6 rounded-lg shadow-xs flex flex-col gap-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Simulacoes Recentes
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Consulte, acompanhe e gerencie propostas de cotação emitidas.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={abrirNovaSimulacao}
            className="self-start sm:self-auto gap-2 text-xs font-semibold px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Simulacao</span>
          </Button>
        </div>

        {/* Grade de Filtros Organizada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tipo de Seguro */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Tipo de Seguro
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              >
                <option value="">Selecione o Seguro</option>
                <option value="viagem">Seguro de Viagens</option>
                <option value="automovel">Seguro Automóvel</option>
                <option value="conforto">Seguro Conforto</option>
              </select>
            </div>
          </div>

          {/* Canal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Canal
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filtroCanal}
                onChange={(e) => setFiltroCanal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              >
                <option value="">Todos os Canais</option>
                <option value="Balcão Agente">Balcão Agente</option>
                <option value="Online Web">Online Web</option>
                <option value="Corretor">Corretor</option>
              </select>
            </div>
          </div>

          {/* Unidade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Unidade
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              >
                <option value="">Todas as Unidades</option>
                <option value="Luanda - Sede">Luanda - Sede</option>
                <option value="Benguela">Benguela</option>
                <option value="Huambo">Huambo</option>
              </select>
            </div>
          </div>

          {/* Data de Início */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Data de Inicio
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              />
            </div>
          </div>

          {/* Data de Término */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Data de Termino
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              />
            </div>
          </div>

          {/* Nome do Cliente */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Nome do Cliente
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              />
            </div>
          </div>

          {/* Nº de NIF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Nº de NIF
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="000000000AA000"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              />
            </div>
          </div>

          {/* Nº de Telefone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Nº de Telefone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="900000000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#C85A27] focus:ring-1 focus:ring-[#C85A27]/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Botão de Limpar Filtros */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>

          <button
            type="button"
            onClick={() => void carregarSimulacoes()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Actualizar lista
          </button>

          <span className="text-xs text-zinc-400">
            {simulacoesFiltradas.length}{" "}
            {simulacoesFiltradas.length === 1 ? "registro encontrado" : "registros encontrados"}
          </span>
          {erroLista && (
            <span className="text-xs text-red-600" role="alert">
              {erroLista}
            </span>
          )}
        </div>

        {/* 3. Lista de Simulações Recentes */}
        <div className="flex flex-col gap-4 mt-2">
          {!listaCarregada ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 rounded-lg">
              <p className="text-sm text-zinc-500">A carregar simulações...</p>
            </div>
          ) : simulacoesFiltradas.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 rounded-lg">
              <Search className="w-8 h-8 text-zinc-300 mb-2" />
              <h4 className="text-sm font-semibold text-zinc-700">
                {simulacoes.length === 0 && !filtrosActivos
                  ? "Ainda não há simulações"
                  : "Nenhuma simulação encontrada"}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                {simulacoes.length === 0 && !filtrosActivos
                  ? "Crie a primeira simulação com o botão Nova Simulação."
                  : "Tente ajustar ou limpar os filtros para localizar as simulações cadastradas."}
              </p>
            </div>
          ) : (
            simulacoesFiltradas.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-200 bg-white shadow-xs overflow-hidden transition-all duration-150"
                >
                  {/* Cabeçalho do Item */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Caixa de Ícone */}
                      <div className="w-10 h-10 rounded-lg bg-[#C85A27]/10 flex items-center justify-center shrink-0 mt-0.5">
                        {getTipoIcon(item.tipo)}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-bold text-sm text-zinc-900 tracking-tight">
                            {item.tipoNome}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                              item.status === "Concluída"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Preço em Destaque */}
                        <div className="text-xs font-semibold text-zinc-900">
                          Preço:{" "}
                          <span className="text-[#C85A27] font-bold">
                            {formatKwanza(item.preco)}
                          </span>
                        </div>

                        <ViagemRotaResumo item={item} />

                        {/* Metadados: Cliente & NIF */}
                        <div className="text-xs text-zinc-600 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-800">
                            Cliente: {item.clienteNome}
                          </span>
                          <span className="text-zinc-300">|</span>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            NIF: {item.nif}
                          </span>
                        </div>

                        {/* Metadados: Contacto & Data/Hora */}
                        <div className="text-[11px] text-zinc-500 flex items-center gap-3 flex-wrap mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>Contacto: {item.contacto}</span>
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{item.dataHora}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Expandir/Recolher */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      aria-label="Expandir detalhes"
                      className="self-end sm:self-center p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#C85A27]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Ações e Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center gap-3">
                      {/* Botão 1: Continuar Simulação */}
                      <button
                        type="button"
                        onClick={() => handleContinuarSimulacao(item)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#1E1B4B] hover:bg-[#2D2A5E] rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continuar Simulação</span>
                      </button>

                      {/* Botão 2: Descarregar Simulação */}
                      <button
                        type="button"
                        disabled={
                          !vivaIdParaDownloadSimulacao(item) ||
                          descarregandoSimulacaoId === item.id
                        }
                        onClick={() => void handleDescarregarSimulacao(item)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#C85A27] hover:bg-[#B34E20] rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descarregar Simulação</span>
                      </button>

                      {/* Botão 3: Cancelar Simulação */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar Simulação</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Modal de Simulação com Banners Oficiais e Filtro Dock */}
      <ModalNovaSimulacao
        isOpen={isModalOpen}
        onClose={fecharModalSimulacao}
        continuarViagem={continuarViagem}
        onCriarSimulacao={() => {
          void carregarSimulacoes();
        }}
      />

      <ProcessingModal
        isOpen={descarregandoSimulacaoId != null}
        message="A descarregar simulação..."
      />
    </div>
  );
}

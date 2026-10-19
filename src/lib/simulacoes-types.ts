import type { GuardarSimulacaoViagemPayload } from "@/lib/viagem-simulacao";

export type SimulacaoTipo = "viagem" | "automovel" | "conforto" | "acidentes";

export type ViagemRotaLinha = {
  origin: string;
  destiny: string;
  start_date: string;
  end_date: string;
};

export type SimulacaoItem = {
  id: string;
  tipo: SimulacaoTipo;
  tipoNome: string;
  preco: number;
  clienteNome: string;
  nif: string;
  contacto: string;
  dataHora: string;
  canal: string;
  unidade: string;
  status: "Pendente" | "Concluída" | "Cancelada";
  /** ID Viva para download PDF (contrato ou simulação). */
  idContractApi: string | null;
  idSimulationApi: string | null;
  viagemRota?: ViagemRotaLinha;
  viagemMeta?: {
    adults: number;
    childrens: number;
    tomadorTipo: "empresa" | "particular" | null;
    idSimulationApi: string | null;
    idContractApi: string | null;
  };
  detalhesViagem?: GuardarSimulacaoViagemPayload;
};

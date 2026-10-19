import type { ViagemFormSubmitData } from "@/components/simulacoes/formulario-viagem";
import type { TomadorViagemFormData } from "@/components/simulacoes/modal-tomador-viagem";
import type {
  PassageiroViagemApi,
  ViagemSimulacaoApiData,
} from "@/types/viagem-simulacao";
import { parseViagemChildrenCount } from "@/lib/viagem-simulacao";

export type CriarPropostaViagemBody = {
  idSimulacao: number | string;
  idContract: number | string;
  nome: string;
  genero: string;
  email: string;
  BI: string;
  nif: string;
  passaporte: string;
  data_de_nascimento: string;
  telefone: string;
  endereco: string;
  fracionamento: string;
};

export function buildCriarPropostaViagemBody(
  tomador: TomadorViagemFormData,
  sim: ViagemSimulacaoApiData,
): CriarPropostaViagemBody {
  const bi = tomador.bi.trim() || tomador.numeroDocumento.trim();
  return {
    idSimulacao: sim.idSimulationTel ?? "",
    idContract: sim.idContract ?? "",
    nome: tomador.nomeCompleto.trim(),
    genero: tomador.genero.trim() || "M",
    email: tomador.email.trim(),
    BI: bi,
    nif: tomador.nif.trim(),
    passaporte: tomador.numeroDocumento.trim(),
    data_de_nascimento: tomador.dataNascimento.trim(),
    telefone: tomador.telefone.trim(),
    endereco: tomador.endereco.trim(),
    fracionamento: "U",
  };
}

export function labelGeneroResumo(codigo: string): string {
  const c = codigo.trim().toUpperCase();
  if (c.startsWith("F")) return "FEMININO";
  if (c.startsWith("M")) return "MASCULINO";
  return "OUTRO";
}

/** Resposta Viva após POST /viva/proposal (contractar seguro). */
export type ViagemPropostaVivaPayload = {
  contractNumber?: string | number;
  hasError?: boolean;
  error?: string | null;
  contractAtmDTO?: {
    entityMb?: string | number;
    referenceMb?: string | number;
    totalAmount?: number | string;
  };
};

export type ViagemDadosPagamento = {
  contractNumber: string;
  entityMb: string;
  referenceMb: string;
  totalAmount: number;
};

export function extrairDadosPagamentoViagem(
  payload: ViagemPropostaVivaPayload | null | undefined,
): ViagemDadosPagamento | null {
  if (!payload || payload.hasError || payload.error) return null;
  const contractNumber = payload.contractNumber != null ? String(payload.contractNumber) : "";
  const atm = payload.contractAtmDTO;
  if (!contractNumber || !atm) return null;
  const entityMb = atm.entityMb != null ? String(atm.entityMb).trim() : "";
  const referenceMb = atm.referenceMb != null ? String(atm.referenceMb).trim() : "";
  const totalAmount =
    typeof atm.totalAmount === "number"
      ? atm.totalAmount
      : Number.parseFloat(String(atm.totalAmount ?? "").replace(",", "."));
  if (!entityMb || !referenceMb || !Number.isFinite(totalAmount)) return null;
  return { contractNumber, entityMb, referenceMb, totalAmount };
}

function dataParaPropostaAgentes(valor: string): string {
  const t = valor.trim();
  if (!t) return t;
  return t.includes(" ") ? t.split(" ")[0] : t;
}

/** Corpo para POST /api/proposals (Laravel agentes), alinhado ao legado `submitInsuranceProposal`. */
export type GuardarPropostaAgentesBody = {
  insurance_holder: {
    full_name: string;
    email: string;
    telephone: string;
    address: string;
    NIF: string;
    birth_date: string;
    gender: string;
    BI: string;
  };
  type: "TRIP";
  name_insurance: string;
  id_contract: string;
  price: number;
  reference: string;
  entity: string;
  details: Array<{
    full_name: string;
    birth_date: string;
    gender: string;
    BI: string;
    passport: string;
  }>;
  proposal_details: Array<{
    origin: string;
    destiny: string;
    start_date: string;
    end_date: string;
    adults: string | number;
    childrens: string | number;
  }>;
  contractNumber: string;
};

export function buildGuardarPropostaAgentesBody(input: {
  tomador: TomadorViagemFormData;
  viagem: ViagemFormSubmitData;
  passageiros: PassageiroViagemApi[];
  pagamento: ViagemDadosPagamento;
}): GuardarPropostaAgentesBody {
  const biTomador =
    input.tomador.bi.trim() || input.tomador.numeroDocumento.trim();
  return {
    insurance_holder: {
      full_name: input.tomador.nomeCompleto.trim(),
      email: input.tomador.email.trim(),
      telephone: input.tomador.telefone.trim(),
      address: input.tomador.endereco.trim(),
      NIF: input.tomador.nif.trim(),
      birth_date: dataParaPropostaAgentes(input.tomador.dataNascimento),
      gender: input.tomador.genero.trim() || "M",
      BI: biTomador,
    },
    type: "TRIP",
    name_insurance: "Seguro Viagem Premium",
    id_contract: input.pagamento.contractNumber,
    price: input.pagamento.totalAmount,
    reference: input.pagamento.referenceMb,
    entity: input.pagamento.entityMb,
    details: input.passageiros.map((p) => ({
      full_name: p.NAME.trim(),
      birth_date: dataParaPropostaAgentes(p.BIRTHDATE),
      gender: p.GENDER.trim() || "M",
      BI: p.BI.trim(),
      passport: p.PASSPORT.trim(),
    })),
    proposal_details: [
      {
        origin: input.viagem.origem,
        destiny: input.viagem.destino,
        start_date: input.viagem.dataInicio,
        end_date: input.viagem.dataFim,
        adults: input.viagem.adultos,
        childrens: parseViagemChildrenCount(input.viagem.criancas),
      },
    ],
    contractNumber: input.pagamento.contractNumber,
  };
}

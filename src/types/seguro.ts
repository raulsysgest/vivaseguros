export type TipoSeguro = "auto" | "vida" | "residencial" | "saude" | "empresarial";

export interface CotacaoRequest {
  tipo: TipoSeguro;
  nomeCliente: string;
  cpf: string;
  email: string;
  telefone: string;
  dadosEspecificos?: Record<string, unknown>;
}

export interface CotacaoResponse {
  id: string;
  tipo: TipoSeguro;
  valorMensal: number;
  valorAnual: number;
  coberturas: string[];
  vigenciaDias: number;
  status: "pendente" | "aprovada" | "expirada";
}

export interface Apolice {
  id: string;
  numero: string;
  tipo: TipoSeguro;
  titular: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: "ativa" | "cancelada" | "renovada";
  premio: number;
}

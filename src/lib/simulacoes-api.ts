import type { SimulacaoItem, SimulacaoTipo } from "@/lib/simulacoes-types";

export type ApiSimulation = {
  id: number;
  name_insurance?: string | null;
  type?: string | null;
  price?: number | null;
  phone?: number | string | null;
  insurance_holder_type?: string | null;
  id_simulation_API?: string | number | null;
  id_contract_API?: string | number | null;
  created_at?: string | null;
  cliente?: { name?: string | null; nif?: string | null } | null;
  details?: {
    origin?: string | null;
    destiny?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    adults?: number | null;
    childrens?: number | null;
    mark?: string | null;
    model?: string | null;
    full_name?: string | null;
  } | null;
  creator?: {
    channel?: { name?: string | null } | null;
    unit?: { name?: string | null } | null;
  } | null;
};

export type SimulacoesListResponse = {
  data: ApiSimulation[];
  pagination?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
};

function mapApiTipo(type?: string | null): SimulacaoTipo {
  switch (type) {
    case "TRIP":
      return "viagem";
    case "AUTO":
      return "automovel";
    case "COMFORT":
      return "conforto";
    default:
      return "viagem";
  }
}

function formatApiCreatedAt(createdAt?: string | null): string {
  if (!createdAt) return "—";
  const normalized = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return createdAt;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} | ${hours}:${minutes}:${seconds}`;
}

export function mapApiSimulationToItem(row: ApiSimulation): SimulacaoItem {
  const tipo = mapApiTipo(row.type);
  const details = row.details ?? undefined;

  const item: SimulacaoItem = {
    id: String(row.id),
    tipo,
    tipoNome: row.name_insurance?.trim() || "Simulação",
    preco: Number(row.price ?? 0),
    clienteNome: row.cliente?.name?.trim() || "—",
    nif: row.cliente?.nif?.trim() || "—",
    contacto: row.phone != null && row.phone !== "" ? String(row.phone) : "—",
    dataHora: formatApiCreatedAt(row.created_at),
    canal: row.creator?.channel?.name?.trim() || "—",
    unidade: row.creator?.unit?.name?.trim() || "—",
    status: "Pendente",
    idContractApi:
      row.id_contract_API != null && row.id_contract_API !== ""
        ? String(row.id_contract_API)
        : null,
    idSimulationApi:
      row.id_simulation_API != null && row.id_simulation_API !== ""
        ? String(row.id_simulation_API)
        : null,
  };

  if (tipo === "viagem") {
    if (details) {
      item.viagemRota = {
        origin: details.origin?.trim() || "",
        destiny: details.destiny?.trim() || "",
        start_date: details.start_date?.trim() || "",
        end_date: details.end_date?.trim() || "",
      };
    }
    const tomadorRaw = (row.insurance_holder_type ?? "").trim().toLowerCase();
    const tomadorTipo =
      tomadorRaw === "empresa"
        ? "empresa"
        : tomadorRaw === "particular"
          ? "particular"
          : null;
    item.viagemMeta = {
      adults: Number(details?.adults ?? 1) || 1,
      childrens: Number(details?.childrens ?? 0) || 0,
      tomadorTipo,
      idSimulationApi: item.idSimulationApi,
      idContractApi: item.idContractApi,
    };
  }

  return item;
}

export function uiTipoToApiFilter(tipo: string): string | undefined {
  switch (tipo) {
    case "viagem":
      return "TRIP";
    case "automovel":
      return "AUTO";
    case "conforto":
      return "COMFORT";
    default:
      return undefined;
  }
}

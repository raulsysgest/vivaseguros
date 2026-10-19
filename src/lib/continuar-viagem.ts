import {
  VIAGEM_DESTINOS,
  VIAGEM_ORIGENS,
  VIAGEM_ADULTOS_OPCOES,
} from "@/constants/viagem-destinos";
import type { ViagemFormValues } from "@/components/simulacoes/formulario-viagem";
import type { NifContribuinte } from "@/types/nif";
import type { SimulacaoItem } from "@/lib/simulacoes-types";
import type { TomadorTipo } from "@/components/simulacoes/modal-preco-viagem";

export type ContinuarViagemDraft = {
  simulationId: string;
  values: ViagemFormValues;
  contribuinte: NifContribuinte;
  tomadorTipo: TomadorTipo | null;
};

function normalizeMatchKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function resolveOrigemValue(stored?: string): string {
  const key = normalizeMatchKey(stored || "ANGOLA");
  const found = VIAGEM_ORIGENS.find(
    (o) =>
      normalizeMatchKey(o.value) === key || normalizeMatchKey(o.label) === key,
  );
  return found?.value ?? "ANGOLA";
}

function resolveDestinoValue(stored?: string): string {
  if (!stored?.trim()) return "selecionar";
  const key = normalizeMatchKey(stored);
  const found = VIAGEM_DESTINOS.find(
    (d) =>
      normalizeMatchKey(d.value) === key || normalizeMatchKey(d.label) === key,
  );
  return found?.value ?? stored.trim();
}

function adultsToSelectValue(adults: number): string {
  const n = Math.max(1, Math.min(10, adults || 1));
  const s = String(n);
  return (VIAGEM_ADULTOS_OPCOES as readonly string[]).includes(s) ? s : "1";
}

function childrensToSelectValue(childrens: number): string {
  const n = Math.max(0, Math.min(10, childrens ?? 0));
  return String(n);
}

function parseTomador(raw?: string | null): TomadorTipo | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "empresa") return "empresa";
  if (t === "particular") return "particular";
  return null;
}

export function simulacaoItemToContinuarViagem(
  item: SimulacaoItem,
): ContinuarViagemDraft | null {
  if (item.tipo !== "viagem") return null;

  const rota = item.viagemRota;
  const meta = item.viagemMeta;
  const det = item.detalhesViagem;

  const origin = resolveOrigemValue(det?.origin ?? rota?.origin);
  const destiny = resolveDestinoValue(det?.destiny ?? rota?.destiny);
  const nif = (item.nif && item.nif !== "—" ? item.nif : det?.nif)?.trim() ?? "";
  if (!nif) return null;

  const values: ViagemFormValues = {
    origem: origin,
    destino: destiny,
    dataInicio: det?.start_date ?? rota?.start_date ?? "",
    dataFim: det?.end_date ?? rota?.end_date ?? "",
    adultos: adultsToSelectValue(det?.adults ?? meta?.adults ?? 1),
    criancas: childrensToSelectValue(det?.childrens ?? meta?.childrens ?? 0),
    nif,
    telefone:
      item.contacto && item.contacto !== "—"
        ? item.contacto
        : (det?.phone?.trim() ?? ""),
  };

  const contribuinte: NifContribuinte = {
    valid: true,
    nif,
    nome: item.clienteNome !== "—" ? item.clienteNome : det?.client_name ?? null,
    sexo: det?.client_gender ?? null,
    numeroDocumento: det?.client_bi?.trim() || null,
  };

  return {
    simulationId: item.id,
    values,
    contribuinte,
    tomadorTipo: parseTomador(det?.insurance_holder_type ?? meta?.tomadorTipo),
  };
}

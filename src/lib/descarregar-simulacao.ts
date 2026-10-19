import { clientFetch, type ClientFetchError } from "@/lib/client-api";
import type { SimulacaoItem } from "@/lib/simulacoes-types";

export function vivaIdParaDownloadSimulacao(item: SimulacaoItem): string | null {
  const id = item.idContractApi ?? item.idSimulationApi;
  if (!id || id === "null" || id === "undefined") return null;
  return id;
}

type DownloadSimulacaoResponse = {
  success?: boolean;
  pdf?: string;
  filename?: string;
  error?: string;
};

export async function descarregarSimulacaoPdf(item: SimulacaoItem): Promise<void> {
  const contractId = vivaIdParaDownloadSimulacao(item);
  if (!contractId) {
    throw new Error(
      "Esta simulação não tem ID Viva associado. Guarde novamente a simulação.",
    );
  }

  const res = await clientFetch<DownloadSimulacaoResponse>(
    `/api/simulations/download/${encodeURIComponent(contractId)}`,
  );

  if (!res.success || !res.pdf) {
    throw new Error(res.error || "Não foi possível descarregar o documento.");
  }

  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${res.pdf}`;
  link.download = res.filename || `simulacao_${contractId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function mensagemErroDescarregarSimulacao(error: unknown): string {
  const err = error as ClientFetchError;
  const payload = err.data as { message?: string; error?: string } | undefined;
  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;
  if (error instanceof Error) return error.message;
  return "Erro ao descarregar a simulação.";
}

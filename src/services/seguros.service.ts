import { api } from "@/lib/api";
import { Apolice, CotacaoRequest, CotacaoResponse } from "@/types/seguro";

/**
 * Camada de serviço de seguros executada no servidor Next.js.
 * Comunica-se com o backend externo (Laravel / API REST) via Axios (lib/api.ts).
 */
export const segurosService = {
  /**
   * Envia dados de cotação para o backend externo
   */
  async criarCotacao(payload: CotacaoRequest): Promise<CotacaoResponse> {
    const response = await api.post<CotacaoResponse>("/cotacoes", payload);
    return response.data;
  },

  /**
   * Lista as apólices do usuário autenticado
   */
  async listarApolices(token: string): Promise<Apolice[]> {
    const response = await api.get<Apolice[]>("/apolices", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

import { NextRequest, NextResponse } from "next/server";
import { segurosService } from "@/services/seguros.service";
import { CotacaoRequest } from "@/types/seguro";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CotacaoRequest;

    if (!body.tipo || !body.nomeCliente || !body.cpf) {
      return NextResponse.json(
        { message: "Campos obrigatórios ausentes (tipo, nomeCliente, cpf)" },
        { status: 400 }
      );
    }

    const cotacao = await segurosService.criarCotacao(body);

    return NextResponse.json({
      success: true,
      data: cotacao,
    });
  } catch (error: unknown) {
    const err = error as { status?: number; response?: { status?: number; data?: unknown }; data?: unknown };
    const status = err.status || err.response?.status || 500;
    const errorData =
      err.data || err.response?.data || { message: "Erro ao processar cotação no backend" };

    return NextResponse.json(errorData, { status });
  }
}

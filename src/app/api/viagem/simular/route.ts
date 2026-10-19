import { NextRequest, NextResponse } from "next/server";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";
import type { ViagemSimulacaoRequest } from "@/types/viagem-simulacao";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ViagemSimulacaoRequest;

    if (
      !body.checkin ||
      !body.checkout ||
      !body.plano ||
      !body.destino ||
      !Array.isArray(body.passageiros) ||
      body.passageiros.length < 1
    ) {
      return NextResponse.json(
        { message: "Campos obrigatórios em falta para simular viagem" },
        { status: 422 },
      );
    }

    const api = await getAuthedApi();
    const { data, status } = await api.post("/viva/simulate/trip", {
      origem: body.origem,
      destino: body.destino,
      checkin: body.checkin,
      checkout: body.checkout,
      plano: body.plano,
      multiplos: body.multiplos,
      passageiros: body.passageiros,
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { message: "Não foi possível simular o seguro de viagem" },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";

type RouteContext = { params: Promise<{ idContract: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { idContract } = await context.params;
    const api = await getAuthedApi();
    const { data, status } = await api.get(
      `/proposals/download-simulation/${encodeURIComponent(idContract)}`,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { message: "Não foi possível descarregar a simulação" },
      { status: 502 },
    );
  }
}

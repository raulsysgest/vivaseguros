import { NextRequest, NextResponse } from "next/server";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ nif: string }> },
) {
  const { nif: rawNif } = await context.params;
  const nif = decodeURIComponent(rawNif ?? "").trim();

  if (!nif) {
    return NextResponse.json(
      { valid: false, message: "Indique o NIF" },
      { status: 422 },
    );
  }

  try {
    const api = await getAuthedApi();
    const { data, status } = await api.get(`/simulations/nif/${encodeURIComponent(nif)}`);
    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { valid: false, message: "Não foi possível validar o NIF" },
      { status: 502 },
    );
  }
}

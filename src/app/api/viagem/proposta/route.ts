import { NextRequest, NextResponse } from "next/server";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const api = await getAuthedApi();
    const { data, status } = await api.post("/viva/proposal", body);
    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { message: "Não foi possível criar a proposta" },
      { status: 502 },
    );
  }
}

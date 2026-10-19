import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";

async function agentIdFromSession(): Promise<string | null> {
  const reqHeaders = await headers();
  const jwt = await getToken({
    req: { headers: Object.fromEntries(reqHeaders.entries()) },
    secret: process.env.AUTH_SECRET,
  });
  const id = jwt?.id ?? jwt?.sub;
  return id != null ? String(id) : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const agentId = await agentIdFromSession();
    if (!agentId) {
      return NextResponse.json({ message: "Sessão inválida" }, { status: 401 });
    }

    const payload = {
      ...body,
      id_agent: body.id_agent ?? Number(agentId),
    };

    const api = await getAuthedApi();
    const { data, status } = await api.post("/proposals", payload);

    return NextResponse.json(data, { status });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { message: "Não foi possível guardar a proposta" },
      { status: 502 },
    );
  }
}

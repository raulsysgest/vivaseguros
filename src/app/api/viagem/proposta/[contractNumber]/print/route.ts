import { NextRequest, NextResponse } from "next/server";
import { getAuthedApi, ApiUnauthorizedError } from "@/lib/api";
import { isAxiosError } from "axios";

type RouteContext = { params: Promise<{ contractNumber: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { contractNumber } = await context.params;
    const api = await getAuthedApi();
    const response = await api.get(
      `/viva/proposal/${encodeURIComponent(contractNumber)}/print-download`,
      { responseType: "arraybuffer" },
    );

    const contentType =
      (response.headers["content-type"] as string | undefined) || "application/pdf";

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="proposta-${contractNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiUnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (isAxiosError(error) && error.response) {
      const status = error.response.status;
      if (error.response.data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(error.response.data);
        try {
          const json = JSON.parse(text) as { message?: string };
          return NextResponse.json(
            { message: json.message || "Erro ao descarregar proposta" },
            { status },
          );
        } catch {
          return NextResponse.json({ message: "Erro ao descarregar proposta" }, { status });
        }
      }
      return NextResponse.json(error.response.data, { status });
    }
    return NextResponse.json(
      { message: "Não foi possível descarregar a proposta" },
      { status: 502 },
    );
  }
}

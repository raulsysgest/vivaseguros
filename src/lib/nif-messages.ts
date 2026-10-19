/** Mensagens conhecidas do MINFIN (muitas vêm sem acentos). */
export function normalizeNifValidationMessage(message: string | undefined | null): string {
  if (!message || !message.trim()) {
    return "Este NIF não existe no sistema, por favor verifique!";
  }

  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("nao ha dados para o filtro informado")) {
    return "Não há dados para o filtro informado.";
  }

  return trimmed;
}

/**
 * Formata um valor numérico para Real Brasileiro (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata valor monetário para Kwanza de Angola (Kz)
 */
export function formatKwanza(value: number): string {
  return `${value.toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Kz`;
}

/**
 * Formata string de CPF (ex: 000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata string de telefone (celular com 9 dígitos ou fixo)
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

/**
 * Formata string de CEP (ex: 00000-000)
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  return clean.replace(/(\d{5})(\d{3})/, "$1-$2");
}

/**
 * Formata data ISO para pt-BR
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  } catch {
    return dateString;
  }
}

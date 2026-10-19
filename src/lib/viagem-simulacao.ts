import type { PassageiroViagemApi, ViagemSimulacaoRequest } from "@/types/viagem-simulacao";
import type { ViagemFormSubmitData } from "@/components/simulacoes/formulario-viagem";

function normalizeGender(sexo?: string | null): string {
  const s = (sexo ?? "M").trim().toUpperCase();
  if (s.startsWith("F")) return "F";
  return "M";
}

export function parseViagemChildrenCount(criancas: string): number {
  if (!criancas || criancas === "SELECIONAR") return 0;
  if (criancas.includes("+")) return 4;
  const n = parseInt(criancas, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function buildPassageirosFromForm(data: ViagemFormSubmitData): PassageiroViagemApi[] {
  const adults = parseInt(data.adultos, 10);
  const children = parseViagemChildrenCount(data.criancas);
  const passageiros: PassageiroViagemApi[] = [];

  const primaryBi = data.clienteBi?.trim() || "818728487";
  const primaryName = data.clienteNome?.trim() || "Passageiro";
  const primaryGender = normalizeGender(data.clienteSexo);

  for (let i = 0; i < adults; i++) {
    passageiros.push({
      NAME: primaryName,
      BI: primaryBi,
      PASSPORT: "",
      GENDER: primaryGender,
      BIRTHDATE: "1980-02-01 00:00:00",
    });
  }

  for (let i = 0; i < children; i++) {
    passageiros.push({
      NAME: "",
      BI: "",
      PASSPORT: "",
      GENDER: "",
      BIRTHDATE: "",
    });
  }

  return passageiros;
}

export type PassageiroViagemFormSeed = {
  /** NIF / documento validado no MINFIN (campo BI na API Viva). */
  bi: string;
  nomeCompleto: string;
  passaporte: string;
  genero: string;
  dataNascimento: string;
  nomeGeneroBloqueados: boolean;
  nifValidado: boolean;
  /** Passageiro estrangeiro: preenchimento manual, sem validação de NIF. */
  estrangeiro: boolean;
};

export type TomadorParaPassageiroSeed = {
  nif: string;
  nomeCompleto: string;
  bi: string;
  numeroDocumento: string;
  genero: string;
  dataNascimento: string;
};

function birthdateApiToInput(birth: string): string {
  const part = birth.trim().split(/\s+/)[0] ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : "";
}

/** Passaporte só se for valor real (não placeholder nem igual ao NIF/BI). */
export function passaporteParaFormulario(
  passaporte?: string | null,
  docIdentidade?: string | null,
): string {
  const p = (passaporte ?? "").trim();
  if (!p) return "";
  const doc = (docIdentidade ?? "").trim();
  if (doc && p === doc) return "";
  if (/^0+$/.test(p) || p === "P123456") return "";
  return p;
}

export function generoDeViagemCliente(sexo?: string | null): string {
  return normalizeGender(sexo);
}

/** M/F a partir do tomador ou do sexo validado na viagem (ignora «O» genérico do tomador). */
export function generoPassageiroPrefill(
  tomadorGenero?: string | null,
  sexoViagem?: string | null,
): string {
  const t = (tomadorGenero ?? "").trim().toUpperCase();
  if (t === "M" || t === "F") return t;
  return generoDeViagemCliente(sexoViagem);
}

/** Dados iniciais do formulário de passageiros (simulação + tomador). */
export function buildPassageirosFormSeeds(
  viagem: ViagemFormSubmitData,
  tomador: TomadorParaPassageiroSeed,
): PassageiroViagemFormSeed[] {
  const api = buildPassageirosFromForm(viagem);
  const nifViagemValidado = viagem.nif.trim();
  const generoCliente = generoDeViagemCliente(viagem.clienteSexo);
  const rows: PassageiroViagemFormSeed[] = api.map((p, index) => {
    const bi = p.BI?.trim() ?? "";
    return {
      bi,
      nomeCompleto: p.NAME?.trim() ?? "",
      passaporte: passaporteParaFormulario(p.PASSPORT, bi),
      genero: p.GENDER?.trim() || (index === 0 ? generoCliente : ""),
      dataNascimento: birthdateApiToInput(p.BIRTHDATE),
      nomeGeneroBloqueados: false,
      nifValidado: false,
      estrangeiro: false,
    };
  });

  if (rows.length > 0) {
    const doc = tomador.numeroDocumento.trim();
    const nifTomador = tomador.nif.trim();
    const biTomador =
      tomador.bi.trim() || nifTomador || nifViagemValidado || doc;
    const nomeTomador = tomador.nomeCompleto.trim();
    const validadoTomador = Boolean(biTomador && nomeTomador);
    rows[0] = {
      ...rows[0],
      bi: biTomador,
      nomeCompleto: nomeTomador || rows[0].nomeCompleto,
      passaporte: passaporteParaFormulario(undefined, biTomador),
      genero: generoPassageiroPrefill(tomador.genero, viagem.clienteSexo) || rows[0].genero,
      dataNascimento: tomador.dataNascimento.trim() || rows[0].dataNascimento,
      nomeGeneroBloqueados: validadoTomador,
      nifValidado: validadoTomador,
      estrangeiro: false,
    };
  }

  return rows;
}

export function buildViagemSimulacaoPayload(data: ViagemFormSubmitData): ViagemSimulacaoRequest {
  const passageiros = buildPassageirosFromForm(data);
  return {
    origem: data.origemCountryCode,
    destino: data.destinoCountryCode,
    checkin: data.dataInicio,
    checkout: data.dataFim,
    plano: data.plano,
    multiplos: passageiros.length > 1,
    passageiros,
  };
}

export type GuardarSimulacaoViagemPayload = {
  type: "TRIP";
  name_insurance: string;
  insurance_holder_type: "empresa" | "particular";
  origin: string;
  destiny: string;
  start_date: string;
  end_date: string;
  adults: number;
  childrens: number;
  plan: string;
  origin_country_code: string;
  destination_country_code: string;
  price: number;
  installment: string;
  phone: string;
  nif: string;
  client_name: string;
  client_bi: string;
  client_gender: string;
  id_simulation_API: string | number | null;
  id_contract_API: string | number | null;
  skip_viva_resimulate: boolean;
};

export function buildGuardarSimulacaoViagemPayload(input: {
  form: ViagemFormSubmitData;
  tomadorTipo: "empresa" | "particular";
  preco: number;
  nameInsurance: string;
  simApi: { idSimulationTel?: number | string; idContract?: number | string } | null;
}): GuardarSimulacaoViagemPayload {
  const idSimulationTel = input.simApi?.idSimulationTel ?? null;
  const idContract = input.simApi?.idContract ?? idSimulationTel;

  return {
    type: "TRIP",
    name_insurance: input.nameInsurance,
    insurance_holder_type: input.tomadorTipo,
    origin: input.form.origem,
    destiny: input.form.destino,
    start_date: input.form.dataInicio,
    end_date: input.form.dataFim,
    adults: parseInt(input.form.adultos, 10) || 1,
    childrens: parseViagemChildrenCount(input.form.criancas),
    plan: input.form.plano,
    origin_country_code: input.form.origemCountryCode,
    destination_country_code: input.form.destinoCountryCode,
    price: input.preco,
    installment: "U",
    phone: input.form.telefone.trim(),
    nif: input.form.nif.trim(),
    client_name: input.form.clienteNome.trim(),
    client_bi: input.form.clienteBi.trim(),
    client_gender: input.form.clienteSexo.trim(),
    id_simulation_API: idSimulationTel,
    id_contract_API: idContract,
    skip_viva_resimulate: Boolean(idSimulationTel),
  };
}

export function formatPrecoViagemAOA(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "AOA —";
  const formatted = new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `AOA ${formatted}`;
}

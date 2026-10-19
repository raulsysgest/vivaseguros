export type PassageiroViagemApi = {
  NAME: string;
  BI: string;
  PASSPORT: string;
  GENDER: string;
  BIRTHDATE: string;
};

export type ViagemSimulacaoRequest = {
  origem: string;
  destino: string;
  checkin: string;
  checkout: string;
  plano: string;
  multiplos: boolean;
  passageiros: PassageiroViagemApi[];
};

export type ViagemSimulacaoApiData = {
  installmentValues?: { U?: number };
  idSimulationTel?: number | string;
  idContract?: number | string;
  hasError?: boolean;
  error?: string | null;
};

export type ViagemSimulacaoResponse = {
  success: true;
  data: ViagemSimulacaoApiData;
};

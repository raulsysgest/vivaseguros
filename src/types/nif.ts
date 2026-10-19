export interface NifContribuinte {
  valid: true;
  nif: string;
  nome: string | null;
  sexo: string | null;
  numeroDocumento: string | null;
}

export interface NifValidationError {
  valid: false;
  message: string;
}

export type NifValidationResponse = NifContribuinte | NifValidationError;

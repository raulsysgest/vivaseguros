import fs from "fs";
import path from "path";

const htmlPath = "C:/xampp/htdocs/onlineinsurance/TESTNEW/index.html";
const outPath = path.join(process.cwd(), "src/constants/viagem-destinos.ts");

const html = fs.readFileSync(htmlPath, "utf8");
const destMatch = html.match(/id="destino"[^>]*>([\s\S]*?)<\/select>/);
if (!destMatch) throw new Error("destino select not found");

const opts = [...destMatch[1].matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/g)];
const destinations = opts.map((m) => {
  const attrs = m[1];
  const label = m[2].replace(/\s+/g, " ").trim();
  const valueMatch = attrs.match(/value=['"]([^'"]*)['"]/);
  const value = valueMatch ? valueMatch[1] : label;
  const countryCodeMatch = attrs.match(/data-country-code=['"]([^'"]*)['"]/);
  const planMatch = attrs.match(/data-plan=['"]([^'"]*)['"]/);
  return {
    value,
    label,
    countryCode: countryCodeMatch ? countryCodeMatch[1] : "",
    plan: planMatch ? planMatch[1] : "",
  };
});

const origins = [
  { value: "ANGOLA", label: "ANGOLA", countryCode: "AO" },
];

const adultOptions = ["SELECIONAR", ...Array.from({ length: 10 }, (_, i) => String(i + 1))];
const childrenOptions = [
  { value: "SELECIONAR", label: "SELECIONAR" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })),
];

const file = `/** Gerado a partir de onlineinsurance/TESTNEW/index.html (fluxo agentes) */
export type ViagemDestino = {
  value: string;
  label: string;
  countryCode: string;
  plan: string;
};

export const VIAGEM_ORIGENS = ${JSON.stringify(origins, null, 2)} as const;

export const VIAGEM_DESTINOS: ViagemDestino[] = ${JSON.stringify(destinations, null, 2)};

export const VIAGEM_ADULTOS_OPCOES = ${JSON.stringify(adultOptions, null, 2)} as const;

export const VIAGEM_CRIANCAS_OPCOES = ${JSON.stringify(childrenOptions, null, 2)} as const;
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, file, "utf8");
console.log("Wrote", outPath, "destinations:", destinations.length);

/**
 * GERADO POR `scripts/persona_arte_manifesto.mjs` — não edite à mão.
 *
 * Cada entrada é o nome do arquivo (sem `.webp`) em
 * `public/portal/persona/opts/`, no formato `<campo-slug>-<valor-slug>`
 * produzido por `artePreset()`. Serve para o ladrilho só pedir imagem que
 * existe de verdade.
 */
export const ARTE_PRESET = new Set<string>([
  "contentTypes-anuncios",
  "contentTypes-artigos",
  "contentTypes-newsletter",
  "contentTypes-posts",
  "contentTypes-reels",
  "contentTypes-stories",
  "experienceLevel-advanced",
  "experienceLevel-beginner",
  "experienceLevel-intermediate",
  "identidade-marca-ainda-estou-escolhendo-o-nome",
  "identidade-marca-tenho-um-nome-de-empresa",
  "identidade-papel-atendo-pacientes-clientes-e-quero-preencher-a-ag",
  "identidade-papel-consultoria-para-empresas-do-meu-setor",
  "identidade-papel-ensino-o-que-aprendi-na-pratica-para-quem-esta-c",
  "identidade-papel-presto-servico-para-pequenos-negocios-da-minha-c",
  "identidade-papel-sou-autonomo-e-faco-tudo-sozinho-no-meu-negocio",
  "identidade-papel-tenho-loja-fisica-e-quero-vender-tambem-no-digit",
  "identidade-papel-trabalho-em-empresa-e-quero-me-destacar-com-ia",
  "identidade-papel-vendo-produtos-proprios-pela-internet",
  "industry-art",
  "industry-consulting",
  "industry-education",
  "industry-entertainment",
  "industry-finance",
  "industry-marketing",
  "industry-retail",
  "industry-tech",
  "marketingGoals-authority",
  "marketingGoals-automate",
  "marketingGoals-community",
  "marketingGoals-content-scale",
  "marketingGoals-education",
  "marketingGoals-personal-brand",
  "marketingGoals-sales",
  "toneOfVoice-descontraido",
  "toneOfVoice-direto",
  "toneOfVoice-educativo",
  "toneOfVoice-inspirador",
  "toneOfVoice-profissional",
  "toneOfVoice-provocador"
]);

/** `true` quando existe arte no disco para esta opção. */
export function temArtePreset(campo: string, valor: string | number): boolean {
  return ARTE_PRESET.has(nomeArte(campo, valor));
}

import { campoSlug, valorSlug } from './persona-presets';

function nomeArte(campo: string, valor: string | number): string {
  return `${campoSlug(campo)}-${valorSlug(valor)}`;
}

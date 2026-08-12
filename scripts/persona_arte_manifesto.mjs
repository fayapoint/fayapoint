/**
 * Varre `public/portal/persona/opts/` e escreve `src/lib/persona-arte.ts`.
 *
 * ## Por que gerar em vez de manter uma lista à mão
 *
 * A arte dos presets chega em LOTES (o Higgsfield grátis gera uma por vez), e
 * a lista manual `CAMPOS_COM_ARTE` obrigava a lembrar de editar código a cada
 * lote. Esquecer tem dois preços simétricos: ou o ladrilho pede uma imagem que
 * não existe e enche o console de 404, ou a imagem existe no disco e ninguém a
 * vê. As duas falhas são silenciosas.
 *
 * O manifesto é por ARQUIVO, não por campo — granularidade certa, porque um
 * campo com 14 opções normalmente atravessa dois ou três lotes.
 *
 *   node scripts/persona_arte_manifesto.mjs
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pasta = join(raiz, 'public', 'portal', 'persona', 'opts');

const nomes = readdirSync(pasta)
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.slice(0, -'.webp'.length))
  .sort();

const saida = `/**
 * GERADO POR \`scripts/persona_arte_manifesto.mjs\` — não edite à mão.
 *
 * Cada entrada é o nome do arquivo (sem \`.webp\`) em
 * \`public/portal/persona/opts/\`, no formato \`<campo-slug>-<valor-slug>\`
 * produzido por \`artePreset()\`. Serve para o ladrilho só pedir imagem que
 * existe de verdade.
 */
export const ARTE_PRESET = new Set<string>(${JSON.stringify(nomes, null, 2)});

/** \`true\` quando existe arte no disco para esta opção. */
export function temArtePreset(campo: string, valor: string | number): boolean {
  return ARTE_PRESET.has(nomeArte(campo, valor));
}

import { campoSlug, valorSlug } from './persona-presets';

function nomeArte(campo: string, valor: string | number): string {
  return \`\${campoSlug(campo)}-\${valorSlug(valor)}\`;
}
`;

writeFileSync(join(raiz, 'src', 'lib', 'persona-arte.ts'), saida);
console.log(`persona-arte.ts: ${nomes.length} artes`);

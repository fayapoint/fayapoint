import dados from "@/data/estilos.json";

/**
 * O Atlas de Estilos (`/estilos`): a lista vive em `src/data/estilos.json`.
 *
 * É JSON, e não TypeScript, porque dois lados a leem: a página e
 * `scripts/estilos/gerar.mjs`, que gera a imagem de exemplo de cada estilo no
 * ComfyUI local. O prompt que o visitante copia é o mesmo que gerou o exemplo
 * — se morassem em arquivos separados, um dia a imagem mentiria sobre o prompt.
 */
export type Estilo = {
  id: string;
  /** Nome que aparece no cartão. */
  n: string;
  /** Família (chave de `FAMILIAS`). */
  f: string;
  /** Uma linha em português. */
  d: string;
  /** O estilo, em inglês — a língua que os geradores leem melhor. */
  p: string;
  /** Assunto do exemplo gerado. */
  ex: string;
  /** Apelidos de busca: "ghibli", "van gogh", "lego". */
  al?: string;
  /** Só na família de câmera: qual movimento o exemplo encena. */
  mov?: string;
  /** Posição na curadoria, enquanto o estilo ainda não tem cópias. */
  top?: number;
};

export const ESTILOS = dados.estilos as Estilo[];
export const FAMILIAS = dados.familias as [string, string][];
export const SEM_LETRAS = dados.semLetras;
export const MODELO_DOS_EXEMPLOS = dados.modelo;
export const IDS_DE_ESTILO = new Set(ESTILOS.map((e) => e.id));

/**
 * O prompt que vai para a área de transferência.
 *
 * ⚠️ Mesma conta de `scripts/estilos/gerar.mjs`: assunto primeiro, estilo
 * depois. Prompt em forma de frase (termina em ponto) emenda com ". ", lista
 * de descritores emenda com ", ".
 *
 * A regra de letras é imperativa de propósito: `no text` sozinho o gerador
 * ignora, e texto queimado no pixel não se corrige depois.
 */
export function montarPrompt(estilo: Estilo, assunto: string, semLetras: boolean): string {
  const a = assunto.trim().replace(/[.,;\s]+$/, "");
  let p = estilo.p;
  if (a) p = `${a}${p.endsWith(".") ? ". " : ", "}${p}`;
  if (semLetras && !/no text|zero written|no readable text/i.test(p)) {
    p += `${p.endsWith(".") ? " " : ". "}${SEM_LETRAS}`;
  }
  return p;
}

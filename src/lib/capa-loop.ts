/**
 * Quais cursos têm capa animada, e onde o arquivo mora.
 *
 * Os loops saíram do Higgsfield (Seedance Pro Fast, 5s, mudo) a partir da MESMA
 * imagem que virou a capa estática do curso — a luz varre o couro, o título
 * gravado acende e apaga, e o livro não se mexe. Nada mais: animar o livro faria
 * o modelo reescrever o título.
 *
 * ⚠️ O nome do arquivo NÃO é o slug. Os vídeos foram batizados pelo assunto na
 * noite da geração ("claude", "n8n"), e o slug do curso é outro
 * ("claude-ia-segura", "n8n-automacao-avancada"). Este mapa é a tradução — sem
 * ele o `<video>` aponta para um 404 silencioso, que não quebra a página e por
 * isso passa despercebido.
 *
 * ⚠️ Os loops são QUADRADOS (960×960) e a capa é RETRATO (720×1040). Quem for
 * exibir os dois no mesmo lugar precisa de `object-contain` no vídeo, nunca
 * `object-cover`: a capa estática já foi montada com a arte quadrada na largura
 * cheia e tarja borrada em cima e embaixo, então o vídeo em `contain` cai
 * exatamente por cima do seu próprio quadro. Com `cover` o vídeo cresceria 44% e
 * decaparia o título dourado no hover — o defeito que a capa estática evita.
 */
const LOOPS: Record<string, string> = {
  "automacao-n8n": "automacao-n8n",
  "autoresearch-singularity": "autoresearch-singularity",
  "banana-dev-deploy-ia": "banana-dev",
  "chatgpt-zero": "chatgpt-zero",
  "claude-ia-segura": "claude",
  "ia-no-whatsapp": "ia-no-whatsapp",
  "ia-sem-filtro-por-claude": "ia-sem-filtro",
  "n8n-automacao-avancada": "n8n",
};

export type CapaLoop = { video: string; poster: string };

/** `null` para os cursos que ainda não têm loop — a capa estática basta. */
export function loopDaCapa(slug: string): CapaLoop | null {
  const base = LOOPS[slug];
  if (!base) return null;
  return {
    video: `/cursos/capa-loop/${base}.webm`,
    poster: `/cursos/capa-loop/${base}.webp`,
  };
}

export function temLoopDeCapa(slug: string): boolean {
  return slug in LOOPS;
}

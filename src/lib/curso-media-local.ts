import manifesto from "@/data/curso-media-local.json";

/**
 * A arte por capítulo que mora no repositório, no formato que o leitor já lê.
 *
 * Seis cursos vinham com **1.474 arquivos** de ilustração em
 * `public/cursos/media/` — abertura de capítulo e seis cenas por capítulo, duas
 * delas animadas — e **nenhuma linha de código apontava para essa pasta**. Ia no
 * deploy, ocupava 113 MB e nunca aparecia para ninguém.
 *
 * O leitor já sabia desenhar tudo isso: `ChapterMediaHeader` renderiza herói,
 * vídeo e galeria. O que faltava era alguém entregar os dados. Esta camada
 * converte o manifesto de disco no mesmo formato que a rota
 * `/api/courses/<slug>/media` devolve, e o leitor funde os dois — o banco manda
 * quando tem, o disco preenche o resto.
 *
 * ⚠️ O manifesto é gerado por `scripts/gerar-manifesto-media.mjs` e precisa ser
 * regerado quando entrar arte nova. Não dá para varrer o disco em produção: na
 * Netlify o `public/` é servido pela CDN e a função serverless não enxerga esses
 * arquivos.
 */

type PapelDeCena = { imagem?: boolean; loop?: boolean };
type CapituloNoDisco = { abertura?: string; papeis: Record<string, PapelDeCena> };
type Manifesto = Record<string, Record<string, CapituloNoDisco>>;

export type CenaLocal = {
  url: string;
  /** O mesmo quadro animado, quando existe — toca no hover, custa nada antes. */
  loop?: string;
  caption?: string;
};

export type MediaLocal = {
  heroImage?: { url: string; caption?: string; source: "local" };
  gallery?: CenaLocal[];
};

/**
 * A ordem é narrativa, não alfabética: a cena, o que se quer, como funciona, o
 * caminho, o atalho e a conferência. É a sequência em que o capítulo pensa.
 */
const ORDEM: string[] = [
  "cenario",
  "intencao",
  "sistema",
  "fluxo",
  "dica",
  "checklist",
  "planos",
  "validacao",
];

const LEGENDA: Record<string, string> = {
  cenario: "O cenário",
  intencao: "A intenção",
  sistema: "Como funciona por dentro",
  fluxo: "O caminho, passo a passo",
  dica: "O atalho que poupa tempo",
  checklist: "Antes de seguir",
  planos: "As opções",
  validacao: "Como saber que deu certo",
};

const MAPA = manifesto as unknown as Manifesto;

export function cursoTemMediaLocal(slug: string): boolean {
  return Boolean(MAPA[slug]);
}

/**
 * `Record<índice 0-based, mídia>` — a mesma chave que o leitor usa em
 * `mediaByIndex`, para as duas fontes caírem no mesmo mapa.
 */
export function mediaLocalDoCurso(slug: string): Record<string, MediaLocal> {
  const doCurso = MAPA[slug];
  if (!doCurso) return {};

  const saida: Record<string, MediaLocal> = {};
  const base = `/cursos/media/${slug}`;

  for (const [numero, cap] of Object.entries(doCurso)) {
    const n = Number(numero);
    if (!Number.isFinite(n)) continue;
    const nn = String(n).padStart(2, "0");

    const cenas: CenaLocal[] = [];
    for (const papel of ORDEM) {
      const p = cap.papeis[papel];
      if (!p?.imagem) continue;
      cenas.push({
        url: `${base}/inline/cap${nn}-${papel}.webp`,
        ...(p.loop ? { loop: `${base}/inline/cap${nn}-${papel}.webm` } : {}),
        caption: LEGENDA[papel] || undefined,
      });
    }

    // A abertura é a primeira cena quando não há um `cap-NN.webp` dedicado —
    // só um curso tem esse arquivo, e sem esta linha os outros cinco abririam
    // o capítulo sem imagem nenhuma.
    const aberturaDedicada = cap.abertura ? `${base}/${cap.abertura}` : null;
    const heroUrl = aberturaDedicada || cenas[0]?.url;
    if (!heroUrl) continue;

    saida[String(n - 1)] = {
      heroImage: { url: heroUrl, source: "local" },
      gallery: aberturaDedicada ? cenas : cenas.slice(1),
    };
  }

  return saida;
}

import { toolsData } from "@/data/tools-complete";
import manifesto from "../../public/ferramentaria/manifesto.json";

/**
 * `/ferramentaria` — o catálogo de ferramentas organizado por VERBO.
 *
 * ── Por que verbo e não categoria ──────────────────────────────────────────
 *
 * O `/ferramentas` classifica as 56 ferramentas em **22 categorias**, e catorze
 * delas têm uma ou duas ferramentas ("Banco de Dados", "Low-code",
 * "Visualizacao", "Edicao de Video"). Isso não é navegação, é arquivo morto:
 * ninguém acorda querendo "uma ferramenta de Infraestrutura de IA". A pessoa
 * quer **fazer** alguma coisa — um vídeo, um site, uma música.
 *
 * Aqui as 22 categorias viram 10 verbos. Mesmo acervo, ponto de entrada que
 * corresponde ao que se passa na cabeça de quem chega. É o mesmo raciocínio do
 * verbo motor que funcionou no arcade.
 *
 * ── As imagens ─────────────────────────────────────────────────────────────
 *
 * `manifesto.json` é gerado por dois scripts e não deve ser editado à mão:
 *   - `scripts/fetch-tool-assets.mjs`   → logo + capa de cada ferramenta
 *   - `scripts/extract-tool-colors.mjs` → cor de marca extraída do logo
 */

export interface Verbo {
  /** Usado na URL (`?fazendo=filmar`) e como chave. */
  slug: string;
  /** O verbo no infinitivo — o rótulo do ladrilho. */
  label: string;
  /** Completa a frase "Inventando ___". */
  complemento: string;
  /** Uma linha que explica o agrupamento. */
  descricao: string;
  /** Matiz base (HSL) do ladrilho. */
  matiz: number;
  ferramentas: string[];
}

export const VERBOS: Verbo[] = [
  {
    slug: "conversar",
    label: "Conversar",
    complemento: "uma conversa que resolve",
    descricao: "Os modelos de uso geral — escrever, analisar, decidir, pesquisar.",
    matiz: 258,
    ferramentas: [
      "chatgpt", "claude", "gemini", "perplexity", "meta-ai",
      "mistral", "grok", "deepseek", "cohere",
    ],
  },
  {
    slug: "programar",
    label: "Programar",
    complemento: "software sem começar do zero",
    descricao: "De autocompletar linha a gerar o aplicativo inteiro.",
    matiz: 200,
    ferramentas: [
      "claude-code", "cursor", "github-copilot", "bolt", "v0",
      "lovable", "replit", "windsurf", "flowise",
    ],
  },
  {
    slug: "desenhar",
    label: "Desenhar",
    complemento: "imagem que ainda não existia",
    descricao: "Geração e edição de imagem, e as pranchetas onde ela vira peça.",
    matiz: 320,
    ferramentas: [
      "midjourney", "dall-e", "stable-diffusion", "leonardo", "ideogram",
      "adobe-firefly", "canva", "figma", "napkin-ai",
    ],
  },
  {
    slug: "filmar",
    label: "Filmar",
    complemento: "vídeo sem câmera",
    descricao: "Geração de vídeo, avatares que falam e edição por texto.",
    matiz: 12,
    ferramentas: ["runwayml", "kling", "luma", "pika-labs", "synthesia", "heygen", "descript"],
  },
  {
    slug: "compor",
    label: "Compor",
    complemento: "som, voz e música",
    descricao: "Vozes sintéticas e música inteira a partir de uma descrição.",
    matiz: 155,
    ferramentas: ["elevenlabs", "suno"],
  },
  {
    slug: "escrever",
    label: "Escrever",
    complemento: "texto que vende",
    descricao: "Copy, revisão e o texto que precisa sair certo na primeira.",
    matiz: 45,
    ferramentas: ["jasper", "copy-ai", "grammarly"],
  },
  {
    slug: "automatizar",
    label: "Automatizar",
    complemento: "o trabalho que se repete",
    descricao: "Ligar sistema a sistema e nunca mais fazer aquilo à mão.",
    matiz: 25,
    ferramentas: ["n8n", "make", "zapier"],
  },
  {
    slug: "apresentar",
    label: "Apresentar",
    complemento: "slides que ninguém odeia",
    descricao: "Da ideia ao deck pronto, sem abrir editor de slide.",
    matiz: 285,
    ferramentas: ["gamma", "tome", "beautiful-ai"],
  },
  {
    slug: "organizar",
    label: "Organizar",
    complemento: "o que já está espalhado",
    descricao: "IA dentro das ferramentas onde o trabalho já acontece.",
    matiz: 220,
    ferramentas: [
      "notebooklm", "notion-ai", "microsoft-copilot",
      "google-workspace-ai", "slack-ai", "discord",
    ],
  },
  {
    slug: "construir",
    label: "Construir",
    complemento: "a base que sustenta o resto",
    descricao: "A infraestrutura de quem coloca IA em produção.",
    matiz: 172,
    ferramentas: ["hugging-face", "langchain", "vercel-ai", "supabase", "pinecone"],
  },
];

export interface Ativos {
  logo: string | null;
  capa: string | null;
  /** Cor de marca extraída do logo; nulo em marca preto-e-branco. */
  cor?: string | null;
  hsl?: [number, number, number] | null;
}

export interface FerramentaCatalogo {
  slug: string;
  nome: string;
  fabricante: string;
  categoria: string;
  preco: string;
  nota: number;
  descricao: string;
  destaques: string[];
  verbo: Verbo;
  logo: string | null;
  capa: string | null;
  cor: string | null;
  hsl: [number, number, number] | null;
}

/**
 * O JSON importado tipa `hsl` como `number[]`, não como trio — o TypeScript
 * não tem como saber que o script sempre escreve três números. Em vez de
 * forçar o cast e confiar, normalizamos: array com tamanho diferente de 3 vira
 * nulo, e a ferramenta cai na paleta da casa em vez de gerar `hsl(undefined)`
 * no CSS, que o navegador descarta em silêncio.
 */
type AtivoCru = { logo?: string | null; capa?: string | null; cor?: string | null; hsl?: number[] | null };

const ATIVOS: Record<string, Ativos> = Object.fromEntries(
  Object.entries(manifesto as Record<string, AtivoCru>).map(([slug, a]) => [
    slug,
    {
      logo: a.logo ?? null,
      capa: a.capa ?? null,
      cor: a.cor ?? null,
      hsl:
        Array.isArray(a.hsl) && a.hsl.length === 3
          ? ([a.hsl[0], a.hsl[1], a.hsl[2]] as [number, number, number])
          : null,
    },
  ]),
);

/** Onde cada ferramenta cai. Construído uma vez, no módulo. */
const VERBO_DE = new Map<string, Verbo>();
for (const verbo of VERBOS) {
  for (const slug of verbo.ferramentas) VERBO_DE.set(slug, verbo);
}

type Cru = Record<string, Record<string, unknown>>;

export const ferramentas: FerramentaCatalogo[] = Object.entries(toolsData as unknown as Cru)
  .map(([slug, t]) => {
    const verbo = VERBO_DE.get(slug);
    // Ferramenta sem verbo é erro de dados nosso, não caso de borda: seria
    // ferramenta invisível na página. Melhor ficar de fora e aparecer na
    // contagem do que aparecer num grupo errado.
    if (!verbo) return null;

    const ativos = ATIVOS[slug] ?? { logo: null, capa: null, cor: null, hsl: null };

    return {
      slug,
      nome: (t.title as string) || slug,
      fabricante: (t.vendor as string) || "",
      categoria: (t.category as string) || "",
      preco: (t.pricing as string) || "Freemium",
      nota: (t.rating as number) ?? 4.5,
      descricao: (t.description as string) || "",
      destaques: ((t.features as string[]) || []).slice(0, 3),
      verbo,
      logo: ativos.logo ? `/ferramentaria/logos/${ativos.logo}` : null,
      capa: ativos.capa ? `/ferramentaria/capas/${ativos.capa}` : null,
      cor: ativos.cor ?? null,
      hsl: ativos.hsl ?? null,
    };
  })
  .filter((f): f is FerramentaCatalogo => f !== null);

/** Ferramentas de um verbo, as com imagem primeiro (a grade fica mais bonita). */
export function porVerbo(slug: string): FerramentaCatalogo[] {
  return ferramentas
    .filter((f) => f.verbo.slug === slug)
    .sort((a, b) => Number(Boolean(b.logo)) - Number(Boolean(a.logo)) || b.nota - a.nota);
}

/**
 * Os destaques do topo — as mais bem avaliadas que têm imagem de capa.
 *
 * Exigir capa não é capricho: o bloco de destaque é editorial e grande, e
 * cartão grande sem imagem é um buraco no meio da página.
 */
export function destaques(quantidade = 3): FerramentaCatalogo[] {
  return [...ferramentas]
    .filter((f) => f.capa && f.logo)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, quantidade);
}

export const totalFerramentas = ferramentas.length;
export const totalComImagem = ferramentas.filter((f) => f.logo).length;

import type { Categoria, Microcurso } from "./tipos";
import { microcursosAiSearch0208 } from "./ai-search-2026-08-02";

export type {
  Acesso,
  Aula,
  Categoria,
  Fonte,
  Microcurso,
  Nivel,
  Secao,
} from "./tipos";

/**
 * Registro dos microcursos.
 *
 * Cada vídeo-fonte é um arquivo. Para acrescentar o próximo, importe o arquivo
 * novo e some ao array — o hub, o sitemap e as páginas se atualizam sozinhos.
 */
export const microcursos: Microcurso[] = [...microcursosAiSearch0208];

/** Mais recentes primeiro; empate resolve pela ordem no vídeo. */
export const microcursosOrdenados: Microcurso[] = [...microcursos].sort(
  (a, b) => b.publicadoEm.localeCompare(a.publicadoEm) || a.fonte.inicio - b.fonte.inicio,
);

export function getMicrocurso(slug: string): Microcurso | undefined {
  return microcursos.find((m) => m.slug === slug);
}

export function getTodosSlugs(): string[] {
  return microcursos.map((m) => m.slug);
}

/** Categorias que de fato têm conteúdo — nunca um filtro que devolve vazio. */
export function getCategorias(): Categoria[] {
  return [...new Set(microcursos.map((m) => m.categoria))].sort();
}

/** Vídeos que originaram os microcursos, do mais recente para o mais antigo. */
export function getFontes(): Array<{
  videoId: string;
  titulo: string;
  canal: string;
  publicadoEm: string;
  total: number;
}> {
  const mapa = new Map<string, { videoId: string; titulo: string; canal: string; publicadoEm: string; total: number }>();

  for (const m of microcursos) {
    const atual = mapa.get(m.fonte.videoId);
    if (atual) {
      atual.total += 1;
      continue;
    }
    mapa.set(m.fonte.videoId, {
      videoId: m.fonte.videoId,
      titulo: m.fonte.tituloVideo,
      canal: m.fonte.canal,
      publicadoEm: m.fonte.publicadoEm,
      total: 1,
    });
  }

  return [...mapa.values()].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));
}

/** Relacionados: mesma categoria primeiro, completando com a mesma fonte. */
export function getRelacionados(slug: string, quantidade = 3): Microcurso[] {
  const base = getMicrocurso(slug);
  if (!base) return [];

  const mesmaCategoria = microcursos.filter(
    (m) => m.slug !== slug && m.categoria === base.categoria,
  );
  const mesmaFonte = microcursos.filter(
    (m) =>
      m.slug !== slug &&
      m.categoria !== base.categoria &&
      m.fonte.videoId === base.fonte.videoId,
  );

  return [...mesmaCategoria, ...mesmaFonte].slice(0, quantidade);
}

/** Link para o trecho exato do vídeo que originou o microcurso. */
export function linkDaFonte(m: Microcurso): string {
  return `https://www.youtube.com/watch?v=${m.fonte.videoId}&t=${m.fonte.inicio}s`;
}

/**
 * Arte de capa de um microcurso.
 *
 * A arte é por CATEGORIA, não por microcurso, e isso é decisão, não economia:
 * sete peças gastam sete gerações e dão à seção inteira uma identidade que se
 * reconhece de longe. Arte diferente em cada uma das 16 páginas viraria ruído
 * — e viraria trabalho novo a cada microcurso publicado.
 *
 * ⚠️ Nenhuma delas tem texto dentro do pixel. As capas de curso do site estão
 * com texto errado exatamente porque o título foi assado na imagem: quando o
 * título muda, a arte passa a mentir. Título é HTML por cima.
 */
const ARTE_POR_CATEGORIA: Record<Categoria, string> = {
  "Vídeo": "/inventando/arte/cat-video.webp",
  "Áudio": "/inventando/arte/cat-audio.webp",
  "Imagem": "/inventando/arte/cat-imagem.webp",
  "Modelos": "/inventando/arte/cat-modelos.webp",
  "Robótica": "/inventando/arte/cat-robotica.webp",
  "Mundos 3D": "/inventando/arte/cat-mundos.webp",
  "Produtividade": "/inventando/arte/cat-produtividade.webp",
};

/**
 * A arte PRÓPRIA de cada microcurso.
 *
 * A economia de sete peças por categoria (explicada acima) tinha um custo que só
 * apareceu com a seção cheia: são 16 microcursos para 7 artes, e "Modelos" tem
 * quatro. Numa grade de nove cards, o mesmo cérebro roxo aparecia três vezes
 * lado a lado, e a paleta de "Imagem" duas. O visitante não lê isso como
 * identidade de categoria — lê como catálogo pobre.
 *
 * Cada arte aqui mostra o que AQUELA lição faz: o prisma que recebe três feixes
 * e emite um, a folha que se abre em camadas, a moeda que equilibra a torre. Os
 * prompts exatos estão em `D:\fayai\site-imagens\inventando\PROMPTS.md`.
 *
 * Quem não tiver arte própria cai na da categoria — a seção nunca fica sem
 * imagem enquanto o lote não fecha.
 */
const COM_ARTE_PROPRIA = new Set([
  // Vídeo
  "id-v2v-trocar-o-estilo-do-video-sem-trocar-o-ator", // três painéis, o mesmo busto, acabamentos diferentes
  "higgsfield-marketing-studio-e-cinema-studio", // duas portas: uma com claquete, outra com megafone
  "seedance-2-5-trinta-segundos-de-video-com-o-mesmo-personagem", // fita em espiral, a mesma silhueta em todo quadro
  "minimax-h3-video-em-2k-tres-vezes-mais-barato", // painel denso que quase não pesa na balança
  // Áudio
  "crisperwhisper-2-transcricao-com-tempo-por-palavra", // onda presa a uma régua por marcas douradas
  // Modelos
  "deepseek-v4-flash-0731-inteligencia-de-fronteira-a-tres-centavos", // moeda minúscula equilibrando a torre
  "kimi-k3-o-maior-modelo-aberto-e-o-que-fazer-com-ele", // cofre colossal aberto
  "instella-o-modelo-da-amd-treinado-sem-nvidia", // um chip sozinho alimentando a constelação
  "inkling-small-o-modelo-aberto-que-escuta", // concha pequena em ondas enormes
  // Imagem
  "redesign-transformar-uma-imagem-plana-em-camadas-editaveis", // folha plana se abrindo em camadas
  "ideogram-object-remover-tirar-o-objeto-a-sombra-e-o-reflexo", // objeto, sombra e reflexo sumindo juntos
  // Robótica
  "prism-robos-que-decidem-com-mais-de-um-sentido", // três feixes entram, um dourado sai
  "gemini-robotics-2-do-pe-a-ponta-dos-dedos", // mão e pé ligados por um fio de luz
  // Mundos 3D
  "wonder-da-adobe-um-video-que-vira-cenario-navegavel", // o quadro plano se abrindo em cenário
  "phi-zero-pensar-a-fisica-antes-do-primeiro-quadro", // a esfera com a trajetória já desenhada
  // Produtividade
  "gemini-voice-typing-ditado-que-ja-sai-limpo", // onda embaraçada entra, linha limpa sai
]);

export function capaDe(m: Microcurso): string {
  if (COM_ARTE_PROPRIA.has(m.slug)) {
    return `/inventando/arte/micro/${m.slug}.webp`;
  }
  return ARTE_POR_CATEGORIA[m.categoria] ?? "/inventando/arte/microcurso.webp";
}

/**
 * Logo da ferramenta, quando ela também está no catálogo da Ferramentaria.
 *
 * O casamento é por nome normalizado — o slug do microcurso descreve a lição
 * ("seedance-2-5-trinta-segundos…"), não a ferramenta, então não serve de
 * chave.
 */
export function logoDaFerramenta(
  m: Microcurso,
  manifesto: Record<string, { logo?: string | null }>,
): string | null {
  const alvo = m.ferramenta.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [slug, ativos] of Object.entries(manifesto)) {
    const chave = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ativos.logo && (chave === alvo || alvo.startsWith(chave) || chave.startsWith(alvo))) {
      return `/ferramentaria/logos/${ativos.logo}`;
    }
  }
  return null;
}

/** "04:08" a partir dos segundos de início. */
export function timestampLegivel(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

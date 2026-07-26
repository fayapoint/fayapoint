/**
 * World Trend — o que está em alta de verdade num lugar, agora.
 *
 * Duas fontes, ambas gratuitas, ambas com link para a origem (é isso que separa
 * uma ferramenta de trending de uma lista de palpites):
 *
 *  1. Google Trends RSS  `trends.google.com/trending/rss?geo=XX`
 *     Buscas em alta, com volume aproximado e a manchete que explica o porquê.
 *     Verificado em 26/07/2026: responde para os 27 estados brasileiros
 *     (`BR-SP`, `BR-BA`, …) e para os países da lista — e o resultado é
 *     realmente diferente entre estados.
 *
 *  2. Wikipedia most-read  `api.wikimedia.org/feed/v1/wikipedia/{lang}/featured`
 *     O que o idioma inteiro está LENDO, com contagem real de visitas. Cobre
 *     país/idioma, não estado — por isso só entra no degrau de país.
 *
 * Nenhuma das duas pede chave. O custo por consulta é zero.
 */

import { getLugar, estadosDaRegiao, filhosDe, type Lugar } from "@/data/landing/radar-lugares";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

/**
 * Teto de cada consulta externa, com folga proposital abaixo do limite de
 * execução da função serverless (10 s na Netlify).
 *
 * Medir o Brasil dispara o feed nacional mais os 27 estados em paralelo, então
 * o relógio da função é o do pedido mais lento. Com um teto de 9 s, uma fonte
 * travada leva a função inteira junto e o visitante recebe erro; com 6 s, a
 * fonte lenta é descartada e o resto da medição ainda chega à tela. Perder uma
 * fonte é melhor que perder a seção.
 */
const TETO_MS = 6000;

export type FonteTrend = "busca" | "leitura";

export interface ItemTrend {
  /** O assunto, como as pessoas o escreveram */
  titulo: string;
  fonte: FonteTrend;
  /** Volume aproximado — buscas ("2000+") ou visitas (número) */
  volume: number;
  /** Como o volume deve ser lido na tela */
  volumeRotulo: string;
  /** A manchete/artigo que explica o assunto */
  contexto: string | null;
  /** Link para a origem — sem isto não somos uma ferramenta de trending */
  url: string | null;
  /** Veículo ou projeto de onde veio */
  veiculo: string | null;
  /** Sinaliza que o assunto encosta em IA — o gancho natural para a outra aba */
  temIa: boolean;
  /**
   * Onde este assunto foi medido, quando o lugar é um agregado.
   * Numa região, guarda as siglas dos estados em que ele apareceu — é o que
   * permite acender o mapa ao passar o mouse no assunto, e vice-versa. É a
   * razão de o mapa existir ao lado da lista.
   */
  lugares?: string[];
}

export interface ResultadoMundo {
  lugar: string;
  nome: string;
  geradoEm: string;
  origem: "live" | "cache";
  itens: ItemTrend[];
}

// ---------------------------------------------------------------------------
// XML na unha. O feed é pequeno e de forma fixa; um parser completo aqui seria
// dependência nova para resolver problema que não temos.
// ---------------------------------------------------------------------------

function tag(bloco: string, nome: string): string | null {
  const m = bloco.match(new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`));
  return m ? destrincharTexto(m[1]) : null;
}

function todas(bloco: string, nome: string): string[] {
  const re = new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloco))) out.push(destrincharTexto(m[1]));
  return out;
}

function destrincharTexto(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** "2.000+" / "20K+" → número, para poder ordenar e desenhar barra. */
function lerVolume(s: string | null): number {
  if (!s) return 0;
  const m = s.replace(/[.\s]/g, "").match(/([\d,]+)\s*([KM]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  const mult = m[2].toUpperCase() === "M" ? 1e6 : m[2].toUpperCase() === "K" ? 1e3 : 1;
  return Math.round(n * mult);
}

const PALAVRAS_IA =
  /\b(ia|a\.?i\.?|intelig[êe]ncia artificial|chatgpt|gpt|openai|gemini|claude|copilot|llm|deepfake|rob[oô]|algoritmo|machine learning|anthropic|grok|midjourney|sora)\b/i;

function veiculoDe(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fonte 1 — buscas em alta
// ---------------------------------------------------------------------------

async function buscasEmAlta(geo: string): Promise<ItemTrend[]> {
  try {
    const res = await fetch(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(TETO_MS),
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return [];

    // O feed vem declarado como UTF-8 e é o que a decodificação padrão espera.
    const xml = await res.text();
    const itens = xml.split("<item>").slice(1).map((b) => b.split("</item>")[0]);

    return itens
      .map((b): ItemTrend | null => {
        const titulo = tag(b, "title");
        if (!titulo) return null;
        const manchetes = todas(b, "ht:news_item_title");
        const urls = todas(b, "ht:news_item_url");
        const veic = todas(b, "ht:news_item_source");
        const trafego = tag(b, "ht:approx_traffic");
        const url = urls[0] ?? null;
        return {
          titulo,
          fonte: "busca" as const,
          volume: lerVolume(trafego),
          volumeRotulo: trafego ? `${trafego} buscas` : "em alta",
          contexto: manchetes[0] ?? null,
          url,
          veiculo: veic[0] ?? veiculoDe(url),
          temIa: PALAVRAS_IA.test(`${titulo} ${manchetes[0] ?? ""}`),
        };
      })
      .filter((x): x is ItemTrend => x !== null);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fonte 2 — o que o idioma está lendo
// ---------------------------------------------------------------------------

interface ArtigoWiki {
  views?: number;
  titles?: { normalized?: string };
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

async function maisLidos(wiki: string): Promise<ItemTrend[]> {
  // O feed do dia só fecha depois da meia-noite UTC; pedimos ontem, que está
  // sempre completo.
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const data = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;

  try {
    const res = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/${wiki}/featured/${data}`, {
      headers: { "User-Agent": "FayAI-Radar/1.0 (https://fayai.com.br)" },
      signal: AbortSignal.timeout(TETO_MS),
      next: { revalidate: 60 * 60 * 3 },
    });
    if (!res.ok) return [];
    const j = (await res.json()) as { mostread?: { articles?: ArtigoWiki[] } };

    return (j.mostread?.articles ?? [])
      .filter((a) => a.titles?.normalized && !/^(Wikip|Especial|Special|Main_Page)/i.test(a.titles.normalized))
      .slice(0, 12)
      .map((a) => {
        const titulo = a.titles!.normalized!;
        const url = a.content_urls?.desktop?.page ?? null;
        return {
          titulo,
          fonte: "leitura" as const,
          volume: a.views ?? 0,
          volumeRotulo: `${(a.views ?? 0).toLocaleString("pt-BR")} leituras`,
          contexto: a.extract ? a.extract.slice(0, 160) : null,
          url,
          veiculo: "wikipedia.org",
          temIa: PALAVRAS_IA.test(`${titulo} ${a.extract ?? ""}`),
        };
      });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Orquestração
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000; // buscas em alta mudam ao longo do dia
const cache = new Map<string, { em: number; dado: ResultadoMundo }>();

/**
 * Palavras que identificam um assunto.
 *
 * O feed nacional e o estadual quase nunca escrevem o mesmo título para o
 * mesmo acontecimento ("vasco x mirassol" vs "classificações de vasco da gama
 * x mirassol"). Casar por título exato encontrava 4 de 22; casar por palavra
 * significativa encontra a maioria, que é o que faz o hover acender o mapa.
 */
function chavesDe(titulo: string): string[] {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 5);
}

/** Mantém a ordem de relevância mas não deixa um assunto aparecer duas vezes. */
function juntar(listas: ItemTrend[][]): ItemTrend[] {
  const vistos = new Set<string>();
  const out: ItemTrend[] = [];
  for (const lista of listas) {
    for (const it of lista) {
      const chave = it.titulo.toLowerCase().replace(/[^a-z0-9à-ú ]/gi, "").trim();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      out.push(it);
    }
  }
  return out;
}

async function medir(lugar: Lugar): Promise<ItemTrend[]> {
  // "Mundo" não é uma consulta: o Google Trends não tem geo global. Ele é a
  // soma dos países que medimos — e mostrar de qual país veio cada assunto é
  // justamente o que dá sentido ao degrau. Sem isto a raiz vinha vazia
  // ("Sem sinal para este lugar agora"), que foi o que o Ricardo encontrou.
  if (lugar.degrau === "mundo") {
    const paises = filhosDe("mundo");
    const listas = await Promise.all(
      paises.map((p) => (p.geo ? buscasEmAlta(p.geo) : Promise.resolve([])))
    );
    const somado = new Map<string, ItemTrend>();
    listas.forEach((lista, i) => {
      const iso = paises[i].id;
      // Só o topo de cada país: o mundo é um resumo, não a soma de tudo.
      for (const it of lista.slice(0, 4)) {
        const k = it.titulo.toLowerCase();
        const antes = somado.get(k);
        if (antes) {
          antes.volume += it.volume;
          if (!antes.lugares!.includes(iso)) antes.lugares!.push(iso);
        } else {
          somado.set(k, { ...it, lugares: [iso] });
        }
      }
    });
    return [...somado.values()]
      .sort((a, b) => b.lugares!.length - a.lugares!.length || b.volume - a.volume)
      .map((it) => ({
        ...it,
        volumeRotulo:
          it.lugares!.length > 1
            ? `em ${it.lugares!.length} países`
            : `${it.volume.toLocaleString("pt-BR")}+ buscas`,
      }));
  }

  // Região do Brasil: não existe geo própria no Trends, então ela é a soma dos
  // seus estados. É mais honesto do que fingir que "Sudeste" é uma consulta.
  if (lugar.degrau === "regiao") {
    const sigla = lugar.id.replace("BR-r-", "");
    const estados = estadosDaRegiao(sigla);
    const listas = await Promise.all(
      estados.map((id) => {
        const uf = getLugar(id);
        return uf.geo ? buscasEmAlta(uf.geo) : Promise.resolve([]);
      })
    );
    // Assunto que aparece em vários estados da região pesa mais que um que só
    // apareceu num — soma de volume é o critério.
    const somado = new Map<string, ItemTrend>();
    listas.forEach((lista, i) => {
      const sigla = estados[i].replace("BR-", "");
      for (const it of lista) {
        const k = it.titulo.toLowerCase();
        const antes = somado.get(k);
        if (antes) {
          antes.volume += it.volume;
          if (!antes.lugares!.includes(sigla)) antes.lugares!.push(sigla);
        } else {
          somado.set(k, { ...it, lugares: [sigla] });
        }
      }
    });
    return [...somado.values()]
      .sort((a, b) => b.volume - a.volume)
      .map((it) => ({ ...it, volumeRotulo: `${it.volume.toLocaleString("pt-BR")}+ buscas` }));
  }

  const [buscas, leituras] = await Promise.all([
    lugar.geo ? buscasEmAlta(lugar.geo) : Promise.resolve([]),
    lugar.wiki ? maisLidos(lugar.wiki) : Promise.resolve([]),
  ]);
  const itens = juntar([buscas, leituras]);

  // No Brasil, o feed nacional não diz de onde vem cada assunto — então
  // medimos as cinco regiões e marcamos em quais ele aparece. É o que faz o
  // hover de um assunto acender o mapa já no primeiro nível, em vez de só
  // depois de entrar numa região.
  if (lugar.id === "BR") {
    const regioes = filhosDe("BR");
    const listas = await Promise.all(
      regioes.map((r) => medir(r).catch(() => [] as ItemTrend[]))
    );
    // índice palavra → regiões onde ela apareceu
    const onde = new Map<string, Set<string>>();
    listas.forEach((lista, i) => {
      const sigla = regioes[i].id.replace("BR-r-", "");
      for (const it of lista) {
        for (const k of chavesDe(it.titulo)) {
          const s = onde.get(k) ?? new Set<string>();
          s.add(sigla);
          onde.set(k, s);
        }
      }
    });
    return itens.map((it) => {
      const regs = new Set<string>();
      for (const k of chavesDe(it.titulo)) {
        for (const r of onde.get(k) ?? []) regs.add(r);
      }
      return regs.size ? { ...it, lugares: [...regs].sort() } : it;
    });
  }

  return itens;
}

export async function getMundo(lugarId: string): Promise<ResultadoMundo> {
  const lugar = getLugar(lugarId);
  const guardado = cache.get(lugar.id);
  if (guardado && Date.now() - guardado.em < CACHE_TTL_MS) {
    return { ...guardado.dado, origem: "cache" };
  }

  const itens = await medir(lugar);

  if (!itens.length && guardado) return { ...guardado.dado, origem: "cache" };

  const dado: ResultadoMundo = {
    lugar: lugar.id,
    nome: lugar.nome,
    geradoEm: new Date().toISOString(),
    origem: "live",
    itens,
  };
  if (itens.length) cache.set(lugar.id, { em: Date.now(), dado });
  return dado;
}

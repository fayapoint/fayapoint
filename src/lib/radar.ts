/**
 * Radar da IA — demanda real de busca, medida no autocomplete do Google e do
 * YouTube. Sem API key, sem custo: cada sugestão vem do que brasileiros
 * REALMENTE digitaram, ordenada por frequência e recência. Foi essa fonte que
 * acertou os títulos de SEO em 21/07/2026.
 *
 * Porte em TypeScript de `autoresearch/PRODUCAO/scripts/radar.py` (26/07/2026),
 * que continua sendo a FONTE DE VERDADE da pontuação. Se um dia divergirem,
 * o Python manda. A fórmula:
 *   - posição 0 no autocomplete vale 10 pontos, posição 9 vale 1
 *   - YouTube pesa 1,2× (é onde vídeo compete)
 *   - aparecer nos DOIS canais multiplica por 1,6 (o sinal mais confiável)
 *   - amplitude: +1,5 por semente distinta que trouxe o mesmo termo
 *
 * A diferença para o script: aqui rodamos 3 sementes × 3 modificadores por
 * nicho (18 consultas) em vez de 10 × 5, porque isto responde a uma página
 * viva e não a um relatório noturno.
 */

import { NICHOS, getNicho, type Nicho, type TermoRadar } from "@/data/landing/radar-nichos";

// A configuração dos nichos mora em `data/` para não entrar no bundle do
// cliente junto com este arquivo. Reexportamos por conveniência de quem
// consome o radar pelo servidor.
export { NICHOS, getNicho, NICHO_PADRAO } from "@/data/landing/radar-nichos";
export type { Nicho, TermoRadar } from "@/data/landing/radar-nichos";

// Modificadores que dominam a busca brasileira (achado de 21/07/2026).
const MODIFICADORES = ["", " gratis", " na pratica"];

// ---------------------------------------------------------------------------
// Coleta
// ---------------------------------------------------------------------------

const AUTOCOMPLETE = "https://suggestqueries.google.com/complete/search";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

export type Canal = "web" | "yt";

/**
 * Uma consulta ao autocomplete. Devolve [] em qualquer falha — o radar degrada
 * para menos sinal, nunca para erro na página.
 */
async function sugestoes(q: string, canal: Canal): Promise<string[]> {
  const p = new URLSearchParams({ client: "firefox", hl: "pt-BR", q });
  if (canal === "yt") p.set("ds", "yt");
  else p.set("gl", "br");

  try {
    const res = await fetch(`${AUTOCOMPLETE}?${p.toString()}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(6000),
      // O autocomplete muda devagar; deixar o Next guardar 6h evita bater à toa.
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!res.ok) return [];

    // O endpoint às vezes responde em latin-1. Tentamos utf-8 e caímos para
    // latin-1 — mesma defesa do radar.py.
    const buf = await res.arrayBuffer();
    let data: unknown = null;
    for (const enc of ["utf-8", "latin1"]) {
      try {
        data = JSON.parse(new TextDecoder(enc).decode(buf));
        break;
      } catch {
        data = null;
      }
    }
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) return [];
    return (data[1] as unknown[]).filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pontuação — espelho fiel de pontuar() no radar.py
// ---------------------------------------------------------------------------

interface Acumulado {
  web: number[];
  yt: number[];
  sementes: Set<string>;
}

function pontuar(achados: Map<string, Acumulado>): TermoRadar[] {
  const linhas: TermoRadar[] = [];

  for (const [termo, e] of achados) {
    const nWeb = e.web.length;
    const nYt = e.yt.length;
    if (!nWeb && !nYt) continue;

    const posWeb = nWeb ? e.web.reduce((a, b) => a + b, 0) / nWeb : 99;
    const posYt = nYt ? e.yt.reduce((a, b) => a + b, 0) / nYt : 99;

    const pWeb = nWeb ? Math.max(0, 10 - posWeb) : 0;
    const pYt = nYt ? Math.max(0, 10 - posYt) : 0;
    const ambos = nWeb && nYt ? 1.6 : 1.0; // confirmação em dois canais
    const score = (pWeb + pYt * 1.2) * ambos + e.sementes.size * 1.5;

    linhas.push({
      termo,
      score: Math.round(score * 10) / 10,
      web: nWeb,
      yt: nYt,
      posWeb: nWeb ? Math.round(posWeb * 10) / 10 : null,
      posYt: nYt ? Math.round(posYt * 10) / 10 : null,
      canais: nWeb && nYt ? "web+yt" : nYt ? "yt" : "web",
      sementes: [...e.sementes].sort(),
      formato: formato(termo),
    });
  }

  linhas.sort((a, b) => b.score - a.score);
  return linhas;
}

/** Sugere o formato pelo tipo de intenção do termo (idem radar.py). */
function formato(termo: string): string {
  const t = termo;
  if (/^(o que e|o que sao|por que|qual)/.test(t)) return "matéria";
  if (/^(como |passo a passo)/.test(t)) return "vídeo tutorial";
  if (/\bgratis|gratuito\b/.test(t)) return "isca grátis";
  if (t.includes("curso")) return "página de curso";
  if (t.includes("ganhar dinheiro") || t.includes("trabalho") || t.includes("emprego"))
    return "Reel de resultado";
  return "Reel curto";
}

/**
 * Termos que o autocomplete devolve mas que nao sao portugues.
 *
 * O Google mistura sugestoes de espanhol e ingles em consultas brasileiras
 * (`automatizar con ia gratis` foi a que denunciou o problema). O dado e real,
 * mas numa pagina brasileira ele le como erro nosso — e uma ferramenta de
 * trending perde autoridade por muito menos.
 *
 * Filtramos por palavras que NAO existem em portugues, nunca por acento:
 * brasileiro digita sem acento o tempo todo, e "inteligencia artificial" e
 * portugues legitimo.
 */
const ESTRANGEIRAS = new Set([
  // espanhol
  "con", "el", "los", "las", "una", "mejor", "mejores", "hacer", "puedo",
  "cuales", "tambien", "pero", "ademas", "gratuita", "aprender",
  // ingles
  "the", "how", "what", "best", "free", "your", "with", "and", "for", "you",
  "beginners", "step", "using", "guide", "learn", "make", "top", "tools",
]);

function ehPortugues(termo: string): boolean {
  return !termo.split(/\s+/).some((p) => ESTRANGEIRAS.has(p));
}

// ---------------------------------------------------------------------------
// Orquestração + cache
// ---------------------------------------------------------------------------

export interface ResultadoRadar {
  nicho: string;
  geradoEm: string;
  /** "live" = medido agora · "cache" = medido há pouco · "seed" = último snapshot */
  origem: "live" | "cache" | "seed";
  consultas: number;
  termos: TermoRadar[];
}

interface Entrada {
  em: number;
  dado: ResultadoRadar;
}

// Cache em memória do processo Node. O autocomplete muda em horas, não em
// minutos — 6h é generoso e mantém a home instantânea.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, Entrada>();

/**
 * Mede a demanda de um nicho. Nunca lança: se a rede falhar por completo,
 * devolve lista vazia e quem chama decide o fallback.
 */
export async function medirNicho(nicho: Nicho): Promise<ResultadoRadar> {
  const consultas: Array<{ q: string; semente: string; canal: Canal }> = [];
  for (const semente of nicho.sementes) {
    for (const mod of MODIFICADORES) {
      const q = (semente + mod).trim();
      consultas.push({ q, semente, canal: "web" });
      consultas.push({ q, semente, canal: "yt" });
    }
  }

  // Escalonadas em ~80ms para não chegar como rajada no endpoint.
  const respostas = await Promise.all(
    consultas.map(async (c, i) => {
      if (i) await new Promise((r) => setTimeout(r, i * 80));
      return { ...c, itens: await sugestoes(c.q, c.canal) };
    })
  );

  // As próprias consultas saem do ranking. Elas voltam sempre na posição 0 dos
  // dois canais — nota máxima garantida — mas isso é artefato de termos
  // digitado a pergunta, não demanda medida. Um radar que devolve a pergunta
  // como resposta não está medindo nada.
  const perguntas = new Set(consultas.map((c) => c.q.toLowerCase()));

  const achados = new Map<string, Acumulado>();
  for (const r of respostas) {
    r.itens.forEach((termo, pos) => {
      const t = termo.trim().toLowerCase();
      if (t.length < 8) return; // ruído de uma palavra só
      if (perguntas.has(t)) return;
      if (!ehPortugues(t)) return;
      let e = achados.get(t);
      if (!e) {
        e = { web: [], yt: [], sementes: new Set() };
        achados.set(t, e);
      }
      e[r.canal].push(pos);
      e.sementes.add(r.semente);
    });
  }

  return {
    nicho: nicho.id,
    geradoEm: new Date().toISOString(),
    origem: "live",
    consultas: consultas.length,
    termos: pontuar(achados),
  };
}

/** Versão cacheada — é esta que a API e a home usam. */
export async function getRadar(nichoId: string): Promise<ResultadoRadar> {
  const nicho = getNicho(nichoId);
  const guardado = cache.get(nicho.id);

  if (guardado && Date.now() - guardado.em < CACHE_TTL_MS) {
    return { ...guardado.dado, origem: "cache" };
  }

  const dado = await medirNicho(nicho);

  // Medição vazia = rede caiu. Preferimos o cache velho ao vazio.
  if (!dado.termos.length && guardado) {
    return { ...guardado.dado, origem: "cache" };
  }

  cache.set(nicho.id, { em: Date.now(), dado });
  return dado;
}

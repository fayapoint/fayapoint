/**
 * A linha do tempo do Radar — quantas pessoas leram sobre cada tema de IA, dia a dia.
 *
 * ## Por que a série anterior não podia funcionar
 *
 * "A LINHA DO TEMPO" mostrava o `score` do IA Trend ao longo dos dias, e o
 * texto da seção dizia: *"o que interessa aqui não é a altura da linha, é a
 * **inclinação**"*. Só que aquele score é
 * `(pontosWeb + pontosYouTube × 1,2) × bônus + sementes × 1,5`, e os "pontos"
 * saem da POSIÇÃO do termo no autocomplete. Posição de autocomplete muda em
 * escala de semanas. Medido em produção em 29/07/2026, direto do histórico:
 *
 *     ia para criar videos:  26/07 → 36,7 | 28/07 → 36,7 | 29/07 → 36,7
 *     o que é ia:            26/07 → 36,7 | 28/07 → 36,7 | 29/07 → 36,7
 *     ia na pratica:         26/07 → 35,1 | 28/07 → 35,1 | 29/07 → 35,1
 *
 * Idênticos até a decimal, três dias seguidos, em todos os termos. O gráfico
 * saía reto e o `delta` saía 0 — e o gráfico estava certo. Errado era prometer
 * inclinação numa métrica que não tem como inclinar. O Ricardo leu o painel e
 * disse "isso não é possível": a conclusão dele sobre o dado estava errada, o
 * julgamento sobre o painel estava certíssimo.
 *
 * ## Por que a Wikipédia, e não o Google Trends
 *
 * A escolha óbvia seria o *interest over time* do Google Trends. Ele foi
 * testado em 29/07/2026 e **não serve**: a API não oficial devolve o token
 * (`/api/explore` responde 200 com cookie de sessão) mas bloqueia a entrega do
 * dado (`/api/widgetdata/multiline` → 429), de forma consistente, com cookie
 * novo e 9 segundos entre chamadas. E isso do IP residencial — de um IP de
 * datacenter, que é de onde a função e o cron rodariam, tende a ser pior.
 * Construir a seção em cima disso seria construir sobre algo que não responde.
 *
 * A API de pageviews da Wikimedia é oficial, documentada, sem chave, e foi
 * medida antes de virar código — 31 dias pedidos, 31 devolvidos, com movimento
 * de verdade: "Inteligência artificial" oscilou entre 199 e 2.360 leituras/dia,
 * com 30 valores distintos em 31 dias. É o oposto da linha reta.
 *
 * E ela é honesta com o que a página já promete: a Wikipédia **já é** uma das
 * duas fontes citadas no rodapé do Radar, e cada linha do gráfico leva ao
 * artigo que a originou — "cada assunto leva à fonte" continua valendo.
 *
 * ⚠️ O que isto mede é **leitura**, não busca. São perguntas diferentes, e a
 * interface precisa dizer isso: quem lê "2.360" tem de entender "2.360 pessoas
 * abriram o artigo", não "2.360 pessoas pesquisaram".
 */

const API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article";

/**
 * A Wikimedia pede User-Agent identificável na política de uso da API. Sem ele
 * a chamada é passível de bloqueio — e um bloqueio silencioso aqui devolveria
 * gráfico vazio sem erro visível.
 */
const UA = "FayAI-Radar/1.0 (https://fayai.com.br)";

/** Um tema acompanhado, e o artigo da Wikipédia em português que o representa. */
export interface TemaLeitura {
  id: string;
  rotulo: string;
  artigo: string;
}

/**
 * Os temas do painel.
 *
 * Escolhidos por serem (a) inequivocamente sobre IA, (b) artigos que existem em
 * pt.wikipedia e (c) com volume suficiente para o movimento diário significar
 * alguma coisa — os seis foram medidos em 29/07/2026 antes de entrarem aqui.
 */
export const TEMAS: TemaLeitura[] = [
  { id: "ia", rotulo: "Inteligência artificial", artigo: "Inteligência_artificial" },
  { id: "chatgpt", rotulo: "ChatGPT", artigo: "ChatGPT" },
  { id: "openai", rotulo: "OpenAI", artigo: "OpenAI" },
  { id: "anthropic", rotulo: "Anthropic", artigo: "Anthropic" },
  { id: "deep", rotulo: "Aprendizagem profunda", artigo: "Aprendizagem_profunda" },
  { id: "gemini", rotulo: "Gemini", artigo: "Gemini_(modelo_de_linguagem)" },
];

export interface SerieLeitura {
  id: string;
  rotulo: string;
  /** Link para o artigo — é o que torna o número conferível. */
  fonte: string;
  pontos: Array<{ dia: string; leituras: number | null }>;
  /** Leituras do dia mais recente com dado. */
  atual: number;
  /** Variação percentual dos últimos 7 dias contra os 7 anteriores. */
  variacao: number;
}

export interface LeituraRadar {
  dias: string[];
  series: SerieLeitura[];
  medidoEm: string;
}

function aaaammdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function iso(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

async function serieDe(tema: TemaLeitura, dias: number): Promise<SerieLeitura | null> {
  // A Wikimedia consolida com atraso de ~1 dia; pedir até ontem evita um último
  // ponto sempre vazio, que no gráfico vira queda a pico que nunca aconteceu.
  const fim = new Date(Date.now() - 2 * 86_400_000);
  const ini = new Date(fim.getTime() - (dias - 1) * 86_400_000);
  const url = `${API}/pt.wikipedia/all-access/user/${encodeURIComponent(tema.artigo)}/daily/${aaaammdd(ini)}/${aaaammdd(fim)}`;

  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: Array<{ timestamp: string; views: number }> };
    const itens = j.items ?? [];
    if (!itens.length) return null;

    const pontos = itens.map((i) => ({ dia: iso(i.timestamp), leituras: i.views }));
    const vals = pontos.map((p) => p.leituras);
    const ult7 = vals.slice(-7);
    const ant7 = vals.slice(-14, -7);
    const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const base = media(ant7);
    const variacao = base ? Math.round(((media(ult7) - base) / base) * 100) : 0;

    return {
      id: tema.id,
      rotulo: tema.rotulo,
      fonte: `https://pt.wikipedia.org/wiki/${encodeURIComponent(tema.artigo)}`,
      pontos,
      atual: vals[vals.length - 1] ?? 0,
      variacao,
    };
  } catch (error) {
    console.error(`[radar-leitura] ${tema.artigo} falhou:`, error);
    return null;
  }
}

/**
 * A série dos seis temas na janela pedida.
 *
 * Um tema que falhe some da lista em vez de virar linha zerada: linha no chão
 * é indistinguível de "ninguém leu", e afirmar isso quando na verdade a API não
 * respondeu é exatamente o tipo de número inventado que a página não pode ter.
 */
/**
 * No máximo cinco séries.
 *
 * Não é escolha estética: a paleta do gráfico tem exatamente cinco cores, e a
 * ordem delas foi validada contra a superfície do card para daltonismo
 * (`SERIE_CORES` em `HistoricoTendencia.tsx` — pior par adjacente ΔE 8,4).
 * Devolver seis fazia `SERIE_CORES[5]` sair `undefined`: a sexta linha era
 * desenhada **sem `stroke`**, ou seja, invisível, mas ganhava entrada na
 * legenda e no rodapé de variação. Legenda apontando para uma linha que não
 * está lá é pior que não mostrar o tema.
 *
 * São seis temas configurados de propósito, para haver reserva quando um
 * artigo não responder — mas só os cinco de maior leitura chegam à tela.
 */
const MAX_SERIES = 5;

export async function getLeitura(dias = 30): Promise<LeituraRadar> {
  const medidas = (await Promise.all(TEMAS.map((t) => serieDe(t, dias)))).filter(
    (s): s is SerieLeitura => s !== null
  );

  const series = medidas.sort((a, b) => b.atual - a.atual).slice(0, MAX_SERIES);

  const todos = new Set<string>();
  series.forEach((s) => s.pontos.forEach((p) => todos.add(p.dia)));

  return {
    dias: [...todos].sort(),
    series,
    medidoEm: new Date().toISOString(),
  };
}

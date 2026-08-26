import { NextResponse } from "next/server";

/**
 * GET /api/game/ea/diagnostico
 *
 * Sonda a fonte da EA e conta EXATAMENTE o que ela respondeu — status, tempo,
 * content-type, cabeçalhos de borda e o começo do corpo.
 *
 * Por que existe: em 25/08/2026 a seção /game funcionava no desenvolvimento e
 * devolvia lista vazia em PRODUÇÃO. As rotas respondiam 200, os componentes
 * pintavam o estado vazio, e nada em lugar nenhum dizia que a ida à EA tinha
 * falhado — porque `eaGet` engole o erro e devolve `null` de propósito (uma
 * falha da EA não pode derrubar a página). Sem esta sonda, descobrir a causa
 * custa um deploy por hipótese.
 *
 * Serve também ao portão já marcado no PLANO_GAME §4 (Fase 2, 18–25/09): quando
 * o FC 27 sair, os endpoints mudam sem aviso, e esta rota diz em um pedido se
 * ainda respondem.
 *
 * Não expõe segredo nenhum: os cabeçalhos enviados são os mesmos que qualquer
 * navegador manda, e o corpo é o de uma consulta pública.
 */
export const dynamic = "force-dynamic";

const BASE = "https://proclubs.ea.com/api/fc";

const HEADERS: Record<string, string> = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  referer: "https://www.ea.com/",
};

/** Cabeçalhos de resposta que denunciam bloqueio de borda (Akamai) ou CDN. */
const INTERESSANTES = [
  "content-type",
  "server",
  "x-cache",
  "x-reference-error",
  "akamai-grn",
  "cf-ray",
  "set-cookie",
  "retry-after",
];

async function sondar(nome: string, url: string) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const texto = await res.text();
    const cabecalhos: Record<string, string> = {};
    for (const h of INTERESSANTES) {
      const v = res.headers.get(h);
      if (v) cabecalhos[h] = v.slice(0, 200);
    }
    let itens: number | null = null;
    try {
      const j = JSON.parse(texto);
      itens = Array.isArray(j) ? j.length : typeof j === "object" && j ? Object.keys(j).length : null;
    } catch {
      /* corpo não-JSON: é justamente o caso interessante */
    }
    return {
      nome,
      url,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - t0,
      bytes: texto.length,
      itens,
      cabecalhos,
      // O começo do corpo é o que distingue "403 da Akamai" de "JSON vazio".
      corpo: texto.slice(0, 400),
    };
  } catch (err) {
    return {
      nome,
      url,
      ok: false,
      status: "EXCECAO" as const,
      ms: Date.now() - t0,
      erro: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  }
}

export async function GET() {
  const sondas = await Promise.all([
    sondar(
      "busca",
      `${BASE}/allTimeLeaderboard/search?platform=common-gen5&clubName=flamengo&maxResultCount=200`
    ),
    sondar("ranking", `${BASE}/allTimeLeaderboard?platform=common-gen5`),
    sondar("settings", `${BASE}/settings`),
    sondar("info", `${BASE}/clubs/info?platform=common-gen5&clubIds=5053340`),
    // Controle: um destino público qualquer. Se ESTE também falhar, o problema
    // é a saída de rede da função, não a EA.
    sondar("controle", "https://api.github.com/zen"),
  ]);

  const saudavel = sondas.filter((s) => s.ok).length;

  return NextResponse.json(
    {
      saudavel,
      total: sondas.length,
      runtime: process.env.NEXT_RUNTIME ?? "node",
      regiao: process.env.AWS_REGION ?? process.env.NETLIFY_REGION ?? null,
      quando: new Date().toISOString(),
      sondas,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

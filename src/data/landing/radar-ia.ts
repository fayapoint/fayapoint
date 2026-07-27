/**
 * A pontuação do IA Trend — a mesma fórmula do `PRODUCAO/scripts/radar.py`.
 *
 * Vive fora dos componentes porque a home e a página `/radar` precisam da
 * MESMA leitura. Enquanto isto morava só dentro do `RadarSection`, a `/radar`
 * não tinha ranking de IA nenhum: o botão "IA Trend" de lá só rolava a página
 * até uma contagem de canais. Duas telas mostrando o mesmo radar não podem ter
 * duas implementações.
 */
import type { AssuntoAberto } from "@/components/radar/ModalAssunto";
import type { Nicho, TermoRadar } from "@/data/landing/radar-nichos";

export type FonteId = "web" | "yt" | "noticias";

/** Um tema no noticiário de hoje pesa mais — é o mesmo sinal do IA Hoje. */
export const PESO_NOTICIA = 1.35;

export interface LinhaIa extends TermoRadar {
  nota: number;
  naNoticia: boolean;
}

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const VAZIAS = new Set([
  "para", "como", "mais", "sobre", "voce", "seus", "isso", "esse", "essa", "pelo",
  "pela", "uma", "dos", "das", "que", "nao", "com", "sem", "ainda", "agora", "hoje",
  "melhor", "melhores", "novo", "nova", "sao", "pode", "todo", "toda", "gratis",
  "inteligencia", "artificial", "generativa",
]);

/** Palavras com carga semântica — usadas para cruzar termo × manchete do dia. */
export function palavrasUteis(texto: string): string[] {
  return semAcento(texto.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 5 && !VAZIAS.has(p));
}

/**
 * A nota de um termo dadas as fontes ligadas.
 *
 * Desligar uma fonte não é filtrar a lista: é recalcular como se o radar
 * tivesse consultado um canal só. Por isso o peso do YouTube (1,2×) e o bônus
 * de confirmação nos dois canais (1,6×) somem junto — é o controle na mão do
 * visitante, não um checkbox decorativo.
 */
export function recalcular(t: TermoRadar, fontes: Set<FonteId>, naNoticia: boolean): number | null {
  const usaWeb = fontes.has("web") && t.web > 0;
  const usaYt = fontes.has("yt") && t.yt > 0;
  if (!usaWeb && !usaYt) return null;
  const pWeb = usaWeb && t.posWeb !== null ? Math.max(0, 10 - t.posWeb) : 0;
  const pYt = usaYt && t.posYt !== null ? Math.max(0, 10 - t.posYt) * 1.2 : 0;
  const ambos = usaWeb && usaYt ? 1.6 : 1;
  let score = (pWeb + pYt) * ambos + t.sementes.length * 1.5;
  if (fontes.has("noticias") && naNoticia) score *= PESO_NOTICIA;
  return Math.round(score * 10) / 10;
}

/** Vocabulário das manchetes de hoje, para saber se o termo está no noticiário. */
export function vocabularioDe(noticias: Array<{ title: string; summary?: string | null }>): Set<string> {
  const v = new Set<string>();
  for (const n of noticias) for (const p of palavrasUteis(`${n.title} ${n.summary ?? ""}`)) v.add(p);
  return v;
}

/** O ranking pronto para a tela. */
export function rankearIa(
  termos: TermoRadar[],
  fontes: Set<FonteId>,
  vocabulario: Set<string>,
  limite: number
): LinhaIa[] {
  const saida: LinhaIa[] = [];
  for (const t of termos) {
    const naNoticia = palavrasUteis(t.termo).some((p) => vocabulario.has(p));
    const nota = recalcular(t, fontes, naNoticia);
    if (nota === null) continue;
    saida.push({ ...t, nota, naNoticia });
  }
  saida.sort((a, b) => b.nota - a.nota);
  return saida.slice(0, limite);
}

/**
 * Para onde a linha do IA Trend leva.
 *
 * O termo veio do autocomplete de um canal; o link honesto é a busca daquele
 * canal pelo termo — quem clica vê exatamente o que nós medimos, não uma
 * página nossa fingindo ser a fonte.
 */
export function linkDaBusca(termo: string, canais: TermoRadar["canais"]): { url: string; veiculo: string } {
  const q = encodeURIComponent(termo);
  return canais === "yt"
    ? { url: `https://www.youtube.com/results?search_query=${q}`, veiculo: "YouTube" }
    : { url: `https://www.google.com/search?q=${q}`, veiculo: "Google" };
}

/**
 * Um termo do IA Trend no formato do painel de assunto.
 *
 * O painel é o mesmo do World Trend de propósito: clicar numa linha faz a
 * mesma coisa nas duas leituras. O que muda é o conteúdo, porque as grandezas
 * são diferentes — lá é volume numa janela, aqui é nota e canal.
 */
export function assuntoDeIa(l: LinhaIa, nicho: Nicho): AssuntoAberto {
  const { url, veiculo } = linkDaBusca(l.termo, l.canais);
  return {
    titulo: l.termo,
    fonte: "ia",
    volume: 0,
    volumeRotulo: `nota ${l.nota.toFixed(1)}`,
    contexto: l.formato,
    url,
    veiculo,
    temIa: true,
    ia: {
      nota: l.nota,
      canais: l.canais,
      posWeb: l.posWeb,
      posYt: l.posYt,
      sementes: l.sementes.length,
      naNoticia: l.naNoticia,
      nicho: nicho.label,
      ponte: nicho.ponte,
    },
  };
}

/**
 * A LINHA DO TEMPO DA SUPER COPA — a história da competição, dia a dia.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/copa-timeline.ts
 *
 * ## Por que isto existe
 *
 * A página tinha tabela, chaveamento e súmula, e não tinha HISTÓRIA. Quem chega
 * procurando pela copa quer saber o que aconteceu — quem caiu, quem virou, em
 * que noite a coisa decidiu — e nada disso se reconstrói de uma tabela de
 * pontos. É também o que dá à página texto original o bastante para existir
 * numa busca: uma grade de números não ranqueia, e nem deveria.
 *
 * ## A regra de escrita
 *
 * Cada entrada é um FATO com data. Nada de previsão, nada de "provavelmente",
 * nada de adjetivo que a origem não sustente. Quando a série foi 3 × 2, o texto
 * diz 3 × 2 — não diz "vitória apertada" se ninguém mediu o aperto.
 *
 * O que a redação PODE fazer é ligar fatos que já estão aqui: se o Ice Nuggets
 * ganhou de um e perdeu de três na mesma semana, dizer isso é aritmética sobre
 * dados publicados, não invenção.
 *
 * ## Por que escrito à mão
 *
 * Mesma razão de `copa-fase.ts` e `copa-fontes.ts`: cada linha corresponde a um
 * anúncio que alguém leu, e a data é a do anúncio. Um raspador transformaria
 * isso em texto sem responsável, e mudaria de sentido sozinho no dia em que a
 * origem trocasse de layout.
 *
 * ⚠️ MD5: os placares de série vão até 3 (3×0, 3×1, 3×2). Não são placares de
 * partida. Confundir os dois publicaria um 3 × 2 que ninguém jogou.
 */

import mongoose from "mongoose";
import dbConnect from "../../src/lib/mongodb";
import GameCopa from "../../src/models/GameCopa";

const SLUG = "super-copa-dos-streamers";

/** Meio-dia UTC para a data não escorregar de dia no fuso do Brasil. */
const dia = (d: string) => new Date(`${d}T15:00:00Z`);

type Entrada = {
  em: Date;
  tipo: "marco" | "resultado" | "classificacao" | "eliminacao" | "destaque" | "anuncio";
  titulo: string;
  texto: string;
  times?: string[];
};

const LINHA: Entrada[] = [
  {
    em: dia("2026-08-10"),
    tipo: "marco",
    titulo: "Os 20 times são revelados",
    texto:
      "A organização apresenta os clubes da segunda edição e os streamers que presidem cada um. São 20 times e mais de 150 criadores em campo — a maior formação já reunida num campeonato brasileiro de Pro Clubs. Coringa, Nobru, Kosky e Dona estão entre os presidentes.",
  },
  {
    em: dia("2026-08-14"),
    tipo: "marco",
    titulo: "O sorteio divide a copa em quatro grupos",
    texto:
      "Os 20 clubes são distribuídos em quatro grupos de cinco, ao vivo. O formato: turno único dentro do grupo, cada confronto em MD5 — melhor de cinco partidas —, e os dois melhores de cada grupo avançam ao mata-mata. Grupo A com Narizes, Botafofo, Aura, Pecinhas e Loló; B com Apeludos, Cobra Del Toro, Ice Nuggets, Al Ralin e Tokovoip; C com Equipe X, Bala de Munich, Low Profile, Radiantas e Kosky Corp; D com Osempic do Marcelo, Raposo, Las Mulas, Real Cangaço e Real Gotis.",
  },
  {
    em: dia("2026-08-16"),
    tipo: "marco",
    titulo: "A bola rola na fase de grupos",
    texto:
      "Começa a fase de classificação, com jogos concentrados à noite e transmissão pelos canais dos próprios presidentes. Cada confronto MD5 queima uma noite inteira: cinco partidas entre os mesmos dois clubes, decididas em série.",
  },
  {
    em: dia("2026-08-27"),
    tipo: "resultado",
    titulo: "Cobra Del Toro atropela e carimba a vaga",
    texto:
      "Duas séries em sequência decidem o Grupo B. O Cobra Del Toro passa pelo Al Ralin por 3 × 0 — série varrida, sem devolver um jogo — e no mesmo movimento elimina a resistência do Ice Nuggets por 3 × 1. É o primeiro time da edição a garantir presença nas quartas de final.",
    times: ["Cobra Del Toro FC", "Al Ralin FC", "Ice Nuggets"],
  },
  {
    em: dia("2026-08-28"),
    tipo: "resultado",
    titulo: "A noite em que o Ice Nuggets levou e devolveu",
    texto:
      "Vinte e quatro horas resumem a campanha do Ice Nuggets: perde para o Al Ralin por 3 × 1 e, na sequência, vence o Tokovoip por 3 × 2 numa série que foi até o quinto jogo. O clube sai do dia vivo, e com o saldo do grupo dependendo de terceiros.",
    times: ["Ice Nuggets", "Al Ralin FC", "Tokovoip FC"],
  },
  {
    em: dia("2026-08-29"),
    tipo: "eliminacao",
    titulo: "Tokovoip FC está eliminado",
    texto:
      "A derrota para o Ice Nuggets na véspera cobra o preço: o Tokovoip é o primeiro clube matematicamente fora da segunda edição. O Grupo B fecha com Cobra Del Toro e Apeludos disputando as duas vagas.",
    times: ["Tokovoip FC"],
  },
  {
    em: dia("2026-08-30"),
    tipo: "classificacao",
    titulo: "Equipe X e Botafofo avançam na mesma noite",
    texto:
      "O Equipe X bate o Radiantas por 3 × 1 e assume o Grupo C. Poucas horas depois, o Botafofo faz 3 × 1 no Aura FC e garante a vaga do Grupo A — a mesma série que decreta a eliminação do Aura. Fecham o dia também o Raposo, que passa pelo Real Cangaço por 3 × 2, e o Osempic do Marcelo, 3 × 1 sobre o Las Mulas. Low Profile FC também é eliminado.",
    times: ["Equipe X FC", "Botafofo", "Radiantas FC", "Aura FC", "Raposo FC", "Real Cangaço FC", "Osempic do Marcelo", "Las Mulas EC", "Low Profile FC"],
  },
  {
    em: dia("2026-08-31"),
    tipo: "classificacao",
    titulo: "O dia que definiu metade do chaveamento",
    texto:
      "O Ice Nuggets vence o Apeludos por 3 × 2 e não é suficiente: o Apeludos avança assim mesmo, e o Ice Nuggets está eliminado — a série mais cruel da fase, ganha por quem foi para casa. No mesmo dia saem as vagas do Raposo e do Osempic do Marcelo, com Real Cangaço e Las Mulas eliminados. A organização publica a prévia do calendário do mata-mata.",
    times: ["Ice Nuggets", "Apeludos FC", "Raposo FC", "Osempic do Marcelo", "Real Cangaço FC", "Las Mulas EC"],
  },
  {
    em: dia("2026-09-02"),
    tipo: "destaque",
    titulo: "PIETRIIN7 e Fontinnele são os destaques da rodada",
    texto:
      "Com a fase de grupos no fim, a organização premia os dois nomes individuais da última rodada. Numa competição em que 150 pessoas dividem o campo, o destaque individual é um dos poucos holofotes que cabem a quem não preside clube.",
  },
  {
    em: dia("2026-09-03"),
    tipo: "marco",
    titulo: "Fase de grupos encerrada e sorteio do mata-mata",
    texto:
      "A fase de classificação termina com oito clubes de pé: Narizes FC, Botafofo, Cobra Del Toro FC, Apeludos FC, Equipe X FC, Bala de Munich, Osempic do Marcelo e Raposo FC. O sorteio das eliminatórias é feito ao vivo e define as quartas: Bala de Munich × Raposo, Apeludos × Equipe X, Cobra Del Toro × Narizes e Osempic do Marcelo × Botafofo. Daqui em diante cada confronto é MD3, e quem perde acaba a edição.",
    times: ["Narizes FC", "Botafofo", "Cobra Del Toro FC", "Apeludos FC", "Equipe X FC", "Bala de Munich", "Osempic do Marcelo", "Raposo FC"],
  },
  {
    em: new Date("2026-09-08T01:00:00Z"), // seg. 07/09, 22:00 BRT
    tipo: "resultado",
    titulo: "Botafofo elimina o Osempic e é o primeiro semifinalista",
    texto:
      "Primeira série das quartas: o Botafofo vence o Osempic do Marcelo por 3 × 1 e abre a semifinal da segunda edição. Os outros três confrontos das quartas seguem sem data publicada.",
    times: ["Botafofo", "Osempic do Marcelo"],
  },
];

async function main() {
  await dbConnect();
  const copa = await GameCopa.findOne({ slug: SLUG });
  if (!copa) {
    console.error("⛔ copa não encontrada — rode copa-coletar.ts primeiro");
    process.exit(1);
  }

  // Todo nome citado tem de existir na copa. Um erro de digitação aqui vira
  // uma entrada que a tela não consegue ligar a time nenhum, calada.
  const nomes = new Set(copa.times.map((t) => t.nome));
  const desconhecidos = [...new Set(LINHA.flatMap((e) => e.times ?? []))].filter((n) => !nomes.has(n));

  const ordenada = LINHA.slice().sort((a, b) => a.em.getTime() - b.em.getTime());
  copa.linhaDoTempo = ordenada as never;
  await copa.save();

  console.log(`\nLINHA DO TEMPO — ${copa.nome}\n`);
  for (const e of ordenada) {
    console.log(`   ${new Date(e.em).toLocaleDateString("pt-BR")}  [${e.tipo.padEnd(13)}] ${e.titulo}`);
  }
  console.log(`\n   ${LINHA.length} entradas · ${LINHA.reduce((n, e) => n + e.texto.length, 0)} caracteres de texto`);

  if (desconhecidos.length > 0) {
    console.log(`\n   ⚠️  nome(s) citados que não existem na copa: ${desconhecidos.join(", ")}`);
  }

  await mongoose.disconnect();
  process.exit(desconhecidos.length > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

/**
 * O QUE AS FONTES DIZEM, E O QUE SAIU NA IMPRENSA — 08/09/2026.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/copa-fontes.ts
 *
 * ## Por que isto é um script curado e não um raspador
 *
 * Raspar cinco sites de campeonato daria um raspador quebrado por semana — a
 * marcação muda, e o dado que interessa (quantos times, qual formato) vive em
 * texto corrido, não em tabela. Pior: um raspador silencioso publicaria número
 * errado sem ninguém notar.
 *
 * Então a leitura é feita por quem sabe ler, e o que entra aqui carrega **a
 * data em que foi lido** e **o link para conferir**. Reler é rodar de novo.
 *
 * ## O achado que justifica a seção existir
 *
 * As fontes NÃO CONCORDAM entre si. Umas publicam **20 times em 4 grupos de
 * 5**; o anúncio original e parte da cobertura falam em **16 times em 4 grupos
 * de 4**. As duas falam da mesma copa, no mesmo mês.
 *
 * Escolher uma e apresentar como fato seria inventar autoridade que não temos.
 * Mostrar as duas, lado a lado, com data e link — isso ninguém faz, e é o
 * produto.
 */
import mongoose from "mongoose";
import dbConnect from "../../src/lib/mongodb";
import GameCopa from "../../src/models/GameCopa";

const SLUG = "super-copa-dos-streamers";
const HOJE = new Date("2026-09-08T19:00:00Z");

/** O que cada fonte afirma. Campos livres — cada site publica o que quer. */
const DECLARACOES = [
  {
    fonte: "copastreamers.com.br",
    url: "https://copastreamers.com.br/",
    afirma: {
      times: 20,
      grupos: 4,
      "times por grupo": 5,
      "formato do confronto": "MD5 na fase de grupos, MD3 no mata-mata",
      "líder do grupo A": "Narizes FC, 12 pontos",
      artilheiro: "DG (Bala de Munich), 13 gols",
      início: "16/08/2026",
    },
    lidoEm: HOJE,
  },
  {
    fonte: "streammersleague.com",
    url: "https://streammersleague.com/",
    afirma: {
      times: 20,
      grupos: 4,
      presidentes: "Coringa (Victor Augusto), Kosky (Matheus Kosky), Dona (Guilherme Donatangelo)",
      "líder do grupo A": "Narizes FC, 12 pontos",
      artilheiros: "Cris Guedes e DG, 13 gols cada",
    },
    lidoEm: HOJE,
  },
  {
    fonte: "Anúncio original (Plantão das Lives / X)",
    url: "https://x.com/plantaodaslives/status/2086280246173503856",
    afirma: {
      times: 16,
      criadores: "mais de 150",
      "⚠️ divergência": "o anúncio fala em 16 times; os sites de tabela publicam 20",
    },
    lidoEm: HOJE,
  },
  {
    fonte: "Quenty",
    url: "https://quenty.com.br/resumo/9-agosto-2026/coringa-dona-e-kosky-levam-campeonato-de-pro-clubs-a-100-mil-espectadores-ao-vivo",
    afirma: {
      "pico de audiência": "100 mil espectadores simultâneos na apresentação",
      grupos: "4 grupos de 4 nomes, pela divisão de streamers",
    },
    lidoEm: HOJE,
  },
  {
    fonte: "Winners 22 (nós) — API pública da EA",
    afirma: {
      "times ligados ao clube na EA": 13,
      "confrontos observados": 16,
      "partidas com súmula": 57,
      "o que medimos": "placar e estatística por jogador, direto da fonte que a EA publica",
      "o que NÃO medimos": "qual partida foi oficial e qual foi treino — a EA não distingue",
    },
    lidoEm: HOJE,
  },
];

const NOTICIAS = [
  {
    titulo: "Sorteio da fase final será no Allianz Parque",
    fonte: "YouTube · Coringa, Dona e Kosky",
    url: "https://www.youtube.com/watch?v=tF2_GWKOSek",
    em: new Date("2026-09-01T00:00:00Z"),
    resumo:
      "Os três presidentes anunciam o sorteio do mata-mata em evento presencial no estádio do Palmeiras.",
  },
  {
    titulo: "Copa de Pro Clubs reúne 100 mil espectadores ao vivo",
    fonte: "Quenty",
    url: "https://quenty.com.br/resumo/9-agosto-2026/coringa-dona-e-kosky-levam-campeonato-de-pro-clubs-a-100-mil-espectadores-ao-vivo",
    em: new Date("2026-08-09T00:00:00Z"),
    resumo:
      "A apresentação do campeonato bateu 100 mil espectadores simultâneos, segundo o anúncio.",
  },
  {
    titulo: "Coringa, Dona e Kosky anunciam os times da Supercopa",
    fonte: "YouTube",
    url: "https://www.youtube.com/watch?v=RoicMs5sC4k",
    em: new Date("2026-08-10T00:00:00Z"),
    resumo: "A revelação dos elencos, com os capitães de cada clube.",
  },
  {
    titulo: "Como foi o sorteio da fase de grupos",
    fonte: "YouTube · LOUD Coringa",
    url: "https://www.youtube.com/watch?v=T1Oknja8R_4",
    em: new Date("2026-08-14T00:00:00Z"),
    resumo: "A definição dos quatro grupos, ao vivo.",
  },
  {
    titulo: "A copa dos streamers pode mudar o Pro Clubs",
    fonte: "YouTube",
    url: "https://www.youtube.com/watch?v=nPg8BLgKffw",
    em: new Date("2026-08-20T00:00:00Z"),
    resumo: "Análise do impacto do torneio sobre a cena de Clubs no Brasil.",
  },
];

async function main() {
  await dbConnect();
  const copa = await GameCopa.findOne({ slug: SLUG });
  if (!copa) {
    console.error("⛔ copa não encontrada — rode copa-coletar.ts primeiro");
    process.exit(1);
  }
  copa.declaracoes = DECLARACOES as never;
  copa.noticias = NOTICIAS as never;
  /**
   * ⛔ NÃO carimbe `oficialCapturadaEm` aqui.
   *
   * Este script grava o que as fontes DECLARAM e as notícias. Ele não lê a
   * tabela de classificação da organização — e `oficialCapturadaEm` quer dizer
   * exatamente "quando a tabela oficial foi lida do site".
   *
   * Carimbar mesmo assim fez o painel da Federação anunciar, em 08/09,
   * "Tabela declarada: capturada em 08/09/2026, 16:00:00" com
   * `classificacaoOficial` em ZERO linhas. Data de captura de uma captura que
   * nunca houve — a mesma família de defeito do painel que declarava receita
   * que não existia. Quem carimbar tem de ser quem escrever as linhas.
   */
  await copa.save();
  console.log(
    `✓ ${DECLARACOES.length} declaração(ões) de fonte e ${NOTICIAS.length} notícia(s) gravadas`
  );
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(`⛔ ${e instanceof Error ? e.message : e}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

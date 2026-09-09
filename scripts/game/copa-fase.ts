/**
 * A FASE DECLARADA DA COPA — o que a organização anunciou. 08/09/2026.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/copa-fase.ts
 *
 * ## Por que isto é um script com valores escritos à mão
 *
 * Porque o que ele grava é DECLARAÇÃO, não medida. A organização publica a fase
 * e as classificações em posts, e cada linha aqui corresponde a um anúncio que
 * alguém leu, com a data em que ele saiu. Um raspador automático transformaria
 * isso numa leitura contínua sem responsável — e no dia em que o site mudasse de
 * layout, gravaria silêncio como se fosse "ninguém se classificou".
 *
 * Escrever à mão custa dez minutos por rodada e deixa cada afirmação com
 * procedência. É a mesma escolha de `copa-fontes.ts`.
 *
 * ## O que NÃO fazemos aqui
 *
 * ⛔ Não inferimos. A leitura de 08/09 achou seis times declarados classificados
 * e seis declarados eliminados. Os outros oito ficam `indefinido` — que quer
 * dizer "a organização não declarou nada sobre eles no que lemos", e não "ainda
 * estão vivos". Completar a conta com dedução (20 − 6 − 6 = 8 sobrando, logo…)
 * seria publicar como fato uma aritmética nossa.
 *
 * ⛔ Não gravamos `classificacaoOficial` sem a tabela. A organização não publica
 * a tabela de pontos por grupo; só o líder geral. Carimbar `oficialCapturadaEm`
 * sem linhas foi exatamente o defeito corrigido hoje de manhã.
 */

import mongoose from "mongoose";
import dbConnect from "../../src/lib/mongodb";
import GameCopa from "../../src/models/GameCopa";

const SLUG = "super-copa-dos-streamers";

/** Quando esta leitura foi feita. Toda afirmação abaixo carrega esta data. */
const LIDO_EM = new Date("2026-09-08T22:00:00Z");

/**
 * A fase, como a organização a descreve.
 *
 * Medido na leitura de 08/09: a fase de classificação terminou e o sorteio das
 * eliminatórias foi anunciado em 03/09.
 */
const FASE = "Mata-mata (quartas de final)";

/**
 * Data do anúncio que estabeleceu a fase — não a data da leitura.
 *
 * Meio-dia UTC de propósito: com `T00:00:00Z`, o Brasil (UTC−3) lê 02/09 e a
 * tela publicaria a data errada do anúncio. Data de fato não pode depender do
 * fuso de quem abre a página.
 */
const FASE_EM = new Date("2026-09-03T12:00:00Z");

/**
 * O nome como NÓS o guardamos → a situação declarada.
 *
 * A chave é o nosso nome porque é ele que identifica o time no documento. A
 * grafia da organização varia entre posts ("Ice Nugets", "Osempic FC",
 * "Real Cangaços"), e casar por grafia exata quebraria na próxima rodada.
 */
const CLASSIFICADOS = [
  "Bala de Munich",
  "Raposo FC",
  "Apeludos FC",
  "Equipe X FC",
  "Cobra Del Toro FC",
  "Narizes FC",
  "Osempic do Marcelo",
  "Botafofo",
];

/**
 * OS CONFRONTOS DAS QUARTAS, como a organização publica.
 *
 * ⚠️ `Bala de Munich 0 × 0 Raposo FC` está publicado assim no chaveamento
 * deles — e NÃO é um empate: é o estado inicial de um confronto que ainda não
 * começou. Copiar aquele zero a zero para cá publicaria um resultado que não
 * existe. Por isso ele entra SEM placar, como os dois "a agendar".
 *
 * O único placar real publicado até a leitura de 08/09 é Osempic 1 × 3
 * Botafofo, jogado em 07/09 às 22:00.
 */
const CHAVEAMENTO: Array<{
  casa: string;
  fora: string;
  placar?: { casa: number; fora: number };
  quando?: Date;
  quandoTexto?: string;
}> = [
  { casa: "Bala de Munich", fora: "Raposo FC", quandoTexto: "sem data publicada" },
  { casa: "Apeludos FC", fora: "Equipe X FC", quandoTexto: "a agendar" },
  { casa: "Cobra Del Toro FC", fora: "Narizes FC", quandoTexto: "a agendar" },
  {
    casa: "Osempic do Marcelo",
    fora: "Botafofo",
    placar: { casa: 1, fora: 3 },
    quando: new Date("2026-09-08T01:00:00Z"), // seg. 07/09, 22:00 BRT
  },
];

async function main() {
  await dbConnect();
  const copa = await GameCopa.findOne({ slug: SLUG });
  if (!copa) {
    console.error("⛔ copa não encontrada — rode copa-coletar.ts primeiro");
    process.exit(1);
  }

  copa.faseAtual = FASE;
  copa.faseDeclaradaEm = FASE_EM;

  const semCorrespondencia: string[] = [];
  const nomes = new Set(copa.times.map((t) => t.nome));
  for (const nome of [...CLASSIFICADOS, ...CHAVEAMENTO.flatMap((c) => [c.casa, c.fora])]) {
    if (!nomes.has(nome)) semCorrespondencia.push(nome);
  }

  /**
   * O CHAVEAMENTO PUBLICADO FECHA A CONTA — e é por isso que agora dá para
   * marcar os doze restantes como fora sem inferir nada.
   *
   * Na primeira leitura eu tinha seis classificados anunciados um a um e deixei
   * os outros oito como `indefinido`, de propósito: completar por dedução seria
   * publicar aritmética nossa como fato de terceiro.
   *
   * A página do mata-mata resolve isso NA FONTE: ela declara OITO classificados
   * e os nomeia. Quem não está numa lista fechada de oito não se classificou —
   * é o que a própria fonte diz, não conta nossa. Faltavam exatamente dois, e um
   * deles é o Narizes FC, o time do Coringa, que a leitura anterior deixou de
   * fora justamente por não inventar.
   */
  const classificados = new Set(CLASSIFICADOS);
  for (const time of copa.times) {
    time.situacao = classificados.has(time.nome) ? "classificado" : "eliminado";
    time.situacaoEm = LIDO_EM;
  }

  copa.chaveamento = CHAVEAMENTO.map((c) => ({ ...c, fase: "Quartas de final" })) as never;

  await copa.save();

  console.log(`\nFASE — ${copa.nome}\n`);
  console.log(`   fase declarada: ${FASE} (anunciada em ${FASE_EM.toLocaleDateString("pt-BR")})`);
  console.log(`   leitura de ${LIDO_EM.toLocaleDateString("pt-BR")}`);
  const nClass = copa.times.filter((t) => t.situacao === "classificado").length;
  console.log(`
   ${nClass} classificado(s) · ${copa.times.length - nClass} fora · ${CHAVEAMENTO.length} confronto(s) no chaveamento`);
  for (const c of CHAVEAMENTO) {
    const p = c.placar ? `${c.placar.casa} × ${c.placar.fora}` : (c.quandoTexto ?? "sem placar");
    console.log(`      ${c.casa} ${p} ${c.fora}`);
  }

  if (semCorrespondencia.length > 0) {
    // Nome na lista que não casa com time nenhum é ERRO DE DIGITAÇÃO nosso, e
    // precisa gritar: silenciosamente, ele viraria um time sem situação.
    console.log(`\n   ⚠️  ${semCorrespondencia.length} nome(s) da lista não existem na copa: ${semCorrespondencia.join(", ")}`);
    console.log("      Corrija a grafia em CLASSIFICADOS/CHAVEAMENTO — do jeito que está, esses times ficaram sem declaração.");
  }

  await mongoose.disconnect();
  process.exit(semCorrespondencia.length > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

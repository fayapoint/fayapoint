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
const SITUACAO: Record<string, "classificado" | "eliminado"> = {
  // Anunciados classificados para as quartas (27/08 a 31/08).
  "Apeludos FC": "classificado",
  "Raposo FC": "classificado",
  "Osempic do Marcelo": "classificado",
  Botafofo: "classificado",
  "Equipe X FC": "classificado",
  "Cobra Del Toro FC": "classificado",

  // Anunciados eliminados (29/08 a 31/08).
  "Ice Nuggets": "eliminado",
  "Real Cangaço FC": "eliminado",
  "Las Mulas EC": "eliminado",
  "Aura FC": "eliminado",
  "Low Profile FC": "eliminado",
  "Tokovoip FC": "eliminado",
};

async function main() {
  await dbConnect();
  const copa = await GameCopa.findOne({ slug: SLUG });
  if (!copa) {
    console.error("⛔ copa não encontrada — rode copa-coletar.ts primeiro");
    process.exit(1);
  }

  copa.faseAtual = FASE;
  copa.faseDeclaradaEm = FASE_EM;

  let classificados = 0;
  let eliminados = 0;
  let indefinidos = 0;
  const semCorrespondencia: string[] = [];

  for (const nome of Object.keys(SITUACAO)) {
    if (!copa.times.some((t) => t.nome === nome)) semCorrespondencia.push(nome);
  }

  for (const time of copa.times) {
    const s = SITUACAO[time.nome] ?? "indefinido";
    time.situacao = s;
    time.situacaoEm = LIDO_EM;
    if (s === "classificado") classificados++;
    else if (s === "eliminado") eliminados++;
    else indefinidos++;
  }

  await copa.save();

  console.log(`\nFASE — ${copa.nome}\n`);
  console.log(`   fase declarada: ${FASE} (anunciada em ${FASE_EM.toLocaleDateString("pt-BR")})`);
  console.log(`   leitura de ${LIDO_EM.toLocaleDateString("pt-BR")}`);
  console.log(`\n   ${classificados} classificado(s) · ${eliminados} eliminado(s) · ${indefinidos} sem declaração`);

  if (semCorrespondencia.length > 0) {
    // Nome na lista que não casa com time nenhum é ERRO DE DIGITAÇÃO nosso, e
    // precisa gritar: silenciosamente, ele viraria um time sem situação.
    console.log(`\n   ⚠️  ${semCorrespondencia.length} nome(s) da lista não existem na copa: ${semCorrespondencia.join(", ")}`);
    console.log("      Corrija a grafia em SITUACAO — do jeito que está, esses times ficaram sem declaração.");
  }

  await mongoose.disconnect();
  process.exit(semCorrespondencia.length > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

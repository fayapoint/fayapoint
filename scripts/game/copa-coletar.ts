/**
 * COLETOR DA COPA — captura o que a EA vai jogar fora. 08/09/2026.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/copa-coletar.ts
 *     ... --descobrir     (também tenta achar os clubes que faltam)
 *
 * ## Por que ele é urgente e não pode falhar em silêncio
 *
 * A EA guarda **10 partidas amistosas por clube**. Um confronto MD5 queima
 * cinco slots numa noite. **Duas rodadas e o histórico anterior some da fonte
 * para sempre** — não há paginação, não há consulta por id de partida, não há
 * arquivo. Nem a organização da copa recupera: ela depende da mesma API.
 *
 * O que este script grava hoje é o único registro que vai existir amanhã.
 *
 * Isso já foi medido na prática: a varredura pelo grafo de adversários achou
 * 9 dos 20 times e **parou** — os outros 11 jogaram contra esses antes de
 * 10/08 e já tinham saído da janela.
 *
 * ## Como um clube é identificado
 *
 * Os nomes que a organização publica NÃO são os nomes de dentro do jogo:
 * "Osempic do Marcelo" é `OsempicDMarcelo`, "Ice Nuggets" é `ICE NUGETS OFC`
 * (com um G a menos). O casamento é por similaridade, e o desempate é a
 * **assinatura da copa**: amistoso, 11 contra 11, recente. Medido nos 9
 * confrontos confirmados — todos batem.
 */
import mongoose from "mongoose";
import dbConnect from "../../src/lib/mongodb";
import GameCopa from "../../src/models/GameCopa";
import * as EA from "../../src/lib/game/ea-api";
import { gravarPartidas, gravarClubeCompleto } from "../../src/lib/game/espelho";
import { proximidadeDeNome, pareceJogoDeCopa } from "../../src/lib/game/copa";

const SLUG = "super-copa-dos-streamers";
const descobrir = process.argv.includes("--descobrir");

/**
 * A copa, como a organização publica, mais os vínculos já confirmados.
 *
 * Os `eaClubId` daqui foram achados e verificados em 08/09 — cada um com a
 * evidência que o sustenta. Nenhum foi adivinhado pelo nome sozinho.
 */
const SEMENTE = {
  slug: SLUG,
  nome: "Super Copa dos Streamers",
  edicao: "Edição 2",
  jogo: "EA SPORTS FC 26",
  descricao:
    "O maior campeonato de Pro Clubs entre criadores de conteúdo do Brasil: 20 times presididos por streamers, mais de 150 criadores em campo.",
  organizacao: {
    nome: "Super Copa dos Streamers",
    presidentes: ["Coringa", "Kosky", "Dona"],
    sites: [
      "https://copastreamers.com.br/",
      "https://streammersleague.com/",
      "https://streamersleague.pro/",
    ],
  },
  formato: {
    times: 20,
    grupos: 4,
    timesPorGrupo: 5,
    jogosPorConfrontoGrupo: 5,
    jogosPorConfrontoMataMata: 3,
  },
  status: "em-andamento" as const,
  comecouEm: new Date("2026-08-16T00:00:00Z"),
  destaque: true,
  times: [
    // ---- Grupo A ----
    { nome: "Narizes FC", presidente: "Coringa", grupo: "A", eaClubId: "240581", eaClubName: "NARIZES FC",
      vinculo: "confirmado" as const, evidencia: ["achado pelo grafo de adversários a partir de clube confirmado", "21 confrontos com clubes da copa"] },
    { nome: "Botafofo", grupo: "A", eaClubId: "2555456", eaClubName: "BOTAFOFO 77",
      vinculo: "confirmado" as const, evidencia: ["elenco tem jmanella7 (Juninho Manella, capitão anunciado)", "gamertags com prefixo Kick- e TTv--", "série de 3 jogos contra OsempicDMarcelo em 40 min (08/09)"] },
    { nome: "Aura FC", grupo: "A", vinculo: "nao-encontrado" as const, evidencia: [] },
    { nome: "Pecinhas FC", grupo: "A", vinculo: "nao-encontrado" as const, evidencia: [] },
    { nome: "Loló FC", grupo: "A", vinculo: "nao-encontrado" as const, evidencia: [] },
    // ---- Grupo B ----
    { nome: "Cobra Del Toro FC", grupo: "B", eaClubId: "912928", eaClubName: "CobradelTouroFC",
      vinculo: "confirmado" as const, evidencia: ["série contra ICE NUGETS OFC em 01/09", "22 confrontos com clubes da copa"] },
    { nome: "Ice Nuggets", grupo: "B", eaClubId: "2200371", eaClubName: "ICE NUGETS OFC",
      vinculo: "confirmado" as const, evidencia: ["jogou contra CobradelTouroFC e FC APELUDOS", "11v11 amistoso, 120 min"] },
    { nome: "Tokovoip FC", grupo: "B", eaClubId: "39378", eaClubName: "TOKOVOIP FC",
      vinculo: "provavel" as const, evidencia: ["10 amistosos 11v11 desde 10/08 — o homônimo TOKOVOIP [9428057] tem 0"] },
    { nome: "Apeludos FC", presidente: "Nobru", grupo: "B", eaClubId: "78083", eaClubName: "FC APELUDOS",
      vinculo: "confirmado" as const, evidencia: ["33 confrontos com clubes da copa", "jogou contra ICE NUGETS OFC e OsempicDMarcelo"] },
    { nome: "Al Ralin FC", grupo: "B", eaClubId: "2681824", eaClubName: "AL RALIN FC",
      vinculo: "provavel" as const, evidencia: ["9 amistosos 11v11 desde 10/08 — os 3 homônimos têm 0"] },
    // ---- Grupo C ----
    { nome: "Equipe X FC", presidente: "Bak & Thurzin", grupo: "C", eaClubId: "1583726", eaClubName: "EQUIPEX FC",
      vinculo: "confirmado" as const, evidencia: ["achado pelo grafo", "21 confrontos com clubes da copa"] },
    { nome: "Bala de Munich", grupo: "C", eaClubId: "4393152", eaClubName: "BALA DE MUNICH",
      vinculo: "confirmado" as const, evidencia: ["achado pelo grafo", "22 confrontos com clubes da copa"] },
    { nome: "Low Profile FC", grupo: "C", vinculo: "nao-encontrado" as const, evidencia: ["4 homônimos, nenhum com amistoso 11v11 recente"] },
    { nome: "Radiantas FC", grupo: "C", vinculo: "nao-encontrado" as const, evidencia: ["nenhum homônimo com amistoso 11v11 recente"] },
    { nome: "Kosky Corp", presidente: "Kosky", grupo: "C", eaClubId: "7515538", eaClubName: "KOSKY CORP inc",
      vinculo: "provavel" as const, evidencia: ["9 amistosos 11v11 desde 10/08", "⚠️ KOSKY CORP SAF [38459] tem 3 — desempate pendente"] },
    // ---- Grupo D ----
    { nome: "Osempic do Marcelo", presidente: "Caiox", grupo: "D", eaClubId: "3791034", eaClubName: "OsempicDMarcelo",
      vinculo: "confirmado" as const, evidencia: ["série de 3 jogos contra BOTAFOFO 77 em 40 min (08/09)", "28 confrontos com clubes da copa"] },
    { nome: "Raposo FC", presidente: "Fontinnele", grupo: "D", eaClubId: "15736", eaClubName: "Raposos Font",
      vinculo: "provavel" as const, evidencia: ["9 amistosos 11v11 desde 10/08 — os 3 homônimos têm 0", "'Font' bate com Fontinnele, capitão anunciado"] },
    { nome: "Las Mulas EC", grupo: "D", eaClubId: "1644464", eaClubName: "Las Mulas ES",
      vinculo: "confirmado" as const, evidencia: ["elenco tem AD0LFZ_ (Adolfz)", "série de 3 jogos contra OsempicDMarcelo em 31/08"] },
    { nome: "Real Cangaço FC", grupo: "D", vinculo: "nao-encontrado" as const, evidencia: ["3 homônimos, nenhum com amistoso 11v11 recente"] },
    { nome: "Real Gotis 22", grupo: "D", vinculo: "nao-encontrado" as const, evidencia: ["4 homônimos, nenhum com amistoso 11v11 recente"] },
  ],
};

async function semear() {
  const existe = await GameCopa.findOne({ slug: SLUG });
  if (existe) {
    // Não sobrescreve vínculo já confirmado: o operador pode ter corrigido à
    // mão, e a semente é um ponto de partida, não a verdade.
    for (const t of SEMENTE.times) {
      const atual = existe.times.find((x) => x.nome === t.nome);
      if (!atual) {
        existe.times.push({ ...t, vinculadoEm: new Date() });
        continue;
      }
      if (atual.vinculo === "confirmado") continue;
      Object.assign(atual, t, { vinculadoEm: new Date() });
    }
    await existe.save();
    return existe;
  }
  return GameCopa.create({
    ...SEMENTE,
    times: SEMENTE.times.map((t) => ({ ...t, vinculadoEm: new Date() })),
  });
}

/** Captura elenco, campanha e partidas de um clube, e grava no espelho. */
async function capturar(clubId: string, plataforma: EA.EaPlatform = "common-gen5") {
  const [info, tabela, members, career, stats] = await Promise.all([
    EA.clubInfo(clubId, plataforma),
    EA.linhaDoClube(clubId, plataforma).catch(() => null),
    EA.clubMembersStats(clubId, plataforma).catch(() => []),
    EA.clubMembersCareer(clubId, plataforma).catch(() => []),
    EA.clubOverallStats(clubId, plataforma).catch(() => null),
  ]);
  if (info) {
    await gravarClubeCompleto({ info, stats, members, career, tabela });
  }
  const partidas = await EA.clubMatchesTodas(clubId, plataforma);
  const gravadas = await gravarPartidas(partidas, plataforma);
  const deCopa = partidas.filter((p) => pareceJogoDeCopa(p as never)).length;
  return { total: partidas.length, gravadas, deCopa, elenco: members.length };
}

/**
 * Tenta achar os clubes que faltam, pela busca + assinatura da copa.
 *
 * Só promove a `provavel`, nunca a `confirmado`: nome parecido e assinatura
 * batendo é indício forte, mas confirmação exige ver o clube jogando contra
 * outro clube já confirmado. Essa promoção é feita na próxima passada, quando
 * a partida aparecer no espelho.
 */
async function descobrirFaltantes(copa: InstanceType<typeof GameCopa>) {
  const pendentes = copa.times.filter((t) => !t.eaClubId);
  if (pendentes.length === 0) return 0;
  console.log(`\nDescobrindo ${pendentes.length} time(s) sem vínculo…`);
  let achados = 0;

  for (const time of pendentes) {
    let melhor: { c: EA.ClubSearchResult; sinal: number; prox: number } | null = null;
    try {
      const r = await EA.buscarClubes(time.nome);
      for (const c of r.clubes.slice(0, 6)) {
        if (c.gamesPlayed < 5) continue;
        const prox = proximidadeDeNome(c.name, time.nome);
        if (prox < 0.6) continue;
        const ps = await EA.clubMatchesTodas(c.clubId, c.platform).catch(() => []);
        const sinal = ps.filter(
          (p) => pareceJogoDeCopa(p as never) && p.timestamp * 1000 > Date.parse("2026-08-10")
        ).length;
        if (sinal === 0) continue;
        if (!melhor || sinal > melhor.sinal) melhor = { c, sinal, prox };
      }
    } catch { /* clube pode não existir; segue */ }

    if (!melhor) {
      console.log(`   — ${time.nome}: nenhum candidato com assinatura de copa`);
      continue;
    }
    time.eaClubId = melhor.c.clubId;
    time.eaClubName = melhor.c.name;
    time.eaPlatform = melhor.c.platform;
    time.vinculo = "provavel";
    time.evidencia = [
      `${melhor.sinal} amistoso(s) 11v11 desde 10/08`,
      `nome ${(melhor.prox * 100).toFixed(0)}% parecido com "${time.nome}"`,
    ];
    time.vinculadoEm = new Date();
    achados++;
    console.log(`   ✓ ${time.nome} → ${melhor.c.name} [${melhor.c.clubId}] (${melhor.sinal} sinais)`);
  }
  if (achados > 0) await copa.save();
  return achados;
}

async function main() {
  await dbConnect();
  console.log("\nCOPA — Super Copa dos Streamers");

  const copa = await semear();
  if (descobrir) await descobrirFaltantes(copa);

  const comClube = copa.times.filter((t) => t.eaClubId);
  console.log(`\n${comClube.length}/${copa.times.length} time(s) com clube vinculado. Capturando…`);

  let partidasDeCopa = 0;
  let falhas = 0;
  for (const t of comClube) {
    try {
      const r = await capturar(t.eaClubId!, (t.eaPlatform ?? "common-gen5") as EA.EaPlatform);
      partidasDeCopa += r.deCopa;
      console.log(
        `   ✓ ${t.nome.padEnd(20).slice(0, 20)} ${t.eaClubName} — ${r.gravadas} gravada(s), ${r.deCopa} com cara de copa, ${r.elenco} no elenco`
      );
    } catch (e) {
      falhas++;
      console.log(`   ⛔ ${t.nome}: ${(e as Error).message.slice(0, 70)}`);
    }
  }

  const semVinculo = copa.times.filter((t) => !t.eaClubId).map((t) => t.nome);
  console.log(
    `\nResumo — times capturados: ${comClube.length} · partidas de copa vistas: ${partidasDeCopa} · falhas: ${falhas}`
  );
  if (semVinculo.length > 0) {
    console.log(`Sem vínculo ainda (${semVinculo.length}): ${semVinculo.join(", ")}`);
    console.log("   → rode com --descobrir para tentar achá-los pela busca");
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(`⛔ copa: ${e instanceof Error ? e.message : e}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

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
import { fotografarCopa } from "../../src/lib/game/acervo";
import { descobrirAglomerados, apelidoDoAglomerado, guardarAglomerados } from "../../src/lib/game/descoberta";

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
/** Quanto tempo uma busca sem resultado vale antes de valer a pena refazer. */
const VALIDADE_DA_BUSCA_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * ACHAR O CLUBE DE QUEM AINDA NAO TEM — e lembrar do que ja foi descartado.
 *
 * ## O teste que decide e a ADJACENCIA, nao o tipo da partida
 *
 * A primeira versao exigia que o candidato tivesse partidas "com cara de copa"
 * (amistoso 11v11 recente). Medido em 08/09, isso derrubou os 7 que faltam na
 * Super Copa: existem 34 clubes com nomes parecidos, e nenhum tinha a
 * assinatura — inclusive homonimos que jogam 2v2 de rua e apareciam como
 * candidatos so pelo nome.
 *
 * O sinal forte e outro: **o candidato jogou contra um clube que ja sabemos ser
 * da copa**. Isso vale mesmo que a EA tenha classificado a partida como
 * `leagueMatch`, e mesmo que a organizacao jogue em formato diferente do que
 * supomos. Homonimo nao joga contra a copa; o time da copa joga.
 *
 * A assinatura de amistoso 11v11 continua valendo, mas como sinal FRACO — so
 * decide quando ninguem tem adjacencia, e ai o vinculo sai `provavel`.
 *
 * ## Por que guardar a busca que nao achou
 *
 * Cada candidato custa uma chamada de partidas a EA. Refazer os 34 de hora em
 * hora e gastar a fonte para reencontrar o mesmo nada — e o resultado negativo
 * nunca chegava a lugar nenhum, entao a tela dizia "sem vinculo" sem conseguir
 * distinguir "ninguem procurou" de "procuramos, e nao e nenhum destes". Agora a
 * busca vazia fica escrita no time, com data, e so se repete depois de 3 dias
 * (ou na hora, com `--forcar-busca`).
 */
async function descobrirFaltantes(copa: InstanceType<typeof GameCopa>) {
  const forcar = process.argv.includes("--forcar-busca");
  const pendentes = copa.times.filter((t) => !t.eaClubId);
  if (pendentes.length === 0) return 0;

  // Quem ja sabemos que e da copa — a regua da adjacencia.
  const daCopa = new Map<string, string>();
  for (const t of copa.times) if (t.eaClubId) daCopa.set(t.eaClubId, t.nome);

  const agora = Date.now();
  const aBuscar = pendentes.filter(
    (t) => forcar || !t.buscadoEm || agora - new Date(t.buscadoEm).getTime() > VALIDADE_DA_BUSCA_MS
  );
  const dormindo = pendentes.length - aBuscar.length;
  if (aBuscar.length === 0) {
    console.log(`
Descoberta: ${dormindo} time(s) sem vinculo, todos buscados nos ultimos 3 dias. (--forcar-busca refaz)`);
    return 0;
  }
  console.log(`
Descobrindo ${aBuscar.length} time(s) sem vinculo…${dormindo ? ` (${dormindo} em descanso de busca)` : ""}`);
  let achados = 0;
  let mexeu = false;

  for (const time of aBuscar) {
    let melhor: { c: EA.ClubSearchResult; sinal: number; prox: number; contra: string[] } | null = null;
    let candidatos = 0;
    try {
      const r = await EA.buscarClubes(time.nome);
      candidatos = r.clubes.length;
      for (const c of r.clubes.slice(0, 6)) {
        if (c.gamesPlayed < 5) continue;
        const prox = proximidadeDeNome(c.name, time.nome);
        if (prox < 0.6) continue;
        const ps = await EA.clubMatchesTodas(c.clubId, c.platform).catch(() => []);

        // Sinal forte: jogou contra alguem que ja sabemos ser da copa.
        const contra = new Set<string>();
        for (const p of ps)
          for (const cl of p.clubs)
            if (cl.clubId !== c.clubId && daCopa.has(cl.clubId)) contra.add(daCopa.get(cl.clubId)!);

        // Sinal fraco: amistoso 11v11 no periodo da copa.
        const sinal = ps.filter(
          (p) => pareceJogoDeCopa(p as never) && p.timestamp * 1000 > Date.parse("2026-08-10")
        ).length;

        if (contra.size === 0 && sinal === 0) continue;
        const peso = contra.size * 1000 + sinal;
        const pesoAtual = melhor ? melhor.contra.length * 1000 + melhor.sinal : -1;
        if (peso > pesoAtual) melhor = { c, sinal, prox, contra: [...contra] };
      }
    } catch { /* clube pode nao existir; segue */ }

    time.buscadoEm = new Date();
    mexeu = true;
    if (!melhor) {
      time.buscaNota =
        candidatos === 0
          ? "a EA nao devolveu nenhum clube com esse nome"
          : `${candidatos} clube(s) com nome parecido; nenhum jogou contra time da copa nem tem amistoso 11v11 no periodo`;
      console.log(`   — ${time.nome}: ${time.buscaNota}`);
      continue;
    }
    time.buscaNota = undefined;
    time.eaClubId = melhor.c.clubId;
    time.eaClubName = melhor.c.name;
    time.eaPlatform = melhor.c.platform;
    // Adjacencia e prova de identidade; assinatura de amistoso e so indicio.
    time.vinculo = melhor.contra.length > 0 ? "confirmado" : "provavel";
    time.evidencia = [
      ...(melhor.contra.length > 0
        ? [`jogou contra ${melhor.contra.length} time(s) da copa: ${melhor.contra.slice(0, 4).join(", ")}`]
        : []),
      ...(melhor.sinal > 0 ? [`${melhor.sinal} amistoso(s) 11v11 desde 10/08`] : []),
      `nome ${(melhor.prox * 100).toFixed(0)}% parecido com "${time.nome}"`,
    ];
    time.vinculadoEm = new Date();
    achados++;
    console.log(
      `   ✓ ${time.nome} → ${melhor.c.name} [${melhor.c.clubId}] (${melhor.contra.length} adversario(s) da copa, ${melhor.sinal} amistoso(s))`
    );
  }
  // Grava tambem quando so houve busca vazia: o negativo e o que evita repetir.
  if (mexeu) await copa.save();
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

  /* ---- a fotografia do dia ----------------------------------------
     Sem ela, o acumulado ENCOLHE: a EA guarda 10 amistosos por clube e
     uma serie MD5 queima cinco numa noite. O que nao for fotografado
     hoje some da fonte e nao volta. */
  const foto = await fotografarCopa(SLUG);
  console.log(
    `\nAcervo — fotografia de ${foto.dia}: ${foto.times} time(s), ${foto.jogadores} jogador(es)`
  );

  /* ---- a ronda por campeonatos novos -------------------------------
     Nao depende de site nenhum: procura aglomerado de clubes jogando
     amistoso 11v11 em SERIE entre si. Ver src/lib/game/descoberta.ts. */
  const aglomerados = await descobrirAglomerados();
  const novos = aglomerados.filter((a) => !a.jaConhecido);

  /**
   * GRAVAR o achado, e não só imprimi-lo.
   *
   * Antes disto a descoberta terminava aqui, num `console.log`. Se ela achasse
   * a próxima Super Copa às três da manhã, a notícia morreria no `coletar.log`
   * — e no turno seguinte a mesma linha seria reimpressa, para sempre, sem
   * ninguém nunca decidir nada.
   *
   * É a família de defeito que já custou 17 dias de auditoria parada nesta
   * casa: processo automático que só fala com um log.
   */
  const guardado = await guardarAglomerados(novos);

  if (novos.length === 0) {
    console.log(`Descoberta — ${aglomerados.length} aglomerado(s) conhecido(s), nenhum novo`);
  } else {
    console.log(
      `Descoberta — ${novos.length} candidato(s): ${guardado.novos} novo(s), ${guardado.atualizados} já na fila`
    );
    for (const a of novos.slice(0, 5)) {
      console.log(
        `   força ${a.forca} · densidade ${a.densidade} · ${a.clubes.length} clubes · ${a.series} séries — ${apelidoDoAglomerado(a)}`
      );
      console.log(`      ${a.clubes.slice(0, 8).map((c) => c.nome).join(", ")}`);
    }
  }
  if (guardado.novos > 0) {
    console.log(`   ⚠️ ${guardado.novos} candidato(s) NOVO(S) na fila — alguém precisa olhar`);
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(`⛔ copa: ${e instanceof Error ? e.message : e}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

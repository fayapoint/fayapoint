/**
 * ESPELHAR A EA — o coletor que faz o /game funcionar em produção.
 *
 * ## Por que este script existe
 *
 * Medido em 25/08/2026: **`proclubs.ea.com` responde HTTP 403 para IP de
 * datacenter.** Do PC do Ricardo (IP residencial) todos os endpoints respondem
 * 200; da função da Netlify **e** da VPS da Hostinger, 403 em tudo. A seção
 * /game funcionava no desenvolvimento e devolvia lista vazia em produção — e
 * nada na tela dizia por quê.
 *
 * Nenhuma máquina nossa hospedada escapa do bloqueio, então o fluxo se inverte:
 *
 *     este script, de um IP residencial ──▶ Mongo (game_ea_*) ──▶ produção
 *
 * ## O que ele faz
 *
 * Sem argumento: espelha o **ranking global das duas gerações** (200 clubes) —
 * é a lista que dá conteúdo à página mesmo antes de alguém buscar qualquer
 * coisa. Depois, aprofunda os clubes que alguém já reivindicou no site.
 *
 * Com `--nome "<termo>"`: espelha os clubes que casam com o termo. É assim que
 * o seu clube e os dos seus amigos entram na lista.
 *
 * Com `--clube <id>`: captura FUNDA de um clube — elenco, carreira, campanha e
 * as partidas com estatística por jogador.
 *
 * ## Por que a gravação é idempotente e aditiva
 *
 * Tudo é upsert por chave natural (`clubId+platform`, `matchId+platform`).
 * Rodar de novo atualiza e **nunca duplica nem apaga**. Isso importa porque a
 * EA só devolve 10 partidas por tipo e descarta o resto: cada rodada guarda o
 * que a janela mostrava, e o acervo cresce sozinho.
 *
 * ## Rodar
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/espelhar-ea.ts
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/espelhar-ea.ts --nome "leoes do sul"
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/espelhar-ea.ts --clube 5053340
 *     ... --simular      (não grava nada, só mostra o que faria)
 *
 * ⚠️ **Grava por padrão.** Ao contrário dos scripts que mexem no catálogo, aqui
 * o modo seguro é gravar: este é um espelho aditivo em coleções próprias, e o
 * defeito que mais dói num coletor agendado é ele rodar todo dia sem escrever
 * nada porque faltou uma bandeira (ver `reference_tarefa_windows_morta_de_pe`).
 */

import { MongoClient, type AnyBulkWriteOperation, type Document } from "mongodb";
import {
  buscarClubes,
  clubInfo,
  clubOverallStats,
  clubMembersStats,
  clubMembersCareer,
  clubMatchesTodas,
  linhaDoClube,
  rankingGlobal,
  divisoes,
  normalizar,
  PLATAFORMAS,
  type ClubSearchResult,
  type EaPlatform,
} from "../../src/lib/game/ea-api";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI ausente — rode com `node --env-file=.env.local`.");
  process.exit(1);
}

const args = process.argv.slice(2);
const simular = args.includes("--simular");
const valorDe = (bandeira: string): string | null => {
  const i = args.indexOf(bandeira);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
};
/** `--nome "x"` para um termo; `--nomes "a,b,c"` para semear o índice em lote. */
const nomeAlvo = valorDe("--nome");
const nomesEmLote = (valorDe("--nomes") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const clubeAlvo = valorDe("--clube");
/** `--raso` semeia só o índice: sem elenco, sem partidas. 1 ida por termo. */
const raso = args.includes("--raso");
/** Quantos clubes do topo do ranking recebem captura funda. Fundo custa 5 idas cada. */
const fundoTopo = Number(valorDe("--fundo") ?? 0);

const client = new MongoClient(uri, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 15_000,
});
// `client.db()` não abre conexão — a abertura fica no `main()`, porque o tsx
// compila este arquivo para CJS e `await` de topo não existe lá.
const db = client.db("fayapoint");
const colClubes = db.collection("game_ea_clubes");
const colPartidas = db.collection("game_ea_partidas");

const contas = { indice: 0, fundo: 0, partidas: 0, falhas: 0 };

/** A linha de índice: identidade + campanha. Barata, uma ida serve para muitos. */
function opIndice(c: ClubSearchResult & { rank?: number }): AnyBulkWriteOperation<Document> {
  return {
    updateOne: {
      filter: { clubId: c.clubId, platform: c.platform },
      update: {
        $set: {
          name: c.name,
          nomeNormalizado: normalizar(c.name),
          stadName: c.stadName ?? undefined,
          crestAssetId: c.crestAssetId ?? undefined,
          regionId: c.regionId ?? undefined,
          teamId: c.teamId ?? undefined,
          currentDivision: c.currentDivision ?? undefined,
          bestDivision: c.bestDivision ?? undefined,
          skillRating: c.skillRating ?? undefined,
          wins: c.wins,
          ties: c.ties,
          losses: c.losses,
          gamesPlayed: c.gamesPlayed,
          goals: c.goals,
          goalsAgainst: c.goalsAgainst,
          cleanSheets: c.cleanSheets,
          ...(c.rank != null ? { rank: c.rank } : {}),
          sourceGrade: "B",
          capturedAt: new Date(),
          updatedAt: new Date(),
        },
        // Índice NÃO rebaixa um clube que já foi capturado por inteiro.
        $setOnInsert: { profundidade: "indice", createdAt: new Date() },
      },
      upsert: true,
    },
  };
}

async function gravarIndice(clubes: Array<ClubSearchResult & { rank?: number }>) {
  const validos = clubes.filter((c) => c.clubId && c.name && c.name !== "?");
  if (validos.length === 0) return;
  if (simular) {
    contas.indice += validos.length;
    return;
  }
  const r = await colClubes.bulkWrite(validos.map(opIndice), { ordered: false });
  contas.indice += (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
}

/** Captura FUNDA: 5 idas à EA por clube. Só para quem merece. */
async function capturarFundo(clubId: string, plataforma: EaPlatform) {
  const info = await clubInfo(clubId, plataforma);
  if (!info || info.name === "?") {
    contas.falhas += 1;
    return;
  }
  const [stats, members, career, tabela, partidas] = await Promise.all([
    clubOverallStats(clubId, plataforma),
    clubMembersStats(clubId, plataforma),
    clubMembersCareer(clubId, plataforma),
    linhaDoClube(clubId, info.name, plataforma),
    clubMatchesTodas(clubId, plataforma),
  ]);

  if (!simular) {
    await colClubes.updateOne(
      { clubId, platform: plataforma },
      {
        $set: {
          name: info.name,
          nomeNormalizado: normalizar(info.name),
          stadName: info.stadName ?? undefined,
          crestAssetId: info.crestAssetId ?? undefined,
          regionId: info.regionId ?? undefined,
          teamId: info.teamId ?? undefined,
          currentDivision: tabela?.currentDivision ?? undefined,
          bestDivision: tabela?.bestDivision ?? stats?.bestDivision ?? undefined,
          skillRating: tabela?.skillRating ?? stats?.skillRating ?? undefined,
          ...(tabela
            ? {
                wins: tabela.wins,
                ties: tabela.ties,
                losses: tabela.losses,
                gamesPlayed: tabela.gamesPlayed,
                goals: tabela.goals,
                goalsAgainst: tabela.goalsAgainst,
                cleanSheets: tabela.cleanSheets,
              }
            : {}),
          stats: stats ?? undefined,
          members,
          career,
          profundidade: "completo",
          sourceGrade: "B",
          capturedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }
  contas.fundo += 1;

  if (partidas.length > 0) {
    if (simular) {
      contas.partidas += partidas.length;
    } else {
      const r = await colPartidas.bulkWrite(
        partidas
          .filter((p) => p.matchId)
          .map((p) => ({
            updateOne: {
              filter: { matchId: p.matchId, platform: plataforma },
              update: {
                $set: {
                  matchType: p.matchType,
                  timestamp: p.timestamp,
                  jogadaEm: new Date(p.timestamp * 1000),
                  clubIds: p.clubs.map((c) => c.clubId),
                  dados: p,
                  sourceGrade: "B",
                  capturedAt: new Date(),
                  updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
              },
              upsert: true,
            },
          })),
        { ordered: false }
      );
      contas.partidas += (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
    }
  }
  console.log(
    `   ✓ ${info.name} [${clubId}/${plataforma}] — ${members.length} no elenco, ${partidas.length} partidas`
  );
}

/**
 * O corpo do coletor. Vive numa função porque o `tsx` compila este arquivo
 * para CommonJS, onde `await` de topo não existe — sem isto, o esbuild recusa
 * o arquivo inteiro com "Top-level await is currently not supported".
 */
async function main() {
  const comecou = Date.now();
  await client.connect();

  console.log(simular ? "SIMULAÇÃO (nada será gravado)\n" : "ESPELHANDO\n");

  /* ---------------- Modo: um clube só ---------------- */
  if (clubeAlvo) {
    console.log(`Captura funda do clube ${clubeAlvo}, nas duas gerações:`);
    for (const p of PLATAFORMAS) await capturarFundo(clubeAlvo, p);
  }

  /* ---------------- Modo: por nome (um termo ou vários) ---------------- */
  else if (nomeAlvo || nomesEmLote.length > 0) {
    const termos = nomeAlvo ? [nomeAlvo] : nomesEmLote;
    for (const termo of termos) {
      // A busca em leque devolve os que CASAM; para semear o índice queremos
      // tudo que foi varrido, inclusive os "aproximados" — cada clube visto é
      // um clube que a busca da produção passa a encontrar.
      const r = await buscarClubes(termo, { limite: 200 });
      console.log(`"${termo}" → ${r.varridos} varridos, ${r.clubes.length} guardados`);
      await gravarIndice(r.clubes);
      if (raso) continue;
      // O que casou por nome exato ou prefixo merece captura funda: é quase
      // certo que seja o clube que a pessoa procurava.
      const merecem = r.clubes
        .filter((c) => c.match === "exato" || c.match === "prefixo")
        .slice(0, 8);
      for (const c of merecem) await capturarFundo(c.clubId, c.platform);
    }
  }

  /* ---------------- Modo padrão: ranking + clubes reivindicados ---------------- */
  else {
    // As regras das 10 divisões. Estáticas por título e minúsculas, mas caem no
    // mesmo 403 — e sem elas a régua "cai/permanece/sobe" some da produção.
    const regras = await divisoes();
    if (regras.length > 0) {
      if (!simular) {
        await db
          .collection("game_ea_config")
          .updateOne(
            { chave: "divisoes" },
            {
              $set: { valor: regras, capturedAt: new Date(), updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
      }
      console.log(`Regras de divisão: ${regras.length} divisões`);
    } else {
      contas.falhas += 1;
    }

    for (const p of PLATAFORMAS) {
      const linhas = await rankingGlobal(p);
      console.log(`Ranking ${p}: ${linhas.length} clubes`);
      if (linhas.length === 0) contas.falhas += 1;
      await gravarIndice(
        linhas.map((l) => ({
          clubId: l.clubId,
          name: l.name,
          regionId: null,
          teamId: null,
          crestAssetId: null,
          stadName: null,
          platform: l.platform,
          currentDivision: l.currentDivision,
          bestDivision: l.bestDivision,
          skillRating: l.skillRating,
          wins: l.wins,
          ties: l.ties,
          losses: l.losses,
          gamesPlayed: l.gamesPlayed,
          goals: l.goals,
          goalsAgainst: l.goalsAgainst,
          points: 0,
          cleanSheets: l.cleanSheets,
          match: "id" as const,
          rank: l.rank,
        }))
      );

      if (fundoTopo > 0) {
        console.log(`   aprofundando os ${fundoTopo} primeiros de ${p}…`);
        for (const l of linhas.slice(0, fundoTopo)) await capturarFundo(l.clubId, p);
      }
    }

    // Os clubes que alguém já reivindicou no site são os que mais importam:
    // é a página que aquele usuário vai abrir.
    const reivindicados = await db
      .collection("game_clubs")
      .find({ isActive: true })
      .project({ eaClubId: 1, platform: 1 })
      .toArray();
    if (reivindicados.length > 0) {
      console.log(`\nClubes reivindicados no site: ${reivindicados.length}`);
      for (const c of reivindicados) {
        await capturarFundo(String(c.eaClubId), (c.platform ?? "common-gen5") as EaPlatform);
      }
    }
  }

  console.log(
    `\nResumo — índice: ${contas.indice} · captura funda: ${contas.fundo} · partidas: ${contas.partidas} · falhas: ${contas.falhas}`
  );

  /**
   * O PULSO do coletor.
   *
   * Uma tarefa agendada do Windows pode dizer `Ready` e estar morta há dias —
   * já custou três dias de publicação parada sem ninguém notar
   * (`reference_tarefa_windows_morta_de_pe`). O sinal confiável não é o estado
   * da tarefa: é **alguém ter escrito alguma coisa recentemente**.
   *
   * Por isso toda rodada grava aqui quando rodou e quanto trouxe. O
   * `/api/game/ea/diagnostico` lê este documento e diz, em uma linha, se o
   * espelho está sendo alimentado ou se parou — e a idade do dado na tela já
   * denuncia sozinha quando o pulso some.
   */
  if (!simular) {
    await db.collection("game_ea_config").updateOne(
      { chave: "coletor" },
      {
        $set: {
          valor: {
            ...contas,
            duracaoMs: Date.now() - comecou,
            modo: clubeAlvo ? "clube" : nomeAlvo || nomesEmLote.length ? "nome" : "ranking",
            argumentos: args.join(" "),
          },
          capturedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }
  if (contas.indice === 0 && contas.fundo === 0) {
    console.error(
      "\n⚠️ NADA foi espelhado. Se todas as idas à EA deram 403, este computador está\n" +
        "   num IP que a EA bloqueia (datacenter). O coletor precisa rodar de uma\n" +
        "   conexão residencial."
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error("O coletor parou:", err);
  process.exitCode = 1;
  return client.close();
});

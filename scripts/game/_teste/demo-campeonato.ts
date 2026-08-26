/**
 * CAMPEONATO DE DEMONSTRAÇÃO — prova o fluxo inteiro contra o banco de verdade.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/demo-campeonato.ts
 *     ... --apagar     (remove a demonstração)
 *
 * O motor já é provado sem banco em `_teste/motor.ts`. O que ESTE arquivo prova
 * é o outro lado: que os modelos, os índices e o pôster funcionam juntos —
 * inscrição, geração, resultado, avanço do chaveamento, campeão e a imagem.
 *
 * ## Times fictícios, e declarados como tais
 *
 * Os oito times têm nomes inventados de propósito. A tentação seria usar oito
 * clubes reais do nosso acervo, o que deixaria a demonstração mais bonita — e
 * atribuiria placar inventado a clube que existe. Um visitante que reconhece o
 * próprio time num resultado que nunca aconteceu nunca mais confia num número
 * do site. A descrição do campeonato diz, em texto, que é demonstração.
 */

import mongoose from "mongoose";
import GameCompeticao from "../../../src/models/GameCompeticao";
import GameTime from "../../../src/models/GameTime";
import GameConfronto from "../../../src/models/GameConfronto";
import { gerarMataMata, avancarChaveamento, campeao } from "../../../src/lib/game/campeonato";
import { gerarSlug, paraConfrontoMotor } from "../../../src/lib/game/competicao-servidor";

const SLUG_FIXO = "copa-demonstracao-winners22";

const NOMES = [
  ["Meteoro FC", "MET"],
  ["Rebite Atlético", "REB"],
  ["Vento Sul EC", "VSU"],
  ["Cabra Marcada", "CAB"],
  ["Turbina United", "TUR"],
  ["Chuteira de Ouro", "CDO"],
  ["Beira-Linha FC", "BLF"],
  ["Zaga de Ferro", "ZDF"],
];

const ELENCOS = [
  ["Tinho9", "MarcoV", "PedroA", "L_Souza", "Gaguinho"],
  ["RafaZ", "Bibi77", "JotaP", "Kadu", "Neto10"],
  ["Duda_S", "Vini23", "Careca", "Lipe", "Bruninho"],
  ["Zezinho", "Mano_R", "Tuca", "Fabinho", "GK_Leo"],
  ["Turbo", "Nando", "Pepe", "Igor_M", "Xandão"],
  ["Chuchu", "Guto", "Renan", "Alemao", "Piu"],
  ["Beira", "Serginho", "Tato", "Dedé", "Mosca"],
  ["Ferrão", "Muralha", "Kiko", "Juninho", "Balde"],
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI ausente — rode com `node --env-file=.env.local`.");
    process.exit(1);
  }
  // `dbName` explícito: o `lib/mongodb.ts` força "fayapoint" na conexão do
  // site, e sem repetir isso aqui o script cairia no banco que estiver na URI —
  // gravando a demonstração num lugar que a produção não lê.
  await mongoose.connect(uri, { maxPoolSize: 5, dbName: "fayapoint" });

  const apagar = process.argv.includes("--apagar");
  const antiga = await GameCompeticao.findOne({ slug: SLUG_FIXO });
  if (antiga) {
    await Promise.all([
      GameConfronto.deleteMany({ competicaoId: antiga._id }),
      GameTime.deleteMany({ competicaoId: antiga._id }),
      GameCompeticao.deleteOne({ _id: antiga._id }),
    ]);
    console.log("demonstração anterior removida");
  }
  if (apagar) {
    await mongoose.disconnect();
    return;
  }

  // O organizador precisa existir: pega o primeiro admin do banco.
  const users = mongoose.connection.db!.collection("users");
  const dono =
    (await users.findOne({ role: "admin" }, { projection: { _id: 1, email: 1 } })) ??
    (await users.findOne({}, { projection: { _id: 1, email: 1 } }));
  if (!dono) {
    console.error("nenhum usuário no banco para ser o organizador");
    process.exit(1);
  }
  console.log(`organizador: ${dono.email ?? dono._id}`);

  const comp = await GameCompeticao.create({
    slug: SLUG_FIXO || gerarSlug("Copa de Demonstração"),
    nome: "Copa de Demonstração",
    descricao:
      "Campeonato de DEMONSTRAÇÃO, com times e resultados fictícios, para mostrar como a área funciona de ponta a ponta. Nenhum clube real está envolvido.",
    organizadorUserId: dono._id,
    formato: "mata-mata",
    preset: "copa-16",
    plataforma: "common-gen5",
    status: "em-andamento",
    vagas: 8,
    regras: {
      turnos: 1,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: ["pontos", "vitorias", "saldo", "golsPro", "confrontoDireto"],
      idaEVoltaMataMata: false,
    },
    publico: true,
  });

  const times = [];
  for (let i = 0; i < NOMES.length; i++) {
    times.push(
      await GameTime.create({
        competicaoId: comp._id,
        nome: NOMES[i][0],
        sigla: NOMES[i][1],
        origem: "manual",
        semente: i + 1,
        elenco: ELENCOS[i].map((gamertag, j) => ({
          gamertag,
          posicao: ["goalkeeper", "defender", "midfielder", "midfielder", "forward"][j],
          overall: 70 + ((i * 7 + j * 3) % 22),
        })),
        sourceGrade: "E",
      })
    );
  }
  console.log(`${times.length} times inscritos`);

  const novos = gerarMataMata(
    times.map((t) => ({ id: String(t._id), nome: t.nome })),
    false
  );
  await GameConfronto.insertMany(
    novos.map((c) => ({
      competicaoId: comp._id,
      fase: c.fase,
      rodada: c.rodada,
      chave: c.chave ?? undefined,
      perna: c.perna,
      mandanteId: c.mandanteId ?? undefined,
      visitanteId: c.visitanteId ?? undefined,
      status: c.status,
      sourceGrade: "E",
    }))
  );
  console.log(`${novos.length} confrontos gerados`);

  // Joga o torneio inteiro, fase por fase, com placar e súmula.
  const placares = [3, 1, 2, 0, 4, 2, 1, 3, 2, 1, 5, 0, 2, 3];
  let i = 0;
  for (let volta = 0; volta < 4; volta++) {
    const pendentes = await GameConfronto.find({
      competicaoId: comp._id,
      status: "agendado",
      mandanteId: { $exists: true },
      visitanteId: { $exists: true },
      golsMandante: { $exists: false },
    });
    if (pendentes.length === 0) break;

    for (const c of pendentes) {
      const gm = placares[i++ % placares.length];
      let gv = placares[i++ % placares.length];
      if (gm === gv) gv = gm + 1; // mata-mata não termina empatado
      const elencoCasa = times.find((t) => String(t._id) === String(c.mandanteId))!;
      const elencoFora = times.find((t) => String(t._id) === String(c.visitanteId))!;

      await GameConfronto.updateOne(
        { _id: c._id },
        {
          $set: {
            golsMandante: gm,
            golsVisitante: gv,
            status: "confirmado",
            jogadaEm: new Date(),
            destaques: {
              gols: [
                { gamertag: elencoCasa.elenco[4].gamertag, timeId: elencoCasa._id, quantidade: gm },
                { gamertag: elencoFora.elenco[4].gamertag, timeId: elencoFora._id, quantidade: gv },
              ].filter((g) => g.quantidade > 0),
              assistencias: [
                {
                  gamertag: elencoCasa.elenco[3].gamertag,
                  timeId: elencoCasa._id,
                  quantidade: Math.max(1, gm - 1),
                },
              ],
              notas: [...elencoCasa.elenco, ...elencoFora.elenco].map((j, k) => ({
                gamertag: j.gamertag,
                nota: Number((5.8 + ((k * 37) % 40) / 10).toFixed(1)),
                posicao: j.posicao,
              })),
              craque: { gamertag: elencoCasa.elenco[4].gamertag, nota: 8.6 },
            },
          },
        }
      );
    }

    const todos = await GameConfronto.find({ competicaoId: comp._id });
    const mudancas = avancarChaveamento(todos.map(paraConfrontoMotor));
    for (const m of mudancas) {
      await GameConfronto.updateOne(
        { _id: m.id },
        {
          $set: {
            ...(m.mandanteId ? { mandanteId: m.mandanteId } : {}),
            ...(m.visitanteId ? { visitanteId: m.visitanteId } : {}),
          },
        }
      );
    }
    console.log(`  fase ${volta + 1}: ${pendentes.length} jogos, ${mudancas.length} avanços`);
  }

  const finais = await GameConfronto.find({ competicaoId: comp._id });
  const vencedorId = campeao(finais.map(paraConfrontoMotor));
  if (vencedorId) {
    const fin = finais.filter((c) => c.fase === "final");
    const vice = fin
      .flatMap((c) => [String(c.mandanteId), String(c.visitanteId)])
      .find((id) => id && id !== vencedorId);
    await GameCompeticao.updateOne(
      { _id: comp._id },
      { $set: { status: "encerrada", campeaoTimeId: vencedorId, viceTimeId: vice, fimEm: new Date() } }
    );
    const t = times.find((x) => String(x._id) === vencedorId);
    console.log(`\n🏆 CAMPEÃO: ${t?.nome}`);
  } else {
    console.log("\n⚠️ o torneio não fechou — nenhum campeão");
  }

  console.log(`\n/pt-BR/game/campeonato/${comp.slug}`);
  console.log(`/api/game/campeonato/${comp.slug}/premio`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

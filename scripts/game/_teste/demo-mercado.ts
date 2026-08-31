/**
 * MERCADO DE DEMONSTRAÇÃO — popula a vitrine para ela não abrir vazia.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/demo-mercado.ts
 *     ... --apagar     (remove só as vagas de demonstração)
 *
 * Por que existe: uma vitrine de mercado vazia lê como "quebrou", não como
 * "ninguém anunciou ainda" (a mesma armadilha da tabela sem dado). Estas vagas
 * dão ao Ricardo o Mercado JÁ POVOADO para ver o layout, o filtro, as barras de
 * demanda e o cartaz funcionando — e somem com `--apagar` no dia em que gente
 * de verdade começar a anunciar.
 *
 * ## Nomes fictícios, e declarados como tais
 *
 * As vagas de clube usam nomes INVENTADOS de propósito. A tentação seria ligar
 * a um `eaClubId` real do acervo para o card mostrar o selo "medido · EA" — mas
 * isso afirmaria que um clube real está recrutando quando não está, que é o
 * mesmo defeito de atribuir placar inventado a clube que existe. Toda vaga aqui
 * nasce `demo: true` (a tela escreve "Exemplo") e `sourceGrade: 'E'`
 * (declarado). O selo verificado só aparece quando um usuário liga o PRÓPRIO
 * clube da EA.
 */

import mongoose from "mongoose";
import GameVaga from "../../../src/models/GameVaga";
import GameAvaliacao from "../../../src/models/GameAvaliacao";
import { chaveGamertag, CATEGORIAS } from "../../../src/lib/game/reputacao";

const DIAS_TODOS = ["seg", "ter", "qua", "qui", "sex"];
const FDS = ["sex", "sab", "dom"];

const CLUBES: Array<{
  nome: string;
  posicoes: string[];
  div: number;
  v: number;
  e: number;
  d: number;
  plat: string;
  dias: string[];
  horario: string;
  regiao?: string;
  min?: number;
  desc: string;
}> = [
  { nome: "Fronteira TMFC", posicoes: ["VOL", "LAT", "ZAG"], div: 4, v: 61, e: 12, d: 20, plat: "common-gen5", dias: DIAS_TODOS, horario: "20h–23h", regiao: "BR", desc: "Time de amigos, horário fixo. Buscamos foco, compromisso e evolução — jogamos todos os dias a partir das 20h." },
  { nome: "Kmuta FC", posicoes: ["ATA", "PON"], div: 2, v: 118, e: 20, d: 41, plat: "common-gen5", dias: DIAS_TODOS, horario: "21h–00h", regiao: "BR", min: 82, desc: "Divisão 2, subindo. Precisamos de finalizador e ponta rápido. Nível competitivo, sem tolerância a falta." },
  { nome: "Muralha Azul EC", posicoes: ["GOL", "ZAG"], div: 5, v: 33, e: 9, d: 18, plat: "common-gen4", dias: FDS, horario: "20h–22h", regiao: "BR/PT", desc: "Clube de fim de semana, clima leve. Falta goleiro fixo e um zagueiro que jogue a bola." },
  { nome: "Serpente Negra", posicoes: ["MEI", "VOL"], div: 3, v: 74, e: 15, d: 29, plat: "common-gen5", dias: DIAS_TODOS, horario: "22h–01h", regiao: "BR", desc: "Meio-campo é a nossa prioridade. Quem gosta de tocar e armar tem casa aqui." },
  { nome: "Trovão United", posicoes: ["TODAS"], div: 6, v: 12, e: 4, d: 9, plat: "common-gen5", dias: FDS, horario: "19h–22h", regiao: "LATAM", desc: "Clube novo montando o elenco do zero. Todas as posições abertas — venha crescer com a gente." },
  { nome: "Beira-Rio Gaming", posicoes: ["LAT", "PON"], div: 3, v: 88, e: 22, d: 33, plat: "common-gen5", dias: DIAS_TODOS, horario: "20h30–23h30", regiao: "BR", min: 80, desc: "Precisamos das duas laterais e um ponta. Jogamos liga sério de segunda a sexta." },
  { nome: "Fênix Absoluta", posicoes: ["VOL", "ATA"], div: 1, v: 201, e: 30, d: 52, plat: "common-gen5", dias: DIAS_TODOS, horario: "21h–00h", regiao: "BR", min: 85, desc: "Divisão 1. Só entra quem tem overall alto e disponibilidade real. Sem rodízio de horário." },
  { nome: "Canhão do Vale", posicoes: ["ZAG", "MEI"], div: 4, v: 47, e: 11, d: 22, plat: "common-gen4", dias: FDS, horario: "20h–23h", regiao: "BR", desc: "Gen4, clima de amizade e vontade de subir. Falta um zagueiro e um meia box-to-box." },
];

const JOGADORES: Array<{
  gamertag: string;
  estilo?: string;
  posicoes: string[];
  overall: number;
  plat: string;
  dias: string[];
  horario: string;
  regiao?: string;
  desc: string;
}> = [
  { gamertag: "L_Souza99", estilo: "MURALHA", posicoes: ["ZAG"], overall: 87, plat: "common-gen5", dias: DIAS_TODOS, horario: "20h–00h", regiao: "BR", desc: "Zagueiro de marcação, 3 anos de Clubs. Procuro time de divisão 3 ou melhor, horário fixo à noite." },
  { gamertag: "Tinho10", estilo: "MAESTRO", posicoes: ["MEI"], overall: 89, plat: "common-gen5", dias: DIAS_TODOS, horario: "21h–01h", regiao: "BR", desc: "Meia armador, passe e visão. Quero clube competitivo que dispute liga a sério." },
  { gamertag: "GKanela", estilo: "PAREDÃO", posicoes: ["GOL"], overall: 84, plat: "common-gen4", dias: FDS, horario: "19h–22h", regiao: "BR/PT", desc: "Goleiro de fim de semana, reflexo bom. Procuro time tranquilo, sem cobrança tóxica." },
  { gamertag: "Foguinho7", estilo: "FLECHA", posicoes: ["PON", "ATA"], overall: 86, plat: "common-gen5", dias: DIAS_TODOS, horario: "22h–02h", regiao: "BR", desc: "Ponta veloz e finalizador. Disponível quase toda noite. Quero jogar liga e subir divisão." },
  { gamertag: "Bibi_VOL", estilo: "PULMÃO", posicoes: ["VOL"], overall: 85, plat: "common-gen5", dias: DIAS_TODOS, horario: "20h–23h", regiao: "LATAM", desc: "Volante de marcação e saída de bola. Compromisso total, sem faltar em jogo marcado." },
  { gamertag: "RafaLD", posicoes: ["LAT"], overall: 82, plat: "common-gen5", dias: FDS, horario: "20h–23h", regiao: "BR", desc: "Lateral direito, apoio e cruzamento. Prefiro clube de fim de semana, clima leve." },
  { gamertag: "Nando_ZG", estilo: "XERIFE", posicoes: ["ZAG", "VOL"], overall: 83, plat: "common-gen4", dias: DIAS_TODOS, horario: "21h–00h", regiao: "BR", desc: "Jogo de zaga ou volante. Gen4. Procuro time organizado que treine posicionamento." },
  { gamertag: "PedroA_CA", estilo: "MATADOR", posicoes: ["ATA"], overall: 88, plat: "common-gen5", dias: DIAS_TODOS, horario: "22h–01h", regiao: "BR", desc: "Centroavante de área, faro de gol. Quero divisão 1 ou 2. Overall alto, disponível todo dia." },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI ausente — rode com `node --env-file=.env.local`.");
    process.exit(1);
  }
  await mongoose.connect(uri, { maxPoolSize: 5, dbName: "fayapoint" });

  // Sempre limpa as vagas e as avaliações de demo antes (idempotente).
  const chavesDemo = JOGADORES.map((j) => chaveGamertag(j.gamertag));
  const rem = await GameVaga.deleteMany({ demo: true });
  const remAv = await GameAvaliacao.deleteMany({ alvoGamertag: { $in: chavesDemo } });
  if (rem.deletedCount) console.log(`${rem.deletedCount} vagas de demonstração removidas`);
  if (remAv.deletedCount) console.log(`${remAv.deletedCount} avaliações de demonstração removidas`);

  if (process.argv.includes("--apagar")) {
    await mongoose.disconnect();
    return;
  }

  // Dono: primeiro admin, ou qualquer usuário.
  const users = mongoose.connection.db!.collection("users");
  const dono =
    (await users.findOne({ role: "admin" }, { projection: { _id: 1, email: 1 } })) ??
    (await users.findOne({}, { projection: { _id: 1, email: 1 } }));
  if (!dono) {
    console.error("nenhum usuário no banco para ser o dono das vagas");
    process.exit(1);
  }
  console.log(`dono das vagas de exemplo: ${dono.email ?? dono._id}`);

  const agora = Date.now();
  const clubes = CLUBES.map((c, i) => ({
    tipo: "clube" as const,
    ownerUserId: dono._id,
    posicoes: c.posicoes,
    plataforma: c.plat,
    dias: c.dias,
    horario: c.horario,
    regiao: c.regiao,
    clubeNome: c.nome,
    minOverall: c.min,
    clubeSnapshot: {
      currentDivision: c.div,
      wins: c.v,
      ties: c.e,
      losses: c.d,
      gamesPlayed: c.v + c.e + c.d,
    },
    descricao: c.desc,
    contatoTipo: "plataforma" as const,
    status: "ativa" as const,
    demo: true,
    sourceGrade: "E" as const,
    // Escalona a data para a ordenação "recentes" ficar variada.
    createdAt: new Date(agora - i * 3600_000),
  }));

  const jogadores = JOGADORES.map((j, i) => ({
    tipo: "jogador" as const,
    ownerUserId: dono._id,
    posicoes: j.posicoes,
    plataforma: j.plat,
    dias: j.dias,
    horario: j.horario,
    regiao: j.regiao,
    gamertag: j.gamertag,
    estilo: j.estilo,
    overall: j.overall,
    descricao: j.desc,
    contatoTipo: "plataforma" as const,
    status: "ativa" as const,
    demo: true,
    sourceGrade: "E" as const,
    createdAt: new Date(agora - i * 3600_000),
  }));

  await GameVaga.insertMany([...clubes, ...jogadores]);
  console.log(`${clubes.length} vagas de clube + ${jogadores.length} de jogador criadas (demo).`);

  // Reputação de exemplo: cada jogador recebe votos de avaliadores sintéticos,
  // com nota puxada pelo overall (bons jogadores tendem a boa média). Os
  // avaliadorUserId são ObjectIds novos — o agregado só lê game_avaliacoes.
  const avaliacoes: Record<string, unknown>[] = [];
  for (const j of JOGADORES) {
    const chave = chaveGamertag(j.gamertag);
    const votos = 3 + (j.overall % 7); // 3..9 votos
    const base = 2.6 + (j.overall - 80) * 0.22; // ~3 a ~4.6
    for (let n = 0; n < votos; n++) {
      const cats: Record<string, number> = {};
      for (const c of CATEGORIAS) {
        const ruido = ((j.overall * 7 + n * 13 + c.key.length * 5) % 15) / 10 - 0.7;
        cats[c.key] = Math.max(1, Math.min(5, Math.round(base + ruido)));
      }
      const media = Math.round((CATEGORIAS.reduce((s, c) => s + cats[c.key], 0) / CATEGORIAS.length) * 10) / 10;
      avaliacoes.push({
        avaliadorUserId: new mongoose.Types.ObjectId(),
        alvoGamertag: chave,
        alvoGamertagDisplay: j.gamertag,
        plataforma: j.plat,
        categorias: cats,
        media,
      });
    }
  }
  await GameAvaliacao.insertMany(avaliacoes, { ordered: false });
  console.log(`${avaliacoes.length} avaliações de demonstração criadas.`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

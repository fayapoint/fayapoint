import assert from "node:assert/strict";
import path from "node:path";

// Executa os handlers reais. Auth, conexão e modelos são substituídos antes do import;
// não há URI, socket Mongo nem conta real neste teste.
const root = process.cwd();
const dono = "111111111111111111111111", admin = "222222222222222222222222", estranho = "333333333333333333333333", membro = "444444444444444444444444";
let auth: { id: string; role: string } | null = { id: dono, role: "student" };
const contas = new Map([[dono, { _id: dono, role: "student", name: "Dono" }], [admin, { _id: admin, role: "admin", name: "Admin" }], [estranho, { _id: estranho, role: "student", name: "Estranho" }], [membro, { _id: membro, role: "student", name: "Membro" }]]);
function substituir(modulo: string, exports: unknown) {
  const id = require.resolve(path.join(root, modulo));
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
}
substituir("src/lib/auth.ts", { getAuthUser: async () => auth });
substituir("src/lib/mongodb.ts", { __esModule: true, default: async () => {} });
substituir("src/lib/game/limite.ts", { cobrar: async () => ({ ok: true }) });

const User = require(path.join(root, "src/models/User.ts")).default;
const Clube = require(path.join(root, "src/models/GameClubePerfil.ts")).default;
const base = {
  eaClubId: "123", plataforma: "common-gen5", nome: "Teste", estado: "aprovado", donoUserId: dono,
  descricao: "", membros: [], apuracoes: [], versao: 2, historico: [], solicitantes: [{ userId: dono, justificativa: "Evidência fictícia", quando: new Date(), desafio: {
    gamertag: "Pro", codigo: "W22AABBCCDDEE", criadoEm: new Date(), expiraEm: new Date(Date.now() + 3600_000), verificadoEm: new Date(),
  } }],
};
let perfil: any = structuredClone(base); let escritas = 0; let conflito = false;
const query = (valor: unknown) => ({ select: () => ({ lean: async () => valor }) });
User.findById = (id: string) => query(contas.get(id) ?? null);
User.find = () => query([...contas.values()]);
User.findOne = ({ email }: { email: string }) => query(email === "membro@example.test" ? contas.get(membro) : null);
User.countDocuments = async ({ _id }: { _id: { $in: string[] } }) => _id.$in.filter(id => contas.has(id)).length;
Clube.findOne = () => Object.assign(Promise.resolve(perfil), { lean: async () => perfil });
Clube.findOneAndUpdate = async (filtro: any, update: any) => {
  if (conflito || filtro.versao !== perfil.versao) return null;
  escritas++; Object.assign(perfil, update.$set); perfil.versao++;
  if (update.$push?.historico) perfil.historico.push(update.$push.historico);
  return perfil;
};
const gestao = require(path.join(root, "src/app/api/game/gestao/[clubId]/route.ts"));
const federacao = require(path.join(root, "src/app/api/game/federacao/route.ts"));
const apuracoes = require(path.join(root, "src/app/api/game/gestao/[clubId]/apuracoes/route.ts"));
const ctx = { params: Promise.resolve({ clubId: "123" }) };
const request = (body: unknown) => new Request("http://localhost/api/game/gestao/123", { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const identidade = () => ({ acao: "identidade", plataforma: "common-gen5", versao: perfil.versao, descricao: "Nova descrição" });
function reset() { perfil = structuredClone(base); escritas = 0; conflito = false; auth = { id: dono, role: "student" }; }
let cenarios = 0;
async function status(p: Promise<Response>, esperado: number) { const r = await p; assert.equal(r.status, esperado, await r.text()); cenarios++; }

async function main() {
  auth = null; await status(gestao.PATCH(request(identidade()), ctx), 401); assert.equal(escritas, 0);
  reset(); auth = { id: estranho, role: "admin" }; // JWT diz admin, mas banco diz student.
  await status(federacao.PATCH(request({})), 403); assert.equal(escritas, 0);
  await status(gestao.PATCH(request(identidade()), ctx), 403);
  reset(); perfil.estado = "suspenso"; await status(gestao.PATCH(request(identidade()), ctx), 403);
  reset(); await status(gestao.PATCH(request({ ...identidade(), versao: 1 }), ctx), 409); assert.equal(escritas, 0);
  reset(); conflito = true; await status(gestao.PATCH(request(identidade()), ctx), 409); assert.equal(escritas, 0);
  reset(); await status(gestao.PATCH(request(identidade()), ctx), 200); assert.equal(perfil.descricao, "Nova descrição"); assert.equal(escritas, 1); assert.equal(perfil.historico.length, 1);
  reset(); await status(gestao.PATCH(request({ ...identidade(), donoUserId: estranho }), ctx), 400); assert.equal(escritas, 0);
  reset(); await status(gestao.PATCH(request({ acao: "delegar", plataforma: "common-gen5", versao: 2, membros: [{ userId: membro, funcao: "vice" }, { userId: membro, funcao: "capitao" }] }), ctx), 400); assert.equal(escritas, 0);
  reset(); await status(gestao.PATCH(request({ acao: "adicionar-responsavel", plataforma: "common-gen5", versao: 2, email: "membro@example.test", funcao: "vice" }), ctx), 200); assert.equal(perfil.membros[0].userId, membro);
  reset(); auth = { id: admin, role: "admin" }; perfil.estado = "pendente"; perfil.donoUserId = null;
  const aprovar = () => ({ acao: "aprovar", clubId: "123", plataforma: "common-gen5", versao: perfil.versao, donoUserId: dono, motivo: "Prova conferida em teste" });
  delete perfil.solicitantes[0].desafio.verificadoEm;
  await status(federacao.PATCH(request(aprovar())), 409); assert.equal(escritas, 0);
  perfil.solicitantes[0].desafio.verificadoEm = new Date(); perfil.solicitantes[0].desafio.expiraEm = new Date(0);
  await status(federacao.PATCH(request(aprovar())), 409); assert.equal(escritas, 0);
  perfil.solicitantes[0].desafio.expiraEm = new Date(Date.now() + 3600_000);
  await status(federacao.PATCH(request(aprovar())), 200); assert.equal(perfil.estado, "aprovado"); assert.equal(perfil.donoUserId, dono);
  reset(); auth = { id: admin, role: "admin" }; perfil.estado = "pendente"; perfil.solicitantes[0].userId = admin;
  await status(federacao.PATCH(request({ ...aprovar(), donoUserId: admin })), 403); assert.equal(escritas, 0);
  reset(); await status(gestao.PATCH(new Request("http://localhost/api", { method: "PATCH", body: "x".repeat(16385) }), ctx), 413); assert.equal(escritas, 0);
  reset(); auth = { id: estranho, role: "student" };
  const leitura = await gestao.GET(new Request("http://localhost/api/game/gestao/123"), ctx);
  const dados = await leitura.json();
  assert.equal(leitura.status, 200); assert.deepEqual(dados.perfil.solicitantes, []); assert.deepEqual(dados.perfil.historico, []); assert.equal(dados.perfil.donoUserId, null); cenarios++;
  reset();
  const abrir = () => ({ acao: "abrir", plataforma: "common-gen5", versao: perfil.versao, motivo: "Verificar o caso de teste", evidencia: "Partida de teste com sinal", cautelar: true });
  await status(apuracoes.PATCH(request(abrir()), ctx), 403); assert.equal(escritas, 0);
  auth = { id: admin, role: "admin" };
  await status(apuracoes.PATCH(request(abrir()), ctx), 200); assert.equal(perfil.estado, "suspenso"); assert.equal(perfil.apuracoes.length, 1);
  const decidir = () => ({ acao: "decidir", plataforma: "common-gen5", versao: perfil.versao, id: perfil.apuracoes[0].id, resultado: "suspender", motivo: "Fundamentação de teste" });
  await status(apuracoes.PATCH(request(decidir()), ctx), 409); assert.equal(escritas, 1);
  await status(federacao.PATCH(request({ acao: "reativar", clubId: "123", plataforma: "common-gen5", versao: perfil.versao, motivo: "Tentativa de contornar cautelar" })), 409);
  auth = { id: estranho, role: "student" };
  await status(apuracoes.GET(new Request("http://localhost/api/game/gestao/123/apuracoes"), ctx), 403);
  auth = { id: dono, role: "student" };
  await status(apuracoes.GET(new Request("http://localhost/api/game/gestao/123/apuracoes"), ctx), 200);
  await status(apuracoes.PATCH(request({ acao: "defesa", plataforma: "common-gen5", versao: perfil.versao, id: perfil.apuracoes[0].id, texto: "Defesa completa no teste de rota" }), ctx), 200); assert.equal(perfil.apuracoes[0].estado, "em-revisao");
  auth = { id: admin, role: "admin" };
  await status(apuracoes.PATCH(request({ ...decidir(), resultado: "arquivar" }), ctx), 200); assert.equal(perfil.estado, "aprovado"); assert.equal(perfil.apuracoes[0].estado, "decidida");
  await status(apuracoes.PATCH(request(decidir()), ctx), 409);
  reset(); auth = { id: admin, role: "admin" }; perfil.estado = "suspenso"; perfil.donoUserId = admin;
  const reativar = () => ({ acao: "reativar", clubId: "123", plataforma: "common-gen5", versao: perfil.versao, motivo: "Revisão da suspensão em teste" });
  await status(federacao.PATCH(request(reativar())), 403); assert.equal(escritas, 0); assert.equal(perfil.estado, "suspenso");
  perfil.donoUserId = dono;
  await status(federacao.PATCH(request(reativar())), 200); assert.equal(escritas, 1); assert.equal(perfil.estado, "aprovado");
  console.log(`Rotas reais: ${cenarios} cenários de autorização, concorrência, prova e validação passaram sem banco.`);
}
void main().catch(e => { console.error(e); process.exitCode = 1; });

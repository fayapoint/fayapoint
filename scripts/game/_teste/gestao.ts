import assert from "node:assert/strict";
import { podeGerir, ehFederacao, chaveClube, conferirDesafio, motivoDecisao, type PerfilPermissoes, type EstadoClube } from "../../../src/lib/game/gestao";

const perfil: PerfilPermissoes = {
  estado: "aprovado", donoUserId: "dono",
  membros: [{ userId: "cap", funcao: "capitao" }, { userId: "vice", funcao: "vice" }, { userId: "rec", funcao: "recrutador" }],
};
for (const estado of ["pendente", "recusado", "suspenso"] as EstadoClube[]) {
  for (const userId of ["dono", "cap", "vice", "rec", null]) {
    assert.equal(podeGerir({ ...perfil, estado }, userId, "vaga"), false, `${estado} não concede acesso a ${userId}`);
  }
}
assert.equal(podeGerir(perfil, "estranho", "delegar"), false);
assert.equal(podeGerir(perfil, null, "vaga"), false);
assert.equal(podeGerir(perfil, "dono", "delegar"), true);
assert.equal(podeGerir(perfil, "cap", "delegar"), false);
assert.equal(podeGerir(perfil, "cap", "inscricao"), true);
assert.equal(podeGerir(perfil, "vice", "inscricao"), false);
assert.equal(podeGerir(perfil, "vice", "partida"), true);
assert.equal(podeGerir(perfil, "rec", "vaga"), true);
assert.equal(podeGerir(perfil, "rec", "elenco"), false);
assert.equal(ehFederacao("admin"), true);
for (const role of ["user", "capitao", "ADMIN", "", null, undefined]) assert.equal(ehFederacao(role), false);
assert.deepEqual(chaveClube("000123", "common-gen5"), { eaClubId: "123", plataforma: "common-gen5" });
for (const id of [null, 123, "", "12/3", "1234567890123"]) assert.throws(() => chaveClube(id, "common-gen5"));
assert.throws(() => chaveClube("123", "inventada"));
for (const motivo of [null, "", "curto", "x".repeat(2001)]) assert.throws(() => motivoDecisao(motivo));
assert.equal(motivoDecisao("  Evidência revisada pela federação.  "), "Evidência revisada pela federação.");
console.log("Gestão: autorização, suspensão, delegação e validação aprovadas.");
const inicio = new Date("2026-09-08T10:00:00Z"), agora = new Date("2026-09-08T12:00:00Z");
const desafio = { gamertag: "Faya", codigo: "W22AABBCCDDEE", criadoEm: inicio, expiraEm: new Date("2026-09-10T10:00:00Z") };
const elenco = [{ name: "faya", proName: "Ricardo W22AABBCCDDEE" }];
assert.equal(conferirDesafio(desafio, elenco, agora, agora), true);
assert.equal(conferirDesafio(desafio, elenco, new Date("2026-09-08T09:00:00Z"), agora), false, "snapshot anterior não prova desafio");
assert.equal(conferirDesafio(desafio, elenco, null, agora), false);
assert.equal(conferirDesafio(desafio, elenco, agora, desafio.expiraEm), false, "expiração é exclusiva");
assert.equal(conferirDesafio(desafio, [{ name: "outro", proName: desafio.codigo }], agora, agora), false);
assert.equal(conferirDesafio(desafio, [{ name: "Faya", proName: `${desafio.codigo}EXTRA` }], agora, agora), false);
assert.equal(conferirDesafio(desafio, [{ name: "Faya" }], agora, agora), false);
assert.equal(conferirDesafio(desafio, elenco, new Date("2026-09-09T10:00:00Z"), agora), false);
console.log("Prova de acesso: gamertag, código exato, idade do espelho e expiração aprovados.");

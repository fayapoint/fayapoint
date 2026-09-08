import assert from "node:assert/strict";
import { evidenciasPartida, resumoElenco } from "../../../src/lib/game/integridade";

const jogo = { matchId: "1", clubs: [
  { clubId: "10", name: "Casa", goals: 3, winnerByDnf: true, players: [{ name: "Faya", goals: 3, secondsPlayed: 100, secondsIdle: 8 }] },
  { clubId: "20", name: "Fora", goals: 0, players: [] },
] };
const evidencia = evidenciasPartida(jogo);
assert.equal(evidencia.sinalWo, true);
assert.deepEqual(evidencia.vencedoresPorDnf, ["Casa"], "DNF deve rotular vencedor, não culpado");
assert.equal(evidencia.jogadoresParados[0].segundosParado, 8);
const inteiro = { matchId: "2", clubs: [{ clubId: "10", name: "Casa", goals: 3, players: [{ name: "FAYA", secondsPlayed: 5532, goals: 2, secondsIdle: null }] }] };
const desconhecido = { matchId: "3", clubs: [{ clubId: "10", players: [{ name: "Faya", goals: 8 }] }] };
const resumo = resumoElenco("10", [{ name: "Faya" }, { name: "Outro" }], [jogo, jogo, inteiro, desconhecido]);
assert.equal(resumo.partidasComElenco, 3, "recaptura duplicada não entra duas vezes");
assert.equal(resumo.jogadores[0].presencas, 3);
assert.equal(resumo.jogadores[0].gols, 2, "gols de W.O. e de duração desconhecida ficam fora");
assert.equal(resumo.jogadores[0].amostrasGols, 1);
assert.equal(resumo.jogadores[0].segundosParado, 8);
assert.equal(resumo.jogadores[0].amostrasIdle, 1, "idle ausente não vira zero medido");
assert.equal(resumo.jogadores[1].gols, null);
assert.equal(evidenciasPartida(null).duracao, null);
assert.equal(evidenciasPartida(desconhecido).situacao, "sem-duracao");
assert.equal(evidenciasPartida(inteiro).sinalWo, false);
assert.equal(resumoElenco("99", [], [jogo]).partidasComElenco, 0);
console.log("Integridade: procedência, ausência de dado, DNF, duplicatas e exclusão de W.O. aprovados.");

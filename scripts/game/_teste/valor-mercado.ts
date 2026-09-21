/**
 * Portão da régua de valor de mercado. Rodar:
 *   node node_modules/tsx/dist/cli.mjs scripts/game/_teste/valor-mercado.ts
 */
import assert from "node:assert/strict";
import { avaliarJogador, avaliarClube, conferirFaixa, repartir, pesoDivisao } from "../../../src/lib/game/valor-mercado";

const craque = avaliarJogador({ jogos: 60, gols: 70, assistencias: 30, nota: 8.4, melhorEmCampo: 20, overall: 88, divisaoClube: 1 });
const novato = avaliarJogador({ jogos: 2, gols: 0, assistencias: 0, nota: 6.1, melhorEmCampo: 0, overall: 65, divisaoClube: 10 });
assert.ok(craque.valor > novato.valor * 5, "craque de elite vale muito mais que novato");
assert.equal(novato.confianca, "baixa");
assert.equal(craque.confianca, "alta");
assert.ok(craque.minimo < craque.valor && craque.valor < craque.maximo);
assert.equal(craque.valor % 5, 0);

// Mesmo jogador, divisão melhor vale mais.
const base = { jogos: 30, gols: 10, assistencias: 10, nota: 7, melhorEmCampo: 3, overall: 80 };
assert.ok(avaliarJogador({ ...base, divisaoClube: 2 }).valor > avaliarJogador({ ...base, divisaoClube: 9 }).valor);
assert.equal(pesoDivisao(null), 1);

const clubeTop = avaliarClube({ skillRating: 2144, divisao: 1, vitorias: 43, empates: 5, derrotas: 3, elencoAtivo: 11 });
const clubeNovo = avaliarClube({ skillRating: null, divisao: null, vitorias: 0, empates: 0, derrotas: 0, elencoAtivo: 2 });
assert.ok(clubeTop.valor > clubeNovo.valor * 5);
assert.equal(clubeNovo.valor, 260);

assert.equal(conferirFaixa(clubeTop.valor, clubeTop), null);
assert.match(conferirFaixa(clubeTop.minimo - 5, clubeTop) ?? "", /Abaixo/);
assert.match(conferirFaixa(clubeTop.maximo + 5, clubeTop) ?? "", /Acima/);
assert.match(conferirFaixa(10.5, clubeTop) ?? "", /inteiro/);

assert.deepEqual(repartir(1000), { vendedor: 900, taxa: 100 });
assert.deepEqual(repartir(5), { vendedor: 4, taxa: 1 });

console.log("valor-mercado ok", { craque: craque.valor, novato: novato.valor, clubeTop: clubeTop.valor, clubeNovo: clubeNovo.valor });

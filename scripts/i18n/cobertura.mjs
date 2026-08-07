/**
 * Quanto de uma área está coberto pelo dicionário.
 *
 * Existe porque o portal do aluno fica atrás de login, e a auditoria do HTML
 * não entra lá. Aqui a pergunta é respondida pelo código: de todo texto que
 * aquela área desenha, quanto tem tradução gravada?
 *
 * Não substitui olhar a tela logado — mas diz, com número, o que sobrou.
 *
 * Uso: node scripts/i18n/cobertura.mjs src/components/portal
 */
import { readFileSync } from "fs";
import { colher, chaveDe } from "./extrair-interface.mjs";

const dic = JSON.parse(readFileSync("messages/dicionario.en.json", "utf8"));
const alvos = process.argv.slice(2);
if (!alvos.length) {
  console.error("Diga a pasta. Ex.: node scripts/i18n/cobertura.mjs src/components/portal");
  process.exit(1);
}

const textos = colher(alvos);
const faltando = textos.filter((t) => !dic[chaveDe(t)]);

const pct = ((1 - faltando.length / textos.length) * 100).toFixed(1);
console.log(`${textos.length} texto(s) · ${textos.length - faltando.length} traduzidos · ${pct}%`);

if (process.argv.includes("--faltando") || faltando.length <= 40) {
  console.log("\nsem tradução:");
  for (const t of faltando) console.log(`  ${t.slice(0, 100)}`);
}

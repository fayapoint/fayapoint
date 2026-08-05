/**
 * Baixa as cenas a partir do TSV `nome<TAB>carimbo_id` e converte para webp.
 * A URL do CloudFront é montada aqui — ela é previsível, e é o único jeito de
 * o download acontecer sem a URL assinada passar por lugar nenhum.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
const [, , tsv, destino, larguraStr] = process.argv;
const largura = Number(larguraStr || 1376);
mkdirSync(destino, { recursive: true });
const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_37ULog99RS6VlchaVmXKGoThnQH/hf_";
const linhas = readFileSync(tsv, "utf8").split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split("\t"));
let ok = 0; const falhas = [];
for (const [nome, carimbo] of linhas) {
  try {
    const r = await fetch(`${BASE}${carimbo}.png`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const png = Buffer.from(await r.arrayBuffer());
    const i = await sharp(png).resize({ width: largura, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(destino, nome + ".webp"));
    console.log(`${nome.padEnd(22)} ${i.width}x${i.height}  ${(i.size/1024).toFixed(0)} KB`);
    ok++;
  } catch (e) { console.error("FALHOU", nome, e.message); falhas.push(nome); }
}
console.log(`\n${ok}/${linhas.length} em ${destino}`);
if (falhas.length) { console.log("faltaram:", falhas.join(", ")); process.exitCode = 1; }

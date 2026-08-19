/**
 * Atualiza o registry de fatos voláteis (`content_facts`) com procedência.
 *
 * ── Por que um script e não um update à mão ───────────────────────────────────
 *
 * Um documento deste registry vale por centenas de frases: em 19/08/2026 havia
 * **728 tokens `{{fact:}}`** no catálogo — `openai-flagship` sozinho aparece
 * 287 vezes, `google-pro` 44. Trocar um valor errado aqui espalha o erro por
 * todos os cursos de uma vez, em português e em inglês, sem passar por
 * nenhuma revisão de texto.
 *
 * Então a troca não pode ser um `updateOne` solto no terminal. Cada mudança
 * carrega **de onde veio e quando foi conferida**, guarda o valor anterior, e
 * o script recusa a chave que não existe — porque criar chave por engano de
 * digitação é como se inventa um fato que ninguém verificou.
 *
 * ⚠️ O valor entra na prosa. `GPT-5.6 Sol` cabe em "o {{fact:openai-flagship}}
 * da OpenAI"; uma frase inteira, não. Antes de mudar, leia o token em uso —
 * `scripts/cursos/atualizar_fatos.mjs --usos <chave>` mostra onde ele cai.
 *
 *   node --env-file=.env.local scripts/cursos/atualizar_fatos.mjs            # ensaio
 *   node --env-file=.env.local scripts/cursos/atualizar_fatos.mjs --gravar
 *   node --env-file=.env.local scripts/cursos/atualizar_fatos.mjs --usos google-pro
 */
import { MongoClient } from "mongodb";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";

/**
 * A rodada de verificação de 19/08/2026.
 *
 * O registry estava sem conferência desde 03/08 — 16 dias. Três dos quatro
 * defeitos abaixo não são "envelhecimento", são coisa que **nunca existiu**:
 * `GPT-5.6 mini` e `gpt-5.6-mini` são um nome que a OpenAI não usa (a linha
 * barata chama-se Luna), e `Gemini 3.5 Pro` continuava adiado em 13/08 — o
 * curso mandava 44 vezes usar um modelo que o aluno não consegue abrir.
 *
 * `de` é conferência, não enfeite: se o valor no banco não for esse, o script
 * para. Quer dizer que alguém mexeu no meio e a rodada precisa ser relida.
 */
const RODADA = [
  {
    chave: "openai-flagship", de: "GPT-5.6", para: "GPT-5.6 Sol",
    porque: "GPT-5.6 saiu em 09/07/2026 em três camadas (Sol, Terra, Luna). O topo é o Sol; `GPT-5.6` sozinho é a FAMÍLIA, e para isso já existe a chave `openai-family`.",
    fonte: "https://openai.com/index/gpt-5-6/",
  },
  {
    chave: "openai-mini", de: "GPT-5.6 mini", para: "GPT-5.6 Luna",
    porque: "A OpenAI não tem `GPT-5.6 mini`. A camada barata da geração 5.6 chama-se Luna (US$ 0,20/1M entrada depois do corte de 80% em 30/07/2026).",
    fonte: "https://openai.com/index/gpt-5-6/",
  },
  {
    chave: "openai-model-id-mini", de: "gpt-5.6-mini", para: "gpt-5.6-luna",
    porque: "Identificador real da camada barata. O antigo estava em 13 blocos de código que o aluno copia — copiar dava erro de modelo inexistente.",
    fonte: "https://developers.openai.com/api/docs/models/gpt-5.6-luna",
  },
  {
    chave: "google-pro", de: "Gemini 3.5 Pro", para: "Gemini 3.1 Pro",
    porque: "O 3.5 Pro continuava SEM lançamento em 13/08/2026 (terceiro adiamento; só o 3.5 Flash saiu). O topo de raciocínio do Google que existe de verdade é o 3.1 Pro.",
    fonte: "https://www.forbes.com/sites/johnwerner/2026/08/13/gemini-35-pro-delay-continues/",
  },
  {
    chave: "midjourney-current", de: "Midjourney v8", para: "Midjourney V8.2",
    porque: "V8.2 é o modelo padrão desde 24/07/2026; o V8.0 Alpha foi aposentado.",
    fonte: "https://updates.midjourney.com/",
  },
  {
    chave: "video-top", de: "Kling v3", para: "Kling 3.0",
    porque: "O produto chama-se Kling 3.0. `v3` não é como a marca se escreve, e nome errado é o que faz o aluno não achar a ferramenta.",
    fonte: "https://kling.ai/",
  },
];

const GRAVAR = process.argv.includes("--gravar");
const usos = (() => { const i = process.argv.indexOf("--usos"); return i === -1 ? null : process.argv[i + 1]; })();

const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const db = client.db("fayapointProdutos");
const col = db.collection("content_facts");

if (usos) {
  const docs = await db.collection("products").find({ type: "course" }).project({ slug: 1, courseContent: 1 }).toArray();
  let n = 0;
  for (const d of docs) {
    const t = d.courseContent || "";
    let i = -1;
    while ((i = t.indexOf(`{{fact:${usos}}}`, i + 1)) !== -1) {
      if (n++ < 12) console.log(`[${d.slug}] …${t.slice(Math.max(0, i - 100), i + 50).replace(/\s+/g, " ")}…`);
    }
  }
  console.log(`\n${n} uso(s) de {{fact:${usos}}}`);
  await client.close();
  process.exit(0);
}

let mudam = 0;
for (const r of RODADA) {
  const atual = await col.findOne({ key: r.chave });
  if (!atual) throw new Error(`chave "${r.chave}" não existe no registry — criar fato exige decisão, não script`);
  if (atual.value === r.para) { console.log(`· ${r.chave}: já está em "${r.para}"`); continue; }
  if (atual.value !== r.de) throw new Error(`${r.chave}: esperava "${r.de}" no banco e achei "${atual.value}" — releia a rodada`);
  console.log(`\n${r.chave}: "${r.de}" → "${r.para}"`);
  console.log(`   ${r.porque}`);
  console.log(`   fonte: ${r.fonte}`);
  mudam++;
  if (!GRAVAR) continue;
  await db.collection("content_facts_backup_20260819").insertOne({ ...atual, _id: undefined, arquivadoEm: new Date() });
  await col.updateOne(
    { key: r.chave },
    { $set: { value: r.para, updatedAt: new Date(), updatedBy: "verificacao-19-08-2026", fonte: r.fonte, porque: r.porque, valorAnterior: r.de } },
  );
}

console.log(`\n${mudam} fato(s) ${GRAVAR ? "gravado(s)" : "a gravar"}${GRAVAR ? "" : " — use --gravar"}.`);
if (GRAVAR && mudam) {
  // O registry é lido com cache de 5 min em `content-facts.ts` e o conteúdo
  // servido passa pelo cache do Upstash: sem isto, o valor novo demora.
  await invalidarCache();
  console.log("cache do catálogo invalidado.");
}
await client.close();

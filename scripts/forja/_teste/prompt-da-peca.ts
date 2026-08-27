#!/usr/bin/env -S npx tsx
/**
 * O TESTE DOS PROMPTS — o modelo de verdade, sem tocar em conta de ninguém.
 *
 * ## O que ele mede
 *
 * Os prompts de `engine/prompts/llm.ts` foram reescritos do zero: o WorldForge
 * falava com roteirista de série sobrenatural, e agora fala com dono de negócio
 * brasileiro. Typecheck não diz nada sobre isso. O que diz é rodar.
 *
 * As quatro perguntas, e o motivo de cada uma:
 *
 * 1. **O JSON volta legível?** É o que separa "funciona" de "502 na cara da
 *    pessoa depois de ela pagar o crédito".
 * 2. **O criador virou o público?** É o defeito que já fez o gerador de livro
 *    chamar o Ricardo de "mulher de aproximadamente 35 anos". O teste planta um
 *    caso difícil de propósito: criador SEM gênero declarado e público
 *    declaradamente feminino, que é a armadilha exata.
 * 3. **Os ajustes são chaves válidas?** Valor inventado é descartado por
 *    `resolverConflitos`, e um quadro sem câmera nenhuma sai genérico.
 * 4. **Os quadros são VISUAIS?** "Mostrar profissionalismo" não é imagem. O
 *    teste procura os abstratos mais comuns.
 *
 * Uso:
 *   npx tsx scripts/forja/_teste/prompt-da-peca.ts
 *   npx tsx scripts/forja/_teste/prompt-da-peca.ts --formato bastidor
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "../../..");

// o provedor lê a chave do ambiente no momento do import, então o .env entra antes
const envLocal = join(RAIZ, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/**
 * ⚠️ Os imports do motor e do provedor são DINÂMICOS, e ficam dentro de `main`.
 *
 * O projeto não declara `"type": "module"`, então o `tsx` transforma este
 * arquivo para CJS — onde `import` estático é içado para ANTES de qualquer
 * código, inclusive antes da leitura do `.env.local` acima. O provedor de IA lê
 * `OPENROUTER_API_KEY` no momento em que é carregado: com import estático ele
 * nasceria sem chave e a chamada falharia com "não autorizado", que é o erro
 * mais enganoso possível aqui.
 *
 * (Import dinâmico no topo também não serve: `await` de primeiro nível não
 * existe em CJS. Daí estarem dentro da função.)
 */
type Personagem = import("../../../src/lib/forja/engine/personagem").Personagem;

/**
 * A armadilha, plantada de propósito.
 *
 * O criador NÃO declara gênero (`tratamento` ausente) e o público é
 * explicitamente feminino, de 30 a 50 anos. É a configuração exata que produziu
 * "mulher de aproximadamente 35 anos" no gerador de livro. Se a separação de
 * blocos funcionar, nenhum quadro vai chamar o criador de "ela".
 */
const PERSONA = {
  identidade: { marca: "Serralheria Vitória", papel: "faz portões e grades sob medida", cidade: "Contagem, MG" },
  negocio: {
    oQueVende: "portão de correr automatizado e grade de janela sob medida",
    ticket: 2400,
    canal: "WhatsApp e indicação de vizinho",
    objecao: "vou pensar e te falo depois",
    orgulho: "um portão de 4 metros que instalei sozinho num sábado",
  },
  publico: {
    idade: [30, 50] as [number, number],
    quemE: "mulheres donas de casa que acabaram de comprar o primeiro imóvel",
    dores: ["medo de assalto na rua", "orçamento que some sem resposta"],
    desejos: ["dormir tranquila", "casa bonita sem parecer presídio"],
    lugares: ["bairro residencial em Contagem"],
  },
  estrategia: { pilares: ["bastidor da oficina", "antes e depois"], naoFalar: ["política"] },
  voz: { vocabulario: "fala simples, sem termo técnico, chama o cliente de 'a senhora'" },
};

const ELENCO: Personagem[] = [
  {
    _id: "criador1",
    origem: "criador",
    nome: "Serralheria Vitória",
    papel: "o dono, que aparece nas peças",
    aparencia: { genero: "neutro" },
    figurinos: [],
  },
];

const iF = process.argv.indexOf("--formato");
const idFormato = iF >= 0 ? process.argv[iF + 1] : "reel";

/** Palavras que denunciam quadro que não é imagem. */
const ABSTRATOS = [
  "profissionalismo",
  "confiança",
  "qualidade",
  "credibilidade",
  "sucesso",
  "transformação",
  "jornada",
  "experiência do cliente",
];

/** Palavras que denunciam o criador tratado como o público. */
const VAZAMENTOS = ["dona de casa", "donas de casa", "recém-casada", "a criadora", "ela, a dona"];

/**
 * O `id` do elenco vazando para o texto que a pessoa LÊ.
 *
 * Aconteceu na primeira geração de verdade: "O criador1 está na oficina". O
 * modelo recebeu um rótulo e tratou o rótulo como nome. A instrução foi
 * reforçada em `blocoElenco`; esta conferência é o que impede a regressão.
 */
const IDS_DO_ELENCO = ELENCO.map((p) => String(p._id));

async function main() {
  const { generate } = await import("../../../src/lib/ai/provider");
  const { SISTEMA_PECA, pedidoDePeca } = await import("../../../src/lib/forja/engine/prompts/llm");
  const { normalizar } = await import("../../../src/lib/forja/engine/peca");
  const { acharFormato } = await import("../../../src/lib/forja/engine/formatos");
  const { CHAVES_VALIDAS } = await import("../../../src/lib/forja/engine/vocabulario");

  const formato = acharFormato(idFormato);
  const pedido = pedidoDePeca({
    persona: PERSONA,
    nome: "Serralheria Vitória",
    elenco: ELENCO,
    formato,
    tema: "por que o cliente some depois do orçamento — e o que eu mudei",
    quadros: formato.quadros,
  });

  console.log(`formato: ${formato.titulo} · ${formato.quadros} quadros`);
  console.log(`pedido: ${pedido.length} caracteres\n`);

  const t0 = Date.now();
  const r = await generate({
    messages: [
      { role: "system", content: SISTEMA_PECA },
      { role: "user", content: pedido },
    ],
    tier: "free",
    json: true,
    maxTokens: 5000,
  });
  console.log(`modelo: ${r.model} · ${Math.round((Date.now() - t0) / 1000)}s · US$ ${r.cost.toFixed(5)}\n`);

  const elenco = new Map(ELENCO.map((p) => [p._id as string, p]));
  const peca = normalizar(r.content, { formato, elenco });

  const falhas: string[] = [];

  // 1 — legível
  if (peca.quadros.length !== formato.quadros) {
    falhas.push(`pediu ${formato.quadros} quadros, veio ${peca.quadros.length}`);
  }

  const textoTodo = [peca.titulo, peca.legenda, ...peca.quadros.flatMap((q) => [q.titulo, q.acao, q.fala || ""])]
    .join(" ")
    .toLowerCase();

  // 2 — o criador virou o público?
  for (const v of VAZAMENTOS) {
    if (textoTodo.includes(v)) falhas.push(`o bloco do público vazou para o criador: "${v}"`);
  }

  // 3 e 4 — câmera e concretude
  for (const q of peca.quadros) {
    const chaves = Object.keys(q.ajustes || {});
    if (chaves.length < 4) falhas.push(`quadro ${q.numero}: só ${chaves.length} ajustes de câmera`);
    for (const [g, v] of Object.entries(q.ajustes || {})) {
      if (!CHAVES_VALIDAS[g]?.includes(v as string)) falhas.push(`quadro ${q.numero}: ${g}="${v}" não existe`);
    }
    if (!q.acaoEn) falhas.push(`quadro ${q.numero}: sem acaoEn — o prompt sai em português`);
    for (const a of ABSTRATOS) {
      if (q.acao.toLowerCase().includes(a)) falhas.push(`quadro ${q.numero}: "${a}" não é imagem`);
    }
    for (const id of IDS_DO_ELENCO) {
      const onde = [q.acao, q.acaoEn || "", q.titulo, q.fala || ""].join(" ");
      if (onde.includes(id)) falhas.push(`quadro ${q.numero}: o id "${id}" vazou para o texto que a pessoa lê`);
    }
    if ((q.textoNaTela || "").split(/\s+/).filter(Boolean).length > 7) {
      falhas.push(`quadro ${q.numero}: texto de tela com mais de 7 palavras`);
    }
  }

  // ── o relatório ─────────────────────────────────────────────
  console.log(`« ${peca.titulo} »\n`);
  for (const q of peca.quadros) {
    console.log(`  ${q.numero}. ${q.titulo}`);
    console.log(`     ${q.acao}`);
    if (q.textoNaTela) console.log(`     tela: "${q.textoNaTela}"`);
    if (q.fala) console.log(`     fala: "${q.fala}"`);
    console.log(`     câmera: ${Object.entries(q.ajustes).map(([g, v]) => `${g}=${v}`).join(" ")}`);
    if (q.correcoes?.length) console.log(`     ⚠ consertado: ${q.correcoes.join(" ")}`);
    console.log(`     → ${q.prompt.slice(0, 150)}…\n`);
  }
  console.log(`legenda:\n${peca.legenda}\n`);
  console.log(`#${peca.hashtags.join(" #")}\n`);

  if (falhas.length) {
    console.log("✗ FALHAS:");
    for (const f of falhas) console.log(`  · ${f}`);
    process.exit(1);
  }
  console.log("✓ os prompts passaram nas quatro conferências");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * O MOTOR DE TRADUÇÃO — pt-BR → en, para conteúdo estruturado.
 *
 * Usado pelas quatro frentes de conteúdo do site (ferramentas, catálogo de
 * cursos, corpo dos cursos, blog). Cada frente tem o seu script, que só sabe de
 * onde ler e para onde escrever; a tradução em si mora aqui, uma vez só.
 *
 * ── O que ele NÃO traduz ───────────────────────────────────────────────────
 *
 * A regra que mais importa não é sobre idioma, é sobre o que não é texto. Um
 * tradutor solto num JSON estraga tudo que parece frase e não é:
 *
 *   slug/URL      `/curso/chatgpt-zero` vira `/course/chatgpt-from-scratch`
 *                 e o link morre.
 *   {{fact:...}}  os tokens de fato dinâmico (ver reference_registry_fatos)
 *                 são resolvidos em tempo de render pelo NOME do token.
 *   ```código```  o bloco de código é o exemplo que o aluno vai copiar.
 *   prompt        o texto que o aluno cola no ChatGPT — em inglês É o certo,
 *                 mas traduzido pela metade não é.
 *
 * Por isso a travessia é por CAMINHO: quem chama declara quais chaves são
 * texto. Nada é traduzido por adivinhação.
 *
 * ── Por que em lotes de caminho, e não texto por texto ─────────────────────
 *
 * Uma chamada por string custaria 40 chamadas por ferramenta, 2.200 no total, e
 * o tradutor perderia o contexto entre o título e a descrição da mesma coisa. O
 * lote manda um objeto {caminho: texto} inteiro e recebe o mesmo objeto
 * traduzido — o modelo vê a ferramenta toda de uma vez e mantém o vocabulário
 * coerente.
 *
 * ── Retomada ───────────────────────────────────────────────────────────────
 *
 * Escreve o resultado a cada item. Rodar de novo pula o que já está pronto.
 * Uma queda de rede no item 40 de 56 não joga fora os 39 anteriores.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * O roteamento vem do MESMO arquivo que o site lê. Ver
 * `config/openrouter-roteamento.json` e `src/lib/ai/roteamento.ts`.
 *
 * Repetir a ordem dos provedores aqui seria a forma mais fácil de, daqui a três
 * meses, o site comprar de um e o script de outro sem ninguém notar.
 */
const ROTEAMENTO = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../../config/openrouter-roteamento.json"),
    "utf8",
  ),
);

const CHAVE = process.env.OPENROUTER_API_KEY;
if (!CHAVE) {
  console.error("Falta OPENROUTER_API_KEY. Rode com o .env.local carregado.");
  process.exit(1);
}

/**
 * A prateleira de provedores do modelo pedido — ordem e preço de entrada
 * cacheada. Ver `_aOrdemEPorMODELO` no arquivo de roteamento: a lista muda de
 * modelo para modelo, e a DeepInfra passa de mais barata a 3× mais cara.
 */
function prateleira(idDoModelo) {
  const chave = Object.keys(ROTEAMENTO.ordemPorModelo).find((k) => idDoModelo.includes(k));
  return chave
    ? ROTEAMENTO.ordemPorModelo[chave]
    : { ordem: ROTEAMENTO.ordemPadrao, cacheEntrada: 0 };
}

/** Flash para volume, Pro quando a frase é vitrine. Preço em USD por milhão. */
export const MODELOS = {
  volume: { id: "~deepseek/deepseek-v4-flash-latest", entrada: 0.09, saida: 0.18 },
  vitrine: { id: "deepseek/deepseek-v4-pro", entrada: 0.4225, saida: 0.845 },
};

const INSTRUCAO = `You are a professional pt-BR → en translator working on FayAI, a Brazilian platform that teaches people to use AI.

You receive a JSON object mapping opaque keys to Brazilian Portuguese strings. Return a JSON object with EXACTLY the same keys, each value translated into natural, idiomatic English.

Hard rules:
1. Same keys, same count. Never add, drop, merge or reorder keys.
2. Translate meaning, not words. The result must read as if written in English by a human — not as a translation. Keep the voice: direct, warm, confident, never corporate filler.
3. Preserve EXACTLY, character for character:
   - markdown structure (#, ##, -, *, 1., >, |tables|, **bold**, [text](url))
   - fenced code blocks and inline \`code\` — translate comments inside them, nothing else
   - {{fact:anything}} tokens
   - URLs, file paths, slugs, emails
   - emoji, and their position in the string
   - HTML/JSX-ish tags such as <forte>...</forte> or <destaque>...</destaque>
   - numbers, prices and units. R$ stays R$ (it is Brazilian currency, not a conversion).
4. Product, tool, brand and course names stay as they are (ChatGPT, Midjourney, n8n, Claude, FayAI). Do not translate them.
5. Leading/trailing whitespace and line breaks are part of the value. Keep them.
6. If a value is already English, return it unchanged.

Return ONLY the JSON object. No prose, no markdown fence around it.`;

/** Só o pedido HTTP. Separado para a captura de erro de rede ficar legível. */
async function fazerPedido(modelo, conteudo) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAVE}`,
      "HTTP-Referer": "https://fayai.com.br",
      "X-Title": "FayAI i18n",
    },
    body: JSON.stringify({
      model: modelo.id,
      /**
       * ⚠️ Provedor FIXADO. O V4 Flash tem 22 provedores; a DeepInfra cobra
       * 0,09/0,18 e a segunda colocada 0,13/0,26 — 44% a mais pela mesma
       * resposta. Sem `order`, quem escolhe é a OpenRouter, e a troca não
       * aparece em lugar nenhum a não ser na fatura.
       */
      provider: {
        order: prateleira(modelo.id).ordem,
        allow_fallbacks: ROTEAMENTO.permitirQueda,
      },
      messages: [
        /**
         * A instrução vai marcada para CACHE e vem PRIMEIRO — nesta ordem, e
         * não por acaso. O desconto vale para o prefixo repetido, e esta
         * instrução de ~1.900 caracteres é idêntica em todas as centenas de
         * chamadas de um lote. Entrada repetida custa 0,018 por M na DeepInfra
         * contra 0,09 da nova.
         *
         * Não são os 50× do anúncio do DeepSeek: aqueles são do endpoint dele,
         * onde a entrada nova custa 0,14. Aqui são 5×, e só sobre a ENTRADA —
         * neste trabalho quem manda no custo é a saída. Ver o `_quantoVale` do
         * arquivo de roteamento.
         */
        ROTEAMENTO.cache.ligado
          ? {
              role: "system",
              content: [
                { type: "text", text: INSTRUCAO, cache_control: { type: "ephemeral" } },
              ],
            }
          : { role: "system", content: INSTRUCAO },
        { role: "user", content: JSON.stringify(conteudo, null, 0) },
      ],
      // ⚠️ DeepSeek V4 é modelo de raciocínio: os tokens de pensamento saem do
      // mesmo orçamento. Abaixo de ~1500 o `content` volta VAZIO sem erro.
      // 16000 é o teto do modelo e o lote é dimensionado para caber nele.
      max_tokens: 16000,
      temperature: 0.2,
      response_format: { type: "json_object" },
      /**
       * ⚠️ RACIOCÍNIO DESLIGADO — e isto não é otimização, é o que faz o
       * corpo dos cursos funcionar.
       *
       * Com raciocínio ligado, um capítulo de 9.500 caracteres fazia o modelo
       * gastar os 16.000 tokens INTEIROS pensando e devolver `content` vazio,
       * com status 200. Medido em 06/08/2026: a fila dos capítulos entrou num
       * ciclo de repetições em que quase toda chamada voltava vazia, e cada
       * repetição custava o orçamento cheio.
       *
       * Traduzir não é raciocinar. Não há problema a resolver — há um texto a
       * reescrever noutra língua, e o modelo faz isso direto. Com
       * `enabled: false` o mesmo lote voltou com 0 token de pensamento e o
       * texto completo.
       */
      reasoning: { enabled: false },
    }),
  });

}

/** Uma chamada ao OpenRouter, com repetição em falha transitória. */
async function chamar(modelo, conteudo, tentativa = 1) {
  let res;
  try {
    res = await fazerPedido(modelo, conteudo);
  } catch (e) {
    /**
     * Queda de REDE, não resposta ruim: `fetch` lança antes de haver status.
     *
     * A fila dos capítulos morreu com `terminated` (socket derrubado pelo
     * outro lado) depois de 40 minutos e 5 cursos prontos. Sem esta captura,
     * uma piscada de rede joga fora a hora seguinte de trabalho — e o script
     * roda por horas de propósito.
     */
    if (tentativa < 5) {
      const espera = 3000 * tentativa;
      console.warn(`   ↻ rede caiu (${e.message}), repetindo em ${espera}ms`);
      await new Promise((r) => setTimeout(r, espera));
      return chamar(modelo, conteudo, tentativa + 1);
    }
    throw e;
  }
  if (!res.ok) {
    const txt = await res.text();
    if (tentativa < 4 && (res.status === 429 || res.status >= 500)) {
      const espera = 2000 * tentativa;
      console.warn(`   ↻ ${res.status}, repetindo em ${espera}ms`);
      await new Promise((r) => setTimeout(r, espera));
      return chamar(modelo, conteudo, tentativa + 1);
    }
    throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 300)}`);
  }

  const dados = await res.json();
  const texto = dados.choices?.[0]?.message?.content ?? "";

  // ⚠️ A armadilha do DeepSeek V4: modelo de raciocínio devolve 200 com
  // `content` VAZIO e o texto todo em `reasoning`. Não é erro de rede nem de
  // tamanho — acontece de forma esporádica, e derrubou a fila das ferramentas
  // no item 43 de 56. Repetir resolve: a temperatura é 0,2, não 0.
  if (!texto.trim()) {
    const raciocinio = dados.usage?.completion_tokens_details?.reasoning_tokens;
    if (tentativa < 4) {
      console.warn(`   ↻ content vazio (${raciocinio ?? 0} tokens em raciocínio), repetindo`);
      await new Promise((r) => setTimeout(r, 1500 * tentativa));
      return chamar(modelo, conteudo, tentativa + 1);
    }
    throw new Error(
      `content vazio depois de 4 tentativas` +
        (raciocinio ? ` — ${raciocinio} tokens gastos em raciocínio` : "")
    );
  }

  // O modelo às vezes envolve em ```json apesar do response_format.
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let saida;
  try {
    saida = JSON.parse(limpo);
  } catch (e) {
    /**
     * JSON cortado no meio = a resposta bateu no teto de `max_tokens`.
     *
     * Não adianta repetir igual: o mesmo lote vai estourar de novo. Quem
     * chama precisa PARTIR o lote — por isso o erro é marcado, e
     * `traduzirMapa` reconhece a marca e divide ao meio.
     *
     * A causa: com raciocínio desligado a saída inteira é texto útil, então
     * um lote que antes cabia (porque metade virava pensamento descartado)
     * agora enche os 16.000 de tradução de verdade.
     */
    const erro = new Error(`resposta cortada (${limpo.length} chars): ${e.message}`);
    erro.cortada = true;
    throw erro;
  }

  return {
    saida,
    entrada: dados.usage?.prompt_tokens ?? 0,
    saidaTokens: dados.usage?.completion_tokens ?? 0,
    // quanto da entrada veio do cache, e quem serviu — os dois medidos, não
    // presumidos. Ver `_comoConferir` no arquivo de roteamento.
    cacheadas: dados.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    provedor: dados.provider ?? "?",
  };
}

/**
 * Traduz um mapa {chave: texto}. Divide em lotes por tamanho para não estourar
 * o orçamento de saída do modelo.
 *
 * `limite` é em CARACTERES de entrada. A saída em inglês costuma ficar em torno
 * de 0,95× do português; 12.000 caracteres de entrada dão ~4.000 tokens de
 * saída, com folga larga para o raciocínio dentro dos 16.000.
 */
export async function traduzirMapa(
  mapa,
  { modelo = MODELOS.volume, limite = 12000, paralelo = 1 } = {},
) {
  const chaves = Object.keys(mapa);
  const lotes = [];
  let atual = {};
  let tamanho = 0;

  for (const k of chaves) {
    const v = String(mapa[k] ?? "");
    // Um valor sozinho maior que o limite vira um lote só dele: cortar no meio
    // de um capítulo perderia o contexto e a coerência do vocabulário.
    if (tamanho > 0 && tamanho + v.length > limite) {
      lotes.push(atual);
      atual = {};
      tamanho = 0;
    }
    atual[k] = v;
    tamanho += v.length;
  }
  if (Object.keys(atual).length) lotes.push(atual);

  const saida = {};
  let custo = 0;
  let prontos = 0;
  const medida = { entrada: 0, cacheadas: 0, provedores: new Set() };

  /**
   * Um lote, com a checagem que impede o pior defeito silencioso: chave que
   * sumiu vira campo vazio na tela. Faltando alguma, ela simplesmente não entra
   * na saída e o português fica (ver `escolher` em src/lib/idioma.ts).
   */
  async function processar(lote, indice) {
    let r;
    try {
      r = await chamar(modelo, lote);
    } catch (e) {
      // Resposta cortada no teto de tokens: parte o lote e tenta as metades.
      // Um lote de uma chave só não tem como partir — aí o erro sobe, e quem
      // chama decide (no corpo dos cursos, o pedaço fica em português).
      const chaves = Object.keys(lote);
      if (!e.cortada || chaves.length < 2) throw e;
      const meio = Math.ceil(chaves.length / 2);
      console.warn(`   ✂ lote ${indice + 1} cortado — partindo em ${meio}+${chaves.length - meio}`);
      const metade = (ks) => Object.fromEntries(ks.map((k) => [k, lote[k]]));
      await processar(metade(chaves.slice(0, meio)), indice);
      await processar(metade(chaves.slice(meio)), indice);
      return;
    }

    const faltando = Object.keys(lote).filter((k) => !(k in r.saida));
    if (faltando.length) {
      console.warn(`   ⚠ lote ${indice + 1}: ${faltando.length} chave(s) sem tradução`);
    }
    Object.assign(saida, r.saida);
    /**
     * A entrada cacheada é cobrada à parte, e mais barata. Contar tudo ao
     * preço cheio inflaria o custo relatado — e um número inflado seria o
     * mesmo problema, ao contrário, de prometer economia que não existe.
     */
    const cacheEntrada = prateleira(modelo.id).cacheEntrada || modelo.entrada;
    const novas = Math.max(0, r.entrada - r.cacheadas);
    custo +=
      (novas / 1e6) * modelo.entrada +
      (r.cacheadas / 1e6) * cacheEntrada +
      (r.saidaTokens / 1e6) * modelo.saida;
    medida.entrada += r.entrada;
    medida.cacheadas += r.cacheadas;
    medida.provedores.add(r.provedor);
    prontos++;
    if (lotes.length > 1) {
      process.stdout.write(`\r   ${prontos}/${lotes.length} lotes`);
    }
  }

  // `paralelo` existe por causa do corpo dos cursos: 4,7 MB em ~500 lotes, um
  // de cada vez, dá horas de espera contra uma API que aceita concorrência de
  // sobra. Vai como opção e não como padrão porque a vitrine é curta e
  // sequencial é mais fácil de ler quando dá errado.
  if (paralelo <= 1) {
    for (let i = 0; i < lotes.length; i++) await processar(lotes[i], i);
  } else {
    const fila = lotes.map((lote, i) => ({ lote, i }));
    const trabalhadores = Array.from({ length: Math.min(paralelo, fila.length) }, async () => {
      for (;;) {
        const item = fila.shift();
        if (!item) return;
        await processar(item.lote, item.i);
      }
    });
    await Promise.all(trabalhadores);
  }
  if (lotes.length > 1) process.stdout.write("\n");
  if (medida.entrada) {
    const pct = ((medida.cacheadas / medida.entrada) * 100).toFixed(1);
    console.log(
      `   provedor: ${[...medida.provedores].join(", ")} · ` +
        `entrada ${medida.entrada} tokens, ${medida.cacheadas} em cache (${pct}%)`,
    );
  }
  return { saida, custo, medida };
}

/** Grava JSON com indentação estável, criando a pasta se preciso. */
export function gravar(arquivo, dados) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2) + "\n", "utf8");
}

/** Lê JSON, ou devolve o padrão se o arquivo ainda não existe (retomada). */
export function ler(arquivo, padrao = {}) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
  } catch {
    return padrao;
  }
}

export function dinheiro(usd) {
  return `US$ ${usd.toFixed(4)}`;
}

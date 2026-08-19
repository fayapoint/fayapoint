/**
 * Avisar o site que o conteúdo mudou — o passo que faltava no fim dos scripts.
 *
 * ⚠️ ESTE ARQUIVO É A FONTE. `invalidar-cache.mjs` só reexporta o que está aqui.
 * (CommonJS porque metade dos scripts é `.cjs`, e `require()` não carrega ESM.)
 *
 * ## O buraco que isto fecha
 *
 * Os scripts de conteúdo gravam direto no Mongo. O site NÃO lê o Mongo em toda
 * visita: ele lê o Upstash, com validade de 10 minutos para catálogo, produto e
 * tradução, e de 1 hora para os capítulos já picados do livro e do Ateliê.
 * Então, entre o script dizer "curso gravado" e a página mostrar o texto novo,
 * havia até uma hora de silêncio — sem erro, sem log, sem nada que apontasse
 * para o cache. Quem via concluía que a gravação falhou.
 *
 * `invalidateProductCache()` existia no repositório desde sempre e **nenhum
 * arquivo a chamava**.
 *
 * ## Por que HTTP e não Redis direto
 *
 * `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` só existem no ambiente
 * da Netlify — não estão no `.env.local`, e não devem estar. Quem tem a chave é
 * o site; o script pede, por `POST /api/admin/invalidar-cache`.
 *
 * ## Uso
 *
 *     const { invalidarCache } = require("../lib/invalidar-cache.cjs");
 *     import { invalidarCache } from "../lib/invalidar-cache.mjs";
 *
 *     await invalidarCache(slug);   // um curso (mais barato)
 *     await invalidarCache();       // catálogo inteiro
 *
 * Pelo terminal, para escrita feita à mão ou por script ainda não migrado:
 *
 *     node scripts/invalidar-cache.mjs [slug]
 *
 * ## Falha
 *
 * ⚠️ NÃO derruba o script, e isso é deliberado. Gravar o curso é o trabalho;
 * invalidar é o acabamento. Um script que já escreveu no banco não pode
 * terminar com código de erro por causa do cache — num laço de reprocessamento
 * isso faria a escrita acontecer de novo. Falhou, avisa alto e diz o comando
 * manual; o TTL resolve em 10 minutos de qualquer jeito.
 */
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

/** Do ambiente ou do `.env.local` — o mesmo caminho de `lib/mongo.cjs`. */
function doAmbiente(nome) {
  if (process.env[nome]) return process.env[nome];
  for (const arquivo of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(__dirname, "..", "..", arquivo), "utf8");
      const m = txt.match(new RegExp(`^${nome}=(.+)$`, "m"));
      if (m) return m[1].trim();
    } catch {
      /* tenta o próximo */
    }
  }
  return undefined;
}

async function invalidarCache(slug) {
  /**
   * O site de PRODUÇÃO, de propósito. O cache que interessa é o que serve
   * visitante — e o script está gravando no Mongo de produção, porque só existe
   * um cluster. Invalidar um Redis local não invalidaria nada.
   */
  const site = doAmbiente("SITE_URL") || "https://fayai.com.br";
  const segredo = doAmbiente("SOCIAL_CRON_SECRET") || doAmbiente("AINEWS_SECRET");
  const alvo = slug ? `?slug=${encodeURIComponent(slug)}` : "";
  const url = `${site}/api/admin/invalidar-cache${alvo}`;

  if (!segredo) {
    console.warn(
      "\n⚠️  CACHE NÃO INVALIDADO: falta SOCIAL_CRON_SECRET (ou AINEWS_SECRET) no .env.local." +
        "\n   O texto novo só aparece quando o TTL vencer (até 10 min; 1h nos capítulos do livro)." +
        "\n   Pegue o valor com:  npx netlify env:get AINEWS_SECRET",
    );
    return false;
  }

  try {
    /**
     * Teto de 15s. A rota faz cinco varreduras `KEYS` no Upstash (~1s medido).
     * Sem teto, um Upstash pendurado deixaria o script parado para sempre
     * DEPOIS de já ter feito o trabalho todo.
     */
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "x-social-secret": segredo, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(15_000),
    });

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status} ${(await resposta.text()).slice(0, 160)}`);
    }
    const dados = await resposta.json();
    // `apagadas` é o que separa "invalidou" de "rodou e não achou nada".
    // Zero logo depois de gravar quer dizer que a chave do cache mudou de
    // forma e a invalidação ficou apontando para o nome antigo.
    /**
     * ⚠️ Imprimir SÓ `apagadas` fazia a linha mentir por omissão. Há duas
     * camadas de cache, e a rota mexe nas duas: o Redis (`apagadas`) e o cache
     * de página do Next (`revalidadas`). Curso recém-gravado quase nunca tem
     * chave quente no Redis, então a linha dizia "0 chave(s) apagada(s)" depois
     * de um trabalho que funcionou — e "0" lido sozinho manda procurar defeito
     * onde não há. Com os dois números, zero no primeiro é informação, não
     * susto.
     */
    const caminhos = Array.isArray(dados.revalidadas) ? dados.revalidadas.length : 0;
    console.log(
      `🧹 cache do site: ${dados.apagadas} chave(s) do Redis + ${caminhos} caminho(s) do Next ` +
        `(${dados.alvo}, ${dados.ms}ms)`,
    );
    return true;
  } catch (erro) {
    console.warn(
      `\n⚠️  CACHE NÃO INVALIDADO (${erro && erro.message ? erro.message : erro}).` +
        "\n   O banco JÁ ESTÁ certo; é a página que pode servir o texto anterior por até 10 min." +
        `\n   Para forçar agora:  node scripts/invalidar-cache.mjs ${slug || ""}`.trimEnd(),
    );
    return false;
  }
}

module.exports = { invalidarCache };

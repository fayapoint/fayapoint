/**
 * Traduz o dicionário de interface: `messages/_interface.textos.json` (a lista
 * colhida do código) → `messages/dicionario.en.json` (o mapa pt → en que o site
 * consome).
 *
 * ── É incremental, e isso é a parte importante ────────────────────────────────
 *
 * Só manda para o modelo o que ainda não tem tradução. Rodar de novo depois de
 * mexer numa tela custa os textos novos e mais nada — e é o que torna esta
 * abordagem sustentável: cada tela que alguém escrever daqui para frente entra
 * no inglês com um comando, sem revisitar as 1.700 anteriores.
 *
 * ── Por que lote pequeno ──────────────────────────────────────────────────────
 *
 * O motor corta por número de caracteres. Aqui os valores são curtos (rótulo de
 * botão, título de painel), então um lote de 12.000 caracteres viraria 300
 * chaves numa resposta só — e resposta longa é onde o modelo começa a pular
 * chave e a devolver eco. 3.000 mantém o lote em algumas dezenas de chaves.
 *
 * Uso:
 *   node --env-file=.env.local scripts/i18n/interface.mjs [--paralelo 6] [--refazer]
 */
import { writeFileSync } from "fs";
import { traduzirMapa, MODELOS, ler, dinheiro } from "./traduzir.mjs";
import { colher, chaveDe, ALVOS_PADRAO } from "./extrair-interface.mjs";

const DESTINO = "messages/dicionario.en.json";

/**
 * Texto que NÃO deve ser traduzido mesmo aparecendo na tela.
 *
 * Isto existe por causa de um aviso caro da rodada anterior: dado que MEDE não
 * se traduz. As sementes do Radar medem o autocomplete brasileiro — em inglês
 * mediriam outra coisa. Marca própria também fica: FayAI é FayAI nos dois
 * idiomas.
 */
const NAO_TRADUZIR = [
  /^FayAI$/i,
  /^fayai\./i,
  // endônimo: o seletor mostra cada idioma na própria língua
  /^Português( \(BR\))?$/i,
  /**
   * Nome de ferramenta SOZINHO. O `$` no fim não é detalhe.
   *
   * ⚠️ Sem ele a regra era um prefixo, e comeu frase inteira: "ChatGPT
   * recomenda Nike, Adidas… e ignora sua loja completamente." nunca chegou ao
   * tradutor, e a `/chatgpt-allowlisting` ficou com sete frases em português
   * numa página que se chama, ela própria, ChatGPT. A tradução já preserva
   * nome de produto por instrução do motor — esta lista existe só para o caso
   * em que o texto INTEIRO é a marca.
   */
  /^(ChatGPT|Claude|Gemini|Midjourney|Leonardo|Perplexity|n8n|Make|Zapier|Notion|Canva|Figma|Runway|Suno|ElevenLabs|Sora|Higgsfield|OpenClaw)$/i,
];

function main() {
  const argv = process.argv.slice(2);
  const paralelo = argv.includes("--paralelo") ? Number(argv[argv.indexOf("--paralelo") + 1]) : 6;
  const refazer = argv.includes("--refazer");

  // A lista de alvos mora no extrator, num lugar só — ver o aviso lá sobre por
  // que ela é "tudo menos X" e não uma lista escrita à mão.
  const textos = colher(ALVOS_PADRAO);

  const pronto = refazer ? {} : ler(DESTINO);
  const faltando = textos.filter(
    (t) => !pronto[t] && !NAO_TRADUZIR.some((r) => r.test(t)),
  );

  console.log(`${textos.length} texto(s) no código · ${Object.keys(pronto).length} já traduzidos`);
  if (!faltando.length) {
    console.log("Nada a fazer.");
    return Promise.resolve();
  }
  console.log(`→ traduzindo ${faltando.length}\n`);

  /**
   * Chave opaca (`t0`, `t1`, …) em vez do próprio português.
   *
   * O motor devolve um JSON, e chave com aspas, quebra de linha e acento é
   * exatamente o tipo de coisa que faz o modelo reescrever a chave "para
   * arrumar" — e chave reescrita é tradução perdida em silêncio. O português
   * volta a ser chave só aqui, na gravação.
   */
  const mapa = Object.fromEntries(faltando.map((t, i) => [`t${i}`, t]));

  return traduzirMapa(mapa, { modelo: MODELOS.volume, limite: 3000, paralelo }).then(
    ({ saida, custo }) => {
      let gravados = 0;
      let eco = 0;

      for (const [k, pt] of Object.entries(mapa)) {
        const en = saida[k];
        if (!en || typeof en !== "string" || !en.trim()) continue;
        /**
         * O ECO: o modelo devolve o português achando que já está em inglês.
         * Aqui isso é BARATO de tolerar — a entrada idêntica é a mesma coisa
         * que não ter entrada, e o site cai no português de qualquer jeito. Só
         * contamos para saber o tamanho do problema.
         *
         * Palavra que é igual nos dois idiomas ("Design", "Marketing", "Total")
         * cai neste balde também, e está certo que caia: gravar não muda nada.
         */
        if (chaveDe(en) === chaveDe(pt)) {
          eco++;
          continue;
        }
        pronto[chaveDe(pt)] = en.trim();
        gravados++;
      }

      writeFileSync(DESTINO, JSON.stringify(ordenado(pronto), null, 2) + "\n", "utf8");
      console.log(
        `\n${gravados} gravado(s), ${eco} eco/idêntico(s). ` +
          `${Object.keys(pronto).length} no dicionário. Custo: ${dinheiro(custo)}`,
      );
    },
  );
}

/** Ordenado para o diff do git ser legível — o arquivo é revisado à mão. */
function ordenado(obj) {
  return Object.fromEntries(
    Object.keys(obj)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((k) => [k, obj[k]]),
  );
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  console.error("O que já foi gravado continua valendo. Rode de novo para continuar.");
  process.exit(1);
});

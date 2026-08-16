/**
 * Captura telas reais do fayai.com.br para entrarem nas capas do blog.
 *
 * ## Por que
 *
 * Pedido do Ricardo em 29/07/2026: *"se for uma tela de laptop, devemos utilizar
 * um print do nosso site, o que daria identidade e recall"*.
 *
 * E resolve de quebra o defeito das capas anteriores: o Qwen desenha texto
 * rabiscado em qualquer tela, e neste workflow não há como evitar — o
 * `ConditioningZeroOut` + CFG 1.0 (exigido pela LoRA Lightning de 4 passos)
 * faz o prompt negativo ser ignorado, então "no text" não tem efeito nenhum.
 * Compondo um print de verdade por cima, a tela fica legível E é a nossa.
 *
 * Duas proporções, porque a cena manda: 16:10 para monitor/laptop e 9:19.5
 * para celular na mão.
 *
 *     node scripts/arcade/capturar_telas_site.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "..", "..", "_capas_novas", "telas");
mkdirSync(SAIDA, { recursive: true });

const BASE = "https://fayai.com.br";

/**
 * O que cada tela serve.
 *
 * A escolha não é aleatória: cada capa recebe a tela cujo ASSUNTO combina com o
 * da matéria. Notícia sobre busca leva o Radar; notícia sobre modelo leva um
 * curso; notícia sobre privacidade leva o portal. Print genérico da home em
 * tudo seria o mesmo erro do mascote, só que com a nossa cara.
 */
const TELAS = [
  { id: "home", url: "/pt-BR", esperar: 5000 },
  { id: "radar", url: "/pt-BR/radar", esperar: 6000 },
  { id: "noticias", url: "/pt-BR/noticias", esperar: 4000 },
  { id: "cursos", url: "/pt-BR/cursos", esperar: 4000 },
  { id: "ferramentas", url: "/pt-BR/ferramentas", esperar: 4000 },
  { id: "curso-chatgpt", url: "/pt-BR/curso/chatgpt-zero", esperar: 4000 },
];

const FORMATOS = [
  { nome: "desktop", viewport: { width: 1440, height: 900 }, escala: 2 },
  { nome: "mobile", viewport: { width: 390, height: 844 }, escala: 3 },
];

const navegador = await chromium.launch({ headless: true });

for (const formato of FORMATOS) {
  const ctx = await navegador.newContext({
    viewport: formato.viewport,
    deviceScaleFactor: formato.escala,
    locale: "pt-BR",
  });
  const page = await ctx.newPage();

  for (const tela of TELAS) {
    const destino = join(SAIDA, `${tela.id}__${formato.nome}.png`);
    try {
      await page.goto(BASE + tela.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      // O site tem animação de entrada e conteúdo que chega do banco; sem a
      // espera o print sai com esqueleto de carregamento, que é justamente a
      // aparência de site quebrado que não queremos numa capa.
      await page.waitForTimeout(tela.esperar);
      await page.screenshot({ path: destino });
      console.log(`OK   ${tela.id.padEnd(16)} ${formato.nome.padEnd(8)} -> ${destino}`);
    } catch (e) {
      console.log(`FALHA ${tela.id} ${formato.nome}: ${e.message.slice(0, 80)}`);
    }
  }
  await ctx.close();
}

await navegador.close();
console.log("\nfim");

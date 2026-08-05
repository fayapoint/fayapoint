/**
 * Descobre A QUE CURSO pertence cada vídeo gerado, medindo a imagem de origem.
 *
 * ── O problema que este script resolve ─────────────────────────────────────
 *
 * O Higgsfield devolve, para cada vídeo, a imagem que o gerou — mas não o nome
 * do curso. E o nome do curso é a única coisa que importa na hora de gravar o
 * arquivo: `intro/<slug>.webm` no lugar errado é pior do que não ter vídeo,
 * porque a página promete falar daquele assunto e mostra outro.
 *
 * A tentação é casar pelo TEXTO do prompt ("a fábrica com braços robóticos deve
 * ser o curso de automação"). Não serve: os prompts das cenas foram escritos
 * para serem específicos do conteúdo, não do slug, e dois cursos vizinhos têm
 * cenas parecidas de propósito. Um palpite errado aqui não dá erro nenhum — dá
 * uma página de venda ilustrando o curso do lado.
 *
 * ── Como ele decide ────────────────────────────────────────────────────────
 *
 * Assinatura de imagem, a mesma técnica que em 05/08 desfez a dúvida sobre a
 * fonte dos loops de capa (distâncias de 4,5 a 11 no par certo contra 27 a 32
 * no errado — sem ambiguidade).
 *
 * Cada imagem vira um mapa de 16×16 em cinza, normalizado pela própria média e
 * desvio. Normalizar é o que torna a medida imune ao que MUDA entre o PNG
 * original do Higgsfield e o `.webp` que está no disco: reescala, requantização
 * e a compressão a 82. O que sobra comparável é a ESTRUTURA — onde estão as
 * áreas claras e escuras —, e é ela que identifica a imagem.
 *
 * A distância é a soma dos quadrados das diferenças. Um par verdadeiro fica uma
 * ordem de grandeza abaixo do segundo colocado; o script imprime os dois para
 * que a decisão seja auditável em vez de confiada.
 *
 * ── Os dois universos de candidatos ────────────────────────────────────────
 *
 * · vídeo 16:9 (1376×768) → é ABERTURA de curso, e nasceu da cena 1 daquele
 *   curso. Candidatos: `public/cursos/cena/*.webp`.
 * · vídeo 1:1 (1024×1024) → é LOOP DE CAPA, e nasceu da faixa central da capa
 *   publicada. Candidatos: `extract(0,160,720,720)` sobre
 *   `scripts/_capas_livro/<slug>.webp` — o recorte medido no handoff de 05/08.
 *
 * uso: node scripts/casar-fontes.mjs <videos.json> > mapa.tsv
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import sharp from "sharp";

const LADO = 16;

/**
 * apelido do arquivo de cena → slug do curso.
 *
 * Derivado de `curso-midia.ts` na hora, e não de um JSON gravado ao lado: um
 * mapa em disco vira mentira no dia em que alguém acrescentar um curso, e
 * mentira silenciosa — o script continuaria rodando, só que ignorando o curso
 * novo. A fonte é o arquivo que já é a verdade.
 */
/* ⚠️ Uma varredura em duas passadas, e não um só regex com `[^{}]*`.
   Entre a chave do curso e a primeira cena pode haver um bloco `intro: { … }`
   (que `ligar-videos.mjs` escreve depois) — qualquer classe negada de chaves
   morre ali. Aqui pegamos as posições das chaves de curso e, para cada uma,
   o primeiro `c("<apelido>-1"` que aparece antes da chave SEGUINTE. */
const APELIDOS = (() => {
  const fonte = readFileSync("src/data/curso-midia.ts", "utf8");
  const chaves = [...fonte.matchAll(/^  "([a-z0-9-]+)":\s*\{$/gm)];
  const mapa = {};
  for (let i = 0; i < chaves.length; i++) {
    const inicio = chaves[i].index;
    const fim = i + 1 < chaves.length ? chaves[i + 1].index : fonte.length;
    const cena = /c\("([a-z0-9-]+?)-1"/.exec(fonte.slice(inicio, fim));
    if (cena) mapa[cena[1]] = chaves[i][1];
  }
  return mapa;
})();

/** O mapa 16×16 normalizado. `raw` evita qualquer decisão de cor do encoder. */
async function assinatura(entrada) {
  const { data } = await sharp(entrada)
    .greyscale()
    .resize(LADO, LADO, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const v = Array.from(data);
  const media = v.reduce((a, b) => a + b, 0) / v.length;
  const desvio =
    Math.sqrt(v.reduce((a, b) => a + (b - media) ** 2, 0) / v.length) || 1;
  return v.map((x) => (x - media) / desvio);
}

const distancia = (a, b) => a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0);

/* ── Os candidatos ───────────────────────────────────────────────────────── */

const cenas = [];
for (const f of readdirSync("public/cursos/cena").filter((f) => f.endsWith(".webp"))) {
  cenas.push({ nome: basename(f, ".webp"), sig: await assinatura(join("public/cursos/cena", f)) });
}

const capas = [];
for (const f of readdirSync("scripts/_capas_livro").filter((f) => f.endsWith(".webp") && !f.startsWith("_"))) {
  const buf = await sharp(join("scripts/_capas_livro", f))
    .extract({ left: 0, top: 160, width: 720, height: 720 })
    .toBuffer();
  capas.push({ nome: basename(f, ".webp"), sig: await assinatura(buf) });
}

console.error(`candidatos: ${cenas.length} cenas, ${capas.length} capas`);

/* ── A medição ───────────────────────────────────────────────────────────── */

const videos = JSON.parse(readFileSync(process.argv[2], "utf8"));
const cache = new Map();

for (const v of videos) {
  if (!v.src) {
    console.error(`SEM FONTE  ${v.stamp}`);
    continue;
  }
  let sig = cache.get(v.src);
  if (!sig) {
    try {
      const r = await fetch(v.src);
      if (!r.ok) throw new Error("HTTP " + r.status);
      sig = await assinatura(Buffer.from(await r.arrayBuffer()));
      cache.set(v.src, sig);
    } catch (e) {
      console.error(`FALHOU     ${v.stamp}  ${e.message}`);
      continue;
    }
  }

  const quadrado = v.w === v.h;
  const universo = quadrado ? capas : cenas;
  const notas = universo
    .map((c) => ({ nome: c.nome, d: distancia(sig, c.sig) }))
    .sort((a, b) => a.d - b.d);
  const [melhor, segundo] = notas;

  // O nome do arquivo final. O loop de capa é batizado com o slug; a abertura
  // ganha o prefixo que `baixar-videos.mjs` usa para escolher o destino.
  //
  // ⚠️ O arquivo da CENA usa apelido, não slug (`openclaw-1.webp` para
  // `openclaw-ia-open-source`). O apelido é curto de propósito — 66 arquivos
  // com o slug inteiro seriam ilegíveis numa listagem —, mas o destino do
  // vídeo é por SLUG. Sem esta tradução, `intro-openclaw.webm` seria gravado e
  // a página de `openclaw-ia-open-source` nunca o encontraria: um `<video>`
  // apontando para 404 some em silêncio, e ninguém saberia.
  const bruto = quadrado ? melhor.nome : melhor.nome.replace(/-\d+$/, "");
  const slug = quadrado ? bruto : APELIDOS[bruto];
  if (!slug) {
    console.error(`SEM SLUG   apelido "${bruto}" não está em curso-midia.ts`);
    continue;
  }
  const nome = quadrado ? slug : `intro-${slug}`;

  console.error(
    `${nome.padEnd(38)} d=${melhor.d.toFixed(1).padStart(7)}  2º=${segundo.nome} (${segundo.d.toFixed(1)})  margem=${(segundo.d / (melhor.d || 0.001)).toFixed(1)}x`,
  );
  console.log(`${nome}\t${v.stamp}_${v.id}`);
}

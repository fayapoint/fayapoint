/**
 * Arquiva as capas dos cursos em D:\fayai\Cursos\capas, uma pasta por curso,
 * com o prompt que gerou cada uma.
 *
 * ── Por que existe ─────────────────────────────────────────────────────────
 *
 * Pedido do Ricardo em 03/08/2026: *"como eu não tenho o prompt que gerou
 * aquela capa, gostaria que você criasse os arquivos que contenham os prompts
 * para os cursos existentes e organizasse as capas atuais dentro de cada pasta
 * respectiva"*. É o mesmo hábito que já vale para o blog em
 * `D:\fayai\Blog images\` — a imagem publicada mora ao lado do texto que a
 * pediu, para dar para trocar, refazer no Higgsfield ou comparar versões sem
 * arqueologia.
 *
 * ── O que ele copia ────────────────────────────────────────────────────────
 *
 *   origem-comfyui-1024.png     a arte crua que saiu do ComfyUI, sem texto
 *   arte-quadrada-1024.webp     a arte + marca + título (scripts/_capas_v2)
 *   capa-livro-720x1040.webp    o livro montado em SVG (scripts/_capas_livro)
 *   PROMPT.md                   prompt de conteúdo, de geração e composição
 *
 * ── A parte chata: casar o PNG cru com o curso ─────────────────────────────
 *
 * A rodada de 03/08 salvou tudo como `capa_000NN_.png` — o `filename_prefix`
 * do SaveImage era a palavra "capa", sem o slug. Vinte e nove arquivos, nenhum
 * com dono. Como `_capas_v2/<slug>.webp` é a MESMA arte com uma camada de
 * texto por cima, dá para casar por semelhança: reduzo os dois a 32×32 em
 * cinza, olhando só a faixa de 15% a 55% da altura (acima do véu escuro do
 * título e abaixo da marca), e fico com o menor erro médio.
 *
 * O prefixo já foi corrigido em `gerar-capas-cursos.mjs`. Da próxima vez o
 * arquivo nasce com o slug no nome e este casamento vira código morto — que é
 * exatamente o que se quer dele.
 *
 *   node --env-file=.env.local scripts/arquivar-capas.mjs           # ensaio
 *   node --env-file=.env.local scripts/arquivar-capas.mjs --gravar
 */

import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "./lib/mongo.mjs";

import { motivo, promptDe, promptLivro, NEGATIVO, PARAMETROS } from "./gerar-capas-cursos.mjs";
import { composicaoDe } from "./gerar-capas-livro.mjs";

const ARTES = path.join(process.cwd(), "scripts", "_capas_v2");
const LIVROS = path.join(process.cwd(), "scripts", "_capas_livro");
const COMFY_OUT = "C:\\WORKS\\ComfyUI\\output";
const DESTINO = "D:\\fayai\\Cursos\\capas";

/* ── Casamento por semelhança ─────────────────────────────────────────────── */

/**
 * Assinatura de 32×32 em cinza da faixa central-alta da imagem.
 *
 * De 15% a 55% da altura: acima disso mora a marca "FAYAI.COM.BR" que só a
 * versão composta tem; abaixo começa o véu escuro do título, que apaga a arte
 * e faria todas as imagens parecerem iguais.
 */
async function assinatura(entrada) {
  const img = sharp(entrada);
  const { width, height } = await img.metadata();
  return img
    .extract({
      left: 0,
      top: Math.round(height * 0.15),
      width,
      height: Math.round(height * 0.4),
    })
    .resize(32, 32, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();
}

function erro(a, b) {
  let soma = 0;
  for (let i = 0; i < a.length; i++) soma += Math.abs(a[i] - b[i]);
  return soma / a.length;
}

/* ── Nome da pasta ────────────────────────────────────────────────────────── */

const semAcento = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Reaproveita a pasta que o Ricardo já criou à mão, quando existir.
 *
 * Ele abriu `01- IA Em Produção` para o `ia-producao` antes desta sessão.
 * Criar uma segunda pasta para o mesmo curso seria trocar o arquivo dele por
 * um meu — a pasta é do Ricardo, o script só a preenche.
 */
function acharPastaExistente(pastas, produto) {
  const alvos = [produto.slug, produto.shortName, produto.name]
    .filter(Boolean)
    .map((t) => semAcento(String(t)).replace(/[^a-z0-9]+/g, ""));
  return pastas.find((p) => {
    const limpo = semAcento(p).replace(/^\d+[-.\s]+/, "").replace(/[^a-z0-9]+/g, "");
    return alvos.some((a) => a && (limpo === a || limpo.startsWith(a) || a.startsWith(limpo)));
  });
}

/* ── O documento ──────────────────────────────────────────────────────────── */

function capitulosDe(p) {
  return p.courseContent ? (p.courseContent.match(/^#{1,2} Cap[íi]tulo /gim) || []).length : 0;
}

/**
 * As imagens que o Ricardo pôs na pasta à mão — as saídas do Higgsfield.
 *
 * Ele nomeia a escolhida com o sufixo `_good`, e é essa que vale: as outras
 * são as alternativas descartadas da mesma rodada. O documento lista as duas
 * coisas, senão o arquivo diria que a pasta tem menos do que tem.
 */
function linhasDosArquivosDoRicardo(arquivos) {
  return arquivos
    .filter((f) => /^hf_/i.test(f))
    .sort()
    .map((f) => {
      const escolhida = /_good\.[a-z0-9]+$/i.test(f);
      return `| \`${f}\` | ${
        escolhida
          ? "**a escolhida** — saída do Higgsfield aprovada pelo Ricardo"
          : "alternativa da mesma rodada do Higgsfield, descartada"
      } |`;
    });
}

function documento(p, { pngCru, erroCasamento, arquivos = [] }) {
  const comp = composicaoDe(p.slug);
  const titulo = p.shortName?.trim() || p.name;
  const caps = capitulosDe(p);
  const doRicardo = linhasDosArquivosDoRicardo(arquivos);

  return `# Capa — ${titulo}

| | |
|---|---|
| **slug** | \`${p.slug}\` |
| **título na capa** | ${titulo} |
| **nível** | ${p.level || p.categoryPrimary || "—"} |
| **ferramenta** | ${p.tool || "—"} |
| **capítulos** | ${caps || "—"} |
| **etiqueta gravada** | ${caps ? `${p.level || p.categoryPrimary || "Curso"} · ${caps} capítulos` : String(p.level || p.categoryPrimary || "Curso")} |
| **no ar em** | ${p.thumbnail || "—"} |

## 1. O prompt — o livro inteiro, numa geração só

Este é o formato aprovado pelo Ricardo em 03/08/2026, com a capa do
\`automacao-n8n\` na mão. Um prompt só descreve o livro acabado: couro, título
gravado em ouro e a arte gravada no mesmo relevo, integrada à capa em vez de
colada por cima. Vai para o **Higgsfield**.

\`\`\`
${promptLivro(p)}
\`\`\`

Três coisas que este prompt exige e é fácil perder ao editá-lo:

- **Começa em "A book", não em "a brand new book".** As duas variantes foram
  geradas lado a lado em 03/08: "a brand new book" deu livro em 3/4, deitado,
  com o título subindo torto na diagonal — ilegível no card de 180px do
  trilho. "A book" dá o livro de frente, título reto.
- **O título vai entre aspas, literal, com acento e cedilha.** É o
  \`shortName\` do banco. O Higgsfield acerta a grafia; o Qwen local não (§3).
- **O objeto vem depois de "it is" e antes do "The object is made of".** O
  estilo é material do objeto, não do livro — grudado no lugar errado, o
  modelo faz o *livro* de vidro violeta.

⚠️ **O Higgsfield assina.** Em 2 das 3 capas de 03/08 ele escreveu
"Ricardo Faya" em ouro no rodapé sem que o prompt pedisse. Ficou bom e foi
mantido, mas é sorte, não instrução: para garantir a assinatura, peça-a no
prompt; para não tê-la, proíba-a.

⚠️ **O preço deste formato**: com o título assado no pixel, mudar o
\`shortName\` no banco **não** muda mais a capa. Ela passa a anunciar o título
velho até alguém regerar. Foi a troca aceita em 03/08 — o relevo em ouro no
couro vale mais que o texto vetorial, mas quem mexer no título precisa saber
que a capa não vem junto.

## 2. O objeto no centro — e por que ele é esse

> ${motivo(p)}

O objeto é escolhido por **slug + ferramenta**, nunca pelo \`name\`: nome é
texto de marketing e carrega palavra genérica que sequestra a rota — "Domine a
**Arte** de Conversar" cairia no ramo de pintura e o curso de prompt ganharia
uma paleta de pintor.

A linguagem visual é uma só para o catálogo inteiro — cristal violeta e
turquesa sobre azul-marinho profundo, a mesma da \`/og-fayai.jpg\` e das artes
do \`/inventando\`. O que muda de curso para curso é só o objeto acima.

## 3. O prompt antigo — só o objeto, para o ComfyUI local

**É este que gerou a capa que está no ar agora**, enquanto o catálogo não for
refeito no formato do §1. Aqui o modelo desenha só a arte e o título entra
depois como SVG vetorial, porque o Qwen local escreve errado: a rodada que
motivou a troca saiu com "Make Automacio", "Zero ao Avancado" sem cedilha e
lixo tipográfico — "#N5F3" — na capa do Leonardo.

### Positivo

\`\`\`
${promptDe(p)}
\`\`\`

### Negativo

\`\`\`
${NEGATIVO}
\`\`\`

### Modelo e parâmetros

| | |
|---|---|
| modelo | \`${PARAMETROS.modelo}\` |
| CLIP | \`${PARAMETROS.clip}\` |
| VAE | \`${PARAMETROS.vae}\` |
| resolução | ${PARAMETROS.lado}×${PARAMETROS.lado} |
| steps | ${PARAMETROS.steps} |
| cfg | ${PARAMETROS.cfg} |
| sampler / scheduler | ${PARAMETROS.sampler} / ${PARAMETROS.scheduler} |
| seed | aleatória (não foi registrada nesta rodada) |

### O livro que o SVG desenha por cima

Nesta rota o livro é geometria, não imagem: couro, lombada, miolo, filete
dourado e o título em ouro. Ângulo, cor e luz variam por curso, mas saem de um
hash do slug — rodar de novo dá a mesma capa, senão cada execução mudaria o
catálogo inteiro sem ninguém pedir.

| | |
|---|---|
| couro | **${comp.couro.nome}** (\`${comp.couro.base}\`) |
| giro | ${comp.giroGraus}° |
| inclinação (skewY) | ${comp.inclinacaoGraus}° |
| azimute da luz | ${comp.azimuteLuz} |
| deslocamento | ${comp.deslocamentoPx}px |
| quadro final | 720×1040 (3:4 — a proporção do card do trilho) |

## 4. Arquivos nesta pasta

| arquivo | o que é |
|---|---|
| \`origem-comfyui-1024.png\` | ${pngCru ? `a arte crua, sem texto — \`${pngCru}\`${erroCasamento != null ? ` (casada por semelhança, erro ${erroCasamento.toFixed(1)}/255)` : ""}` : "**ausente** — o PNG cru desta capa não foi localizado em C:\\WORKS\\ComfyUI\\output"} |
| \`arte-quadrada-1024.webp\` | a arte + marca + título, 1024×1024 |
| \`capa-livro-720x1040.webp\` | **o que está no ar** — o livro montado em SVG |
${doRicardo.length ? doRicardo.join("\n") : "\n_Ainda não há saída do Higgsfield nesta pasta: a capa no ar é a do §3._"}

## 5. Como trocar esta capa

**Pelo prompt do §1** (o formato aprovado — o livro sai pronto do Higgsfield):

1. Gere com o prompt do §1. Guarde as alternativas nesta pasta e ponha o
   sufixo \`_good\` na escolhida, para o próximo saber qual foi.
2. Recorte para 720×1040 (retrato 3:4) e ponha em
   \`fayapoint-ai/scripts/_capas_livro/${p.slug}.webp\`.
3. \`node --env-file=.env.local scripts/gerar-capas-livro.mjs --slug ${p.slug} --so-subir --gravar\`
   sobe ao Cloudinary e aponta o banco sem redesenhar o livro por cima.
4. \`node --env-file=.env.local scripts/arquivar-capas.mjs --gravar\` para esta
   pasta voltar a refletir o que está no ar.

**Pela rota antiga do §3** (arte nova, livro em SVG por cima):

1. Ponha a imagem nova, 1024×1024 e **sem nenhum texto**, em
   \`fayapoint-ai/scripts/_capas_v2/${p.slug}.webp\`.
2. \`node --env-file=.env.local scripts/gerar-capas-livro.mjs --slug ${p.slug}\`
   (ensaio) e depois com \`--gravar\`.
3. O arquivador de novo, como acima.

**Regerar a arte no ComfyUI** com o prompt do §3: apague
\`scripts/_capas_v2/${p.slug}.webp\` e rode
\`scripts/gerar-capas-cursos.mjs --slug ${p.slug}\` (o ComfyUI precisa estar de
pé na porta 8000 — ele fecha sozinho, veja a janela das 11h).

**Trocar o título**: mude \`shortName\` (ou \`name\`) no banco. Na rota do §3 a
capa acompanha sozinha; na rota do §1 é preciso regerar a imagem.

---

<sub>Gerado por \`fayapoint-ai/scripts/arquivar-capas.mjs\`. Ao mexer nas capas,
rode o arquivador de novo — este arquivo é a memória do que foi feito.</sub>
`;
}

/* ── O laço ───────────────────────────────────────────────────────────────── */

async function main() {
  const gravar = process.argv.includes("--gravar");

  const cliente = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
  await cliente.connect();
  const produtos = await cliente
    .db("fayapointProdutos")
    .collection("products")
    .find(
      {},
      {
        projection: {
          slug: 1, name: 1, shortName: 1, tool: 1, level: 1,
          categoryPrimary: 1, courseContent: 1, thumbnail: 1,
        },
      }
    )
    .toArray();
  await cliente.close();

  produtos.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  console.log(`${produtos.length} cursos. ${gravar ? "VAI ESCREVER em " + DESTINO : "ENSAIO — não escreve nada."}\n`);

  // ── Casa os PNGs crus com os slugs ──
  console.log("Casando os PNGs crus do ComfyUI com os cursos…");
  const brutos = (await readdir(COMFY_OUT))
    .filter((f) => /^capa(_[a-z0-9-]+)?_\d+_\.png$/i.test(f));

  const assinaturasBrutas = [];
  for (const f of brutos) {
    try {
      assinaturasBrutas.push({ arquivo: f, sig: await assinatura(path.join(COMFY_OUT, f)) });
    } catch {
      /* PNG ilegível não impede o resto */
    }
  }

  const casamento = new Map();
  const usados = new Set();
  const candidatos = [];
  for (const p of produtos) {
    const arte = path.join(ARTES, `${p.slug}.webp`);
    if (!existsSync(arte)) continue;
    // O nome já traz o slug? Então não há o que adivinhar.
    const direto = brutos.find((f) => f.toLowerCase().includes(`capa_${p.slug}_`));
    if (direto) {
      casamento.set(p.slug, { arquivo: direto, erro: null });
      usados.add(direto);
      continue;
    }
    const sig = await assinatura(arte);
    for (const b of assinaturasBrutas) {
      candidatos.push({ slug: p.slug, arquivo: b.arquivo, e: erro(sig, b.sig) });
    }
  }

  // Guloso pelo melhor par global: um PNG serve a um curso só.
  candidatos.sort((a, b) => a.e - b.e);
  for (const c of candidatos) {
    if (casamento.has(c.slug) || usados.has(c.arquivo)) continue;
    // Acima de 18/255 de erro médio não é a mesma arte, é palpite.
    if (c.e > 18) continue;
    casamento.set(c.slug, { arquivo: c.arquivo, erro: c.e });
    usados.add(c.arquivo);
  }
  console.log(`  ${casamento.size}/${produtos.length} casados.\n`);

  // ── Escreve as pastas ──
  if (gravar) await mkdir(DESTINO, { recursive: true });
  const existentes = existsSync(DESTINO) ? await readdir(DESTINO) : [];
  const usadas = new Set();
  let n = 1;
  const indice = [];

  for (const p of produtos) {
    let pasta = acharPastaExistente(existentes.filter((e) => !usadas.has(e)), p);
    if (pasta) usadas.add(pasta);
    else {
      // Numeração: pula os números que as pastas do Ricardo já ocupam.
      while (existentes.some((e) => e.startsWith(String(n).padStart(2, "0")))) n++;
      pasta = `${String(n).padStart(2, "0")}- ${(p.shortName?.trim() || p.name || p.slug)
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60)
        .trim()}`;
      n++;
    }

    const destino = path.join(DESTINO, pasta);
    // O que o Ricardo já pôs aqui à mão — as saídas do Higgsfield. O
    // arquivador nunca apaga nada da pasta; só documenta o que encontra.
    const jaNaPasta = existsSync(destino) ? await readdir(destino) : [];
    const cru = casamento.get(p.slug);
    const arte = path.join(ARTES, `${p.slug}.webp`);
    const livro = path.join(LIVROS, `${p.slug}.webp`);

    const partes = [
      cru ? "png" : null,
      existsSync(arte) ? "arte" : null,
      existsSync(livro) ? "livro" : null,
    ].filter(Boolean);
    console.log(`${pasta.padEnd(46)} ${p.slug.padEnd(50)} [${partes.join(" ")}]`);
    indice.push({ pasta, slug: p.slug, titulo: p.shortName?.trim() || p.name, partes });

    if (!gravar) continue;

    await mkdir(destino, { recursive: true });
    if (cru) await copyFile(path.join(COMFY_OUT, cru.arquivo), path.join(destino, "origem-comfyui-1024.png"));
    if (existsSync(arte)) await copyFile(arte, path.join(destino, "arte-quadrada-1024.webp"));
    if (existsSync(livro)) await copyFile(livro, path.join(destino, "capa-livro-720x1040.webp"));
    await writeFile(
      path.join(destino, "PROMPT.md"),
      documento(p, {
        pngCru: cru?.arquivo ?? null,
        erroCasamento: cru?.erro ?? null,
        arquivos: jaNaPasta,
      }),
      "utf8"
    );
  }

  if (gravar) {
    await writeFile(path.join(DESTINO, "LEIA-ME.md"), leiaMe(indice), "utf8");
    console.log(`\n✓ ${indice.length} pastas em ${DESTINO}`);
  } else {
    console.log(`\nEnsaio. Rode de novo com --gravar para escrever em ${DESTINO}.`);
  }
}

function leiaMe(indice) {
  const linhas = indice
    .map((i) => `| \`${i.pasta}\` | ${i.titulo} | \`${i.slug}\` | ${i.partes.join(", ")} |`)
    .join("\n");

  return `# Capas dos cursos — FayAI

Uma pasta por curso, com a capa que está no ar e o prompt que a gerou. Mesmo
hábito de \`D:\\fayai\\Blog images\\\`: a imagem publicada mora ao lado do texto
que a pediu, para dar para trocar ou refazer sem arqueologia.

## Duas maneiras de fazer uma capa

### A aprovada (03/08/2026) — o livro inteiro, num prompt só

O Ricardo gerou a capa do \`automacao-n8n\` no **Higgsfield** com um prompt que
descreve o livro acabado: couro, título gravado em ouro e a arte gravada no
mesmo relevo, integrada à capa em vez de colada por cima. É o formato que vale
daqui para a frente, e está escrito por extenso no \`PROMPT.md\` de cada curso,
já com o título e o objeto daquele curso.

Três detalhes que decidem o resultado, e que estão explicados em cada pasta:
começar em **"A book"** (e não "a brand new book", que deita o livro em 3/4 e
torce o título); o título entre aspas, literal, com acento; e o objeto depois
de "it is", antes do "The object is made of".

O preço: com o título assado no pixel, mudar o \`shortName\` no banco não muda
mais a capa — é preciso regerar a imagem.

### A antiga — o modelo desenha o objeto, o SVG escreve

É ela que gerou as 27 capas que estão no ar hoje. Três etapas, sustentadas pela
regra de que **o Qwen local nunca escreve** (ele saía com "Make Automacio" e
"#N5F3"):

1. **A arte** — \`fayapoint-ai/scripts/gerar-capas-cursos.mjs\` manda um prompt
   ao ComfyUI (Qwen Image 2512, 1024×1024). O prompt descreve um OBJETO de
   cristal escolhido pelo assunto do curso, e o negativo proíbe texto, letras,
   marca-d'água e até a palavra "book". Sai \`origem-comfyui-1024.png\`.
2. **O texto** — o mesmo script compõe marca, título e etiqueta como SVG
   vetorial, lendo o título do banco. Sai \`arte-quadrada-1024.webp\`.
3. **O livro** — \`gerar-capas-livro.mjs\` desenha um livro de couro em SVG
   (perspectiva, lombada, miolo, filete dourado), encaixa a arte como
   ilustração da capa e grava o título em ouro. Sai
   \`capa-livro-720x1040.webp\`, que é o que sobe para o Cloudinary em
   \`fayai/courses/<slug>/capa-v2\` e o que o site mostra.

Couro, ângulo e luz variam por curso, mas derivam de um hash do slug: rodar de
novo dá exatamente a mesma capa.

## Como trocar uma capa

Cada pasta tem um \`PROMPT.md\` com o passo a passo do curso dela. Em resumo:

**Pelo formato aprovado** — gere no Higgsfield com o prompt do §1 daquela
pasta, guarde as alternativas na pasta com o sufixo \`_good\` na escolhida,
recorte para 720×1040 e ponha em \`fayapoint-ai/scripts/_capas_livro/<slug>.webp\`,
depois \`gerar-capas-livro.mjs --slug <slug> --so-subir --gravar\`.

**Pela rota antiga** — ponha a arte nova (1024×1024, **sem texto**) em
\`fayapoint-ai/scripts/_capas_v2/<slug>.webp\` e rode
\`gerar-capas-livro.mjs --slug <slug> --gravar\`.

Nos dois casos, termine com \`arquivar-capas.mjs --gravar\` para as pastas
refletirem o que está no ar.

## O catálogo

| pasta | curso | slug | o que tem |
|---|---|---|---|
${linhas}

---

<sub>Gerado por \`fayapoint-ai/scripts/arquivar-capas.mjs\` em ${new Date().toISOString().slice(0, 10)}.</sub>
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Conta trechos de português VISÍVEL no HTML servido.
 *
 * Por que no HTML e não no código: build limpo não prova tradução. O que o
 * usuário lê é o HTML, e é lá que aparece o texto que veio do banco, o que veio
 * de `messages`, e o que ficou cravado — os três de uma vez, sem eu ter de
 * adivinhar qual caminho cada frase tomou.
 *
 * Uso:
 *   node scripts/i18n/auditar.mjs                       # local, porta 3002
 *   node scripts/i18n/auditar.mjs https://fayai.com.br  # produção
 *   node scripts/i18n/auditar.mjs --detalhe             # mostra os trechos
 */

import { readFileSync } from "fs";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3002";
const DETALHE = process.argv.includes("--detalhe");

/** As páginas que valem a auditoria — as que um visitante realmente abre. */
const ROTAS = [
  "/", "/cursos", "/ferramentas", "/precos", "/servicos", "/blog", "/noticias",
  "/arcade", "/sobre", "/contato", "/faq", "/ajuda", "/comunidade",
  "/chatgpt-allowlisting", "/ferramentaria", "/inventando", "/radar",
  "/api-docs", "/projetos", "/aula-gratis", "/certificacoes", "/afiliados",
  "/servicos/edicao-de-video", "/servicos/construcao-de-sites",
  "/servicos/seo-local", "/servicos/automacao-e-integracao",
  "/servicos/consultoria-ai",
  "/login", "/registrar", "/portal",
];

/**
 * ── A segunda medida, e é a que não erra ──────────────────────────────────────
 *
 * A heurística abaixo (acento ou lista de palavras) foi útil e é CEGA para
 * português sem acento: "Galeria", "Recursos", "Jogar", "Boa noite",
 * "Ecossistema FayAI" passavam limpas por ela. O dashboard estava cheio delas
 * enquanto a auditoria dizia que a página estava boa.
 *
 * Esta medida não adivinha idioma nenhum. Ela pergunta uma coisa verificável:
 * **alguma CHAVE do dicionário aparece literalmente no HTML inglês?** Se
 * aparece, o dicionário sabe traduzir aquilo e a tela mostrou o original — é
 * um ponto de render sem `T()`, provado, com o texto na mão.
 *
 * Só entram chaves de 6+ caracteres e cuja tradução é DIFERENTE do original:
 * "Total" e "Design" são iguais nos dois idiomas e apareceriam como falso
 * positivo em toda página.
 */
const DICIONARIO = JSON.parse(
  readFileSync(new URL("../../messages/dicionario.en.json", import.meta.url), "utf8"),
);
const CHAVES_MEDIVEIS = Object.entries(DICIONARIO)
  .filter(([pt, en]) => pt.length >= 6 && pt !== en)
  .map(([pt]) => pt);

function chavesNaoTraduzidas(html) {
  const limpo = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  return CHAVES_MEDIVEIS.filter((k) => limpo.includes(`>${k}<`) || limpo.includes(`"${k}"`));
}

const ACENTO = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const PALAVRAS_PT =
  /\b(você|vocês|não|são|está|estão|para|com|como|mais|todos|todas|nenhum|aqui|agora|ainda|já|também|quando|onde|porque|cada|entre|sobre|desde|até|pelo|pela|nosso|nossa|seu|sua|seus|suas|criar|fazer|veja|abrir|salvar|enviar|carregando|aguarde|erro|voltar|próximo|anterior|aula|aulas|curso|cursos|aluno|conta|senha|entrar|sair|escolha|comprar|preço|grátis|nível|conquista|desafio|certificado|carrinho|loja|perfil|painel|resumo|progresso|pontos|créditos|assinatura|plano|planos|meus|minhas|dias|semana|mês)\b/i;

/**
 * ⚠️ Falso positivo conhecido: `ricardofaya@gmail.com` dentro do JSON-LD casa
 * com a heurística por causa do "faya". Página com 1 trecho é página limpa.
 */
function trechosEmPortugues(html) {
  // fora tudo que não é texto lido pelo usuário
  const limpo = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const achados = [];
  // texto entre tags, e o conteúdo dos atributos que a tela mostra
  for (const m of limpo.matchAll(/>([^<>]{3,})</g)) achados.push(m[1]);
  for (const m of limpo.matchAll(/\b(?:alt|title|placeholder|aria-label)="([^"]{3,})"/gi)) {
    achados.push(m[1]);
  }

  const pt = [];
  for (const bruto of achados) {
    const t = bruto.replace(/&[a-z]+;|&#\d+;/gi, " ").trim();
    if (t.length < 3) continue;
    if (ACENTO.test(t) || PALAVRAS_PT.test(t)) pt.push(t.slice(0, 90));
  }
  return [...new Set(pt)];
}

const linha = (s, n) => `${String(n).padStart(4)}  ${s}`;

let total = 0;
let totalProvados = 0;
const problemas = [];

for (const rota of ROTAS) {
  const url = `${BASE}/en${rota === "/" ? "" : rota}`;
  let html;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      // UA de navegador: rota que se comporta diferente para robô é comum, e
      // auditar o que o robô vê não é auditar o que o usuário vê.
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
    });
    html = await res.text();
    if (!res.ok) {
      console.log(linha(`${rota}  [HTTP ${res.status}]`, 0));
      continue;
    }
  } catch (e) {
    console.log(linha(`${rota}  [caiu: ${e.message}]`, 0));
    continue;
  }

  const pt = trechosEmPortugues(html);
  const provados = chavesNaoTraduzidas(html);
  total += pt.length;
  totalProvados += provados.length;
  console.log(linha(`${rota}${provados.length ? `   ⚠ ${provados.length} provado(s)` : ""}`, pt.length));
  if (pt.length > 2 || provados.length) problemas.push({ rota, pt, provados });
  if (DETALHE) {
    for (const t of pt) console.log(`        ${t}`);
    for (const k of provados) console.log(`     ⚠  ${k}  → deveria ser "${DICIONARIO[k]}"`);
  }
}

console.log(`\n${total} trecho(s) pela heurística em ${ROTAS.length} rota(s).`);
console.log(
  `${totalProvados} ponto(s) de render PROVADO(s) sem tradução ` +
    `(chave do dicionário aparecendo literal no HTML inglês).`,
);
if (problemas.length && !DETALHE) {
  console.log(`\n${problemas.length} rota(s) com achado — rode com --detalhe para ver.`);
}

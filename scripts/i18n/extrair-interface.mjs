/**
 * Colhe do CÓDIGO todo texto com cara de português que pode chegar à tela, e
 * escreve a lista que o `interface.mjs` manda traduzir.
 *
 * ── Colher largo, aplicar estreito ────────────────────────────────────────────
 *
 * A colheita é generosa de propósito: pega também o texto que mora em constante
 * de módulo (`const NIVEIS = { basic: "Básico" }`), que o codemod não envolve.
 * O motivo é que o dicionário é chaveado pelo próprio português — então basta o
 * VALOR estar traduzido para `{T(nivel)}` funcionar no render, sem ninguém ter
 * de tocar na constante.
 *
 * O risco de colher demais é pequeno e vale dizer por quê: uma entrada que
 * ninguém usa é só peso morto no JSON, porque tradução só acontece onde há
 * chamada de `T(...)`. Colher de menos, não: é uma frase em português na tela
 * inglesa.
 *
 * Uso:
 *   node scripts/i18n/extrair-interface.mjs                 # os alvos padrão
 *   node scripts/i18n/extrair-interface.mjs src/components/x
 */
import ts from "typescript";
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const RAIZ = process.cwd();
export const SAIDA = join(RAIZ, "messages/_interface.textos.json");

/**
 * As áreas cujo texto sai na tela e que não passam pelo `messages/*.json`.
 * O `/admin` fica de fora por decisão do Ricardo: painel interno segue em
 * português.
 */
export const ALVOS_PADRAO = ["src/components", "src/app/[locale]", "src/data"];

/**
 * ⚠️ A primeira versão listava DOZE pastas escolhidas a dedo, e foi por aí que
 * a auditoria pegou o furo: `src/data/landing/projects.ts` guardava os textos
 * inteiros da `/projetos` e não estava na lista, então a página saiu com 29
 * frases em português depois de eu ter dado o trabalho por feito. Lista escrita
 * à mão envelhece no primeiro arquivo novo. Varrer tudo e excluir o pouco que
 * não vale é a forma que não esquece.
 */
const FORA = [
  /[\\/]admin[\\/]/, //  painel interno segue em português (decisão do Ricardo)
  /[\\/]ui[\\/]/, //     primitivos do shadcn, sem texto próprio
  /\.test\.tsx?$/,
  /[\\/]api[\\/]/, //    rota de servidor: o locale não chega lá hoje
];

const ACENTO = /[áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ]/;
const PALAVRAS_PT =
  /\b(você|vocês|seu|sua|seus|suas|não|são|está|estão|para|com|como|mais|todos|todas|nenhum|nenhuma|aqui|agora|ainda|já|também|quando|onde|porque|cada|entre|sobre|desde|até|pelo|pela|nosso|nossa|criar|criado|fazer|feito|veja|abrir|salvar|salvo|enviar|enviado|carregando|aguarde|erro|falhou|sucesso|voltar|próximo|próxima|anterior|aula|aulas|curso|cursos|aluno|conta|senha|entrar|sair|escolher|escolha|comprar|preço|grátis|nível|conquista|conquistas|desafio|desafios|certificado|certificados|carrinho|loja|perfil|painel|resumo|progresso|pontos|créditos|assinatura|plano|planos|meus|minhas|dia|dias|hora|horas|semana|mês|ano|anos|novo|nova|ver|sem|numa|num|dos|das|uma|seus)\b/i;

/** O que NUNCA é texto de tela, por mais português que pareça. */
const RUIDO = [
  /^[/#@]/, // caminho, âncora, handle
  /^https?:/,
  /**
   * Slug e chave: minúsculas COM separador. ⚠️ Exigir o separador não é
   * capricho — a versão sem ele descartava "aulas", e a `/cursos` inglesa
   * ficou com "30 aulas" doze vezes na mesma página.
   */
  /^[a-z0-9]+([-_][a-z0-9]+)+$/,
  /^[A-Z0-9_]+$/, // constante
  /^[a-z]+([A-Z][a-z]+)+$/, // camelCase
  /\.(png|jpg|jpeg|webp|svg|mp4|webm|json|ts|tsx|css)$/i,
  /^(--|var\(|rgba?\(|#[0-9a-f]{3,8}$)/i, // CSS
  /**
   * Só NÚMERO, com unidade curta: "12x", "30%", "1.5 KB", "2025".
   *
   * ⚠️ A primeira versão jogava fora tudo que COMEÇAVA com dígito, e isso
   * comeu frase de verdade em quantidade: "18 cursos de IA com certificação
   * verificável", "200 milhões de pessoas perguntam ao ChatGPT todos os dias",
   * "30 dias de garantia". Título de vitrine começa com número o tempo todo —
   * é o formato preferido de manchete.
   */
  /^[\d.,]+\s*[%x°ºª]?\s*(kb|mb|gb|px|min|h|s|k|m)?$/i,
];

export function ehTextoDeTela(s) {
  const t = s.trim();
  if (t.length < 2 || t.length > 600) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(t)) return false;
  if (RUIDO.some((r) => r.test(t))) return false;
  return ACENTO.test(t) || PALAVRAS_PT.test(t);
}

/** A mesma normalização de `src/i18n/dicionario.ts`. As duas TÊM de bater. */
export const chaveDe = (texto) => texto.trim().replace(/\s+/g, " ");

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(tsx|ts)$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

export function colher(alvos) {
  const textos = new Set();

  const caminhos = alvos.flatMap((a) => {
    const p = join(RAIZ, a);
    if (!existsSync(p)) {
      console.warn(`  (pulando, não existe: ${a})`);
      return [];
    }
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  }).filter((c) => !FORA.some((r) => r.test(c)));

  for (const caminho of caminhos) {
    const fonte = readFileSync(caminho, "utf8");
    const sf = ts.createSourceFile(caminho, fonte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const visitar = (no) => {
      if (ts.isJsxText(no)) {
        if (ehTextoDeTela(no.text)) textos.add(chaveDe(no.text));
      } else if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) {
        const pai = no.parent;
        const ehImport = ts.isImportDeclaration(pai) || ts.isExportDeclaration(pai);
        /**
         * Chave de objeto: normalmente é identificador, mas nem sempre.
         *
         * ⚠️ A tabela de `/precos` usa a FRASE como chave —
         * `features["Desconto em cursos avulsos"]` — e o rótulo da linha é a
         * própria chave. Descartar toda chave deixou duas linhas em português
         * numa tabela inglesa. O corte é o espaço: identificador não tem, frase
         * tem.
         */
        const ehChaveIdentificadora =
          ts.isPropertyAssignment(pai) && pai.name === no && !/\s/.test(no.text.trim());
        if (!ehChaveIdentificadora && !ehImport && ehTextoDeTela(no.text)) {
          textos.add(chaveDe(no.text));
        }
      }
      ts.forEachChild(no, visitar);
    };
    visitar(sf);
  }

  return [...textos].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// Windows: `file://C:\...` não bate com o `file:///C:/...` do import.meta.url.
// `pathToFileURL` é a única comparação que funciona nos dois sistemas.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ALVOS_PADRAO;
  const textos = colher(alvos);
  writeFileSync(SAIDA, JSON.stringify(textos, null, 2), "utf8");
  const chars = textos.reduce((a, t) => a + t.length, 0);
  console.log(`${textos.length} texto(s) distintos, ${(chars / 1024).toFixed(1)} KB → ${SAIDA}`);
}

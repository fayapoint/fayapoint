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
export const ALVOS_PADRAO = ["src/components", "src/app/[locale]", "src/data", "src/lib"];

/**
 * ⚠️ A primeira versão listava DOZE pastas escolhidas a dedo, e foi por aí que
 * a auditoria pegou o furo: `src/data/landing/projects.ts` guardava os textos
 * inteiros da `/projetos` e não estava na lista, então a página saiu com 29
 * frases em português depois de eu ter dado o trabalho por feito. Lista escrita
 * à mão envelhece no primeiro arquivo novo. Varrer tudo e excluir o pouco que
 * não vale é a forma que não esquece.
 *
 * ⚠️ E envelheceu de novo: `src/lib` ficou de fora, e é lá que mora
 * `persona.ts`, com as PERGUNTAS que o dashboard faz ao aluno — "Cole algo que
 * VOCÊ escreveu…" saiu em português no `/en`. Regra que vale para sempre: a
 * pasta entra por padrão; o que não entra precisa de justificativa escrita
 * aqui.
 */
const FORA = [
  /[\\/]admin[\\/]/, //  painel interno segue em português (decisão do Ricardo)
  /[\\/]ui[\\/]/, //     primitivos do shadcn, sem texto próprio
  /\.test\.tsx?$/,
  /[\\/]api[\\/]/, //    rota de servidor: o locale não chega lá hoje
];

/**
 * ── Duas portas de entrada: o IDIOMA ou a POSIÇÃO ─────────────────────────────
 *
 * A primeira versão tinha uma porta só — "parece português?", respondida por
 * acento ou por uma lista de sessenta palavras. Parecia conservadora; era um
 * furo silencioso. **Palavra portuguesa sem acento e fora da lista é INVISÍVEL
 * para essa pergunta**, e o dashboard estava cheio delas: "Boa noite",
 * "Galeria", "Recursos", "Jogar", "Responder", "Ecossistema FayAI". O sintoma
 * mais claro do defeito: "Bom dia" era traduzido (por causa de "dia") e "Boa
 * noite" não — a mesma saudação, metade em cada idioma, na mesma tela.
 *
 * Tirar a peneira de idioma e colher tudo NÃO é a saída: medi, dá 13.687
 * textos, e o que entra a mais é log de servidor (`[SECURITY] Honeypot
 * triggered`), fonte de expressão regular e folha de estilo.
 *
 * A saída é a segunda porta: **quando a POSIÇÃO já prova que aquilo chega à
 * tela, o idioma não precisa ser adivinhado.** `<h3>Ecossistema FayAI</h3>` é
 * texto de tela porque está num `<h3>`, não porque tem cara de português. É a
 * mesma regra que o `envolver.mjs` usa para decidir o que envolver — e as duas
 * metades do oleoduto passam a concordar por construção, em vez de por
 * coincidência de listas.
 */
const ACENTO = /[áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ]/;
const PALAVRAS_PT =
  /\b(você|vocês|seu|sua|seus|suas|não|são|está|estão|para|com|como|mais|todos|todas|nenhum|nenhuma|aqui|agora|ainda|já|também|quando|onde|porque|cada|entre|sobre|desde|até|pelo|pela|nosso|nossa|criar|criado|fazer|feito|veja|abrir|salvar|salvo|enviar|enviado|carregando|aguarde|erro|falhou|sucesso|voltar|próximo|próxima|anterior|aula|aulas|curso|cursos|aluno|conta|senha|entrar|sair|escolher|escolha|comprar|preço|grátis|nível|conquista|conquistas|desafio|desafios|certificado|certificados|carrinho|loja|perfil|painel|resumo|progresso|pontos|créditos|assinatura|plano|planos|meus|minhas|dia|dias|hora|horas|semana|mês|ano|anos|novo|nova|ver|sem|numa|num|dos|das|uma|seus)\b/i;

/**
 * Lista de classe do Tailwind — `flex items-center gap-2`, `bg-green-500/10`.
 *
 * Passou a importar quando a posição virou porta de entrada: `className` não é
 * prop visível, mas classe também aparece solta em variável e em `cn(...)`, e
 * sem este corte o dicionário viraria uma folha de estilo.
 */
const TOKEN_CSS = /^-?[a-z0-9][a-z0-9:/[\],.%_-]*$/;
function ehListaDeClasses(texto) {
  const tokens = texto.trim().split(/\s+/);
  if (tokens.length < 2) return false; // token solto já é decidido pelo RUIDO
  if (!tokens.every((t) => TOKEN_CSS.test(t))) return false;
  // o que separa `flex items-center gap-2` de `para com como`: o hífen, os dois
  // pontos da variante, a barra da opacidade, o colchete do valor arbitrário.
  return tokens.some((t) => /[-:/[]/.test(t));
}

/**
 * As props cujo valor o usuário LÊ. Espelha `PROPS_VISIVEIS` do `envolver.mjs`
 * — se as duas divergirem, o extrator colhe o que o codemod não envolve (peso
 * morto) ou deixa de colher o que ele envolve (português na tela inglesa).
 */
export const PROPS_VISIVEIS = new Set([
  "title", "label", "placeholder", "aria-label", "alt", "description",
  "subtitle", "tooltip", "hint", "legend", "cta", "texto", "rotulo",
  "legenda", "mensagem", "emptyText", "loadingText",
]);

/**
 * Campos de dado que, renderizados, viram texto na tela — a porta pela qual o
 * texto das CONSTANTES de módulo entra sem depender de idioma.
 *
 * ⚠️ `pergunta` está aqui por um motivo concreto: as perguntas da Persona moram
 * em `src/lib/persona.ts` e apareciam em português no dashboard inglês.
 */
export const CAMPOS_RENDER = new Set([
  "title", "titulo", "label", "rotulo", "description", "descricao", "desc",
  "subtitle", "subtitulo", "texto", "text", "message", "mensagem", "name",
  "nome", "hint", "dica", "cta", "legenda", "caption", "resumo", "tagline",
  "frase", "aviso", "pergunta", "resposta", "placeholder", "headline",
  "subheadline", "beneficios", "bullets", "itens", "items", "opcoes",
]);

/** `STATUS_LABEL`, `NIVEL_ROTULO`, `TIPO_TEXTO` — tabela cujo VALOR é rótulo. */
const SUFIXO_ROTULO = /(LABELS?|ROTULOS?|TEXTOS?|TITULOS?|NOMES?)$/i;
function nomeDeTabelaDeRotulos(no) {
  let p = no.parent;
  while (p && !ts.isVariableDeclaration(p)) {
    if (!ts.isObjectLiteralExpression(p) && !ts.isAsExpression(p)) return false;
    p = p.parent;
  }
  return Boolean(p && ts.isIdentifier(p.name) && SUFIXO_ROTULO.test(p.name.text));
}

/**
 * A posição prova que o literal chega à tela?
 *
 * Três formas, e nenhuma delas pergunta o idioma:
 *  1. prop visível  — `placeholder="Buscar curso"`
 *  2. saída de JSX  — `{ok ? "Pronto" : "Falta"}`
 *  3. campo de dado — `{ pergunta: "Cole algo…" }`, inclusive dentro de array
 */
function emPosicaoDeTela(no, sf, ehTsx) {
  let atual = no;
  let pai = no.parent;
  let saltos = 0;
  while (pai && saltos++ < 6) {
    /**
     * `return "Boa noite"` dentro de um arquivo que desenha tela.
     *
     * ⚠️ Este é o caso que sobrou depois de todos os outros, e o sintoma dele
     * era gritante: `getGreeting()` devolve quatro saudações, "Bom dia" era
     * traduzido (a lista de palavras tem "dia") e "Boa noite" não. O render
     * já estava certo — `{T(greeting)}` —, faltava a entrada no dicionário.
     *
     * Fica limitado a `.tsx` de propósito: em `.ts` de servidor, `return`
     * de string é resposta de API, caminho de arquivo e chave, não tela.
     */
    if (ehTsx && ts.isReturnStatement(pai)) return true;
    /**
     * ⚠️ `T("...")` — o próprio tradutor. A prova mais forte que existe de que
     * aquilo é texto de tela: alguém já disse que é.
     *
     * Sem esta linha o oleoduto morde a própria cauda. `<h3>Ecossistema
     * FayAI</h3>` é colhido, traduzido e envolvido; na rodada seguinte o texto
     * virou argumento de chamada, o extrator não o reconhece mais e ele
     * DESAPARECE da lista. Enquanto a tradução já estiver gravada ninguém
     * nota — mas basta um `--refazer` para o dicionário voltar sem ele.
     */
    if (
      ts.isCallExpression(pai) &&
      ts.isIdentifier(pai.expression) &&
      pai.expression.text === "T"
    ) {
      return true;
    }
    /**
     * ⚠️ Operando de comparação e rótulo de `case` — nunca é tela. Mesma regra
     * do `envolver.mjs`, e pelo mesmo motivo: `selectedMethod === "pix"` está
     * em posição de saída de JSX pela árvore, mas traduzir "pix" quebraria o
     * checkout só em inglês. Aqui o estrago seria menor (uma entrada morta no
     * dicionário), mas as duas metades têm de concordar sobre o que é texto.
     */
    if (ts.isCaseClause(pai)) return false;
    if (ts.isBinaryExpression(pai)) {
      const op = pai.operatorToken.kind;
      if (
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken
      ) {
        return false;
      }
    }
    if (ts.isJsxAttribute(pai)) return PROPS_VISIVEIS.has(pai.name.getText(sf));
    if (ts.isJsxExpression(pai)) {
      const avo = pai.parent;
      if (avo && ts.isJsxAttribute(avo)) return PROPS_VISIVEIS.has(avo.name.getText(sf));
      return Boolean(avo && (ts.isJsxElement(avo) || ts.isJsxFragment(avo)));
    }
    if (ts.isPropertyAssignment(pai) && pai.name !== atual) {
      const chave = ts.isIdentifier(pai.name) || ts.isStringLiteral(pai.name)
        ? pai.name.text
        : null;
      if (chave && CAMPOS_RENDER.has(chave)) return true;
      /**
       * Tabela de rótulos: `const STATUS_LABEL = { live: "NO AR", … }`.
       *
       * Aqui a CHAVE é o dado (`live`, `building`) e o VALOR é a tela — o
       * inverso do caso de cima. Nenhum nome de chave vai adivinhar isso;
       * quem diz é o nome da TABELA, e o projeto já escreve essas tabelas com
       * o sufixo. Foi por este buraco que "NO AR" e "CONSTRUINDO" saíram em
       * português nos cartões do Ecossistema, com o render já envolvido em
       * `T(STATUS_LABEL[proj.status])` — traduzido no lugar certo, sem
       * tradução gravada.
       */
      return nomeDeTabelaDeRotulos(pai);
    }
    // array literal: continua subindo — `beneficios: ["a", "b"]`
    if (!ts.isArrayLiteralExpression(pai) && !ts.isConditionalExpression(pai)) {
      if (!ts.isParenthesizedExpression(pai)) return false;
    }
    atual = pai;
    pai = pai.parent;
  }
  return false;
}

/** O que NUNCA é texto de tela, por mais português que pareça. */
const RUIDO = [
  /^[/#@]/, // caminho, âncora, handle
  /^https?:/,
  /**
   * Slug, chave e classe de UM token só: minúsculas COM separador.
   *
   * ⚠️ Exigir o separador não é capricho — a versão sem ele descartava
   * "aulas", e a `/cursos` inglesa ficou com "30 aulas" doze vezes na mesma
   * página.
   *
   * ⚠️ A barra e os dois pontos entraram depois, e por um erro que chegou a
   * ser aplicado: `bg-indigo-500/10` passou por esta peneira (tem barra, não
   * casava com a versão só-hífen), foi para a lista e o codemod escreveu
   * `bg: T("bg-indigo-500/10")` — uma classe do Tailwind dentro do tradutor.
   * Classe de um token só não é pega pela regra de lista de classes, que
   * exige dois; é aqui que ela tem de morrer.
   */
  /^-?[a-z0-9]+([-_/:][a-z0-9.[\]%-]+)+$/,
  /**
   * Constante de código — `MAX_ITENS`, `API_KEY` — e sigla curta (`XP`, `API`,
   * `CPF`, `SEO`).
   *
   * ⚠️ A versão anterior era `^[A-Z0-9_]+$`, e isso jogava fora qualquer
   * palavra em caixa alta: "CONSTRUINDO", "PESQUISA", "NOVO" — os selos dos
   * cartões do Ecossistema, escritos em maiúscula por CSS de origem, não por
   * serem identificadores. O que separa constante de rótulo é o underscore
   * (ou o tamanho, no caso da sigla), não a caixa.
   */
  /^[A-Z0-9]+(_[A-Z0-9]+)+$/,
  /^[A-Z]{1,3}$/,
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

/** A forma: tem cara de rótulo ou frase? Vale para qualquer idioma. */
export function temFormaDeTexto(s) {
  const t = s.trim();
  if (t.length < 2 || t.length > 600) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(t)) return false;
  if (RUIDO.some((r) => r.test(t))) return false;
  if (ehListaDeClasses(t)) return false;
  return true;
}

/**
 * A porta 1 — o idioma. Mantida palavra por palavra como estava: ela não erra
 * para o lado de colher demais, e é ela que pega o texto em constante de módulo
 * cuja chave ninguém previu (`const NIVEIS = { basic: "Básico" }`).
 */
export function ehTextoDeTela(s) {
  return temFormaDeTexto(s) && (ACENTO.test(s) || PALAVRAS_PT.test(s));
}

/**
 * A decisão completa: entra por idioma OU por posição.
 *
 * `no` é opcional — sem nó, sobra a porta do idioma, que é o comportamento
 * antigo. É assim que `cobertura.mjs` e os testes continuam funcionando.
 */
export function ehTextoDeTelaNoLugar(s, no, sf, ehTsx = false) {
  if (!temFormaDeTexto(s)) return false;
  if (ACENTO.test(s) || PALAVRAS_PT.test(s)) return true;
  return Boolean(no && emPosicaoDeTela(no, sf, ehTsx));
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
    const ehTsx = caminho.endsWith(".tsx");

    const visitar = (no) => {
      if (ts.isJsxText(no)) {
        // texto solto em JSX: a posição já está provada, sobra a forma.
        if (temFormaDeTexto(no.text)) textos.add(chaveDe(no.text));
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
        if (!ehChaveIdentificadora && !ehImport && ehTextoDeTelaNoLugar(no.text, no, sf, ehTsx)) {
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

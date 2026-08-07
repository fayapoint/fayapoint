/**
 * Envolve o texto em português com `T(...)` — a parte mecânica da tradução da
 * interface.
 *
 * O que ele mexe, e SÓ o que ele mexe:
 *
 *   1. texto solto dentro de JSX          <h1>Meus cursos</h1>
 *   2. literal em prop que o usuário lê   placeholder="Buscar curso"
 *
 * Os dois são, por construção, lugares onde o texto chega na tela — logo,
 * dentro de um componente, logo o hook `useT()` é legal ali. Constante de
 * módulo NÃO é tocada: o dado fica em português e quem envolve é o render
 * (ver `src/i18n/dicionario.ts`).
 *
 *   3. campo de dado renderizado          {item.titulo}
 *   4. aviso ao usuário                   toast.error("Cupom inválido")
 *
 * Constante de módulo NÃO é tocada: o dado fica em português e quem envolve é o
 * render. O dicionário é chaveado pelo próprio português, então traduzir o VALOR
 * basta — ver `src/i18n/dicionario.ts`.
 *
 * O que ele se recusa a fazer, e reporta em `_tmp/recusas.json`:
 *
 *   - texto com entidade HTML (`&nbsp;`): reescrever quebraria o espaço fino.
 *   - Server Component `async` sem `await params` visível: lá o tradutor é
 *     `await obterT(locale)`, e sem achar o `locale` o codemod não inventa.
 *   - texto no TOPO do módulo, fora de qualquer componente.
 *
 * Uso:
 *   node scripts/i18n/envolver.mjs                     # tudo, menos o /admin
 *   node scripts/i18n/envolver.mjs src/components/x --aplicar
 * Sem `--aplicar` ele só conta e lista.
 */
import ts from "typescript";
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const RAIZ = process.cwd();
const APLICAR = process.argv.includes("--aplicar");
/**
 * `--tipos` liga o verificador de tipos do TypeScript.
 *
 * Sem ele, a regra 3 só reconhece `{item.titulo}` — acesso a propriedade com
 * nome conhecido. Isso deixa passar `<li>{beneficio}</li>` dentro de um
 * `.map()` sobre um array de strings, que é como as Toolboxes de `/servicos`
 * escrevem TODA a lista de entregáveis: 14 frases numa página só, e nenhuma
 * delas com nome de campo para reconhecer.
 *
 * Com o verificador ligado a pergunta deixa de ser "o campo se chama titulo?" e
 * passa a ser "isto é uma string sendo desenhada na tela?", que é a pergunta
 * certa. Custa uns 40s para montar o Program — por isso é opcional.
 */
const USAR_TIPOS = process.argv.includes("--tipos");

/** Tudo que desenha tela. O `/admin` fica fora por decisão do Ricardo. */
const ALVOS_PADRAO = ["src/components", "src/app/[locale]"];
const FORA = [
  /[\\/]admin[\\/]/, //  painel interno segue em português
  /[\\/]ui[\\/]/, //     shadcn: primitivos sem texto próprio
  /\.test\.tsx?$/,
];


/**
 * ── Aqui não se pergunta o idioma, e isso é deliberado ────────────────────────
 *
 * Este arquivo tinha a própria cópia do "parece português?" — acento ou lista
 * de sessenta palavras. Foi por essa peneira que `<h3>Ecossistema FayAI</h3>`
 * ficou sem `T()` numa tela que já estava traduzida em volta: a frase não tem
 * acento e nenhuma das palavras estava na lista.
 *
 * A peneira sai porque ela é redundante e mentirosa ao mesmo tempo. **Todas as
 * quatro regras abaixo já provaram a POSIÇÃO antes de chamar isto** — texto
 * solto em JSX, prop visível, saída de JSX, argumento de `toast`. Se o texto
 * chega à tela, ele passa pelo tradutor, ponto; se já estiver em inglês, `T` é
 * a identidade e não custa nada (o dicionário só guarda o que MUDA).
 *
 * Sobra a pergunta de forma, e ela mora num lugar só, junto do extrator — as
 * duas metades do oleoduto têm de concordar sobre o que é texto de tela.
 */
import {
  temFormaDeTexto as ehPortugues,
  PROPS_VISIVEIS,
  CAMPOS_RENDER,
} from "./extrair-interface.mjs";

function arquivos(dir) {
  const s = [];
  for (const n of readdirSync(dir)) {
    const c = join(dir, n);
    if (statSync(c).isDirectory()) s.push(...arquivos(c));
    else if (/\.tsx$/.test(n)) s.push(c);
  }
  return s;
}

const pedidos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const alvos = (pedidos.length ? pedidos : ALVOS_PADRAO)
  .flatMap((a) => {
    const p = join(RAIZ, a);
    if (!existsSync(p)) {
      console.warn(`  (pulando, não existe: ${a})`);
      return [];
    }
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  })
  .filter((c) => !FORA.some((r) => r.test(c)));

/** Chamadas cujo primeiro argumento é um aviso que o usuário lê. */
const AVISOS = /^(toast(\.\w+)?|alert|setErro|setError|setMensagem|setMessage|setAviso|setStatusMsg)$/;


/**
 * Onde o literal está, do ponto de vista do JSX: prop visível, prop visível
 * entre chaves, ou saída da tela (dentro de `{...}` filho de um elemento — o
 * caso do ternário `{ok ? "Pronto" : "Falta"}`).
 *
 * Sobe a árvore e para no PRIMEIRO limite que decide: atributo manda sobre
 * saída, senão `<Foo key="abc" />` dentro de um `.map()` viraria texto de tela.
 */
function posicaoNoJsx(no, sf) {
  let atual = no;
  let pai = no.parent;
  while (pai) {
    if (ts.isJsxAttribute(pai)) {
      return PROPS_VISIVEIS.has(pai.name.getText(sf)) ? "atributo-direto" : null;
    }
    if (ts.isJsxExpression(pai)) {
      const avo = pai.parent;
      if (avo && ts.isJsxAttribute(avo)) {
        return PROPS_VISIVEIS.has(avo.name.getText(sf)) ? "atributo-chaves" : null;
      }
      if (avo && (ts.isJsxElement(avo) || ts.isJsxFragment(avo))) return "saida";
      return null;
    }
    /**
     * ⚠️ Campo de OBJETO: quem decide é a CHAVE, e este é o teste que faltava.
     *
     * O padrão mais comum do portal é uma lista de objetos desenhada por um
     * `.map` dentro do JSX — `{[{ icon, label: "Loja", tab: "store" }].map(…)}`.
     * Subindo a árvore, TODOS os literais desse objeto chegam a um
     * `JsxExpression` filho de elemento e parecem "saída de tela". `label` é
     * rótulo; `tab` é IDENTIFICADOR, comparado por igualdade para saber qual
     * painel abrir.
     *
     * Sem esta parada o codemod escreveu `tab: T("store")` e `bg:
     * T("bg-indigo-500/10")` — em inglês o `T` devolveria outra string e a
     * navegação do dashboard pararia de casar. É a mesma lei que já custou
     * caro uma vez: **chave de filtro não é rótulo.** Traduzir o dado zera a
     * comparação, e o defeito não aparece em português, onde `T` é a
     * identidade.
     */
    /**
     * ⚠️ Argumento de CHAMADA não é texto de tela — é entrada de uma função,
     * e o que ela faz com aquilo é problema dela.
     *
     * O caso real: `label: t("stats.ofCompletion")`. A chave da propriedade é
     * `label`, o resultado vai para a tela, e mesmo assim o literal ali dentro
     * é a CHAVE do next-intl, não o texto. Envolver gerou
     * `t(T("stats.ofCompletion"))`, que em inglês procuraria uma chave que não
     * existe. Vale para `cn(...)`, `clsx(...)`, `new Date(...)` e todo o resto.
     *
     * O aviso ao usuário (`toast`, `alert`) é a exceção, e tem regra própria
     * mais abaixo — lá o argumento É a tela.
     */
    if (ts.isCallExpression(pai) || ts.isNewExpression(pai)) return null;

    /**
     * ⚠️⚠️ OPERANDO DE COMPARAÇÃO — o defeito mais perigoso que este codemod
     * já produziu, e ele não dá erro em português.
     *
     * `{selectedMethod === "pix" && …}` está, pela árvore, em posição de saída
     * de JSX: o literal fica dentro de `{...}` filho de elemento. Envolver dá
     * `selectedMethod === T("pix")`, e aí a comparação passa a depender do
     * IDIOMA. Em pt-BR `T` é a identidade e tudo funciona; em inglês, se
     * "pix" tiver tradução, a condição nunca é verdadeira. Foram 195
     * ocorrências, várias no checkout — método de pagamento, ciclo de
     * assinatura, tipo de item.
     *
     * O primeiro que apareceu foi `typeof x === T("number")`, que destruiu a
     * guarda de tipo e derrubou o `tsc` com treze erros de "possibly
     * undefined" em arquivos que eu não tinha tocado. Essa foi a sorte: as
     * outras 194 compilam sem uma reclamação.
     *
     * É a mesma lei de sempre, num disfarce novo: **chave de filtro não é
     * rótulo.** Comparação nunca é tela.
     */
    if (ts.isCaseClause(pai)) return null;
    if (ts.isBinaryExpression(pai)) {
      const op = pai.operatorToken.kind;
      if (
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken
      ) {
        return null;
      }
    }

    if (ts.isPropertyAssignment(pai) && pai.name !== atual) {
      const chave =
        ts.isIdentifier(pai.name) || ts.isStringLiteral(pai.name) ? pai.name.text : null;
      if (!chave || !CAMPOS_RENDER.has(chave)) return null;
    }

    // uma função nova entre o literal e o JSX: é callback (`.map`, `onClick`),
    // e o que ela devolve não é necessariamente tela.
    if (ts.isArrowFunction(pai) || ts.isFunctionExpression(pai)) {
      if (!ts.isJsxExpression(pai.parent || {})) return null;
    }
    if (ts.isJsxElement(pai) || ts.isJsxSelfClosingElement(pai) || ts.isSourceFile(pai)) return null;
    atual = pai;
    pai = pai.parent;
  }
  return null;
}

/**
 * O COMPONENTE que envolve o nó — atravessando os callbacks pelo caminho.
 *
 * `{itens.map((i) => <li>{i.titulo}</li>)}` tem uma seta entre o texto e o
 * componente, e a primeira versão disto parava nela e recusava o trabalho: 47
 * das recusas eram `.map`. Mas seta anônima dentro de um componente é parte do
 * render dele — chamar o hook no topo do componente e usar `T` lá dentro é o
 * padrão normal do React, inclusive dentro de `onClick`, que roda depois: `T` é
 * um fechamento sobre o dicionário, não uma chamada de hook.
 *
 * Quem NÃO atravessa é função com nome próprio em minúscula: ela pode ser
 * chamada de fora do render (de um `useEffect`, de outro módulo), e aí o hook
 * não vale. Essas continuam recusadas, para a mão.
 */
function envolvente(no, sf) {
  let p = no.parent;
  while (p) {
    if (ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isArrowFunction(p)) {
      let nome = null;
      if (ts.isFunctionDeclaration(p) && p.name) nome = p.name.getText(sf);
      else if (p.parent && ts.isVariableDeclaration(p.parent)) nome = p.parent.name.getText(sf);

      if (nome && /^[A-Z]/.test(nome)) {
        /**
         * Componente com corpo em bloco: é aqui que o hook entra.
         *
         * Sem bloco (`const Card = (p) => (<div/>)`) NÃO é motivo para desistir:
         * esses componentinhos são declarados DENTRO de outro componente — a
         * StorePanel tem cinco deles — e o `T` do componente de fora está no
         * escopo. Então segue subindo. Só quando não houver nenhum componente
         * com bloco acima é que a recusa é real.
         */
        if (p.body && ts.isBlock(p.body)) return { fn: p, nome, ehComponente: true };
      }
      /**
       * Qualquer outra coisa — seta anônima, `const salvar = async () => {…}`,
       * componentinho sem bloco — segue subindo.
       *
       * O que decide não é o nome da função onde o texto está: é se existe um
       * COMPONENTE acima dela. `const salvar` declarado dentro da ProfilePanel
       * fecha sobre o `T` dela e continua valendo quando o clique dispara, meia
       * hora depois — `T` é um valor capturado, não uma chamada de hook. Foram
       * 53 mensagens de `toast` que a versão anterior recusou por olhar o nome
       * errado. Função no TOPO do módulo não tem componente acima, e essa é a
       * que sobra recusada — com razão.
       */
    }
    p = p.parent;
  }
  return null;
}

/**
 * Em Server Component `async`, o `T` precisa do `locale` — e o `locale` só
 * existe depois do `await params`. Devolve o fim daquela linha, que é onde a
 * declaração pode entrar; `null` quando não há `await params` nenhum, e aí o
 * codemod prefere recusar a chutar de onde tirar o idioma.
 */
function ondeInserirNoServidor(fn, sf) {
  if (!fn.body || !ts.isBlock(fn.body)) return null;
  for (const st of fn.body.statements) {
    const txt = st.getText(sf);
    if (/\blocale\b/.test(txt) && /await\s+params/.test(txt)) return st.getEnd();
  }
  return null;
}

/**
 * O verificador de tipos, quando pedido. Um Program só, reaproveitado para
 * todos os arquivos — montar um por arquivo levaria horas.
 */
let programa = null;
let verificador = null;
if (USAR_TIPOS) {
  const cfgPath = ts.findConfigFile(RAIZ, ts.sys.fileExists, "tsconfig.json");
  const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
  const opcoes = ts.parseJsonConfigFileContent(cfg.config, ts.sys, RAIZ);
  process.stderr.write("montando o verificador de tipos… ");
  programa = ts.createProgram(alvos, { ...opcoes.options, noEmit: true });
  verificador = programa.getTypeChecker();
  process.stderr.write("pronto\n");
}

/** A expressão é uma string que vai para a tela? */
function ehStringNaTela(expr) {
  if (!verificador) return false;
  // só nome e acesso a campo: chamada de função e template não valem a pena, e
  // envolvê-las deixaria o diff ilegível sem ganho de tradução.
  if (
    !ts.isIdentifier(expr) &&
    !ts.isPropertyAccessExpression(expr) &&
    !ts.isElementAccessExpression(expr)
  ) {
    return false;
  }
  const t = verificador.getTypeAtLocation(expr);
  const partes = t.isUnion() ? t.types : [t];
  let temString = false;
  for (const p of partes) {
    const f = p.getFlags();
    if (f & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) temString = true;
    else if (!(f & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) return false;
  }
  return temString;
}

const recusas = [];
const fragmentos = [];
let totalTrocas = 0;
let arquivosMexidos = 0;
const textos = new Set();

for (const caminho of alvos) {
  const fonte = readFileSync(caminho, "utf8");
  const sf = programa
    ? programa.getSourceFile(caminho)
    : ts.createSourceFile(caminho, fonte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (!sf) continue;
  const rel = relative(RAIZ, caminho).replace(/\\/g, "/");
  const linha = (no) => sf.getLineAndCharacterOfPosition(no.getStart(sf)).line + 1;

  /**
   * Componente de SERVIDOR: o arquivo não declara `"use client"`.
   *
   * Isso muda qual tradutor entra. `useT()` é hook, e Server Component `async`
   * não pode chamar hook — quebra na pré-renderização com
   * "Expected a suspended thenable", uma mensagem que não fala em hook nem em
   * idioma. Foi assim que a `/inventando/[slug]` derrubou o build inteiro.
   * Ver `src/i18n/dicionario-servidor.ts`.
   */
  const ehServidor = !/^\s*["']use client["']/.test(fonte);

  const trocas = [];
  const funcoesQuePrecisam = new Set();
  const recusar = (no, motivo, texto) =>
    recusas.push({ arquivo: rel, linha: linha(no), motivo, texto: texto.trim().slice(0, 80) });

  const marcarFuncao = (no) => {
    const env = envolvente(no, sf);
    if (!env) return false;
    if (!env.ehComponente) {
      // função auxiliar dentro do arquivo: pode ser chamada de fora do render.
      recusar(no, "fora-de-componente", no.getText(sf));
      return false;
    }
    const assincrona = env.fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
    if (ehServidor && assincrona && !ondeInserirNoServidor(env.fn, sf)) {
      recusar(no, "servidor-async-sem-params", no.getText(sf));
      return false;
    }
    funcoesQuePrecisam.add(env.fn);
    return true;
  };

  const visitar = (no) => {
    // ── 1. texto solto em JSX ────────────────────────────────────────────────
    if (ts.isJsxText(no) && ehPortugues(no.text)) {
      const bruto = no.text;
      /**
       * Texto QUEBRADO por expressão — `Nível {n} · {pontos} pontos`.
       *
       * A primeira versão recusava: traduzir pedaço solto ignora que a ordem
       * das palavras muda entre os idiomas. Olhando os 107 casos reais, quase
       * todos são rótulo + valor (`Nível` `{n}`, `Você acertou` `{acertos}`),
       * e nesse formato português e inglês têm a MESMA ordem — "Level 5",
       * "You got 8". Traduzir o pedaço acerta.
       *
       * Fica sendo uma escolha consciente, não um descuido: onde a ordem virar,
       * o inglês sai torto. O preço de NÃO fazer é a frase inteira em português
       * na tela inglesa, que é pior. Os pedaços aparecem no dicionário como
       * entradas curtas e é lá que dá para pegar o que ficou estranho.
       */
      const fragmentado =
        no.parent &&
        no.parent.children &&
        no.parent.children.some((c) => ts.isJsxExpression(c) && c.expression);

      if (/&[a-z]+;|&#\d+;/i.test(bruto)) {
        recusar(no, "entidade-html", bruto);
      } else if (fragmentado && bruto.trim().length < 2) {
        recusar(no, "fragmento-curto-demais", bruto);
      } else if (marcarFuncao(no)) {
        if (fragmentado) fragmentos.push({ arquivo: rel, linha: linha(no), texto: bruto.trim() });
        const nucleo = bruto.trim();
        const antes = bruto.slice(0, bruto.length - bruto.trimStart().length);
        const depois = bruto.slice(bruto.trimEnd().length);
        trocas.push({
          inicio: no.getStart(sf),
          fim: no.getEnd(),
          texto: `${antes}{T(${JSON.stringify(nucleo)})}${depois}`,
        });
        textos.add(nucleo);
      }
      return;
    }

    // ── 2. literal em prop visível, ou em posição de saída do JSX ────────────
    if (ts.isStringLiteral(no) && ehPortugues(no.text)) {
      // já envolvido numa passada anterior — `T("x")` não vira `T(T("x"))`
      const jaEnvolvido =
        ts.isCallExpression(no.parent) &&
        ts.isIdentifier(no.parent.expression) &&
        no.parent.expression.text === "T";

      if (!jaEnvolvido) {
        const posicao = posicaoNoJsx(no, sf);
        if (posicao === "atributo-direto" && marcarFuncao(no)) {
          trocas.push({
            inicio: no.getStart(sf),
            fim: no.getEnd(),
            texto: `{T(${JSON.stringify(no.text)})}`,
          });
          textos.add(no.text.trim());
        } else if ((posicao === "atributo-chaves" || posicao === "saida") && marcarFuncao(no)) {
          trocas.push({
            inicio: no.getStart(sf),
            fim: no.getEnd(),
            texto: `T(${JSON.stringify(no.text)})`,
          });
          textos.add(no.text.trim());
        }
      }
    }

    // ── 3. campo de dado renderizado: {item.title} ───────────────────────────
    //
    // É aqui que o texto das CONSTANTES de módulo entra. A constante fica em
    // português e intocada; quem traduz é o render. Uma edição por lugar onde o
    // dado aparece, e não uma por dado.
    // O mesmo vale para prop visível cujo valor é expressão — `alt={p.name}`.
    // Sem isto, o `alt` das imagens da `/projetos` ficava em português numa
    // página em inglês, e `alt` é justamente o texto de quem não vê a imagem.
    if (
      ts.isJsxExpression(no) &&
      no.expression &&
      no.parent &&
      (ts.isJsxElement(no.parent) ||
        ts.isJsxFragment(no.parent) ||
        (ts.isJsxAttribute(no.parent) && PROPS_VISIVEIS.has(no.parent.name.getText(sf))))
    ) {
      const alvo = no.expression;
      const jaEnvolvido =
        ts.isCallExpression(alvo) && ts.isIdentifier(alvo.expression) && alvo.expression.text === "T";
      const porNome =
        ts.isPropertyAccessExpression(alvo) && CAMPOS_RENDER.has(alvo.name.getText(sf));

      if (!jaEnvolvido && (porNome || ehStringNaTela(alvo)) && marcarFuncao(no)) {
        trocas.push({
          inicio: alvo.getStart(sf),
          fim: alvo.getEnd(),
          texto: `T(${alvo.getText(sf)})`,
        });
      }
    }

    // ── 4. aviso ao usuário: toast, alerta, mensagem de erro ─────────────────
    //
    // Não é JSX, mas é tela — e é a tela que o usuário vê no pior momento. Fica
    // restrito a chamadas cujo nome não deixa dúvida.
    if (
      ts.isCallExpression(no) &&
      AVISOS.test(no.expression.getText(sf)) &&
      no.arguments.length &&
      ts.isStringLiteral(no.arguments[0]) &&
      ehPortugues(no.arguments[0].text) &&
      marcarFuncao(no)
    ) {
      const arg = no.arguments[0];
      trocas.push({
        inicio: arg.getStart(sf),
        fim: arg.getEnd(),
        texto: `T(${JSON.stringify(arg.text)})`,
      });
      textos.add(arg.text.trim());
    }

    ts.forEachChild(no, visitar);
  };
  visitar(sf);

  if (!trocas.length) continue;

  // ── o tradutor, uma vez por componente que precisa ────────────────────────
  let precisaDoServidor = false;
  for (const fn of funcoesQuePrecisam) {
    const jaTem = fn.body.statements.some((s) => /\bconst\s+T\s*=\s*(await\s+obterT|useT)\(/.test(s.getText(sf)));
    if (jaTem) continue;

    const assincrona = fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
    const posServidor = ehServidor && assincrona ? ondeInserirNoServidor(fn, sf) : null;

    if (posServidor !== null) {
      precisaDoServidor = true;
      trocas.push({ inicio: posServidor, fim: posServidor, texto: "\n  const T = await obterT(locale);" });
    } else {
      const abre = fn.body.getStart(sf) + 1;
      trocas.push({ inicio: abre, fim: abre, texto: "\n  const T = useT();" });
    }
  }

  let saida = fonte;
  trocas.sort((a, b) => b.inicio - a.inicio || b.fim - a.fim);
  for (const t of trocas) saida = saida.slice(0, t.inicio) + t.texto + saida.slice(t.fim);

  // ── o import ──────────────────────────────────────────────────────────────
  const precisaDoCliente = /\bconst T = useT\(\)/.test(saida);
  const linhasDeImport = [];
  if (precisaDoCliente && !/from "@\/i18n\/dicionario"/.test(fonte)) {
    linhasDeImport.push('import { useT } from "@/i18n/dicionario";');
  }
  if (precisaDoServidor && !/from "@\/i18n\/dicionario-servidor"/.test(fonte)) {
    linhasDeImport.push('import { obterT } from "@/i18n/dicionario-servidor";');
  }
  if (linhasDeImport.length) {
    // depois do "use client" quando ele existe — a diretiva tem de ser a
    // primeira coisa do arquivo, antes de qualquer import.
    const m = saida.match(/^(?:"use client";[ \t]*\r?\n)?/);
    const pos = m ? m[0].length : 0;
    saida = `${saida.slice(0, pos)}${linhasDeImport.join("\n")}\n${saida.slice(pos)}`;
  }

  totalTrocas += trocas.length;
  arquivosMexidos++;
  if (APLICAR) writeFileSync(caminho, saida, "utf8");
  else console.log(`${String(trocas.length).padStart(4)}  ${rel}`);
}

console.log(`\n${totalTrocas} troca(s) em ${arquivosMexidos} arquivo(s). ${textos.size} texto(s) distintos.`);
console.log(`${recusas.length} recusa(s):`);
const porMotivo = {};
for (const r of recusas) porMotivo[r.motivo] = (porMotivo[r.motivo] || 0) + 1;
console.log(porMotivo);

writeFileSync(join(RAIZ, "_tmp/fragmentos.json"), JSON.stringify(fragmentos, null, 2));
writeFileSync(join(RAIZ, "_tmp/recusas.json"), JSON.stringify(recusas, null, 2));
writeFileSync(join(RAIZ, "_tmp/textos-codemod.json"), JSON.stringify([...textos].sort(), null, 2));

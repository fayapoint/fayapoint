/**
 * Prévia pública do curso — o conteúdo real virando sinal de busca.
 *
 * A página de vendas indexa copy de marketing. O curso tem 260 mil caracteres
 * de texto útil que o Google nunca viu, porque só existem atrás do login. A
 * prévia expõe uma fatia honesta disso: a ementa inteira com o resumo de cada
 * capítulo, mais UM capítulo completo.
 *
 * ⚠️ Tudo aqui roda no SERVIDOR de propósito. Buscar conteúdo no cliente por
 * `/api/` já produziu 20 páginas de curso servindo 624 caracteres idênticos ao
 * rastreador (soft 404 por construção, 28/07) — `/api/` é `Disallow` no
 * robots.txt, então o Googlebot recebe a casca e nada mais.
 */

export interface CapituloPrevia {
  numero: number;
  titulo: string;
  /** Bullets da seção "Resumo do Capítulo" — a ementa real, não inventada. */
  resumo: string[];
  moduloIndice: number;
}

export interface ModuloPrevia {
  numero: number;
  titulo: string;
  descricao: string;
  capitulos: CapituloPrevia[];
}

export interface PreviaCurso {
  intro: string[];
  modulos: ModuloPrevia[];
  totalCapitulos: number;
  /** Capítulo de amostra, já em HTML, pronto para o servidor cuspir. */
  amostra: { numero: number; titulo: string; html: string } | null;
}

const RX_CAPITULO = /^# (Cap[íi]tulo\s+(\d+)\s*[:—-]\s*(.+))$/gm;
const RX_MODULO = /^## (M[óo]dulo\s+(\d+)\s*[:—-]\s*(.+))$/gm;

function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Negrito, itálico e código — o suficiente para o texto do curso. */
function inline(s: string) {
  return escapar(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

const RX_MEDIA =
  /<!--\s*media:(img|video)\s+([^>]*?)-->/g;

function atributo(bloco: string, nome: string) {
  const m = bloco.match(new RegExp(`${nome}="([^"]*)"`));
  return m ? m[1] : "";
}

/**
 * Markdown do capítulo -> HTML do servidor.
 *
 * Os marcadores de mídia viram <figure> de verdade: a legenda deles é escrita
 * para ENSINAR, não para descrever, então ela serve como `alt` e como texto
 * indexável. Jogar fora seria perder 6 parágrafos úteis por capítulo.
 */
export function capituloParaHtml(md: string, slug: string): string {
  const linhas = md.split("\n");
  const saida: string[] = [];
  let lista: "ol" | "ul" | null = null;

  const fecharLista = () => {
    if (lista) {
      saida.push(`</${lista}>`);
      lista = null;
    }
  };

  for (const linhaCrua of linhas) {
    const linha = linhaCrua.trimEnd();

    // Mídia: comentário HTML no markdown, <figure> na saída.
    if (linha.startsWith("<!--media:")) {
      fecharLista();
      RX_MEDIA.lastIndex = 0;
      const m = RX_MEDIA.exec(linha);
      if (m) {
        const tipo = m[1];
        const src = atributo(m[2], "src");
        const legenda = atributo(m[2], "caption");
        const poster = atributo(m[2], "poster");
        if (tipo === "video") {
          saida.push(
            `<figure class="curso-media"><video controls preload="none"${poster ? ` poster="${escapar(poster)}"` : ""} src="${escapar(src)}"></video>` +
              `<figcaption>${inline(legenda)}</figcaption></figure>`
          );
        } else {
          saida.push(
            `<figure class="curso-media"><img src="${escapar(src)}" alt="${escapar(legenda)}" loading="lazy" decoding="async" />` +
              `<figcaption>${inline(legenda)}</figcaption></figure>`
          );
        }
      }
      continue;
    }

    if (!linha.trim()) {
      fecharLista();
      continue;
    }

    // O H1 do capítulo não entra: a página já tem o próprio H1.
    if (/^# /.test(linha)) continue;

    if (/^## /.test(linha)) {
      fecharLista();
      saida.push(`<h3>${inline(linha.replace(/^##\s*/, ""))}</h3>`);
      continue;
    }

    if (/^>\s?/.test(linha)) {
      fecharLista();
      saida.push(`<blockquote><p>${inline(linha.replace(/^>\s?/, ""))}</p></blockquote>`);
      continue;
    }

    const numerada = linha.match(/^(\d+)\.\s+(.*)$/);
    if (numerada) {
      if (lista !== "ol") {
        fecharLista();
        saida.push("<ol>");
        lista = "ol";
      }
      saida.push(`<li>${inline(numerada[2])}</li>`);
      continue;
    }

    const bullet = linha.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (lista !== "ul") {
        fecharLista();
        saida.push("<ul>");
        lista = "ul";
      }
      saida.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    fecharLista();
    saida.push(`<p>${inline(linha)}</p>`);
  }

  fecharLista();
  return saida.join("\n");
}

/** Bullets da seção "Resumo do Capítulo" de um capítulo. */
function extrairResumo(corpo: string): string[] {
  const i = corpo.indexOf("## Resumo do Capítulo");
  if (i === -1) return [];
  return corpo
    .slice(i)
    .split("\n")
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

export function montarPrevia(courseContent: string, slug: string, capituloAmostra = 1): PreviaCurso {
  const conteudo = courseContent || "";

  // Capítulos
  const marcas: Array<{ numero: number; titulo: string; inicio: number }> = [];
  RX_CAPITULO.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RX_CAPITULO.exec(conteudo))) {
    marcas.push({ numero: Number(m[2]), titulo: m[3].trim(), inicio: m.index });
  }

  const preambulo = marcas.length ? conteudo.slice(0, marcas[0].inicio) : conteudo;

  /**
   * Os módulos aparecem em DOIS formatos no catálogo, e o parser precisa dos dois:
   *
   *   reescritos (ia-producao 02/08): os 6 "## Módulo" ficam todos no preâmbulo
   *   antigos (o resto do catálogo):  cada "## Módulo" fica ANTES do seu bloco
   *                                   de capítulos, espalhado pelo documento
   *
   * Varrer só o preâmbulo achava 1 módulo nos cursos antigos e jogava os 30
   * capítulos num balaio só. Por isso a varredura é no documento inteiro, e
   * cada capítulo é atribuído ao último módulo declarado antes dele.
   */
  const modulosCrus: Array<{ numero: number; titulo: string; descricao: string; inicio: number }> = [];
  RX_MODULO.lastIndex = 0;
  let mm: RegExpExecArray | null;
  while ((mm = RX_MODULO.exec(conteudo))) {
    const depois = conteudo.slice(mm.index + mm[0].length, mm.index + mm[0].length + 600);
    const descricao =
      depois
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith("#") && !l.startsWith("<!--")) || "";
    modulosCrus.push({ numero: Number(mm[2]), titulo: mm[3].trim(), descricao, inicio: mm.index });
  }

  // Parágrafos de abertura: o que vem antes do primeiro "## Módulo".
  const fimIntro = preambulo.search(/^## M[óo]dulo/m);
  const intro = preambulo
    .slice(0, fimIntro === -1 ? preambulo.length : fimIntro)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .slice(0, 4);

  const total = marcas.length;

  // Módulos declarados DEPOIS do primeiro capítulo significam formato antigo
  // (intercalado): aí a posição no texto é que diz a qual módulo o capítulo
  // pertence. Se todos vierem antes, é o formato novo e a divisão é por blocos.
  const intercalado = modulosCrus.some((m) => marcas.length > 0 && m.inicio > marcas[0].inicio);
  const porModulo = modulosCrus.length ? Math.ceil(total / modulosCrus.length) : total;

  const capitulos: CapituloPrevia[] = marcas.map((c, i) => {
    const corpo = conteudo.slice(c.inicio, i + 1 < marcas.length ? marcas[i + 1].inicio : conteudo.length);

    let moduloIndice = 0;
    if (modulosCrus.length) {
      if (intercalado) {
        const anterior = modulosCrus.filter((m) => m.inicio < c.inicio).length - 1;
        moduloIndice = Math.max(0, anterior);
      } else {
        moduloIndice = Math.min(modulosCrus.length - 1, Math.floor(i / porModulo));
      }
    }

    return { numero: c.numero, titulo: c.titulo, resumo: extrairResumo(corpo), moduloIndice };
  });

  const modulos: ModuloPrevia[] = modulosCrus.length
    ? modulosCrus.map((mo, i) => ({
        numero: mo.numero,
        titulo: mo.titulo,
        descricao: mo.descricao,
        capitulos: capitulos.filter((c) => c.moduloIndice === i),
      }))
    : [{ numero: 1, titulo: "Conteúdo", descricao: "", capitulos }];

  // Amostra
  const alvo = marcas.findIndex((c) => c.numero === capituloAmostra);
  let amostra: PreviaCurso["amostra"] = null;
  if (alvo !== -1) {
    const corpo = conteudo.slice(
      marcas[alvo].inicio,
      alvo + 1 < marcas.length ? marcas[alvo + 1].inicio : conteudo.length
    );
    amostra = {
      numero: marcas[alvo].numero,
      titulo: marcas[alvo].titulo,
      html: capituloParaHtml(corpo, slug),
    };
  }

  return { intro, modulos, totalCapitulos: total, amostra };
}

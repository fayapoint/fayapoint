import { AZUL, AZUL_CLARO, AZUL_FUNDO, BRANCO_DA_MARCA, NAVY } from "@/components/marca/cores";
import { CAIXA_DO_ACENTO, GLIFOS, MARCA } from "@/components/marca/glifos";

/**
 * O logo desenhado — o letreiro "FayAi" e o símbolo quadrado.
 *
 * ── Por que SVG inline, e não `<img src="/brand/fayai-logo.svg">` ──────────
 *
 * O logo está no cabeçalho de TODA página. Uma tag `<img>` custaria uma
 * requisição a mais em cada primeira visita e um piscar antes de a marca
 * aparecer — logo que chega depois do resto não é logo, é anúncio. Inline ele
 * nasce junto com o HTML.
 *
 * Além disso, inline é o que permite o carregamento: o `LoaderFayai` recorta o
 * "Ai" e enche por dentro. Isso não existe com `<img>`.
 *
 * ── Sem `use client` ────────────────────────────────────────────────────────
 *
 * Não há estado nem evento aqui, e a peça aparece em rodapé, e-mail interno e
 * páginas estáticas. Um componente de cliente a mais no cabeçalho custa
 * hidratação em toda rota. O 3D do hover mora em `LogoFayai`, que é cliente —
 * a marca chapada não precisa ser.
 *
 * ⚠️ O texto "FayAi" continua existindo para leitor de tela e buscador: o SVG
 * traz `role="img"` + `aria-label`, e `LogoFayai` mantém o texto real no DOM.
 * Trocar letra por desenho sem isso apagaria a marca do Google.
 */

/** O id do gradiente é fixo de propósito — ver `Gradiente`. */
const ID_GRADIENTE = "marca-fayai-azul";

/**
 * O gradiente azul do acento.
 *
 * O id é constante, então duas marcas na mesma página emitem dois `<defs>` com
 * o mesmo id. O navegador resolve `url(#id)` para o primeiro — e como as duas
 * definições são idênticas, o desenho é o mesmo. A alternativa (`useId`)
 * obrigaria a marca inteira a virar componente de cliente, o que é caro demais
 * para resolver um empate que não muda um pixel.
 */
function Gradiente({ id = ID_GRADIENTE }: { id?: string }) {
  const [x1, y1, x2, y2] = CAIXA_DO_ACENTO;
  return (
    <defs>
      <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={AZUL_CLARO} />
        <stop offset=".55" stopColor={AZUL} />
        <stop offset="1" stopColor={AZUL_FUNDO} />
      </linearGradient>
    </defs>
  );
}

export type VarianteDaMarca = "cor" | "branco" | "tinta";

function cores(variante: VarianteDaMarca) {
  if (variante === "branco") return { claro: "#ffffff", acento: "#ffffff" };
  if (variante === "tinta") return { claro: NAVY, acento: AZUL_FUNDO };
  return { claro: BRANCO_DA_MARCA, acento: `url(#${ID_GRADIENTE})` };
}

/**
 * O letreiro. Nasce com a altura da caixa de tinta — quem chama controla o
 * tamanho pelo CSS (`h-7`, `h-9`…) e a largura acompanha sozinha.
 */
export function LetreiroFayai({
  className = "",
  variante = "cor",
  titulo = "FayAi",
  decorativo = false,
  style,
}: {
  className?: string;
  variante?: VarianteDaMarca;
  titulo?: string;
  /** Aceito para quem precisa cravar o tamanho (`{ fontSize: 64 }`). */
  style?: React.CSSProperties;
  /** Quando o nome já está escrito ao lado (ex.: um `sr-only` no cabeçalho):
   *  sem isto o leitor de tela anuncia "FayAi FayAi". */
  decorativo?: boolean;
}) {
  const { claro, acento } = cores(variante);
  return (
    <svg
      viewBox={`0 0 ${MARCA.largura} ${MARCA.altura}`}
      className={className}
      {...(decorativo ? { "aria-hidden": true } : { role: "img", "aria-label": titulo })}
      // A caixa de tinta é justa; sem isto o SVG herda 300x150 antes do CSS.
      // A altura sai da FONTE: `text-2xl` no cabeçalho dá um logo de 24 px, e
      // o logo acompanha o texto ao redor sem ninguém converter nada.
      style={{ height: "1em", width: "auto", display: "block", ...style }}
    >
      {/* ⚠️ SEM <title> AQUI DE PROPÓSITO (26/08/2026).
          O logo aparece no cabeçalho de TODA página, e `<title>` de SVG divide
          espaço de nomes com o título da aba. Como o `<head>` servido sai sem
          título (o Next emite o dele no fim do fluxo), estes dois eram os
          primeiros `<title>` do documento em todo o site — "FayAi" pelado, sem
          a página. O `aria-label` acima já dá o nome acessível e, pela
          precedência da ARIA, venceria o `<title>` de qualquer forma. */}
      {variante === "cor" && <Gradiente />}
      {GLIFOS.map((g, i) => (
        <path key={i} d={g.d} fill={g.acento ? acento : claro} />
      ))}
    </svg>
  );
}

/**
 * O símbolo quadrado — as iniciais "FA", o "F" claro e o "A" azul.
 *
 * ⚠️ A primeira versão era o "Ai" do próprio letreiro, e foi descartada: "Ai"
 * claro sobre quadrado escuro, a 16 px, é o ícone do Adobe Illustrator. As
 * iniciais preservam a divisão de cor da marca (uma letra de cada metade) sem
 * a colisão.
 */
export function SimboloFayai({
  className = "",
  comFundo = true,
  titulo = "FayAi",
  style,
}: {
  className?: string;
  comFundo?: boolean;
  titulo?: string;
  style?: React.CSSProperties;
}) {
  const { lado, escala, dx, dy, glifos } = MARCA.simbolo;
  return (
    <svg
      viewBox={`0 0 ${lado} ${lado}`}
      className={className}
      role="img"
      aria-label={titulo}
      style={{ height: "1em", width: "1em", display: "block", ...style }}
    >
      {/* ⚠️ SEM <title> AQUI DE PROPÓSITO (26/08/2026).
          O logo aparece no cabeçalho de TODA página, e `<title>` de SVG divide
          espaço de nomes com o título da aba. Como o `<head>` servido sai sem
          título (o Next emite o dele no fim do fluxo), estes dois eram os
          primeiros `<title>` do documento em todo o site — "FayAi" pelado, sem
          a página. O `aria-label` acima já dá o nome acessível e, pela
          precedência da ARIA, venceria o `<title>` de qualquer forma. */}
      <Gradiente />
      {comFundo && <rect width={lado} height={lado} rx={lado * 0.22} fill={NAVY} />}
      <g transform={`translate(${dx},${dy}) scale(${escala})`}>
        {glifos.map((g, i) => (
          <g key={i} transform={`translate(${g.dx},0)`}>
            <path d={g.d} fill={g.acento ? `url(#${ID_GRADIENTE})` : BRANCO_DA_MARCA} />
          </g>
        ))}
      </g>
    </svg>
  );
}

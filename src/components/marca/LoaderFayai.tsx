"use client";

import { useId } from "react";

import { AZUL, AZUL_CLARO, AZUL_FUNDO, BRANCO_DA_MARCA, NAVY } from "@/components/marca/cores";
import { CAIXA_DO_ACENTO, GLIFOS, MARCA } from "@/components/marca/glifos";
import { useRegistrarCarga } from "@/components/marca/estado-de-carga";

/**
 * O logo que carrega: o azul esvazia para branco e sobe de volta.
 *
 * ── A ideia ────────────────────────────────────────────────────────────────
 *
 * Pedido do Ricardo, 20/08/2026: *"toda vez que precisar carregar, a parte
 * azul do ícone vira branca e vai enchendo conforme carrega"*.
 *
 * A leitura escolhida termina no LOGO DE VERDADE: cheio = marca inteira, azul
 * como ela é. Um carregamento que acaba num logo branco (a outra leitura
 * possível) terminaria numa marca que não existe — o fim da animação tem de
 * ser o estado normal da página, senão o último quadro parece defeito.
 *
 * ── Como funciona ──────────────────────────────────────────────────────────
 *
 * Um `clipPath` com a forma exata do "Ai" (os mesmos contornos da Inter Bold
 * que o letreiro usa) e, por dentro, três camadas:
 *
 *   1. o branco — o recipiente vazio, que é o "vira branca" do pedido;
 *   2. o azul — o líquido, um retângulo que sobe;
 *   3. o menisco — a linha clara na superfície. Sem ela o azul lê como
 *      retângulo entrando, não como nível subindo. É o detalhe que faz a peça
 *      parecer líquido em vez de barra de progresso disfarçada.
 *
 * ── Determinado e indeterminado ────────────────────────────────────────────
 *
 * Com `progresso` (0–1) o nível segue o número — é o modo honesto, para quando
 * existe percentual de verdade (upload, geração). Sem ele, o nível sobe,
 * respira no cheio e **desce** de volta: um corte seco para o zero pisca, e
 * descer faz o laço parecer respiração. Nenhum dos dois inventa progresso que
 * não existe.
 */

/** Onde o nível fica quando está vazio e quando está cheio, no espaço do SVG. */
function faixa(caixa: readonly number[], folga: number) {
  return { vazio: caixa[3] + folga, cheio: caixa[1] - folga * 0.4 };
}

function Enchimento({
  id,
  caixa,
  progresso,
  duracao,
  recorte,
  espessuraDoMenisco,
}: {
  id: string;
  caixa: readonly number[];
  progresso?: number;
  duracao: number;
  recorte: React.ReactNode;
  espessuraDoMenisco: number;
}) {
  const folga = (caixa[3] - caixa[1]) * 0.06;
  const { vazio, cheio } = faixa(caixa, folga);
  const curso = vazio - cheio;
  const determinado = typeof progresso === "number";
  const p = Math.min(1, Math.max(0, progresso ?? 0));

  // No modo determinado o grupo desce pelo que falta; no indeterminado quem
  // manda é a animação de `globals.css`, que lê `--fayai-curso`.
  const estilo: React.CSSProperties = determinado
    ? { transform: `translateY(${curso * (1 - p)}px)`, transition: "transform .45s cubic-bezier(.4,0,.2,1)" }
    : { ["--fayai-curso" as string]: `${curso}px`, animationDuration: `${duracao}s` };

  return (
    <>
      <defs>
        <linearGradient
          id={`${id}-tinta`}
          x1={caixa[0]}
          y1={cheio}
          x2={caixa[2]}
          y2={vazio}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={AZUL_CLARO} />
          <stop offset=".55" stopColor={AZUL} />
          <stop offset="1" stopColor={AZUL_FUNDO} />
        </linearGradient>
        <clipPath id={`${id}-corte`}>{recorte}</clipPath>
      </defs>

      <g clipPath={`url(#${id}-corte)`}>
        {/* O recipiente vazio. */}
        <rect x={-9999} y={-9999} width={19999} height={19999} fill={BRANCO_DA_MARCA} />
        {/* O líquido e o menisco sobem juntos — um grupo só, um movimento só. */}
        <g className={determinado ? undefined : "fayai-enchendo"} style={estilo}>
          <rect x={-9999} y={cheio} width={19999} height={curso * 4} fill={`url(#${id}-tinta)`} />
          <rect
            x={-9999}
            y={cheio}
            width={19999}
            height={espessuraDoMenisco}
            fill={AZUL_CLARO}
            opacity={0.9}
          />
        </g>
      </g>
    </>
  );
}

/**
 * O letreiro que enche. É a peça grande — tela de carregamento, troca de rota,
 * checkout. Herda o tamanho da fonte: `style={{fontSize}}` ou `text-5xl`.
 */
export function LoaderFayai({
  progresso,
  className = "",
  legenda,
  duracao = 2.2,
  registrar = true,
  style,
}: {
  /** 0–1 quando existe progresso real; omitido = laço indeterminado. */
  progresso?: number;
  className?: string;
  legenda?: string;
  duracao?: number;
  /** O tamanho sai da fonte: `{ fontSize: 56 }` ou uma classe de texto. */
  style?: React.CSSProperties;
  /** Desligue só em vitrine/documentação: é isto que anima o favicon. */
  registrar?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  useRegistrarCarga(registrar);

  const claros = GLIFOS.filter((g) => !g.acento);
  const acento = GLIFOS.filter((g) => g.acento);

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`} style={style}>
      <svg
        viewBox={`0 0 ${MARCA.largura} ${MARCA.altura}`}
        role="img"
        aria-label={legenda ?? "Carregando"}
        aria-busy="true"
        style={{ height: "1em", width: "auto", display: "block" }}
      >
        {/* ⚠️ SEM <title> AQUI DE PROPÓSITO (26/08/2026).
          `<title>` é elemento de SVG tanto quanto de HTML, e o navegador o
          coloca no MESMO espaço de nomes que o título da aba. Como o `<head>`
          servido não traz título (o Next só emite o dele no fim do fluxo,
          ~290 KB adiante), o primeiro `<title>` do documento era este — e
          toda página que desenhava o loader se anunciava como "Carregando"
          para rastreador, prévia de link e régua de SEO.
          O nome acessível não se perde: `role="img"` + `aria-label` já o dão,
          e pela precedência da ARIA o `aria-label` venceria o `<title>` de
          qualquer jeito. Não reintroduza. */}
        {claros.map((g, i) => (
          <path key={i} d={g.d} fill={BRANCO_DA_MARCA} />
        ))}
        <Enchimento
          id={id}
          caixa={CAIXA_DO_ACENTO}
          progresso={progresso}
          duracao={duracao}
          espessuraDoMenisco={MARCA.altura * 0.028}
          recorte={acento.map((g, i) => (
            <path key={i} d={g.d} />
          ))}
        />
      </svg>
      {legenda && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {legenda}
        </span>
      )}
    </div>
  );
}

/**
 * O símbolo que enche — o mesmo movimento no quadrado das iniciais.
 *
 * Existe porque o letreiro precisa de largura: dentro de um cartão estreito,
 * de um botão ou de um painel de 200 px ele encolhe até virar borrão. O
 * quadrado ocupa o lugar de um spinner sem deixar de ser a marca.
 */
export function SeloCarregando({
  progresso,
  className = "",
  legenda,
  comFundo = true,
  duracao = 2,
  registrar = true,
  style,
}: {
  progresso?: number;
  className?: string;
  legenda?: string;
  comFundo?: boolean;
  duracao?: number;
  registrar?: boolean;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  useRegistrarCarga(registrar);

  // `caixaDoAcento`, não `caixa`: o nível tem de ser medido pelo "A", que é o
  // que enche — a caixa do par começa no "F".
  const { lado, escala, dx, dy, caixaDoAcento, glifos } = MARCA.simbolo;
  const transformacao = `translate(${dx},${dy}) scale(${escala})`;

  return (
    <svg
      viewBox={`0 0 ${lado} ${lado}`}
      className={className}
      role="img"
      aria-label={legenda ?? "Carregando"}
      aria-busy="true"
      style={{ height: "1em", width: "1em", display: "block", ...style }}
    >
      {/* ⚠️ SEM <title> AQUI DE PROPÓSITO (26/08/2026).
          `<title>` é elemento de SVG tanto quanto de HTML, e o navegador o
          coloca no MESMO espaço de nomes que o título da aba. Como o `<head>`
          servido não traz título (o Next só emite o dele no fim do fluxo,
          ~290 KB adiante), o primeiro `<title>` do documento era este — e
          toda página que desenhava o loader se anunciava como "Carregando"
          para rastreador, prévia de link e régua de SEO.
          O nome acessível não se perde: `role="img"` + `aria-label` já o dão,
          e pela precedência da ARIA o `aria-label` venceria o `<title>` de
          qualquer jeito. Não reintroduza. */}
      {comFundo && <rect width={lado} height={lado} rx={lado * 0.22} fill={NAVY} />}
      <g transform={transformacao} fill={BRANCO_DA_MARCA}>
        {glifos
          .filter((g) => !g.acento)
          .map((g, i) => (
            <g key={i} transform={`translate(${g.dx},0)`}>
              <path d={g.d} />
            </g>
          ))}
      </g>
      <Enchimento
        id={id}
        caixa={caixaDoAcento}
        progresso={progresso}
        duracao={duracao}
        espessuraDoMenisco={lado * 0.022}
        // ⚠️ `<g>` dentro de `<clipPath>` é IGNORADO pela especificação — os
        // filhos têm de ser formas. Com um grupo ali a região de recorte sai
        // VAZIA e o "A" simplesmente não aparece, sem um aviso sequer no
        // console. Foi assim que este componente nasceu, e só o olho pegou. A
        // matriz inteira vai no `transform` do próprio `path`.
        recorte={glifos
          .filter((g) => g.acento)
          .map((g, i) => (
            <path key={i} d={g.d} transform={`${transformacao} translate(${g.dx},0)`} />
          ))}
      />
    </svg>
  );
}

/**
 * O carregamento DENTRO da página — o corpo troca, o cabeçalho fica.
 *
 * É o que `loading.tsx` mostra na troca de rota. Cobrir a tela inteira nesse
 * momento seria mentira visual: o cabeçalho e o rodapé não estão carregando,
 * eles já estão no lugar. Só o miolo espera.
 */
export function AreaDeCarga({ legenda }: { legenda?: string }) {
  return (
    <div className="grid min-h-[62vh] place-items-center px-6 py-24" role="status">
      <LoaderFayai legenda={legenda} className="text-[clamp(26px,6vw,56px)] opacity-90" />
    </div>
  );
}

/**
 * A página inteira esperando — o que substituiu os giradores de página cheia.
 *
 * Diferente da `TelaDeCarga`, não é `fixed`: é o corpo da página enquanto ela
 * não existe (o portal antes do dashboard chegar, o checkout antes da sessão).
 * Como ocupa a tela toda por conta própria, não precisa cobrir nada.
 */
export function PaginaCarregando({ legenda }: { legenda?: string }) {
  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-6"
      role="status"
    >
      <LoaderFayai legenda={legenda} className="text-[clamp(30px,7vw,60px)]" />
    </div>
  );
}

/**
 * A tela de carregamento inteira — é o que `loading.tsx` mostra na troca de
 * rota e o que substitui os spinners de página cheia.
 *
 * `fixed`, não `min-h-screen`: dentro de uma página que já rolou, um bloco de
 * altura de tela empurra o conteúdo e o loader nasce fora da vista.
 */
export function TelaDeCarga({
  legenda,
  progresso,
  transparente = false,
}: {
  legenda?: string;
  progresso?: number;
  transparente?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[9998] grid place-items-center ${
        transparente ? "bg-background/60" : "bg-background"
      } backdrop-blur-sm`}
      role="status"
    >
      <LoaderFayai
        progresso={progresso}
        legenda={legenda}
        className="text-[clamp(28px,7vw,64px)]"
      />
    </div>
  );
}

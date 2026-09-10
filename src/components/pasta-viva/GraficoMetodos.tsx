"use client";

import { useState } from "react";

/**
 * O gráfico do acervo: horas até a primeira entrega possível, por método.
 *
 * ## Por que ESTE eixo, e não "ROI"
 *
 * Porque retorno é o número que ainda não temos, e desenhar um eixo de ROI hoje
 * significaria preenchê-lo com estimativa — que é exatamente o que a marca
 * proíbe e o que faz o comprador pedir reembolso três semanas depois.
 *
 * "Horas até a primeira entrega possível" é um fato estrutural do método, lido
 * do fluxo de execução do capítulo que o sustenta. É verificável, é o que o
 * leitor precisa para escolher por onde começar hoje à noite, e não promete
 * nada sobre o resultado dele.
 *
 * O retorno tem coluna própria na tabela, com o estado vazio dito em palavras.
 * Quando as medições existirem, esta página ganha um segundo gráfico — não uma
 * segunda escala neste (dois eixos y no mesmo gráfico é o erro clássico).
 *
 * ## As decisões de desenho
 *
 * - **Barra horizontal**, porque a comparação é magnitude e os nomes dos
 *   métodos são longos: na vertical eles viram texto de lado.
 * - **Uma hue só, mais escura = mais horas** (sequencial). Cor categórica aqui
 *   seria pior: as categorias não são o assunto, o tempo é.
 * - **Rótulo direto no fim de cada barra**, não legenda: uma série só.
 * - **Ponta arredondada em 4px** e barra fina, ancorada na linha de base.
 * - Hover mostra a ficha curta. O alvo do hover é a linha inteira, não a barra
 *   — barra de 8 horas tem 12px e ninguém acerta 12px com o dedo.
 */

export interface MetodoNoGrafico {
  slug: string;
  titulo: string;
  categoria: string;
  tempoConclusaoHoras: number;
  investimentoReais: number;
  dificuldade: "baixa" | "media" | "alta";
  temMedicao: boolean;
}

const DIFICULDADE_ROTULO: Record<MetodoNoGrafico["dificuldade"], string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

/** Escala sequencial de uma hue só: mais horas, mais escuro. */
function tomDaBarra(horas: number, maximo: number): string {
  const t = maximo > 0 ? horas / maximo : 0;
  // Faixa de luminosidade estreita de propósito: o degrau mais claro ainda
  // precisa passar no contraste contra a superfície do cartão.
  const luz = 68 - t * 30;
  return `hsl(214 82% ${luz}%)`;
}

export function GraficoMetodos({ metodos }: { metodos: MetodoNoGrafico[] }) {
  const [ativo, setAtivo] = useState<string | null>(null);

  if (metodos.length === 0) return null;

  const ordenados = [...metodos].sort(
    (a, b) => a.tempoConclusaoHoras - b.tempoConclusaoHoras,
  );
  const maximo = Math.max(...ordenados.map((m) => m.tempoConclusaoHoras));

  return (
    <figure className="not-prose my-8">
      <figcaption className="mb-1 text-sm font-semibold text-foreground">
        Horas até a primeira entrega possível
      </figcaption>
      <p className="mb-5 text-xs text-muted-foreground">
        Lido do fluxo de execução de cada método. É o tempo de trabalho até você
        ter algo entregável na mão — não uma previsão sobre quando alguém paga.
      </p>

      <div className="space-y-1.5">
        {ordenados.map((m) => {
          const largura = maximo > 0 ? (m.tempoConclusaoHoras / maximo) * 100 : 0;
          const destacado = ativo === m.slug;
          return (
            <div
              key={m.slug}
              onMouseEnter={() => setAtivo(m.slug)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(m.slug)}
              onBlur={() => setAtivo(null)}
              tabIndex={0}
              className="group relative grid grid-cols-[minmax(0,13rem)_1fr] items-center gap-3 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40 sm:grid-cols-[minmax(0,22rem)_1fr]"
            >
              <span className="truncate text-xs text-foreground" title={m.titulo}>
                {m.titulo}
              </span>

              <div className="flex items-center gap-2">
                <div className="h-3 flex-1">
                  <div
                    className="h-3 rounded-r-[4px] transition-[width]"
                    style={{
                      width: `${Math.max(largura, 2)}%`,
                      background: tomDaBarra(m.tempoConclusaoHoras, maximo),
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {m.tempoConclusaoHoras}h
                </span>
              </div>

              {destacado && (
                <div className="absolute left-2 top-full z-20 mt-1 w-72 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
                  <p className="font-semibold text-popover-foreground">{m.titulo}</p>
                  <dl className="mt-2 space-y-1 text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <dt>Categoria</dt>
                      <dd className="text-popover-foreground">{m.categoria}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Investimento para começar</dt>
                      <dd className="text-popover-foreground tabular-nums">
                        {m.investimentoReais === 0
                          ? "R$ 0"
                          : `R$ ${m.investimentoReais.toLocaleString("pt-BR")}`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Dificuldade</dt>
                      <dd className="text-popover-foreground">
                        {DIFICULDADE_ROTULO[m.dificuldade]}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Retorno</dt>
                      <dd className="text-popover-foreground">
                        {m.temMedicao ? "medido por nós" : "ainda não medimos"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}

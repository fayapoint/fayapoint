import { useT } from "@/i18n/dicionario";
/**
 * A assinatura da casa na página de venda.
 *
 * ── O que substituiu, e por quê ────────────────────────────────────────────
 *
 * Ricardo, 05/08/2026: *"me incomodou o 'criado por Ricardo Faya' com tanto
 * destaque em todos os cards, acredito que ficaria mais profissional … um
 * design que se encaixasse e agregasse, e dizer que foi feito por
 * FayAi.com.br"*.
 *
 * O bloco anterior era um retângulo de degradê âmbar com um avatar de 64px
 * escrito "RF" e três linhas de cargo. Ele tinha o mesmo peso visual do preço,
 * numa página onde o preço é a decisão — e repetia o mesmo nome em 22 páginas,
 * o que faz o catálogo parecer o trabalho de uma pessoa em vez de o produto de
 * uma casa.
 *
 * ── As três decisões de desenho ────────────────────────────────────────────
 *
 * **1. Selo, não cartão.** A altura caiu de ~96px para ~62px e o fundo deixou
 * de ser um bloco de cor: é vidro sobre o que estiver atrás, com um único
 * calor âmbar preso à borda esquerda. Assinatura de editora fica no pé da
 * página, discreta — ela credencia, não vende.
 *
 * **2. O monograma é a marca, não uma pessoa.** O losango é a mesma forma que
 * o logo 3D do cabeçalho usa, aqui parado e em fio de ouro. Um avatar redondo
 * com iniciais lê como "perfil de usuário"; um losango gravado lê como selo.
 *
 * **3. O endereço é o texto, não um enfeite.** `fayai.com.br` aparece em
 * versalete espaçado à direita — é a informação que o Ricardo pediu para estar
 * ali, e ela precisa sobreviver ao olhar de dois segundos que uma assinatura
 * recebe.
 *
 * ⚠️ Sem `use client`: não há estado nem evento aqui. Esta peça nasce em toda
 * página de curso, acima da dobra, e um componente de cliente a mais nesse
 * ponto custa hidratação por nada.
 */

export function AssinaturaFayai({
  locale,
  className = "",
}: {
  locale: string;
  className?: string;
}) {
  const T = useT();
  const isPtBr = locale === "pt-BR";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 backdrop-blur-md ${className}`}
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.10), 0 12px 32px -22px rgba(0,0,0,.9)",
      }}
    >
      {/* O calor fica preso à esquerda, atrás do monograma. Espalhado pelo
          bloco inteiro ele viraria outro retângulo âmbar — que é justamente o
          que saiu daqui. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2/5"
        style={{
          background:
            "linear-gradient(to right, rgba(245,192,78,.13), rgba(245,192,78,.04) 45%, transparent 100%)",
        }}
      />
      {/* O fio de luz no topo — é ele que faz o selo pousar em vez de manchar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(245,192,78,.55), rgba(255,255,255,.18) 55%, transparent)",
        }}
      />

      <div className="relative flex items-center gap-3.5">
        {/* O monograma: losango de fio de ouro, a mesma forma do logo do topo. */}
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/[0.07]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M12 2.5 21.5 12 12 21.5 2.5 12Z"
              stroke="rgba(245,192,78,.85)"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.6 16.4 12 12 16.4 7.6 12Z"
              fill="rgba(245,192,78,.9)"
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/70">
            {isPtBr ? T("Produção") : "Produced by"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-[15px] font-bold leading-none text-white">
              FayAi
            </span>
            <span className="text-[11px] leading-none text-white/35">
              
              {T("fayai.com.br")}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-snug text-white/45">
            {isPtBr
              ? "Escrito, revisado e ilustrado na casa — e reescrito sempre que a ferramenta muda."
              : "Written, reviewed and illustrated in-house — and rewritten whenever the tool changes."}
          </p>
        </div>
      </div>
    </div>
  );
}

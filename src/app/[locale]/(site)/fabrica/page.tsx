import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Check, X, ArrowRight } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { Entrada } from "@/components/fabrica/Entrada";
import { MarcaFabrica } from "@/components/fabrica/MarcaFabrica";
import {
  FAIXAS,
  INVENTARIO,
  NAO_PROMETE,
  CUSTO_DE_OPERACAO,
  GRADE_DO_DIA,
  MEDIDO_EM,
  brl,
} from "@/lib/fabrica";

/**
 * A PÁGINA DA FÁBRICA AUTÔNOMA.
 *
 * ## As três decisões de conteúdo, e por que elas valem mais que o desenho
 *
 * 1. **Todo número sai de `lib/fabrica.ts`.** Preço, contagem de blueprints, de
 *    armadilhas, de linhas. Nenhum digitado aqui. Esta casa já manteve no ar
 *    "5.000 profissionais" sem motor nenhum atrás; número em página de venda
 *    que não vem da fonte é o primeiro passo para lá.
 *
 * 2. **A seção "o que isto não promete" fica ANTES do preço, não no rodapé.**
 *    Ela é o argumento, não a ressalva: quem vende operação e não resultado
 *    tem de dizer isso onde o leitor ainda está decidindo. Pelo Código de
 *    Defesa do Consumidor a oferta vincula — e a promessa que precisa de letra
 *    miúda para se sustentar é a promessa errada.
 *
 * 3. **O material é o MESMO nas três faixas.** O que muda é quanto do caminho
 *    a pessoa faz sozinha. Segurar conteúdo para justificar preço é a prática
 *    que faz ninguém acreditar em escada de preço nenhuma — e está escrito na
 *    página que não fazemos isso.
 */

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = generatePageMetadata({
    locale,
    path: "/fabrica",
    title: "Fábrica Autônoma — uma pasta, um comando, e a operação inteira",
    description:
      `A operação que publica, narra, mede e relata todo dia — ${INVENTARIO.blueprints} blueprints, ` +
      `${INVENTARIO.armadilhas} armadilhas já pagas e ${INVENTARIO.portoes} portões medidos. ` +
      "Vendemos a operação, nunca o resultado.",
  });

  /**
   * ⛔ `/en/fabrica` NÃO É INDEXÁVEL enquanto o texto for português.
   *
   * A rota existe nos dois idiomas porque o `[locale]` é da árvore inteira, mas
   * esta página é escrita em português — é uma oferta para quem compra no
   * Brasil. Deixá-la indexável em `/en` repetiria exatamente o defeito que esta
   * casa já pagou em 27/07/2026: a árvore inglesa declarando `hreflang="en"` e
   * servindo português, o que o buscador lê como conteúdo duplicado e engana
   * quem clica. O `hreflang` só volta quando a tradução voltar.
   */
  if (locale !== "pt-BR") {
    return { ...meta, robots: { index: false, follow: true }, alternates: undefined };
  }
  return meta;
}

export default async function PaginaFabrica() {
  return (
    <Entrada>
      {/* ── O que é ─────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 pt-10 pb-6">
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-7">
            <div className="shrink-0 mx-auto sm:mx-0">
              <MarcaFabrica />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em]" style={{ color: "rgba(245,192,78,.8)" }}>
                Uma pasta · um comando
              </p>
              <h1 className="mt-3 text-4xl sm:text-6xl leading-[0.94] tracking-wide text-white" style={bebas}>
                A fábrica que
                <br />
                <span style={{ color: "#f5c04e" }}>trabalha sem você</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,.72)" }}>
                Você baixa uma pasta e roda um comando. O agente entrevista você, e
                a partir daí a operação publica, narra, mede e relata todo dia — na
                sua voz, com a sua marca, na sua máquina.
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
                Não é um curso sobre automação. É a operação que escreveu este
                texto, empacotada com os {INVENTARIO.armadilhas} erros que ela já
                pagou para funcionar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── O dia ───────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-6">
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl tracking-wide text-white mb-4" style={bebas}>
            Um dia da máquina
          </h2>
          <ul className="grid gap-2">
            {GRADE_DO_DIA.map((d) => (
              <li
                key={d.hora}
                className="glass rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4"
              >
                <span
                  className="shrink-0 tabular-nums text-[12px] rounded-md px-2 py-1 self-start"
                  style={{
                    color: "#f5c04e",
                    background: "rgba(245,192,78,.10)",
                    border: "1px solid rgba(245,192,78,.22)",
                  }}
                >
                  {d.hora}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.76)" }}>
                  {d.longa}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── O que isto NÃO promete — antes do preço, de propósito ────────── */}
      <section className="relative px-4 sm:px-8 py-6">
        <div className="relative max-w-5xl mx-auto">
          <div
            className="rounded-3xl border p-5 sm:p-7"
            style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.02)" }}
          >
            <h2 className="text-2xl sm:text-3xl tracking-wide text-white" style={bebas}>
              O que isto não promete
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.55)" }}>
              Está aqui em cima, e não no rodapé, porque é parte da oferta.
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {NAO_PROMETE.map((n) => (
                <li key={n} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.74)" }}>
                  <X size={16} className="shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,.35)" }} />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.6)" }}>
              O que prometemos é a operação: ela roda, ela mede, e quando um defeito
              passa, o portão que faltava é escrito antes de seguir. Se isso não é o
              que você procura, as outras páginas deste site provavelmente servem
              melhor — e isso também é uma resposta.
            </p>
          </div>
        </div>
      </section>

      {/* ── As três faixas ──────────────────────────────────────────────── */}
      <section id="faixas" className="relative px-4 sm:px-8 py-6">
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl tracking-wide text-white" style={bebas}>
            Três formas de entrar
          </h2>
          <p className="mt-2 mb-5 text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,.6)" }}>
            O material é o mesmo nas três. O que muda é quanto do caminho você faz
            sozinho. Não seguramos conteúdo para justificar preço.
          </p>

          <div className="grid gap-4 lg:grid-cols-3 items-start">
            {FAIXAS.map((f) => (
              <div
                key={f.id}
                className="relative rounded-3xl border p-5 sm:p-6 h-full flex flex-col"
                style={{
                  borderColor: f.destaque ? "rgba(245,192,78,.45)" : "rgba(255,255,255,.13)",
                  background: f.destaque
                    ? "linear-gradient(160deg, rgba(245,192,78,.10), rgba(8,10,18,.9) 55%)"
                    : "rgba(255,255,255,.02)",
                  boxShadow: f.destaque ? "0 30px 70px -40px rgba(245,192,78,.55)" : undefined,
                }}
              >
                {f.destaque && (
                  <span
                    className="absolute -top-2.5 left-5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                    style={{ background: "#f5c04e", color: "#241a05" }}
                  >
                    a operação inteira
                  </span>
                )}

                <h3 className="text-2xl tracking-wide text-white" style={bebas}>
                  {f.nome}
                </h3>
                <p className="mt-1 text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.6)" }}>
                  {f.para}
                </p>

                {/* ⚠️ O CORTE VEM ANTES DO PREÇO.
                    Ele é a frase que explica a diferença entre 10, 30 e 50 mil
                    — e estava saindo em 12px apagado, colado embaixo de um
                    preço enorme em ouro. O olho parava no número e nunca
                    chegava na razão dele, que é o inverso do que uma escada de
                    preço precisa fazer. */}
                <p className="mt-3 text-sm leading-snug" style={{ color: "rgba(255,255,255,.82)" }}>
                  {f.corte}
                </p>
                <p className="mt-2 text-3xl sm:text-4xl tabular-nums" style={{ ...bebas, color: "#f5c04e" }}>
                  {brl(f.preco)}
                </p>
                {f.vagasPorMes !== null && (
                  <p className="mt-2 text-[12px]" style={{ color: "rgba(245,192,78,.75)" }}>
                    {f.vagasPorMes} por mês — é tempo de gente, e ele acaba.
                  </p>
                )}

                {/* ⚠️ O CUSTO DE OPERAR APARECE EM CADA FAIXA, e não só uma vez
                    no rodapé da grade. Preço em 36px de ouro e custo em 14px
                    apagado lá embaixo não é "peso igual" — é letra miúda com
                    outro nome. Aqui ele fica logo abaixo do preço, na mesma
                    coluna do olho. */}
                <p className="mt-2 text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.62)" }}>
                  + US$ {CUSTO_DE_OPERACAO.assinaturaAgenteUSD[0]}–{CUSTO_DE_OPERACAO.assinaturaAgenteUSD[1]}/mês
                  {" "}para operar, que <b style={{ color: "rgba(255,255,255,.82)" }}>não vem para nós</b>.
                </p>

                <ul className="mt-4 grid gap-2 flex-1">
                  {f.inclui.map((i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.78)" }}>
                      <Check size={15} className="shrink-0 mt-0.5" style={{ color: "#f5c04e" }} />
                      <span>{i}</span>
                    </li>
                  ))}
                  {f.naoTem.map((n) => (
                    <li key={n} className="flex gap-2 text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.6)" }}>
                      <X size={15} className="shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,.3)" }} />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contato"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition"
                  style={
                    f.destaque
                      ? { background: "#f5c04e", color: "#241a05" }
                      : { border: "1px solid rgba(245,192,78,.45)", color: "#f5c04e" }
                  }
                >
                  falar sobre esta faixa
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>

          {/* ⚠️ O GRÁTIS TEM SELO PRÓPRIO.
              Ele estava como uma oração no meio de um parágrafo sobre custo —
              o leitor tinha de cavar um texto que começa em "US$ 100–200/mês"
              para achar a parte que tranquiliza. Numa página de preço, quem
              lê para no primeiro número. */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["O banco", "grátis, para sempre", "MongoDB Atlas M0: 512 MB, sem cartão e sem prazo. E a fábrica roda sem banco nenhum."],
              ["A imagem e a voz", "grátis na sua placa", "Rodam local. Sem placa, existe o caminho por API — centavos por peça."],
              ["As atualizações", "grátis por 12 meses", "O kit cresce; o que entrar nesse período é seu, em qualquer faixa."],
            ].map(([o, q, p]) => (
              <div
                key={o}
                className="rounded-2xl border p-4"
                style={{ borderColor: "rgba(245,192,78,.28)", background: "rgba(245,192,78,.05)" }}
              >
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,.5)" }}>{o}</p>
                <p className="mt-1 text-xl tracking-wide" style={{ ...bebas, color: "#f5c04e" }}>{q}</p>
                <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "rgba(255,255,255,.65)" }}>{p}</p>
              </div>
            ))}
          </div>

          {/* O custo que NÃO é nosso. */}
          <div
            className="mt-3 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: "rgba(255,255,255,.13)", background: "rgba(255,255,255,.02)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.72)" }}>
              <b style={{ color: "#f5c04e" }}>
                Operar custa de US$ {CUSTO_DE_OPERACAO.assinaturaAgenteUSD[0]} a US$
                {" "}{CUSTO_DE_OPERACAO.assinaturaAgenteUSD[1]} por mês
              </b>{" "}
              — e esse dinheiro não vem para nós. {CUSTO_DE_OPERACAO.observacao}
            </p>
          </div>
        </div>
      </section>

      {/* ── O que vem dentro, medido ─────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-6">
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl tracking-wide text-white" style={bebas}>
            O que vem dentro
          </h2>
          <p className="mt-2 mb-4 text-sm" style={{ color: "rgba(255,255,255,.55)" }}>
            Contado no kit em {new Date(MEDIDO_EM).toLocaleDateString("pt-BR", { timeZone: "UTC" })}. Cada número
            tem um comando que o produz — nenhum é estimativa.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Cartao n={INVENTARIO.blueprints} r="blueprints prontos para rodar, sem edição" />
            <Cartao n={INVENTARIO.armadilhas} r="erros que já foram pagos por outra pessoa" />
            <Cartao n={INVENTARIO.portoes} r="medições que barram a peça ruim antes do ar" />
            <Cartao n={INVENTARIO.promptsNoKit} r="pedidos reais, com o que NÃO copiar" />
            <Cartao n={INVENTARIO.arquivosDeMotor} r="arquivos que já leem a sua entrevista" />
            <Cartao n={INVENTARIO.linhasDeCodigo} r="linhas de código que você não escreve do zero" />
            <Cartao n={INVENTARIO.perguntas} r="grupos de perguntas, e acabou a sua parte" />
            <Cartao n={INVENTARIO.mesesDeConstrucao} r="meses de construção medida, dia a dia" />
          </div>
        </div>
      </section>

      {/* ── Como começa ─────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-6 pb-14">
        <div className="relative max-w-5xl mx-auto">
          <div
            className="rounded-3xl border p-5 sm:p-7"
            style={{
              borderColor: "rgba(245,192,78,.28)",
              background: "linear-gradient(135deg, rgba(245,192,78,.09), rgba(8,10,18,.92) 55%)",
            }}
          >
            <h2 className="text-2xl sm:text-3xl tracking-wide text-white" style={bebas}>
              Como começa
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Você baixa a pasta", "Ela cabe num pen drive. Nada é instalado no seu sistema."],
                ["2", "Roda um comando", "O agente confere a máquina, abre a entrevista e começa a construir."],
                ["3", "Responde 12 grupos", "Quem você é, o que vende, como fala, o que nunca diz. O resto é com ele."],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3">
                  <span
                    className="shrink-0 grid place-items-center rounded-full w-7 h-7 text-[13px] font-bold"
                    style={{ background: "rgba(245,192,78,.15)", color: "#f5c04e", border: "1px solid rgba(245,192,78,.4)" }}
                  >
                    {n}
                  </span>
                  <span>
                    <b className="block text-sm text-white">{t}</b>
                    <span className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.62)" }}>{d}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"
                style={{ background: "#f5c04e", color: "#241a05" }}
              >
                começar uma conversa
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/casos"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"
                style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.8)" }}
              >
                ver o que já foi feito
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Entrada>
  );
}

function Cartao({ n, r }: { n: number; r: string }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.02)" }}
    >
      <b className="block text-3xl tabular-nums" style={{ ...bebas, color: "#f5c04e" }}>
        {n.toLocaleString("pt-BR")}
      </b>
      <span className="text-[12px] leading-snug block mt-1" style={{ color: "rgba(255,255,255,.6)" }}>
        {r}
      </span>
    </div>
  );
}

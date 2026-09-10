import type { Metadata } from "next";
import Image from "next/image";
import { Check, X, ShieldCheck, FileText, FolderOpen, HelpCircle } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { ComprarHotmart } from "@/components/lp/ComprarHotmart";
import {
  PAGINAS,
  CAPITULOS,
  DIAS_GARANTIA,
  PARTES,
  TITULOS,
  FERRAMENTAS,
  PARA_QUEM,
  NAO_PROMETE,
  FAQ,
  HOTMART_CHECKOUT,
  PRECO_EBOOK,
  brl,
} from "@/lib/lp/ganhar-dinheiro";

/**
 * A LANDING EXTERNA do ebook "Ganhar dinheiro com IA" — 10/09/2026.
 *
 * "Externa" no sentido da Hotmart: o produto aponta a sua *página de vendas*
 * para esta URL, em vez de usar o editor deles. O checkout continua sendo o da
 * Hotmart; o que muda é quem controla o argumento.
 *
 * ## As quatro decisões de conteúdo
 *
 * 1. **O sumário real, com os 30 títulos, todos abertos.** Sumário genérico
 *    ("você vai aprender a vender mais") é o que todo infoproduto tem, e é
 *    exatamente por isso que ninguém acredita nele. O índice de verdade é a
 *    prova mais barata de que o material existe: cada linha é conferível
 *    abrindo o PDF.
 *
 * 2. **"O que este livro não é" vem ANTES do preço.** É argumento, não
 *    ressalva. Quem vende método e não resultado precisa dizer isso enquanto o
 *    leitor ainda decide — e pelo CDC a oferta vincula.
 *
 * 3. **Nenhum número inventado, nenhum depoimento.** O produto tem
 *    `students: 0`, `rating: 0` e `testimonials: []` medidos. A prova aqui é o
 *    material e a autoria, não prova social que não existe.
 *
 * 4. **Todo número sai de `@/lib/lp/ganhar-dinheiro`.** Nada digitado no JSX —
 *    inclusive porque o banco guarda `contentChapters: 31`, que está errado.
 *
 * ## O que o gauntlet mudou, rodada a rodada
 *
 * **R1 — os três críticos reprovaram, e dois acharam o mesmo defeito sozinhos:**
 * a página vivia em `(site)` e herdava o header institucional inteiro. "13+
 * links no topo da LP, a maior fuga de atenção possível logo na primeira
 * dobra" (briefing); "abre 15+ rotas de saída antes da dobra terminar"
 * (acabamento, que só viu os PNG). Saiu de `(site)` para `[locale]/lp/`, com
 * chrome próprio. O briefing pegou ainda que a pergunta **"por que confiar"**
 * não tinha resposta nenhuma — daí a seção "Quem escreveu". O sistema pegou o
 * preço sem destaque, dois dourados no site e o CTA duplicado à mão.
 *
 * **R2 — briefing aprovou (nota 8); sistema e acabamento reprovaram de novo:**
 * - O dourado tinha sido *centralizado*, não *tokenizado*. Virou
 *   `--color-ouro` no `@theme`, com `font-display` junto.
 * - Dois tratamentos de `h2` na mesma página. Agora há um só, com variante de
 *   alinhamento.
 * - Só o primeiro bloco do sumário vinha aberto: "parece um card de exemplo
 *   que ficou e o resto não foi terminado". Agora **todos** abrem — e isso
 *   cumpre melhor o que o título promete.
 * - O dourado no `h1` competia com o CTA a poucos pixels dele. Saiu do título;
 *   o dourado agora é do botão, do preço e dos pontos de prova.
 * - Do briefing, três apontamentos sem bloqueio: como se acessa a Pasta Viva
 *   (o código está na primeira página do PDF — agora está escrito), o badge que
 *   fazia a Pasta Viva parecer bônus, e a ponte de credibilidade.
 *
 * ⚠️ **Um bloqueador foi REJEITADO com medição, não com opinião:** o crítico de
 * acabamento acusou contraste abaixo de AA nos textos secundários. Medido nos
 * tokens reais: `muted-foreground` dá **8,71:1** sobre o fundo e **6,57:1**
 * sobre os cards — o mínimo AA é 4,5:1. Ele julgou um PNG comprimido. Clarear
 * aquele cinza pioraria a hierarquia para consertar um defeito que não existe.
 *
 * ## Só em português, de propósito
 *
 * Hotmart, Pix, CPF, Código de Defesa do Consumidor. Servir `/en` com este
 * texto e anunciá-lo como versão inglesa é a contradição que já custou o
 * `hreflang` do site em 27/07 — daí o `noindex` e o par de idiomas reduzido.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = generatePageMetadata({
    locale,
    path: "/lp/ganhar-dinheiro-com-ia",
    title: `Ganhar dinheiro com IA — prestar serviço e ser pago (${CAPITULOS} capítulos)`,
    description: `Um PDF de ${PAGINAS} páginas sobre prestar serviço com IA: escolher o serviço, achar o primeiro cliente, orçar, entregar com padrão e cobrar. Sem promessa de renda.`,
  });

  const soPt = {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [`${SITE_URL}/materiais/ganhar-dinheiro-com-ia/link.jpg`],
    },
    twitter: {
      ...base.twitter,
      images: [`${SITE_URL}/materiais/ganhar-dinheiro-com-ia/link.jpg`],
    },
    alternates: {
      ...base.alternates,
      languages: {
        "x-default": `${SITE_URL}/pt-BR/lp/ganhar-dinheiro-com-ia`,
        "pt-BR": `${SITE_URL}/pt-BR/lp/ganhar-dinheiro-com-ia`,
      },
    },
  };

  if (locale !== "pt-BR") return { ...soPt, robots: { index: false, follow: true } };
  return soPt;
}

function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
      {children}
    </span>
  );
}

/** Um tratamento só para `h2` na página — centralizado ou à esquerda. */
function Titulo({
  children,
  alinhamento = "centro",
}: {
  children: React.ReactNode;
  alinhamento?: "centro" | "esquerda";
}) {
  return (
    <h2
      className={`font-display mb-8 text-3xl tracking-wide sm:text-4xl ${
        alinhamento === "centro" ? "text-center" : "text-left"
      }`}
    >
      {children}
    </h2>
  );
}

export default function LpGanharDinheiroComIa() {
  const preco = brl(PRECO_EBOOK);
  const produtoSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Ganhar dinheiro com IA: preste serviços e seja pago",
    author: { "@type": "Person", name: "Ricardo Faya" },
    bookFormat: "https://schema.org/EBook",
    inLanguage: "pt-BR",
    numberOfPages: PAGINAS,
    image: `${SITE_URL}/materiais/ganhar-dinheiro-com-ia/link.jpg`,
    description: `Manual de ${PAGINAS} páginas e ${CAPITULOS} capítulos sobre prestar serviço com IA: escolher, orçar, entregar e cobrar, sem promessa de renda.`,
    offers: {
      "@type": "Offer",
      url: HOTMART_CHECKOUT,
      priceCurrency: "BRL",
      price: PRECO_EBOOK,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="pb-24 pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(produtoSchema).replace(/</g, "\\u003c") }}
      />
      {/* ── 1. A dobra ─────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="text-center lg:text-left">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {/* O badge junta PDF e Pasta Viva num selo só: separados, faziam a
                Pasta Viva ler como bônus, e ela é metade da oferta. */}
            <Selo>
              PDF de {PAGINAS} páginas + Pasta Viva
            </Selo>
            <Selo>{CAPITULOS} capítulos</Selo>
          </div>

          <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-wide sm:text-6xl lg:text-7xl">
            PRESTE SERVIÇO COM IA
            <br />
            E SEJA PAGO POR ISSO
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0">
            Não é sobre gerar conteúdo em massa. É sobre resolver o problema de um cliente com
            IA — escolher o serviço, achar o primeiro cliente, orçar, entregar com padrão e
            cobrar sem constrangimento.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 lg:items-start">
            <ComprarHotmart href={HOTMART_CHECKOUT} preco={preco} />
            <p className="text-sm text-muted-foreground">
              Pagamento pela Hotmart · {DIAS_GARANTIA} dias de garantia incondicional
            </p>
          </div>
        </div>

          <div className="relative mx-auto w-full max-w-sm px-8 sm:max-w-md lg:px-6">
            <div className="absolute inset-x-10 bottom-3 top-12 rounded-[2rem] bg-ouro/20 blur-3xl" />
            <div className="relative rotate-2 rounded-[10px] border border-white/15 bg-white p-2 shadow-2xl transition-transform duration-500 hover:rotate-0">
              <Image
                src="/lp/ganhar-dinheiro-com-ia/capa.png"
                alt={`Capa do ebook Ganhar dinheiro com IA, com ${CAPITULOS} capítulos`}
                width={909}
                height={1289}
                priority
                className="h-auto w-full rounded-[5px]"
              />
              <div className="absolute -bottom-5 -left-5 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur">
                <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Você recebe
                </span>
                <strong className="text-sm">PDF + acesso à Pasta Viva</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Para quem é (antes de qualquer argumento: quem não se qualifica sai aqui) ─────────────────────────────────────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-4xl">
          <Titulo>PARA QUEM ESCREVI</Titulo>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PARA_QUEM.map((p) => (
              <li
                key={p}
                className="flex gap-3 rounded-xl border border-border bg-secondary p-5 text-muted-foreground"
              >
                <Check size={19} className="mt-0.5 shrink-0 text-ouro" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3. A verdade incômoda ──────────────────────────────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-ouro/25 bg-ouro/[0.06] p-7 sm:p-10">
          <Titulo alinhamento="esquerda">O CAPÍTULO 2 É O MAIS DESCONFORTÁVEL DO LIVRO</Titulo>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Ele explica por que a maior parte do que se vende como “ganhar dinheiro com IA” não
            paga: conteúdo gerado em massa não tem comprador, porque o próprio comprador
            consegue gerar. O que o mercado paga é entender o problema, escolher o que fazer,
            garantir que ficou bom — e responder por isso.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Se você quer um atalho para renda passiva, este livro vai te decepcionar no capítulo
            2. É melhor descobrir isso agora do que depois de comprar.
          </p>
        </div>
      </section>

      {/* ── 4. O que você recebe ───────────────────────────────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-4xl">
          <Titulo>O QUE VOCÊ RECEBE</Titulo>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-secondary p-7">
              <FileText className="mb-4 text-ouro" size={26} />
              <h3 className="mb-2 text-xl font-semibold">
                O PDF: {PAGINAS} páginas, {CAPITULOS} capítulos
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                Leitura direta, sem enrolação e sem aula em vídeo. As ferramentas são nomeadas
                por dentro, com o que dá para fazer no plano grátis e onde o grátis trava.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-7">
              <FolderOpen className="mb-4 text-ouro" size={26} />
              <h3 className="mb-2 text-xl font-semibold">A Pasta Viva</h3>
              <p className="leading-relaxed text-muted-foreground">
                Um acervo no site que continua sendo editado depois que você compra: métodos com
                fonte, o que passou a funcionar e o que parou. Método que sai de moda é
                arquivado, não apagado — e o histórico fica.
              </p>
              {/* Como se acessa: o briefing apontou que a página descrevia o que
                  a Pasta Viva é e nunca dizia como entrar nela. */}
              <p className="mt-4 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Como entrar:</strong> o código de acesso
                está na <strong className="text-foreground">primeira página do PDF</strong> que
                você baixa da Hotmart. Você o resgata uma vez em fayai.com.br e o acesso fica
                permanente.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-secondary p-7">
            <h3 className="mb-4 text-xl font-semibold">
              As {FERRAMENTAS.length} ferramentas, com o papel de cada uma
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FERRAMENTAS.map((f) => (
                <li
                  key={f.nome}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="font-medium">{f.nome}</span>
                  <span className="text-muted-foreground"> · {f.papel}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. Quem escreveu — a pergunta "por que confiar" ─────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-secondary p-7 sm:p-10">
          <Titulo alinhamento="esquerda">QUEM ESCREVEU</Titulo>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Ricardo Faya, editor de vídeo profissional{" "}
            <strong className="text-foreground">desde 1998</strong>. Vinte e oito anos vivendo
            de atender cliente: rede de broadcast sob a 20th Century Fox, as Copas do Mundo da
            Rússia e do Brasil, o Ziraldo TV Show, o longa <em>Emanuelle in Rio</em>. Em 2017
            recebeu a certificação{" "}
            <strong className="text-foreground">Fox Fastest Editor</strong>.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Este livro não é sobre edição de vídeo — e é justamente esse o ponto. Vinte e oito
            anos de prestação de serviço ensinam uma coisa que não muda quando a ferramenta
            muda:{" "}
            <strong className="text-foreground">
              como conseguir cliente, combinar o que será entregue, entregar e ser pago
            </strong>
            . A IA entrou no meio desse processo; o processo continua o mesmo. O que está escrito
            aqui é o que se faz para receber, não uma teoria sobre IA.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            O que este livro <em>não</em> tem: depoimento de aluno, número de vendas e nota de
            avaliação. Ele é novo, e inventar prova social seria a primeira mentira de um
            material que passa {CAPITULOS} capítulos falando sobre entregar o que se promete.
          </p>
        </div>
      </section>

      {/* ── 6. O sumário REAL, com todos os blocos abertos ──────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-4xl">
          <Titulo>O SUMÁRIO INTEIRO, SEM CORTE</Titulo>
          <p className="mx-auto -mt-4 mb-8 max-w-2xl text-center text-muted-foreground">
            Os {CAPITULOS} títulos, exatamente como estão no arquivo. Você sabe o que está
            comprando antes de pagar.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {PARTES.map((parte) => (
              <div
                key={parte.n}
                className="h-full rounded-2xl border border-border bg-secondary odd:bg-secondary even:bg-secondary/70"
              >
                <div className="flex items-baseline gap-3 p-6 pb-4">
                  <span className="font-display text-2xl text-ouro/70">
                    {String(parte.n).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className="block text-lg font-semibold">{parte.titulo}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Capítulos {parte.faixa[0]} a {parte.faixa[1]} · {parte.resumo}
                    </span>
                  </span>
                </div>
                <ol className="space-y-2 px-6 pb-6">
                  {TITULOS.slice(parte.faixa[0] - 1, parte.faixa[1]).map((t, i) => (
                    <li key={t} className="flex gap-3 text-muted-foreground">
                      <span className="w-7 shrink-0 text-right text-sm tabular-nums text-ouro/60">
                        {parte.faixa[0] + i}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA intermediário — o sumário ocupa perto de 40% da página, e quem
          decide no meio dele não pode ter de rolar até o topo ou até o fim. */}
      <section className="container mx-auto mt-12 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <ComprarHotmart href={HOTMART_CHECKOUT} preco={preco} />
          <p className="text-sm text-muted-foreground">
            {DIAS_GARANTIA} dias de garantia · pagamento pela Hotmart
          </p>
        </div>
      </section>

      {/* ── Perguntas diretas ──────────────────────────────────────────────
          As mesmas cinco da página irmã /pt-BR/ganhar-dinheiro-com-ia, com as
          MESMAS respostas — inclusive "quanto dá para ganhar?", que só tem uma
          resposta honesta. Duas páginas do mesmo produto respondendo diferente
          à mesma pergunta é como se perde a confiança que o resto constrói. */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-3xl">
          <Titulo>PERGUNTAS DIRETAS</Titulo>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.p}
                className="group rounded-xl border border-border bg-secondary p-5 open:bg-white/[0.04]"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 font-semibold marker:content-none">
                  <HelpCircle size={19} className="mt-0.5 shrink-0 text-ouro" />
                  <span>{f.p}</span>
                </summary>
                <p className="mt-3 pl-8 leading-relaxed text-muted-foreground">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. O que NÃO é — antes do preço, de propósito ───────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-secondary p-7 sm:p-10">
          <Titulo alinhamento="esquerda">O QUE ESTE LIVRO NÃO É</Titulo>
          <ul className="space-y-4">
            {NAO_PROMETE.map((n) => (
              <li key={n} className="flex gap-3 text-muted-foreground">
                <X size={19} className="mt-0.5 shrink-0 text-muted-foreground/70" />
                <span className="leading-relaxed">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 8. Preço e compra ──────────────────────────────────────────── */}
      <section className="container mx-auto mt-20 px-4">
        <div className="mx-auto max-w-2xl rounded-3xl border border-ouro/30 bg-gradient-to-b from-ouro/[0.09] to-transparent p-8 text-center sm:p-12">
          <Titulo>O LIVRO INTEIRO, DE UMA VEZ</Titulo>

          <p className="font-display -mt-2 text-7xl leading-none tracking-wide text-ouro sm:text-8xl">
            {preco}
          </p>
          <p className="mt-3 text-muted-foreground">
            pagamento único · parcelamento em até 12× na Hotmart
          </p>

          <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
            {[
              `PDF de ${PAGINAS} páginas, ${CAPITULOS} capítulos`,
              "Acesso à Pasta Viva, que continua sendo editada",
              `${DIAS_GARANTIA} dias de garantia incondicional`,
            ].map((i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <Check size={18} className="mt-0.5 shrink-0 text-ouro" />
                <span>{i}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <ComprarHotmart href={HOTMART_CHECKOUT} preco={preco} />
          </div>

          <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-muted-foreground/70" />
            <span>
              Se nos primeiros {DIAS_GARANTIA} dias você achar que não era para você, a Hotmart
              devolve o valor integral. Sem pergunta e sem formulário de retenção.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}

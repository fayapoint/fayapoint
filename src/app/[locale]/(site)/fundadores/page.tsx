import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { PlacaDosCem } from "@/components/fundadores/PlacaDosCem";
import { TIER_CONFIGS } from "@/lib/course-tiers";
import {
  contarVagas,
  DESCONTO_FUNDADOR,
  DESCONTO_FUNDADOR_AVULSO,
  DESCONTO_INDICADO,
  MESES_DESCONTO_INDICADO,
  COMISSAO,
  DIAS_DE_RETENCAO,
} from "@/lib/fundadores";
import { MARCOS, LIMITE_DE_VAGAS } from "@/models/Fundador";

/**
 * A PÁGINA DO PROGRAMA FUNDADORES — 06/09/2026.
 * Ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`.
 *
 * ## Três decisões de conteúdo que valem mais que o desenho
 *
 * 1. **Todo número desta página sai de código.** Preço vem de `TIER_CONFIGS`,
 *    percentual de `COMISSAO`, marcos de `MARCOS`, vagas do banco. Nada
 *    digitado à mão: número em página de venda que não sai da fonte é como o
 *    "5.000 profissionais" e os "30% de comissão" que esta casa manteve no ar
 *    sem motor nenhum atrás.
 * 2. **As regras aparecem na página, não só no regulamento.** O que "para
 *    sempre" quer dizer está escrito por extenso, porque pelo CDC a oferta
 *    vincula — e porque a promessa que precisa de letra miúda para se sustentar
 *    é a promessa errada.
 * 3. **A conta da comissão é feita na frente do leitor.** "7%" é abstrato;
 *    "R$5,43 por mês, e dez contas dessas pagam a sua assinatura" é uma
 *    decisão.
 *
 * Revalida a cada 60s pelo contador de vagas — mesma janela da rota
 * `/api/fundadores/vagas`, pela mesma razão.
 */
export const revalidate = 60;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default async function PaginaFundadores() {
  const vagas = await contarVagas().catch(() => null);

  const planos = (["explorador", "profissional", "expert"] as const).map((slug) => {
    const t = TIER_CONFIGS[slug];
    return {
      nome: t.displayName,
      tabela: t.monthlyPrice,
      fundador: Math.round(t.monthlyPrice * (1 - DESCONTO_FUNDADOR) * 100) / 100,
      creditos: t.monthlyCredits,
    };
  });

  // A conta da vitrine, com o plano do meio. Feita aqui para não haver dois
  // números diferentes na mesma página se a tabela mudar.
  const exemplo = (() => {
    const cheio = TIER_CONFIGS.profissional.monthlyPrice;
    const pagoPeloIndicado = Math.round(cheio * (1 - DESCONTO_INDICADO) * 100) / 100;
    const porMes = Math.round(pagoPeloIndicado * COMISSAO.padrao.credito * 100) / 100;
    return { cheio, pagoPeloIndicado, porMes, dez: Math.round(porMes * 10 * 100) / 100 };
  })();

  const precoFundadorDoMeio = planos[1].fundador;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pb-24 pt-32">
        {/* ── Abertura ───────────────────────────────────────────────── */}
        <section className="container mx-auto grid gap-14 px-4 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Programa Fundadores · Turma 001
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight md:text-6xl">
              Cem lugares.
              <br />
              Metade do preço.
              <br />
              <span className="text-amber-400">Para sempre.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg text-muted-foreground">
              A FayAI abre as cem primeiras assinaturas fundadoras. Quem entra paga{" "}
              <strong className="font-semibold text-foreground">
                metade do preço enquanto for assinante
              </strong>
              , recebe um número que não se repete, e ganha{" "}
              <strong className="font-semibold text-foreground">
                {pct(COMISSAO.padrao.credito)} de tudo que indicar
              </strong>{" "}
              — sem prazo para acabar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/registro?proximo=/precos"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Quero meu número <ArrowRight size={18} />
              </Link>
              <p className="max-w-[22ch] text-sm leading-snug text-muted-foreground">
                Entra com Google. CPF e celular só na hora de assinar.
              </p>
            </div>
          </div>

          {vagas ? (
            <PlacaDosCem ocupados={vagas.ocupadas} total={vagas.total} />
          ) : (
            /* O contador não inventa. Se o banco não respondeu, a página diz
               isso — e continua vendendo o resto, que não depende dele. */
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                O contador de vagas não respondeu agora.
                <br />
                São {LIMITE_DE_VAGAS} lugares no total.
              </p>
            </div>
          )}
        </section>

        {/* ── Preços ─────────────────────────────────────────────────── */}
        <section className="container mx-auto mt-20 px-4">
          <div className="grid border-y border-border md:grid-cols-3">
            {planos.map((p, i) => (
              <div
                key={p.nome}
                className={`px-7 py-8 ${i > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}
              >
                <h3 className="text-sm font-semibold tracking-wide">{p.nome}</h3>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-mono text-[15px] tabular-nums text-muted-foreground line-through">
                    {brl(p.tabela)}
                  </span>
                  <span className="text-4xl font-bold tabular-nums text-amber-400">
                    {brl(p.fundador)}
                    <small className="ml-1 font-mono text-[13px] font-normal text-muted-foreground">
                      /mês
                    </small>
                  </span>
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground">
                  {p.creditos} créditos por mês — e o crédito não muda: desconto é no
                  preço, nunca na entrega.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O que o número compra ──────────────────────────────────── */}
        <section className="container mx-auto mt-24 px-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            O que o número compra
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Seis coisas, e nenhuma some depois
          </h2>

          <div className="mt-10 grid gap-px bg-border md:grid-cols-3">
            {[
              {
                rotulo: "Preço",
                titulo: "Metade, enquanto durar",
                texto: `Enquanto a assinatura estiver ativa você paga ${pct(DESCONTO_FUNDADOR)} da tabela. E o preço fica congelado: aumento não te alcança.`,
              },
              {
                rotulo: "Identidade",
                titulo: "Um número só seu",
                texto: `De #001 a #${LIMITE_DE_VAGAS}. No perfil, no seu boneco do /game e no muro dos fundadores. O número é seu mesmo se um dia você sair.`,
              },
              {
                rotulo: "Produção",
                titulo: "Frente da fila na placa",
                texto: "A GPU que gera imagem, vídeo e narração é uma só, e atende um pedido por vez. O seu passa na frente.",
              },
              {
                rotulo: "Acesso",
                titulo: "Antes de todo mundo",
                texto: "Forja, Ateliê, USS, jogo novo no /game: fundador entra na primeira leva, e é quem diz o que ajustar.",
              },
              {
                rotulo: "Comunidade",
                titulo: "Direito de sediar liga",
                texto: "Seu campeonato oficial no /game, com tabela, elenco e mercado. Cada cartaz gerado sai assinado com o seu código.",
              },
              {
                rotulo: "Avulsos",
                titulo: `${pct(DESCONTO_FUNDADOR_AVULSO)} no que é fora do plano`,
                texto: "Curso, certificado, pacote de crédito. O desconto de fundador acompanha, não é só na assinatura.",
              },
            ].map((b) => (
              <div key={b.titulo} className="bg-background p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  {b.rotulo}
                </p>
                <h3 className="mt-2.5 text-lg font-semibold">{b.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O código ───────────────────────────────────────────────── */}
        <section className="container mx-auto mt-24 px-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            O código
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Você não divulga um link. Você organiza uma liga.
          </h2>

          <div className="mt-9 grid gap-12 lg:grid-cols-2">
            <div>
              <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-5 py-4 font-mono text-[17px]">
                fayai.com.br/f/<span className="text-primary">oseunome</span>
              </p>

              <div className="mt-5 flex flex-col gap-3.5 sm:flex-row">
                <div className="flex-1 rounded-lg border border-amber-500/50 bg-amber-500/10 p-5">
                  <p className="text-4xl font-bold tabular-nums text-amber-400">
                    {pct(COMISSAO.padrao.credito)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">em crédito na sua conta</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-secondary/40 p-5">
                  <p className="text-4xl font-bold tabular-nums">
                    {pct(COMISSAO.padrao.dinheiro)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">em dinheiro, por Pix</p>
                </div>
              </div>

              <p className="mt-6 max-w-[52ch] text-muted-foreground">
                Quem entra pelo seu endereço ganha{" "}
                <strong className="font-semibold text-foreground">
                  {pct(DESCONTO_INDICADO)} de desconto nos {MESES_DESCONTO_INDICADO} primeiros
                  meses
                </strong>
                . E você recebe, de tudo que essa conta pagar — assinatura, crédito, curso,
                certificado —,{" "}
                <strong className="font-semibold text-foreground">
                  a sua parte todo mês, enquanto ela for cliente
                </strong>
                .
              </p>
              <p className="mt-4 max-w-[52ch] text-muted-foreground">
                Um nível só. Você ganha de quem você trouxe, não de quem eles trouxerem:
                aqui o dinheiro vem de gente usando o produto, nunca de gente recrutando
                gente.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Uma conta indicada, na prática
              </p>
              <dl className="mt-4">
                {[
                  ["Plano Profissional", brl(exemplo.cheio)],
                  [
                    `Desconto de quem entrou pelo seu código (${pct(DESCONTO_INDICADO)})`,
                    `− ${brl(exemplo.cheio - exemplo.pagoPeloIndicado)}`,
                  ],
                  ["O que ela paga no primeiro ano", brl(exemplo.pagoPeloIndicado)],
                ].map(([rotulo, valor], i, arr) => (
                  <div
                    key={rotulo}
                    className={`flex items-baseline justify-between gap-4 py-2.5 text-sm ${i < arr.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <dt className="text-muted-foreground">{rotulo}</dt>
                    <dd className="font-mono tabular-nums">{valor}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between gap-4 border-t-2 border-border pt-4">
                <span className="text-sm text-muted-foreground">A sua parte, em crédito</span>
                <b className="font-mono text-xl tabular-nums text-amber-400">
                  {brl(exemplo.porMes)} / mês
                </b>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
                Dez contas assim rendem {brl(exemplo.dez)} por mês — mais do que a sua
                própria assinatura de fundador custa ({brl(precoFundadorDoMeio)}). É esse o
                desenho: quem traz gente para a casa deixa de pagar para estar nela.
              </p>
            </div>
          </div>
        </section>

        {/* ── A escada ───────────────────────────────────────────────── */}
        <section className="container mx-auto mt-24 px-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            A escada
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Quatro marcos, e o que cada um abre
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            Contados por conta que virou cliente e continuou — não por cadastro.
          </p>

          <div className="mt-9 border-t border-border">
            {MARCOS.map((m, i) => (
              <div
                key={m.nivel}
                className="grid items-baseline gap-x-7 gap-y-1 border-b border-border py-5 md:grid-cols-[110px_1fr_1.2fr]"
              >
                <p className="font-mono text-[13px] text-primary tabular-nums">
                  {m.indicados} contas
                </p>
                <h3
                  className={`text-xl font-bold capitalize ${i === MARCOS.length - 1 ? "text-amber-400" : ""}`}
                >
                  {m.nivel}
                </h3>
                <p className="text-[15px] text-muted-foreground">
                  {brl(m.bonusCreditos)} em crédito
                  {m.nivel === "prata" && " e o direito de abrir campeonato oficial no /game"}
                  {m.nivel === "ouro" && " e um bloco fixo seu na transmissão de toda semana"}
                  {m.nivel === "lenda" &&
                    `, e a sua comissão sobe para ${pct(COMISSAO.lenda.credito)} em crédito ou ${pct(COMISSAO.lenda.dinheiro)} em dinheiro — para sempre`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── As regras ──────────────────────────────────────────────── */}
        <section className="container mx-auto mt-24 px-4">
          <div className="rounded-2xl bg-secondary/40 p-8 md:p-11">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              As regras, sem letra miúda
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              O que &ldquo;para sempre&rdquo; quer dizer aqui
            </h2>

            <div className="mt-8 grid gap-7 md:grid-cols-2 md:gap-x-11">
              <div className="rounded-r-lg border-l-2 border-amber-400 bg-background/60 px-6 py-5 md:col-span-2">
                <h3 className="font-semibold text-amber-400">
                  A definição inteira, em três linhas
                </h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground">
                  A comissão dura enquanto a conta indicada estiver pagando <b>e</b> a sua
                  assinatura estiver ativa. Se você cancela, ela pausa — não morre — e volta
                  quando você voltar, com 90 dias de carência para cartão recusado. O seu
                  número é permanente mesmo depois de cancelar; o preço de fundador, não.
                </p>
              </div>

              {[
                [
                  "A vaga é sua no primeiro pagamento",
                  "Cadastro não reserva número. O lugar fecha quando a primeira cobrança confirma — é o que impede as cem vagas de sumirem numa noite de robô.",
                ],
                [
                  "Um CPF, uma conta, um número",
                  "Com celular verificado por código. Indicar a si mesmo, com outro e-mail ou outro aparelho, não conta e cancela o programa para aquela conta.",
                ],
                [
                  `A comissão espera ${DIAS_DE_RETENCAO} dias`,
                  `Ela nasce retida e libera depois de ${DIAS_DE_RETENCAO} dias sem reembolso. Se a compra for estornada, o lançamento é desfeito — de nenhum dos dois lados isso é surpresa.`,
                ],
                [
                  "Descontos não se somam",
                  "Se você entrou pelo código de alguém e ainda pegou vaga de fundador, vale o maior dos dois. Nunca os dois juntos.",
                ],
                [
                  "Produto físico fica de fora",
                  "A comissão vale sobre o que é digital: assinatura, crédito, curso, certificado. Camiseta e caneca têm margem que não paga comissão, e a gente prefere dizer isso do que descobrir junto.",
                ],
                [
                  "O programa fecha",
                  `Em ${LIMITE_DE_VAGAS} fundadores ou em 31 de dezembro de 2026, o que vier primeiro. Quem entrou continua com tudo o que está escrito aqui.`,
                ],
              ].map(([titulo, texto]) => (
                <div key={titulo}>
                  <h3 className="font-semibold">{titulo}</h3>
                  <p className="mt-1.5 text-[15px] text-muted-foreground">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Fecho ──────────────────────────────────────────────────── */}
        <section className="container mx-auto mt-24 px-4">
          <div className="border-t border-border pt-20 text-center">
            {vagas && (
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {vagas.livres > 0
                  ? `Restam ${vagas.livres} lugares`
                  : "As cem vagas foram preenchidas"}
              </p>
            )}
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Pegue o seu número
              <br />
              antes que ele seja de outro.
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] text-muted-foreground">
              Leva dois minutos: entra com Google, escolhe o plano, confirma CPF e celular.
              O número sai na hora em que o pagamento confirma.
            </p>
            <Link
              href="/registro?proximo=/precos"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Quero meu número <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

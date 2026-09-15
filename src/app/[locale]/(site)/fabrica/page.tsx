import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Database, RefreshCw, ShieldCheck, X, Zap } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { SequenciaDeRolagem } from "@/components/fabrica/SequenciaDeRolagem";
import { MesaDePecas } from "@/components/fabrica/FabricaExperience";
import { GiroDoEstudio, type PontoDoEstudio } from "@/components/fabrica/GiroDoEstudio";
import { MonteSuaFabrica } from "@/components/fabrica/MonteSuaFabrica";
import "@/components/fabrica/fabrica-experience.css";
import { FAIXAS, INVENTARIO, NAO_PROMETE, CUSTO_DE_OPERACAO, GRADE_DO_DIA, MEDIDO_EM, brl } from "@/lib/fabrica";

/**
 * A PÁGINA DA FÁBRICA AUTÔNOMA.
 *
 * ## O conceito (aprovado pelo Ricardo em 15/09/2026)
 *
 * A fábrica vende uma operação, então a página mostra a operação acontecendo,
 * com coisas reais:
 *
 *   1. **Abertura** — um notebook com a pasta `fabrica-autonoma` num galpão
 *      vazio. A rolagem monta, peça por peça, um estúdio de conteúdo inteiro em
 *      volta dele. É a frase "uma pasta, um comando" virando imagem.
 *   2. **Peças reais** — o carrossel, o reel e a aula que a operação da FayAI
 *      produziu. Nada de maquete gerada para parecer entrega.
 *   3. **Fechamento** — o estúdio se desfaz em fragmentos que formam o logo.
 *
 * As duas sequências são vídeos do Seedance 2.5 em 480p (quadro inicial e
 * final declarados), restaurados para 1080p pelo SeedVR2 local e fatiados em
 * quadros (`scripts/fabrica-upscale.mjs` → `scripts/fabrica-quadros.mjs`).
 *
 * ## As três decisões de conteúdo, que valem mais que o desenho
 *
 * 1. **Todo número sai de `lib/fabrica.ts`.** Nenhum digitado aqui.
 * 2. **"O que isto não promete" fica ANTES do preço.** É argumento, não
 *    ressalva — e pelo Código de Defesa do Consumidor a oferta vincula.
 * 3. **O material é o mesmo nas três faixas.** Muda quanto do caminho a pessoa
 *    faz sozinha.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
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
   * ⛔ `/en/fabrica` NÃO É INDEXÁVEL enquanto o texto for português — a árvore
   * inglesa declarando `hreflang="en"` e servindo português é conteúdo
   * duplicado para o buscador e engano para quem clica (defeito já pago em
   * 27/07/2026).
   */
  const imagem = { url: "/fabrica/og-fabrica.jpg", width: 1200, height: 630, alt: "O estúdio da Fábrica Autônoma, montado" };
  const comImagem = {
    ...meta,
    openGraph: { ...meta.openGraph, images: [imagem] },
    twitter: { ...meta.twitter, images: [imagem.url] },
  };
  if (locale !== "pt-BR") return { ...comImagem, robots: { index: false, follow: true }, alternates: undefined };
  return comImagem;
}

/** Quadros por sequência — o mesmo número que `fabrica-quadros.mjs` gera. */
const QUADROS = 144;
/** O giro 360 tem 24 s de vídeo: mais quadros para a volta não engasgar. */
const QUADROS_GIRO = 180;
const quadro = (seq: string, n: number) => `/fabrica/${seq}/${String(n).padStart(3, "0")}.webp`;
const PECAS = "/fabrica/pecas";

/** Cada faixa mostra um estado da mesma abertura: a pasta, a montagem, o estúdio pronto. */
const IMAGEM_DA_FAIXA: Record<string, { src: string; alt: string }> = {
  pasta: { src: "/fabrica/notebook-4k.webp", alt: "Um notebook numa mesa, com a pasta da fábrica aberta na tela" },
  instalacao: { src: quadro("abertura", 80), alt: "O estúdio sendo montado em volta do notebook" },
  // A faixa de cima usa o estúdio refeito em 4K (GPT Image 2.5 Sunburst): é a imagem
  // em que a pessoa mais para, e a letra das telas precisa ser lida.
  fabrica: { src: "/fabrica/estudio-4k.webp", alt: "O estúdio de conteúdo completo, com as peças da FayAI nas telas" },
};

/**
 * Os pontos do giro. ⛔ Nenhum texto novo aqui: cada frase é puxada de
 * `lib/fabrica.ts` pelo conteúdo, para que mudar uma faixa mude o ponto junto.
 * As coordenadas são o centro do objeto em cada foto 4K (medidas em 15/09/2026).
 */
const itemDaFaixa = (faixa: string, trecho: string) =>
  FAIXAS.find((f) => f.id === faixa)?.inclui.find((i) => i.includes(trecho)) ?? "";
const horaDoDia = (hora: string) => GRADE_DO_DIA.find((d) => d.hora === hora)?.longa ?? "";

// Os títulos falam da empresa de quem está vendo (pedido do Ricardo, 15/09/2026:
// a página existe para a pessoa contratar e ver a empresa DELA funcionando sozinha).
const PONTOS_FRENTE: PontoDoEstudio[] = [
  {
    id: "pasta", x: 48, y: 49.5, rotulo: "A pasta", titulo: "O ponto de partida da sua empresa",
    texto: `Uma pasta com ${INVENTARIO.blueprints} blueprints, ${INVENTARIO.armadilhas} armadilhas já pagas e ${INVENTARIO.portoes} portões medidos. Um comando abre a entrevista.`,
    origem: "Nas três faixas",
  },
  { id: "carrossel", x: 39, y: 42.6, rotulo: "12:00 · Carrossel", titulo: "Sua empresa no feed, todo dia", texto: horaDoDia("12:00"), origem: "Um dia da máquina" },
  { id: "reel", x: 57, y: 42.6, rotulo: "19:00 · Reel", titulo: "Sua empresa em vídeo, na sua voz", texto: horaDoDia("19:00"), origem: "Um dia da máquina" },
  { id: "aula", x: 47.7, y: 25.5, rotulo: "Esteira longa", titulo: "O que a sua empresa sabe vira aula", texto: itemDaFaixa("fabrica", "esteiras longas"), origem: "Na Fábrica Inteira" },
  { id: "camera", x: 17, y: 37, rotulo: "Roteiro e corte", titulo: "Os vídeos longos da sua empresa", texto: itemDaFaixa("fabrica", "peça longa"), origem: "Na Fábrica Inteira" },
  { id: "voz", x: 63, y: 39, rotulo: "Sua voz", titulo: "A voz da sua empresa é a sua", texto: itemDaFaixa("instalacao", "voz clonada"), origem: "Na Instalação e na Fábrica Inteira" },
  { id: "mesa", x: 88.5, y: 31.5, rotulo: "A mesa", titulo: "Você só aprova", texto: horaDoDia("quando você abrir"), origem: "Quando você abrir" },
];

const PONTOS_VERSO: PontoDoEstudio[] = [
  { id: "agente", x: 50.6, y: 51.5, rotulo: "O agente", titulo: "Dois agentes trabalhando pela sua empresa", texto: itemDaFaixa("fabrica", "segundo agente"), origem: "Na Fábrica Inteira" },
  { id: "portoes", x: 71, y: 40, rotulo: "Os portões", titulo: "Nada torto sai com o nome da sua empresa", texto: itemDaFaixa("pasta", "portões executáveis"), origem: "Nas três faixas" },
  { id: "memoria", x: 10, y: 31, rotulo: "A memória", titulo: "Sua empresa não repete erro", texto: itemDaFaixa("fabrica", "memória"), origem: "Na Fábrica Inteira" },
  { id: "publicador", x: 41.8, y: 54, rotulo: "A cada 15 min", titulo: "Se algo falha, ele se recupera sozinho", texto: horaDoDia("a cada 15 min"), origem: "Um dia da máquina" },
  { id: "painel", x: 49.6, y: 19.5, rotulo: "O painel", titulo: "A operação da sua empresa à vista", texto: itemDaFaixa("fabrica", "banco vivo"), origem: "Na Fábrica Inteira" },
  { id: "cartilhas", x: 39.3, y: 60.3, rotulo: "As cartilhas", titulo: "O jeito da sua empresa, escrito", texto: itemDaFaixa("pasta", "cartilhas"), origem: "Nas três faixas" },
];

const inventario = [
  [INVENTARIO.blueprints, "blueprints prontos para rodar, sem edição"],
  [INVENTARIO.armadilhas, "erros que já foram pagos por outra pessoa"],
  [INVENTARIO.portoes, "medições que barram a peça ruim antes do ar"],
  [INVENTARIO.promptsNoKit, "pedidos reais, com o que NÃO copiar"],
  [INVENTARIO.arquivosDeMotor, "arquivos que já leem a sua entrevista"],
  [INVENTARIO.linhasDeCodigo, "linhas de código que você não escreve do zero"],
  [INVENTARIO.perguntas, "grupos de perguntas na sua entrevista"],
  [INVENTARIO.mesesDeConstrucao, "meses de construção medida, dia a dia"],
] as const;

export default async function PaginaFabrica() {
  return (
    <main className="fx-page">
      <header className="fx-mast">
        <Link href="/" className="fx-brand" aria-label="FayAi — início">
          {/* ⚠️ O logo mora em `/fabrica/`, NUNCA em `/images/`. Em produção o
              `netlify-plugin-cloudinary` desvia todo `/images/*` para o Cloudinary, que
              responde 401 — no ar em 15/09/2026, o cabeçalho mostrava imagem quebrada
              enquanto no `next dev` (sem o plugin) tudo carregava. É o mesmo arquivo,
              conferido contra `D:\fayai\fayai_logo.png`. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fabrica/fayai-original.png" alt="FayAi" width={190} height={72} />
          <span>Fábrica Autônoma</span>
        </Link>
        <nav className="fx-nav" aria-label="Nesta página">
          <a href="#entregas">O que sai</a>
          <a href="#rotina">O dia</a>
          <a href="#faixas">Investimento</a>
          <Link className="fx-nav-cta" href="/contato">
            Conversar <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      {/* ── 1. Abertura: a pasta vira um estúdio ────────────────────────── */}
      <SequenciaDeRolagem
        id="abertura"
        pasta="/fabrica/abertura"
        pastaMovel="/fabrica/abertura-movel"
        // Só o softbox da DIREITA (SAM 3.1, `--manter 52:100`): um poste fino atravessando o título
        // "Sua voz…". O tripé da câmera, denso, cobria "voz" em 16:9; com as duas luzes na máscara,
        // o pé do softbox da esquerda aparecia em 2 quadros e sumia — o título piscava.
        pastaFrente="/fabrica/abertura-frente"
        pastaFrenteMovel="/fabrica/abertura-frente-movel"
        quadros={QUADROS}
        telas={3.6}
        alt="Um notebook com a pasta da fábrica num galpão escuro; ao rolar, um estúdio de conteúdo inteiro se monta em volta dele."
        batidas={[
          {
            de: 0,
            ate: 0.2,
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">Uma pasta · um comando</p>
                <h1>
                  A fábrica que
                  <br />
                  trabalha <span>sem você.</span>
                </h1>
                <p>
                  Você baixa uma pasta e roda um comando. O agente entrevista você — e a operação passa a publicar, narrar,
                  medir e relatar todo dia, com a sua identidade.
                </p>
                <div className="fx-actions">
                  <a className="fx-button fx-button-blue" href="#faixas">
                    Ver as três faixas <ArrowDown size={16} aria-hidden="true" />
                  </a>
                  <span className="fx-rolar">Role para abrir a pasta</span>
                </div>
              </div>
            ),
          },
          {
            de: 0.27,
            ate: 0.52,
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">01 · A pasta abre</p>
                <h2>Dela sai um estúdio inteiro.</h2>
                <p>Câmera, luz, microfone, roteiro, arte, edição e publicação — o trabalho de uma equipe, montado em volta do que você já sabe.</p>
              </div>
            ),
          },
          {
            de: 0.58,
            ate: 0.8,
            posicao: "direita",
            camada: "atras",
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">02 · Com a sua identidade</p>
                <h2>
                  Sua voz. Sua marca.
                  <br />
                  Sua máquina.
                </h2>
                <p>A entrevista define o que você diz e o que nunca diz. Imagem e voz rodam de graça na sua placa.</p>
              </div>
            ),
          },
          {
            de: 0.86,
            ate: 1,
            posicao: "base",
            conteudo: (
              <div className="fx-batida fx-batida-grade">
                <div>
                  <p className="fx-eyebrow">03 · O estúdio montado</p>
                  <h2>E ele trabalha todo dia.</h2>
                </div>
                <ul className="fx-chips" aria-label="A grade de um dia">
                  {GRADE_DO_DIA.filter((d) => d.curta).map((d) => (
                    <li key={d.hora}>
                      <time>{d.hora}</time>
                      {d.curta}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
        ]}
      />

      {/* ── 1b. O giro 360: terminada a construção, a câmera dá a volta ─────
          Quatro quartos de volta do Seedance 2.0 encadeados (frente → direita →
          verso → esquerda → frente), cada um começando no último quadro do anterior. */}
      <SequenciaDeRolagem
        id="giro"
        className="fx-giro360"
        pasta="/fabrica/giro"
        pastaMovel="/fabrica/giro-movel"
        quadros={QUADROS_GIRO}
        telas={4}
        quadroParado={0}
        alt="A câmera dá uma volta completa em torno do estúdio montado, com o tempo parado."
        batidas={[
          {
            de: 0.02,
            ate: 0.3,
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">Dê a volta</p>
                <h2>
                  Tudo o que a sua empresa
                  <br />
                  <span>precisa para aparecer.</span>
                </h2>
                <p>Num lugar só, montado em volta do que você já sabe.</p>
              </div>
            ),
          },
          {
            de: 0.36,
            ate: 0.64,
            posicao: "direita",
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">De um lado</p>
                <h2>O que vai ao ar.</h2>
                <p>Carrossel, reel, aula e livro — com a sua marca e a sua voz.</p>
              </div>
            ),
          },
          {
            de: 0.7,
            ate: 0.98,
            posicao: "base",
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">Do outro</p>
                <h2>O que garante que presta.</h2>
                <p>
                  {INVENTARIO.portoes} portões medidos, a memória de cada erro e um painel para você acompanhar.
                </p>
              </div>
            ),
          },
        ]}
      />

      {/* ── 1c. Os pontos: o estúdio de frente e de verso, para explorar ──── */}
      <section className="fx-section-giro" id="por-dentro" aria-label="Por dentro da sua fábrica">
        <GiroDoEstudio
          frente={{ src: "/fabrica/estudio-4k.webp", alt: "O estúdio montado, visto de frente", pontos: PONTOS_FRENTE }}
          verso={{ src: "/fabrica/verso-4k.webp", alt: "O mesmo estúdio visto de trás da mesa", pontos: PONTOS_VERSO }}
        />
      </section>

      {/* ── 1d. A sua empresa: a pergunta que a página existe para responder ── */}
      <section className="fx-section fx-section-monte" id="sua-empresa" aria-label="Monte a fábrica da sua empresa">
        <div className="fx-wrap">
          <MonteSuaFabrica />
        </div>
      </section>

      {/* ── 2. Prova ────────────────────────────────────────────────────── */}
      <div className="fx-wrap">
        <div className="fx-proof">
          <p className="fx-proof-intro">
            Não é um curso sobre automação. É a operação que escreveu este texto, empacotada com os erros que ela já pagou para
            funcionar.
          </p>
          <div className="fx-proof-stat">
            <strong>{INVENTARIO.blueprints}</strong>
            <span>blueprints conectados</span>
          </div>
          <div className="fx-proof-stat">
            <strong>{INVENTARIO.armadilhas}</strong>
            <span>armadilhas documentadas</span>
          </div>
          <div className="fx-proof-stat">
            <strong>{INVENTARIO.portoes}</strong>
            <span>portões de qualidade</span>
          </div>
        </div>
      </div>

      {/* ── 3. Peças reais ──────────────────────────────────────────────── */}
      <section id="entregas" aria-label="Peças reais produzidas pela fábrica">
        <MesaDePecas
          slides={Array.from({ length: 9 }, (_, i) => `${PECAS}/carrossel-${i}.webp`)}
          reel={{ src: `${PECAS}/reel.mp4`, capa: `${PECAS}/reel-capa.webp` }}
          aula={`${PECAS}/aula.webp`}
        />
      </section>

      {/* ── 4. Um dia da máquina ────────────────────────────────────────── */}
      <section className="fx-section" id="rotina">
        <div className="fx-wrap fx-day-grid">
          <div className="fx-day-copy">
            <p className="fx-eyebrow">05 · Um dia da máquina</p>
            <h2>
              A rotina continua.
              <br />
              <span>Você ganha o dia.</span>
            </h2>
            <p className="fx-day-intro">
              Depois da entrevista, cada etapa tem hora marcada. Quando algo precisa de você, ele espera na mesa — aprovar é um
              clique.
            </p>
          </div>
          <ol className="fx-timeline">
            {GRADE_DO_DIA.map((d) => (
              <li key={d.hora}>
                <time>{d.hora}</time>
                <p>{d.longa}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. O que isto NÃO promete — antes do preço, de propósito ────── */}
      <section className="fx-principle">
        <div className="fx-wrap fx-principle-inner">
          <div>
            <p className="fx-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" /> Um acordo claro
            </p>
            <h2>
              Vendemos a operação.
              <br />
              <span>Nunca o resultado.</span>
            </h2>
            <p>Está aqui em cima, e não no rodapé, porque é parte da oferta.</p>
          </div>
          <div>
            <ul>
              {NAO_PROMETE.map((n) => (
                <li key={n}>
                  <X size={14} aria-hidden="true" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <p className="fx-principle-end">
              O que prometemos é a operação: ela roda, ela mede, e quando um defeito passa, o portão que faltava é escrito antes
              de seguir. Se isso não é o que você procura, as outras páginas deste site provavelmente servem melhor — e isso
              também é uma resposta.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. As três faixas ───────────────────────────────────────────── */}
      <section className="fx-section fx-pricing" id="faixas">
        <div className="fx-wrap">
          <div className="fx-section-head">
            <div>
              <p className="fx-eyebrow">06 · Três formas de entrar</p>
              <h2>
                O mesmo material.
                <br />
                <span>Muda quanto você faz sozinho.</span>
              </h2>
            </div>
            <p>O material é o mesmo nas três. Não seguramos conteúdo para justificar preço.</p>
          </div>

          <div className="fx-pricing-grid">
            {FAIXAS.map((f, i) => {
              const imagem = IMAGEM_DA_FAIXA[f.id];
              return (
                <article className={`fx-tier ${f.destaque ? "fx-tier-featured" : ""}`} key={f.id}>
                  <div className="fx-tier-top">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagem.src} alt={imagem.alt} width={1600} height={900} loading="lazy" decoding="async" />
                    <span className="fx-tier-index">0{i + 1}</span>
                    {f.destaque && <span className="fx-tier-label">A operação inteira</span>}
                  </div>
                  <div className="fx-tier-body">
                    <h3>{f.nome}</h3>
                    <p className="fx-tier-for">{f.para}</p>
                    {/* O corte vem ANTES do preço: é a frase que explica a diferença entre as faixas. */}
                    <p className="fx-tier-cut">{f.corte}</p>
                    <p className="fx-price">{brl(f.preco)}</p>
                    <p className="fx-recurring">
                      + US$ {CUSTO_DE_OPERACAO.assinaturaAgenteUSD[0]}–{CUSTO_DE_OPERACAO.assinaturaAgenteUSD[1]}/mês para operar,
                      que <b>não vem para nós</b>.
                    </p>
                    {f.vagasPorMes !== null && <p className="fx-capacity">{f.vagasPorMes} por mês — é tempo de gente, e ele acaba.</p>}
                    <ul>
                      {f.inclui.map((item) => (
                        <li key={item}>
                          <Check size={14} aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {f.naoTem.map((item) => (
                        <li className="fx-excluded" key={item}>
                          <X size={14} aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link className={`fx-button ${f.destaque ? "fx-button-blue" : "fx-button-ghost"}`} href="/contato">
                      Conversar sobre {f.nome} <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="fx-included-grid">
            <article>
              <Database size={18} aria-hidden="true" />
              <div>
                <h3>O banco: grátis, para sempre</h3>
                <p>MongoDB Atlas M0: 512 MB, sem cartão e sem prazo. E a fábrica roda sem banco nenhum.</p>
              </div>
            </article>
            <article>
              <Zap size={18} aria-hidden="true" />
              <div>
                <h3>Imagem e voz: grátis na sua placa</h3>
                <p>Rodam local. Sem placa, existe o caminho por API — centavos por peça.</p>
              </div>
            </article>
            <article>
              <RefreshCw size={18} aria-hidden="true" />
              <div>
                <h3>Atualizações: grátis por 12 meses</h3>
                <p>O kit cresce; o que entrar nesse período é seu, em qualquer faixa.</p>
              </div>
            </article>
          </div>
          <p className="fx-cost-summary">
            <b>
              Operar custa de US$ {CUSTO_DE_OPERACAO.assinaturaAgenteUSD[0]} a US$ {CUSTO_DE_OPERACAO.assinaturaAgenteUSD[1]} por mês
            </b>{" "}
            — e esse dinheiro não vem para nós. {CUSTO_DE_OPERACAO.observacao}
          </p>
        </div>
      </section>

      {/* ── 7. O que vem dentro, medido ─────────────────────────────────── */}
      <section className="fx-section fx-inventory">
        <div className="fx-wrap">
          <div className="fx-section-head">
            <div>
              <p className="fx-eyebrow">07 · Engenharia que já existe</p>
              <h2>
                Não começa do zero.
                <br />
                <span>Começa daqui.</span>
              </h2>
            </div>
            <p>
              Contado no kit em {new Date(MEDIDO_EM).toLocaleDateString("pt-BR", { timeZone: "UTC" })}. Cada número tem um comando
              que o produz — nenhum é estimativa.
            </p>
          </div>
          <div className="fx-inventory-grid">
            {inventario.map(([n, label]) => (
              <article key={label}>
                <strong>{n.toLocaleString("pt-BR")}</strong>
                <p>{label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Como começa ──────────────────────────────────────────────── */}
      <section className="fx-section fx-start">
        <div className="fx-wrap">
          <p className="fx-eyebrow">08 · Como começa</p>
          <div className="fx-start-grid">
            <div>
              <span>01 — A pasta</span>
              <h3>Você baixa a pasta.</h3>
              <p>Ela cabe num pen drive. Nada é instalado no seu sistema.</p>
            </div>
            <div>
              <span>02 — O comando</span>
              <h3>Roda um comando.</h3>
              <p>O agente confere a máquina, abre a entrevista e começa a construir.</p>
            </div>
            <div>
              <span>03 — A sua identidade</span>
              <h3>Responde {INVENTARIO.perguntas} grupos.</h3>
              <p>Quem você é, o que vende, como fala, o que nunca diz. O resto é com ele.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Fechamento: o estúdio vira o logo ───────────────────────── */}
      <SequenciaDeRolagem
        id="fechamento"
        className="fx-fechamento"
        pasta="/fabrica/final"
        pastaMovel="/fabrica/final-movel"
        quadros={QUADROS}
        telas={3}
        quadroParado={QUADROS - 1}
        // As letras ocupam x 23–75% e y 32–67% do quadro (medido no último quadro). Enquanto
        // os fragmentos convergem, a câmera recua para o logo nunca sair cortado em tela estreita.
        caixaSegura={{ x0: 20, y0: 28, x1: 80, y1: 72, de: 0.55, ate: 0.8 }}
        alt="O estúdio se desfaz em fragmentos que voam para o centro e formam o logo da FayAi."
        batidas={[
          {
            de: 0.04,
            ate: 0.4,
            conteudo: (
              <div className="fx-batida">
                <p className="fx-eyebrow">09 · Tudo isso</p>
                <h2>
                  Cabe numa pasta.
                  <br />
                  <span>E começa com uma conversa.</span>
                </h2>
              </div>
            ),
          },
          {
            de: 0.8,
            ate: 1,
            posicao: "base",
            conteudo: (
              <div className="fx-batida fx-batida-final">
                <h2>A próxima fábrica pode ser a sua.</h2>
                <div className="fx-actions">
                  <Link className="fx-button fx-button-blue" href="/contato">
                    Começar uma conversa <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                  <Link className="fx-text-link" href="/casos">
                    Ver o que já foi feito <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ),
          },
        ]}
      />
    </main>
  );
}

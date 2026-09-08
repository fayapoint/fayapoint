"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getClientAuthHeaders } from "@/lib/client-auth";
import {
  Coins,
  Loader2,
  ShieldCheck,
  Timer,
  TrendingUp,
  UserPlus,
  Scale,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LIMA, OURO, CIANO, VIOLETA, CINZA, FUNDO, bebas, superficie } from "@/lib/game/tema";
import { FaixaDeCena, FundoDeCena } from "./CenaW22";

/**
 * O SAGUÃO DE APOSTAS — a porta da mesa. 08/09/2026.
 *
 * ## As três decisões de tela que valem explicação
 *
 * 1. **Abre sem login.** O cardápio inteiro, com preço, é público. Foi o
 *    pedido explícito ("um lugar para começar mesmo sem ter jogador") e é o
 *    certo: pedir cadastro antes de a pessoa ver o que existe é o jeito mais
 *    rápido de perder quem chegou curioso. O login aparece no momento do
 *    clique em apostar, quando ele já tem motivo.
 *
 * 2. **A probabilidade fica ao lado da odd.** Nenhuma casa de verdade faz
 *    isso — a margem é o segredo do negócio. Aqui a margem é declarada e a
 *    chance é publicada, porque o produto não é tirar dinheiro de ninguém: é
 *    ensinar como o preço se forma. Quem vê "2,12 · 45%" aprende sozinho que
 *    1÷2,12 = 47% e que os 2 pontos de diferença são a casa.
 *
 * 3. **O selo de honestidade é clicável desde o saguão.** O hash do
 *    compromisso está no cartão. É a resposta antecipada à única pergunta que
 *    derruba uma casa que simula os próprios jogos — "como sei que vocês não
 *    escolheram o resultado?" — e ela precisa estar respondida ANTES de a
 *    pessoa apostar, não escondida num rodapé de regulamento.
 */

interface SelecaoResumo {
  chave: string;
  rotulo: string;
  odd: number;
  probabilidade: number;
}

interface EventoResumo {
  slug: string;
  comecaEm: string;
  equilibrio: number;
  compromisso: string;
  totalApostado: number;
  totalCupons: number;
  mandante: { nome: string; sigla: string | null; cor: string | null; nota: number; elencoConhecido: number };
  visitante: { nome: string; sigla: string | null; cor: string | null; nota: number; elencoConhecido: number };
  competicao: { slug: string | null; nome: string | null; rodada: number | null } | null;
  principal: { mercadoId: string; selecoes: SelecaoResumo[] } | null;
}

interface Encerrado {
  slug: string;
  mandante: string;
  visitante: string;
  placar: string | null;
}

interface Carteira {
  saldo: number;
  emJogo: number;
  totalApostado: number;
  totalGanho: number;
  recarregouAgora: number;
  regras: { bonusBoasVindas: number; apostaMinima: number; apostaMaxima: number };
}

interface PernaMinha {
  eventoSlug: string;
  eventoNome: string;
  mercadoTitulo: string;
  selecaoRotulo: string;
  odd: number;
  resultado: string | null;
}

interface ApostaMinha {
  id: string;
  tipo: string;
  valor: number;
  oddTotal: number;
  retornoPotencial: number;
  retorno: number;
  status: string;
  emSiMesmo: boolean;
  criadaEm: string;
  liquidadaEm: string | null;
  pernas: PernaMinha[];
}

export function SaguaoApostas({ locale }: { locale: string }) {
  const [dados, setDados] = useState<{ eventos: EventoResumo[]; encerrados: Encerrado[] } | null | "erro">(null);
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [aba, setAba] = useState<"cardapio" | "minhas">("cardapio");
  const [minhas, setMinhas] = useState<ApostaMinha[] | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/game/apostas");
      if (!r.ok) throw new Error();
      setDados(await r.json());
    } catch {
      setDados("erro");
    }
  }, []);

  useEffect(() => {
    carregar();
    // A carteira falha com 401 para quem não está logado, e isso é normal —
    // o saguão não muda por causa disso. Por isso o catch é mudo.
    fetch("/api/game/carteira", { headers: getClientAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setCarteira(j))
      .catch(() => {});
  }, [carregar]);

  // O cardápio anda: a cada minuto um evento pode ter fechado. Recarregar de
  // 60 em 60 segundos é barato (uma consulta) e evita a pior tela possível,
  // que é apostar num jogo que já começou.
  useEffect(() => {
    const t = setInterval(carregar, 60_000);
    return () => clearInterval(t);
  }, [carregar]);

  // "Minhas apostas" só é buscada quando a aba é aberta — e é rebuscada a cada
  // abertura, porque entre uma visita e outra a liquidação pode ter passado.
  useEffect(() => {
    if (aba !== "minhas") return;
    fetch("/api/game/apostas?modo=minhas", { headers: getClientAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMinhas(j?.apostas ?? []))
      .catch(() => setMinhas([]));
  }, [aba]);

  return (
    <div style={{ background: FUNDO }} className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <Cabecalho carteira={carteira} />

        <div className="mt-8">
          <FaixaDeCena
            cena="fichas"
            alt="Fichas do Winners 22 caindo no escuro, uma delas com a marca FayAi"
            altura="h-48 sm:h-64"
            prioridade
          />
        </div>

        {carteira && <FaixaCarteira carteira={carteira} />}
        {!carteira && <ConvitePraEntrar />}

        <ComoFunciona />

        {carteira && (
          <nav className="mt-12 flex gap-2 border-b border-white/10">
            {(
              [
                ["cardapio", "Cardápio"],
                ["minhas", "Minhas apostas"],
              ] as const
            ).map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setAba(chave)}
                style={{
                  borderColor: aba === chave ? LIMA : "transparent",
                  color: aba === chave ? LIMA : "rgba(255,255,255,.5)",
                }}
                className="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition"
              >
                {rotulo}
              </button>
            ))}
          </nav>
        )}

        {aba === "minhas" && <MinhasApostas apostas={minhas} locale={locale} />}

        <section className={aba === "minhas" ? "hidden" : "mt-12"}>
          <h2 style={bebas} className="text-3xl uppercase tracking-wide">
            Próximas partidas
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Partidas simuladas pelo motor do Winners 22, pareadas para ficarem parelhas.
            As apostas fecham no apito inicial.
          </p>

          {dados === null && (
            <div className="mt-8 flex items-center gap-3 text-white/50">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando o cardápio…
            </div>
          )}

          {dados === "erro" && (
            <p className="mt-8 rounded-xl border border-rose-400/30 bg-rose-400/5 p-4 text-sm text-rose-200">
              Não deu para carregar as partidas agora. Atualize a página em instantes.
            </p>
          )}

          {dados !== null && dados !== "erro" && dados.eventos.length === 0 && (
            <div
              style={superficie(CINZA)}
              className="mt-8 rounded-2xl border p-6 text-sm text-white/60"
            >
              Nenhuma partida aberta neste momento. A mesa monta uma rodada nova a cada
              poucas horas — volte já já.
            </div>
          )}

          {dados !== null && dados !== "erro" && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {dados.eventos.map((e) => (
                <CartaoEvento key={e.slug} evento={e} />
              ))}
            </div>
          )}

          {dados !== null && dados !== "erro" && dados.encerrados.length > 0 && (
            <div className="mt-10">
              <h3 style={bebas} className="text-xl uppercase tracking-wide text-white/70">
                Resultados recentes
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {dados.encerrados.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/game/apostas/${e.slug}`}
                    locale={locale}
                    style={superficie(CINZA)}
                    className="rounded-lg border px-3 py-2 text-xs text-white/70 transition hover:text-white"
                  >
                    {e.mandante} <span style={{ color: LIMA }}>{e.placar}</span> {e.visitante}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <JogoResponsavel />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Cabecalho({ carteira }: { carteira: Carteira | null }) {
  return (
    <header>
      <div
        style={{ borderColor: `${LIMA}44`, background: `${LIMA}12` }}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-widest"
      >
        <Coins className="h-3.5 w-3.5" style={{ color: LIMA }} />
        <span style={{ color: LIMA }}>Fichas · dinheiro de brincadeira</span>
      </div>

      <h1 style={bebas} className="mt-4 text-5xl uppercase leading-none sm:text-6xl">
        A mesa do <span style={{ color: LIMA }}>Winners 22</span>
      </h1>
      <p className="mt-3 max-w-2xl text-base text-white/65">
        Aposte em times, partidas e jogadores com <strong>fichas</strong> — a moeda do
        jogo. Cada partida é simulada por um motor calibrado em partidas reais de Pro
        Clubs, e o resultado é <strong>conferível por qualquer pessoa</strong> antes e
        depois de acontecer.
      </p>

      {!carteira && (
        <p className="mt-3 text-sm text-white/45">
          Pode olhar tudo sem conta. O login só é pedido na hora de apostar.
        </p>
      )}
    </header>
  );
}

function FaixaCarteira({ carteira }: { carteira: Carteira }) {
  return (
    <div
      style={superficie(LIMA, "forte")}
      className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-white/50">Suas fichas</p>
        <p style={bebas} className="text-4xl leading-none" >
          <span style={{ color: LIMA }}>{carteira.saldo.toLocaleString("pt-BR")}</span>
        </p>
        {carteira.emJogo > 0 && (
          <p className="mt-1 text-xs text-white/50">
            {carteira.emJogo} em jogo, aguardando resultado
          </p>
        )}
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">Apostado</p>
          <p className="text-white/80">{carteira.totalApostado.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">Ganho</p>
          <p style={{ color: OURO }}>{carteira.totalGanho.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {carteira.recarregouAgora > 0 && (
        <p
          style={{ borderColor: `${OURO}44`, background: `${OURO}12`, color: OURO }}
          className="rounded-lg border px-3 py-2 text-xs"
        >
          +{carteira.recarregouAgora} fichas de recarga do dia — você tinha quebrado.
        </p>
      )}
    </div>
  );
}

function ConvitePraEntrar() {
  return (
    <div
      style={superficie(CIANO)}
      className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: CIANO }} />
        <div>
          <p className="font-medium">
            Crie a conta e receba <strong style={{ color: LIMA }}>100 fichas</strong> de
            entrada.
          </p>
          <p className="mt-1 text-sm text-white/55">
            Não custa nada, não pede cartão, e a ficha não vira dinheiro — é ponto de jogo.
          </p>
        </div>
      </div>
      <Link
        href="/registro"
        style={{ background: LIMA, color: "#0b1005" }}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:brightness-110"
      >
        Pegar minhas fichas
      </Link>
    </div>
  );
}

function ComoFunciona() {
  const passos = [
    {
      icone: Coins,
      cor: LIMA,
      titulo: "Comece sem ter jogador",
      texto:
        "Não precisa jogar Pro Clubs para entrar. Você aposta nos times e nos jogadores que já estão na base.",
    },
    {
      icone: UserPlus,
      cor: CIANO,
      titulo: "Tem um Pro? Vincule",
      texto:
        "Ligando a sua gamertag, você vê a sua ficha completa — e pode apostar em você mesmo quando entrar em cartaz.",
    },
    {
      icone: ShieldCheck,
      cor: VIOLETA,
      titulo: "Confira o resultado",
      texto:
        "Publicamos o hash da semente ANTES das apostas e a semente depois. Você refaz a partida e confere.",
    },
  ];
  return (
    <>
    <div className="mt-10">
      <FaixaDeCena
        cena="luzGrafico"
        alt="Rastros de luz subindo e caindo, com a marca FayAi projetada na névoa"
        altura="h-40 sm:h-48"
        titulo="O preço não é palpite nosso"
        linha="Cada odd sai de um modelo calibrado em partidas reais de Pro Clubs — e a chance que ele calculou fica ao lado dela, na tela."
      />
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      {passos.map((p) => (
        <div key={p.titulo} style={superficie(p.cor)} className="rounded-2xl border p-5">
          <p.icone className="h-5 w-5" style={{ color: p.cor }} />
          <p style={bebas} className="mt-3 text-lg uppercase tracking-wide">
            {p.titulo}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.texto}</p>
        </div>
      ))}
    </div>
    </>
  );
}

function CartaoEvento({ evento }: { evento: EventoResumo }) {
  const corCasa = evento.mandante.cor ?? LIMA;
  const corFora = evento.visitante.cor ?? CIANO;

  return (
    <Link
      href={`/game/apostas/${evento.slug}`}
      style={superficie(LIMA)}
      className="group block rounded-2xl border p-5 transition hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-white/45">
          <Timer className="h-3.5 w-3.5" />
          <ContagemRegressiva ate={evento.comecaEm} />
        </span>
        {evento.competicao?.nome && (
          <span
            style={{ borderColor: OURO + "44", color: OURO }}
            className="rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
            title={"Prévia simulada de um confronto de " + evento.competicao.nome}
          >
            prévia
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-white/35">
          <Scale className="h-3.5 w-3.5" />
          equilíbrio {Math.round(evento.equilibrio * 100)}%
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <LinhaTime nome={evento.mandante.nome} nota={evento.mandante.nota} cor={corCasa} />
        <LinhaTime nome={evento.visitante.nome} nota={evento.visitante.nota} cor={corFora} />
      </div>

      {evento.principal && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {evento.principal.selecoes.map((s) => (
            <div
              key={s.chave}
              style={{ borderColor: `${LIMA}33`, background: "rgba(255,255,255,.03)" }}
              className="rounded-lg border px-2 py-2 text-center transition group-hover:border-[var(--lima)]"
            >
              <p className="truncate text-[10px] uppercase tracking-wider text-white/40">
                {s.chave === "1" ? "Casa" : s.chave === "X" ? "Empate" : "Fora"}
              </p>
              <p style={bebas} className="text-lg leading-tight" >
                {s.odd.toFixed(2)}
              </p>
              <p className="text-[10px] text-white/35">{Math.round(s.probabilidade * 100)}%</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-white/35">
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {evento.compromisso.slice(0, 12)}…
        </span>
        <span className="inline-flex items-center gap-1 text-white/50 transition group-hover:text-white">
          {evento.totalCupons > 0 ? `${evento.totalCupons} cupons` : "ver todos os mercados"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function LinhaTime({ nome, nota, cor }: { nome: string; nota: number; cor: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: cor }} />
      <span className="min-w-0 flex-1 truncate font-medium">{nome}</span>
      <span
        style={{ borderColor: `${cor}44`, color: cor }}
        className="shrink-0 rounded border px-1.5 py-0.5 text-[10px]"
        title="Nota de força calculada a partir da campanha do clube"
      >
        {nota}
      </span>
    </div>
  );
}

/**
 * Conta o tempo até o apito. Atualiza de 30 em 30 segundos — não de segundo em
 * segundo: um relógio que pisca em vinte cartões ao mesmo tempo é o tipo de
 * detalhe que faz a página parecer pesada sem entregar nada.
 */
function ContagemRegressiva({ ate }: { ate: string }) {
  const [texto, setTexto] = useState("");
  useEffect(() => {
    const calcular = () => {
      const faltam = new Date(ate).getTime() - Date.now();
      if (faltam <= 0) return setTexto("fechando…");
      const min = Math.floor(faltam / 60_000);
      if (min < 60) return setTexto(`em ${min} min`);
      const h = Math.floor(min / 60);
      setTexto(h < 24 ? `em ${h}h${String(min % 60).padStart(2, "0")}` : `em ${Math.floor(h / 24)} dias`);
    };
    calcular();
    const t = setInterval(calcular, 30_000);
    return () => clearInterval(t);
  }, [ate]);
  return <>{texto}</>;
}

/**
 * "Minhas apostas".
 *
 * O estado `parcial` tem cartão próprio e não é dobrado em "ganha": handicap de
 * linha quebrada devolve parte da aposta, e chamar de vitória um cupom que deu
 * prejuízo faria a tela desmentir o extrato. Quando os dois discordam, quem
 * está errado é sempre a tela.
 */
function MinhasApostas({ apostas, locale }: { apostas: ApostaMinha[] | null; locale: string }) {
  if (apostas === null) {
    return (
      <div className="mt-8 flex items-center gap-3 text-white/50">
        <Loader2 className="h-5 w-5 animate-spin" /> Buscando seus cupons…
      </div>
    );
  }
  if (apostas.length === 0) {
    return (
      <div style={superficie(CINZA)} className="mt-8 rounded-2xl border p-6 text-sm text-white/60">
        Você ainda não apostou. Escolha uma partida no cardápio e toque numa odd.
      </div>
    );
  }

  const cor = (s: string) =>
    s === "ganha" ? LIMA : s === "perdida" ? "rgba(255,255,255,.3)" : s === "parcial" ? OURO : CIANO;

  return (
    <div className="mt-8 space-y-3">
      {apostas.map((a) => (
        <div key={a.id} style={superficie(cor(a.status))} className="rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              style={{ borderColor: `${cor(a.status)}55`, color: cor(a.status) }}
              className="rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest"
            >
              {a.status === "pendente" ? "aguardando" : a.status}
            </span>
            {a.emSiMesmo && (
              <span style={{ color: OURO }} className="text-[10px] uppercase tracking-widest">
                você estava em campo
              </span>
            )}
            <span className="ml-auto text-xs text-white/40">
              {new Date(a.criadaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            {a.pernas.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <Link
                  href={`/game/apostas/${p.eventoSlug}`}
                  locale={locale}
                  className="text-white/45 transition hover:text-white"
                >
                  {p.eventoNome}
                </Link>
                <span className="text-white/30">·</span>
                <span>{p.selecaoRotulo}</span>
                <span className="text-xs text-white/35">({p.mercadoTitulo})</span>
                <span style={{ ...bebas, color: p.resultado ? cor(p.resultado === "ganha" ? "ganha" : "perdida") : LIMA }}>
                  {p.odd.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/10 pt-3 text-sm">
            <span className="text-white/50">
              Aposta <strong className="text-white/80">{a.valor}</strong>
            </span>
            <span className="text-white/50">
              Odd <strong className="text-white/80">{a.oddTotal.toFixed(2)}</strong>
            </span>
            <span className="ml-auto">
              {a.status === "pendente" ? (
                <span className="text-white/50">
                  pode voltar <strong style={{ color: OURO }}>{a.retornoPotencial}</strong>
                </span>
              ) : (
                <span className="text-white/50">
                  voltou{" "}
                  <strong style={{ color: a.retorno > a.valor ? OURO : "rgba(255,255,255,.5)" }}>
                    {a.retorno}
                  </strong>
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JogoResponsavel() {
  return (
    <section
      style={superficie(CINZA)}
      className="relative mt-14 overflow-hidden rounded-2xl border p-6 text-sm leading-relaxed text-white/55"
    >
      <FundoDeCena cena="corredor" opacidade={0.16} />
      <div className="relative">
      <p style={bebas} className="text-lg uppercase tracking-wide text-white/80">
        As regras do dinheiro aqui
      </p>
      <ul className="mt-3 space-y-2">
        <li className="flex gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LIMA }} />
          <span>
            <strong className="text-white/80">A ficha não é dinheiro.</strong> Ela não se
            compra, não se converte em crédito do site e não se saca. É pontuação de jogo,
            e vale só dentro do Winners 22.
          </span>
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VIOLETA }} />
          <span>
            <strong className="text-white/80">Quebrou, recarrega.</strong> Quem fica abaixo
            de 10 fichas recebe 50 no dia seguinte. Ninguém fica de fora por ter errado.
          </span>
        </li>
        <li className="flex gap-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CIANO }} />
          <span>
            <strong className="text-white/80">Você pode se limitar.</strong> Dá para
            definir um teto diário de fichas e pausar a conta. Mesmo sendo brincadeira, o
            hábito que se treina aqui é o que se leva para fora.
          </span>
        </li>
      </ul>
      <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/35">
        O Winners 22 não é afiliado, patrocinado nem endossado pela Electronic Arts Inc.
        EA SPORTS FC é marca da EA. Aqui não há aposta com dinheiro real: apostas de
        valor no Brasil dependem de autorização da SPA/Ministério da Fazenda
        (Lei 14.790/2023), que não temos e não pedimos.
      </p>
      </div>
    </section>
  );
}

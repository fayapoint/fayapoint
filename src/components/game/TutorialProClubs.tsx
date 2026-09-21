import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Lightbulb, TriangleAlert, FlaskConical, Search } from "lucide-react";
import { LIMA, OURO, CIANO, VIOLETA, ROSA, LARANJA, bebas, superficie } from "@/lib/game/tema";
import { ARQUETIPOS, FORMACOES, EXEMPLO_JOGADOR, PORTAS, type Tutorial, type Bloco, type Visual } from "@/lib/game/tutorial";
import { avaliarJogador } from "@/lib/game/valor-mercado";
import type { DivisaoEA } from "@/lib/game/ea-api";

/**
 * O TUTORIAL do Pro Clubs no FC 27. Componente de servidor: nada aqui precisa
 * de estado, e o texto inteiro chega no HTML (é conteúdo para busca, não app).
 *
 * Os visuais são desenhados em código porque têm de ser exatos — ver o
 * cabeçalho de `lib/game/tutorial.ts`.
 */

const COR_SETOR: Record<string, string> = { GOL: OURO, DEF: CIANO, MEI: LIMA, ATA: ROSA };

export function TutorialProClubs({ t, divisoes, en }: { t: Tutorial; divisoes: DivisaoEA[]; en: boolean }) {
  const grupos = [...new Set(t.secoes.map((s) => s.grupo))];
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/game" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white">
        <ArrowLeft size={14} /> {t.voltar}
      </Link>

      <header className="relative mt-4 overflow-hidden rounded-3xl border" style={superficie(LIMA, "forte")}>
        <Image src="/game/tutorial/grounds.webp" alt="" fill priority sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover opacity-35" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16" style={{ background: "linear-gradient(90deg, rgba(12,14,29,.92) 30%, rgba(12,14,29,.35))" }}>
          <p className="inline-block rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${LIMA}14`, color: LIMA, border: `1px solid ${LIMA}33` }}>{t.selo}</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-none sm:text-6xl" style={bebas}>{t.titulo.toUpperCase()}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">{t.subtitulo}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[230px_1fr]">
        <nav aria-label={t.indice} className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/45">{t.indice}</p>
          <ol className="space-y-4 text-sm">
            {grupos.map((g) => (
              <li key={g}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: LIMA }}>{g}</p>
                <ol className="space-y-1 border-l border-white/10 pl-3">
                  {t.secoes.filter((s) => s.grupo === g).map((s) => (
                    <li key={s.id}><a href={`#${s.id}`} className="block py-0.5 text-white/60 transition-colors hover:text-white">{s.titulo}</a></li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-16">
          {t.secoes.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: LIMA }}>{String(i + 1).padStart(2, "0")} · {s.grupo}</p>
              <h2 className="mt-1 text-3xl leading-none sm:text-4xl" style={bebas}>{s.titulo.toUpperCase()}</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/75">{s.resumo}</p>
              {s.img && (
                <div className="relative mt-5 aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10 sm:aspect-[16/7]">
                  <Image src={`/game/tutorial/${s.img}.webp`} alt={s.alt ?? ""} fill sizes="(max-width: 1024px) 100vw, 860px" className="object-cover" loading={i < 2 ? "eager" : "lazy"} />
                </div>
              )}
              <div className="mt-6 space-y-5">
                {s.blocos.map((b, j) => <BlocoTutorial key={j} b={b} t={t} divisoes={divisoes} en={en} />)}
              </div>
            </section>
          ))}
          <p className="border-t border-white/[0.08] pt-6 text-[12px] leading-relaxed text-white/45">{t.fontes} {t.atualizado}.</p>
        </div>
      </div>
    </div>
  );
}

function BlocoTutorial({ b, t, divisoes, en }: { b: Bloco; t: Tutorial; divisoes: DivisaoEA[]; en: boolean }) {
  switch (b.t) {
    case "p":
      return <p className="max-w-3xl text-[15px] leading-relaxed text-white/70">{comCodigo(b.texto)}</p>;
    case "lista":
    case "passos": {
      const Tag = b.t === "passos" ? "ol" : "ul";
      return (
        <div className="max-w-3xl">
          {b.titulo && <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/80">{b.titulo}</h3>}
          <Tag className="space-y-2">
            {b.itens.map((it, k) => (
              <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: `${LIMA}1f`, color: LIMA }}>
                  {b.t === "passos" ? k + 1 : "•"}
                </span>
                <span>{comCodigo(it)}</span>
              </li>
            ))}
          </Tag>
        </div>
      );
    }
    case "dica":
    case "alerta": {
      const cor = b.t === "dica" ? CIANO : LARANJA;
      const Icone = b.t === "dica" ? Lightbulb : TriangleAlert;
      return (
        <aside className="flex max-w-3xl gap-3 rounded-xl border px-4 py-3" style={{ borderColor: `${cor}40`, background: `${cor}0d` }}>
          <Icone size={18} className="mt-0.5 shrink-0" style={{ color: cor }} aria-hidden />
          <p className="text-[14px] leading-relaxed text-white/80"><strong style={{ color: cor }}>{b.t === "dica" ? t.rotulos.dica : t.rotulos.alerta}: </strong>{comCodigo(b.texto)}</p>
        </aside>
      );
    }
    case "exemplo":
      return (
        <div className="max-w-3xl rounded-xl border px-5 py-4" style={superficie(VIOLETA)}>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: VIOLETA }}><FlaskConical size={13} aria-hidden /> {t.rotulos.exemplo}</p>
          <p className="mt-1 font-semibold text-white">{b.titulo}</p>
          <ul className="mt-2 space-y-1.5">
            {b.linhas.map((l, k) => <li key={k} className="border-l-2 pl-3 text-[14px] leading-relaxed text-white/70" style={{ borderColor: `${VIOLETA}55` }}>{comCodigo(l)}</li>)}
          </ul>
        </div>
      );
    case "tabela":
      return (
        <div className="max-w-3xl overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-[14px]">
            <thead><tr className="bg-white/[0.04]">{b.cab.map((c) => <th key={c} scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/55">{c}</th>)}</tr></thead>
            <tbody>
              {b.linhas.map((l, k) => (
                <tr key={k} className="border-t border-white/[0.06]">
                  {l.map((c, m) => <td key={m} className={`px-4 py-2.5 align-top ${m === 0 ? "font-semibold text-white" : "text-white/70"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "visual":
      return <VisualTutorial v={b.v} t={t} divisoes={divisoes} en={en} />;
  }
}

/** `trecho` entre crases vira código — é como o texto cita os nomes crus da EA. */
function comCodigo(texto: string) {
  return texto.split(/(`[^`]+`)/g).map((p, i) =>
    p.startsWith("`") ? <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em] text-white">{p.slice(1, -1)}</code> : p
  );
}

function VisualTutorial({ v, t, divisoes, en }: { v: Visual; t: Tutorial; divisoes: DivisaoEA[]; en: boolean }) {
  const r = t.rotulos;
  switch (v) {
    case "arquetipos":
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ARQUETIPOS.map((a) => {
            const cor = COR_SETOR[a.setor];
            return (
              <div key={a.nome} className="rounded-xl border px-4 py-3" style={superficie(cor)}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xl leading-none" style={{ ...bebas, color: cor }}>{a.nome.toUpperCase()}</p>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${cor}1f`, color: cor }}>{a.setor}</span>
                </div>
                <p className="mt-1 text-[12px] text-white/55">{r.posicao}: <span className="text-white/85">{a.posicoes}</span></p>
                <p className="mt-2 text-[11px] uppercase tracking-wider text-white/40">{r.maestria}</p>
                <p className="text-[13px] text-white/85">+1 {a.maestria[0]} · +1 {a.maestria[1]}</p>
              </div>
            );
          })}
        </div>
      );
    case "posicoes":
      return (
        <div className="max-w-3xl overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-[14px]">
            <thead><tr className="bg-white/[0.04]">{[en ? "Position" : "Posição", en ? "Best" : "Melhor", en ? "Alternatives" : "Alternativas"].map((c) => <th key={c} scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/55">{c}</th>)}</tr></thead>
            <tbody>
              {[["ATA", "Finisher", "Target, Magician"], ["PON", "Spark", "Magician"], ["MEI", "Creator", "Maestro, Magician"], ["MC", "Maestro", "Recycler, Creator"], ["VOL", "Recycler", "Disruptor"], ["ZAG", "Boss", "Progressor"], ["LAT", "Marauder", "Progressor, Recycler"], ["GOL", "Shot Stopper", "Sweeper Keeper"]].map((l) => (
                <tr key={l[0]} className="border-t border-white/[0.06]"><td className="px-4 py-2 font-bold" style={{ color: LIMA }}>{l[0]}</td><td className="px-4 py-2 font-semibold text-white">{l[1]}</td><td className="px-4 py-2 text-white/65">{l[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "divisoes":
      if (divisoes.length === 0) return null;
      return (
        <div className="max-w-3xl space-y-1.5">
          {divisoes.map((d) => {
            const topo = d.divisionId === 1;
            const cor = topo ? OURO : LIMA;
            return (
              <div key={d.divisionId} className="grid grid-cols-[88px_1fr] items-center gap-3 rounded-lg border px-3 py-2 sm:grid-cols-[110px_1fr_1fr_1fr]" style={superficie(cor)}>
                <p className="text-lg leading-none" style={{ ...bebas, color: cor }}>{r.divisao} {d.divisionId}{d.divisionId === 10 ? ` · ${r.entrada}` : ""}</p>
                <p className="text-[13px] text-white/75">{r.sobe} <b className="text-white">{d.pointsForPromotion}</b></p>
                <p className="text-[13px] text-white/75">{r.fica} <b className="text-white">{d.pointsToHoldDivision < 0 ? "—" : d.pointsToHoldDivision}</b></p>
                <p className="text-[13px] text-white/75">{r.titulo} <b className="text-white">{d.pointsToTitle}</b></p>
              </div>
            );
          })}
        </div>
      );
    case "formacoes":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {FORMACOES.map((f) => (
            <figure key={f.nome} className="rounded-xl border p-3" style={superficie(LIMA)}>
              <svg viewBox="0 0 100 140" className="mx-auto block h-auto w-full max-w-[260px]" role="img" aria-label={`${f.nome}: ${f.pontos.map((p) => p[2]).join(", ")}`}>
                <rect x="2" y="2" width="96" height="136" rx="3" fill="#123d1c" stroke="#ffffff40" strokeWidth="0.6" />
                <line x1="2" y1="70" x2="98" y2="70" stroke="#ffffff40" strokeWidth="0.5" />
                <circle cx="50" cy="70" r="10" fill="none" stroke="#ffffff40" strokeWidth="0.5" />
                <rect x="30" y="2" width="40" height="16" fill="none" stroke="#ffffff40" strokeWidth="0.5" />
                <rect x="30" y="122" width="40" height="16" fill="none" stroke="#ffffff40" strokeWidth="0.5" />
                {f.pontos.map(([x, y, pos], k) => {
                  const cy = 136 - y * 1.28;
                  const cor = pos === "GOL" ? OURO : ["ZAG", "LAT", "ALA"].includes(pos) ? CIANO : pos === "ATA" || pos === "PON" ? ROSA : LIMA;
                  return (
                    <g key={k}>
                      <circle cx={x} cy={cy} r="4.6" fill={cor} />
                      <text x={x} y={cy + 1.3} textAnchor="middle" fontSize="3.3" fontWeight="700" fill="#0c0e1d">{pos}</text>
                    </g>
                  );
                })}
              </svg>
              <figcaption className="mt-2 text-center">
                <span className="block text-lg leading-none" style={{ ...bebas, color: LIMA }}>{f.nome}</span>
                <span className="text-[12px] text-white/60">{en ? f.uso_en : f.uso}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      );
    case "amps":
      return (
        <div className="flex max-w-3xl flex-wrap gap-3">
          {[[r.padrao, "1–2", LIMA], [r.padrao, "1–2", LIMA], [r.assinatura, "3–4", OURO]].map(([nome, nivel, cor], k) => (
            <div key={k} className="flex h-40 w-28 flex-col items-center justify-center rounded-xl border-2 text-center" style={{ borderColor: `${cor}88`, background: `${cor}12`, boxShadow: `0 0 24px -8px ${cor}` }}>
              <span className="text-[10px] uppercase tracking-widest text-white/50">{r.slot} {k + 1}</span>
              <span className="mt-1 text-2xl leading-none" style={{ ...bebas, color: cor as string }}>{String(nome).toUpperCase()}</span>
              <span className="mt-1 text-[12px] text-white/70">{en ? "tier" : "nível"} {nivel}</span>
            </div>
          ))}
        </div>
      );
    case "mapa":
      return (
        <svg viewBox="0 0 640 300" className="h-auto w-full max-w-3xl rounded-xl border border-white/10" role="img" aria-label={en ? "Map of The Grounds: the Terrace hub in the centre links the Clubhouse, Montclair, Zeiza, Parkside, the 11v11 Stadium and the Rush Stadium" : "Mapa do The Grounds: a Terrace no centro liga o Clubhouse, Montclair, Zeiza, Parkside, o Estádio 11v11 e o Estádio Rush"}>
          <rect width="640" height="300" fill="#10142b" />
          {[[320, 60, "CLUBHOUSE", en ? "your club's HQ" : "sede do seu clube", LIMA], [110, 150, "MONTCLAIR", en ? "French urban cages" : "gaiolas urbanas (França)", CIANO], [530, 150, "ZEIZA", en ? "Argentine potrero" : "potrero (Argentina)", VIOLETA], [320, 250, "PARKSIDE", en ? "UK grassroots" : "várzea inglesa", LARANJA], [120, 255, en ? "11v11 STADIUM" : "ESTÁDIO 11v11", "Drop-In", OURO], [520, 255, "RUSH STADIUM", en ? "Rush & tournaments" : "Rush e torneios", ROSA]].map(([x, y, nome, sub, cor]) => (
            <g key={String(nome)}>
              <line x1="320" y1="150" x2={x as number} y2={y as number} stroke="#ffffff22" strokeWidth="2" strokeDasharray="6 5" />
              <circle cx={x as number} cy={y as number} r="30" fill={`${cor}22`} stroke={cor as string} strokeWidth="2" />
              <text x={x as number} y={(y as number) + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-bebas), sans-serif", letterSpacing: "0.04em" }}>{nome}</text>
              <text x={x as number} y={(y as number) + 46} textAnchor="middle" fontSize="11" fill="#ffffff99">{sub}</text>
            </g>
          ))}
          <circle cx="320" cy="150" r="42" fill={`${LIMA}33`} stroke={LIMA} strokeWidth="3" />
          <text x="320" y="148" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-bebas), sans-serif", letterSpacing: "0.04em" }}>THE TERRACE</text>
          <text x="320" y="165" textAnchor="middle" fontSize="11" fill="#ffffffaa">{en ? "hub · up to 100 players" : "centro · até 100 jogadores"}</text>
        </svg>
      );
    case "valor": {
      const a = avaliarJogador(EXEMPLO_JOGADOR);
      const e = EXEMPLO_JOGADOR;
      return (
        <div className="max-w-3xl rounded-xl border px-5 py-4" style={superficie(OURO)}>
          <p className="text-[12px] text-white/60">
            {en ? "Example striker" : "ATA de exemplo"}: {e.jogos} {en ? "games" : "jogos"} · {e.gols} {en ? "goals" : "gols"} · {e.assistencias} {en ? "assists" : "assistências"} · {en ? "rating" : "nota"} {e.nota.toFixed(1)} · {e.melhorEmCampo}× MOTM · OVR {e.overall} · {r.divisao} {e.divisaoClube}
          </p>
          <ul className="mt-3 space-y-1">
            {a.parcelas.map((p) => (
              <li key={p.rotulo} className="flex items-center gap-3 text-[13px]">
                <span className="w-56 shrink-0 text-white/70">{p.rotulo}</span>
                <span className="h-2 rounded-full" style={{ width: `${Math.max(2, (p.fichas / a.valor) * 100)}%`, background: OURO }} />
                <span className="tabular-nums text-white/85">{p.fichas}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-2xl leading-none" style={{ ...bebas, color: OURO }}>{a.valor} {r.fichas.toUpperCase()}</p>
          <p className="text-[12px] text-white/60">{r.faixa}: {a.minimo}–{a.maximo} · {r.confianca}: {a.confianca} · {en ? "includes the division weight" : "já com o peso da divisão"}</p>
        </div>
      );
    }
    case "negociacao": {
      const passos = en
        ? [["Offer", "Chips go into escrow", CIANO], ["Consent", "Player (and origin club, if compensated) accepts", LIMA], ["Payout", "Seller gets value − 10%", OURO], ["Board", "Deal becomes public", VIOLETA]]
        : [["Proposta", "Fichas vão para a custódia", CIANO], ["Consentimento", "Jogador (e clube de origem, se compensado) aceita", LIMA], ["Pagamento", "Quem vende recebe o valor − 10%", OURO], ["Quadro", "A transferência fica pública", VIOLETA]];
      return (
        <ol className="grid max-w-3xl gap-2 sm:grid-cols-4">
          {passos.map(([nome, desc, cor], k) => (
            <li key={nome} className="rounded-xl border px-3 py-3" style={superficie(cor)}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">{r.passo} {k + 1}</span>
              <p className="text-lg leading-none" style={{ ...bebas, color: cor }}>{nome.toUpperCase()}</p>
              <p className="mt-1 text-[12px] leading-snug text-white/70">{desc}</p>
            </li>
          ))}
          <li className="rounded-xl border px-3 py-2 text-[12px] text-white/60 sm:col-span-4" style={{ borderColor: `${ROSA}40` }}>
            {en ? "Declined, cancelled or 7 days without an answer → escrow returns in full to the buyer." : "Recusou, cancelou ou 7 dias sem resposta → a custódia volta inteira para quem ofereceu."}
          </li>
        </ol>
      );
    }
    case "portas":
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {PORTAS.map((p, k) => (
              <Link
                key={p.titulo[0]}
                href={p.href}
                className={`group relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-2xl border transition-transform duration-300 hover:-translate-y-1 ${k === 0 ? "sm:col-span-2 sm:min-h-[18rem]" : ""}`}
                style={{ borderColor: `${p.cor}55`, boxShadow: `0 18px 40px -22px ${p.cor}` }}
              >
                <Image src={`/game/w22/${p.img}.webp`} alt="" fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,14,29,.05) 0%, rgba(12,14,29,.55) 45%, rgba(12,14,29,.96) 100%)" }} />
                <span className="relative block px-5 pb-5">
                  <span className="block text-3xl leading-none" style={{ ...bebas, color: p.cor }}>{(en ? p.titulo[1] : p.titulo[0]).toUpperCase()}</span>
                  <span className="mt-2 block max-w-xl text-[14px] leading-relaxed text-white/80">{en ? p.texto[1] : p.texto[0]}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: p.cor, color: "#0c0e1d" }}>
                    {en ? p.cta[1] : p.cta[0]} <ArrowRight size={13} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/game"
            className="flex flex-col items-start gap-3 rounded-2xl border px-6 py-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: `${LIMA}66`, background: `linear-gradient(90deg, ${LIMA}22, ${CIANO}14)` }}
          >
            <span>
              <span className="block text-3xl leading-none" style={bebas}>{en ? "START WITH YOUR CLUB" : "COMECE PELO SEU CLUBE"}</span>
              <span className="mt-1 block text-sm text-white/75">{en ? "Type your club's name — FC 27, PS5, Xbox Series, PC or Switch 2. Free, no password." : "Digite o nome do seu clube — FC 27, PS5, Xbox Series, PC ou Switch 2. De graça, sem senha."}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold" style={{ background: LIMA, color: "#0c0e1d" }}>
              <Search size={16} aria-hidden /> {en ? "Search my club" : "Procurar meu clube"}
            </span>
          </Link>
        </div>
      );
    case "glossario":
      return (
        <dl className="grid max-w-3xl gap-2 sm:grid-cols-2">
          {t.glossario.map(([termo, def]) => (
            <div key={termo} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <dt className="text-[13px] font-bold" style={{ color: LIMA }}>{termo}</dt>
              <dd className="text-[13px] leading-snug text-white/70">{def}</dd>
            </div>
          ))}
        </dl>
      );
  }
}

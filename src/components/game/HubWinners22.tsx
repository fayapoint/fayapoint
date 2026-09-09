"use client";

import { Link, useRouter } from "@/i18n/navigation";
import {
  Coins,
  Trophy,
  Users,
  ArrowRightLeft,
  ShieldCheck,
  UserSearch,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { LIMA, OURO, CIANO, VIOLETA, ROSA, bebas } from "@/lib/game/tema";
import { SalaDoChat } from "./SalaDoChat";
import { FaixaDeCena } from "./CenaW22";

/**
 * O HUB DO WINNERS 22 — a porta para tudo que a seção tem. 08/09/2026.
 *
 * ## Por que ele existe (e por que não existia)
 *
 * A seção ganhou seis destinos em um dia — mesa de apostas, cobertura da Super
 * Copa, ficha de jogador, gestão de clube, federação — e a landing continuou
 * apontando para dois. **Tudo o mais ficou órfão**: no ar, funcionando, e
 * inalcançável por quem não soubesse a URL de cor.
 *
 * O Ricardo abriu a página e disse exatamente isso: "não vejo nada do que
 * fizemos". Não era um problema de descoberta sutil; era não haver link.
 *
 * A lição que fica no código: **rota nova sem entrada é rota que não existe.**
 * Quem criar o sétimo destino acrescenta o cartão aqui no mesmo commit.
 *
 * ## O desenho
 *
 * Cartões, não menu. Um menu diz o NOME do lugar; o cartão diz o que a pessoa
 * vai FAZER lá. Numa seção em que "mercado" é transferência e "mesa" é aposta,
 * o nome sozinho não basta — e um visitante novo não tem o vocabulário ainda.
 *
 * Cada cartão carrega uma cor de categoria da identidade (§2). O ouro fica só
 * onde há recompensa — a copa e o campeonato —, nunca como decoração.
 */

interface Destino {
  href: string;
  titulo: string;
  linha: string;
  icone: LucideIcon;
  cor: string;
  /** Selo curto no canto: "novo", "ao vivo". Só quando for verdade. */
  selo?: string;
}

const DESTINOS: Destino[] = [
  {
    href: "/game/apostas",
    titulo: "A mesa",
    linha: "Aposte com fichas em times, partidas e jogadores. 100 de bônus para entrar.",
    icone: Coins,
    cor: LIMA,
    selo: "novo",
  },
  {
    href: "/game/copa/super-copa-dos-streamers",
    titulo: "Super Copa dos Streamers",
    linha: "A copa do Coringa, Kosky e Dona — com placar conferido na fonte da EA.",
    icone: Trophy,
    cor: OURO,
    selo: "ao vivo",
  },
  {
    href: "/game/campeonatos",
    titulo: "Campeonatos",
    linha: "Monte o seu: pontos corridos, mata-mata ou grupos. Tabela e chaveamento prontos.",
    icone: Users,
    cor: CIANO,
  },
  {
    href: "/game/mercado",
    titulo: "Mercado da bola",
    linha: "Clube procurando jogador, jogador procurando clube. Com cartaz gerado.",
    icone: ArrowRightLeft,
    cor: VIOLETA,
  },
  {
    href: "/game/federacao",
    titulo: "Federação",
    linha: "Aprovação de clubes, integridade das partidas e apuração com direito de defesa.",
    icone: ShieldCheck,
    cor: ROSA,
    selo: "novo",
  },
];

export function HubWinners22({ locale }: { locale: string }) {
  return (
    <section className="relative mx-auto mt-16 max-w-5xl px-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 style={bebas} className="text-3xl uppercase tracking-wide sm:text-4xl">
            Por onde começar
          </h2>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Cinco portas, e nenhuma delas exige que você jogue Pro Clubs para entrar.
          </p>
        </div>
        <BuscaDeJogador locale={locale} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINOS.map((d) => (
          <Cartao key={d.href} d={d} locale={locale} />
        ))}

        {/* A sexta célula da grade não é um destino — é a arte que fecha a
            fileira. Deixar um buraco com cinco cartões numa grade de três
            colunas é o tipo de vazio que parece defeito. */}
        <div className="hidden lg:block">
          <FaixaDeCena
            cena="trofeu"
            alt="Troféu do Winners 22 com a marca FayAi gravada na base"
            altura="h-full min-h-[13rem]"
            titulo="A taça"
            linha="Quem está ganhando a Super Copa."
            href="/game/copa/super-copa-dos-streamers"
            locale={locale}
          />
        </div>
      </div>

      {/* A faixa larga que amarra o hub à identidade da seção. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FaixaDeCena
          cena="campo"
          alt="Campo iluminado à noite, visto de cima, com a marca FayAi cortada na grama"
          altura="h-40 sm:h-48"
          titulo="Onde tudo acontece"
          linha="Dado real de Pro Clubs, lido da fonte que a própria EA publica."
          href="/game/campeonatos"
          locale={locale}
        />
        <FaixaDeCena
          cena="controle"
          alt="Controle no escuro, com a marca FayAi em relevo"
          altura="h-40 sm:h-48"
          titulo="Você não precisa jogar"
          linha="Dá para entrar, apostar e acompanhar sem nunca ter tocado num Pro Clubs."
          href="/game/apostas"
          locale={locale}
        />
      </div>

      {/* A SALA fecha o hub de propósito.
          Ela é a única coisa aqui que não é leitura: as outras portas mostram
          dado, a sala deixa a pessoa falar. Pôr no fim é a ordem certa — quem
          chegou agora lê primeiro, e encontra gente quando já sabe onde está. */}
      <div className="mt-10">
        <SalaDoChat locale={locale} />
      </div>
    </section>
  );
}

function Cartao({ d, locale }: { d: Destino; locale: string }) {
  const Icone = d.icone;
  return (
    <Link
      href={d.href}
      locale={locale}
      style={{
        borderColor: `${d.cor}33`,
        background: "rgba(22,26,54,.45)",
        boxShadow: `0 10px 30px -18px ${d.cor}88`,
      }}
      className="group relative flex flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-1"
    >
      {/* O brilho que acende no hover. `pointer-events-none` para não roubar
          o clique do próprio cartão. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 100% at 50% 0%, ${d.cor}18 0%, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <Icone className="h-6 w-6" style={{ color: d.cor }} />
        {d.selo && (
          <span
            style={{ borderColor: `${d.cor}55`, color: d.cor }}
            className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest"
          >
            {d.selo}
          </span>
        )}
      </div>

      <p style={bebas} className="relative mt-3 text-xl uppercase tracking-wide">
        {d.titulo}
      </p>
      <p className="relative mt-1 flex-1 text-sm leading-relaxed text-white/55">{d.linha}</p>

      <span
        className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium transition group-hover:gap-2"
        style={{ color: d.cor }}
      >
        entrar
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

/**
 * A busca de jogador, que é a sexta porta e não cabia como cartão.
 *
 * Ela precisa de uma gamertag digitada, então virar cartão seria mandar a
 * pessoa para uma página vazia. Aqui ela leva direto à ficha — e a ficha
 * funciona mesmo para quem nunca reivindicou nada, o que é justamente o
 * caminho do visitante que só quer se ver na base.
 */
function BuscaDeJogador({ locale }: { locale: string }) {
  // O roteador do i18n, e nao `window.location`: ele ja prefixa o idioma, e
  // navega sem recarregar a pagina inteira. Escrever `/${locale}/...` a mao num
  // arquivo que usa o Link do i18n e o caminho curto para o `/pt-BR/pt-BR/` —
  // o portao de pre-commit barra isso, e com razao.
  const router = useRouter();
  return (
    <form
      action={(dados: FormData) => {
        const tag = String(dados.get("tag") ?? "").trim();
        if (!tag) return;
        router.push(`/game/jogador/${encodeURIComponent(tag)}`, { locale });
      }}
      className="flex items-center gap-2"
    >
      <div
        style={{ borderColor: `${LIMA}33` }}
        className="flex items-center gap-2 rounded-xl border bg-black/30 px-3 py-2"
      >
        <UserSearch className="h-4 w-4 shrink-0" style={{ color: LIMA }} />
        <input
          name="tag"
          placeholder="sua gamertag"
          aria-label="Procurar jogador pela gamertag"
          className="w-36 bg-transparent text-sm outline-none placeholder:text-white/30 sm:w-44"
        />
      </div>
      <button
        type="submit"
        style={{ background: LIMA, color: "#0b1005" }}
        className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:brightness-110"
      >
        Ver ficha
      </button>
    </form>
  );
}

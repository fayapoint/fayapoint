import type { Metadata } from "next";
import { PaginaDaCopa } from "@/components/game/PaginaDaCopa";
import { LinhaDoTempoDaCopa } from "@/components/game/LinhaDoTempoDaCopa";
import dbConnect from "@/lib/mongodb";
import GameCopa from "@/models/GameCopa";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Lê a copa uma vez, no servidor, para o título, a descrição e os dados
 * estruturados. `generateMetadata` e o componente rodam na mesma requisição, e
 * o Next deduplica a chamada — não são duas idas ao banco.
 */
async function copaDe(slug: string) {
  await dbConnect();
  return (await GameCopa.findOne({ slug })
    .select("nome edicao jogo descricao faseAtual times linhaDoTempo organizacao comecouEm")
    .lean()) as unknown as {
    nome: string;
    edicao?: string;
    jogo?: string;
    descricao?: string;
    faseAtual?: string;
    comecouEm?: Date;
    times?: Array<{ nome: string; presidente?: string; situacao?: string }>;
    linhaDoTempo?: Array<{ em: Date; titulo: string; texto: string }>;
    organizacao?: { nome?: string };
  } | null;
}

/**
 * O TÍTULO É ESCRITO PARA QUEM PROCURA, não para nós.
 *
 * Quem digita "super copa dos streamers" quer tabela, quem jogou, quem
 * classificou e quando é o próximo. O título e a descrição dizem isso, com a
 * FASE dentro — porque uma página que anuncia a fase certa ganha o clique de
 * quem quer saber justamente se já acabou.
 *
 * ⛔ Nada de nome de origem aqui. A versão anterior vendia "dados da EA" no
 * título, que além de entregar método atrai a busca errada.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const pt = locale !== "en";
  const copa = await copaDe(slug);

  if (!copa) {
    return { title: pt ? "Copa — Winners 22" : "Cup — Winners 22", robots: { index: false, follow: true } };
  }

  const fase = copa.faseAtual ? ` — ${copa.faseAtual}` : "";
  const classificados = (copa.times ?? []).filter((t) => t.situacao === "classificado").map((t) => t.nome);

  const titulo = pt
    ? `${copa.nome} ${copa.edicao ?? ""}: tabela, jogos e classificados${fase}`.replace(/\s+/g, " ").trim()
    : `${copa.nome}: tables, fixtures and qualified teams`;

  const descricao = pt
    ? `Tudo sobre a ${copa.nome}${copa.edicao ? ` — ${copa.edicao}` : ""}: tabela dos grupos, chaveamento do mata-mata, artilharia, súmula por jogador e a história completa da competição, dia a dia.${
        classificados.length ? ` Classificados: ${classificados.join(", ")}.` : ""
      }`.slice(0, 300)
    : `The Brazilian streamer Pro Clubs cup: group tables, knockout bracket, top scorers and the full day-by-day story of the competition.`;

  return {
    title: `${titulo} | Winners 22`,
    description: descricao,
    // Conteúdo original e verificável — ao contrário do saguão de apostas, que
    // muda a cada rodada e não deve ranquear.
    robots: { index: true, follow: true },
    openGraph: { title: titulo, description: descricao, type: "article" },
    alternates: { canonical: `/${locale}/game/copa/${slug}` },
  };
}

export const dynamic = "force-dynamic";

export default async function CopaPage({ params }: Props) {
  const { locale, slug } = await params;
  const copa = await copaDe(slug);

  /**
   * DADOS ESTRUTURADOS — o que faz o buscador entender que isto é um evento
   * esportivo com times, e não um texto qualquer sobre futebol.
   *
   * Só descreve o que está no banco. Nada de campo preenchido "porque o
   * schema.org aceita": propriedade inventada em JSON-LD é a mesma mentira dos
   * outros lugares, só que legível por máquina.
   */
  const jsonLd = copa
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${copa.nome}${copa.edicao ? ` — ${copa.edicao}` : ""}`,
        description: copa.descricao ?? undefined,
        sport: "Esports · EA Sports FC Pro Clubs",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        startDate: copa.comecouEm ? new Date(copa.comecouEm).toISOString() : undefined,
        organizer: copa.organizacao?.nome ? { "@type": "Organization", name: copa.organizacao.nome } : undefined,
        competitor: (copa.times ?? []).map((t) => ({ "@type": "SportsTeam", name: t.nome })),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // O conteúdo vem do nosso banco, não de entrada de usuário; ainda
          // assim `</script>` é escapado, porque um nome de time com HTML
          // dentro fecharia a tag e quebraria a página inteira.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <PaginaDaCopa slug={slug} locale={locale} />
      {/* Servidor, e por isso sai no HTML: é o texto que a página tem para
          oferecer a quem procura. Ver o cabeçalho do componente. */}
      <div className="bg-[#090e11] pb-16">
        <LinhaDoTempoDaCopa slug={slug} />
      </div>
    </>
  );
}

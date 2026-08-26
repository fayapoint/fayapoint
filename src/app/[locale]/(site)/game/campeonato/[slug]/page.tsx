import type { Metadata } from "next";
import { PainelCampeonato } from "@/components/game/PainelCampeonato";
import { generatePageMetadata } from "@/lib/metadata";
import { getCopyCampeonato } from "@/lib/game/copy-campeonato";
import { FUNDO } from "@/lib/game/tema";
import GameCompeticao from "@/models/GameCompeticao";
import dbConnect from "@/lib/mongodb";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * O metadata LÊ O BANCO, ao contrário da central do clube (que fica no título
 * genérico para não pagar uma ida à EA por rastreador).
 *
 * A diferença é o custo e o valor: o campeonato está no NOSSO Mongo, uma
 * consulta projetada custa milissegundos — e o título é o que aparece quando
 * alguém cola o link do campeonato no grupo do WhatsApp. Um "Campeonato" mudo
 * ali mataria metade do compartilhamento, que é como uma liga de amigos cresce.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const en = locale === "en";

  let nome = en ? "Championship" : "Campeonato";
  let descricao = en
    ? "Standings, calendar, bracket and top scorers — computed live."
    : "Classificação, calendário, chaveamento e artilharia — calculados ao vivo.";

  try {
    await dbConnect();
    const comp = await GameCompeticao.findOne({ slug }).select("nome descricao").lean();
    if (comp) {
      nome = comp.nome;
      if (comp.descricao) descricao = comp.descricao;
    }
  } catch {
    // Banco fora do ar não pode derrubar a página: fica o título genérico.
  }

  return generatePageMetadata({
    locale,
    path: `/game/campeonato/${slug}`,
    title: `${nome} — Winners 22 | FayAI`,
    description: descricao,
  });
}

export default async function CampeonatoPage({ params }: Props) {
  const { locale, slug } = await params;
  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28"
      style={{ background: FUNDO, color: "#f3f1ff" }}
    >
      <PainelCampeonato slug={slug} copy={getCopyCampeonato(locale)} />
    </main>
  );
}

import { Trophy, Flag, ShieldX, Star, Megaphone, Swords } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import GameCopa from "@/models/GameCopa";
import { LIMA, OURO, CIANO, ROSA, RUBRO, CINZA, bebas, superficie } from "@/lib/game/tema";

/**
 * A LINHA DO TEMPO — e por que ela é SERVIDOR, não cliente.
 *
 * ## O problema que ela resolve de verdade
 *
 * `PaginaDaCopa` é componente de cliente: o HTML que sai do servidor não tem
 * uma linha do conteúdo, e tudo aparece depois que o navegador busca a API.
 * Para quem lê, tudo bem. Para buscador, é uma página vazia com um script —
 * e o Ricardo quer esta página ranqueando.
 *
 * Esta peça lê o banco DIRETO, no servidor, e sai pronta no HTML. É o texto
 * original da página: 3.100 caracteres de história com data, nome de clube e
 * placar, que é exatamente o que uma grade de números nunca vai ser.
 *
 * ## Por que não virou parte da PaginaDaCopa
 *
 * Porque converter aquele componente inteiro para servidor custaria arrancar
 * `useState` de cinco lugares, e o ganho de SEO vem do TEXTO — que é isto
 * aqui. Uma peça de servidor ao lado entrega o ganho sem o risco.
 *
 * ## O `<time dateTime>` não é detalhe
 *
 * Data em texto solto ("30/08") não diz ano nem fuso a ninguém. `<time>` com
 * `dateTime` ISO é o que permite a um buscador entender que isto é uma
 * cronologia, e a um leitor de tela ler a data como data.
 */

const ICONE = {
  marco: Flag,
  resultado: Swords,
  classificacao: Trophy,
  eliminacao: ShieldX,
  destaque: Star,
  anuncio: Megaphone,
} as const;

const COR = {
  marco: CIANO,
  resultado: LIMA,
  classificacao: OURO,
  eliminacao: RUBRO,
  destaque: ROSA,
  anuncio: CINZA,
} as const;

type Tipo = keyof typeof ICONE;

interface Entrada {
  em: Date;
  tipo: Tipo;
  titulo: string;
  texto: string;
  times?: string[];
}

export async function LinhaDoTempoDaCopa({ slug }: { slug: string }) {
  await dbConnect();
  const copa = (await GameCopa.findOne({ slug })
    .select("nome edicao linhaDoTempo")
    .lean()) as unknown as { nome: string; edicao?: string; linhaDoTempo?: Entrada[] } | null;

  const entradas = copa?.linhaDoTempo ?? [];
  if (entradas.length === 0) return null;

  const ordenadas = [...entradas].sort((a, b) => new Date(b.em).getTime() - new Date(a.em).getTime());

  return (
    <section className="mx-auto mt-16 max-w-4xl px-4" aria-labelledby="linha-do-tempo">
      <h2
        id="linha-do-tempo"
        style={bebas}
        className="flex items-center gap-2 text-3xl uppercase tracking-wide text-white"
      >
        <Flag className="h-6 w-6" style={{ color: CIANO }} />
        A história da {copa!.nome}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-white/50">
        Tudo o que aconteceu na {copa!.edicao ? `${copa!.edicao.toLowerCase()} ` : ""}competição, do
        anúncio dos times ao mata-mata — do mais recente para o mais antigo.
      </p>

      <ol className="relative mt-8 space-y-5 border-l border-white/10 pl-6">
        {ordenadas.map((e) => {
          const Icone = ICONE[e.tipo] ?? Flag;
          const cor = COR[e.tipo] ?? CINZA;
          const data = new Date(e.em);
          return (
            <li key={`${e.em}-${e.titulo}`} className="relative">
              <span
                aria-hidden
                className="absolute -left-[31px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: "#090e11", border: `1px solid ${cor}66` }}
              >
                <Icone className="h-2.5 w-2.5" style={{ color: cor }} />
              </span>

              <article style={superficie(cor)} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <time
                    dateTime={data.toISOString()}
                    className="font-mono text-[11px] tabular-nums"
                    style={{ color: cor }}
                  >
                    {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </time>
                  <h3 className="text-base font-semibold leading-snug text-white/90">{e.titulo}</h3>
                </div>

                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{e.texto}</p>

                {e.times && e.times.length > 0 && (
                  <p className="mt-2.5 flex flex-wrap gap-1.5">
                    {e.times.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/45"
                      >
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

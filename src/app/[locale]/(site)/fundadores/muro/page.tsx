import { Link } from "@/i18n/navigation";
import dbConnect from "@/lib/mongodb";
import Fundador from "@/models/Fundador";
import User from "@/models/User";
import { LIMITE_DE_VAGAS } from "@/models/Fundador";
import { contarVagas } from "@/lib/fundadores";

/**
 * O MURO DOS FUNDADORES — 06/09/2026.
 *
 * Cem lugares numerados, e os que já foram ocupados têm gente com nome. É a
 * peça que transforma o programa de promessa em fato: enquanto a landing diz
 * "cem lugares", o muro **mostra quem já está dentro**.
 *
 * ## Só primeiro nome, e nada mais
 *
 * Nem e-mail, nem sobrenome, nem foto, nem link. Quem entra num programa não
 * está pedindo para virar página pública — e um muro com nome completo é uma
 * lista de clientes pagantes servida ao primeiro raspador que passar. Primeiro
 * nome basta para a pessoa se reconhecer e para o muro parecer gente.
 *
 * ## O vazio não é escondido
 *
 * Os lugares livres aparecem como lugares livres, numerados. Um muro que
 * mostrasse só os ocupados esconderia justamente a informação que faz alguém
 * agir — e o vazio, aqui, é o argumento.
 *
 * Revalida a cada 5 minutos: nome novo no muro não é urgente, e a página é
 * feita para ser compartilhada.
 */
export const revalidate = 300;

export const metadata = {
  title: "O Muro dos Fundadores | FayAI",
  description:
    "Quem ocupou os cem primeiros lugares da FayAI, em ordem de chegada.",
};

export default async function MuroDosFundadores() {
  await dbConnect();

  const [fundadores, vagas] = await Promise.all([
    Fundador.find({ status: { $ne: "encerrado" } })
      .sort({ numero: 1 })
      .select("numero userId nivel criadoEm")
      .lean()
      .catch(() => []),
    contarVagas().catch(() => null),
  ]);

  const nomes = new Map<string, string>();
  if (fundadores.length) {
    const usuarios = await User.find({ _id: { $in: fundadores.map((f) => f.userId) } })
      .select("name")
      .lean()
      .catch(() => []);
    for (const u of usuarios) {
      // Só o primeiro nome. Ver o comentário no topo do arquivo.
      nomes.set(String(u._id), String(u.name || "").trim().split(/\s+/)[0] || "Fundador");
    }
  }

  const porNumero = new Map(fundadores.map((f) => [f.numero, f]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-4xl px-4 pb-24 pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Turma 001
        </p>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">O Muro dos Fundadores</h1>
        <p className="mt-5 max-w-[56ch] text-lg text-muted-foreground">
          {vagas && vagas.ocupadas > 0
            ? `${vagas.ocupadas} ${vagas.ocupadas === 1 ? "pessoa ocupou o seu lugar" : "pessoas ocuparam os seus lugares"}, em ordem de chegada. Os outros ${vagas.livres} continuam livres.`
            : "Nenhum lugar foi ocupado ainda. O primeiro número vai para a primeira assinatura confirmada — e fica com ela para sempre."}
        </p>

        <div className="mt-12 grid grid-cols-2 gap-px bg-border sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: LIMITE_DE_VAGAS }, (_, i) => {
            const n = i + 1;
            const f = porNumero.get(n);
            const rotulo = String(n).padStart(3, "0");
            return (
              <div
                key={n}
                className={`flex items-baseline gap-3 bg-background px-4 py-3 ${
                  f ? "" : "opacity-45"
                }`}
              >
                <span
                  className={`font-mono text-[13px] tabular-nums ${
                    f ? "text-amber-400" : "text-muted-foreground"
                  }`}
                >
                  #{rotulo}
                </span>
                <span className={`truncate text-sm ${f ? "font-medium" : "text-muted-foreground"}`}>
                  {f ? (nomes.get(String(f.userId)) ?? "Fundador") : "livre"}
                </span>
              </div>
            );
          })}
        </div>

        {vagas?.aberto && (
          <div className="mt-14 border-t border-border pt-10 text-center">
            <p className="text-muted-foreground">
              Ainda dá para ter um número neste muro.
            </p>
            <Link
              href="/fundadores"
              className="mt-5 inline-flex items-center rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              Ver o programa
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

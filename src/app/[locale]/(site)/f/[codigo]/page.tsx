import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import Fundador from "@/models/Fundador";
import User from "@/models/User";
import {
  normalizarCodigo,
  contarVagas,
  DESCONTO_INDICADO,
  MESES_DESCONTO_INDICADO,
} from "@/lib/fundadores";

/**
 * O CONVITE PERSONALIZADO — `fayai.com.br/f/<codigo>`.
 *
 * O endereço que o fundador publica no grupo, no cartaz do campeonato, na bio.
 * Ele existe por um motivo comercial e um humano:
 *
 * - **Comercial:** é aqui que o código entra no navegador. O `?ref=` na URL
 *   funciona igual, mas ninguém cola uma query string num grupo de WhatsApp.
 * - **Humano:** a página diz o NOME de quem convidou. Convite com remetente
 *   converte diferente de cupom anônimo — e é a diferença entre "alguém que eu
 *   conheço usa isso" e "recebi mais um link".
 *
 * ⚠️ O código é lido no servidor e o cookie é gravado no cliente (o
 * `AttributionTracker` já roda em toda navegação e reconhece `/f/<codigo>`).
 * Não há gravação de cookie aqui: página de convite é rastreável pelo Google, e
 * cookie escrito no servidor em página cacheada vaza o código de uma pessoa
 * para a próxima.
 *
 * Código que não existe **redireciona** para `/fundadores` em vez de dar 404:
 * quem clicou não errou nada, e a oferta continua valendo para ele.
 */
export const revalidate = 300;

export default async function ConvitePersonalizado({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo: bruto } = await params;
  const codigo = normalizarCodigo(bruto);

  await dbConnect();
  const fundador = await Fundador.findOne({ codigo, status: "ativo" }).lean();
  if (!fundador) redirect(`/${locale}/fundadores`);

  const [dono, vagas] = await Promise.all([
    User.findById(fundador.userId).select("name").lean(),
    contarVagas().catch(() => null),
  ]);

  const primeiroNome = (dono?.name || "").trim().split(/\s+/)[0] || "Um fundador";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-3xl px-4 pb-24 pt-36 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Convite de Fundador #{String(fundador.numero).padStart(3, "0")}
        </p>

        <h1 className="mt-5 text-4xl font-bold leading-[1.05] md:text-5xl">
          {primeiroNome} te chamou
          <br />
          para a FayAI.
        </h1>

        <p className="mx-auto mt-6 max-w-[52ch] text-lg text-muted-foreground">
          Quem entra por este convite paga{" "}
          <strong className="font-semibold text-amber-400">
            {Math.round(DESCONTO_INDICADO * 100)}% a menos nos {MESES_DESCONTO_INDICADO}{" "}
            primeiros meses
          </strong>{" "}
          — e {primeiroNome} recebe uma parte do que você pagar, todo mês, sem que isso
          custe nada a mais para você.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/registro?proximo=/precos&ref=${codigo}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Criar minha conta <ArrowRight size={18} />
          </Link>
          <Link href="/fundadores" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ver o programa inteiro
          </Link>
        </div>

        {vagas && vagas.livres > 0 && (
          <p className="mt-10 font-mono text-sm text-muted-foreground">
            {vagas.livres} dos {vagas.total} lugares de fundador ainda estão livres — se
            você pegar um, o seu desconto vira metade do preço, e você ganha o seu próprio
            código.
          </p>
        )}
      </main>
    </div>
  );
}

import { PaginaDaFederacao } from "@/components/game/PaginaDaFederacao";
import { FederacaoClubes } from "@/components/game/FederacaoClubes";
import { atorGestao } from "@/lib/game/gestao-servidor";

/**
 * A página tem duas camadas, e a de baixo é fechada.
 *
 * Em cima, a instituição: finalidade, regras principais e o que a Federação não
 * é. É o que qualquer pessoa precisa ver ao clicar em "Federação" — antes,
 * quem entrava aqui sem ser da casa encontrava um painel de operação pedindo
 * login, e nada sobre quem somos.
 *
 * Embaixo, o painel: filiação de clubes, fila de descobertas, integridade e
 * auditoria da copa. A checagem é de SERVIDOR — quem não é da federação não
 * recebe o painel escondido por CSS, não recebe o painel.
 */
export const metadata = { title: "Federação — Winners 22", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FederacaoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ator = await atorGestao().catch(() => null);
  const ehFederacao = !!ator?.federacao;

  return (
    <>
      <PaginaDaFederacao locale={locale} ehFederacao={ehFederacao} />
      {ehFederacao && <FederacaoClubes locale={locale} />}
    </>
  );
}

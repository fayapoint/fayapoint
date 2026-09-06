import { permanentRedirect } from "next/navigation";

/**
 * ── A PROMESSA DE 30% QUE NÃO TINHA MOTOR ────────────────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`, §2 e §6.3
 *
 * Esta página anunciava, em letra grande, **"30% de comissão por venda"** — com
 * três passos ("Cadastre-se · Compartilhe · Ganhe"), seis vantagens e um botão.
 * Atrás disso não havia nada: nem cadastro de afiliado, nem link exclusivo, nem
 * cálculo, nem pagamento. O botão levava para `/contato`.
 *
 * Pelo Código de Defesa do Consumidor (art. 30) a oferta publicada **vincula e
 * integra o contrato**. Uma página no ar prometendo 30% a quem indicasse era,
 * portanto, obrigação assumida sem sistema que a cumprisse — e o risco não é
 * teórico: bastava alguém indicar uma venda e cobrar.
 *
 * O programa de verdade nasceu em `/fundadores`, com percentual que sai do
 * código (`lib/fundadores.ts`), extrato por lançamento (`models/Comissao.ts`) e
 * retenção de 30 dias. Quem procurava afiliação chega lá.
 *
 * A página antiga ficou ao lado como `_promessa-sem-motor.page.tsx.txt` — fora
 * do roteamento, dentro da história.
 */
export default async function AfiliadosRedirecionado({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/fundadores`);
}

import { permanentRedirect } from "next/navigation";

/**
 * ── A SEGUNDA PORTA DE CADASTRO, FECHADA (06/09/2026) ───────────────────────
 *
 * Ricardo: *"eu tentei fazer o signup e nem página de cadastrar com o Google eu
 * achei... de outro lugar eu sou jogado para uma outra forma completamente
 * diferente de se cadastrar no site."*
 *
 * Ele estava descrevendo isto. O site tinha DUAS telas de criar conta:
 *
 * - `/registro` — nome, e-mail, senha, **Google e GitHub**. Alcançável pela
 *   página de preços, pelo blog e pelo `/sobre`.
 * - `/onboarding` — funil de três passos (boas-vindas → e-mail e senha →
 *   papel e interesses), **sem Google e sem GitHub**, com texto de lista de
 *   espera ("Bem-vindo à Elite da IA! 🚀"). Era para onde apontavam o botão
 *   principal do cabeçalho e o "não tem conta? criar conta" do `/login` — ou
 *   seja, os dois caminhos mais óbvios do site levavam à porta pior.
 *
 * Duas portas para a mesma coisa não é escolha, é incoerência: a pessoa que
 * conhecia um caminho reencontrava outro produto no caminho seguinte.
 *
 * ## O que se perdeu, e por que não é perda
 *
 * O passo 3 coletava `role` e `interest`, que o `POST /api/auth/register`
 * grava em `profile.position` e `profile.interests`. Continuam existindo e
 * continuam opcionais — quem preenche agora é o construtor de persona do
 * portal, que pergunta muito mais e ainda paga XP por responder. O outro
 * destino daquele passo era `POST /api/webhooks/onboarding`, que chama
 * `http://host.docker.internal:5678` — um n8n de máquina local que **não existe
 * em produção**. Aquela chamada falhava em silêncio (o `.catch(() => {})` está
 * lá) desde sempre.
 *
 * O funil antigo ficou ao lado como `_funil-antigo.page.tsx.txt` — o prefixo
 * `_` e a extensão trocada tiram o arquivo do roteamento do Next sem apagar a
 * história.
 *
 * ⚠️ 308 e não 307: a página não volta. Redirecionamento permanente é o que
 * consolida no `/registro` a autoridade dos links antigos que apontarem para cá.
 */
export default async function OnboardingRedirecionado({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/registro`);
}

import { redirect } from "@/i18n/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * A FILA DE DESCOBERTAS MUDOU DE ENDEREÇO — 08/09/2026.
 *
 * Esta página existiu por algumas horas como tela solta, e o Codex construiu em
 * paralelo a mesma fila dentro do painel da Federação. Duas telas decidindo a
 * mesma coisa é pior do que uma pior: elas divergem, e a decisão tomada numa
 * não aparece com o mesmo contexto na outra.
 *
 * Ficou a da Federação, por dois motivos: é para lá que o hub aponta (esta aqui
 * nunca teve link de lugar nenhum — rota órfã), e é onde moram as outras
 * decisões humanas, o quadro de integridade e a auditoria da copa. A força e a
 * densidade, que só existiam aqui, foram levadas para lá.
 *
 * O redirecionamento fica em vez de a rota sumir: quem tiver o endereço salvo
 * chega no lugar certo em vez de tomar 404.
 */
export default async function DescobertasPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/game/federacao", locale });
}

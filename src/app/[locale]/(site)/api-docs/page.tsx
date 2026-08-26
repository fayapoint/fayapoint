"use client";

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Coins, FileCode2, Image as ImageIcon, Lock, Wallet } from "lucide-react";

import { useT } from "@/i18n/dicionario";
import { comIdioma } from "@/lib/rota-idioma";

/**
 * A página da API.
 *
 * ⚠️ O QUE FOI TIRADO DAQUI EM 26/08/2026, E POR QUÊ
 *
 * A versão anterior tinha 601 linhas e listava 17 endpoints em 5 categorias,
 * apresentados como se fossem um produto. Três problemas, e nenhum era de
 * acabamento:
 *
 *  1. **Eram os endpoints INTERNOS do próprio site.** `POST /api/auth/login`
 *     com `email` e `password` no corpo, `POST /api/consultation/request`
 *     marcado `auth: false`, `/api/user/dashboard`. O "Quick Start" ensinava,
 *     passo a passo, a mandar credencial para a rota de login. Isso não é
 *     documentação de API: é um mapa da superfície de ataque com exemplos de
 *     payload prontos, numa página que o `robots.txt` deixa rastrear enquanto
 *     bloqueia `/api/` — ou seja, publicávamos o mapa e escondíamos o
 *     território.
 *
 *  2. **A tabela "Limites de Uso" era ficção.** Prometia 100 / 1.000 / 10.000
 *     requisições por hora conforme o plano. Não existe uma linha de código que
 *     implemente isso. O limitador real é `src/proxy.ts`: 250 requisições por
 *     minuto POR IP, igual para todo mundo, sem olhar plano — não há chave de
 *     API, não há identidade de aplicação, não há contador por cliente.
 *
 *  3. **Nenhum link interno apontava para cá.** As únicas menções a `api-docs`
 *     no repositório eram o `sitemap.ts` e o `lib/metadata.ts`. O Google leu e
 *     recusou: "Rastreada, mas não indexada" — veredito correto, porque não
 *     havia o que indexar.
 *
 * O que está aqui agora descreve **só o que existe** (`/llms.txt`, que é real e
 * está no ar) e diz, sem rodeio, que o resto ainda não existe. Página que
 * promete o que não há não é otimista: é uma dívida que alguém vai cobrar.
 *
 * ⚠️ REGRA PARA QUEM VOLTAR AQUI: enquanto não houver chave de API com portão,
 * medição e cobrança, **nada de endpoint interno nesta página**. Quando houver,
 * o que se documenta é `/api/v1/*` — nunca `/api/*` cru, que é do site.
 *
 * O plano completo está em `autoresearch/PLANO_ABERTURA_E_API_2026-08-26.md`.
 */
export default function APIDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const T = useT();
  /** Link interno SEMPRE com prefixo de idioma — ver `lib/rota-idioma.ts`. */
  const rota = (h: string) => comIdioma(h, locale);

  /**
   * O que a API cobrirá quando existir. Descrito como intenção, no futuro, de
   * propósito: é isso que estas três linhas são hoje.
   */
  const planejado = [
    {
      icone: <BookOpen className="w-5 h-5" />,
      titulo: "Catálogo de cursos",
      texto: "Ler a lista de cursos, preços e ementas para montar vitrine própria ou integrar a um sistema de RH.",
    },
    {
      icone: <ImageIcon className="w-5 h-5" />,
      titulo: "Geração de imagem",
      texto: "A mesma geração que roda dentro do site, disponível por chamada — debitada do mesmo saldo.",
    },
    {
      icone: <Wallet className="w-5 h-5" />,
      titulo: "Consulta de saldo",
      texto: "Quantos créditos restam e para onde foram, para o cliente conferir o consumo sem abrir o painel.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-20">
        {/* ── Abertura ─────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <FileCode2 className="w-3 h-3 mr-1" />
              {T("API FayAI")}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-5">
              {T("Uma API para integrar a FayAI")}
            </h1>
            <p className="text-xl text-muted-foreground">
              {T("Ainda não existe, e é melhor dizer isso do que fingir o contrário. Esta página conta o que já dá para consumir hoje, o que está sendo construído e como será cobrado — para você decidir se vale esperar ou conversar agora.")}
            </p>
          </div>
        </section>

        {/* ── O que existe hoje ────────────────────────────────────────── */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold mb-2">{T("O que já está no ar")}</h2>
            <p className="text-muted-foreground mb-6">
              {T("Um endereço público, sem chave e sem cadastro:")}
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="outline" className="font-mono text-xs">GET</Badge>
                <code className="font-mono text-sm text-amber-400">https://fayai.com.br/llms.txt</code>
              </div>
              <p className="text-sm text-muted-foreground">
                {T("O mapa do site em texto puro, gerado do banco a cada hora — cursos no ar, ferramentas e matérias. Foi feito para modelos de linguagem lerem sem precisar garimpar HTML cheio de menu e rodapé, e serve igualmente bem para qualquer script.")}
              </p>
            </div>
          </div>
        </section>

        {/* ── O que vem ────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold mb-2">{T("O que está sendo construído")}</h2>
            <p className="text-muted-foreground mb-6">
              {T("Três frentes, nesta ordem. Nenhuma está disponível ainda.")}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {planejado.map((item) => (
                <div key={item.titulo} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-amber-500/10 p-2 text-amber-400">
                    {item.icone}
                  </div>
                  <h3 className="font-medium mb-2">{T(item.titulo)}</h3>
                  <p className="text-sm text-muted-foreground">{T(item.texto)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cobrança ─────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-3xl rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Coins className="h-5 w-5 text-amber-400" />
              {T("Como será cobrada")}
            </h2>
            <p className="mb-4 text-muted-foreground">
              {T("Em créditos, não em número de requisições. Uma chamada que gera imagem custa muitas vezes uma que lê o catálogo, e cobrar as duas pelo mesmo balcão seria cobrar errado nos dois casos.")}
            </p>
            <p className="text-muted-foreground">
              {T("São os mesmos créditos que já valem dentro do site: um saldo só, um extrato só, um preço só para entender. Nada de tabela paralela para manter em dia.")}
            </p>
          </div>
        </section>

        {/* ── O que NÃO vai entrar ─────────────────────────────────────── */}
        <section className="container mx-auto px-4 mb-14">
          <div className="max-w-3xl">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Lock className="h-5 w-5 text-zinc-400" />
              {T("O que nunca vai ser exposto")}
            </h2>
            <p className="text-muted-foreground">
              {T("Login, checkout, painel do aluno, administração e o texto das aulas ficam fora da API pública — hoje e depois. Cada um deles é ou a porta de casa, ou o produto. Nenhum dos dois se documenta em página aberta.")}
            </p>
          </div>
        </section>

        {/* ── Conversa ─────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4">
          <div className="max-w-3xl text-center">
            <h2 className="mb-3 text-2xl font-semibold">{T("Precisa de uma integração agora?")}</h2>
            <p className="mb-6 text-muted-foreground">
              {T("Se você tem um caso de uso concreto, ele muda a ordem das três frentes acima. Conte qual é — é assim que decidimos o que construir primeiro.")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline">
                <Link href={rota("/contato")}>{T("Falar com o time")}</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-600 to-yellow-700">
                <Link href={rota("/agendar-consultoria")}>{T("Agendar consultoria")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

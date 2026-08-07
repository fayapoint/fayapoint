"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowRight, BookOpen, Check, Crown, Loader2, PlayCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIER_CONFIGS, resolvePlan, type SubscriptionPlan } from "@/lib/course-tiers";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { podePersonalizar, motivoSemPersonalizacao } from "@/lib/curso-personalizavel";

/**
 * A faixa que reconhece quem já é aluno (03/08/2026).
 *
 * ## O problema que ela resolve
 *
 * Ricardo, assinante Expert, clicando num curso a partir da home logada:
 * *"sou tratado como um usuário qualquer, e sou encaminhado para a mesma
 * página de venda que um usuário deslogado, ou do plano gratuito, o que me soa
 * muito mal, não tenho a opção de adicionar ele para ler no meu dashboard, nem
 * sou reconhecido."*
 *
 * A `CourseSalesPage` importa `useUser()` desde sempre, mas só usa `isLoggedIn`
 * para escolher entre `/checkout/cart` e `/onboarding` DEPOIS do clique. Antes
 * do clique a página é idêntica para todo mundo: mesmo preço, mesmo "adicionar
 * ao carrinho", mesma contagem regressiva — para quem já paga R$167 por mês e,
 * às vezes, para quem já está matriculado NAQUELE curso.
 *
 * ## Por que é um componente separado, e no cliente
 *
 * A página é ISR (`revalidate = 900`) e o HTML servido é o mesmo para o
 * rastreador e para o visitante — foi assim que ela saiu do soft 404 de 28/07,
 * e isso não pode ser desfeito por personalização. Então a faixa monta DEPOIS
 * da hidratação, sobre o HTML público, e some sozinha para quem não está
 * logado: o Google continua vendo exatamente a página de vendas de antes.
 *
 * Enquanto a resposta não chega, ela não renderiza nada — nem esqueleto. Uma
 * faixa que aparece e muda de forma empurraria o herói para baixo na frente da
 * pessoa.
 */

export interface Acesso {
  access: "full" | "limited" | "none";
  reason: string;
  plan: SubscriptionPlan | null;
  enrolled: boolean;
  progressPercent: number | null;
  freeChapters: number;
}

/**
 * Quem está olhando esta página, e o que ela já lhe deve.
 *
 * Fica num hook porque a resposta não interessa só à faixa: os botões de
 * COMPRAR precisam dela também. Sem isso, a página exibia "você já paga por
 * este curso" e, dois blocos abaixo, "R$ 149 · Comprar" — a contradição na
 * mesma tela. Uma busca só, um estado só, a página inteira concordando.
 */
export function useAcessoDoAluno(slug: string): Acesso | null {
  const [acesso, setAcesso] = useState<Acesso | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`/api/courses/access?slug=${encodeURIComponent(slug)}`, {
          credentials: "include",
          headers: getClientAuthHeaders(),
          cache: "no-store",
        });
        if (!r.ok) return;
        const d = (await r.json()) as Acesso;
        if (vivo) setAcesso(d);
      } catch {
        // Sem resposta, a página de vendas segue exatamente como está para o
        // visitante. Falhar para o lado de mostrar menos.
      }
    })();
    return () => {
      vivo = false;
    };
  }, [slug]);

  return acesso;
}

/** O aluno já tem este curso pelo plano ou pela matrícula? */
export function temAcessoTotal(acesso: Acesso | null): boolean {
  return Boolean(acesso?.plan && (acesso.access === "full" || acesso.enrolled));
}

export default function FaixaDoAluno({
  slug,
  locale,
  preco,
  acesso,
}: {
  slug: string;
  locale: string;
  preco: number;
  acesso: Acesso | null;
}) {
  const T = useT();
  const router = useRouter();
  const [matriculando, setMatriculando] = useState(false);

  // Visitante e plano nenhum: a página pública, intacta.
  if (!acesso || !acesso.plan) return null;

  const tier = TIER_CONFIGS[resolvePlan(acesso.plan)];
  const progresso = acesso.progressPercent ?? 0;
  const jaComecou = acesso.enrolled || progresso > 0;

  const adicionarAoAcervo = async () => {
    setMatriculando(true);
    try {
      const r = await fetch("/api/courses/enroll", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ courseSlug: slug }),
      });
      const d = await r.json();
      if (!r.ok) {
        // O 409 de vaga tem mensagem própria e ela é a certa — "conclua um
        // curso", não "faça upgrade". Repassar o texto do servidor evita que
        // esta tela invente um motivo diferente do que de fato aconteceu.
        toast.error(d?.error || "Não deu para adicionar agora");
        return;
      }
      toast.success(T("Curso adicionado ao seu acervo 📚"));
      router.push(`/${locale}/portal/learn/${slug}`);
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setMatriculando(false);
    }
  };

  // ── 1. Já está no curso → continuar, nunca comprar ────────────────────────
  if (jaComecou) {
    return (
      <div className="mb-6 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-cyan-200">
              <BookOpen size={15} />
              {progresso >= 100
                ? T("Você concluiu este curso")
                : progresso > 0
                  ? T("Você já começou este curso")
                  : T("Este curso já está no seu acervo")}
            </p>
            {progresso > 0 && progresso < 100 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progresso}%` }} />
                </div>
                <span className="text-xs text-cyan-100/70">{Math.round(progresso)}%</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {podePersonalizar(slug) && (
              <Link href={`/${locale}/curso/${slug}/meu`}>
                <Button variant="outline" className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10">
                  <Wand2 size={16} className="mr-1.5" />
                  
                  {T("Personalizar")}
                </Button>
              </Link>
            )}
            <Link href={`/${locale}/portal/learn/${slug}`}>
              <Button className="bg-cyan-500 font-bold text-black hover:bg-cyan-400">
                <PlayCircle size={16} className="mr-1.5" />
                {progresso > 0 ? T("Continuar de onde parei") : T("Começar agora")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. O plano cobre → ler agora, e a opção de guardar na estante ─────────
  if (acesso.access === "full") {
    return (
      <div className="mb-6 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-200">
              <Crown size={15} />
              
              {T("Incluído no seu plano")} {T(tier.displayName)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              
              {T("Você já paga por este curso — não precisa comprar de novo.")}{" "}
              {podePersonalizar(slug) ? (
                <Link href={`/${locale}/curso/${slug}/meu`} className="font-semibold text-amber-300 hover:underline">
                  
                  {T("Pode até reescrevê-lo para o seu negócio →")}
                </Link>
              ) : (
                <span className="text-muted-foreground">{motivoSemPersonalizacao(slug)}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/portal/learn/${slug}`}>
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-black hover:opacity-90">
                
                {T("Ler agora")}
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={adicionarAoAcervo}
              disabled={matriculando}
              className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
            >
              {matriculando ? (
                <Loader2 size={16} className="mr-1.5 animate-spin" />
              ) : (
                <Check size={16} className="mr-1.5" />
              )}
              
              {T("Adicionar ao acervo")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Assinante de plano menor → a conta honesta, com o desconto dele ────
  //
  // Nem pitch de visitante, nem chantagem: o que o plano atual dá, o preço
  // avulso COM o desconto que ele já tem por assinar, e o upgrade como
  // alternativa — nessa ordem.
  const desconto = tier.purchaseDiscount;
  const precoComDesconto = Math.round(preco * (1 - desconto));

  return (
    <div className="mb-6 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-transparent p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-sm font-bold text-violet-200">
        <Crown size={15} />
        
        {T("Olá de novo — seu plano é o")} {T(tier.displayName)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {desconto > 0
          ? `Este curso não entra na cota do seu plano. Você lê ${acesso.freeChapters} capítulos de graça e, por ser ${tier.displayName}, leva o curso completo por `
          : `Você lê ${acesso.freeChapters} capítulos de graça. Para ler o curso inteiro, ele sai por `}
        <strong className="text-white">{T("R$")} {precoComDesconto}</strong>
        {desconto > 0 && (
          <>
            {" "}
            <span className="line-through opacity-60">{T("R$")} {preco}</span>{" "}
            <span>({Math.round(desconto * 100)}{T("% de desconto já aplicado no checkout)")}</span>
          </>
        )}
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/${locale}/precos`}>
          <Button variant="outline" className="border-violet-400/40 text-violet-200 hover:bg-violet-500/10">
            
            {T("Ver o que o Expert libera")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

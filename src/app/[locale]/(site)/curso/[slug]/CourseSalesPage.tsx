"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, Clock, Users, Star, Award, CheckCircle, Lock,
  Download, Globe, Calendar, BookOpen, Target, ChevronDown,
  ChevronUp, MessageSquare, Share2, Heart, ShoppingCart,
  TrendingUp, Zap, Building2, User, Sparkles, Trophy,
  Gift, Shield, HelpCircle, ArrowRight, Rocket, Brain,
  DollarSign, Timer, AlertCircle, Check, X, Play, ChevronRight,
  Quote, BadgeCheck, Flame, Crown, PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/products";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatEditorialDate } from "@/lib/editorial-verification";
import { getClientAuthHeaders } from "@/lib/client-auth";
import FaixaDoAluno, { useAcessoDoAluno, temAcessoTotal } from "./FaixaDoAluno";
import { CapaDoCurso } from "@/components/courses/CapaDoCurso";
import { CenaDoCurso } from "@/components/courses/CenaDoCurso";
import { FundoDoCurso } from "@/components/courses/FundoDoCurso";
import { VideoIntroCurso } from "@/components/courses/VideoIntroCurso";
import { AssinaturaFayai } from "@/components/marca/AssinaturaFayai";

export default function CourseSalesPage({
  initialProduct = null,
}: {
  initialProduct?: Product | null;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addItem } = useServiceCart();
  const { isLoggedIn } = useUser();
  const t = useTranslations("CoursePage");

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const locale = useLocale();

  // Quem está olhando. `null` para visitante e enquanto a resposta não chega —
  // e nesse caso a página se comporta exatamente como sempre se comportou.
  const acesso = useAcessoDoAluno(slug);
  const jaTemOCurso = temAcessoTotal(acesso);

  // O curso chega pronto do servidor (`initialProduct`) e só caímos no fetch se
  // ele faltar — banco fora do ar, essencialmente.
  //
  // Antes esta busca era o ÚNICO caminho, e custava a página inteira no Google:
  // o HTML servido era menu + "Carregando curso..." + rodapé, 624 caracteres
  // idênticos nas 20 URLs de curso (medido em produção 28/07/2026). Duas falhas
  // de uma vez — página sem conteúdo (soft 404) e 20 cópias entre si. E não
  // adiantava esperar o Googlebot rodar o JS: `/api/` é `Disallow` no
  // robots.txt, então o fetch nunca completa para ele e o componente cai no
  // ramo `!product`, que renderiza literalmente "Curso não encontrado".
  useEffect(() => {
    if (initialProduct) return;
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug, initialProduct]);


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("notFound")}</h1>
          <Link href="/cursos">
            <Button>{t("viewAllCourses")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100);
  const savings = product.pricing.originalPrice - product.pricing.price;
  const isPtBr = locale === 'pt-BR';
  const isFreeCourseOfMonth = Boolean(product.monthlyOffer?.isFreeCourseOfMonth);
  const effectivePrice = isFreeCourseOfMonth ? 0 : product.pricing.price;
  const effectiveOriginalPrice = isFreeCourseOfMonth
    ? product.pricing.price
    : product.pricing.originalPrice;
  const effectiveDiscount =
    isFreeCourseOfMonth && product.pricing.price > 0
      ? 100
      : discount;
  /**
   * Quando o CONTEÚDO foi mexido pela última vez — não quando alguém disse
   * que revisou.
   *
   * `editorialVerification.verifiedAt` está gravado em 19/03/2026 em 25 dos 27
   * produtos e não se move sozinho: era uma data que envelhecia enquanto se
   * apresentava como prova de frescor. `contentUpdatedAt` é escrito pelo laço
   * toda vez que o texto muda, então diz a verdade sem ninguém precisar
   * lembrar de atualizá-la.
   */
  const atualizadoEm = formatEditorialDate(
    (typeof product.contentUpdatedAt === "string"
      ? product.contentUpdatedAt
      : product.contentUpdatedAt instanceof Date
        ? product.contentUpdatedAt.toISOString()
        : null) || product.updatedAt || "2026-08-03",
    isPtBr ? "pt-BR" : "en-US"
  );
  
  // Calculate total bonus value
  const totalBonusValue = product.bonuses?.reduce((sum, bonus) => sum + bonus.value, 0) || 0;
  const totalValue = product.pricing.originalPrice + totalBonusValue;

  const toggleModule = (id: number) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleFaq = (id: number) => {
    setExpandedFaqs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleFreeCourseClaim = async () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/curso/${product.slug}`)}`);
      return;
    }

    try {
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getClientAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          courseSlug: product.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível liberar o curso grátis do mês.");
      }

      toast.success(
        isPtBr
          ? "Curso grátis do mês liberado com sucesso!"
          : "Free course of the month unlocked successfully!"
      );
      router.push(`/${locale}/portal/learn/${product.slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isPtBr
            ? "Não foi possível liberar o curso grátis do mês."
            : "Could not unlock the free course of the month."
      );
    }
  };

  /**
   * Quem já tem o curso não é mandado para o carrinho — é mandado para o
   * curso.
   *
   * Cobre de uma vez os quatro botões desta página (barra lateral, duas
   * seções e a barra fixa do celular), que antes despejavam no carrinho um
   * item que o assinante já paga. Vale também para quem está matriculado.
   */
  const handlePrimaryCourseAction = () => {
    if (jaTemOCurso) {
      router.push(`/${locale}/portal/learn/${product.slug}`);
      return;
    }

    if (isFreeCourseOfMonth) {
      void handleFreeCourseClaim();
      return;
    }

    addItem({
      id: `course:${product.slug}`,
      type: 'course',
      name: product.name,
      quantity: 1,
      price: product.pricing.price,
      slug: product.slug
    });
    toast.success(t("toast.addedToCart"));
    if (isLoggedIn) {
      router.push('/checkout/cart');
    } else {
      router.push('/onboarding');
    }
  };

  const handleSecondaryCourseAction = () => {
    if (jaTemOCurso) {
      router.push(`/${locale}/portal/learn/${product.slug}`);
      return;
    }

    if (isFreeCourseOfMonth) {
      void handleFreeCourseClaim();
      return;
    }

    addItem({
      id: `course:${product.slug}`,
      type: 'course',
      name: product.name,
      quantity: 1,
      price: product.pricing.price,
      slug: product.slug
    });
    toast.success(t("toast.added"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <main className="pt-20">
        {/* HERO SECTION - Above the Fold */}
        <section className="relative bg-gradient-to-b from-amber-900/30 via-black to-black py-12 overflow-hidden">
          {/* A própria capa do curso, ampliada e desfocada, como atmosfera do
              topo. Vinte e sete páginas de venda tinham exatamente o mesmo fundo
              — a mesma grade de pontos roxos —, então nenhuma delas parecia ser
              sobre coisa alguma. Aqui cada curso passa a ter a cor da arte dele
              (o couro marrom do WhatsApp, o navy do OpenClaw) sem custar nenhum
              arquivo novo: é a imagem que a página já ia baixar de qualquer
              jeito, e o `aria-hidden` a mantém fora do leitor de tela. */}
          {/* ⚠️ 05/08/2026 — a fonte deste fundo MUDOU: era a capa, agora é a
              cena 1 do próprio curso, com a capa só como reserva.
              A capa é o mesmo livro em todas as 27 páginas, com a mesma
              iluminação de estúdio; borrada, ela virava quase o mesmo halo
              escuro em toda parte. A cena é a única imagem que fala do
              ASSUNTO, e mesmo borrada ela carrega a paleta daquele assunto.
              A dissolução dos cantos e o véu de contraste moram no
              componente — ver o comentário lá, principalmente o motivo de a
              máscara ser radial e não linear. */}
          <FundoDoCurso slug={slug} reserva={product.thumbnail} />

          {/* Background Animation */}
          {/* A grade de pontos foi de 30% para 12%: com a cena borrada atrás,
              ela deixou de ser o único fundo e passou a ser ruído por cima de
              uma imagem que já tem textura. */}
          <div className="absolute inset-0 opacity-[0.12]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, purple 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Link href="/" className="hover:text-white">{t("breadcrumb.home")}</Link>
                  <ChevronRight size={14} />
                  <Link href="/cursos" className="hover:text-white">{t("breadcrumb.courses")}</Link>
                  <ChevronRight size={14} />
                  <span className="text-amber-400">{product.categoryPrimary}</span>
                </div>

                {/* Quem já é aluno é reconhecido AQUI, antes de qualquer preço.
                    Some sozinha para visitante — o HTML público não muda. */}
                <FaixaDoAluno slug={product.slug} locale={locale} preco={product.pricing.price} acesso={acesso} />

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {isFreeCourseOfMonth && (
                    <Badge className="bg-gradient-to-r from-emerald-400 to-green-500 text-black border-0">
                      <Gift className="mr-1" size={14} />
                      {isPtBr ? "Curso grátis do mês" : "Free course of the month"}
                    </Badge>
                  )}
                  {product.metrics.students > 100 && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0">
                      <Flame className="mr-1" size={14} />
                      {locale === 'pt-BR' ? 'Popular' : 'Popular'}
                    </Badge>
                  )}
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0">
                    <Timer className="mr-1" size={14} />
                    {isFreeCourseOfMonth
                      ? (isPtBr ? 'Acesso aberto no mês' : 'Monthly open access')
                      : locale === 'pt-BR' ? 'Preço de Lançamento' : 'Launch Price'}
                  </Badge>
                  <Badge className="bg-gray-700 text-muted-foreground border-0">
                    {product.level}
                  </Badge>
                </div>

                {/* Headline - Outcome Focused */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    {product.name}
                  </span>
                </h1>

                {/* Subheadline - Mechanism */}
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  {product.copy.subheadline}
                </p>

                {/* Course Info Bar */}
                <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-card/50 rounded-lg border border-border">
                  {product.metrics.rating > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                        <div>
                          <div className="font-bold text-lg">{product.metrics.rating}</div>
                          <div className="text-xs text-muted-foreground">{product.metrics.reviewCount} {t("stats.reviews")}</div>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-12 hidden md:block" />
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <PlayCircle className="text-amber-400" size={20} />
                    <div>
                      <div className="font-bold text-lg">{product.metrics.lessons}</div>
                      <div className="text-xs text-muted-foreground">{locale === 'pt-BR' ? 'Aulas' : 'Lessons'}</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Clock className="text-blue-400" size={20} />
                    <div>
                      <div className="font-bold text-lg">{product.metrics.duration}</div>
                      <div className="text-xs text-muted-foreground">{locale === 'pt-BR' ? 'de conteúdo' : 'of content'}</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Award className="text-green-400" size={20} />
                    <div>
                      <div className="font-bold text-lg">{locale === 'pt-BR' ? 'Certificado' : 'Certificate'}</div>
                      <div className="text-xs text-muted-foreground">{locale === 'pt-BR' ? 'Incluso' : 'Included'}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      {/* ⚠️ 03/08/2026: saíram a porcentagem de "cobertura
                          real" e o canon de modelos.
                          O canon vinha de `editorialVerification` gravado em
                          cada produto, congelado em 19/03 — a página de vendas
                          de um curso de IA anunciando modelos de quatro meses
                          atrás. E a porcentagem, nas palavras do Ricardo, *"só
                          leva o usuário a acreditar exatamente no oposto"*.
                          Ficam os números que ele confere abrindo o curso. */}
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                        <BadgeCheck size={16} />
                        <span>{isPtBr ? 'Curso escrito por inteiro' : 'Fully written course'}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isPtBr
                          ? `Nenhuma aula é um resumo de uma linha: são ${product.contentChapters || 0} capítulos com texto, exemplos e exercícios. Atualizado em ${atualizadoEm}.`
                          : `No lesson is a one-line summary: ${product.contentChapters || 0} chapters with text, examples and exercises. Updated ${atualizadoEm}.`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border bg-secondary px-3 py-1">
                        {isPtBr ? `${product.contentChapters || 0} capítulos` : `${product.contentChapters || 0} chapters`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* A assinatura da casa.
                    Saiu o cartão de degradê âmbar com o avatar "RF" e três
                    linhas de cargo: ele tinha o mesmo peso visual do preço numa
                    página onde o preço é a decisão, e repetia o mesmo nome em
                    22 páginas. Ver o porquê inteiro em `AssinaturaFayai`. */}
                <AssinaturaFayai locale={locale} />

                {/* Quick Course Highlights - Fills the gap */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { icon: PlayCircle, value: `${product.metrics.lessons}`, label: t("stats.videoLessons") },
                    { icon: Clock, value: product.metrics.duration, label: t("stats.ofContent") },
                    { icon: BookOpen, value: `${product.curriculum?.moduleCount || '10'}`, label: locale === 'pt-BR' ? 'Módulos' : 'Modules' },
                    { icon: Award, value: t("stats.certificate"), label: t("stats.ofCompletion") }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-secondary/50 rounded-lg border border-border text-center">
                      <item.icon className="mx-auto mb-2 text-amber-400" size={24} />
                      <div className="font-bold text-lg">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* CENA 1 — a primeira imagem sobe para a dobra.
                    Ricardo, 05/08/2026: *"acho que ficou um espaço grande sem
                    nenhuma imagem, portanto gostaria de mover a primeira que
                    está bem abaixo, para onde a seta verde aponta"*. A seta
                    apontava exatamente para cá: entre a grade de números e os
                    "Resultados Garantidos".

                    Medido na página do `openclaw` em produção antes da
                    mudança: as três cenas viviam em y=2726, y=4044 e y=5564 de
                    uma página de ~7000px. Elas existiam, respondiam 200 e
                    ninguém as via — quem decide comprar decide na primeira
                    tela, e a primeira tela era texto e números.

                    As de baixo andaram uma casa (0→1→2); a seção do currículo
                    ficou sem figura de propósito, porque ela já tem a própria
                    ilustração — a lista de módulos. */}
                <CenaDoCurso slug={slug} indice={0} className="mt-8" />

                {/* Key Outcomes Preview */}
                <div className="mt-8 p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/30">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Target className="text-green-400" size={20} />
                    {t("highlights.guaranteedResults")}
                  </h3>
                  <div className="space-y-3">
                    {(product.copy.benefits.slice(0, 4) || [
                      "Domine ChatGPT do básico ao avançado",
                      "Automatize tarefas e economize tempo",
                      "Crie conteúdo profissional com IA",
                      "Aumente sua produtividade em 10x"
                    ]).map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="text-green-400" size={14} />
                        </div>
                        <span className="text-muted-foreground text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Who Is This For */}
                <div className="mt-8 p-6 bg-secondary/50 rounded-xl border border-border">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users className="text-amber-400" size={20} />
                    {t("audience.title")}
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Building2, text: t("audience.professionals") },
                      { icon: User, text: t("audience.entrepreneurs") },
                      { icon: Rocket, text: t("audience.students") },
                      { icon: Brain, text: t("audience.curious") }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <item.icon className="text-amber-400 flex-shrink-0" size={18} />
                        <span className="text-muted-foreground text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* STICKY SIDEBAR - Purchase Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="bg-card/50 backdrop-blur border-2 border-amber-500/50 p-6 shadow-2xl shadow-amber-500/20">
                    {/* A CAPA, na proporção dela.
                        Aqui havia uma caixa `aspect-video` com `object-cover`
                        por cima de uma capa 720×1040: o navegador cortava fora
                        66% da altura e sobrava uma tira do meio do livro — sem
                        título, sem lombada, sem se parecer com um livro. Era a
                        única imagem da página de venda inteira, e era essa.

                        O botão de play saiu junto, e não por gosto: os 25
                        `product.trailer` são animações das capas ANTIGAS, e o
                        título nelas está estropiado — "Open'ehк" no lugar de
                        OpenClaw, "ChateFll Do Zero" no lugar de ChatGPT do Zero
                        (conferido quadro a quadro em 04/08/2026). Chamar aquilo
                        de "Preview Gratuito" ao lado de R$ 79 custa mais caro do
                        que não ter vídeo nenhum. Quem tem loop novo da capa vê o
                        livro respirando aqui mesmo; os outros veem o livro
                        parado, que já é bonito. */}
                    <div className="relative mb-6 mx-auto w-full max-w-[248px]">
                      <CapaDoCurso
                        slug={product.slug}
                        thumbnail={product.thumbnail || product.seo?.ogImage}
                        alt={product.name}
                        modo="auto"
                        eager
                        className="rounded-lg shadow-2xl shadow-black/60 ring-1 ring-amber-500/20"
                      />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur px-3 py-1 rounded-full text-sm whitespace-nowrap">
                        <Clock className="inline mr-1" size={14} />
                        {product.metrics.duration}
                      </div>
                    </div>

                    {/* Launch Price Banner */}
                    {effectiveDiscount > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="text-green-400" size={18} />
                          <span className="font-bold text-green-400">
                            {isFreeCourseOfMonth
                              ? (isPtBr ? 'Curso grátis do mês' : 'Free course of the month')
                              : product.pricing.note
                                ? (isPtBr ? 'Preço simbólico' : 'Symbolic price')
                                : locale === 'pt-BR' ? 'Preço de Lançamento' : 'Launch Price'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isFreeCourseOfMonth
                            ? (isPtBr
                                ? 'Oferta mensal liberada para qualquer usuário logado, com certificado incluso.'
                                : 'Monthly offer unlocked for any logged-in user, including the certificate.')
                            : product.pricing.note
                              ? product.pricing.note
                              : locale === 'pt-BR'
                              ? 'Aproveite o preço especial de lançamento. O valor aumentará em breve.'
                              : 'Take advantage of the special launch price. Price will increase soon.'}
                        </p>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-6">
                      {effectiveOriginalPrice > effectivePrice && (
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-muted-foreground line-through text-2xl">
                            R$ {effectiveOriginalPrice.toLocaleString()}
                          </span>
                          <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                            -{effectiveDiscount}%
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                          R$ {effectivePrice.toLocaleString()}
                        </span>
                      </div>
                      {isFreeCourseOfMonth ? (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
                          {isPtBr
                            ? "Acesso completo liberado neste mês para qualquer usuário logado, com certificado incluído."
                            : "Full access is unlocked this month for any logged-in user, including the certificate."}
                        </div>
                      ) : product.pricing.note ? (
                        // Preço simbólico (ex.: chatgpt-zero R$5): nota honesta no
                        // lugar de parcelamento/economia — 12x de R$0,42 soaria ridículo.
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
                          {product.pricing.note}
                        </div>
                      ) : (
                        <>
                          <p className="text-muted-foreground">
                            {t("sidebar.orInstallments", { installments: 12, value: `R$ ${(product.pricing.price / 12).toFixed(2)}` })}
                          </p>
                          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/50 rounded text-center">
                            <span className="text-green-400 font-bold">
                              {t("sidebar.saveToday", { amount: `R$ ${savings.toLocaleString()}` })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* CTAs */}
                    <div className="space-y-3 mb-6">
                      {/* Link para a prévia. Vale duas coisas ao mesmo tempo:
                          converte quem quer ler antes de pagar, e é o link
                          interno que aponta autoridade para a única URL do
                          curso com conteúdo de profundidade indexável. */}
                      <Link
                        href={`/${locale}/curso/${slug}/previa`}
                        className="block w-full rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-center text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                      >
                        {isPtBr
                          ? "Ler um capítulo inteiro de graça →"
                          : "Read a full chapter for free →"}
                      </Link>

                      <Button
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold py-6 text-lg shadow-lg shadow-amber-500/50"
                        size="lg"
                        onClick={handlePrimaryCourseAction}
                      >
                        {jaTemOCurso ? <PlayCircle className="mr-2" size={20} /> : isFreeCourseOfMonth ? <Gift className="mr-2" size={20} /> : <ShoppingCart className="mr-2" size={20} />}
                        {jaTemOCurso
                          ? (isPtBr ? "Ler agora" : "Read now")
                          : isFreeCourseOfMonth
                            ? (isPtBr ? "Liberar grátis" : "Unlock free")
                            : t("sidebar.buyNow")}
                      </Button>

                      {!isFreeCourseOfMonth && !jaTemOCurso && (
                        <Button
                          variant="outline"
                          className="w-full border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                          size="lg"
                          onClick={handleSecondaryCourseAction}
                        >
                          {t("sidebar.addToCart")}
                        </Button>
                      )}
                    </div>

                    {/* What's Included */}
                    <div className="space-y-3 mb-6">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                          <BadgeCheck size={15} />
                          <span>{isPtBr ? 'Atualizado para o cenário atual' : 'Updated for the current landscape'}</span>
                        </div>
                        {/* O canon de modelos saiu daqui em 03/08/2026 — ver o
                            bloco de verificação mais acima. Anunciar quais
                            modelos são "o canon" data o curso na hora em que o
                            próximo modelo sai. */}
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {isPtBr
                            ? `Escrito a partir das fontes oficiais de cada ferramenta. Conteúdo revisado em ${atualizadoEm}.`
                            : `Written from each tool's official sources. Content revised on ${atualizadoEm}.`}
                        </p>
                      </div>

                      <h3 className="font-bold text-sm uppercase text-muted-foreground mb-3">
                        {t("sidebar.courseIncludes")}
                      </h3>
                      {[
                        t("sidebar.lessons", { count: product.metrics.lessons }),
                        t("sidebar.content", { duration: product.metrics.duration }),
                        t("sidebar.lifetimeAccess"),
                        t("sidebar.completionCertificate"),
                        t("sidebar.freeUpdates"),
                        t("sidebar.directSupport"),
                        t("sidebar.practicalProjects"),
                        t("sidebar.exclusiveCommunity")
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="text-green-400 flex-shrink-0" size={16} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Guarantee Badge */}
                    <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border-2 border-green-500/50 text-center">
                      <Shield className="mx-auto mb-2 text-green-400" size={32} />
                      <div className="font-bold text-green-400 mb-1">
                        {t("sidebar.guarantee", { days: 7 })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("sidebar.guaranteeText")}
                      </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BadgeCheck size={14} />
                        <span>{t("sidebar.securePurchase")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock size={14} />
                        <span>{t("sidebar.protectedData")}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VÍDEO DE ABERTURA — logo depois do herói, e por quê.
            É o primeiro respiro da página: sai do bloco de preço e prova, e
            mostra o assunto em movimento antes de pedir mais leitura. Some
            sozinho nos cursos que ainda não têm vídeo. */}
        <VideoIntroCurso
          slug={slug}
          titulo={product.name}
          chamada={product.copy?.shortDescription}
        />

        {/* PROBLEM AGITATION SECTION */}
        <section className="py-16 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                {t.rich("problems.title", {
                  red: (chunks) => <span className="text-red-400">{chunks}</span>,
                })}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {(t.raw("problems.items") as string[]).map((problem: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-500/30 rounded-lg"
                  >
                    <X className="text-red-400 flex-shrink-0 mt-1" size={20} />
                    <p className="text-muted-foreground">{problem}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-2xl border-2 border-amber-500/50 text-center">
                <p className="text-2xl font-bold mb-4">
                  {t("problems.identify")}
                </p>
                <p className="text-xl text-amber-400">
                  {t("problems.madeForYou")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSFORMATION SECTION */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t.rich("transformation.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
            </div>

            {/* Cena 2 — o "depois", antes da lista que o descreve em palavras.
                (Era a cena 1 até 05/08; ela subiu para o herói.) */}
            <CenaDoCurso slug={slug} indice={1} className="mb-12" />

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="p-8 bg-secondary/50 border-2 border-border rounded-2xl">
                  <div className="text-center mb-6">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                      {t("transformation.before")}
                    </Badge>
                  </div>
                  <ul className="space-y-4">
                    {(t.raw("transformation.beforeItems") as string[]).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <X className="text-red-400 flex-shrink-0 mt-1" size={20} />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* After */}
                <div className="p-8 bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border-2 border-amber-500 rounded-2xl">
                  <div className="text-center mb-6">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      {t("transformation.after")}
                    </Badge>
                  </div>
                  <ul className="space-y-4">
                    {(t.raw("transformation.afterItems") as string[]).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="text-green-400 flex-shrink-0 mt-1" size={20} />
                        <span className="text-white font-semibold">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Transformation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {[
                  { value: `${product.metrics.lessons}`, label: locale === 'pt-BR' ? 'Aulas Práticas' : 'Practical Lessons' },
                  { value: product.metrics.duration, label: locale === 'pt-BR' ? 'De Conteúdo' : 'Of Content' },
                  { value: `${product.curriculum?.moduleCount || 10}`, label: locale === 'pt-BR' ? 'Módulos Completos' : 'Complete Modules' },
                  { value: locale === 'pt-BR' ? '7 dias' : '7 days', label: locale === 'pt-BR' ? 'Garantia Total' : 'Full Guarantee' }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-6 bg-black/50 rounded-lg border border-amber-500/30">
                    <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU'LL LEARN */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                {t.rich("whatYouLearn.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t("whatYouLearn.subtitle")}
              </p>

              {/* Cena 3 — a habilidade em uso, no meio da lista do que se
                  aprende. É a cena que mais trabalha: a lista é abstrata e a
                  imagem é a única coisa concreta desta seção. */}
              <CenaDoCurso slug={slug} indice={2} className="mb-12" />

              <div className="grid md:grid-cols-2 gap-6">
                {product.copy.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 rounded-lg border border-amber-500/30 hover:border-amber-500 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-1">{benefit}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                {/* `whitespace-normal` e o padding menor no celular não são
                    enfeite: o `Button` nasce com `whitespace-nowrap`, e "Sim,
                    Quero Dominar Tudo Isso Agora" numa linha só media 378px num
                    aparelho de 375. Como o botão não cabia, o DOCUMENTO INTEIRO
                    passava a ter 394px de largura — e aí tudo que é `w-full`
                    (o cabeçalho, a barra fixa de baixo) esticava junto e
                    aparecia cortado ao rolar. Um botão empurrava a página toda. */}
                <Button
                  className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold px-6 sm:px-12 py-6 text-base sm:text-lg whitespace-normal max-w-full h-auto"
                  size="lg"
                  onClick={handlePrimaryCourseAction}
                >
                  {t("whatYouLearn.cta")}
                  <ArrowRight className="ml-2" size={20} />
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  {t("whatYouLearn.ctaSubtext")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CURRICULUM SECTION */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                {t.rich("curriculum.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t("curriculum.subtitle")}
              </p>

              {/* ⚠️ Sem cena aqui desde 05/08. As três subiram uma casa quando a
                  primeira foi para o herói, e esta seção é a que menos sente:
                  a lista de módulos JÁ é a ilustração do currículo — cada
                  módulo aberto mostra o que tem dentro. Repetir uma quarta
                  imagem antes dela empurraria a lista para baixo da dobra. */}

              <div className="space-y-6">
                {product.curriculum.modules.map((module) => (
                  <div key={module.id} className="border border-amber-500/30 rounded-lg overflow-hidden bg-card/80">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-amber-500/10 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xl font-semibold">{module.title}</span>
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                          {module.lessons} {t("curriculum.lessons")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{module.duration}</span>
                        {expandedModules.includes(module.id) ? (
                          <ChevronUp size={20} className="text-amber-400" />
                        ) : (
                          <ChevronDown size={20} className="text-amber-400" />
                        )}
                      </div>
                    </button>

                    {expandedModules.includes(module.id) && (
                      <div className="border-t border-amber-500/20 p-6 text-left">
                        <p className="text-muted-foreground mb-4">{module.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-2xl border-2 border-amber-500/50">
                <h3 className="text-2xl font-bold mb-4 text-amber-400">{t("curriculum.modules", { count: product.curriculum.moduleCount, lessons: product.metrics.lessons })}</h3>
                <p className="text-muted-foreground">{t("curriculum.stepByStep")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BONUSES SECTION */}
        <section className="py-16 bg-gradient-to-b from-black to-amber-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                {t.rich("bonuses.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t("bonuses.subtitle")}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {product.bonuses.map((bonus, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 rounded-lg border border-amber-500/30 hover:border-amber-500 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                      <Gift className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-1">{bonus.title}</p>
                      <p className="text-muted-foreground mb-2">{t("bonuses.value", { currency: "R$", amount: bonus.value.toLocaleString() })}</p>
                      <p className="text-muted-foreground text-sm">{bonus.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 text-center p-8 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 rounded-2xl border-2 border-amber-500/60">
                <h3 className="text-3xl font-bold mb-2 text-amber-400">{t("bonuses.totalValue", { currency: "R$", amount: totalBonusValue.toLocaleString() })}</h3>
                <p className="text-muted-foreground">{t("bonuses.includedFree")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION - Only show if testimonials exist */}
        {product.testimonials && product.testimonials.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                {t.rich("testimonials.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t("testimonials.subtitle")}
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {product.testimonials.map((testimonial, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-secondary/50 rounded-lg border border-border hover:border-amber-500 transition-all"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mr-3">
                        <span className="font-bold text-white">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}{testimonial.company && `, ${testimonial.company}`}</p>
                      </div>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="text-yellow-400 fill-yellow-400 mr-1" size={16} />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-3 italic">&ldquo;{testimonial.comment}&rdquo;</p>
                    <p className="text-amber-400 text-sm font-semibold">{testimonial.impact}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* FAQ SECTION */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                {t.rich("faq.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t("faq.subtitle")}
              </p>

              <div className="space-y-4">
                {(t.raw("faq.items") as Array<{question: string; answer: string}>).map((faq, i) => (
                  <div key={i} className="border border-amber-500/30 rounded-lg overflow-hidden bg-card/50">
                    <button
                      onClick={() => toggleFaq(i)}
                      className="w-full flex items-center justify-between p-6 hover:bg-amber-500/10 transition text-left"
                    >
                      <span className="font-semibold text-lg pr-4">{faq.question}</span>
                      {expandedFaqs.includes(i) ? (
                        <ChevronUp size={20} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-amber-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedFaqs.includes(i) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-amber-500/20"
                        >
                          <p className="p-6 text-muted-foreground">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-20 bg-gradient-to-b from-amber-900/30 to-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black mb-6 text-lg px-6 py-2">
                <Sparkles className="mr-2" size={18} />
                {t("finalCta.badge")}
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t.rich("finalCta.title", {
                  highlight: (chunks) => <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{chunks}</span>,
                })}
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("finalCta.subtitle", { students: product.metrics.students.toLocaleString() })}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold px-12 py-6 text-lg shadow-lg shadow-amber-500/50"
                  size="lg"
                  onClick={handlePrimaryCourseAction}
                >
                  {isFreeCourseOfMonth ? <Gift className="mr-2" size={20} /> : <ShoppingCart className="mr-2" size={20} />}
                  {isFreeCourseOfMonth
                    ? (isPtBr ? "Liberar curso grátis do mês" : "Unlock free course of the month")
                    : t("finalCta.enrollNow", { currency: "R$", price: product.pricing.price.toLocaleString() })}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-400" size={18} />
                  <span>{t("finalCta.guarantee", { days: 30 })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="text-amber-400" size={18} />
                  <span>{t("finalCta.securePayment")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-400" size={18} />
                  <span>{t("finalCta.immediateAccess")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FLOATING MOBILE CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/95 backdrop-blur border-t border-amber-500/50 p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* Preço nenhum para quem já paga: no celular esta barra fica
                colada na faixa "você já paga por este curso", e um valor em
                âmbar ao lado dela é a contradição em dois dedos de tela. */}
            {jaTemOCurso ? (
              <div className="text-sm font-bold text-amber-400">
                {isPtBr ? "Incluído no seu plano" : "Included in your plan"}
              </div>
            ) : (
              <>
                {effectiveOriginalPrice > effectivePrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground line-through text-sm">R$ {effectiveOriginalPrice.toLocaleString()}</span>
                    <Badge className="bg-red-500 text-white text-xs">-{effectiveDiscount}%</Badge>
                  </div>
                )}
                <div className="text-xl font-bold text-amber-400">R$ {effectivePrice.toLocaleString()}</div>
              </>
            )}
          </div>
          <Button
            className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold px-6"
            onClick={handlePrimaryCourseAction}
          >
            {jaTemOCurso ? <PlayCircle className="mr-2" size={18} /> : isFreeCourseOfMonth ? <Gift className="mr-2" size={18} /> : <ShoppingCart className="mr-2" size={18} />}
            {jaTemOCurso
              ? (isPtBr ? "Ler agora" : "Read now")
              : isFreeCourseOfMonth
                ? (isPtBr ? "Liberar grátis" : "Unlock free")
                : t("mobileCta.buy")}
          </Button>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  PlayCircle, CheckCircle, ArrowRight, BookOpen, Clock, Award,
  Sparkles, Brain, Zap, Target, ChevronDown, ChevronUp, MessageCircle
} from "lucide-react";

const FREE_LESSONS = [
  {
    id: 1,
    title: "O que é IA Generativa e Por Que Você Precisa Aprender",
    titleEn: "What is Generative AI and Why You Need to Learn It",
    duration: "12 min",
    description: "Entenda o que está por trás do ChatGPT, como funciona um LLM e por que dominar IA é a habilidade mais valiosa de 2025.",
    descriptionEn: "Understand what's behind ChatGPT, how an LLM works and why mastering AI is the most valuable skill of 2025.",
    topics: [
      "O que são Large Language Models (LLMs)",
      "Como o ChatGPT realmente funciona (simplificado)",
      "Por que IA não vai substituir você — mas alguém que usa IA vai",
      "5 áreas onde IA já está gerando resultados reais",
      "O mercado de trabalho e as oportunidades com IA"
    ],
    topicsEn: [
      "What are Large Language Models (LLMs)",
      "How ChatGPT really works (simplified)",
      "Why AI won't replace you — but someone using AI will",
      "5 areas where AI is already generating real results",
      "The job market and opportunities with AI"
    ],
  },
  {
    id: 2,
    title: "Seu Primeiro Prompt Profissional: A Fórmula que Funciona",
    titleEn: "Your First Professional Prompt: The Formula That Works",
    duration: "15 min",
    description: "Aprenda a fórmula CRIE para criar prompts que geram resultados profissionais toda vez. Saia desta aula já aplicando.",
    descriptionEn: "Learn the CRIE formula for creating prompts that generate professional results every time. Leave this lesson already applying it.",
    topics: [
      "Por que 90% das pessoas usam ChatGPT errado",
      "A Fórmula CRIE: Contexto, Resultado, Instrução, Exemplo",
      "Exercício prático: transforme um prompt ruim em excelente",
      "3 templates prontos para usar hoje",
      "Antes vs Depois: resultados reais de bons prompts"
    ],
    topicsEn: [
      "Why 90% of people use ChatGPT wrong",
      "The CRIE Formula: Context, Result, Instruction, Example",
      "Hands-on: transform a bad prompt into an excellent one",
      "3 ready-to-use templates for today",
      "Before vs After: real results from good prompts"
    ],
  },
  {
    id: 3,
    title: "Automatize Sua Primeira Tarefa com IA em 10 Minutos",
    titleEn: "Automate Your First Task with AI in 10 Minutes",
    duration: "10 min",
    description: "Veja na prática como automatizar uma tarefa real do seu dia a dia usando ChatGPT. Resultado imediato, sem programação.",
    descriptionEn: "See in practice how to automate a real daily task using ChatGPT. Immediate results, no programming.",
    topics: [
      "Identificando tarefas automatizáveis no seu dia",
      "Demonstração ao vivo: automatizando resumo de emails",
      "Como criar um assistente pessoal com Custom Instructions",
      "Economize 5+ horas por semana com estas 3 automações",
      "Próximos passos: o caminho para dominar IA"
    ],
    topicsEn: [
      "Identifying automatable tasks in your day",
      "Live demo: automating email summaries",
      "How to create a personal assistant with Custom Instructions",
      "Save 5+ hours per week with these 3 automations",
      "Next steps: the path to mastering AI"
    ],
  },
];

export default function FreeClassPage() {
  const locale = useLocale();
  const isPtBr = locale === "pt-BR";
  const [expandedLesson, setExpandedLesson] = useState<number>(1);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm">
              <Sparkles className="mr-2 inline" size={14} />
              {isPtBr ? "100% Gratuito — Sem Cadastro" : "100% Free — No Signup Required"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {isPtBr 
                  ? "Mini-Curso Grátis: IA na Prática" 
                  : "Free Mini-Course: AI in Practice"}
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {isPtBr
                ? "3 aulas práticas para você começar a usar Inteligência Artificial hoje. Sem enrolação, sem teoria excessiva — resultados reais em 37 minutos."
                : "3 practical lessons to start using Artificial Intelligence today. No fluff, no excessive theory — real results in 37 minutes."}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <span>37 {isPtBr ? "minutos" : "minutes"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <span>3 {isPtBr ? "aulas práticas" : "practical lessons"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-purple-400" />
                <span>{isPtBr ? "Templates inclusos" : "Templates included"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Lessons */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {FREE_LESSONS.map((lesson) => {
              const isExpanded = expandedLesson === lesson.id;
              const title = isPtBr ? lesson.title : lesson.titleEn;
              const desc = isPtBr ? lesson.description : lesson.descriptionEn;
              const topics = isPtBr ? lesson.topics : lesson.topicsEn;
              
              return (
                <Card 
                  key={lesson.id}
                  className={`bg-gray-900/50 border transition-all ${
                    isExpanded 
                      ? "border-purple-500/50 shadow-lg shadow-purple-500/10" 
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <button
                    onClick={() => setExpandedLesson(isExpanded ? 0 : lesson.id)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isExpanded 
                          ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                          : "bg-gray-800"
                      }`}>
                        <PlayCircle size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {isPtBr ? `Aula ${lesson.id}` : `Lesson ${lesson.id}`}
                          </Badge>
                          <span className="text-xs text-gray-500">{lesson.duration}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                        <p className="text-sm text-gray-400">{desc}</p>
                      </div>
                      <div className="flex-shrink-0 text-gray-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-800 pt-4">
                      <h4 className="text-sm font-semibold text-purple-400 mb-3">
                        {isPtBr ? "O que você vai aprender:" : "What you'll learn:"}
                      </h4>
                      <ul className="space-y-2 mb-6">
                        {topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                      <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                        <p className="text-sm text-gray-300">
                          <Brain className="inline mr-2 text-purple-400" size={16} />
                          {isPtBr 
                            ? "O conteúdo completo desta aula está disponível no curso completo. Estas são as habilidades práticas que você vai dominar."
                            : "The full content of this lesson is available in the complete course. These are the practical skills you'll master."}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* What you'll be able to do */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/30 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isPtBr 
                  ? "Depois dessas 3 aulas, você vai saber:" 
                  : "After these 3 lessons, you'll know:"}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Brain, text: isPtBr ? "Como a IA generativa funciona de verdade" : "How generative AI really works" },
                  { icon: Target, text: isPtBr ? "Criar prompts profissionais que funcionam" : "Create professional prompts that work" },
                  { icon: Zap, text: isPtBr ? "Automatizar tarefas do seu dia a dia" : "Automate your daily tasks" },
                  { icon: Sparkles, text: isPtBr ? "Qual o próximo passo para dominar IA" : "What's next to master AI" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <item.icon className="text-purple-400 flex-shrink-0" size={20} />
                    <span className="text-gray-200 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* CTA - Go to full course */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gray-900/50 border-gray-800 p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-4">
                {isPtBr 
                  ? "Quer dominar IA de verdade?" 
                  : "Want to truly master AI?"}
              </h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                {isPtBr
                  ? "O mini-curso gratuito é apenas o começo. No curso completo, você domina ChatGPT, automação, criação de conteúdo e muito mais — com projetos práticos e suporte direto."
                  : "The free mini-course is just the beginning. In the full course, you master ChatGPT, automation, content creation and more — with practical projects and direct support."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cursos">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg">
                    {isPtBr ? "Ver Cursos Completos" : "See Full Courses"}
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link href="https://wa.me/5521971908530">
                  <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-6 text-lg">
                    <MessageCircle className="mr-2" size={20} />
                    {isPtBr ? "Falar no WhatsApp" : "Chat on WhatsApp"}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
